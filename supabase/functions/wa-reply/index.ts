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

    // Get the user from the auth token to verify identity
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { conversationId, body } = await req.json();

    if (!conversationId || !body) {
      throw new Error("Missing conversationId or body");
    }

    // Verify conversation
    const { data: conversation, error: convError } = await supabase
      .from("wa_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error("Conversation not found");
    }

    // In a real implementation:
    // Call WhatsApp Cloud API to send a free-form message
    // const waResponse = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, ...)
    // const waMessageId = waResponse.messages[0].id;
    const waMessageId = `wamid.mock.${crypto.randomUUID()}`;

    // Insert message into DB
    const { error: insertError } = await supabase
      .from("wa_messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        content_type: "text",
        body,
        wa_message_id: waMessageId,
        status: "sent",
      });

    if (insertError) throw insertError;

    // Update conversation state to ACTIVE (manual control override)
    if (conversation.state !== "ACTIVE") {
      await supabase
        .from("wa_conversations")
        .update({ state: "ACTIVE" })
        .eq("id", conversationId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[wa-reply] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
