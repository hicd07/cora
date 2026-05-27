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
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-hidden overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="relative">
          {store.coverUrl ? (
            <div className="aspect-[16/8] w-full">
              <img src={store.coverUrl} alt={store.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="flex aspect-[16/8] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Store className="h-10 w-10 text-primary/20" />
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onClose} 
            aria-label="Cerrar"
            className="absolute right-4 top-4 border-white/20 bg-black/20 text-white backdrop-blur-md hover:bg-black/40"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-4 left-6 flex items-end gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border-4 border-background bg-[hsl(var(--primary)/0.14)] text-primary shadow-xl">
              <Store className="h-8 w-8" />
            </div>
            <div className="pb-1 text-white">
               <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Proveedor verificado</p>
               <h3 className="font-display text-lg font-semibold leading-tight">{store.name}</h3>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 pb-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {store.sector ? `${store.sector}, Santo Domingo Este` : "Sector pendiente"}
              </p>
              <div className="flex items-center gap-2">
                <span className="data-chip data-chip-accent">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {store.rating ? store.rating.toFixed(1) : "Sin rating"}
                </span>
                <span className="text-xs text-muted-foreground">({store.reviewsCount ?? 0} opiniones)</span>
              </div>
            </div>
            {store.isVerified && <ShieldCheck className="h-8 w-8 text-primary opacity-20" />}
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