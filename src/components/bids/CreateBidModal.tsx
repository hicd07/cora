import React, { useState, useCallback, useEffect } from "react";
import { Calendar, DollarSign, HardHat, PackagePlus, MapPin, X, Phone, Home, Map as MapIcon } from "lucide-react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { MapContainer, TileLayer, Marker as LeafletMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useCreateBidRequestMutation } from "@/hooks/useBidRequests";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";
import { usePublicSettings } from "@/hooks/useSettings";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { QuoteItem } from "@/lib/types";

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const LocationMarker = ({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <LeafletMarker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        },
      }}
    />
  );
};
import { showError, showSuccess } from "@/utils/toast";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CreateBidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ["Cemento y Agregados", "Metales y Estructuras", "Plomería", "Bloques y Ladrillos", "Electricidad"];
const UNITS = ["Fundas", "Varillas", "Metros Cúbicos", "Unidades", "Pies", "Cajas", "Quintales"];
const fieldClassName = "field-soft appearance-none pr-10";

const INITIAL_CENTER = { lat: 18.4861, lng: -69.9312 };

const mapContainerStyle = {
  width: "100%",
  height: "220px",
  borderRadius: "1.2rem",
};

const generateId = () => Math.random().toString(36).slice(2) + Date.now();

const createEmptyItem = (): QuoteItem => ({
  id: generateId(),
  name: "",
  quantity: 1,
  unit: UNITS[0],
});

