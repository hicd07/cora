import React from "react";
import { MapPin, ShieldCheck, Star, Store, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HardwareStore } from "@/lib/types";

interface StoreDetailProps {
  isOpen: boolean;
  onClose: () => void;
  store: HardwareStore | null;
}

export const StoreDetailModal: React.FC<StoreDetailProps> = ({ isOpen, onClose, store }) => {
  if (!isOpen || !store) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex animate-in fade-in-0 duration-200 items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[hsl(var(--card)/0.94)] px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Proveedor visible</p>
              <h3 className="font-display text-base font-semibold text-foreground">Detalle de proveedor</h3>
              <p className="mt-1 text-xs text-muted-foreground">Información comercial real disponible en el perfil público.</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 px-6 py-6 pb-10">
          <div className="text-center">
            <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.5rem] border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary shadow-[0_20px_34px_-28px_hsl(var(--primary)/0.7)]">
              <Store className="h-8 w-8" />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h4 className="font-display text-lg font-semibold text-foreground">{store.name}</h4>
                {store.isVerified && <ShieldCheck className="h-5 w-5 text-primary" />}
              </div>
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {store.sector ? `${store.sector}, Santo Domingo Este` : "Sector pendiente de completar"}
              </p>
              <span className="data-chip data-chip-accent">
                <Star className="h-3.5 w-3.5 fill-current" />
                {store.rating ? store.rating.toFixed(1) : "Sin rating"}
                <span className="text-muted-foreground">({store.reviewsCount ?? 0} opiniones)</span>
              </span>
            </div>
          </div>

          <div className="panel-muted p-4">
            <h5 className="font-display flex items-center gap-2 text-sm font-semibold text-foreground">
              <Truck className="h-4 w-4 text-primary" />Cobertura de entrega
            </h5>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Solo se muestran zonas realmente configuradas en el perfil público del proveedor.
            </p>
            {store.deliveryCoverage.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {store.deliveryCoverage.map((coverage) => (
                  <span key={coverage} className="data-chip">
                    {coverage}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Esta ferretería todavía no ha configurado su cobertura.</p>
            )}
          </div>

          <div className="panel-strong rounded-[1.5rem] p-4">
            <p className="section-label">Contacto</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Esta versión de producción ya no muestra teléfonos o WhatsApp inventados. Cuando el esquema incorpore datos de contacto reales, aparecerán aquí.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={onClose} className="w-full justify-center">
            Cerrar detalle
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailModal;
