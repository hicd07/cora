import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateRequestBidMutation } from "@/hooks/useRequestBids";
import { BidRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";

interface BidFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BidRequest | null;
}

interface ItemQuote {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  isAvailable: boolean;
}

const fieldClassName = "field-soft appearance-none pr-10";

export const BidFormModal: React.FC<BidFormModalProps> = ({ isOpen, onClose, request }) => {
  const createBid = useCreateRequestBidMutation();
  const [items, setItems] = useState<ItemQuote[]>([]);
  const [deliveryTime, setDeliveryTime] = useState("Mismo día (4-6 horas)");

  useEffect(() => {
    if (request) {
      setItems(
        request.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0,
          isAvailable: true,
        })),
      );
      setDeliveryTime("Mismo día (4-6 horas)");
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const handlePriceChange = (index: number, price: string) => {
    setItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              unitPrice: Number.parseFloat(price) || 0,
            }
          : item,
      ),
    );
  };

  const handleAvailabilityToggle = (index: number) => {
    setItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              isAvailable: !item.isAvailable,
              unitPrice: item.isAvailable ? 0 : item.unitPrice,
            }
          : item,
      ),
    );
  };

  const subtotal = items.reduce((accumulator, item) => {
    if (!item.isAvailable) return accumulator;
    return accumulator + item.unitPrice * item.quantity;
  }, 0);
  const itbis = subtotal * 0.18;
  const total = subtotal + itbis;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const activeItems = items.filter((item) => item.isAvailable);
    if (activeItems.length === 0) {
      showError("Debes cotizar al menos un ítem disponible.");
      return;
    }

    const hasZeroPrice = activeItems.some((item) => item.unitPrice <= 0);
    if (hasZeroPrice) {
      showError("Ingresa un precio válido para todos los materiales disponibles.");
      return;
    }

    try {
      await createBid.mutateAsync({
        requestId: request.id,
        deliveryTime,
        offers: items.map((item) => ({
          itemName: item.name,
          unitPrice: item.unitPrice,
          isAvailable: item.isAvailable,
        })),
      });
      showSuccess("Oferta enviada con datos reales.");
      onClose();
    } catch (error: any) {
      showError(error.message || "No se pudo enviar la cotización.");
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex animate-in fade-in-0 duration-200 items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[hsl(var(--card)/0.94)] px-6 py-4 backdrop-blur">
          <div>
            <p className="section-label">Nueva oferta</p>
            <h3 className="font-display text-base font-semibold text-foreground">Enviar cotización</h3>
            <p className="mt-1 max-w-[280px] truncate text-xs text-muted-foreground">Para: {request.title}</p>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 pb-10">
          <div className="space-y-3">
            <label className="section-label block">Desglose por ítem</label>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.name + index}
                  className={cn(
                    "rounded-[1.4rem] border p-4 transition-[transform,background-color,border-color,box-shadow] duration-200",
                    item.isAvailable
                      ? "panel-muted"
                      : "border-destructive/20 bg-destructive/10 opacity-90 shadow-[inset_0_1px_0_hsl(var(--surface-1)/0.55)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="mono-data mt-1 text-xs text-muted-foreground">
                        Cantidad: {item.quantity} {item.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAvailabilityToggle(index)}
                      className={cn("data-chip", item.isAvailable ? "data-chip-success" : "data-chip-danger")}
                    >
                      {item.isAvailable ? "Disponible" : "No disponible"}
                    </button>
                  </div>

                  {item.isAvailable ? (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="mono-data pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">RD$</span>
                        <Input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          placeholder="Precio unitario"
                          value={item.unitPrice || ""}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          className="pl-12"
                        />
                      </div>
                      <div className="min-w-[88px] text-right">
                        <p className="section-label">Subtotal</p>
                        <p className="mono-data mt-1 text-sm font-semibold text-foreground">
                          RD$ {(item.unitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Este ítem no se incluirá en la oferta persistida.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="section-label flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />Tiempo de entrega estimado
            </label>
            <select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={fieldClassName}>
              <option value="Inmediato (1-2 horas)">Inmediato (1-2 horas)</option>
              <option value="Mismo día (4-6 horas)">Mismo día (4-6 horas)</option>
              <option value="Siguiente día (24 horas)">Siguiente día (24 horas)</option>
              <option value="48 horas">48 horas</option>
            </select>
          </div>

          <div className="panel-strong rounded-[1.5rem] p-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal neto</span>
              <span className="mono-data">RD$ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>ITBIS (18%)</span>
              <span className="mono-data">RD$ {itbis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="my-3 border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-primary">Total cotizado</span>
              <span className="mono-data text-lg font-semibold text-foreground">RD$ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBid.isPending}>
              {createBid.isPending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <><Check className="h-4 w-4" />Enviar oferta</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidFormModal;
