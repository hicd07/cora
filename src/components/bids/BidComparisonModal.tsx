import React, { useState } from "react";
import { Check, CheckCircle2, Info, MessageSquare, Phone, ShoppingBag, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BidRequest, HardwareBid, mockBidsForRequest1 } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";

interface BidComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BidRequest | null;
  onCompleteOrder: (requestId: string) => void;
}

const STORE_CONTACTS: Record<string, { phone: string; whatsapp: string }> = {
  "store-1": { phone: "+18095550123", whatsapp: "18095550123" },
  "store-2": { phone: "+18295550456", whatsapp: "18295550456" },
  "store-3": { phone: "+18495550789", whatsapp: "18495550789" },
};

export const BidComparisonModal: React.FC<BidComparisonModalProps> = ({ isOpen, onClose, request, onCompleteOrder }) => {
  if (!isOpen || !request) return null;

  const bids: HardwareBid[] =
    request.id === "req-1"
      ? mockBidsForRequest1
      : [
          {
            storeId: "store-1",
            storeName: "Ferretería El Progreso SDE",
            rating: 4.8,
            deliveryTime: "Mismo día (4-6 horas)",
            offers: request.items.map((item) => ({
              itemName: item.name,
              unitPrice: Math.round(100 + Math.random() * 500),
              isAvailable: true,
            })),
          },
          {
            storeId: "store-2",
            storeName: "Mega Ferretería Oriental",
            rating: 4.5,
            deliveryTime: "Siguiente día (24 horas)",
            offers: request.items.map((item) => ({
              itemName: item.name,
              unitPrice: Math.round(90 + Math.random() * 520),
              isAvailable: Math.random() > 0.15,
            })),
          },
        ];

  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initialSelections: Record<string, string> = {};
    request.items.forEach((item) => {
      const availableBid = bids.find((bid) => bid.offers.find((offer) => offer.itemName === item.name)?.isAvailable);
      if (availableBid) {
        initialSelections[item.name] = availableBid.storeId;
      }
    });
    return initialSelections;
  });
  const [isCheckout, setIsCheckout] = useState(false);

  const handleSelectProvider = (itemName: string, storeId: string) => {
    setSelections((prev) => ({ ...prev, [itemName]: storeId }));
  };

  const getStoreTotals = () => {
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
      totals[selectedStoreId].items.push({
        name: item.name,
        qty: item.quantity,
        unit: item.unit,
        price: offer.unitPrice,
      });
    });

    return totals;
  };

  const storeTotals = getStoreTotals();
  const generalSubtotal = Object.values(storeTotals).reduce((acc, current) => acc + current.subtotal, 0);
  const generalItbis = generalSubtotal * 0.18;
  const generalTotal = generalSubtotal + generalItbis;

  const handleFinalizePurchase = () => {
    onCompleteOrder(request.id);
    showSuccess("¡Pedido mixto formalizado! Órdenes de compra enviadas a cada ferretería.");
    onClose();
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <p className="section-label">Bid matrix</p>
            <h3 className="font-display text-base font-semibold text-foreground">
              {isCheckout ? "Confirmar pedido mixto" : "Optimizar compra"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isCheckout ? "Desglose por proveedor seleccionado" : "Compara precios por ítem y elige la mejor combinación."}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!isCheckout ? (
          <div className="space-y-5 px-6 py-6 pb-10">
            <div className="panel-muted rounded-lg p-4">
              <p className="section-label">Proyecto</p>
              <h4 className="font-display mt-2 text-sm font-semibold text-foreground">{request.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground">Destino: {request.deliveryAddress}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="section-label block">Comparativa de precios</label>
                <span className="data-chip data-chip-accent">{bids.length} ofertas</span>
              </div>

              <div className="-mx-6 overflow-x-auto px-6 pb-2">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-20 min-w-[180px] bg-muted/95">Material</TableHead>
                      {bids.map((bid) => (
                        <TableHead key={bid.storeId} className="min-w-[180px]">
                          <div className="space-y-1">
                            <p className="font-display text-sm font-semibold normal-case tracking-tight text-foreground">{bid.storeName}</p>
                            <p className="text-[10px] normal-case tracking-normal text-muted-foreground">{bid.deliveryTime}</p>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.items.map((item, itemIndex) => (
                      <TableRow key={itemIndex} className={itemIndex % 2 === 1 ? "bg-[hsl(var(--table-stripe))]" : ""}>
                        <TableCell className="sticky left-0 z-10 min-w-[180px] border-r border-border bg-card align-top">
                          <p className="font-display text-sm font-semibold text-foreground">{item.name}</p>
                          <p className="mono-data mt-1 text-xs text-muted-foreground">
                            {item.quantity} {item.unit}
                          </p>
                        </TableCell>
                        {bids.map((bid) => {
                          const offer = bid.offers.find((currentOffer) => currentOffer.itemName === item.name);
                          const isSelected = selections[item.name] === bid.storeId;

                          if (!offer || !offer.isAvailable) {
                            return (
                              <TableCell key={bid.storeId} className="align-top">
                                <div className="rounded-md border border-dashed border-border bg-muted/70 p-3 text-center text-xs text-muted-foreground">
                                  <p className="font-display text-sm font-semibold text-foreground/60">N/D</p>
                                  <p className="mt-1">Sin disponibilidad</p>
                                </div>
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={bid.storeId} className="align-top">
                              <button
                                type="button"
                                onClick={() => handleSelectProvider(item.name, bid.storeId)}
                                className={cn(
                                  "flex min-h-[108px] w-full flex-col justify-between rounded-md border p-3 text-left transition-colors",
                                  isSelected
                                    ? "border-[hsl(var(--success))] bg-[hsl(var(--success)/0.10)]"
                                    : "border-border bg-card hover:bg-accent/40",
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="section-label text-[10px]">Oferta</span>
                                  {isSelected && <Check className="h-4 w-4 text-[hsl(var(--success))]" />}
                                </div>
                                <div>
                                  <p className="mono-data text-base font-semibold text-foreground">RD$ {offer.unitPrice}</p>
                                  <p className="mono-data mt-1 text-xs text-muted-foreground">
                                    Total: RD$ {(offer.unitPrice * item.quantity).toLocaleString()}
                                  </p>
                                </div>
                              </button>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-2">
              <label className="section-label block">Distribución del pedido</label>
              <div className="space-y-2">
                {bids.map((bid) => {
                  const totalAllocated = storeTotals[bid.storeId]?.subtotal || 0;
                  const itemsCount = storeTotals[bid.storeId]?.items.length || 0;
                  if (itemsCount === 0) return null;

                  return (
                    <div key={bid.storeId} className="panel-muted flex items-center justify-between rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[hsl(var(--primary)/0.14)] text-primary">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-display text-sm font-semibold text-foreground">{bid.storeName}</p>
                          <p className="text-xs text-muted-foreground">{itemsCount} materiales asignados</p>
                        </div>
                      </div>
                      <p className="mono-data text-sm font-semibold text-foreground">RD$ {totalAllocated.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-[hsl(var(--surface-3))] p-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal neto</span>
                <span className="mono-data">RD$ {generalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>ITBIS (18%)</span>
                <span className="mono-data">RD$ {generalItbis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="my-3 border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-primary">Total estimado</span>
                <span className="mono-data text-lg font-semibold text-foreground">
                  RD$ {generalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <Button type="button" onClick={() => setIsCheckout(true)} className="w-full justify-center">
              <ShoppingBag className="h-4 w-4" />Contactar proveedores
            </Button>
          </div>
        ) : (
          <div className="space-y-5 px-6 py-6 pb-10">
            <div className="rounded-lg border border-primary/20 bg-[hsl(var(--primary)/0.1)] p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground">Órdenes múltiples</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Se generarán órdenes de compra independientes para cada ferretería seleccionada. Cada una recibirá únicamente los materiales asignados.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="section-label block">Desglose de órdenes</label>
              {bids.map((bid) => {
                const data = storeTotals[bid.storeId];
                if (!data || data.items.length === 0) return null;

                const contact = STORE_CONTACTS[bid.storeId] || { phone: "+18095550100", whatsapp: "18095550100" };
                const orderReference = `OC-${request.id.slice(-4)}-${bid.storeId.slice(-1)}`;

                return (
                  <div key={bid.storeId} className="app-shell rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        <span className="font-display text-sm font-semibold text-foreground">{bid.storeName}</span>
                      </div>
                      <span className="section-label">{orderReference}</span>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {data.items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-foreground">
                            {item.name} ({item.qty} {item.unit})
                          </span>
                          <span className="mono-data text-xs text-muted-foreground">
                            RD$ {(item.price * item.qty).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="panel-muted mt-4 flex items-center justify-between rounded-md px-3 py-2.5 text-sm">
                      <span className="font-display font-semibold text-foreground">Subtotal orden</span>
                      <span className="mono-data font-semibold text-foreground">RD$ {data.subtotal.toLocaleString()}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${contact.phone}`}
                        className="font-display inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                      >
                        <Phone className="h-3.5 w-3.5 text-primary" />Llamar
                      </a>
                      <a
                        href={`https://wa.me/${contact.whatsapp}?text=Hola,%20me%20gustaría%20coordinar%20la%20entrega%20del%20pedido%20de%20ConstruBid.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-transparent bg-[hsl(var(--success))] px-3 py-2 text-xs font-semibold text-[hsl(var(--success-foreground))] transition-opacity hover:opacity-90"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-primary/20 bg-[hsl(var(--surface-3))] p-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal consolidado</span>
                <span className="mono-data">RD$ {generalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>ITBIS consolidado</span>
                <span className="mono-data">RD$ {generalItbis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="my-3 border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-primary">Total consolidado</span>
                <span className="mono-data text-lg font-semibold text-foreground">
                  RD$ {generalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCheckout(false)}>
                Atrás
              </Button>
              <Button type="button" onClick={handleFinalizePurchase}>
                <CheckCircle2 className="h-4 w-4" />Finalizar compra
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidComparisonModal;
