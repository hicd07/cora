import React from "react";
import { Bell, HardHat, Moon, Store, SunMedium } from "lucide-react";
import { useSessionContext } from "@/components/auth/SessionContext";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";

export const Header: React.FC = () => {
  const { profile } = useSessionContext();
  const { theme, toggleTheme } = useTheme();
  const isProvider = profile?.user_type === "hardware";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[hsl(var(--surface-1)/0.92)] px-4 py-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-primary text-primary-foreground">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <p className="section-label">Marketplace B2B</p>
            <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">ConstruBid</h1>
            <p className="text-xs text-muted-foreground">Compras y cotizaciones para Santo Domingo Este</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-11 w-11 bg-transparent"
            aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" className="relative h-11 w-11 bg-transparent" aria-label="Notificaciones">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-sm bg-primary" />
          </Button>
        </div>
      </div>

      <div className="panel-muted mt-4 flex items-center justify-between rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${isProvider ? "bg-[hsl(var(--accent))] text-sky-700 dark:text-sky-300" : "bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--warning-foreground))]"}`}>
            {isProvider ? <Store className="h-4 w-4" /> : <HardHat className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              {isProvider ? "Modo Ferretería Activo" : "Modo Ingeniero Activo"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isProvider ? "Recibe oportunidades cercanas y gestiona tu perfil comercial." : "Publica subastas, compara ofertas y optimiza tus compras."}
            </p>
          </div>
        </div>
        <span className={`data-chip ${isProvider ? "" : "data-chip-accent"}`}>{isProvider ? "Proveedor" : "Cliente"}</span>
      </div>
    </header>
  );
};

export default Header;
