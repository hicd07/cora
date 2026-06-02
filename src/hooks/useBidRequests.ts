import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BidRequest } from "@/lib/types";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { useSessionContext } from "@/components/auth/SessionContext";

export const useBidRequests = () => {
  const { isTestMode } = useAdminMode();
  const { isAdmin } = useSessionContext();

  return useQuery({
    queryKey: ["bid-requests", isTestMode, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("bid_requests")
        .select(`
          *,
          items:bid_request_items(*)
        `);

      if (isAdmin) {
        // Admin sees either test or real data based on toggle
        query = query.eq('is_test', isTestMode);
      } else {
        // Regular users NEVER see test data
        query = query.or('is_test.eq.false,is_test.is.null');
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        deliveryAddress: row.delivery_address,
        sector: row.sector,
        status: row.status,
        state: row.state,
        budgetLimit: row.budget_limit,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        bidsCount: row.bids_count,
        ownerUserId: row.owner_user_id,
        itemsCount: row.items?.length || 0,
        items: row.items || [],
        lat: row.lat,
        lng: row.lng,
        radiusKm: row.radius_km
      })) as BidRequest[];
    },
  });
};

export const useCreateBidRequestMutation = () => {
  const queryClient = useQueryClient();
  const { isTestMode } = useAdminMode();
  
  return useMutation({
    mutationFn: async (newRequest: any) => {
      const { data: request, error: requestError } = await supabase
        .from("bid_requests")
        .insert({
          title: newRequest.title,
          category: newRequest.category,
          delivery_address: newRequest.deliveryAddress,
          sector: newRequest.sector,
          lat: newRequest.lat,
          lng: newRequest.lng,
          radius_km: newRequest.radiusKm,
          budget_limit: newRequest.budgetLimit,
          expires_at: newRequest.expiresAt,
          is_test: isTestMode,
          owner_user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (requestError) throw requestError;

      const itemsToInsert = newRequest.items.map((item: any) => ({
        request_id: request.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit
      }));

      const { error: itemsError } = await supabase
        .from("bid_request_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
      
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
    },
  });
};

export const useCompleteBidRequestMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("bid_requests")
        .update({ status: "completed", state: "CLOSED" })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
    },
  });
};