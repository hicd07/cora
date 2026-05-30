import AppLogo from "@/components/branding/AppLogo";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessionContextProvider, useSessionContext } from "./components/auth/SessionContext";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { Button } from "./components/ui/button";
import { RefreshCw } from "lucide-react";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6">
    <div className="app-shell w-full max-w-sm p-7 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.8rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_24px_44px_-30px_hsl(var(--foreground)/0.45)]">
          <div className="absolute inset-[6px] rounded-[1.35rem] bg-[hsl(var(--primary)/0.08)]" />
          <div className="absolute inset-0 animate-spin rounded-[1.8rem] border-2 border-primary/20 border-t-primary/80" />
          <AppLogo variant="symbol" context="header" size={34} className="relative" />
        </div>
      </div>
      <p className="font-display mt-5 text-base font-semibold text-foreground">Cargando Cora</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Preparando tu panel de compras, oportunidades y comparativas.</p>
    </div>
  </div>
);

const ProfileErrorScreen = ({ onRetry, onSignOut }: { onRetry: () => void; onSignOut: () => void }) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6">
    <div className="app-shell w-full max-w-sm p-7 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[hsl(var(--surface-1))]">
        <AppLogo variant="symbol" context="header" size={30} />
      </div>
      <p className="font-display mt-5 text-base font-semibold text-foreground">No pudimos cargar tu perfil</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Hubo un problema consultando tu cuenta en Cora. Verifica tu conexión y vuelve a intentarlo.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Button onClick={onRetry} className="w-full justify-center">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
        <Button variant="outline" onClick={onSignOut} className="w-full justify-center">
          Cerrar sesión
        </Button>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading, profileError, refreshProfile, signOut } = useSessionContext();

  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/auth" replace />;

  // If we have a session but couldn't load the profile, show a recoverable error
  // instead of an infinite loader.
  if (!profile) {
    if (profileError) {
      return <ProfileErrorScreen onRetry={() => refreshProfile()} onSignOut={() => signOut()} />;
    }
    return <FullScreenLoader />;
  }

  if (!profile.onboarded) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

const AuthRoute = () => {
  const { session, profile, loading } = useSessionContext();

  if (loading) return <FullScreenLoader />;
  if (session && profile?.onboarded) return <Navigate to="/" replace />;

  return <Auth />;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
    />
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      }
    />
    <Route path="/auth" element={<AuthRoute />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SessionContextProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </SessionContextProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;