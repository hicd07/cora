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
      
      // 1. Llamar a Edge Function para búsqueda externa (Google Places)
      const { data: externalData } = await supabase.functions.invoke("places-search", {
        body: params,
      });

      const externalResults = externalData?.results || [];

      // 2. Buscar ferreterías registradas cuyo radio de entrega se cruce con el del ingeniero
      // Usamos una aproximación matemática simple (Distancia <= RadioIngeniero + RadioFerreteria)
      const { data: registeredStores, error: dbError } = await supabase
        .from("store_locations")
        .select(`
          *,
          profile:profiles(store_name, rating, is_public)
        `)
        .eq("profile:profiles.is_public", true);

      if (dbError) {
        console.error("Error fetching registered stores:", dbError);
        return externalResults;
      }

      // Filtrado por intersección de radios
      const filteredRegistered = registeredStores?.filter((loc: any) => {
        const dist = getDistanceKm(params.lat, params.lng, loc.lat, loc.lng);
        return dist <= (params.radiusKm + loc.delivery_radius_km);
      }).map(loc => ({
        id: loc.id,
        name: loc.profile.store_name,
        address: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        isRegistered: true,
        rating: loc.profile.rating
      })) || [];

      // Combinar resultados priorizando registrados
      return [...filteredRegistered, ...externalResults];
    },
    enabled: Boolean(params.lat && params.lng),
  });
};

// Helper Haversine para distancia
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}