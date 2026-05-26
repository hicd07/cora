import React, { useState } from 'react';
import { X, Store, MapPin, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { useSessionContext, Profile } from '@/components/auth/SessionContext';
import { showSuccess } from '@/utils/toast';

interface ProviderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTORS = [
  'Alma Rosa I',
  'Alma Rosa II',
  'Ensanche Ozama',
  'Lucerna',
  'San Isidro',
  'El Almirante',
  'Carretera Mella',
  'Av. España'
];

export const ProviderProfileModal: React.FC<ProviderProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useSessionContext();
  if (!isOpen || !profile) return null;

  const [storeName, setStoreName] = useState(profile.store_name || profile.full_name || '');
  const [sector, setSector] = useState(profile.sector || SECTORS[0]);
  const [deliveryCoverage, setDeliveryCoverage] = useState<string[]>(profile.delivery_coverage || []);
  const [isPublic, setIsPublic] = useState<boolean>(profile.is_public !== undefined ? profile.is_public : true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleSector = (sec: string) => {
    if (deliveryCoverage.includes(sec)) {
      setDeliveryCoverage(deliveryCoverage.filter(s => s !== sec));
    } else {
      setDeliveryCoverage([...deliveryCoverage, sec]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    setIsSubmitting(true);
    await updateProfile({
      store_name: storeName,
      full_name: storeName, // Keep full_name in sync
      sector,
      delivery_coverage: deliveryCoverage,
      is_public: isPublic,
    });

    setIsSubmitting(false);
    showSuccess('¡Perfil de ferretería actualizado con éxito!');
    onClose();
  };

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
              <h3 className="font-bold text-slate-900 text-base">Mi Perfil de Empresa</h3>
              <p className="text-[10px] text-slate-500">Edita tu perfil comercial y tu visibilidad en SDE</p>

            </div>
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
          
          {/* Nombre Comercial */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Nombre de la Ferretería</label>
            <input
              type="text"
              required
              placeholder="Ej: Ferretería El Progreso SDE"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Sector de Ubicación */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              Sector Principal (SDE)
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              {SECTORS.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Cobertura de Entrega */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Zonas de Cobertura de Entrega</label>
            <p className="text-[10px] text-slate-500">Selecciona todos los sectores donde realizas despachos:</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {SECTORS.map((sec) => {
                const isSelected = deliveryCoverage.includes(sec);
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleToggleSector(sec)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 text-amber-800 font-bold'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sec}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibilidad del Perfil (Público / Privado) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Visibilidad del Perfil</h4>
                  <p className="text-[10px] text-slate-500">
                    {isPublic ? 'Visible para usuarios tipo cliente' : 'Oculto para usuarios tipo cliente'}
                  </p>

                </div>
              </div>

              {/* Switch de Visibilidad */}
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isPublic ? 'bg-amber-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              Si tu perfil es <strong>Público</strong>, aparecerás en la sección de "Mercado" y los usuarios tipo cliente podrán ver tu información comercial y cobertura. Si es <strong>Privado</strong>, no aparecerás en la lista pública.
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
              className="w-full py-3.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/10 transition-all min-h-[48px] flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Guardar Perfil
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProviderProfileModal;