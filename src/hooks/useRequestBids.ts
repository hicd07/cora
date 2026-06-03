import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRequestBids = (requestId?: string) => {
  return useQuery({
    queryKey: ["bid-request-bids", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .from("hardware_bids")
        .select(`
          *,
          offers:bid_offers(*),
          profiles:bidder_user_id (
            cover_url,
            is_public,
            sector,
            address,
            lat,
            lng,
            delivery_coverage
          )
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((bid: any) => {
        // Handle potential array or object from Supabase join
        const profileData = Array.isArray(bid.profiles) ? bid.profiles[0] : bid.profiles;
        
        return {
          id: bid.id,
          storeId: bid.bidder_user_id || bid.id,
          storeName: bid.store_name,
          rating: bid.rating,
          deliveryTime: bid.delivery_time,
          shippingCost: Number(bid.shipping_cost || 0),
          phone: bid.phone,
          website: bid.website,
          // Prioritize bid-specific data, then profile data
          address: bid.address || profileData?.address || null,
          lat: bid.lat || profileData?.lat,
          lng: bid.lng || profileData?.lng,
          createdAt: bid.created_at,
          bidderUserId: bid.bidder_user_id,
          profile: profileData ? {
            coverUrl: profileData.cover_url,
            isVerified: profileData.is_public,
            sector: profileData.sector,
            deliveryCoverage: profileData.delivery_coverage || []
          } : null,
          offers: (bid.offers || []).map((offer: any) => ({
            id: offer.id,
            itemName: offer.item_name,
            unitPrice: Number(offer.unit_price),
            isAvailable: offer.is_available
          }))
        };
      });
    },
    enabled: Boolean(requestId),
  });
};

export const useCreateRequestBidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, deliveryTime, shippingCost, offers }: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("store_name, address, lat, lng, sector")
        .eq("id", user.id)
        .single();

      const { data: bid, error: bidError } = await supabase
        .from("hardware_bids")
        .insert({
          request_id: requestId,
          bidder_user_id: user.id,
          store_name: profile?.store_name || "Ferretería",
          address: profile?.address || profile?.sector,
          lat: profile?.lat,
          lng: profile?.lng,
          delivery_time: deliveryTime,
          shipping_cost: shippingCost
        })
        .select()
        .single();

      if (bidError) throw bidError;

      const offersToInsert = offers.map((offer: any) => ({
        bid_id: bid.id,
        item_name: offer.itemName,
        unit_price: offer.unitPrice,
        is_available: offer.isAvailable
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
    mutationFn: async ({ bidId, requestId, deliveryTime, shippingCost, offers }: any) => {
      const { error: bidError } = await supabase
        .from("hardware_bids")
        .update({
          delivery_time: deliveryTime,
          shipping_cost: shippingCost
        })
        .eq("id", bidId);

      if (bidError) throw bidError;

      await supabase.from("bid_offers").delete().eq("bid_id", bidId);

      const offersToInsert = offers.map((offer: any) => ({
        bid_id: bidId,
        item_name: offer.itemName,
        unit_price: offer.unitPrice,
        is_available: offer.isAvailable
      }));

      const { error: offersError } = await supabase
        .from("bid_offers")
        .insert(offersToInsert);

      if (offersError) throw offersError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bid-request-bids", variables.requestId] });
    },
  });
};

export const useFetchUserBid = (requestId?: string, userId?: string) => {
  return useQuery({
    queryKey: ["user-bid", requestId, userId],
    queryFn: async () => {
      if (!requestId || !userId) return null;
      const { data, error } = await supabase
        .from("hardware_bids")
        .select("id")
        .eq("request_id", requestId)
        .eq("bidder_user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(requestId && userId),
  });
};