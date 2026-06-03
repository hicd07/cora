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
    const { lat, lng, radiusKm = 5 } = await req.json()
    console.log("[places-search] Iniciando búsqueda", { lat, lng, radiusKm })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Intentar obtener la API Key de la tabla admin_settings si no está en ENV
    let apiKey = GOOGLE_MAPS_API_KEY_ENV;
    if (!apiKey) {
      const { data: mainSetting } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'GOOGLE_MAPS_API_KEY')
        .maybeSingle();
      
      if (mainSetting?.value) {
        apiKey = mainSetting.value;
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
      console.error("[places-search] API Key de Google Maps no configurada (ni en ENV ni en admin_settings)");
      return new Response(JSON.stringify({ error: "Configuración incompleta: Falta API Key de Google Maps" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Redondeamos para cachear búsquedas similares
    const latRound = Number(lat).toFixed(3)
    const lngRound = Number(lng).toFixed(3)

    // 1. Revisar cache
    const { data: cached, error: cacheError } = await supabase
      .from('places_cache')
      .select('results')
      .eq('lat_round', latRound)
      .eq('lng_round', lngRound)
      .eq('radius_km', radiusKm)
      .maybeSingle()

    if (cached) {
      console.log("[places-search] Resultados servidos desde cache")
      return new Response(JSON.stringify({ results: cached.results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Si no hay cache, buscamos en Google (API v1 - Search Nearby)
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id'
      },
      body: JSON.stringify({
        includedTypes: ["hardware_store"],
        maxResultCount: 15,
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng
            },
            radius: radiusKm * 1000 // Convertir a metros
          }
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Error en Google Maps API");
    }

    const places = data.places || [];
    const results = places.map((p: any) => ({
      id: p.id,
      name: p.displayName?.text || "Ferretería sin nombre",
      address: p.formattedAddress,
      lat: p.location.latitude,
      lng: p.location.longitude
    }));

    // 3. Guardar en cache
    await supabase.from('places_cache').upsert({
      lat_round: latRound,
      lng_round: lngRound,
      radius_km: radiusKm,
      results: results,
      fetched_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[places-search] Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
