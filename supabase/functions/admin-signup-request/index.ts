import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, getServiceClient, sendEmail } from "../_shared/admin.ts";

const SUPER_ADMIN_EMAIL = "hicd07@gmail.com";

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
    const { email, fullName, reason } = await req.json();

    if (!email || !email.includes("@")) {
      return json({ error: "Correo inválido" }, 400);
    }

    console.log(`[admin-signup-request] New admin request from ${email}`);

    const service = getServiceClient();

    const { error: insertError } = await service.from("admin_signup_requests").insert({
      email,
      full_name: fullName ?? null,
      reason: reason ?? null,
      status: "pending",
    });
    if (insertError) throw insertError;

    // Notify the super admin for approval
    const result = await sendEmail({
      to: SUPER_ADMIN_EMAIL,
      subject: "Nueva solicitud de acceso administrador — CORA",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: auto;">
          <h2 style="color:#4f46e5;">Solicitud de administrador</h2>
          <p>Un usuario ha solicitado acceso como administrador en CORA:</p>
          <table style="border-collapse:collapse;margin-top:12px;">
            <tr><td style="padding:6px 12px;font-weight:bold;">Nombre:</td><td style="padding:6px 12px;">${fullName ?? "—"}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;">Correo:</td><td style="padding:6px 12px;">${email}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;">Motivo:</td><td style="padding:6px 12px;">${reason ?? "—"}</td></tr>
          </table>
          <p style="margin-top:16px;color:#64748b;font-size:13px;">
            Aprueba o rechaza esta solicitud desde el backoffice de CORA (Administración → Solicitudes).
          </p>
        </div>
      `,
    });

    console.log(`[admin-signup-request] Email result:`, JSON.stringify(result));

    return json({ ok: true, emailSkipped: result.skipped ?? false });
  } catch (error) {
    console.error("[admin-signup-request] Error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
