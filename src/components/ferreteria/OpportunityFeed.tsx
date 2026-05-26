import React, { useState } from "react";
import { Bell, BellOff, Clock, Gavel, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BidRequest } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface OpportunityFeedProps {
  requests: BidRequest[];
  onOpenBidModal: (request: BidRequest) => void;
}

export const OpportunityFeed: React.FC<OpportunityFeedProps> = ({ requests, onOpenBidModal }) => {
  const [isAvailable, setIsAvailable] = useState(true);

  const getDistance = (id: string) => {
    const distances: Record<string, string> = {
      "req-1": "1.2 km",
      "req-2": "2.8 km",
      "req-3": "4.5 km",
    };

    return distances[id] || "3.1 km";
  };

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expirado";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Menos de 1 hora";

    return `${hours} horas restantes`;
  };

  const activeRequests = requests.filter((request) => request.status === "active");

  return (
    <div className="space-y-4">
      <section className="app-shell p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[1.15rem]",
                isAvailable ? "bg-[hsl(var(--primary)/0.14)] text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {isAvailable ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="section-label">Alertas</p>
              <h3 className="font-display text-sm font-semibold text-foreground">Obras cercanas en tiempo real</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {isAvailable
                  ? "Recibiendo solicitudes activas para tu zona de cobertura."
                  : "Las alertas están pausadas temporalmente."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAvailable(!isAvailable)}
            className={cn(
              "toggle-track shrink-0",
              isAvailable ? "border-primary/20 bg-[hsl(var(--primary)/0.16)]" : "border-border bg-muted",
            )}
            aria-label="Alternar alertas"
          >
            <span className={cn("toggle-thumb", isAvailable ? "translate-x-7" : "translate-x-0")} />
          </button>
        </div>
      </section>

      {!isAvailable ? (
        <section className="panel-muted rounded-[1.75rem] border-dashed p-8 text-center">
          <BellOff className="mx-auto h-10 w-10 text-muted-foreground" />
          <h4 className="font-display mt-3 text-sm font-semibold text-foreground">Alertas pausadas</h4>
          <p className="mx-auto mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
            Activa las alertas para volver a visualizar y cotizar los pedidos activos en tu zona.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Feed de oportunidades</p>
              <h2 className="font-display text-base font-semibold text-foreground">Pedidos listos para cotizar</h2>
            </div>
            <span className="data-chip data-chip-accent">{activeRequests.length} activas</span>
          </div>

          {activeRequests.map((request) => (
            <article key={request.id} className="app-shell interactive-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="data-chip">
                  <MapPin className="h-3 w-3 text-primary" />A {getDistance(request.id)} de ti
                </span>
                <span className={cn("data-chip", getRemainingTime(request.expiresAt) === "Expirado" ? "data-chip-danger" : "data-chip-success")}>
                  <Clock className="h-3 w-3" />{getRemainingTime(request.expiresAt)}
                </span>
              </div>

              <div className="mt-4 space-y-1">
                <h3 className="font-display text-base font-semibold text-foreground">{request.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Sector: {request.sector} · {request.category}
                </p>
              </div>

              <div className="panel-muted mt-4 p-4">
                <p className="section-label flex items-center gap-1.5 text-[10px]">
                  <Package className="h-3.5 w-3.5 text-primary" />Materiales a cotizar ({request.itemsCount})
                </p>
                <ul className="mt-3 space-y-2">
                  {request.items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 border-b border-border/70 pb-2 text-sm last:border-b-0 last:pb-0">
                      <span className="text-foreground">{item.name}</span>
                      <span className="mono-data text-xs text-muted-foreground">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={() => onOpenBidModal(request)} className="mt-4 w-full justify-center">
                <Gavel className="h-4 w-4" />Cotizar pedido
              </Button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default OpportunityFeed;
