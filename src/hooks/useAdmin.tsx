import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";

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
  updated_at?: string;
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
    mutationFn: async ({ key, value }: { key: string; value: string | null }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (value === null || value === "") {
        const { error } = await supabase
          .from("admin_settings")
          .delete()
          .eq("key", key);
        if (error) throw error;
        return;
      }

      const { data: existing } = await supabase
        .from("admin_settings")
        .select("is_secret")
        .eq("key", key)
        .maybeSingle();

      const isSecret = existing ? existing.is_secret : (key.toLowerCase().includes("key") || key.toLowerCase().includes("secret"));
      
      const { error } = await supabase
        .from("admin_settings")
        .upsert({ 
          key, 
          value, 
          is_secret: isSecret,
          updated_at: new Date().toISOString(),
          updated_by: session?.user?.id
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
  const { isTestMode } = useAdminMode();
  return useQuery({
    queryKey: ["admin-active-bids", isTestMode],
    queryFn: async () => {
      let query = supabase
        .from("bid_requests")
        .select("*")
        .eq("status", "active");
      
      if (isTestMode !== undefined) {
        query = query.eq("is_test", isTestMode);
      }

      const { data: requests, error: reqError } = await query.order("created_at", { ascending: false });

      if (reqError) throw reqError;

      const requestIds = (requests || []).map(r => r.id);
      
      if (requestIds.length === 0) return [];

      const { data: allItems, error: itemError } = await supabase
        .from("bid_request_items")
        .select("*")
        .in("request_id", requestIds);

      if (itemError) throw itemError;

      return (requests || []).map(r => {
        // Filtrar solo los materiales que pertenecen a esta solicitud específica
        const requestItems = (allItems || []).filter(item => item.request_id === r.id);
        return mapBidRequestRow(r, requestItems);
      });
    },
  });
};

export const useAdminNearbyStores = (
  lat: number | null,
  lng: number | null,
  radiusKm: number = 5,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["admin-nearby-stores", lat, lng, radiusKm],
    queryFn: async () => {
      if (!lat || !lng) return [];
      
      const { data, error } = await supabase.functions.invoke("places-search", {
        body: { lat, lng, radiusKm },
      });

      if (error) {
        throw error;
      }
      
      return data.results || [];
    },
    enabled: enabled && !!lat && !!lng,
    staleTime: 1000 * 60 * 30, // 30 min cache
    refetchOnWindowFocus: false, // Desactivar llamadas automáticas al cambiar pestaña
    refetchOnMount: false, // Desactivar llamadas automáticas al montar componente
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