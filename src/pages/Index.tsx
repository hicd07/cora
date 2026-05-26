import React, { useState } from "react";
import { ArrowRight, Calendar, ClipboardList, Eye, EyeOff, Gavel, MapPin, Package, Plus, Settings, Store } from "lucide-react";
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
import { mockBidRequests, mockHardwareStores, BidRequest } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";

const Index = () => {
  const { profile, signOut, updateProfile } = useSessionContext();
  const role = profile?.user_type === "hardware" ? "hardware" : "engineer";

  const [activeTab, setActiveTab] = useState<string>("bids");
  const [bidRequests, setBidRequests] = useState<BidRequest[]>(mockBidRequests);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequestForBid, setSelectedRequestForBid] = useState<BidRequest | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedRequestForComparison, setSelectedRequestForComparison] = useState<BidRequest | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [isStoreDetailOpen, setIsStoreDetailOpen] = useState(false);

  const handlePublishBid = (newRequest: BidRequest) => {
    setBidRequests([newRequest, ...bidRequests]);
  };

  const handleOpenBidModal = (request: BidRequest) => {
    setSelectedRequestForBid(request);
    setIsBidModalOpen(true);
  };

  const handleOpenComparisonModal = (request: BidRequest) => {
    setSelectedRequestForComparison(request);
    setIsComparisonModalOpen(true);
  };

  const handleSubmitBid = (requestId: string) => {
    setBidRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, bidsCount: request.bidsCount + 1 } : request)),
    );
  };

  const handleCompleteOrder = (requestId: string) => {
    setBidRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, status: "completed" } : request)),
    );
  };

  const getHardwareStores = () => {
    const stores = [...mockHardwareStores];

    if (profile?.user_type === "hardware" && profile.is_public) {
      const userStore = {
        id: profile.id,
        name: profile.store_name || profile.full_name || "Mi Ferretería",
        rating: profile.rating || 5,
        reviewsCount: profile.reviews_count || 0,
        sector: profile.sector || "Alma Rosa I",
        deliveryCoverage: profile.delivery_coverage || ["Alma Rosa I"],
        isVerified: true,
      };

      if (!stores.some((store) => store.id === profile.id)) {
        stores.unshift(userStore);
      }
    }

    return stores;
  };

  const handleOpenStoreDetail = (store: any) => {
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
    } catch (error) {
      showError("No se pudo actualizar la visibilidad de tu empresa.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const renderContent = () => {
    if (role === "hardware" && activeTab === "bids") {
      return <OpportunityFeed requests={bidRequests} onOpenBidModal={handleOpenBidModal} />;
    }

    switch (activeTab) {
      case "bids":
        return (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="section-label">Centro de subastas</p>
                <h2 className="font-display text-lg font-semibold text-foreground">Solicitudes activas</h2>
                <p className="mt-1 text-sm text-muted-foreground">Gestiona pedidos y compara ofertas por ítem con precisión.</p>
              </div>
              {role === "engineer" && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="shrink-0">
                  <Plus className="h-4 w-4" />Cotizar
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {bidRequests.map((request) => (
                <article key={request.id} className="app-shell rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="data-chip data-chip-accent">{request.category}</span>
                    <span className={cn("data-chip", request.status === "completed" ? "" : "data-chip-success")}>
                      {request.status === "completed" ? "Compra finalizada" : `${request.bidsCount} ofertas`}
                    </span>
                  </div>

                  <h3 className="font-display mt-4 text-base font-semibold text-foreground">{request.title}</h3>

                  <div className="panel-muted my-4 rounded-lg p-3">
                    <p className="section-label flex items-center gap-1.5 text-[10px]">
                      <Package className="h-3.5 w-3.5 text-primary" />Materiales solicitados ({request.itemsCount})
                    </p>
                    <ul className="mt-3 space-y-2">
                      {request.items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between gap-3 border-b border-border/70 pb-2 last:border-b-0 last:pb-0">
                          <span className="text-sm text-foreground">{item.name}</span>
                          <span className="mono-data text-xs text-muted-foreground">
                            {item.quantity} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
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

                  <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-4">
                    <div>
                      <p className="section-label">Presupuesto máximo</p>
                      <p className="mono-data mt-1 text-base font-semibold text-foreground">
                        {request.budgetLimit ? `RD$ ${request.budgetLimit.toLocaleString()}` : "A cotizar"}
                      </p>
                    </div>
                    {request.status !== "completed" && role === "engineer" && (
                      <Button variant="ghost" onClick={() => handleOpenComparisonModal(request)} className="px-0 text-primary hover:bg-transparent">
                        Ver detalles
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        );

      case "market":
        if (role === "hardware") {
          return (
            <div className="space-y-4">
              <section className="app-shell rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="section-label">Mi empresa</p>
                    <h2 className="font-display mt-2 text-lg font-semibold text-foreground">
                      {profile?.store_name || profile?.full_name || "Mi Ferretería"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">Administra cómo te ven los compradores dentro del mercado.</p>
                  </div>
                  <Button variant="outline" onClick={() => setIsProfileModalOpen(true)}>
                    <Settings className="h-4 w-4" />Editar
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="panel-muted rounded-lg p-3">
                    <p className="section-label">Sector principal</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{profile?.sector || "Sin definir"}</p>
                  </div>
                  <div className="panel-muted rounded-lg p-3">
                    <p className="section-label">Cobertura</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{profile?.delivery_coverage?.length || 0} zonas</p>
                  </div>
                </div>
              </section>

              <section className="app-shell rounded-xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${profile?.is_public ? "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"}`}>
                      {profile?.is_public ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">Visibilidad del perfil</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {profile?.is_public ? "Tu empresa aparece en Mercado para usuarios cliente." : "Tu empresa está oculta de la lista pública."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleCompanyVisibility}
                    disabled={isUpdatingVisibility}
                    className={`grid h-8 w-14 items-center rounded-md border p-1 transition-colors ${profile?.is_public ? "border-primary/20 bg-[hsl(var(--primary)/0.16)]" : "border-border bg-muted"} ${isUpdatingVisibility ? "opacity-70" : ""}`}
                    aria-label="Cambiar visibilidad del perfil"
                  >
                    <span className={`block h-5 w-5 rounded-sm bg-card transition-transform ${profile?.is_public ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="panel-muted mt-5 rounded-lg p-4">
                  <p className="section-label">Perfil público</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Edita tu nombre comercial, sector, cobertura y estado público o privado desde un solo panel.
                  </p>
                  <Button onClick={() => setIsProfileModalOpen(true)} className="mt-4 w-full justify-center">
                    <Store className="h-4 w-4" />Abrir perfil de empresa
                  </Button>
                </div>
              </section>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div>
              <p className="section-label">Mercado</p>
              <h2 className="font-display text-lg font-semibold text-foreground">Ferreterías aliadas</h2>
              <p className="mt-1 text-sm text-muted-foreground">Proveedores verificados con cobertura en la zona oriental.</p>
            </div>

            <div className="space-y-3">
              {getHardwareStores().map((store) => (
                <article
                  key={store.id}
                  onClick={() => handleOpenStoreDetail(store)}
                  className="app-shell cursor-pointer rounded-xl p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-semibold text-foreground">{store.name}</h3>
                        {store.isVerified && <span className="data-chip data-chip-accent">Verificado</span>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{store.sector}, SDE</p>
                    </div>
                    <span className="data-chip data-chip-accent">★ {store.rating}</span>
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <p className="section-label">Cobertura de entrega</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {store.deliveryCoverage.map((coverage, index) => (
                        <span key={index} className="data-chip">{coverage}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        );

      case "orders":
        return (
          <section className="panel-muted rounded-xl border-dashed p-8 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="font-display mt-3 text-base font-semibold text-foreground">No tienes pedidos en curso</h3>
            <p className="mx-auto mt-1 max-w-[260px] text-sm text-muted-foreground">
              Cuando ganes una subasta o aceptes una oferta, los pedidos aparecerán aquí con su estado consolidado.
            </p>
          </section>
        );

      case "account":
        return (
          <section className="app-shell rounded-xl p-4">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.14)] font-display text-lg font-semibold text-[hsl(var(--warning-foreground))]">
                {role === "engineer" ? "I" : "F"}
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {profile?.store_name || profile?.full_name || (role === "engineer" ? "Constructora SDE S.R.L." : "Ferretería El Progreso SDE")}
                </h3>
                <p className="text-sm text-muted-foreground">{role === "engineer" ? "Comprador profesional" : "Vendedor verificado"}</p>
                {profile?.document_id && <p className="mono-data mt-1 text-xs text-muted-foreground">Doc: {profile.document_id}</p>}
              </div>
            </div>

            {profile?.user_type === "hardware" && (
              <div className="panel-muted mt-4 flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md ${profile.is_public ? "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"}`}>
                    {profile.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">Estado del perfil</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.is_public ? "Público · visible en Mercado" : "Privado · oculto para clientes"}
                    </p>
                  </div>
                </div>
                <span className={cn("data-chip", profile.is_public ? "data-chip-success" : "")}>{profile.is_public ? "Público" : "Privado"}</span>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {profile?.user_type === "hardware" && (
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <Settings className="h-4 w-4 text-primary" />Configurar mi ferretería
                </button>
              )}
              <button
                onClick={() => role === "hardware" && setActiveTab("market")}
                className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                Mi perfil de empresa
              </button>
              {role === "engineer" && (
                <>
                  <button className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent">
                    Historial de subastas
                  </button>
                  <button className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent">
                    Métodos de pago
                  </button>
                </>
              )}
              <button
                onClick={signOut}
                className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                Cerrar sesión
              </button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-0))] px-0 md:px-6">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-border bg-background">
        <Header />

        <main className="flex-1 px-4 pb-28 pt-4">{renderContent()}</main>

        <BottomNav role={role} activeTab={activeTab} setActiveTab={setActiveTab} />

        <CreateBidModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPublish={handlePublishBid} />
        <BidFormModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          request={selectedRequestForBid}
          onSubmitBid={handleSubmitBid}
        />
        <BidComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          request={selectedRequestForComparison}
          onCompleteOrder={handleCompleteOrder}
        />
        <ProviderProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        <StoreDetailModal isOpen={isStoreDetailOpen} onClose={() => setIsStoreDetailOpen(false)} store={selectedStore} />
      </div>
    </div>
  );
};

export default Index;
