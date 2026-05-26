import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import CreateBidModal from '@/components/bids/CreateBidModal';
import OpportunityFeed from '@/components/ferreteria/OpportunityFeed';
import BidFormModal from '@/components/ferreteria/BidFormModal';
import BidComparisonModal from '@/components/bids/BidComparisonModal';
import ProviderProfileModal from '@/components/ferreteria/ProviderProfileModal';
import StoreDetailModal from '@/components/ferreteria/StoreDetailModal';
import { mockBidRequests, mockHardwareStores, BidRequest } from '@/lib/mockData';
import { useSessionContext } from '@/components/auth/SessionContext';
import { ClipboardList, Plus, MapPin, Calendar, ArrowRight, Package, Settings, Eye, EyeOff } from 'lucide-react';

const Index = () => {
  const { profile, signOut } = useSessionContext();
  const role = profile?.user_type === 'hardware' ? 'hardware' : 'engineer';
  const [activeTab, setActiveTab] = useState<string>('bids');
  const [bidRequests, setBidRequests] = useState<BidRequest[]>(mockBidRequests);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Estados para cotizar como ferretería
  const [selectedRequestForBid, setSelectedRequestForBid] = useState<BidRequest | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  // Estados para comparar ofertas como ingeniero
  const [selectedRequestForComparison, setSelectedRequestForComparison] = useState<BidRequest | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Estados para configurar perfil de ferretería
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Estados para ver detalle de ferretería
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
    setBidRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, bidsCount: req.bidsCount + 1 } 
          : req
      )
    );
  };

  const handleCompleteOrder = (requestId: string) => {
    setBidRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'completed' } 
          : req
      )
    );
  };

  // Combinar tiendas simuladas con la tienda del usuario actual si es pública
  const getHardwareStores = () => {
    const stores = [...mockHardwareStores];
    
    // Si el usuario actual es una ferretería y tiene perfil público, lo agregamos a la lista
    if (profile?.user_type === 'hardware' && profile.is_public) {
      const userStore = {
        id: profile.id,
        name: profile.store_name || profile.full_name || 'Mi Ferretería',
        rating: profile.rating || 5.0,
        reviewsCount: profile.reviews_count || 0,
        sector: profile.sector || 'Alma Rosa I',
        deliveryCoverage: profile.delivery_coverage || ['Alma Rosa I'],
        isVerified: true,
      };
      
      // Evitar duplicados
      if (!stores.some(s => s.id === profile.id)) {
        stores.unshift(userStore);
      }
    }
    
    return stores;
  };

  const handleOpenStoreDetail = (store: any) => {
    setSelectedStore(store);
    setIsStoreDetailOpen(true);
  };

  // Renderizado condicional simple según la pestaña activa y el rol
  const renderContent = () => {
    if (role === 'hardware' && activeTab === 'bids') {
      return (
        <OpportunityFeed 
          requests={bidRequests} 
          onOpenBidModal={handleOpenBidModal} 
        />
      );
    }

    switch (activeTab) {
      case 'bids':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Subastas Activas</h2>
                <p className="text-xs text-slate-500">Solicitudes de cotización en Santo Domingo Este</p>
              </div>
              {role === 'engineer' && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all min-h-[40px] active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cotizar</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {bidRequests.map((req) => (
                <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                      {req.category}
                    </span>
                    <span className={`text-xs font-bold ${req.status === 'completed' ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {req.status === 'completed' ? 'Compra Finalizada' : `${req.bidsCount} ofertas`}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-sm mb-1">
                    {req.title}
                  </h3>

                  {/* Desglose de Materiales */}
                  <div className="my-3 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Package className="w-3 h-3 text-amber-500" />
                      Materiales Solicitados ({req.itemsCount})
                    </p>
                    <ul className="space-y-1">
                      {req.items?.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex justify-between items-center">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-100 text-[10px]">
                            {item.quantity} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{req.deliveryAddress}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Expira: {new Date(req.expiresAt).toLocaleDateString('es-DO')}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Presupuesto Máx.</p>
                      <p className="text-sm font-extrabold text-slate-900">
                        {req.budgetLimit ? `RD$ ${req.budgetLimit.toLocaleString()}` : 'A cotizar'}
                      </p>
                    </div>
                    {req.status !== 'completed' && role === 'engineer' && (
                      <button 
                        onClick={() => handleOpenComparisonModal(req)}
                        className="text-amber-600 hover:text-amber-700 text-xs font-bold flex items-center gap-1 min-h-[36px]"
                      >
                        <span>Ver detalles</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ferreterías Aliadas</h2>
              <p className="text-xs text-slate-500">Proveedores verificados en la zona oriental</p>
            </div>

            <div className="space-y-3">
              {getHardwareStores().map((store) => (
                <div 
                  key={store.id} 
                  onClick={() => handleOpenStoreDetail(store)}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {store.name}
                        {store.isVerified && (
                          <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Verificado
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">{store.sector}, SDE</p>
                    </div>
                    <div className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      ★ {store.rating}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Cobertura de entrega</p>
                    <div className="flex flex-wrap gap-1">
                      {store.deliveryCoverage.map((cov, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md">
                          {cov}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">No tienes pedidos en curso</h3>
            <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
              Cuando ganes una subasta o aceptes una oferta, tus pedidos aparecerán aquí.
            </p>
          </div>
        );

      case 'account':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-lg">
                {role === 'engineer' ? 'I' : 'F'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {profile?.store_name || profile?.full_name || (role === 'engineer' ? 'Constructora SDE S.R.L.' : 'Ferretería El Progreso SDE')}
                </h3>
                <p className="text-xs text-slate-500">
                  {role === 'engineer' ? 'Comprador Profesional' : 'Vendedor Verificado'}
                </p>
                {profile?.document_id && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Doc: {profile.document_id}</p>
                )}
              </div>
            </div>

            {/* Estado de Visibilidad para Proveedores */}
            {profile?.user_type === 'hardware' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {profile.is_public ? (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800">Estado del Perfil</p>
                    <p className="text-[10px] text-slate-500">
                      {profile.is_public ? 'Público (Visible en Mercado)' : 'Privado (Oculto)'}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  profile.is_public ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {profile.is_public ? 'Público' : 'Privado'}
                </span>
              </div>
            )}

            <div className="space-y-1">
              {profile?.user_type === 'hardware' && (
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full text-left px-3 py-2.5 text-xs text-amber-700 hover:bg-amber-50 rounded-lg transition-colors min-h-[44px] font-bold flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Configurar Mi Ferretería
                </button>
              )}
              <button className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px]">
                Mi Perfil de Empresa
              </button>
              <button className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px]">
                Historial de Subastas
              </button>
              <button className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px]">
                Métodos de Pago
              </button>
              <button 
                onClick={signOut}
                className="w-full text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      {/* Contenedor Mobile-First Estricto */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col relative shadow-2xl border-x border-slate-100">
        
        {/* Header contextual según el tipo de usuario */}
        <Header />

        {/* Contenido Principal con scroll */}
        <main className="flex-1 p-4 pb-24 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Navegación Inferior */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Modal de Creación de Requerimiento (Ingeniero) */}
        <CreateBidModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onPublish={handlePublishBid}
        />

        {/* Modal de Cotización Detallada (Ferretería) */}
        <BidFormModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          request={selectedRequestForBid}
          onSubmitBid={handleSubmitBid}
        />

        {/* Tablero de Comparación y Selección de Ítems (Ingeniero) */}
        <BidComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          request={selectedRequestForComparison}
          onCompleteOrder={handleCompleteOrder}
        />

        {/* Modal de Configuración de Perfil de Ferretería */}
        <ProviderProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />

        {/* Modal de Detalle de Ferretería */}
        <StoreDetailModal
          isOpen={isStoreDetailOpen}
          onClose={() => setIsStoreDetailOpen(false)}
          store={selectedStore}
        />
        
      </div>
    </div>
  );
};

export default Index;