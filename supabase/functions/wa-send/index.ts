import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bidRequestId } = await req.json();

    if (!bidRequestId) {
      throw new Error("Missing bidRequestId");
    }

    // Get the bid request
    const { data: bidRequest, error: bidError } = await supabase
      .from("bid_requests")
      .select("*")
      .eq("id", bidRequestId)
      .single();

    if (bidError || !bidRequest) {
      throw new Error("Bid request not found");
    }

    // Find external stores in the area using places_cache
    // Note: To be precise, we need to map over external_stores where source = 'google_places'
    // but in a real scenario we'd do a geographic query. For simplicity here we fetch some.
    // In Sprint 3 we created external_stores for nearby places.
    // We assume external_stores already has records.
    // So let's just get the nearest external_stores.
    const { data: stores, error: storesError } = await supabase
      .from("external_stores")
      .select("*")
      .limit(10); // Limit to 10 for broadcasting

    if (storesError) {
      throw new Error("Error fetching external stores");
    }

    // Now for each store, check if conversation exists, if not create and send HSM
    for (const store of stores) {
      if (!store.phone_e164) {
        continue;
      }

      // Check if conversation exists
      let { data: conversation } = await supabase
        .from("wa_conversations")
        .select("id, state")
        .eq("bid_request_id", bidRequestId)
        .eq("external_store_id", store.id)
        .maybeSingle();

      if (!conversation) {
        // Create conversation
        const { data: newConv, error: newConvError } = await supabase
          .from("wa_conversations")
          .insert({
            bid_request_id: bidRequestId,
            external_store_id: store.id,
            wa_phone_number: store.phone_e164,
            state: "HSM_SENT",
          })
          .select("id")
          .single();

        if (newConvError) {
          console.error("[wa-send] Error creating conversation", newConvError);
          continue;
        }
        conversation = newConv;

        // Simulate sending WA HSM
        // Here you would call WhatsApp Cloud API
        // fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, { ... })

        const mockWaMessageId = `wamid.mock.${crypto.randomUUID()}`;

        // Insert outbound message
        await supabase.from("wa_messages").insert({
          conversation_id: conversation.id,
          direction: "outbound",
          content_type: "template",
          body: `Hola, un ingeniero necesita ${bidRequest.category}. ¿Puedes cotizar?`,
          wa_message_id: mockWaMessageId,
          status: "sent",
        });

        console.log(`[wa-send] Sent HSM to ${store.phone_e164} for bid ${bidRequestId}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[wa-send] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
