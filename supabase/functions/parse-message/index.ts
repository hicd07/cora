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

  // Basic internal auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  try {
    const { conversationId, messageText } = await req.json();

    if (!conversationId || !messageText) {
      return new Response("Missing required fields", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.warn("[parse-message] OPENAI_API_KEY not set. AI parsing skipped.");
      return new Response("Missing OPENAI_API_KEY", { status: 500, headers: corsHeaders });
    }

    console.log(`[parse-message] Parsing message for conversation ${conversationId}`);

    // Fetch conversation details including requested items
    const { data: conversation, error: convError } = await supabase
      .from("wa_conversations")
      .select(`
        id,
        state,
        wa_phone_number,
        bid_request_id,
        external_store_id,
        external_stores ( name ),
        bid_requests (
          title,
          owner_user_id,
          bid_request_items ( name, quantity, unit )
        )
      `)
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      console.error("[parse-message] Failed to fetch conversation:", convError);
      return new Response("Conversation not found", { status: 404, headers: corsHeaders });
    }

    const itemsRequested = conversation.bid_requests?.bid_request_items || [];
    const itemsListText = itemsRequested
      .map((item: any) => `- ${item.quantity} ${item.unit} de ${item.name}`)
      .join("\n");

    const systemPrompt = `You are an AI assistant for a construction materials marketplace (CoRa).
Your task is to parse an incoming WhatsApp message from a hardware store supplier and determine their intent.
The engineer has requested the following items:
${itemsListText}

Analyze the supplier's message and output a JSON object exactly matching this structure:
{
  "intent": "quote" | "friction" | "irrelevant",
  "confidence_score": 0.0 to 1.0 (float representing how confident you are in this extraction),
  "friction_reason": "Provide a short reason if intent is friction (e.g., 'Requested human', 'Confused', 'Out of stock of everything', 'Low confidence')",
  "delivery_time": "Extract delivery time if mentioned (e.g., 'Hoy mismo', 'En 2 dias'), otherwise null",
  "items": [
    {
      "item_name": "Name of the requested item this price applies to",
      "unit_price": numeric price (e.g., 5.50),
      "is_available": boolean
    }
  ]
}

Rules:
- If they are quoting prices for any of the items clearly, intent is "quote" and confidence should be high.
- If they express confusion, ask to speak to a human, or if the message is too ambiguous to parse correctly, intent is "friction" (or lower the confidence_score).
- If the message has nothing to do with quoting or the business, intent is "irrelevant".
- For items, only include those they explicitly quote or mention. If they say "No tengo X", mark is_available: false and unit_price: 0.
- Only output valid JSON without any markdown formatting wrappers.`;

    console.log("[parse-message] Calling OpenAI for message parsing...");
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use gpt-4o-mini as MVP for Gemma 4 / Ollama
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Supplier message: "${messageText}"` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[parse-message] OpenAI API error:", errorText);
      return new Response("AI API Error", { status: 502, headers: corsHeaders });
    }

    const aiData = await aiResponse.json();
    let parsedContent;
    try {
      parsedContent = JSON.parse(aiData.choices[0].message.content);
    } catch (e) {
      console.error("[parse-message] Failed to parse AI response as JSON:", aiData.choices[0].message.content);
      return new Response("Invalid AI response", { status: 500, headers: corsHeaders });
    }

    console.log("[parse-message] Parsed result:", JSON.stringify(parsedContent, null, 2));

    const isFriction = parsedContent.intent === "friction" || (parsedContent.confidence_score !== undefined && parsedContent.confidence_score < 0.7);

    if (isFriction) {
      console.log("[parse-message] Detected friction or low confidence, escalating to ACTIVE state.");
      await supabase
        .from("wa_conversations")
        .update({ state: "ACTIVE" })
        .eq("id", conversationId);
      
      const engineerId = (conversation.bid_requests as any)?.owner_user_id;
      const storeName = (conversation.external_stores as any)?.name || "Un proveedor";
      
      if (engineerId) {
        await supabase.from("notifications").insert({
          user_id: engineerId,
          type: "human_escalation",
          title: "Intervención requerida en WhatsApp",
          message: `${storeName} requiere atención manual o ha enviado un mensaje que la IA no pudo procesar con certeza.`,
          entity_type: "bid_request",
          entity_id: conversation.bid_request_id,
          metadata: {
            conversation_id: conversationId,
            reason: parsedContent.friction_reason || "Low confidence"
          }
        });
      }
      
      return new Response(JSON.stringify({ action: "escalated", reason: parsedContent.friction_reason || "Low confidence" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (parsedContent.intent === "quote") {
      console.log("[parse-message] Detected quote, inserting bid...");
      
      const externalStoreName = (conversation.external_stores as any)?.name || "Ferretería externa";
      
      const { data: newBid, error: bidError } = await supabase
        .from("hardware_bids")
        .insert({
          request_id: conversation.bid_request_id,
          store_name: externalStoreName,
          delivery_time: parsedContent.delivery_time || "A coordinar",
          // bidder_user_id is left null for external Whatsapp bids
        })
        .select("id")
        .single();

      if (bidError || !newBid) {
        console.error("[parse-message] Error inserting bid:", bidError);
        return new Response("Error inserting bid", { status: 500, headers: corsHeaders });
      }

      if (parsedContent.items && parsedContent.items.length > 0) {
        const offersToInsert = parsedContent.items.map((item: any) => ({
          bid_id: newBid.id,
          item_name: item.item_name,
          unit_price: item.unit_price,
          is_available: item.is_available
        }));

        const { error: offersError } = await supabase
          .from("bid_offers")
          .insert(offersToInsert);

        if (offersError) {
          console.error("[parse-message] Error inserting bid offers:", offersError);
        }
      }

      return new Response(JSON.stringify({ action: "quote_created", bid_id: newBid.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ action: "ignored", intent: parsedContent.intent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("[parse-message] Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});