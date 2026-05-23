import React, { useState } from 'react';
import { BidRequest } from '@/lib/mockData';
import { MapPin, Clock, Package, Bell, BellOff, Gavel } from 'lucide-react';

interface OpportunityFeedProps {
  requests: BidRequest[];
  onOpenBidModal: (request: BidRequest) => void;
}

export const OpportunityFeed: React.FC<OpportunityFeedProps> = ({ requests, onOpenBidModal }) => {
  const [isAvailable, setIsAvailable] = useState(true);

  // Simular distancias en km para cada solicitud en SDE
  const getDistance = (id: string) => {
    const distances: Record<string, string> = {
      'req-1': '1.2 km',
      'req-2': '2.8 km',
      'req-3': '4.5 km',
    };
    return distances[id] || '3.1 km';
  };

  // Calcular tiempo restante amigable
  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Menos de 1 hora';
    return `${hours} horas restantes`;
  };

  return (
    <div className="space-y-4">
      {/* Control de Disponibilidad / Alertas */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isAvailable ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
            {isAvailable ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Alertas de Obras Cercanas</h3>
            <p className="text-[10px] text-slate-500">
              {isAvailable ? 'Recibiendo solicitudes en tiempo real' : 'Alertas pausadas temporalmente'}
            </p>
          </div>
        </div>
        
        {/* Switch de Disponibilidad */}
        <button
          onClick={() => setIsAvailable(!isAvailable)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isAvailable ? 'bg-amber-500' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Lista de Oportunidades */}
      {!isAvailable ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
          <BellOff className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-xs">Alertas Pausadas</h4>
          <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-1">
            Activa las alertas para volver a visualizar y cotizar las obras activas en SDE.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Obras que buscan cotización
            </h2>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {requests.filter(r => r.status === 'active').length} Activas
            </span>
          </div>

          {requests.filter(r => r.status === 'active').map((req) => (
            <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              
              {/* Distancia y Tiempo Restante */}
              <div className="flex justify-between items-center mb-2.5">
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  A {getDistance(req.id)} de ti
                </span>
                <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getRemainingTime(req.expiresAt)}
                </span>
              </div>

              {/* Título de la Obra */}
              <h3 className="font-bold text-slate-900 text-sm mb-1">{req.title}</h3>
              <p className="text-[10px] text-slate-500 font-medium mb-3">
                Sector: {req.sector} • {req.category}
              </p>

              {/* Lista de Materiales Solicitados */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 mb-3">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Package className="w-3 h-3 text-amber-500" />
                  Materiales a Cotizar ({req.itemsCount})
                </p>
                <ul className="space-y-1">
                  {req.items.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex justify-between items-center">
                      <span>{item.name}</span>
                      <span className="text-slate-500 font-semibold text-[10px]">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de Cotizar */}
              <button
                onClick={() => onOpenBidModal(req)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <Gavel className="w-4 h-4" />
                Cotizar este Pedido
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpportunityFeed;