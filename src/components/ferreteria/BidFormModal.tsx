import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, Check, AlertTriangle } from 'lucide-react';
import { BidRequest } from '@/lib/mockData';
import { showSuccess } from '@/utils/toast';

interface BidFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BidRequest | null;
  onSubmitBid: (requestId: string) => void;
}

interface ItemQuote {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  isAvailable: boolean;
}

export const BidFormModal: React.FC<BidFormModalProps> = ({ isOpen, onClose, request, onSubmitBid }) => {
  if (!isOpen || !request) return null;

  const [items, setItems] = useState<ItemQuote[]>([]);
  const [deliveryTime, setDeliveryTime] = useState('Mismo día (4-6 horas)');
  const [notes, setNotes] = useState('');

  // Inicializar los ítems de la cotización basados en el requerimiento
  useEffect(() => {
    if (request) {
      setItems(
        request.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0,
          isAvailable: true,
        }))
      );
    }
  }, [request]);

  const handlePriceChange = (index: number, price: string) => {
    const updated = [...items];
    updated[index].unitPrice = parseFloat(price) || 0;
    setItems(updated);
  };

  const handleAvailabilityToggle = (index: number) => {
    const updated = [...items];
    updated[index].isAvailable = !updated[index].isAvailable;
    if (!updated[index].isAvailable) {
      updated[index].unitPrice = 0; // Resetear precio si no está disponible
    }
    setItems(updated);
  };

  // Cálculos automáticos
  const subtotal = items.reduce((acc, item) => {
    if (!item.isAvailable) return acc;
    return acc + item.unitPrice * item.quantity;
  }, 0);

  const itbis = subtotal * 0.18; // 18% ITBIS en RD
  const total = subtotal + itbis;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const activeItems = items.filter(item => item.isAvailable);
    if (activeItems.length === 0) {
      alert('Debes cotizar al menos un ítem disponible.');
      return;
    }

    const hasZeroPrice = activeItems.some(item => item.unitPrice <= 0);
    if (hasZeroPrice) {
      alert('Por favor, ingresa un precio válido para todos los materiales disponibles.');
      return;
    }

    onSubmitBid(request.id);
    showSuccess('¡Cotización enviada con éxito al ingeniero!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Enviar Cotización</h3>
            <p className="text-[10px] text-slate-500 truncate max-w-[280px]">
              Para: {request.title}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 pb-10">
          
          {/* Lista de Materiales a Cotizar */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">Desglose de Precios por Ítem</label>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-xl border transition-all ${
                    item.isAvailable 
                      ? 'bg-slate-50 border-slate-100' 
                      : 'bg-red-50/30 border-red-100 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Cantidad: {item.quantity} {item.unit}
                      </p>
                    </div>
                    
                    {/* Botón de Disponibilidad */}
                    <button
                      type="button"
                      onClick={() => handleAvailabilityToggle(index)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {item.isAvailable ? 'Disponible' : 'No disponible'}
                    </button>
                  </div>

                  {item.isAvailable ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">RD$</span>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          placeholder="Precio Unitario"
                          value={item.unitPrice || ''}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          className="w-full pl-11 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Subtotal</p>
                        <p className="text-xs font-bold text-slate-800">
                          RD$ {(item.unitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-600 text-[11px] mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Este ítem no se incluirá en el total general.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tiempo de Entrega Global */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Tiempo de Entrega Estimado
            </label>
            <select
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              <option value="Inmediato (1-2 horas)">Inmediato (1-2 horas)</option>
              <option value="Mismo día (4-6 horas)">Mismo día (4-6 horas)</option>
              <option value="Siguiente día (24 horas)">Siguiente día (24 horas)</option>
              <option value="48 horas">48 horas</option>
            </select>
          </div>

          {/* Notas de la Oferta */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Notas / Condiciones de Venta</label>
            <textarea
              placeholder="Ej: Precios válidos por 5 días. Incluye descarga a pie de camión..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />
          </div>

          {/* Resumen de Totales */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 shadow-lg">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal Neto</span>
              <span>RD$ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>ITBIS (18%)</span>
              <span>RD$ {itbis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="h-px bg-slate-800 my-1"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-400">Total Cotizado</span>
              <span className="text-base font-extrabold text-white">
                RD$ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full py-3.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/10 transition-all min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Enviar Oferta
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BidFormModal;