import React, { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Info, RefreshCw, Store, X, Award, AlertTriangle, TrendingDown, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompleteBidRequestMutation } from "@/hooks/useBidRequests";
import { useRequestBids } from "@/hooks/useRequestBids";
import { BidRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import { DELIVERY_OPTIONS } from "@/lib/constants";

interface BidComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BidRequest | null;
}

// Helper to map delivery time strings to numeric hours for comparison
const getDeliveryWeight = (time: string): number => {
  const t = time.toLowerCase();
  if (t.includes("1-2") || t.includes("inmediato")) return 2;
  if (t.includes("4-6") || t.includes("mismo d")) return 6;
  if (t.includes("24") || t.includes("siguiente d")) return 24;
  if (t.includes("48")) return 48;
  if (t.includes("72")) return 72;
  return 120; // Default fallback / "A coordinar"
};

const getFriendlyDeliveryTime = (weight: number): string => {
  if (weight <= 2) return DELIVERY_OPTIONS[0];
  if (weight <= 6) return DELIVERY_OPTIONS[1];
  if (weight <= 24) return DELIVERY_OPTIONS[2];
  if (weight <= 48) return DELIVERY_OPTIONS[3];
  if (weight <= 72) return DELIVERY_OPTIONS[4];
  return "A coordinar / Variable";
};

