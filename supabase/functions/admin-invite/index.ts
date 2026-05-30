import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, getServiceClient, requireAdmin, sendEmail } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const service = getServiceClient();
    const admin = await requireAdmin(req, service);
    if (!admin) {
      return json({ error: "Forbidden: admin role required" }, 403);
    }

    const { email, role } = await req.json();
    if (!email) return json({ error: "Missing email" }, 400);

    const inviteRole = role || "user";
    console.log(`[admin-invite] Inviting ${email} as ${inviteRole}`);

    // Record the invitation
    const { error: insertError } = await service.from("admin_invitations").insert({
      email,
      role: inviteRole,
      status: "pending",
      invited_by: admin.id,
    });
    if (insertError) throw insertError;

    // Try to send the official Supabase invite email (creates the user when accepted).
    const redirectTo = `${Deno.env.get("APP_URL") || "https://app.cora"}/auth`;
    const { error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { invited_role: inviteRole },
    });

    // If Supabase invite fails (e.g. user already exists), fall back to a Resend notice.
    if (inviteError) {
      console.warn("[admin-invite] Supabase invite failed, sending fallback email:", inviteError.message);
      await sendEmail({
        to: email,
        subject: "Has sido invitado a CORA",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
            <h2 style="color:#4f46e5;">Invitación a CORA</h2>
            <p>Has sido invitado a unirte a CORA con el rol <strong>${inviteRole}</strong>.</p>
            <p>Ingresa o crea tu cuenta con este correo (${email}) para activar tu acceso.</p>
            <a href="${redirectTo}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:12px;">Acceder a CORA</a>
          </div>
        `,
      });
    }

    return json({ ok: true });
  } catch (error) {
    console.error("[admin-invite] Error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
