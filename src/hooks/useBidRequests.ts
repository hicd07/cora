import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BidRequest, QuoteItem } from "@/lib/types";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";
import { useSessionContext } from "@/components/auth/SessionContext";

export const useBidRequests = () => {
  const { user } = useSessionContext();
  
  return useQuery({
    queryKey: ["bid-requests", user?.id],
    queryFn: async () => {
      const { data: requests, error: reqError } = await supabase
        .from("bid_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;

      const { data: items, error: itemError } = await supabase
        .from("bid_request_items")
        .select("*");

      if (itemError) throw itemError;

      // Fetch user's bids to check status
      const { data: userBids } = await supabase
        .from("hardware_bids")
        .select("request_id, id")
        .eq("bidder_user_id", user?.id);

      const bidMap = new Map(userBids?.map(b => [b.request_id, b.id]));

      return (requests || []).map(r => ({
        ...mapBidRequestRow(r, items || []),
        userBidId: bidMap.get(r.id) || null
      }));
    },
    enabled: !!user?.id
  });
};

export const useCreateBidRequestMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useSessionContext();

  return useMutation({
    mutationFn: async (data: any) => {
      const { items, ...requestData } = data;
      
      const { data: request, error: reqError } = await supabase
        .from("bid_requests")
        .insert({
          ...requestData,
          owner_user_id: user?.id,
          state: "DRAFT"
        })
        .select()
        .single();

      if (reqError) throw reqError;

      const { error: itemsError } = await supabase
        .from("bid_request_items")
        .insert(
          items.map((item: QuoteItem) => ({
            request_id: request.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit
          }))
        );

      if (itemsError) throw itemsError;

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
    }
  });
};

export const useCompleteBidRequestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bid_requests")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
    }
  });
};