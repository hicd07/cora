import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BidRequest } from "@/lib/types";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";
import { useAdminMode } from "@/contexts/AdminModeContext";

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

export interface ExternalStore {
  id: string;
  place_id: string;
  name: string;
  address: string | null;
  phone_e164: string | null;
  lat: number;
  lng: number;
  source: string;
}

/* ---------- SETTINGS ---------- */
export const useAdminSettings = () =>
  useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await adminInvoke<{ settings: AdminSetting[] }>("list_settings");
      return res.settings || [];
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
      return res.users || [];
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
      return data || [];
    },
  });

/* ---------- SIGNUP REQUESTS ---------- */
export const useSignupRequests = () =>
  useQuery({
    queryKey: ["admin-signup-requests"],
    queryFn: async () => {
      const res = await adminInvoke<{ requests: SignupRequest[] }>("list_signup_requests");
      return res.requests || [];
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

/* ---------- AUCTIONS ---------- */
export const useAdminActiveBids = () => {
  const { isTestMode } = useAdminMode();
  return useQuery({
    queryKey: ["admin-active-bids", isTestMode],
    queryFn: async () => {
      const res = await adminInvoke<{ bids: any[] }>("list_active_bids", { isTestMode });
      return (res.bids || []).map((bid) => mapBidRequestRow(bid, bid.bid_request_items || []));
    },
  });
};

export const useAdminNearbyStores = (lat: number | null, lng: number | null) =>
  useQuery({
    queryKey: ["admin-nearby-stores", lat, lng],
    queryFn: async () => {
      if (!lat || !lng) return [];
      const res = await adminInvoke<{ stores: ExternalStore[] }>("list_nearby_stores", { lat, lng });
      return res.stores || [];
    },
    enabled: Boolean(lat && lng),
  });

export const useCreateManualBidMutation = () => {
  const qc = useQueryClient();
  const { isTestMode } = useAdminMode();
  return useMutation({
    mutationFn: (payload: {
      requestId: string;
      storeName: string;
      deliveryTime: string;
      offers: { itemName: string; unitPrice: number; isAvailable: boolean }[];
    }) => adminInvoke("create_manual_bid", { ...payload, isTestMode }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["admin-active-bids", isTestMode] });
      qc.invalidateQueries({ queryKey: ["request-bids", variables.requestId, isTestMode] });
    },
  });
};
