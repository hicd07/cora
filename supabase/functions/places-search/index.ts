import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { lat, lng, radiusKm } = await req.json()
    console.log("[places-search] Iniciando búsqueda", { lat, lng, radiusKm })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Redondeamos para cachear búsquedas similares
    const latRound = lat.toFixed(3)
    const lngRound = lng.toFixed(3)

    // 1. Revisar cache
    const { data: cached } = await supabase
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

    // 2. Si no hay cache, buscamos (Simulado o Google API)
    // En producción aquí llamarías a Google Places API. 
    // Por ahora simularemos la respuesta basándonos en la zona de SDE.
    const mockResults = [
      { name: "Ferretería El Progreso", address: "Av. San Isidro", lat: lat + 0.002, lng: lng - 0.001 },
      { name: "Materiales Ozama", address: "Calle Costa Rica", lat: lat - 0.001, lng: lng + 0.003 },
      { name: "Ferre-Construye SDE", address: "Aut. Las Américas", lat: lat + 0.005, lng: lng + 0.002 }
    ];

    // 3. Guardar en cache
    await supabase.from('places_cache').upsert({
      lat_round: latRound,
      lng_round: lngRound,
      radius_km: radiusKm,
      results: mockResults,
      fetched_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ results: mockResults }), {
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