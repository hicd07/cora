import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AutocompleteSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export const useAddressAutocomplete = (input: string, delay: number = 500) => {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");

  // Generar nuevo token de sesión
  const refreshSessionToken = useCallback(() => {
    const newToken = crypto.randomUUID();
    setSessionToken(newToken);
    console.log("[useAddressAutocomplete] Nuevo Session Token:", newToken);
  }, []);

  // Inicializar token al montar
  useEffect(() => {
    refreshSessionToken();
  }, [refreshSessionToken]);

  useEffect(() => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("address-autocomplete", {
          body: { input, sessionToken },
        });

        if (error) throw error;
        setSuggestions(data.predictions || []);
      } catch (err) {
        console.error("[useAddressAutocomplete] Error fetching suggestions:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [input, delay, sessionToken]);

  const getPlaceDetails = async (placeId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("address-details", {
        body: { placeId, sessionToken },
      });
      if (error) throw error;
      
      // Invalidar token de sesión después de obtener detalles (según reglas de Google)
      refreshSessionToken();
      
      return data;
    } catch (err) {
      console.error("[useAddressAutocomplete] Error fetching place details:", err);
      return null;
    }
  };

  return {
    suggestions,
    isLoading,
    refreshSessionToken,
    getPlaceDetails
  };
};
