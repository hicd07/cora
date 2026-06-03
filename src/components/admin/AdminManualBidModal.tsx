"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useCreateManualBidMutation } from "@/hooks/useAdmin";
import { BidRequest } from "@/lib/types";
import { showError, showSuccess } from "@/utils/toast";
import { Store, MapPin, Globe, Phone, Clock, Calculator, ExternalLink } from "lucide-react";

interface AdminManualBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidRequest: BidRequest;
  selectedStore?: any;
}

const DELIVERY_OPTIONS = [
  "Inmediata",
  "2 a 4 horas",
  "24 horas",
  "48 horas",
  "72 horas",
  "4-5 días hábiles",
  "1 semana",
];

export const AdminManualBidModal = ({
  isOpen,
  onClose,
  bidRequest,
  selectedStore,
}: AdminManualBidModalProps) => {
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("24 horas");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const createBid = useCreateManualBidMutation();

  useEffect(() => {
    if (selectedStore?.name) {
      setStoreName(selectedStore.name);
      
      const extractedPhone = 
        selectedStore.phone || 
        selectedStore.formatted_phone_number || 
        selectedStore.international_phone_number || 
        "";
        
      const extractedWebsite = 
        selectedStore.website || 
        selectedStore.url || 
        "";

      setPhone(extractedPhone);
      setWebsite(extractedWebsite);
    } else {
      setStoreName("");
      setPhone("");
      setWebsite("");
    }
    
    const initialPrices: Record<string, string> = {};
    bidRequest.items.forEach((item) => {
      initialPrices[item.id] = "";
    });
    setPrices(initialPrices);
  }, [selectedStore, bidRequest, isOpen]);

  const handlePriceChange = (itemId: string, value: string) => {
    setPrices((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async () => {
    if (!storeName) {
      showError("El nombre de la ferretería es obligatorio");
      return;
    }

    const items = bidRequest.items.map((item) => ({
      item_name: item.name,
      unit_price: parseFloat(prices[item.id] || "0"),
      is_available: (prices[item.id] || "0") !== "0",
    }));

    try {
      await createBid.mutateAsync({
        requestId: bidRequest.id,
        storeName,
        phone,
        website,
        deliveryTime,
        items,
        externalStoreId: selectedStore?.id || selectedStore?.place_id || null,
      });
      showSuccess("Cotización registrada exitosamente");
      onClose();
    } catch (e) {
      showError("Error al registrar la cotización");
    }
  };

  const total = Object.values(prices).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);

  const googleMapsUrl = selectedStore?.address || selectedStore?.formatted_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.address || selectedStore.formatted_address)}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Registrar Cotización
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-6 pb-6">
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-sm leading-tight">{selectedStore?.name || "Ingreso Manual"}</h3>
                {(selectedStore?.address || selectedStore?.formatted_address) && (
                  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                    {googleMapsUrl ? (
                      <a 
                        href={googleMapsUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:text-primary hover:underline transition-colors leading-relaxed"
                      >
                        {selectedStore.address || selectedStore.formatted_address}
                      </a>
                    ) : (
                      <span>{selectedStore.address || selectedStore.formatted_address}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="storeName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Ferretería</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Nombre de la tienda..."
                className="field-soft"
                disabled={!!selectedStore}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Sin teléfono"
                    className="field-soft pl-10 pr-10"
                  />
                  {phone && (
                    <a 
                      href={`tel:${phone.replace(/\s+/g, '')}`}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                      title="Llamar"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Sitio Web</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Sin sitio web"
                    className="field-soft pl-10 pr-10"
                  />
                  {website && (
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                      title="Ver sitio"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Tiempo de Entrega</Label>
              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                <SelectTrigger className="field-soft pl-10 relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Seleccionar tiempo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  {DELIVERY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="rounded-lg">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Precios por ítem</Label>
              <div className="space-y-2">
                {bidRequest.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-3 bg-background border rounded-xl shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.quantity} {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2 w-32">
                      <span className="text-xs font-medium text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={prices[item.id]}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-right font-medium rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between items-center">
            <span className="text-sm font-bold text-muted-foreground">Total Estimado:</span>
            <span className="text-lg font-black text-primary">${total.toLocaleString()}</span>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createBid.isPending}
            className="rounded-xl flex-1 bg-primary hover:bg-primary/90"
          >
            {createBid.isPending ? "Guardando..." : "Confirmar Cotización"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};