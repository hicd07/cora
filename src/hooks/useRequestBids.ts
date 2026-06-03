import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppBid } from "@/lib/types";

export const useRequestBids = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ["bid-request-bids", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .from("hardware_bids")
        .select(`
          *,
          offers:bid_offers(*),
          profile:profiles!bidder_user_id(
            sector,
            store_name,
            cover_url,
            delivery_coverage
          )
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bids:", error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        requestId: row.request_id,
        storeId: row.bidder_user_id || row.id,
        storeName: row.store_name,
        rating: Number(row.rating) || 5.0,
        deliveryTime: row.delivery_time,
        shippingCost: Number(row.shipping_cost) || 0,
        bidderUserId: row.bidder_user_id,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        phone: row.phone,
        website: row.website,
        createdAt: row.created_at,
        profile: row.profile,
        // Fallback del sector: prioriza el del perfil si es verificado
        sector: row.profile?.sector || null,
        offers: (row.offers || []).map((o: any) => ({
          itemName: o.item_name,
          unitPrice: Number(o.unit_price),
          isAvailable: o.is_available,
        })),
      })) as AppBid[];
    },
    enabled: !!requestId,
  });
};

export const useCreateRequestBidMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bidData: {
      requestId: string;
      deliveryTime: string;
      shippingCost: number;
      offers: { itemName: string; unitPrice: number; isAvailable: boolean }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data: profile } = await supabase
        .from("profiles")
        .select("store_name, sector")
        .eq("id", user.id)
        .single();

      // 1. Create the hardware bid
      const { data: bid, error: bidError } = await supabase
        .from("hardware_bids")
        .insert({
          request_id: bidData.requestId,
          bidder_user_id: user.id,
          store_name: profile?.store_name || "Ferretería",
          delivery_time: bidData.deliveryTime,
          shipping_cost: bidData.shippingCost,
          // Guardamos el sector actual del perfil para que persista aunque cambie el perfil
          address: profile?.sector || null 
        })
        .select()
        .single();

      if (bidError) throw bidError;

      // 2. Create the offers for this bid
      const offersToInsert = bidData.offers.map((offer) => ({
        bid_id: bid.id,
        item_name: offer.itemName,
        unit_price: offer.unitPrice,
        is_available: offer.isAvailable,
      }));

      const { error: offersError } = await supabase
        .from("bid_offers")
        .insert(offersToInsert);

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
      offers: { itemName: string; unitPrice: number; isAvailable: boolean }[];
    }) => {
      // 1. Update the hardware bid
      const { error: bidError } = await supabase
        .from("hardware_bids")
        .update({
          delivery_time: bidData.deliveryTime,
          shipping_cost: bidData.shippingCost,
        })
        .eq("id", bidData.bidId);

      if (bidError) throw bidError;

      // 2. Delete old offers
      const { error: deleteError } = await supabase
        .from("bid_offers")
        .delete()
        .eq("bid_id", bidData.bidId);

      if (deleteError) throw deleteError;

      // 3. Create new offers
      const offersToInsert = bidData.offers.map((offer) => ({
        bid_id: bidData.bidId,
        item_name: offer.itemName,
        unit_price: offer.unitPrice,
        is_available: offer.isAvailable,
      }));

      const { error: offersError } = await supabase
        .from("bid_offers")
        .insert(offersToInsert);

      if (offersError) throw offersError;

      return { id: bidData.bidId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bid-request-bids", variables.requestId] });
    },
  });
};