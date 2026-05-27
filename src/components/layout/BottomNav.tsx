Pedidos, Pedidos -> Historial">
import React from "react";
import { ClipboardList, Gavel, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  role: "engineer" | "hardware";
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ role, activeTab, setActiveTab }) => {
  const navItems = [
    { id: "bids", label: "Pedidos", icon: Gavel },
    { id: "market", label: role === "hardware" ? "Mi empresa" : "Mercado", icon: Store },
    { id: "orders", label: "Historial", icon: ClipboardList },
    { id: "account", label: "Cuenta", icon: User },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 floating-nav p-2">
      <div className="grid grid-cols-4 gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "interactive-row relative flex min-h-[58px] flex-col items-center justify-center rounded-[1.2rem] border px-2 py-2 text-center",
                isActive
                  ? "border-primary/25 bg-[hsl(var(--primary)/0.14)] text-foreground shadow-[0_16px_28px_-24px_hsl(var(--primary)/0.75)]"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground",
              )}
              aria-label={item.label}
            >
              <Icon className={cn("h-4 w-4 transition-transform duration-200", isActive ? "scale-110 text-primary" : "text-current")} />
              <span className="font-mono mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">{item.label}</span>
              <span
                className={cn(
                  "mt-1 h-1 rounded-full bg-primary transition-all duration-200",
                  isActive ? "w-6 opacity-100" : "w-1 opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;