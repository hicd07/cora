"use client";

import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Mail, 
  ShieldCheck, 
  ArrowLeft, 
  LogOut, 
  Beaker, 
  HardHat, 
  Store,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import AppLogo from "@/components/branding/AppLogo";
import { useSessionContext } from "@/components/auth/SessionContext";
import { useAdminMode } from "@/contexts/AdminModeContext";

const navItems = [
  { to: "/admin", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Usuarios", icon: Users, end: false },
  { to: "/admin/invitations", label: "Invitaciones", icon: Mail, end: false },
  { to: "/admin/requests", label: "Solicitudes", icon: ShieldCheck, end: false },
  { to: "/admin/settings", label: "Configuración", icon: Settings, end: false },
];

export const AdminLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useSessionContext();
  const { isTestMode, toggleTestMode, simulatedUserType, setSimulatedUserType } = useAdminMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", !mobile && "py-4")}>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md translate-x-1"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-border p-4 space-y-6">
        <div className="flex flex-col gap-5 px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Beaker className={cn("h-4 w-4", isTestMode ? "text-amber-500" : "text-muted-foreground")} />
              Simulacro de Roles
            </div>
            <Switch checked={isTestMode} onCheckedChange={toggleTestMode} />
          </div>
          
          {isTestMode && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actuar como:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSimulatedUserType('engineer')}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all",
                    simulatedUserType === 'engineer' 
                      ? "border-primary bg-primary/10 text-primary shadow-sm" 
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <HardHat className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Ingeniero</span>
                </button>
                <button
                  onClick={() => setSimulatedUserType('hardware')}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all",
                    simulatedUserType === 'hardware' 
                      ? "border-primary bg-primary/10 text-primary shadow-sm" 
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Store className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Ferretería</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Salir al Portal
          </button>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-border bg-background shadow-sm">
        <div className="flex h-20 items-center gap-3 border-b border-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <AppLogo variant="symbol" context="header" size={24} />
          </div>
          <span className="font-display text-base font-bold tracking-tight">CORA Admin</span>
        </div>
        <NavContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-muted-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 rounded-r-[2rem] border-r-0">
                <SheetHeader className="p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <AppLogo variant="symbol" context="header" size={24} />
                    </div>
                    <SheetTitle className="font-display text-lg font-bold">Admin CORA</SheetTitle>
                  </div>
                </SheetHeader>
                <NavContent mobile />
              </SheetContent>
            </Sheet>

            <h1 className="font-display text-lg font-bold tracking-tight">{title}</h1>
            
            {isTestMode && (
              <Badge className="ml-2 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm hidden md:inline-flex gap-1.5 px-3">
                <Beaker className="h-3 w-3" />
                PRUEBAS: {simulatedUserType?.toUpperCase()}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-bold leading-none">{profile?.full_name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-semibold">Administrador</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </header>

        {/* Mobile Sub-Header for Active Test Mode */}
        {isTestMode && (
          <div className="lg:hidden flex items-center justify-between bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
              <Beaker className="h-3.5 w-3.5" />
              Simulando {simulatedUserType === 'engineer' ? 'Ingeniero' : 'Ferretería'}
            </span>
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-[10px] font-bold text-amber-600 uppercase"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              Cambiar
            </Button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-10 bg-[hsl(var(--surface-2)/0.5)]">
          <div className="mx-auto max-w-6xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;