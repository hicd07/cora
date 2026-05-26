import React from "react";
import { MapPin, MessageSquare, Phone, ShieldCheck, Star, Store, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreDetailProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    rating: number;
    reviewsCount: number;
    sector: string;
    deliveryCoverage: string[];
    isVerified: boolean;
  } | null;
}

export const StoreDetailModal: React.FC<StoreDetailProps> = ({ isOpen, onClose, store }) => {
  if (!isOpen || !store) return null;

  const phone = "+18095550123";
  const whatsapp = "18095550123";

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Proveedor verificado</p>
              <h3 className="font-display text-base font-semibold text-foreground">Detalle de proveedor</h3>
              <p className="mt-1 text-xs text-muted-foreground">Información comercial y cobertura de despacho.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 px-6 py-6 pb-10">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary">
              <Store className="h-8 w-8" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h4 className="font-display text-lg font-semibold text-foreground">{store.name}</h4>
                {store.isVerified && <ShieldCheck className="h-5 w-5 text-primary" />}
              </div>
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {store.sector}, Santo Domingo Este
              </p>
              <span className="data-chip data-chip-accent">
                <Star className="h-3.5 w-3.5 fill-current" />{store.rating}
                <span className="text-muted-foreground">({store.reviewsCount} opiniones)</span>
              </span>
            </div>
          </div>

          <div className="panel-muted rounded-lg p-4">
            <h5 className="font-display flex items-center gap-2 text-sm font-semibold text-foreground">
              <Truck className="h-4 w-4 text-primary" />Cobertura de entrega
            </h5>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Este proveedor realiza despachos directos en los siguientes sectores de Santo Domingo Este.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {store.deliveryCoverage.map((coverage, index) => (
                <span key={index} className="data-chip">
                  {coverage}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="section-label">Canales de contacto</p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${phone}`}
                className="font-display inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <Phone className="h-4 w-4 text-primary" />Llamar
              </a>
              <a
                href={`https://wa.me/${whatsapp}?text=Hola%20${encodeURIComponent(store.name)},%20vi%20su%20perfil%20en%20PIDO%20y%20me%20gustaría%20cotizar%20unos%20materiales.`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-transparent bg-[hsl(var(--success))] px-4 py-3 text-sm font-semibold text-[hsl(var(--success-foreground))] transition-opacity hover:opacity-90"
              >
                <MessageSquare className="h-4 w-4" />WhatsApp
              </a>
            </div>
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
