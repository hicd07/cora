import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";
import { BidRequest, QuoteItem } from "@/lib/types";

const BID_REQUESTS_PAGE_SIZE = 12;
const bidRequestsKey = ["bid-requests", BID_REQUESTS_PAGE_SIZE];

const fetchBidRequests = async (): Promise<BidRequest[]> => {
  const { data: requests, error } = await supabase
    .from("bid_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, BID_REQUESTS_PAGE_SIZE - 1);

  if (error) {
    const status = typeof error.code === "string" ? Number(error.code) : NaN;
    if (status === 500 || error.message?.includes("500")) {
      return [];
    }

    throw error;
  }

  if (!requests || requests.length === 0) {
    return [];
  }

  const requestIds = requests.map((request) => request.id);
  const { data: items, error: itemsError } = await supabase
    .from("bid_request_items")
    .select("*")
    .in("request_id", requestIds)
    .order("name", { ascending: true });

  if (itemsError) {
    throw itemsError;
  }

  return requests.map((request) => mapBidRequestRow(request, items ?? []));
};

export const useBidRequests = () =>
  useQuery({
    queryKey: bidRequestsKey,
    queryFn: fetchBidRequests,
    retry: false,
  });

interface CreateBidRequestInput {
  title: string;
  category: string;
  deliveryAddress: string;
  sector: string;
  budgetLimit?: number | null;
  expiresAt: string;
  items: QuoteItem[];
}

export const useCreateBidRequestMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateBidRequestInput) => {
      if (!user) {
        throw new Error("Debes iniciar sesión para publicar una solicitud.");
      }

      const { data: request, error } = await supabase
        .from("bid_requests")
        .insert({
          owner_user_id: user.id,
          title: input.title,
          category: input.category,
          delivery_address: input.deliveryAddress,
          sector: input.sector,
          status: "active",
          budget_limit: input.budgetLimit ?? null,
          expires_at: input.expiresAt,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const validItems = input.items.filter((item) => item.name.trim() && item.quantity > 0);
      if (validItems.length === 0) {
        throw new Error("Debes incluir al menos un material válido.");
      }

      const { error: itemsError } = await supabase.from("bid_request_items").insert(
        validItems.map((item) => ({
          request_id: request.id,
          name: item.name.trim(),
          quantity: item.quantity,
          unit: item.unit,
        })),
      );

      if (itemsError) {
        await supabase.from("bid_requests").delete().eq("id", request.id);
        throw itemsError;
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidRequestsKey });
    },
  });
};

export const useCompleteBidRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.from("bid_requests").update({ status: "completed" }).eq("id", requestId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidRequestsKey });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
};