import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWaConversations = (bidRequestId?: string) => {
  return useQuery({
    queryKey: ["wa-conversations", bidRequestId],
    queryFn: async () => {
      if (!bidRequestId) return [];

      const { data, error } = await supabase
        .from("wa_conversations")
        .select(`
          id,
          state,
          wa_phone_number,
          updated_at,
          external_stores (
            name,
            address
          )
        `)
        .eq("bid_request_id", bidRequestId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as unknown as {
        id: string;
        state: string;
        wa_phone_number: string;
        updated_at: string;
        external_stores: {
          name: string;
          address: string;
        } | null;
      }[];
    },
    enabled: Boolean(bidRequestId),
  });
};
