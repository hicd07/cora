import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  // Webhook verification (GET request)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // In a real app, verify against a secret environment variable
    if (mode === "subscribe" && token === Deno.env.get("WA_WEBHOOK_VERIFY_TOKEN")) {
      return new Response(challenge, { status: 200 });
    } else if (mode) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("Not a webhook verification request", { status: 400 });
  }

  // Webhook event (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[wa-webhook] Received body:", JSON.stringify(body, null, 2));

      // Ensure we have a valid body
      if (body.object !== "whatsapp_business_account") {
        return new Response("Not a WhatsApp webhook", { status: 400 });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages" && change.value.messages) {
            for (const message of change.value.messages) {
              const waPhoneNumber = change.value.contacts?.[0]?.wa_id || message.from;
              const waMessageId = message.id;
              const text = message.text?.body || "";

              // Let's add a `+` because wa_id from WhatsApp usually doesn't have it,
              // but we store it in e164 format. Adjust according to your logic.
              const formattedPhone = waPhoneNumber.startsWith("+")
                ? waPhoneNumber
                : `+${waPhoneNumber}`;

              // Find active conversation for this phone
              const { data: conversation, error: convError } = await supabase
                .from("wa_conversations")
                .select("id, state")
                .eq("wa_phone_number", formattedPhone)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

              if (convError || !conversation) {
                console.warn(`[wa-webhook] No active conversation found for ${formattedPhone}`);
                continue;
              }

              // Insert inbound message
              await supabase.from("wa_messages").insert({
                conversation_id: conversation.id,
                direction: "inbound",
                content_type: message.type || "text",
                body: text,
                wa_message_id: waMessageId,
                status: "received",
              });

              // Update conversation state to REPLIED if it was PENDING or HSM_SENT
              if (["PENDING", "HSM_SENT"].includes(conversation.state)) {
                await supabase
                  .from("wa_conversations")
                  .update({ state: "REPLIED" })
                  .eq("id", conversation.id);
              }

              // Only trigger AI parsing if the conversation is not already actively managed by human
              if (conversation.state !== "ACTIVE") {
                // Trigger AI parsing for this new incoming message
                console.log(`[wa-webhook] Invoking parse-message for ${conversation.id}`);
                // We fire and forget or await it. Awaiting is safer to avoid termination, but edge functions have a 2-second CPU limit.
                // Using Edge Functions `invoke` without await might cancel it.
                // We will await it for now, since Groq/OpenAI should be fast.
                await supabase.functions.invoke("parse-message", {
                  body: {
                    conversationId: conversation.id,
                    messageText: text,
                  },
                });
              }

              console.log(`[wa-webhook] Processed message from ${formattedPhone}`);
            }
          }
        }
      }

      return new Response("OK", { status: 200 });
    } catch (err: any) {
      console.error("[wa-webhook] Error:", err.message);
      return new Response("Error", { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
