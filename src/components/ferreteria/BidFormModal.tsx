import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock, X, Truck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateRequestBidMutation, useUpdateRequestBidMutation, useFetchUserBid } from "@/hooks/useRequestBids";
import { BidRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { DELIVERY_OPTIONS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

interface BidFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: (BidRequest & { userBidId?: string | null }) | null;
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
  const updateBid = useUpdateRequestBidMutation();
  
  const [items, setItems] = useState<ItemQuote[]>([]);
  const [deliveryTime, setDeliveryTime] = useState<string>(DELIVERY_OPTIONS[1]);
  const [shippingCost, setShippingCost] = useState<string>("0");
  const [isLoadingData, setIsLoadingData] = useState(false);

  const hasExistingBid = !!request?.userBidId;

  useEffect(() => {
    if (isOpen && request) {
      if (hasExistingBid) {
        loadExistingBidData();
      } else {
        setItems(
          request.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: 0,
            isAvailable: true,
          })),
        );
        setDeliveryTime(DELIVERY_OPTIONS[1]);
        setShippingCost("0");
      }
    }
  }, [isOpen, request, hasExistingBid]);

  const loadExistingBidData = async () => {
    if (!request?.userBidId) return;
    setIsLoadingData(true);
    try {
      const { data: bid, error: bidError } = await supabase
        .from("hardware_bids")
        .select(`
          *,
          offers:bid_offers(*)
        `)
        .eq("id", request.userBidId)
        .single();

      if (bidError) throw bidError;

      setDeliveryTime(bid.delivery_time);
      setShippingCost(String(bid.shipping_cost || 0));

      const offerMap = new Map(bid.offers.map((o: any) => [o.item_name, o]));
      
      setItems(
        request.items.map((item) => {
          const offer = offerMap.get(item.name);
          return {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: offer ? Number(offer.unit_price) : 0,
            isAvailable: offer ? Boolean(offer.is_available) : true,
          };
        }),
      );
    } catch (err) {
      showError("No se pudo cargar la cotización anterior.");
    } finally {
      setIsLoadingData(false);
    }
  };

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
  const shipping = parseFloat(shippingCost) || 0;
  const total = subtotal + itbis + shipping;

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

    const toastId = showLoading(hasExistingBid ? "Actualizando cotización..." : "Enviando cotización...");

    try {
      const payload = {
        requestId: request.id,
        deliveryTime,
        shippingCost: shipping,
        offers: items.map((item) => ({
          itemName: item.name,
          unitPrice: item.unitPrice,
          isAvailable: item.isAvailable,
        })),
      };

      if (hasExistingBid) {
        await updateBid.mutateAsync({
          bidId: request.userBidId!,
          ...payload
        });
        showSuccess("Cotización actualizada correctamente.");
      } else {
        await createBid.mutateAsync(payload);
        showSuccess("Cotización enviada con éxito.");
      }
      
      dismissToast(toastId);
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || "No se pudo procesar la cotización.");
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex animate-in fade-in-0 duration-200 items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[hsl(var(--card)/0.94)] px-6 py-4 backdrop-blur">
          <div>
            <p className="section-label">{hasExistingBid ? "Actualización" : "Nueva oferta"}</p>
            <h3 className="font-display text-base font-semibold text-foreground">
              {hasExistingBid ? "Editar mi cotización" : "Enviar cotización"}
            </h3>
            <p className="mt-1 max-w-[280px] truncate text-xs text-muted-foreground">Para: {request.title}</p>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground font-medium">Cargando datos previos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 pb-10">
            {hasExistingBid && (
              <div className="panel-strong rounded-2xl bg-primary/5 border-primary/20 p-4 flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <p className="text-[11px] leading-relaxed text-primary/80">
                  <strong>Aviso:</strong> Si realizas cambios en el precio o condiciones, el ingeniero recibirá una notificación automática sobre la actualización de tu oferta.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="section-label block">Desglose por ítem</label>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.name + index}
                    className={cn(
                      "rounded-[1.4rem] border p-4 transition-all duration-200",
                      item.isAvailable
                        ? "panel-muted border-border"
                        : "border-destructive/20 bg-destructive/10 opacity-90",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="mono-data mt-1 text-xs text-muted-foreground">
                          {item.quantity} {item.unit}
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
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            placeholder="Precio unitario"
                            value={item.unitPrice || ""}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            className={cn(fieldClassName, "pl-12 pr-4 h-11")}
                          />
                        </div>
                        <div className="min-w-[88px] text-right">
                          <p className="section-label">Subtotal</p>
                          <p className="mono-data mt-1 text-sm font-semibold text-foreground">
                            RD$ {(item.unitPrice * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Este ítem no se incluirá en la oferta.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="section-label flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />Entrega
                </label>
                <select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={fieldClassName}>
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-primary" />Envío
                </label>
                <div className="relative">
                  <span className="mono-data pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">RD$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className={cn(fieldClassName, "pl-10 pr-4 h-11")}
                  />
                </div>
              </div>
            </div>

            <div className="panel-strong rounded-[1.5rem] p-5 space-y-2.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal neto</span>
                <span className="mono-data">RD$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>ITBIS (18%)</span>
                <span className="mono-data">RD$ {itbis.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Costo de envío</span>
                <span className="mono-data">RD$ {shipping.toLocaleString()}</span>
              </div>
              <div className="my-3 border-t border-border/60" />
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-primary">Total cotizado</span>
                <span className="mono-data text-lg font-bold text-foreground">RD$ {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createBid.isPending || updateBid.isPending}>
                <Check className="h-4 w-4" />
                {hasExistingBid ? "Actualizar oferta" : "Enviar oferta"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BidFormModal;