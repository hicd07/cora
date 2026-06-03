import React, { useState } from "react";
import { Check, Eye, EyeOff, MapPin, ShieldCheck, Store, X, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoverImagePicker } from "./CoverImagePicker";
import { useSessionContext } from "@/components/auth/SessionContext";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";
import { MapPicker } from "@/components/ui/MapPicker";

interface ProviderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTORS = ["Alma Rosa I", "Alma Rosa II", "Ensanche Ozama", "Lucerna", "San Isidro", "El Almirante", "Carretera Mella", "Av. España"];
const fieldClassName = "field-soft appearance-none pr-10";

const INITIAL_CENTER = { lat: 18.4861, lng: -69.9312 };

export const ProviderProfileModal: React.FC<ProviderProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useSessionContext();
  const [storeName, setStoreName] = useState(profile?.store_name || profile?.full_name || "");
  const [sector, setSector] = useState(profile?.sector || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [lat, setLat] = useState<number>(profile?.lat || INITIAL_CENTER.lat);
  const [lng, setLng] = useState<number>(profile?.lng || INITIAL_CENTER.lng);
  const [deliveryCoverage, setDeliveryCoverage] = useState<string[]>(profile?.delivery_coverage || []);
  const [isPublic, setIsPublic] = useState<boolean>(profile?.is_public ?? false);
  const [coverUrl, setCoverUrl] = useState<string | null>(profile?.cover_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !profile) return null;

  const handleToggleSector = (selectedSector: string) => {
    if (deliveryCoverage.includes(selectedSector)) {
      setDeliveryCoverage(deliveryCoverage.filter((sectorItem) => sectorItem !== selectedSector));
      return;
    }
    setDeliveryCoverage([...deliveryCoverage, selectedSector]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!storeName.trim()) return;

    setIsSubmitting(true);
    await updateProfile({
      store_name: storeName.trim(),
      full_name: profile.full_name,
      sector: sector || null,
      address: address || null,
      lat,
      lng,
      delivery_coverage: deliveryCoverage,
      is_public: isPublic,
      cover_url: coverUrl,
    });

    setIsSubmitting(false);
    showSuccess("Perfil de ferretería actualizado.");
    onClose();
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex animate-in fade-in-0 duration-200 items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[hsl(var(--card)/0.94)] px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Perfil comercial</p>
              <h3 className="font-display text-base font-semibold text-foreground">Mi perfil de empresa</h3>
              <p className="mt-1 text-xs text-muted-foreground">Edita visibilidad, ubicación y presencia comercial.</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 pb-10">
          <div className="space-y-1.5">
            <label className="section-label block text-primary/70">Identidad visual</label>
            <CoverImagePicker 
              currentUrl={coverUrl} 
              onUploadComplete={(url) => setCoverUrl(url)} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="section-label block">Nombre de la ferretería</label>
            <Input type="text" required placeholder="Ej: Ferretería El Progreso SDE" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>

          <div className="panel-muted p-4 space-y-4">
            <div>
              <label className="section-label flex items-center gap-1.5 mb-2">
                <MapIcon className="h-3.5 w-3.5 text-primary" /> Ubicación exacta
              </label>
              <MapPicker 
                lat={lat} 
                lng={lng} 
                onPositionChange={({ lat, lng }) => {
                  setLat(lat);
                  setLng(lng);
                }} 
                height="200px"
              />
            </div>

            <div className="space-y-1.5">
              <label className="section-label block">Dirección completa</label>
              <Input 
                placeholder="Calle #, Edificio..." 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />Sector principal (SDE)
              </label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className={fieldClassName}>
                <option value="">Selecciona un sector</option>
                {SECTORS.map((sectorItem) => (
                  <option key={sectorItem} value={sectorItem}>
                    {sectorItem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="section-label block">Cobertura de entrega</label>
            <div className="grid grid-cols-2 gap-2">
              {SECTORS.map((sectorItem) => {
                const isSelected = deliveryCoverage.includes(sectorItem);
                return (
                  <button
                    key={sectorItem}
                    type="button"
                    onClick={() => handleToggleSector(sectorItem)}
                    className={cn(
                      "interactive-row flex items-center justify-between rounded-[1.15rem] border px-3 py-3 text-left text-xs",
                      isSelected
                        ? "border-primary/25 bg-[hsl(var(--primary)/0.12)] text-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground",
                    )}
                  >
                    <span>{sectorItem}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel-muted p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-[1rem]", isPublic ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                  {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground">Visibilidad del perfil</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isPublic ? "Visible para clientes" : "Oculto para clientes"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={cn("toggle-track shrink-0", isPublic ? "border-primary/20 bg-primary/20" : "border-border bg-muted")}
              >
                <span className={cn("toggle-thumb", isPublic ? "translate-x-7" : "translate-x-0")} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <><ShieldCheck className="h-4 w-4" />Guardar perfil</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderProfileModal;