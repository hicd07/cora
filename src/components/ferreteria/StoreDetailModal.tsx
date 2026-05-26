import React from 'react';
import { X, Store, MapPin, Phone, MessageSquare, Star, ShieldCheck, Truck } from 'lucide-react';

interface StoreDetailProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    rating: number;
    reviewsCount: number;
    sector: string;
    deliveryCoverage: string[];
    isVerified: boolean;
  } | null;
}

export const StoreDetailModal: React.FC<StoreDetailProps> = ({ isOpen, onClose, store }) => {
  if (!isOpen || !store) return null;

  // Simulated contact details
  const phone = '+18095550123';
  const whatsapp = '18095550123';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Detalle de Proveedor</h3>
              <p className="text-[10px] text-slate-500">Información verificada de ferretería</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 pb-10">
          
          {/* Info Principal */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-sm">
              <Store className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-lg flex items-center justify-center gap-1.5">
                {store.name}
                {store.isVerified && (
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                )}
              </h4>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {store.sector}, Santo Domingo Este
              </p>
            </div>

            {/* Rating */}
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
              <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
              <span>{store.rating}</span>
              <span className="text-slate-400 font-normal">({store.reviewsCount} opiniones)</span>
            </div>
          </div>

          {/* Cobertura de Despacho */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-500" />
              Zonas de Cobertura de Entrega
            </h5>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Este proveedor realiza despachos y entregas directas en los siguientes sectores de Santo Domingo Este:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {store.deliveryCoverage.map((cov, idx) => (
                <span key={idx} className="bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                  {cov}
                </span>
              ))}
            </div>
          </div>

          {/* Botones de Contacto Directo */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 block">Canales de Contacto Directo</h5>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[48px]"
              >
                <Phone className="w-4 h-4 text-slate-500" />
                Llamar Directo
              </a>
              <a
                href={`https://wa.me/${whatsapp}?text=Hola%20${encodeURIComponent(store.name)},%20vi%20su%20perfil%20en%20ConstruBid%20y%20me%20gustaría%20cotizar%20unos%20materiales.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors min-h-[48px] shadow-md shadow-emerald-600/10"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Botón de Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[44px]"
          >
            Cerrar Detalle
          </button>

        </div>
      </div>
    </div>
  );
};

export default StoreDetailModal;