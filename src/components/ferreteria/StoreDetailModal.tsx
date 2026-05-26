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
    <div className="modal-backdrop fixed inset-0 z-50 flex animate-in fade-in-0 duration-200 items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[hsl(var(--card)/0.94)] px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Proveedor verificado</p>
              <h3 className="font-display text-base font-semibold text-foreground">Detalle de proveedor</h3>
              <p className="mt-1 text-xs text-muted-foreground">Información comercial y cobertura de despacho.</p>
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
                {store.sector}, Santo Domingo Este
              </p>
              <span className="data-chip data-chip-accent">
                <Star className="h-3.5 w-3.5 fill-current" />{store.rating}
                <span className="text-muted-foreground">({store.reviewsCount} opiniones)</span>
              </span>
            </div>
          </div>

          <div className="panel-muted p-4">
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
                className="font-display inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:bg-[hsl(var(--surface-2))]"
              >
                <Phone className="h-4 w-4 text-primary" />Llamar
              </a>
              <a
                href={`https://wa.me/${whatsapp}?text=Hola%20${encodeURIComponent(store.name)},%20vi%20su%20perfil%20en%20PIDO%20y%20me%20gustaría%20cotizar%20unos%20materiales.`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-transparent bg-[hsl(var(--success))] px-4 py-3 text-sm font-semibold text-[hsl(var(--success-foreground))] transition-[transform,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-90"
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
