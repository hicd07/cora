import React, { useState, useCallback } from "react";
import { GoogleMap, Marker, Circle, useJsApiLoader } from "@react-google-maps/api";
import { MapPin, Plus, Trash2, Home, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useSessionContext } from "@/components/auth/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const INITIAL_CENTER = { lat: 18.4861, lng: -69.9312 };
const mapContainerStyle = { width: "100%", height: "300px", borderRadius: "1rem" };

export const StoreLocationsManager = () => {
  const { user } = useSessionContext();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [radius, setRadius] = useState(5);
  const [pos, setPos] = useState(INITIAL_CENTER);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "", // Configurar en producción
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["store-locations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_locations")
        .select("*")
        .eq("profile_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const addLocation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("store_locations").insert({
        profile_id: user?.id,
        name: newName || "Nueva Sucursal",
        lat: pos.lat,
        lng: pos.lng,
        delivery_radius_km: radius,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-locations"] });
      setIsAdding(false);
      setNewName("");
      showSuccess("Ubicación comercial guardada.");
    },
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-locations"] });
      showSuccess("Ubicación eliminada.");
    },
  });

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) setPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" /> Mis puntos de despacho
        </h3>
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="rounded-full gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Agregar sucursal
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="app-shell p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <label className="section-label">Nombre del local</label>
            <Input placeholder="Ej: Sucursal San Isidro" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="section-label">Ubicación y Radio de Entrega ({radius} km)</label>
            <div className="overflow-hidden rounded-xl border border-border">
              {isLoaded && (
                <GoogleMap mapContainerStyle={mapContainerStyle} center={pos} zoom={13} onClick={onMapClick}>
                  <Marker position={pos} draggable onDragEnd={onMapClick} />
                  <Circle
                    center={pos}
                    radius={radius * 1000}
                    options={{ fillOpacity: 0.1, fillColor: "#3b82f6", strokeColor: "#3b82f6", strokeWeight: 1 }}
                  />
                </GoogleMap>
              )}
            </div>
            <Slider value={[radius]} onValueChange={([v]) => setRadius(v)} min={1} max={50} className="mt-4" />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button onClick={() => addLocation.mutate()}>Guardar sucursal</Button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {locations.map((loc: any) => (
          <div key={loc.id} className="panel-muted flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-foreground">{loc.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Radio: {loc.delivery_radius_km} KM</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteLocation.mutate(loc.id)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {locations.length === 0 && !isAdding && (
          <div className="text-center py-8 border border-dashed rounded-2xl text-muted-foreground text-xs">
            Aún no tienes locales configurados. Agrega uno para ser detectado por ingenieros.
          </div>
        )}
      </div>
    </div>
  );
};