export const BidComparisonModal: React.FC<BidComparisonModalProps> = ({ isOpen, onClose, request }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isCheckout, setIsCheckout] = useState(false);
  const completeRequest = useCompleteBidRequestMutation();
  const { data: bids = [], isLoading, error, refetch, isFetching } = useRequestBids(request?.id);

  useEffect(() => {
    setSelections({});
    setIsCheckout(false);
  }, [request?.id, isOpen]);

  // Auto-select the cheapest option for each item when bids load to improve UX
  useEffect(() => {
    if (request && bids.length > 0 && Object.keys(selections).length === 0) {
      const initialSelections: Record<string, string> = {};
      request.items.forEach((item) => {
        let cheapestStoreId = "";
        let minPrice = Number.MAX_VALUE;

        bids.forEach((bid) => {
          const offer = bid.offers.find((o) => o.itemName === item.name);
          if (offer && offer.isAvailable && offer.unitPrice < minPrice) {
            minPrice = offer.unitPrice;
            cheapestStoreId = bid.storeId;
          }
        });

        if (cheapestStoreId) {
          initialSelections[item.name] = cheapestStoreId;
        }
      });
      setSelections(initialSelections);
    }
  }, [bids, request]);

  const storeTotals = useMemo(() => {
    if (!request) return {} as Record<string, { subtotal: number; items: { name: string; qty: number; unit: string; price: number }[] }>;

    const totals: Record<string, { subtotal: number; items: { name: string; qty: number; unit: string; price: number }[] }> = {};
    bids.forEach((bid) => {
      totals[bid.storeId] = { subtotal: 0, items: [] };
    });

    request.items.forEach((item) => {
      const selectedStoreId = selections[item.name];
      if (!selectedStoreId) return;

      const bid = bids.find((currentBid) => currentBid.storeId === selectedStoreId);
      const offer = bid?.offers.find((currentOffer) => currentOffer.itemName === item.name);
      if (!offer || !offer.isAvailable) return;

      const lineTotal = offer.unitPrice * item.quantity;
      totals[selectedStoreId].subtotal += lineTotal;
      totals[selectedStoreId].items.push({ name: item.name, qty: item.quantity, unit: item.unit, price: offer.unitPrice });
    });

    return totals;
  }, [bids, request, selections]);

  // Calculate the maximum delivery time among all selected providers (parallel delivery)
  const totalDeliveryTime = useMemo(() => {
    let maxWeight = 0;
    let hasSelection = false;

    bids.forEach((bid) => {
      const allocatedItems = storeTotals[bid.storeId]?.items.length || 0;
      if (allocatedItems > 0) {
        hasSelection = true;
        const weight = getDeliveryWeight(bid.deliveryTime);
        if (weight > maxWeight) {
          maxWeight = weight;
        }
      }
    });

    if (!hasSelection) return "Sin selección";
    return getFriendlyDeliveryTime(maxWeight);
  }, [bids, storeTotals]);

  // Helper to find the cheapest price for a specific item
  const cheapestPrices = useMemo(() => {
    const cheapest: Record<string, number> = {};
    if (!request) return cheapest;

    request.items.forEach((item) => {
      let minPrice = Number.MAX_VALUE;
      bids.forEach((bid) => {
        const offer = bid.offers.find((o) => o.itemName === item.name);
        if (offer && offer.isAvailable && offer.unitPrice < minPrice) {
          minPrice = offer.unitPrice;
        }
      });
      if (minPrice !== Number.MAX_VALUE) {
        cheapest[item.name] = minPrice;
      }
    });
    return cheapest;
  }, [bids, request]);

  if (!isOpen || !request) return null;

  const generalSubtotal = Object.values(storeTotals).reduce((acc, current) => acc + current.subtotal, 0);
  const generalItbis = generalSubtotal * 0.18;
  const generalTotal = generalSubtotal + generalItbis;

  const handleSelectProvider = (itemName: string, storeId: string) => {
    setSelections((prev) => ({ ...prev, [itemName]: storeId }));
  };

  const handleFinalizePurchase = async () => {
    try {
      await completeRequest.mutateAsync(request.id);
      showSuccess("Compra finalizada. El historial y las notificaciones ya se actualizaron.");
      onClose();
    } catch (err: any) {
      showError(err.message || "No se pudo finalizar la compra.");
    }
  };

  const selectedStoresCount = Object.values(storeTotals).filter((store) => store.items.length > 0).length;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex animate-in fade-in-0 duration-200 items-end justify-center">
      <div className="modal-sheet max-h-[94vh] w-full max-w-md overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[hsl(var(--card)/0.94)] px-6 py-4 backdrop-blur">
          <div>
            <p className="section-label">Comparativa real</p>
            <h3 className="font-display text-base font-semibold text-foreground">{isCheckout ? "Confirmar compra" : "Optimizar compra"}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isCheckout ? "Resumen consolidado de los proveedores seleccionados." : "Selecciona la mejor oferta para cada material de tu lista."}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar" className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 px-6 py-6 pb-10">
          <div className="panel-muted p-4">
            <p className="section-label">Proyecto</p>
            <h4 className="font-display mt-1 text-sm font-semibold text-foreground">{request.title}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">Destino: {request.deliveryAddress}</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="panel-muted animate-pulse p-4">
                  <div className="h-4 w-32 rounded-full bg-muted" />
                  <div className="mt-3 h-16 rounded-[1rem] bg-muted" />
                </div>
              ))}
            </div>
          ) : error ? (
            <section className="panel-muted rounded-[1.6rem] border-dashed p-8 text-center">
              <h4 className="font-display text-sm font-semibold text-foreground">No pudimos cargar las ofertas</h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                La consulta a la base falló. Verifica tu conexión y reintenta sin cerrar la pantalla.
              </p>
              <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="mt-4 gap-2">
                <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                Reintentar
              </Button>
            </section>
          ) : bids.length === 0 ? (
            <section className="panel-muted rounded-[1.6rem] border-dashed p-8 text-center">
              <h4 className="font-display text-sm font-semibold text-foreground">Aún no hay ofertas reales</h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Esta solicitud todavía no recibió cotizaciones guardadas en Supabase. Cuando lleguen, se compararán aquí automáticamente.
              </p>
            </section>
          ) : !isCheckout ? (
            <>
              {/* Mobile-First Vertical Comparison List */}
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <label className="section-label block">Materiales y Ofertas</label>
                  <span className="data-chip data-chip-accent">{bids.length} ofertas</span>
                </div>

                {request.items.map((item, itemIndex) => {
                  const selectedStoreId = selections[item.name];
                  const cheapestPrice = cheapestPrices[item.name];

                  return (
                    <div key={item.id ?? item.name} className="app-shell p-4 space-y-3 border-border/80">
                      {/* Item Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5">
                        <div>
                          <h4 className="font-display text-sm font-bold text-foreground">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Cantidad requerida</p>
                        </div>
                        <span className="data-chip bg-primary/10 text-primary border-primary/20">
                          {item.quantity} {item.unit}
                        </span>
                      </div>

                      {/* Offers List for this Item */}
                      <div className="space-y-2">
                        {bids.map((bid) => {
                          const offer = bid.offers.find((o) => o.itemName === item.name);
                          const isSelected = selectedStoreId === bid.storeId;
                          const isCheapest = offer && offer.isAvailable && offer.unitPrice === cheapestPrice;

                          if (!offer || !offer.isAvailable) {
                            return (
                              <div
                                key={bid.id}
                                className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 p-3 opacity-60"
                              >
                                <div className="flex items-center gap-2">
                                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground">{bid.storeName}</span>
                                </div>
                                <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">No disponible</span>
                              </div>
                            );
                          }

                          const lineTotal = offer.unitPrice * item.quantity;

                          return (
                            <button
                              key={bid.id}
                              type="button"
                              onClick={() => handleSelectProvider(item.name, bid.storeId)}
                              className={cn(
                                "w-full flex flex-col p-3 rounded-xl border text-left transition-all duration-200 relative overflow-hidden",
                                isSelected
                                  ? "border-[hsl(var(--success))] bg-[hsl(var(--success)/0.06)] shadow-[0_8px_20px_-12px_hsl(var(--success)/0.3)]"
                                  : "border-border bg-card hover:border-primary/30 hover:bg-accent/10"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 w-full">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Store className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", isSelected ? "text-[hsl(var(--success))]" : "text-muted-foreground")} />
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold text-foreground truncate block">{bid.storeName}</span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Clock className="h-3 w-3 text-primary" /> {bid.deliveryTime}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isCheapest && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                                      <TrendingDown className="h-2.5 w-2.5" /> Mejor Precio
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--success))] text-white">
                                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2.5 flex items-baseline justify-between w-full border-t border-border/40 pt-2">
                                <p className="text-xs text-muted-foreground">
                                  RD$ {offer.unitPrice.toLocaleString()} / {item.unit}
                                </p>
                                <p className="mono-data text-sm font-bold text-foreground">
                                  Total: RD$ {lineTotal.toLocaleString()}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Distribution Summary */}
              <div className="space-y-2 pt-2">
                <label className="section-label block">Distribución del pedido</label>
                <div className="space-y-2">
                  {bids.map((bid) => {
                    const totalAllocated = storeTotals[bid.storeId]?.subtotal || 0;
                    const itemsCount = storeTotals[bid.storeId]?.items.length || 0;
                    if (itemsCount === 0) return null;

                    return (
                      <div key={bid.id} className="panel-muted flex items-center justify-between p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)] text-primary">
                            <Store className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-display text-xs font-bold text-foreground">{bid.storeName}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-primary" /> {bid.deliveryTime}
                            </p>
                          </div>
                        </div>
                        <p className="mono-data text-xs font-bold text-foreground">RD$ {totalAllocated.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals Card */}
              <div className="panel-strong rounded-[1.5rem] p-4 space-y-2.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal neto</span>
                  <span className="mono-data">RD$ {generalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>ITBIS (18%)</span>
                  <span className="mono-data">RD$ {generalItbis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Entrega estimada total</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {totalDeliveryTime}
                  </span>
                </div>
                <div className="border-t border-border/60 my-1" />
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-primary">Total estimado</span>
                  <span className="mono-data text-base font-bold text-foreground">RD$ {generalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Button type="button" onClick={() => setIsCheckout(true)} disabled={generalSubtotal <= 0} className="w-full h-12 rounded-xl justify-center text-sm font-semibold">
                Confirmar selección
              </Button>
            </>
          ) : (
            <>
              <div className="panel-strong rounded-[1.5rem] border-primary/20 bg-[hsl(var(--primary)/0.06)] p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-display text-sm font-bold text-foreground">Resumen real de compra</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Vas a cerrar la solicitud con {selectedStoresCount} proveedor{selectedStoresCount === 1 ? "" : "es"} seleccionado{selectedStoresCount === 1 ? "" : "s"}. Al confirmar, el estado pasará a compra finalizada y se emitirán notificaciones reales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {bids.map((bid) => {
                  const data = storeTotals[bid.storeId];
                  if (!data || data.items.length === 0) return null;

                  return (
                    <div key={bid.id} className="app-shell p-4">
                      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-primary" />
                          <span className="font-display text-sm font-semibold text-foreground">{bid.storeName}</span>
                        </div>
                        <span className="section-label flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" /> {bid.deliveryTime}
                        </span>
                      </div>

                      <ul className="mt-3 space-y-2">
                        {data.items.map((item) => (
                          <li key={`${bid.id}-${item.name}`} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-foreground">{item.name} ({item.qty} {item.unit})</span>
                            <span className="mono-data text-xs text-muted-foreground">RD$ {(item.price * item.qty).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="panel-muted mt-4 flex items-center justify-between px-3 py-3 text-sm">
                        <span className="font-display font-semibold text-foreground">Subtotal orden</span>
                        <span className="mono-data font-semibold text-foreground">RD$ {data.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="panel-strong rounded-[1.5rem] p-4 space-y-2.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal consolidado</span>
                  <span className="mono-data">RD$ {generalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>ITBIS consolidado</span>
                  <span className="mono-data">RD$ {generalItbis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Entrega estimada total</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {totalDeliveryTime}
                  </span>
                </div>
                <div className="my-3 border-t border-border" />
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-primary">Total consolidado</span>
                  <span className="mono-data text-lg font-semibold text-foreground">RD$ {generalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCheckout(false)} className="h-12 rounded-xl">
                  Atrás
                </Button>
                <Button type="button" onClick={handleFinalizePurchase} disabled={completeRequest.isPending} className="h-12 rounded-xl">
                  {completeRequest.isPending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <><CheckCircle2 className="h-4 w-4" />Finalizar compra</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};