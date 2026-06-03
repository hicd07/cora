import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_MAPS_API_KEY_ENV = Deno.env.get('GOOGLE_MAPS_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { input, sessionToken } = await req.json()
    
    if (!input) {
      return new Response(JSON.stringify({ predictions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Intentar obtener la API Key de la tabla admin_settings si no está en ENV
    let apiKey = GOOGLE_MAPS_API_KEY_ENV;
    if (!apiKey) {
      const { data: secretSetting } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'GOOGLE_MAPS_API_KEY')
        .maybeSingle();
      
      if (secretSetting?.value) {
        apiKey = secretSetting.value;
      } else {
        // Fallback para llave legacy si existe
        const { data: legacySetting } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'GOOGLE_MAPS_SECRET_KEY')
          .maybeSingle();
        apiKey = legacySetting?.value;
      }
    }

    if (!apiKey) {
      console.error("[address-autocomplete] GOOGLE_MAPS_API_KEY no configurada");
      return new Response(JSON.stringify({ error: "Configuración incompleta: Falta API Key de Google Maps" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log("[address-autocomplete] Buscando:", input);

    // Usamos el API de Autocomplete (New v1) para aprovechar Field Masking
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input,
        sessionToken,
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Error en Google Autocomplete API");
    }

    // Mapeamos al formato que espera el frontend
    const predictions = (data.suggestions || []).map((s: any) => ({
      place_id: s.placePrediction?.placeId,
      description: s.placePrediction?.text?.text,
      main_text: s.placePrediction?.structuredFormat?.mainText?.text,
      secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text,
    }));

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[address-autocomplete] Error:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
