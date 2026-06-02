"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useSessionContext } from "@/components/auth/SessionContext";
import { useBidRequests } from "@/hooks/useBidRequests";
import { OpportunityFeed } from "@/components/ferreteria/OpportunityFeed";
import { CreateBidModal } from "@/components/bids/CreateBidModal";
import { BidFormModal } from "@/components/ferreteria/BidFormModal";
import { ProviderProfileModal } from "@/components/ferreteria/ProviderProfileModal";
import { StoreLocationsManager } from "@/components/ferreteria/StoreLocationsManager";
import Profile from "@/pages/Profile";
import { Button } from "@/components/ui/button";
import { Plus, Gavel, History, Store as StoreIcon } from "lucide-react";
import { BidRequest } from "@/lib/types";

const Index = () => {
  const { profile, isAdmin } = useSessionContext();
  const [activeTab, setActiveTab] = useState("bids");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BidRequest | null>(null);

  const { data: requests = [], isLoading } = useBidRequests();
  const userType = profile?.user_type || "engineer";

  const handleOpenBidModal = (request: BidRequest) => {
    setSelectedRequest(request);
    setIsBidModalOpen(true);
  };

  const renderContent = () => {
    if (activeTab === "account") {
      return <Profile />;
    }

    if (userType === "engineer") {
      switch (activeTab) {
        case "bids":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">Mis Subastas</h2>
                  <p className="text-sm text-muted-foreground">Gestiona tus solicitudes activas.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-full">
                  <Plus className="mr-2 h-4 w-4" /> Nueva
                </Button>
              </div>
              
              {requests.length === 0 ? (
                <div className="panel-muted py-20 text-center rounded-[2rem] border-dashed">
                  <Gavel className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Aún no has creado ninguna subasta.</p>
                  <Button variant="link" onClick={() => setIsCreateModalOpen(true)}>Crear mi primera solicitud</Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {requests.map((req) => (
                    <div key={req.id} className="app-shell p-5 interactive-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="data-chip mb-2">{req.category}</span>
                          <h3 className="font-display font-bold">{req.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{req.deliveryAddress}</p>
                        </div>
                        <span className={`data-chip ${req.status === 'active' ? 'data-chip-accent' : ''}`}>
                          {req.status === 'active' ? 'Activa' : 'Finalizada'}
                        </span>
                      </div>
                      <div className="mt-4 flex justify-between items-center border-t pt-4">
                        <span className="text-xs font-medium">{req.bidsCount} ofertas recibidas</span>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = `/quote/${req.id}/live`}>Ver detalles</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        case "market":
          return (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Mercado SDE</h2>
              <p className="text-sm text-muted-foreground">Explora proveedores verificados en la zona.</p>
              <div className="panel-muted py-20 text-center rounded-[2rem]">
                <StoreIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Directorio de ferreterías en construcción.</p>
              </div>
            </div>
          );
        case "orders":
          return (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Historial de Compras</h2>
              <div className="panel-muted py-20 text-center rounded-[2rem]">
                <History className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Tus órdenes finalizadas aparecerán aquí.</p>
              </div>
            </div>
          );
        default:
          return null;
      }
    } else {
      // Hardware Store Views
      switch (activeTab) {
        case "bids":
          return (
            <OpportunityFeed 
              requests={requests} 
              onOpenBidModal={handleOpenBidModal}
              isLoading={isLoading}
            />
          );
        case "market":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">Perfil de Empresa</h2>
                  <p className="text-sm text-muted-foreground">Gestiona tu presencia y logística.</p>
                </div>
                <Button variant="outline" onClick={() => setIsProfileModalOpen(true)} className="rounded-full">
                  Editar Perfil
                </Button>
              </div>

              <div className="app-shell p-6 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                       <StoreIcon className="h-8 w-8" />
                    </div>
                    <div>
                       <h3 className="font-bold text-lg">{profile?.store_name || "Mi Ferretería"}</h3>
                       <p className="text-sm text-muted-foreground">{profile?.sector || "Sector no configurado"}</p>
                    </div>
                 </div>
                 
                 <div className="pt-6 border-t">
                    <StoreLocationsManager />
                 </div>
              </div>
            </div>
          );
        case "orders":
          return (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Mis Ventas</h2>
              <div className="panel-muted py-20 text-center rounded-[2rem]">
                <History className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Tus ventas cerradas a través de CORA.</p>
              </div>
            </div>
          );
        default:
          return null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-md">
        {renderContent()}
      </main>
      
      <BottomNav 
        role={userType} 
        isAdmin={isAdmin}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <CreateBidModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <BidFormModal 
        isOpen={isBidModalOpen} 
        onClose={() => setIsBidModalOpen(false)} 
        request={selectedRequest} 
      />

      <ProviderProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

export default Index;