export const CreateBidModal: React.FC<CreateBidModalProps> = ({ isOpen, onClose }) => {
  const { data: settings } = usePublicSettings();
  const mapsApiKey = settings?.["GOOGLE_MAPS_API_KEY"] || "";
  const { isTestMode } = useAdminMode();

  const createBidRequest = useCreateBidRequestMutation();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [sector, setSector] = useState("");
  const [province, setProvince] = useState("Santo Domingo");
  const [phone, setPhone] = useState("");

  const [budget, setBudget] = useState("");
  const [expiresIn, setExpiresIn] = useState("24");
  const [radiusKm, setRadiusKm] = useState(5);
  const [lat, setLat] = useState<number>(INITIAL_CENTER.lat);
  const [lng, setLng] = useState<number>(INITIAL_CENTER.lng);
  const [items, setItems] = useState<QuoteItem[]>([createEmptyItem()]);

  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const { suggestions, isLoading: isLoadingAutocomplete, getPlaceDetails } = useAddressAutocomplete(street);

  const { isLoaded } = useJsApiLoader({

    id: "google-map-script",
    googleMapsApiKey: mapsApiKey,
  });

  const { data: places = [], isLoading: isLoadingPlaces } = usePlacesSearch({
    lat,
    lng,
    radiusKm,
  });

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLat(e.latLng.lat());
      setLng(e.latLng.lng());
    }
  }, []);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setCategory(CATEGORIES[0]);
    setStreet("");
    setHouseNumber("");
    setSector("");
    setProvince("Santo Domingo");
    setPhone("");
    setBudget("");
    setExpiresIn("24");
    setRadiusKm(5);
    setLat(INITIAL_CENTER.lat);
    setLng(INITIAL_CENTER.lng);
    setItems([createEmptyItem()]);
  };

  const handleAddItem = () => {
    setItems((current) => [...current, createEmptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((current) => (current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : current));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    setItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [field]: field === "quantity" ? Number.parseFloat(String(value)) || 0 : value,
            }
          : item,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !street.trim() || !sector.trim() || !phone.trim()) {
      showError("Por favor completa los campos obligatorios (Título, Calle, Sector y Teléfono).");
      return;
    }

    const validItems = items.filter((item) => item.name.trim() && item.quantity > 0);
    if (validItems.length === 0) {
      showError("Añade al menos un material válido.");
      return;
    }

    const fullAddress = `${street} #${houseNumber}, ${sector}, ${province}. Contacto: ${phone}`;

    try {
      await createBidRequest.mutateAsync({
        title: title.trim(),
        category,
        sector: sector.trim(),
        deliveryAddress: fullAddress,
        lat,
        lng,
        radiusKm,
        budgetLimit: budget ? Number.parseFloat(budget) : null,
        expiresAt: new Date(Date.now() + Number.parseInt(expiresIn, 10) * 60 * 60 * 1000).toISOString(),
        items: validItems,
      });

      showSuccess("Solicitud publicada exitosamente.");
      resetForm();
      onClose();
    } catch (error: any) {
      showError(error.message || "No se pudo publicar la solicitud.");
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex animate-in fade-in-0 duration-200 items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[hsl(var(--card)/0.94)] px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Nueva subasta</p>
              <h3 className="font-display text-base font-semibold text-foreground">Solicitar cotización</h3>
              <p className="mt-1 text-xs text-muted-foreground">Define la ubicación y detalles de entrega.</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 pb-10">
          <div className="space-y-1.5">
            <label className="section-label block">Nombre de la obra o proyecto</label>
            <Input type="text" required placeholder="Ej: Vaciado de techo - segunda planta" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="section-label block">Categoría principal</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClassName}>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="section-label block">Lista de materiales</label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="px-2 text-primary hover:bg-transparent">
                <PackagePlus className="h-3.5 w-3.5" />Añadir
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div key={item.id || index} className="panel-muted p-3.5">
                  <div className="grid grid-cols-[1fr_78px_98px_auto] items-center gap-2">
                    <Input type="text" required placeholder="Material" value={item.name} onChange={(e) => handleItemChange(index, "name", e.target.value)} />
                    <Input
                      type="number"
                      required
                      min="1"
                      placeholder="Cant."
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="text-center"
                    />
                    <select value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)} className={fieldClassName}>
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={items.length === 1} aria-label="Eliminar material">
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-muted p-4 space-y-4">
            <div>
              <label className="section-label flex items-center gap-1.5 mb-2">
                <MapIcon className="h-3.5 w-3.5 text-primary" /> Ubicación exacta
                {isTestMode && <Badge variant="outline" className="ml-2 text-[8px] bg-amber-50 text-amber-700 border-amber-200">OSM TEST</Badge>}
              </label>
              
              {isTestMode ? (
                <div className="overflow-hidden border border-border shadow-sm rounded-[1.2rem] bg-muted/20 relative z-0">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    style={mapContainerStyle}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={[lat, lng]} setPosition={([newLat, newLng]) => {
                      setLat(newLat);
                      setLng(newLng);
                    }} />
                  </MapContainer>
                </div>
              ) : !mapsApiKey ? (
                <div className="p-4 border border-dashed rounded-xl text-center bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">Esperando API Key de Google Maps...</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-border shadow-sm rounded-[1.2rem] bg-muted/20">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={{ lat, lng }}
                      zoom={15}
                      onClick={onMapClick}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                      }}
                    >
                      <Marker position={{ lat, lng }} draggable onDragEnd={onMapClick} />
                    </GoogleMap>
                  ) : (
                    <div style={mapContainerStyle} className="flex items-center justify-center text-xs text-muted-foreground">
                      Cargando mapa...
                    </div>
                  )}
                </div>
              )}
              <p className="mt-2 text-[10px] text-muted-foreground italic text-center">
                Toca o arrastra el marcador para fijar el punto de entrega
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="section-label block">Calle</label>
                <div className="relative">
                  <Popover open={isAutocompleteOpen && suggestions.length > 0} onOpenChange={setIsAutocompleteOpen}>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          required
                          placeholder="Calle principal"
                          value={street}
                          onChange={(e) => {
                            setStreet(e.target.value);
                            setIsAutocompleteOpen(true);
                          }}
                          className="pl-9"
                        />
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        {isLoadingAutocomplete && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {suggestions.map((s) => (
                              <CommandItem
                                key={s.place_id}
                                value={s.description}
                                onSelect={async () => {
                                  setStreet(s.description);
                                  setIsAutocompleteOpen(false);
                                  const details = await getPlaceDetails(s.place_id);
                                  if (details) {
                                    if (details.location) {
                                      setLat(details.location.latitude);
                                      setLng(details.location.longitude);
                                    }
                                    if (details.formattedAddress) {
                                      setStreet(details.formattedAddress);
                                    }
                                    // Intentar extraer sector de addressComponents si existe
                                    const sectorComp = details.addressComponents?.find((c: any) =>
                                      c.types.includes("sublocality") || c.types.includes("neighborhood")
                                    );
                                    if (sectorComp) setSector(sectorComp.longText);
                                  }
                                }}
                              >
                                {s.description}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-1.5">

                <label className="section-label block">Número / Unidad</label>
                <div className="relative">
                  <Input 
                    placeholder="Casa #, Apto" 
                    value={houseNumber} 
                    onChange={(e) => setHouseNumber(e.target.value)} 
                    className="pl-9"
                  />
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="section-label block">Sector / Municipio</label>
                <Input required placeholder="Ej: Alma Rosa" value={sector} onChange={(e) => setSector(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="section-label block">Provincia</label>
                <Input placeholder="Santo Domingo" value={province} onChange={(e) => setProvince(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" /> Teléfono de contacto
              </label>
              <Input 
                required 
                type="tel" 
                placeholder="809-555-0000" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>

            <div className="mt-4 space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="section-label flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Radio de búsqueda
                </label>
                <span className="text-sm font-medium text-foreground">{radiusKm} km</span>
              </div>
              <Slider
                value={[radiusKm]}
                onValueChange={([val]) => setRadiusKm(val)}
                max={50}
                min={1}
                step={1}
              />
              <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Ferreterías candidatas</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Se invitarán automáticamente</p>
                </div>
                {isLoadingPlaces ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {places.length} aliadas
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />Presupuesto máximo
              </label>
              <Input type="number" placeholder="Opcional (RD$)" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />Duración de subasta
              </label>
              <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} className={fieldClassName}>
                <option value="12">12 horas</option>
                <option value="24">24 horas</option>
                <option value="48">48 horas</option>
                <option value="72">72 horas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={createBidRequest.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBidRequest.isPending}>
              {createBidRequest.isPending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Publicar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBidModal;