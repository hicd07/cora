import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionContext } from "@/components/auth/SessionContext";

interface PlacesSearchParams {
  lat: number | null;
  lng: number | null;
  radiusKm: number;
}

interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  phone_e164: string | null;
  lat: number;
  lng: number;
}

export const usePlacesSearch = (params: PlacesSearchParams) => {
  const { session } = useSessionContext();

  return useQuery({
    queryKey: ["places-search", params.lat, params.lng, params.radiusKm],
    queryFn: async (): Promise<PlaceResult[]> => {
      if (!params.lat || !params.lng) return [];

      const { data, error } = await supabase.functions.invoke("places-search", {
        body: params,
      });

      if (error) throw error;
      return data.results || [];
    },
    enabled: Boolean(session && params.lat && params.lng),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};
