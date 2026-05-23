import React from 'react';
import { Bell, HardHat } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between z-40 shadow-sm">
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
    </header>
  );
};

export default Header;