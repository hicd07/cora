import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const { lat, lng, radiusKm } = await req.json();

    if (!lat || !lng || !radiusKm) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase admin client to bypass RLS and write to cache/external_stores
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const latRound = lat.toFixed(2);
    const lngRound = lng.toFixed(2);

    // 1. Check Cache
    const { data: cached } = await supabase
      .from("places_cache")
      .select("results, fetched_at")
      .eq("lat_round", latRound)
      .eq("lng_round", lngRound)
      .eq("radius_km", radiusKm)
      .single();

    if (cached) {
      const ageHours = (new Date().getTime() - new Date(cached.fetched_at).getTime()) / (1000 * 60 * 60);
      if (ageHours < 72) {
        console.log("[places-search] Serving from cache");
        return new Response(JSON.stringify({ results: cached.results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Fetch from Google Places API
    const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    let mappedResults: any[] = [];

    if (!googleApiKey) {
      console.log("[places-search] GOOGLE_MAPS_API_KEY not set. Using mock data.");
      // Return mock data if no API key is provided
      mappedResults = [
        {
          place_id: `mock_place_${Math.random()}`,
          name: "Ferretería El Tornillo (Mock)",
          address: "Av. Principal #123, Santo Domingo",
          phone_e164: "+18095551234",
          lat: lat + (Math.random() - 0.5) * 0.01,
          lng: lng + (Math.random() - 0.5) * 0.01,
        },
        {
          place_id: `mock_place_${Math.random()}`,
          name: "Materiales Pérez (Mock)",
          address: "Calle Secundaria #45, Santo Domingo",
          phone_e164: "+18095559876",
          lat: lat + (Math.random() - 0.5) * 0.01,
          lng: lng + (Math.random() - 0.5) * 0.01,
        }
      ];
    } else {
      // In a real scenario we'd use the Nearby Search API:
      // https://maps.googleapis.com/maps/api/place/nearbysearch/json
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusKm * 1000}&type=hardware_store&key=${googleApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        mappedResults = data.results.map((place: any) => ({
          place_id: place.place_id,
          name: place.name,
          address: place.vicinity,
          phone_e164: null, // Would require Place Details API to get actual phone
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
        }));
      }
    }

    // 3. Save to external_stores
    if (mappedResults.length > 0) {
      const storesToInsert = mappedResults.map((r) => ({
        place_id: r.place_id,
        name: r.name,
        address: r.address,
        phone_e164: r.phone_e164,
        lat: r.lat,
        lng: r.lng,
        source: "google_places",
      }));

      // Upsert
      await supabase.from("external_stores").upsert(storesToInsert, { onConflict: "place_id" });
    }

    // 4. Save to Cache
    await supabase.from("places_cache").upsert({
      lat_round: latRound,
      lng_round: lngRound,
      radius_km: radiusKm,
      results: mappedResults,
      fetched_at: new Date().toISOString(),
    }, { onConflict: "lat_round, lng_round, radius_km" });

    return new Response(JSON.stringify({ results: mappedResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[places-search] error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});