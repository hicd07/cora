"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HardwareStore } from "@/lib/types";
import { Phone, MapPin, Globe, Star, ShieldCheck, ExternalLink, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StoreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: HardwareStore | null;
}

export function StoreDetailModal({ isOpen, onClose, store }: StoreDetailModalProps) {
  if (!store) return null;

  const handleCall = () => {
    if (store.phone) {
      window.open(`tel:${store.phone}`, "_self");
    }
  };

  const handleWhatsApp = () => {
    if (store.phone) {
      const message = encodeURIComponent(`Hola, vi tu oferta en CoRa para mi solicitud de materiales.`);
      window.open(`https://wa.me/${store.phone.replace(/\D/g, '')}?text=${message}`, "_blank");
    }
  };

  const address = (store.address && store.address !== "Dirección no disponible") ? store.address : null;
  const storeLocationLabel = address || store.sector;
  
  const mapsQuery = store.lat && store.lng 
    ? `${store.lat},${store.lng}` 
    : encodeURIComponent(`${store.name} ${storeLocationLabel || ''}`);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 gap-0 border-none shadow-2xl rounded-[2rem]">
        {/* Cabecera visual siempre presente */}
        <div className="h-40 w-full relative overflow-hidden bg-muted">
          {store.coverUrl ? (
            <img 
              src={store.coverUrl} 
              alt={store.name} 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background p-6">
               <Store className="h-14 w-14 text-primary/15 animate-pulse" />
               <div className="absolute inset-x-0 bottom-6 flex flex-col items-center text-center px-4">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/30">
                     Perfil en proceso de validación
                  </span>
               </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
            {!store.isVerified ? (
              <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                Proveedor Externo
              </Badge>
            ) : (
              <Badge className="bg-emerald-500 text-white border-none shadow-lg text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" /> Verificado
              </Badge>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-display text-xl font-bold truncate">{store.name}</DialogTitle>
                </div>
                {storeLocationLabel ? (
                  <a 
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline group"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                    <span className="truncate">{storeLocationLabel}</span>
                    <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Dirección no disponible</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-lg text-sm font-semibold shrink-0">
                <Star className="h-3.5 w-3.5 fill-yellow-500" />
                {store.rating || "5.0"}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleCall} variant="outline" className="gap-2 h-11 rounded-xl">
                <Phone className="h-4 w-4" /> Llamar
              </Button>
              <Button onClick={handleWhatsApp} className="gap-2 h-11 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white border-0">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="h-4 w-4 invert brightness-0" alt="WhatsApp" />
                WhatsApp
              </Button>
            </div>

            {store.website && (
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary h-10 rounded-xl" asChild>
                <a href={store.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4" /> Visitar sitio web
                </a>
              </Button>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Cobertura de Envío</h4>
              <div className="flex flex-wrap gap-2">
                {store.deliveryCoverage && store.deliveryCoverage.length > 0 ? (
                  store.deliveryCoverage.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-primary/5 text-primary border-primary/10 rounded-lg">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Cobertura local en {store.sector || "su zona"}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}