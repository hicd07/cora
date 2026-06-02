import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { mapHardwareBidRow } from "@/lib/mappers/bidRequests";
import { HardwareBid } from "@/lib/types";
import { useAdminMode } from "@/contexts/AdminModeContext";

const requestBidsKey = (requestId?: string | null, isTestMode?: boolean) => ["request-bids", requestId, isTestMode];

const fetchRequestBids = async (requestId: string, isAdmin: boolean, isTestMode: boolean): Promise<HardwareBid[]> => {
  let query = supabase
    .from("hardware_bids")
    .select("*")
    .eq("request_id", requestId);

  if (isAdmin) {
    query = query.eq('is_test', isTestMode);
  } else {
    query = query.or('is_test.eq.false,is_test.is.null');
  }

  const { data: bids, error } = await query.order("created_at", { ascending: true });

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

export const useRequestBids = (requestId?: string | null) => {
  const queryClient = useQueryClient();
  const { isTestMode } = useAdminMode();
  const { isAdmin } = useSessionContext();

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`bids-for-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hardware_bids",
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: requestBidsKey(requestId, isTestMode) });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bid_offers",
        },
        () => {
          // A bit broad, but valid. bid_offers has no request_id,
          // we just invalidate whenever offers change.
          queryClient.invalidateQueries({ queryKey: requestBidsKey(requestId, isTestMode) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, queryClient, isTestMode]);

  return useQuery({
    queryKey: requestBidsKey(requestId, isTestMode),
    queryFn: () => fetchRequestBids(requestId as string, isAdmin, isTestMode),
    enabled: Boolean(requestId),
    retry: 1,
  });
};

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
  const { user, profile, isAdmin } = useSessionContext();
  const { isTestMode } = useAdminMode();

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
          is_test: isAdmin ? isTestMode : false, // Users don't have isTestMode, but admins do
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
      queryClient.invalidateQueries({ queryKey: requestBidsKey(variables.requestId, isTestMode) });
      queryClient.invalidateQueries({ queryKey: ["bid-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
};
