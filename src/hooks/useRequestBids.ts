import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HardwareBid } from "@/lib/types";
import { useSessionContext } from "@/components/auth/SessionContext";

export const useRequestBids = (requestId?: string) => {
  return useQuery({
    queryKey: ["bid-request-bids", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .from("hardware_bids")
        .select(`
          *,
          offers:bid_offers(*)
        `)
        .eq("request_id", requestId);

      if (error) throw error;

      return (data || []).map((bid: any) => ({
        id: bid.id,
        storeId: bid.bidder_user_id || bid.id,
        storeName: bid.store_name,
        rating: bid.rating,
        deliveryTime: bid.delivery_time,
        bidderUserId: bid.bidder_user_id,
        offers: bid.offers.map((offer: any) => ({
          itemName: offer.item_name,
          unitPrice: Number(offer.unit_price),
          isAvailable: offer.is_available,
        })),
      })) as HardwareBid[];
    },
    enabled: !!requestId,
  });
};

export const useCreateRequestBidMutation = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useSessionContext();

  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      deliveryTime: string;
      shippingCost: number;
      offers: { itemName: string; unitPrice: number; isAvailable: boolean }[];
    }) => {
      const { data: bid, error: bidError } = await supabase
        .from("hardware_bids")
        .insert({
          request_id: data.requestId,
          bidder_user_id: user?.id,
          store_name: profile?.store_name || profile?.full_name || "Ferretería",
          delivery_time: data.deliveryTime,
          shipping_cost: data.shippingCost
        })
        .select()
        .single();

      if (bidError) throw bidError;

      const { error: offersError } = await supabase
        .from("bid_offers")
        .insert(
          data.offers.map((offer) => ({
            bid_id: bid.id,
            item_name: offer.itemName,
            unit_price: offer.unitPrice,
            is_available: offer.isAvailable,
          }))
        );

      if (offersError) throw offersError;

      return bid;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
      queryClient.invalidateQueries({ queryKey: ["bid-request-bids"] });
    },
  });
};

export const useUpdateRequestBidMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      bidId: string;
      deliveryTime: string;
      shippingCost: number;
      offers: { itemName: string; unitPrice: number; isAvailable: boolean }[];
    }) => {
      // 1. Update the main bid row (this triggers the notification if delivery_time changes)
      // Note: We also touch updated_at to ensure the trigger can pick it up if needed
      const { error: bidError } = await supabase
        .from("hardware_bids")
        .update({
          delivery_time: data.deliveryTime,
          shipping_cost: data.shippingCost,
          // touching a dummy field or relying on delivery_time to fire the existing trigger
        })
        .eq("id", data.bidId);

      if (bidError) throw bidError;

      // 2. Delete old offers and insert new ones (simplest way to handle price updates)
      const { error: deleteError } = await supabase
        .from("bid_offers")
        .delete()
        .eq("bid_id", data.bidId);

      if (deleteError) throw deleteError;

      const { error: offersError } = await supabase
        .from("bid_offers")
        .insert(
          data.offers.map((offer) => ({
            bid_id: data.bidId,
            item_name: offer.itemName,
            unit_price: offer.unitPrice,
            is_available: offer.isAvailable,
          }))
        );

      if (offersError) throw offersError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
      queryClient.invalidateQueries({ queryKey: ["bid-request-bids"] });
    },
  });
};