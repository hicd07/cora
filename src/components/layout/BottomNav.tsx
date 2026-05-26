import React from 'react';
import { Gavel, Store, ClipboardList, User } from 'lucide-react';

interface BottomNavProps {
  role: 'engineer' | 'hardware';
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ role, activeTab, setActiveTab }) => {
  const navItems = role === 'hardware'
    ? [
        { id: 'bids', label: 'Oportunidades', icon: Gavel },
        { id: 'account', label: 'Mi Cuenta', icon: User },
      ]
    : [
        { id: 'bids', label: 'Subastas', icon: Gavel },
        { id: 'market', label: 'Mercado', icon: Store },
        { id: 'orders', label: 'Pedidos', icon: ClipboardList },
        { id: 'account', label: 'Mi Cuenta', icon: User },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-lg z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] transition-all duration-200 ${
                isActive 
                  ? 'text-amber-600 font-semibold scale-105' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label={item.label}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;