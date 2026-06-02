import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

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

    if (!GOOGLE_MAPS_API_KEY) {
      console.error("[address-autocomplete] GOOGLE_MAPS_API_KEY no configurada");
      return new Response(JSON.stringify({ error: "Configuración incompleta" }), {
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
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({
        input,
        sessionToken,
        // Opcional: restringir a República Dominicana si es necesario
        // locationRestriction: { circle: { center: { latitude: 18.4861, longitude: -69.9312 }, radius: 200000 } }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Error en Google Autocomplete API");
    }

    // Mapeamos al formato que espera el frontend (similar al viejo API para facilidad)
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
