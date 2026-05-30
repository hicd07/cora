import React from "react";
import { Bell, Moon, SunMedium, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLogo from "@/components/branding/AppLogo";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useSessionContext } from "@/components/auth/SessionContext";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { isAdmin } = useSessionContext();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-[hsl(var(--surface-1)/0.9)] px-4 py-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.35rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_20px_34px_-24px_hsl(var(--foreground)/0.3)]">
            <div className="absolute inset-[3px] rounded-[1.05rem] bg-[hsl(var(--primary)/0.08)]" />
            <AppLogo variant="symbol" context="header" size={25} className="relative" />
          </div>
          <div>
            <p className="section-label">Cotizador rápido</p>
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">CORA</h1>
            <p className="text-xs text-muted-foreground">Compras y cotizaciones para Santo Domingo Este</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/admin")}
              className="bg-[hsl(var(--surface-1)/0.88)] text-primary"
              aria-label="Panel de administración"
            >
              <ShieldCheck className="h-4 w-4" />
            </Button>
          )}
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
    </header>
  );
};

export default Header;