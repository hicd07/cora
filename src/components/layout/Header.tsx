import React from 'react';
import { Bell, HardHat, Store } from 'lucide-react';
import { useSessionContext } from '@/components/auth/SessionContext';

interface HeaderProps {
  role: 'engineer' | 'hardware';
  setRole: (role: 'engineer' | 'hardware') => void;
}

export const Header: React.FC<HeaderProps> = ({ role, setRole }) => {
  const { profile } = useSessionContext();
  const isProvider = profile?.user_type === 'hardware';

  return (
    <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex flex-col gap-2.5 z-40 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-white p-1.5 rounded-lg">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">ConstruBid</h1>
            <p className="text-[10px] text-slate-500 font-medium">B2B Marketplace • SDE</p>
          </div>
        </div>
        
        <button 
          className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
        </button>
      </div>

      {/* Selector de Rol Interactivo - Solo visible/activo para proveedores */}
      {isProvider ? (
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setRole('engineer')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'engineer'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            Modo Ingeniero
          </button>
          <button
            onClick={() => setRole('hardware')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'hardware'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Modo Ferretería
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HardHat className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-800">Modo Ingeniero Activo</span>
          </div>
          <span className="text-[9px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded-full border border-amber-100">
            Comprador
          </span>
        </div>
      )}
    </header>
  );
};

export default Header;