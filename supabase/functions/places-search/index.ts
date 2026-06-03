import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { lat, lng, radiusKm = 5 } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')

    if (!apiKey) {
      throw new Error('Google Maps API Key not configured')
    }

    const radiusMeters = radiusKm * 1000

    // Nueva API de Google Places (v1)
    // Agregamos internationalPhoneNumber y websiteUri a la máscara de campos
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id,places.internationalPhoneNumber,places.websiteUri'
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters
          }
        },
        includedTypes: ["hardware_store"]
      })
    })

    const data = await response.json()
    const places = data.places || []

    const results = places.map((p: any) => ({
      id: p.id,
      name: p.displayName?.text || "Ferretería sin nombre",
      address: p.formattedAddress,
      lat: p.location.latitude,
      lng: p.location.longitude,
      phone: p.internationalPhoneNumber || null,
      website: p.websiteUri || null
    }))

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error: any) {
    console.error("[places-search] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})