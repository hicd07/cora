import React from "react";
import { MapPin, ShieldCheck, Star, Store, Truck, X, Phone, Globe, ExternalLink } from "lucide-react";
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
               <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                 {store.isVerified ? "Proveedor verificado" : "Proveedor externo"}
               </p>
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

          <div className="panel-muted p-4 space-y-4">
            <h5 className="font-display flex items-center gap-2 text-sm font-semibold text-foreground">
              <Phone className="h-4 w-4 text-primary" />Contacto Directo
            </h5>
            
            <div className="space-y-3">
              {store.phone ? (
                <a 
                  href={`tel:${store.phone}`} 
                  className="flex items-center justify-between gap-3 p-3 bg-background rounded-xl border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Llamar ahora</p>
                      <p className="text-sm text-muted-foreground">{store.phone}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </a>
              ) : (
                <p className="text-xs text-muted-foreground italic px-1">Teléfono no disponible en el listado público.</p>
              )}

              {store.website ? (
                <a 
                  href={store.website} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 p-3 bg-background rounded-xl border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-accent/10 p-2 rounded-lg text-accent-foreground">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Sitio web oficial</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{store.website}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                </a>
              ) : (
                <p className="text-xs text-muted-foreground italic px-1">Sin sitio web registrado.</p>
              )}
            </div>
          </div>

          <div className="panel-muted p-4">
            <h5 className="font-display flex items-center gap-2 text-sm font-semibold text-foreground">
              <Truck className="h-4 w-4 text-primary" />Cobertura de entrega
            </h5>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {store.isVerified 
                ? "Zonas configuradas en el perfil público del proveedor." 
                : "Información sujeta a disponibilidad del proveedor externo."}
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
              <p className="mt-4 text-sm text-muted-foreground">Cobertura no especificada.</p>
            )}
          </div>

          <Button type="button" variant="outline" onClick={onClose} className="w-full justify-center rounded-xl">
            Cerrar detalle
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailModal;