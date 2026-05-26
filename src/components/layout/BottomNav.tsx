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
    { id: "bids", label: "Subastas", icon: Gavel },
    { id: "market", label: role === "hardware" ? "Mi empresa" : "Mercado", icon: Store },
    { id: "orders", label: "Pedidos", icon: ClipboardList },
    { id: "account", label: "Cuenta", icon: User },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-xl border border-border bg-[hsl(var(--surface-1)/0.96)] p-2 backdrop-blur">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center rounded-lg border px-2 py-2 transition-colors",
                isActive
                  ? "border-primary/25 bg-[hsl(var(--primary)/0.12)] text-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              aria-label={item.label}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span className="font-mono mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
