import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { mapHardwareBidRow } from "@/lib/mappers/bidRequests";
import { HardwareBid } from "@/lib/types";

const requestBidsKey = (requestId?: string | null) => ["request-bids", requestId];

const fetchRequestBids = async (requestId: string): Promise<HardwareBid[]> => {
  const { data: bids, error } = await supabase
    .from("hardware_bids")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!bids || bids.length === 0) {
    return [];
  }

  const bidIds = bids.map((bid) => bid.id);
  const { data: offers, error: offersError } = await supabase
    .from("bid_offers")
    .select("*")
    .in("bid_id", bidIds)
    .order("item_name", { ascending: true });

  if (offersError) {
    throw offersError;
  }

  return bids.map((bid) => mapHardwareBidRow(bid, offers ?? []));
};

export const useRequestBids = (requestId?: string | null) =>
  useQuery({
    queryKey: requestBidsKey(requestId),
    queryFn: () => fetchRequestBids(requestId as string),
    enabled: Boolean(requestId),
  });

interface CreateRequestBidInput {
  requestId: string;
  deliveryTime: string;
  offers: Array<{
    itemName: string;
    unitPrice: number;
    isAvailable: boolean;
  }>;
}

export const useCreateRequestBidMutation = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateRequestBidInput) => {
      if (!user) {
        throw new Error("Debes iniciar sesión para cotizar.");
      }

      const storeName = profile?.store_name?.trim() || profile?.full_name?.trim();
      if (!storeName) {
        throw new Error("Completa tu perfil comercial antes de enviar una oferta.");
      }

      const { data: bid, error } = await supabase
        .from("hardware_bids")
        .insert({
          request_id: input.requestId,
          bidder_user_id: user.id,
          store_name: storeName,
          rating: profile?.rating ?? 0,
          delivery_time: input.deliveryTime,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const validOffers = input.offers.filter((offer) => offer.isAvailable || offer.unitPrice > 0);
      const { error: offersError } = await supabase.from("bid_offers").insert(
        validOffers.map((offer) => ({
          bid_id: bid.id,
          item_name: offer.itemName,
          unit_price: offer.unitPrice,
          is_available: offer.isAvailable,
        })),
      );

      if (offersError) {
        await supabase.from("hardware_bids").delete().eq("id", bid.id);
        throw offersError;
      }

      return bid;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requestBidsKey(variables.requestId) });
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
};
