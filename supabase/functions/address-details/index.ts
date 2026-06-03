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
    const { placeId } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')

    if (!apiKey) {
      throw new Error('Google Maps API Key not configured')
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,location,addressComponents,internationalPhoneNumber,websiteUri&key=${apiKey}`)
    
    const data = await response.json()

    const result = {
      id: data.id,
      name: data.displayName?.text,
      formattedAddress: data.formattedAddress,
      location: data.location,
      addressComponents: data.addressComponents,
      phone: data.internationalPhoneNumber || null,
      website: data.websiteUri || null
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error: any) {
    console.error("[address-details] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})