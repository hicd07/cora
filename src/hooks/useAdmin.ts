import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Generic invoker for the admin-manage edge function. */
async function adminInvoke<T = unknown>(action: string, payload?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-manage", {
    body: { action, payload },
  });
  if (error) {
    // Try to surface the edge function error message
    const message = (data as { error?: string })?.error || error.message;
    throw new Error(message);
  }
  if ((data as { error?: string })?.error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

export interface AdminSetting {
  key: string;
  value: string;
  is_secret: boolean;
  description: string | null;
  updated_at: string;
  has_value?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  onboarded: boolean;
  roles: string[];
  created_at: string;
}

export interface SignupRequest {
  id: string;
  email: string;
  full_name: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

/* ---------- SETTINGS ---------- */
export const useAdminSettings = () =>
  useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await adminInvoke<{ settings: AdminSetting[] }>("list_settings");
      return res.settings;
    },
  });

export const useUpdateSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminInvoke("update_setting", { key, value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-settings"] }),
  });
};

/* ---------- USERS ---------- */
export const useAdminUsers = () =>
  useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await adminInvoke<{ users: AdminUser[] }>("list_users");
      return res.users;
    },
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; password: string; fullName?: string; role?: string }) =>
      adminInvoke("create_user", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useSetUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; role: string; enabled: boolean }) =>
      adminInvoke("set_user_role", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminInvoke("delete_user", { userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

/* ---------- INVITATIONS ---------- */
export const useInviteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-invite", { body: payload });
      if (error) throw new Error((data as { error?: string })?.error || error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-invitations"] }),
  });
};

export const useInvitations = () =>
  useQuery({
    queryKey: ["admin-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

/* ---------- SIGNUP REQUESTS ---------- */
export const useSignupRequests = () =>
  useQuery({
    queryKey: ["admin-signup-requests"],
    queryFn: async () => {
      const res = await adminInvoke<{ requests: SignupRequest[] }>("list_signup_requests");
      return res.requests;
    },
  });

/* ---------- BUSINESS DATA CRUD ---------- */
export const useAdminStores = () =>
  useQuery({
    queryKey: ["admin-stores"],
    queryFn: async () => {
      const res = await adminInvoke<{ stores: any[] }>("list_stores");
      return res.stores;
    },
  });

export const useAdminQuotes = () =>
  useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const res = await adminInvoke<{ quotes: any[] }>("list_quotes");
      return res.quotes;
    },
  });

export const useReviewSignupRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { requestId: string; approve: boolean }) =>
      adminInvoke("review_signup_request", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-signup-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};
