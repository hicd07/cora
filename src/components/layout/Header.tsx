import React from "react";
import { Bell, HardHat, Moon, Store, SunMedium } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "@/components/auth/SessionContext";
import AppLogo from "@/components/branding/AppLogo";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useSessionContext();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const isProvider = profile?.user_type === "hardware";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-[hsl(var(--surface-1)/0.9)] px-4 py-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.35rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_20px_34px_-24px_hsl(var(--foreground)/0.3)]">
            <div className="absolute inset-[3px] rounded-[1.05rem] bg-[hsl(var(--primary)/0.08)]" />
            <AppLogo variant="symbol" context="header" size={25} className="relative" />
          </div>
          <div>
            <p className="section-label">Marketplace B2B</p>
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">PIDO</h1>
            <p className="text-xs text-muted-foreground">Compras y cotizaciones para Santo Domingo Este</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="bg-[hsl(var(--surface-1)/0.88)]"
            aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="relative bg-[hsl(var(--surface-1)/0.88)]"
            aria-label="Abrir notificaciones"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground shadow-[0_0_0_5px_hsl(var(--background))]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="panel-muted mt-4 flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-[1.05rem] ${
              isProvider
                ? "bg-[hsl(var(--accent))] text-sky-700 dark:text-sky-300"
                : "bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--warning-foreground))]"
            }`}
          >
            {isProvider ? <Store className="h-[18px] w-[18px]" /> : <HardHat className="h-[18px] w-[18px]" />}
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              {isProvider ? "Modo Ferretería Activo" : "Modo Ingeniero Activo"}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {isProvider
                ? "Recibe oportunidades reales y gestiona tu presencia comercial."
                : "Publica solicitudes reales, compara ofertas y consolida compras."}
            </p>
          </div>
        </div>
        <span className={`data-chip ${isProvider ? "" : "data-chip-accent"}`}>{isProvider ? "Proveedor" : "Cliente"}</span>
      </div>
    </header>
  );
};

export default Header;
