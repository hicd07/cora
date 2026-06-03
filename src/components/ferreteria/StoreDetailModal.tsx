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
import { Phone, MapPin, Globe, Star, ShieldCheck, ExternalLink } from "lucide-react";
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
      const message = encodeURIComponent(`Hola, vi tu oferta en Dyad para mi solicitud de materiales.`);
      window.open(`https://wa.me/${store.phone.replace(/\D/g, '')}?text=${message}`, "_blank");
    }
  };

  const googleMapsUrl = store.address || store.sector 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.sector || store.name)}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 gap-0">
        {store.coverUrl && (
          <div className="h-32 w-full relative overflow-hidden">
            <img 
              src={store.coverUrl} 
              alt={store.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        
        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-display text-xl font-bold">{store.name}</DialogTitle>
                  {store.isVerified && (
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
                {googleMapsUrl && (
                  <a 
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline group"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary/70" />
                    <span>{store.address || store.sector}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-lg text-sm font-semibold">
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
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary" asChild>
                <a href={store.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4" /> Visitar sitio web
                </a>
              </Button>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cobertura de Envío</h4>
              <div className="flex flex-wrap gap-2">
                {store.deliveryCoverage && store.deliveryCoverage.length > 0 ? (
                  store.deliveryCoverage.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Cobertura local en {store.sector || "su zona"}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}