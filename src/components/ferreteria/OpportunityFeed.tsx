import React, { useState } from "react";
import { Bell, BellOff, Clock3, Gavel, Package, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BidRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

interface OpportunityFeedProps {
  requests: BidRequest[];
  onOpenBidModal: (request: BidRequest) => void;
  isLoading?: boolean;
  hasError?: boolean;
}

const getRemainingTime = (expiresAt: string) => {
  const expiresDate = new Date(expiresAt);
  if (expiresDate.getTime() <= Date.now()) return "Expirada";
  return `Cierra ${formatDistanceToNowStrict(expiresDate, { addSuffix: true, locale: es })}`;
};

export const OpportunityFeed: React.FC<OpportunityFeedProps> = ({ requests, onOpenBidModal, isLoading = false, hasError = false }) => {
  const [isAvailable, setIsAvailable] = useState(true);
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
              <h3 className="font-display text-sm font-semibold text-foreground">Disponibilidad en esta sesión</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {isAvailable
                  ? "Mostrando solicitudes activas que puedes cotizar ahora mismo."
                  : "Las alertas visuales están pausadas solo en este dispositivo."}
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
            aria-label="Alternar alertas locales"
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
            Puedes volver a activarlas cuando quieras. Tus datos y oportunidades reales no se pierden.
          </p>
        </section>
      ) : isLoading ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Feed de oportunidades</p>
              <h2 className="font-display text-base font-semibold text-foreground">Pedidos listos para cotizar</h2>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {Array.from({ length: 3 }).map((_, index) => (
            <article key={index} className="app-shell p-5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="panel-muted mt-4 space-y-3 p-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="mt-4 h-10 w-full rounded-full" />
            </article>
          ))}
        </section>
      ) : hasError ? (
        <section className="panel-muted rounded-[1.8rem] border-dashed p-8 text-center">
          <Warehouse className="mx-auto h-10 w-10 text-muted-foreground" />
          <h4 className="font-display mt-3 text-sm font-semibold text-foreground">No pudimos cargar oportunidades</h4>
          <p className="mx-auto mt-1 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
            Estamos trayendo menos resultados por carga, pero ahora mismo la consulta falló. Intenta refrescar la vista.
          </p>
        </section>
      ) : activeRequests.length === 0 ? (
        <section className="panel-muted rounded-[1.8rem] border-dashed p-8 text-center">
          <Warehouse className="mx-auto h-10 w-10 text-muted-foreground" />
          <h4 className="font-display mt-3 text-sm font-semibold text-foreground">Sin oportunidades activas</h4>
          <p className="mx-auto mt-1 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
            Aún no hay solicitudes activas dentro del lote cargado. Cuando aparezcan nuevas oportunidades, las verás aquí.
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
                <span className="data-chip">{request.category}</span>
                <span className={cn("data-chip", getRemainingTime(request.expiresAt) === "Expirada" ? "data-chip-danger" : "data-chip-success")}>
                  <Clock3 className="h-3 w-3" />
                  {getRemainingTime(request.expiresAt)}
                </span>
              </div>

              <div className="mt-4 space-y-1">
                <h3 className="font-display text-base font-semibold text-foreground">{request.title}</h3>
                <p className="text-xs text-muted-foreground">Sector: {request.sector} · Entrega: {request.deliveryAddress}</p>
              </div>

              <div className="panel-muted mt-4 p-4">
                <p className="section-label flex items-center gap-1.5 text-[10px]">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  Materiales a cotizar ({request.itemsCount})
                </p>
                <ul className="mt-3 space-y-2">
                  {request.items.map((item) => (
                    <li key={item.id ?? item.name} className="flex items-center justify-between gap-3 border-b border-border/70 pb-2 text-sm last:border-b-0 last:pb-0">
                      <span className="text-foreground">{item.name}</span>
                      <span className="mono-data text-xs text-muted-foreground">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={() => onOpenBidModal(request)} className="mt-4 w-full justify-center">
                <Gavel className="h-4 w-4" />
                Cotizar pedido
              </Button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default OpportunityFeed;