import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Settings, Users, Mail, ShieldCheck, ArrowLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AppLogo from "@/components/branding/AppLogo";
import { useSessionContext } from "@/components/auth/SessionContext";

const navItems = [
  { to: "/admin", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Usuarios", icon: Users, end: false },
  { to: "/admin/invitations", label: "Invitaciones", icon: Mail, end: false },
  { to: "/admin/requests", label: "Solicitudes", icon: ShieldCheck, end: false },
  { to: "/admin/settings", label: "Configuración", icon: Settings, end: false },
];

export const AdminLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const navigate = useNavigate();
  const { profile, signOut } = useSessionContext();

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] lg:flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-border bg-background">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <AppLogo variant="symbol" context="header" size={28} />
          <span className="font-display text-sm font-bold tracking-tight">CORA Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3 space-y-1">
          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la app
          </button>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden -ml-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-lg font-semibold">{title}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{profile?.full_name || "Administrador"}</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2 lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--surface-2))] text-muted-foreground",
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
