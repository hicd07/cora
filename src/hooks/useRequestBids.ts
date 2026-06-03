import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionContext } from "@/components/auth/SessionContext";
import { HardwareBid, BidOffer } from "@/lib/types";

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
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bids = data || [];
      const bidderIds = [...new Set(bids.map((bid) => bid.bidder_user_id).filter(Boolean))];

      let profilesMap: Record<string, any> = {};
      if (bidderIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, cover_url, is_public, sector, delivery_coverage, full_name, store_name")
          .in("id", bidderIds);

        if (!profilesError && profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      return bids.map((bid) => {
        // Manejar el perfil cruzado
        const profile = bid.bidder_user_id ? profilesMap[bid.bidder_user_id] : null;
        
        return {
          id: bid.id,
          storeId: bid.bidder_user_id || bid.id,
          storeName: bid.store_name,
          bidderUserId: bid.bidder_user_id,
          rating: bid.rating || 5.0,
          deliveryTime: bid.delivery_time,
          shippingCost: bid.shipping_cost || 0,
          createdAt: bid.created_at,
          
          // Address, lat, lng come from hardware_bids directly
          address: bid.address,
          lat: bid.lat,
          lng: bid.lng,
          phone: bid.phone,
          website: bid.website,
          
          profile: profile ? {
            coverUrl: profile.cover_url,
            isPublic: profile.is_public,
            sector: profile.sector,
            deliveryCoverage: profile.delivery_coverage,
            fullName: profile.full_name,
            storeName: profile.store_name
          } : null,
          
          offers: (bid.offers || []).map((o: any) => ({
            itemName: o.item_name,
            unitPrice: o.unit_price,
            isAvailable: o.is_available
          }))
        } as HardwareBid;
      });
    },
    enabled: !!requestId
  });
};

export const useCreateRequestBidMutation = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useSessionContext();

  return useMutation({
    mutationFn: async (bidData: {
      requestId: string;
      deliveryTime: string;
      shippingCost: number;
      offers: Array<{ itemName: string; unitPrice: number; isAvailable: boolean }>;
    }) => {
      if (!user || !profile) throw new Error("Usuario no autenticado");

      // Note: address, lat, lng are stored in hardware_bids to allow per-bid flexibility
      const { data: bid, error: bidError } = await supabase
        .from("hardware_bids")
        .insert({
          request_id: bidData.requestId,
          store_name: profile.store_name || profile.full_name || "Ferretería",
          rating: profile.rating || 5.0,
          delivery_time: bidData.deliveryTime,
          shipping_cost: bidData.shippingCost,
          bidder_user_id: user.id,
          address: profile.address,
          lat: profile.lat,
          lng: profile.lng
        })
        .select()
        .single();

      if (bidError) throw bidError;

      const offersToInsert = bidData.offers.map((offer) => ({
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
    }
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
      offers: Array<{ itemName: string; unitPrice: number; isAvailable: boolean }>;
    }) => {
      const { error: bidError } = await supabase
        .from("hardware_bids")
        .update({
          delivery_time: bidData.deliveryTime,
          shipping_cost: bidData.shippingCost
        })
        .eq("id", bidData.bidId);

      if (bidError) throw bidError;

      const { error: deleteError } = await supabase
        .from("bid_offers")
        .delete()
        .eq("bid_id", bidData.bidId);

      if (deleteError) throw deleteError;

      const offersToInsert = bidData.offers.map((offer) => ({
        bid_id: bidData.bidId,
        item_name: offer.itemName,
        unit_price: offer.unitPrice,
        is_available: offer.isAvailable
      }));

      const { error: offersError } = await supabase
        .from("bid_offers")
        .insert(offersToInsert);

      if (offersError) throw offersError;
      
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bid-request-bids", variables.requestId] });
    }
  });
};

export const useFetchUserBid = (bidId: string) => {
  return useQuery({
    queryKey: ["hardware-bid", bidId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hardware_bids")
        .select(`
          *,
          offers:bid_offers(*)
        `)
        .eq("id", bidId)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!bidId
  });
};