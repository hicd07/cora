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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      requestId, 
      storeName, 
      phone, 
      website, 
      address, 
      lat, 
      lng, 
      deliveryTime, 
      shippingCost, 
      items, 
      externalStoreId 
    } = await req.json()

    console.log("[admin-manual-bid] Creating manual bid for request:", requestId, { storeName })

    // Insert the bid record with full store details
    const { data: bid, error: bidError } = await supabaseClient
      .from('hardware_bids')
      .insert({
        request_id: requestId,
        store_name: storeName,
        phone: phone || null,
        website: website || null,
        address: address || null,
        lat: lat || null,
        lng: lng || null,
        delivery_time: deliveryTime,
        shipping_cost: shippingCost || 0,
        is_test: false // Manual admin bids are usually real unless specified
      })
      .select()
      .single()

    if (bidError) throw bidError

    // Insert the offers for each item
    if (items && items.length > 0) {
      const offersToInsert = items.map((item: any) => ({
        bid_id: bid.id,
        item_name: item.item_name,
        unit_price: item.unit_price,
        is_available: item.is_available ?? true
      }))

      const { error: offersError } = await supabaseClient
        .from('bid_offers')
        .insert(offersToInsert)

      if (offersError) throw offersError
    }

    return new Response(
      JSON.stringify({ success: true, bidId: bid.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("[admin-manual-bid] Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})