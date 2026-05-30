import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, getServiceClient, requireAdmin } from "../_shared/admin.ts";

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
      console.warn("[admin-manage] Unauthorized access attempt");
      return json({ error: "Forbidden: admin role required" }, 403);
    }

    const { action, payload } = await req.json();
    console.log(`[admin-manage] action=${action} by=${admin.email}`);

    switch (action) {
      /* ---------- SETTINGS ---------- */
      case "list_settings": {
        const { data, error } = await service
          .from("admin_settings")
          .select("key, value, is_secret, description, updated_at")
          .order("key");
        if (error) throw error;
        // Mask secret values so the actual key is never returned to the client.
        const masked = (data ?? []).map((s) => ({
          ...s,
          value: s.is_secret ? (s.value ? "••••••••" : "") : s.value,
          has_value: s.is_secret ? Boolean(s.value) : undefined,
        }));
        return json({ settings: masked });
      }

      case "update_setting": {
        const { key, value } = payload as { key: string; value: string };
        if (!key) return json({ error: "Missing key" }, 400);
        const { error } = await service
          .from("admin_settings")
          .update({ value, updated_at: new Date().toISOString(), updated_by: admin.id })
          .eq("key", key);
        if (error) throw error;
        return json({ ok: true });
      }

      /* ---------- USERS ---------- */
      case "list_users": {
        const { data, error } = await service.rpc("admin_list_users");
        if (error) throw error;
        return json({ users: data });
      }

      case "create_user": {
        const { email, password, fullName, role } = payload as {
          email: string;
          password: string;
          fullName?: string;
          role?: string;
        };
        if (!email || !password) return json({ error: "Email and password required" }, 400);

        const { data: created, error: createError } = await service.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName ?? null },
        });
        if (createError) throw createError;

        const newUserId = created.user!.id;

        // Ensure a profile row exists
        await service.from("profiles").upsert(
          { id: newUserId, full_name: fullName ?? null, onboarded: false },
          { onConflict: "id" },
        );

        if (role && role !== "user") {
          await service
            .from("user_roles")
            .insert({ user_id: newUserId, role })
            .select();
        }

        return json({ ok: true, userId: newUserId });
      }

      case "set_user_role": {
        const { userId, role, enabled } = payload as {
          userId: string;
          role: string;
          enabled: boolean;
        };
        if (!userId || !role) return json({ error: "Missing userId or role" }, 400);

        if (enabled) {
          const { error } = await service
            .from("user_roles")
            .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
          if (error) throw error;
        } else {
          const { error } = await service
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", role);
          if (error) throw error;
        }
        return json({ ok: true });
      }

      case "delete_user": {
        const { userId } = payload as { userId: string };
        if (!userId) return json({ error: "Missing userId" }, 400);
        if (userId === admin.id) return json({ error: "No puedes eliminar tu propia cuenta" }, 400);
        const { error } = await service.auth.admin.deleteUser(userId);
        if (error) throw error;
        return json({ ok: true });
      }

      /* ---------- ADMIN SIGNUP REQUESTS ---------- */
      case "list_signup_requests": {
        const { data, error } = await service
          .from("admin_signup_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ requests: data });
      }

      case "review_signup_request": {
        const { requestId, approve } = payload as { requestId: string; approve: boolean };
        if (!requestId) return json({ error: "Missing requestId" }, 400);

        const { data: request, error: fetchError } = await service
          .from("admin_signup_requests")
          .select("*")
          .eq("id", requestId)
          .single();
        if (fetchError || !request) return json({ error: "Solicitud no encontrada" }, 404);

        if (approve) {
          // Create an admin invitation so the role is granted upon signup/login.
          await service.from("admin_invitations").insert({
            email: request.email,
            role: "admin",
            status: "pending",
            invited_by: admin.id,
          });

          // If the user already exists, grant the role immediately.
          const { data: usersList } = await service.auth.admin.listUsers();
          const existing = usersList?.users?.find((u) => u.email === request.email);
          if (existing) {
            await service
              .from("user_roles")
              .upsert({ user_id: existing.id, role: "admin" }, { onConflict: "user_id,role" });
          }
        }

        const { error: updateError } = await service
          .from("admin_signup_requests")
          .update({
            status: approve ? "approved" : "rejected",
            reviewed_by: admin.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", requestId);
        if (updateError) throw updateError;

        return json({ ok: true });
      }

      /* ---------- BUSINESS DATA ---------- */
      case "list_stores": {
        // Union of internal hardware profiles and external stores
        const { data: internal, error: iErr } = await service
          .from("profiles")
          .select("*")
          .eq("user_type", "hardware");
        
        const { data: external, error: eErr } = await service
          .from("external_stores")
          .select("*");
        
        if (iErr || eErr) throw iErr || eErr;

        return json({
          stores: [
            ...(internal ?? []).map(s => ({ ...s, source: 'internal' })),
            ...(external ?? []).map(s => ({ ...s, source: 'external' }))
          ]
        });
      }

      case "list_quotes": {
        const { data, error } = await service
          .from("bid_requests")
          .select(`
            *,
            owner:profiles!bid_requests_owner_user_id_fkey(full_name),
            items:bid_request_items(count)
          `)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return json({ quotes: data });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("[admin-manage] Error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
