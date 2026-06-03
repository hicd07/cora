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
    const { placeId } = await req.json()
    
    if (!placeId) {
      throw new Error("placeId is required");
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
      console.error("[address-details] GOOGLE_MAPS_API_KEY no configurada");
      return new Response(JSON.stringify({ error: "Configuración incompleta: Falta API Key de Google Maps" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Usamos Place Details (New v1) con Field Masking
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,location,formattedAddress,addressComponents'
      }
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Error en Google Place Details API");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[address-details] Error:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
