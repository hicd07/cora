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

    const { conversationId, text } = await req.json()
    console.log("[parse-message] Processing text for conversation:", conversationId)

    // 1. Get conversation and external store details
    const { data: conv, error: convError } = await supabaseClient
      .from('wa_conversations')
      .select(`
        id,
        bid_request_id,
        external_store_id,
        wa_phone_number,
        external_stores (
          name,
          address,
          phone_e164,
          lat,
          lng
        )
      `)
      .eq('id', conversationId)
      .single()

    if (convError || !conv) throw new Error("Conversation not found")

    // 2. Mocking AI logic for now - in production this would call Gemma/OpenAI
    // We assume the AI returns a structured offer
    const store = conv.external_stores as any;
    
    // We try to extract a price from the text if it's a simple number response
    const priceMatch = text.match(/(\d+(?:\.\d+)?)/);
    const estimatedPrice = priceMatch ? parseFloat(priceMatch[0]) : 0;

    // 3. Create the bid with store metadata
    const { data: bid, error: bidError } = await supabaseClient
      .from('hardware_bids')
      .insert({
        request_id: conv.bid_request_id,
        store_name: store?.name || "Proveedor Externo",
        address: store?.address || null,
        lat: store?.lat || null,
        lng: store?.lng || null,
        phone: store?.phone_e164 || conv.wa_phone_number,
        delivery_time: "24-48 horas", // Default estimated time
        shipping_cost: 0
      })
      .select()
      .single()

    if (bidError) throw bidError

    // 4. Create a generic offer for the first item (or all items if AI was active)
    const { data: items } = await supabaseClient
      .from('bid_request_items')
      .select('name')
      .eq('request_id', conv.bid_request_id)

    if (items && items.length > 0) {
      const offersToInsert = items.map(item => ({
        bid_id: bid.id,
        item_name: item.name,
        unit_price: estimatedPrice / items.length, // Rough split if single price given
        is_available: true
      }))

      await supabaseClient.from('bid_offers').insert(offersToInsert)
    }

    return new Response(
      JSON.stringify({ success: true, bidId: bid.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("[parse-message] Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})