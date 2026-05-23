import React, { useState } from 'react';
import { X, Check, ShoppingBag, ArrowRight, Store, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BidRequest, mockBidsForRequest1, HardwareBid } from '@/lib/mockData';
import { showSuccess } from '@/utils/toast';

interface BidComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BidRequest | null;
  onCompleteOrder: (requestId: string) => void;
}

export const BidComparisonModal: React.FC<BidComparisonModalProps> = ({ isOpen, onClose, request, onCompleteOrder }) => {
  if (!isOpen || !request) return null;

  // Usar ofertas simuladas para req-1, o generar ofertas dinámicas para nuevas solicitudes
  const bids: HardwareBid[] = request.id === 'req-1' ? mockBidsForRequest1 : [
    {
      storeId: 'store-1',
      storeName: 'Ferretería El Progreso SDE',
      rating: 4.8,
      deliveryTime: 'Mismo día (4-6 horas)',
      offers: request.items.map(item => ({ itemName: item.name, unitPrice: Math.round(100 + Math.random() * 500), isAvailable: true }))
    },
    {
      storeId: 'store-2',
      storeName: 'Mega Ferretería Oriental',
      rating: 4.5,
      deliveryTime: 'Siguiente día (24 horas)',
      offers: request.items.map(item => ({ itemName: item.name, unitPrice: Math.round(90 + Math.random() * 520), isAvailable: Math.random() > 0.15 }))
    }
  ];

  // Estado para almacenar la selección de ferretería por cada ítem
  // Clave: nombre del ítem, Valor: storeId seleccionado
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    request.items.forEach(item => {
      // Seleccionar por defecto la primera ferretería que tenga disponible el ítem
      const availableBid = bids.find(b => b.offers.find(o => o.itemName === item.name)?.isAvailable);
      if (availableBid) {
        initial[item.name] = availableBid.storeId;
      }
    });
    return initial;
  });

  // Estado para controlar si estamos en la pantalla de checkout/confirmación
  const [isCheckout, setIsCheckout] = useState(false);

  const handleSelectProvider = (itemName: string, storeId: string) => {
    setSelections(prev => ({
      ...prev,
      [itemName]: storeId
    }));
  };

  // Calcular totales por ferretería seleccionada
  const getStoreTotals = () => {
    const totals: Record<string, { subtotal: number; items: { name: string; qty: number; unit: string; price: number }[] }> = {};
    
    bids.forEach(bid => {
      totals[bid.storeId] = { subtotal: 0, items: [] };
    });

    request.items.forEach(item => {
      const selectedStoreId = selections[item.name];
      if (selectedStoreId) {
        const bid = bids.find(b => b.storeId === selectedStoreId);
        const offer = bid?.offers.find(o => o.itemName === item.name);
        if (offer && offer.isAvailable) {
          const cost = offer.unitPrice * item.quantity;
          totals[selectedStoreId].subtotal += cost;
          totals[selectedStoreId].items.push({
            name: item.name,
            qty: item.quantity,
            unit: item.unit,
            price: offer.unitPrice
          });
        }
      }
    });

    return totals;
  };

  const storeTotals = getStoreTotals();

  // Calcular totales generales
  const generalSubtotal = Object.values(storeTotals).reduce((acc, curr) => acc + curr.subtotal, 0);
  const generalItbis = generalSubtotal * 0.18; // 18% ITBIS en RD
  const generalTotal = generalSubtotal + generalItbis;

  const handleConfirmMixedOrder = () => {
    setIsCheckout(true);
  };

  const handleFinalizePurchase = () => {
    onCompleteOrder(request.id);
    showSuccess('¡Pedido mixto formalizado! Órdenes de compra enviadas a cada ferretería.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {isCheckout ? 'Confirmar Pedido Mixto' : 'Optimizar Compra'}
            </h3>
            <p className="text-[10px] text-slate-500">
              {isCheckout ? 'Desglose de órdenes de compra' : 'Compara precios por ítem y elige proveedor'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCheckout ? (
          /* PANTALLA 1: TABLERO DE COMPARACIÓN */
          <div className="p-6 space-y-5 flex-1 pb-10">
            
            {/* Info de la Obra */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-1">{request.title}</h4>
              <p className="text-[10px] text-slate-500">Destino: {request.deliveryAddress}</p>
            </div>

            {/* Matriz de Comparación Responsiva */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Comparativa de Precios (RD$)</label>
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {bids.length} Ofertas recibidas
                </span>
              </div>

              {/* Contenedor con scroll horizontal para soportar múltiples ferreterías */}
              <div className="overflow-x-auto pb-2 -mx-6 px-6">
                <div className="min-w-[320px] space-y-3">
                  {request.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Cant: {item.quantity} {item.unit}
                        </span>
                      </div>

                      {/* Opciones de Ferreterías para este ítem */}
                      <div className="grid grid-cols-3 gap-2">
                        {bids.map((bid) => {
                          const offer = bid.offers.find(o => o.itemName === item.name);
                          const isSelected = selections[item.name] === bid.storeId;
                          
                          if (!offer || !offer.isAvailable) {
                            return (
                              <div key={bid.storeId} className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-2 text-center opacity-50">
                                <p className="text-[8px] font-bold text-slate-400 truncate">{bid.storeName}</p>
                                <p className="text-[10px] font-bold text-red-500 mt-1">N/D</p>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={bid.storeId}
                              type="button"
                              onClick={() => handleSelectProvider(item.name, bid.storeId)}
                              className={`border rounded-lg p-2 text-left transition-all flex flex-col justify-between min-h-[64px] ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="text-[8px] font-bold text-slate-500 truncate max-w-[60px]">
                                  {bid.storeName}
                                </span>
                                {isSelected && <Check className="w-3 h-3 text-amber-600 shrink-0" />}
                              </div>
                              <div className="mt-1">
                                <p className="text-[10px] font-extrabold text-slate-800">
                                  RD$ {offer.unitPrice}
                                </p>
                                <p className="text-[8px] text-slate-400">
                                  Total: RD$ {offer.unitPrice * item.quantity}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen de Distribución de Compra */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Distribución del Pedido</label>
              <div className="space-y-2">
                {bids.map(bid => {
                  const totalAllocated = storeTotals[bid.storeId]?.subtotal || 0;
                  const itemsCount = storeTotals[bid.storeId]?.items.length || 0;
                  if (itemsCount === 0) return null;

                  return (
                    <div key={bid.storeId} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{bid.storeName}</p>
                          <p className="text-[9px] text-slate-500">{itemsCount} materiales asignados</p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        RD$ {totalAllocated.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen de Totales Generales */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Neto</span>
                <span>RD$ {generalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>ITBIS (18%)</span>
                <span>RD$ {generalItbis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px bg-slate-800 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400">Total Estimado</span>
                <span className="text-base font-extrabold text-white">
                  RD$ {generalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Botón de Acción */}
            <button
              type="button"
              onClick={handleConfirmMixedOrder}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <ShoppingBag className="w-4 h-4" />
              Confirmar Pedido Mixto
            </button>

          </div>
        ) : (
          /* PANTALLA 2: CHECKOUT Y FORMALIZACIÓN */
          <div className="p-6 space-y-5 flex-1 pb-10">
            
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900">Generación de Órdenes Múltiples</h4>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Se generarán órdenes de compra independientes para cada ferretería seleccionada. Cada una recibirá únicamente los materiales asignados.
                </p>
              </div>
            </div>

            {/* Desglose de Pedidos por Proveedor */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Desglose de Órdenes de Compra</label>
              
              <div className="space-y-3">
                {bids.map(bid => {
                  const data = storeTotals[bid.storeId];
                  if (!data || data.items.length === 0) return null;

                  return (
                    <div key={bid.storeId} className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-white shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-slate-800">{bid.storeName}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          Orden #{Math.floor(1000 + Math.random() * 9000)}
                        </span>
                      </div>

                      {/* Ítems asignados a esta ferretería */}
                      <ul className="space-y-1.5">
                        {data.items.map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex justify-between items-center">
                            <span>{item.name} ({item.qty} {item.unit})</span>
                            <span className="font-semibold text-slate-800">
                              RD$ {(item.price * item.qty).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2 flex justify-between items-center text-[11px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                        <span>Subtotal Orden</span>
                        <span>RD$ {data.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen de Pago Consolidado */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 shadow-lg">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Neto Consolidado</span>
                <span>RD$ {generalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>ITBIS Consolidado (18%)</span>
                <span>RD$ {generalItbis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px bg-slate-800 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400">Total Consolidado</span>
                <span className="text-base font-extrabold text-white">
                  RD$ {generalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsCheckout(false)}
                className="w-full py-3.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[48px]"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleFinalizePurchase}
                className="w-full py-3.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/10 transition-all min-h-[48px] flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalizar Compra
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default BidComparisonModal;