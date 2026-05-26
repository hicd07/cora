import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapHardwareStoreRow } from "@/lib/mappers/bidRequests";
import { HardwareStore } from "@/lib/types";

const fetchMarketplaceStores = async (): Promise<HardwareStore[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, store_name, sector, delivery_coverage, rating, reviews_count, is_public")
    .eq("user_type", "hardware")
    .eq("is_public", true)
    .order("rating", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapHardwareStoreRow);
};

export const useMarketplaceStores = () => useQuery({ queryKey: ["marketplace-stores"], queryFn: fetchMarketplaceStores });
