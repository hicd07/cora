"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Calendar, ClipboardList, Eye, EyeOff, MapPin, Package, Plus, RefreshCw, Settings, Store, TriangleAlert } from "lucide-react";
import BidComparisonModal from "@/components/bids/BidComparisonModal";
import CreateBidModal from "@/components/bids/CreateBidModal";
import { useSessionContext } from "@/components/auth/SessionContext";
import OpportunityFeed from "@/components/ferreteria/OpportunityFeed";
import BidFormModal from "@/components/ferreteria/BidFormModal";
import ProviderProfileModal from "@/components/ferreteria/ProviderProfileModal";
import StoreDetailModal from "@/components/ferreteria/StoreDetailModal";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBidRequests } from "@/hooks/useBidRequests";
import { useMarketplaceStores } from "@/hooks/useMarketplaceStores";
import { BidRequest, HardwareStore } from "@/lib/types";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";

const EmptyState = ({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) => (
  <section className="panel-muted rounded-[1.8rem] border-dashed p-8 text-center">
    <div className="panel-strong mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[hsl(var(--surface-1))]">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="font-display mt-4 text-base font-semibold text-foreground">{title}</h3>
    <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </section>
);

const Index = () => {
  const { profile, user, signOut, updateProfile } = useSessionContext();
  const role = profile?.user_type === "hardware" ? "hardware" : "engineer";
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "bids");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequestForBid, setSelectedRequestForBid] = useState<BidRequest | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedRequestForComparison, setSelectedRequestForComparison] = useState<BidRequest | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [selectedStore, setSelectedStore] = useState<HardwareStore | null>(null);
  const [isStoreDetailOpen, setIsStoreDetailOpen] = useState(false);

  const bidRequestsQuery = useBidRequests();
  const marketplaceStoresQuery = useMarketplaceStores();

  const bidRequests = bidRequestsQuery.data ?? [];
  const marketplaceStores = marketplaceStoresQuery.data ?? [];

  const engineerRequests = useMemo(
    () => bidRequests.filter((request) => request.ownerUserId === user?.id),
    [bidRequests, user?.id],
  );
  const hardwareOpportunities = useMemo(
    () => bidRequests.filter((request) => request.status === "active" && request.ownerUserId !== user?.id),
    [bidRequests, user?.id],
  );
  const orders = useMemo(
    () => (role === "engineer" ? engineerRequests : bidRequests).filter((request) => request.status === "completed"),
    [bidRequests, engineerRequests, role],
  );

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    if (nextTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams]);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    const tab = searchParams.get("tab");
    if (!requestId || tab !== "bids" || bidRequests.length === 0 || role !== "engineer") return;

    const request = engineerRequests.find((item) => item.id === requestId);
    if (request) {
      setSelectedRequestForComparison(request);
      setIsComparisonModalOpen(true);
    }
  }, [bidRequests.length, engineerRequests, role, searchParams]);

  const handleOpenBidModal = (request: BidRequest) => {
    setSelectedRequestForBid(request);
    setIsBidModalOpen(true);
  };

  const handleOpenComparisonModal = (request: BidRequest) => {
    setSelectedRequestForComparison(request);
    setIsComparisonModalOpen(true);
  };

  const handleOpenStoreDetail = (store: HardwareStore) => {
    setSelectedStore(store);
    setIsStoreDetailOpen(true);
  };

  const handleToggleCompanyVisibility = async () => {
    if (!profile || role !== "hardware") return;

    const nextVisibility = !profile.is_public;
    setIsUpdatingVisibility(true);

    try {
      await updateProfile({ is_public: nextVisibility });
      showSuccess(nextVisibility ? "Tu empresa ahora es visible para clientes." : "Tu empresa ahora está oculta para clientes.");
    } catch {
      showError("No se pudo actualizar la visibilidad de tu empresa.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const renderBidRequestsBlock = () => {
    if (role === "hardware") {
      return (
        <OpportunityFeed
          requests={hardwareOpportunities}
          onOpenBidModal={handleOpenBidModal}
          isLoading={bidRequestsQuery.isLoading}
          hasError={!!bidRequestsQuery.error}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="section-label">Centro de subastas</p>
            <h2 className="font-display text-lg font-semibold text-foreground">Solicitudes activas</h2>
            <p className="mt-1 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
              Mostrando una carga inicial más ligera para consultar tus pedidos más recientes.
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            Cotizar
          </Button>
        </div>

        {bidRequestsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="app-shell space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-2/3" />
                <div className="panel-muted space-y-3 p-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : bidRequestsQuery.error ? (
          <EmptyState
            icon={TriangleAlert}
            title="No pudimos cargar tus solicitudes"
            description="La consulta falló temporalmente debido a un error de conexión o de políticas de seguridad."
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button onClick={() => bidRequestsQuery.refetch()} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Reintentar
                </Button>
                <Button onClick={() => setIsCreateModalOpen(true)}>Crear solicitud</Button>
              </div>
            }
          />
        ) : engineerRequests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No encontramos solicitudes recientes"
            description="Todavía no aparecen pedidos tuyos en esta carga inicial. Puedes crear una nueva solicitud para empezar."
            action={
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Crear solicitud
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {engineerRequests.map((request) => (
              <article key={request.id} className="app-shell interactive-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="data-chip data-chip-accent">{request.category}</span>
                  <span className={cn("data-chip", request.status === "completed" ? "" : "data-chip-success")}>
                    {request.status === "completed" ? "Compra finalizada" : `${request.bidsCount} ofertas`}
                  </span>
                </div>

                <h3 className="font-display mt-4 text-base font-semibold text-foreground">{request.title}</h3>

                <div className="panel-muted my-4 p-4">
                  <p className="section-label flex items-center gap-1.5 text-[10px]">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    Materiales solicitados ({request.itemsCount})
                  </p>
                  {request.items.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {request.items.map((item) => (
                        <li key={item.id ?? item.name} className="flex items-center justify-between gap-3 border-b border-border/70 pb-2 last:border-b-0 last:pb-0">
                          <span className="text-sm text-foreground">{item.name}</span>
                          <span className="mono-data text-xs text-muted-foreground">
                            {item.quantity} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">Esta solicitud todavía no tiene ítems visibles.</p>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="truncate">{request.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Expira: {new Date(request.expiresAt).toLocaleDateString("es-DO")}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4 border-t border-border/80 pt-4">
                  <div>
                    <p className="section-label">Presupuesto máximo</p>
                    <p className="mono-data mt-1 text-base font-semibold text-foreground">
                      {request.budgetLimit ? `RD$ ${request.budgetLimit.toLocaleString()}` : "Sin tope definido"}
                    </p>
                  </div>
                  {request.status !== "completed" && (
                    <Button variant="ghost" onClick={() => handleOpenComparisonModal(request)} className="px-1 text-primary hover:bg-transparent">
                      Ver detalles
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMarketBlock = () => {
    if (role === "hardware") {
      return (
        <div className="space-y-4">
          <section className="app-shell p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Mi empresa</p>
                <h2 className="font-display mt-2 text-lg font-semibold text-foreground">{profile?.store_name || profile?.full_name || "Perfil comercial pendiente"}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Administra cómo te ven los compradores dentro del mercado con datos reales y configuración controlada.
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsProfileModalOpen(true)}>
                <Settings className="h-4 w-4" />
                Editar
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="panel-muted p-4">
                <p className="section-label">Sector principal</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{profile?.sector || "Pendiente"}</p>
              </div>
              <div className="panel-muted p-4">
                <p className="section-label">Cobertura</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{profile?.delivery_coverage?.length || 0} zonas</p>
              </div>
            </div>
          </section>

          <section className="app-shell p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-[1.15rem]",
                    profile?.is_public ? "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]" : "bg-muted text-muted-foreground",
                  )}
                >
                  {profile?.is_public ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">Visibilidad del perfil</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {profile?.is_public ? "Tu empresa aparece en Mercado para usuarios cliente." : "Tu empresa está oculta de la lista pública."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleCompanyVisibility}
                disabled={isUpdatingVisibility}
                className={cn(
                  "toggle-track shrink-0",
                  profile?.is_public ? "border-primary/20 bg-[hsl(var(--primary)/0.16)]" : "border-border bg-muted",
                  isUpdatingVisibility && "opacity-70",
                )}
                aria-label="Cambiar visibilidad del perfil"
              >
                <span className={cn("toggle-thumb", profile?.is_public ? "translate-x-7" : "translate-x-0")} />
              </button>
            </div>

            <div className="panel-muted mt-5 p-4">
              <p className="section-label">Perfil público</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Completa tu nombre comercial, sector y cobertura para mejorar tu presencia en el marketplace.
              </p>
              <Button onClick={() => setIsProfileModalOpen(true)} className="mt-4 w-full justify-center">
                <Store className="h-4 w-4" />
                Abrir perfil de empresa
              </Button>
            </div>
          </section>
        </div>
      );
    }

    if (marketplaceStoresQuery.isLoading) {
      return <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="app-shell h-40 animate-pulse p-5" />)}</div>;
    }

    if (marketplaceStoresQuery.error) {
      return (
        <EmptyState
          icon={TriangleAlert}
          title="No pudimos cargar el marketplace"
          description="Ocurrió un problema consultando las ferreterías públicas."
          action={
            <Button onClick={() => marketplaceStoresQuery.refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Reintentar
            </Button>
          }
        />
      );
    }

    if (marketplaceStores.length === 0) {
      return (
        <EmptyState
          icon={Store}
          title="Todavía no hay ferreterías públicas"
          description="Cuando los proveedores completen su perfil y activen visibilidad pública, aparecerán aquí automáticamente."
          action={
            <Button variant="outline" onClick={() => setActiveTab("bids")}>
              Volver a subastas
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <p className="section-label">Mercado</p>
          <h2 className="font-display text-lg font-semibold text-foreground">Ferreterías aliadas</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Directorio público alimentado solo por perfiles reales visibles.</p>
        </div>

        <div className="space-y-3">
          {marketplaceStores.map((store) => (
            <article key={store.id} onClick={() => handleOpenStoreDetail(store)} className="app-shell interactive-card cursor-pointer p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-foreground">{store.name}</h3>
                    {store.isVerified && <span className="data-chip data-chip-accent">Visible</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{store.sector || "Sector pendiente"}</p>
                </div>
                <span className="data-chip data-chip-accent">{store.rating ? `★ ${store.rating.toFixed(1)}` : "Sin rating"}</span>
              </div>

              <div className="mt-4 border-t border-border/80 pt-4">
                <p className="section-label">Cobertura de entrega</p>
                {store.deliveryCoverage.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {store.deliveryCoverage.map((coverage) => (
                      <span key={coverage} className="data-chip">
                        {coverage}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Esta ferretería aún no ha definido su cobertura.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  };

  const renderOrdersBlock = () => {
    if (orders.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="No tienes pedidos finalizados"
          description="Cuando una compra se marque como finalizada, aparecerá aquí con su historial consolidado."
        />
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <p className="section-label">Pedidos</p>
          <h2 className="font-display text-lg font-semibold text-foreground">Historial finalizado</h2>
        </div>

        {orders.map((request) => (
          <article key={request.id} className="app-shell p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">{request.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{request.category}</p>
              </div>
              <span className="data-chip">Completado</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="panel-muted p-3">
                <p className="section-label">Entrega</p>
                <p className="mt-1 text-foreground">{request.deliveryAddress}</p>
              </div>
              <div className="panel-muted p-3">
                <p className="section-label">Ofertas recibidas</p>
                <p className="mt-1 text-foreground">{request.bidsCount}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderAccountBlock = () => {
    const displayName = profile?.store_name || profile?.full_name || "Perfil pendiente";
    const initials = displayName.trim().slice(0, 1).toUpperCase() || "?";
    const isIncomplete = !profile?.full_name || !profile?.document_id || !profile?.user_type || (role === "hardware" && !profile?.sector);

    return (
      <section className="app-shell p-5">
        <div className="flex items-center gap-3 border-b border-border/80 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[hsl(var(--primary)/0.14)] font-display text-lg font-semibold text-[hsl(var(--warning-foreground))]">
            {initials}
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">{displayName}</h3>
            <p className="text-sm text-muted-foreground">{role === "engineer" ? "Comprador profesional" : "Proveedor en marketplace"}</p>
            {profile?.document_id ? <p className="mono-data mt-1 text-xs text-muted-foreground">Doc: {profile.document_id}</p> : null}
          </div>
        </div>

        {isIncomplete ? (
          <div className="panel-muted mt-4 p-4">
            <p className="font-display text-sm font-semibold text-foreground">Perfil incompleto</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Completa tu información para evitar espacios vacíos en tu experiencia productiva.
            </p>
            {role === "hardware" ? (
              <Button variant="outline" onClick={() => setIsProfileModalOpen(true)} className="mt-4 w-full">
                Completar perfil de empresa
              </Button>
            ) : null}
          </div>
        ) : null}

        {profile?.user_type === "hardware" && (
          <div className="panel-muted mt-4 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-[1rem]", profile.is_public ? "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]" : "bg-muted text-muted-foreground")}>
                {profile.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">Estado del perfil</p>
                <p className="text-xs text-muted-foreground">{profile.is_public ? "Público · visible en Mercado" : "Privado · oculto para clientes"}</p>
              </div>
            </div>
            <span className={cn("data-chip", profile.is_public ? "data-chip-success" : "")}>{profile.is_public ? "Público" : "Privado"}</span>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {profile?.user_type === "hardware" ? (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="interactive-row flex min-h-[48px] w-full items-center gap-2 rounded-[1.1rem] px-4 py-3 text-left text-sm text-foreground hover:bg-[hsl(var(--surface-2))]"
            >
              <Settings className="h-4 w-4 text-primary" />
              Configurar mi ferretería
            </button>
          ) : null}
          <button
            onClick={() => role === "hardware" && setActiveTab("market")}
            className="interactive-row flex min-h-[48px] w-full items-center rounded-[1.1rem] px-4 py-3 text-left text-sm text-foreground hover:bg-[hsl(var(--surface-2))]"
          >
            Mi perfil de empresa
          </button>
          <button onClick={signOut} className="interactive-row flex min-h-[48px] w-full items-center rounded-[1.1rem] px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10">
            Cerrar sesión
          </button>
        </div>
      </section>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "bids":
        return renderBidRequestsBlock();
      case "market":
        return renderMarketBlock();
      case "orders":
        return renderOrdersBlock();
      case "account":
        return renderAccountBlock();
      default:
        return renderBidRequestsBlock();
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-0))] px-0 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-border bg-background md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:shadow-[0_28px_60px_-40px_hsl(var(--foreground)/0.45)]">
        <Header />

        <main className="flex-1 px-4 pb-32 pt-4">{renderContent()}</main>

        <BottomNav role={role} activeTab={activeTab} setActiveTab={setActiveTab} />

        <CreateBidModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        <BidFormModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} request={selectedRequestForBid} />
        <BidComparisonModal isOpen={isComparisonModalOpen} onClose={() => setIsComparisonModalOpen(false)} request={selectedRequestForComparison} />
        <ProviderProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        <StoreDetailModal isOpen={isStoreDetailOpen} onClose={() => setIsStoreDetailOpen(false)} store={selectedStore} />
      </div>
    </div>
  );
};

export default Index;