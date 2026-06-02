import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicSettings() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value")
        .eq("is_secret", false);

      if (error) throw error;
      
      // Convertir array a objeto para fácil acceso
      return (data || []).reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string | null>);
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
}