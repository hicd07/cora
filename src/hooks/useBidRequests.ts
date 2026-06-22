import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";
import { useSessionContext } from "@/components/auth/SessionContext";
import { BidRequest } from "@/lib/types";

export const useBidRequests = () => {
  const { user, profile } = useSessionContext();
  
  return useQuery({
    queryKey: ["bid-requests", user?.id, profile?.user_type],
    queryFn: async () => {
      // 1. Obtener las licitaciones activas
      const { data: requests, error: reqError } = await supabase
        .from("bid_requests")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;
      if (!requests || requests.length === 0) return [];

      const requestIds = requests.map(r => r.id);

      // 2. Obtener SOLO los materiales de estas licitaciones
      const { data: items, error: itemError } = await supabase
        .from("bid_request_items")
        .select("*")
        .in("request_id", requestIds);

      if (itemError) throw itemError;

      // 3. Si es ferretería, verificar si ya ha cotizado en estas licitaciones
      let bidMap = new Map();
      if (profile?.user_type === "hardware") {
        const { data: userBids } = await supabase
          .from("hardware_bids")
          .select("id, request_id")
          .eq("bidder_user_id", user?.id)
          .in("request_id", requestIds);
          
        if (userBids) {
          bidMap = new Map(userBids.map(b => [b.request_id, b.id]));
        }
      }

      // 4. Mapear filtrando los materiales por cada ID de solicitud (La corrección principal)
      return requests.map(r => {
        const requestItems = (items || []).filter(item => item.request_id === r.id);
        return {
          ...mapBidRequestRow(r, requestItems),
          userBidId: bidMap.get(r.id) || null
        };
      });
    },
    enabled: !!user?.id
  });
};

export const useCreateBidRequestMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useSessionContext();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { items, ...requestData } = payload;
      
      // Crear la solicitud
      const { data: request, error: reqError } = await supabase
        .from("bid_requests")
        .insert({
          ...requestData,
          owner_user_id: user?.id,
          status: "active",
          state: "BROADCASTING"
        })
        .select()
        .single();

      if (reqError) throw reqError;

      // Crear los materiales vinculados
      const { error: itemsError } = await supabase
        .from("bid_request_items")
        .insert(
          items.map((item: any) => ({
            ...item,
            request_id: request.id
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
        .update({ status: "completed", state: "CLOSED" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
    }
  });
};