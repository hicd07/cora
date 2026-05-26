import React from 'react';
import { Bell, HardHat, Store } from 'lucide-react';
import { useSessionContext } from '@/components/auth/SessionContext';

export const Header: React.FC = () => {
  const { profile } = useSessionContext();
  const isProvider = profile?.user_type === 'hardware';

  return (
    <header className="sticky top-0 z-40 flex flex-col gap-2.5 border-b border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-500 p-1.5 text-white">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">ConstruBid</h1>
            <p className="text-[10px] font-medium text-slate-500">B2B Marketplace • SDE</p>
          </div>
        </div>

        <button
          className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500"></span>
        </button>
      </div>

      {isProvider ? (
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Store className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-800">Modo Ferretería Activo</span>
          </div>
          <span className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-[9px] font-bold text-blue-700">
            Proveedor
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <HardHat className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-800">Modo Ingeniero Activo</span>
          </div>
          <span className="rounded-full border border-amber-100 bg-white px-2 py-0.5 text-[9px] font-bold text-amber-600">
            Cliente
          </span>
        </div>
      )}
    </header>
  );
};

export default Header;
