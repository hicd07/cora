import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchParams {
  lat: number;
  lng: number;
  radiusKm: number;
}

export const usePlacesSearch = (params: SearchParams) => {
  return useQuery({
    queryKey: ["places-search", params.lat, params.lng, params.radiusKm],
    queryFn: async () => {
      if (!params.lat || !params.lng) return [];
      
      const { data, error } = await supabase.functions.invoke("places-search", {
        body: params,
      });

      if (error) {
        console.error("Error searching places:", error);
        return [];
      }

      return data.results || [];
    },
    enabled: Boolean(params.lat && params.lng),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
};