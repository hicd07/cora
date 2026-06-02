import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  onboarded: boolean;
  roles: string[];
  created_at: string;
}

export interface AdminSetting {
  key: string;
  value: string | null;
  is_secret: boolean;
  description: string | null;
  has_value?: boolean;
}

export interface SignupRequest {
  id: string;
  email: string;
  full_name: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return data as AdminUser[];
    },
  });
};

export const useAdminSettings = () => {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*");
      if (error) throw error;
      
      return (data || []).map(s => ({
        ...s,
        has_value: !!s.value && s.value.length > 0
      })) as AdminSetting[];
    },
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      // Find if it's a secret to maintain consistency
      const isSecret = key.toLowerCase().includes("key") || key.toLowerCase().includes("secret");
      
      const { error } = await supabase
        .from("admin_settings")
        .upsert({ 
          key, 
          value, 
          is_secret: isSecret,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: any) => {
      const { data, error } = await supabase.functions.invoke("admin-manage", {
        body: { action: "create_user", ...userData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};

export const useSetUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, enabled }: { userId: string; role: string; enabled: boolean }) => {
      const { data, error } = await supabase.functions.invoke("admin-manage", {
        body: { action: "set_role", userId, role, enabled },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-manage", {
        body: { action: "delete_user", userId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};

export const useInvitations = () => {
  return useQuery({
    queryKey: ["admin-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invitation[];
    },
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-invite", {
        body: { email, role },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
  });
};

export const useSignupRequests = () => {
  return useQuery({
    queryKey: ["admin-signup-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_signup_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SignupRequest[];
    },
  });
};

export const useReviewSignupRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, approve }: { requestId: string; approve: boolean }) => {
      const { data, error } = await supabase.functions.invoke("admin-signup-review", {
        body: { requestId, approve },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-signup-requests"] });
    },
  });
};

export const useAdminActiveBids = () => {
  return useQuery({
    queryKey: ["admin-active-bids"],
    queryFn: async () => {
      const { data: requests, error: reqError } = await supabase
        .from("bid_requests")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;

      const { data: items, error: itemError } = await supabase
        .from("bid_request_items")
        .select("*")
        .in("request_id", requests.map(r => r.id));

      if (itemError) throw itemError;

      // Import mapper logic or inline it
      return requests.map(r => ({
        ...r,
        items: items.filter(i => i.request_id === r.id)
      }));
    },
  });
};

export const useAdminNearbyStores = (lat: number | null, lng: number | null) => {
  return useQuery({
    queryKey: ["admin-nearby-stores", lat, lng],
    queryFn: async () => {
      if (!lat || !lng) return [];
      const { data, error } = await supabase
        .from("external_stores")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!lat && !!lng,
  });
};

export const useCreateManualBidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bidData: any) => {
      const { data, error } = await supabase.functions.invoke("admin-manual-bid", {
        body: bidData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-request-bids"] });
    },
  });
};