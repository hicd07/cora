import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionContext } from "@/components/auth/SessionContext";
import { HardwareBid, BidOffer } from "@/lib/types";

export const useRequestBids = (requestId: string | undefined) => {
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

      return (data || []).map((row: any) => ({
        id: row.id,
        requestId: row.request_id,
        storeName: row.store_name,
        storeId: row.id, // Fallback to bid ID if profile ID isn't available
        bidderUserId: row.bidder_user_id,
        rating: Number(row.rating) || 5.0,
        deliveryTime: row.delivery_time,
        shippingCost: Number(row.shipping_cost) || 0,
        createdAt: row.created_at,
        phone: row.phone,
        website: row.website,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        offers: (row.offers || []).map((o: any) => ({
          id: o.id,
          itemName: o.item_name,
          unitPrice: Number(o.unit_price),
          isAvailable: o.is_available
        }))
      })) as HardwareBid[];
    },
    enabled: !!requestId,
  });
};

export const useCreateRequestBidMutation = () => {
  const { user, profile } = useSessionContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bidData: {
      requestId: string;
      deliveryTime: string;
      shippingCost: number;
      offers: Partial<BidOffer>[];
    }) => {
      if (!user) throw new Error("Debes iniciar sesión");

      const { data: bid, error: bidError } = await supabase
        .from("hardware_bids")
        .insert({
          request_id: bidData.requestId,
          bidder_user_id: user.id,
          store_name: profile?.store_name || profile?.full_name || "Ferretería",
          delivery_time: bidData.deliveryTime,
          shipping_cost: bidData.shippingCost,
          rating: 5.0,
        })
        .select()
        .single();

      if (bidError) throw bidError;

      const offersToInsert = bidData.offers.map((offer) => ({
        bid_id: bid.id,
        item_name: offer.itemName,
        unit_price: offer.unitPrice,
        is_available: offer.isAvailable,
      }));

      const { error: offersError } = await supabase.from("bid_offers").insert(offersToInsert);
      if (offersError) throw offersError;

      return bid;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bid-request-bids", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
    },
  });
};

export const useUpdateRequestBidMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bidData: {
      bidId: string;
      requestId: string;
      deliveryTime: string;
      shippingCost: number;
      offers: Partial<BidOffer>[];
    }) => {
      const { error: bidError } = await supabase
        .from("hardware_bids")
        .update({
          delivery_time: bidData.deliveryTime,
          shipping_cost: bidData.shippingCost,
          created_at: new Date().toISOString(), // Update timestamp to show it's fresh
        })
        .eq("id", bidData.bidId);

      if (bidError) throw bidError;

      // Delete old offers and insert new ones (simpler than selective update)
      const { error: deleteError } = await supabase
        .from("bid_offers")
        .delete()
        .eq("bid_id", bidData.bidId);

      if (deleteError) throw deleteError;

      const offersToInsert = bidData.offers.map((offer) => ({
        bid_id: bidData.bidId,
        item_name: offer.itemName,
        unit_price: offer.unitPrice,
        is_available: offer.isAvailable,
      }));

      const { error: offersError } = await supabase.from("bid_offers").insert(offersToInsert);
      if (offersError) throw offersError;

      return { id: bidData.bidId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bid-request-bids", variables.requestId] });
    },
  });
};

export const useFetchUserBid = (requestId: string | undefined) => {
  const { user } = useSessionContext();
  return useQuery({
    queryKey: ["user-bid", requestId, user?.id],
    queryFn: async () => {
      if (!requestId || !user) return null;
      const { data, error } = await supabase
        .from("hardware_bids")
        .select("id")
        .eq("request_id", requestId)
        .eq("bidder_user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.id || null;
    },
    enabled: !!requestId && !!user,
  });
};