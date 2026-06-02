import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BidRequest } from "@/lib/types";

export const useBidRequests = () => {
  return useQuery({
    queryKey: ["bid-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_requests")
        .select(`
          *,
          items:bid_request_items(*)
        `)
        .order("created_at", { ascending: false });

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