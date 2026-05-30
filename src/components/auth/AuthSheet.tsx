import React, { useState } from "react";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLogo from "@/components/branding/AppLogo";
import { supabase } from "@/integrations/supabase/client";
import { dismissToast, showError, showLoading, showSuccess } from "@/utils/toast";

export type AuthMode = "login" | "signup";

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode: AuthMode;
  onSuccess?: () => void;
}

export const AuthSheet: React.FC<AuthSheetProps> = ({
  open,
  onOpenChange,
  initialMode,
  onSuccess,
}) => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Update mode when initialMode changes and sheet opens
  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setEmail("");
      setPassword("");
    }
  }, [open, initialMode]);

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      showError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    const toastId = showLoading(mode === "signup" ? "Creando cuenta..." : "Iniciando sesión...");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        dismissToast(toastId);

        if (error) {
          showError(error.message);
          return;
        }

        if (data.user) {
          showSuccess("Cuenta creada. Ahora completa tu perfil.");
          onSuccess?.();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        dismissToast(toastId);

        if (error) {
          showError(error.message);
          return;
        }

        showSuccess("¡Bienvenido de vuelta!");
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const Content = (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex justify-center mb-2">
        <AppLogo />
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold tracking-tight">Bienvenido a Cora</h2>
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Ingresa a tu cuenta para continuar." : "Crea tu cuenta gratis hoy mismo."}
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-surface-2 rounded-2xl">
          <TabsTrigger value="login" className="rounded-xl text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            Iniciar sesión
          </TabsTrigger>
          <TabsTrigger value="signup" className="rounded-xl text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            Crear cuenta
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field-soft pl-12 h-14 text-base"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field-soft pl-12 h-14 text-base"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl text-[15px] font-semibold mt-2" 
            disabled={loading}
          >
            {mode === "login" ? (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Iniciar sesión
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Crear cuenta gratis
              </>
            )}
          </Button>
          
          {mode === "login" && (
            <div className="text-center mt-4">
              <button type="button" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </form>
      </Tabs>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl border-border px-6 pt-6 pb-12 sm:max-w-md mx-auto modal-sheet">
          <SheetHeader className="hidden">
            <SheetTitle>Acceso a Cora</SheetTitle>
          </SheetHeader>
          {Content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-6 border-border modal-backdrop app-shell">
        <DialogHeader className="hidden">
          <DialogTitle>Acceso a Cora</DialogTitle>
        </DialogHeader>
        {Content}
      </DialogContent>
    </Dialog>
  );
};