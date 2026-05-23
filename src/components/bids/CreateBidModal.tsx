import React, { useState } from 'react';
import { X, HardHat, Calendar, MapPin, DollarSign, FileText, Info, Plus, Trash2 } from 'lucide-react';
import { showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { BidRequest, QuoteItem } from '@/lib/mockData';

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

const UNITS = ['Fundas', 'Varillas', 'Metros Cúbicos', 'Unidades', 'Pies', 'Cajas', 'Quintales'];

export const CreateBidModal: React.FC<CreateBidModalProps> = ({ isOpen, onClose, onPublish }) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [sector, setSector] = useState(SECTORS[0]);
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [expiresIn, setExpiresIn] = useState('24'); // horas
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para la lista dinámica de materiales
  const [items, setItems] = useState<QuoteItem[]>([
    { name: '', quantity: 1, unit: UNITS[0] }
  ]);

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: UNITS[0] }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' ? parseFloat(value) || 0 : value
    };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!title || !address) return;
    const validItems = items.filter(item => item.name.trim() !== '' && item.quantity > 0);
    if (validItems.length === 0) {
      alert('Por favor, añade al menos un material válido.');
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading('Buscando ferreterías aliadas en SDE...');

    setTimeout(() => {
      dismissToast(toastId);
      
      const newRequest: BidRequest = {
        id: `req-${Date.now()}`,
        title: title,
        category,
        deliveryAddress: `${address}, ${sector}`,
        sector,
        status: 'active',
        items: validItems,
        itemsCount: validItems.length,
        budgetLimit: budget ? parseFloat(budget) : undefined,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + parseInt(expiresIn) * 60 * 60 * 1000).toISOString(),
        bidsCount: 0,
      };

      onPublish(newRequest);
      setIsSubmitting(false);
      showSuccess(`¡Solicitud publicada! Notificando a ferreterías en ${sector} en tiempo real.`);
      onClose();
      
      // Reset form
      setTitle('');
      setItems([{ name: '', quantity: 1, unit: UNITS[0] }]);
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
              <h3 className="font-bold text-slate-900 text-base">Solicitar Cotización</h3>
              <p className="text-[10px] text-slate-500">Múltiples materiales en un solo pedido</p>
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
          
          {/* Título de la Cotización */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Nombre de la Obra / Proyecto</label>
            <input
              type="text"
              required
              placeholder="Ej: Vaciado de Techo - Segunda Planta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Categoría Principal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Categoría Principal</label>
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

          {/* LISTA DINÁMICA DE MATERIALES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">Lista de Materiales</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-amber-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Material
              </button>
            </div>

            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Material (ej: Cemento Gris)"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Cant."
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 bg-white text-center focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="w-24">
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      aria-label="Eliminar material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
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