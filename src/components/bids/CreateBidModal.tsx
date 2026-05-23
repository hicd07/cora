import React, { useState } from 'react';
import { X, HardHat, Calendar, MapPin, DollarSign, FileText, Info } from 'lucide-react';
import { showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { BidRequest } from '@/lib/mockData';

interface CreateBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newRequest: BidRequest) => void;
}

const CATEGORIES = [
  { id: 'Cemento y Agregados', label: 'Cemento y Agregados' },
  { id: 'Metales y Estructuras', label: 'Metales y Estructuras' },
  { id: 'Plomería', label: 'Plomería' },
  { id: 'Bloques y Ladrillos', label: 'Bloques y Ladrillos' },
  { id: 'Electricidad', label: 'Electricidad' }
];

const SECTORS = [
  'Alma Rosa I',
  'Alma Rosa II',
  'Ensanche Ozama',
  'Lucerna',
  'San Isidro',
  'El Almirante'
];

const UNITS = ['Fundas', 'Varillas', 'Metros Cúbicos', 'Unidades', 'Pies', 'Cajas'];

export const CreateBidModal: React.FC<CreateBidModalProps> = ({ isOpen, onClose, onPublish }) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [sector, setSector] = useState(SECTORS[0]);
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [expiresIn, setExpiresIn] = useState('24'); // horas
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !quantity || !address) return;

    setIsSubmitting(true);
    const toastId = showLoading('Buscando ferreterías aliadas en SDE...');

    // Simulación de envío en tiempo real y geolocalización de ferreterías
    setTimeout(() => {
      dismissToast(toastId);
      
      const newRequest: BidRequest = {
        id: `req-${Date.now()}`,
        title: `${quantity} ${unit} de ${title}`,
        category,
        deliveryAddress: `${address}, ${sector}`,
        sector,
        status: 'active',
        itemsCount: 1,
        budgetLimit: budget ? parseFloat(budget) : undefined,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + parseInt(expiresIn) * 60 * 60 * 1000).toISOString(),
        bidsCount: 0,
      };

      onPublish(newRequest);
      setIsSubmitting(false);
      showSuccess('¡Requerimiento publicado! Notificando a 8 ferreterías en SDE en tiempo real.');
      onClose();
      
      // Reset form
      setTitle('');
      setQuantity('');
      setAddress('');
      setBudget('');
      setNotes('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header del Modal */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Publicar Requerimiento</h3>
              <p className="text-[10px] text-slate-500">Cotizaciones rápidas en SDE</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 pb-10">
          
          {/* Material / Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">¿Qué material necesitas?</label>
            <input
              type="text"
              required
              placeholder="Ej: Cemento Gris Portland, Varillas de 3/8..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Cantidad y Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Cantidad</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ej: 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Unidad</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sector y Dirección de Entrega */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Sector de Entrega (SDE)
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                {SECTORS.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Dirección Exacta de Obra</label>
              <input
                type="text"
                required
                placeholder="Calle, número, referencia..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Presupuesto Límite y Tiempo de Expiración */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Presupuesto Máx.
              </label>
              <input
                type="number"
                placeholder="Opcional (RD$)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Duración Subasta
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="12">12 Horas</option>
                <option value="24">24 Horas</option>
                <option value="48">48 Horas</option>
                <option value="72">72 Horas</option>
              </select>
            </div>
          </div>

          {/* Notas Opcionales */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notas / Instrucciones Especiales
            </label>
            <textarea
              placeholder="Ej: Entregar en segundo nivel, se requiere camión con grúa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />
          </div>

          {/* Info de Cobertura */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Al publicar, notificaremos instantáneamente a las ferreterías verificadas que cubren <strong>{sector}</strong>.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-3.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/10 transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Publicar'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateBidModal;