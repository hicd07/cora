import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessionContextProvider, useSessionContext } from "./components/auth/SessionContext";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6">
    <div className="app-shell w-full max-w-sm p-7 text-center">
      <div className="panel-muted mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border-primary/15 bg-[hsl(var(--primary)/0.08)]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
      <p className="font-display mt-5 text-base font-semibold text-foreground">Cargando PIDO</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Preparando tu panel de compras, oportunidades y comparativas.</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading } = useSessionContext();

  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/auth" replace />;
  if (!profile) return <FullScreenLoader />;
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
