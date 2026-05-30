import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function getServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Verifies that the request comes from an authenticated admin user.
 * Returns the user object if valid, otherwise null.
 */
export async function requireAdmin(
  req: Request,
  service: SupabaseClient,
): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await service.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: roleData } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) return null;

  return { id: userData.user.id, email: userData.user.email ?? "" };
}

/**
 * Sends an email using Resend. Requires RESEND_API_KEY secret.
 * Falls back to logging when the key is not configured (MVP-friendly).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("RESEND_FROM") || "CORA <onboarding@resend.dev>";

  if (!resendKey) {
    console.warn("[email] RESEND_API_KEY not set. Email skipped (logged only).", {
      to: opts.to,
      subject: opts.subject,
    });
    return { ok: true, skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[email] Resend error:", errorText);
    return { ok: false, error: errorText };
  }

  return { ok: true };
}
