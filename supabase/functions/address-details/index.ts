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
    const { placeId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')

    if (!apiKey) {
      const { data: setting } = await supabaseClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'GOOGLE_MAPS_API_KEY')
        .maybeSingle()
      
      apiKey = setting?.value
    }

    if (!apiKey) {
      throw new Error('Google Maps API Key no configurada')
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,location,addressComponents,internationalPhoneNumber,websiteUri&key=${apiKey}`)
    
    const data = await response.json()

    if (data.error) {
      throw new Error(`Google Maps API Error: ${data.error.message}`)
    }

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