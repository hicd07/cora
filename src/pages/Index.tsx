import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { mockBidRequests, mockHardwareStores } from '@/lib/mockData';
import { Gavel, Store, ClipboardList, User, Plus, MapPin, Calendar, ArrowRight } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>('bids');

  // Renderizado condicional simple según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case 'bids':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Subastas Activas</h2>
                <p className="text-xs text-slate-500">Solicitudes de materiales en Santo Domingo Este</p>
              </div>
              <button className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors min-h-[36px]">
                <Plus className="w-3.5 h-3.5" />
                <span>Crear</span>
              </button>
            </div>

            <div className="space-y-3">
              {mockBidRequests.map((req) => (
                <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                      {req.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      {req.bidsCount} ofertas
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">
                    {req.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{req.sector}, SDE</span>
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
                        RD$ {req.budgetLimit?.toLocaleString()}
                      </p>
                    </div>
                    <button className="text-amber-600 hover:text-amber-700 text-xs font-bold flex items-center gap-1 min-h-[36px]">
                      <span>Ver detalles</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
              {mockHardwareStores.map((store) => (
                <div key={store.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
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
                C
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Constructora SDE S.R.L.</h3>
                <p className="text-xs text-slate-500">Comprador Profesional</p>
              </div>
            </div>

            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px]">
                Mi Perfil de Empresa
              </button>
              <button className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px]">
                Historial de Subastas
              </button>
              <button className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px]">
                Métodos de Pago
              </button>
              <button className="w-full text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] font-medium">
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
        
        {/* Header */}
        <Header />

        {/* Contenido Principal con scroll */}
        <main className="flex-1 p-4 pb-24 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Navegación Inferior */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
      </div>
    </div>
  );
};

export default Index;