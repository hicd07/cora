import React, { useState, useEffect } from "react";
import { User, Store, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLogo from "@/components/branding/AppLogo";
import { supabase } from "@/integrations/supabase/client";
import { useSessionContext } from "@/components/auth/SessionContext";
import { dismissToast, showError, showLoading, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

export const ProfileOnboarding: React.FC = () => {
  const { profile, updateProfile } = useSessionContext();
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [userType, setUserType] = useState<"engineer" | "hardware" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || profile.store_name || "");
      setDocumentId(profile.document_id || "");
      setUserType(profile.user_type || null);
    }
  }, [profile]);

  const handleOnboardingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!fullName || !documentId || !userType) {
      showError("Por favor, completa todos los campos de registro.");
      return;
    }

    setLoading(true);
    const toastId = showLoading("Guardando tu perfil...");

    try {
      const user = (await supabase.auth.getUser()).data.user;

      if (!user) {
        throw new Error("No se encontró un usuario activo.");
      }

      await updateProfile({
        id: user.id,
        full_name: fullName.trim(),
        document_id: documentId.trim(),
        user_type: userType,
        onboarded: true,
        store_name: userType === "hardware" ? fullName.trim() : null,
        sector: null,
        delivery_coverage: [],
        is_public: false,
        rating: 0,
        reviews_count: 0,
      });

      // updateProfile already updates the local profile state with onboarded=true,
      // so we don't need to refetch — that avoids a redundant network call that
      // could leave the user stuck on the global loader if Supabase is slow.
      dismissToast(toastId);
      showSuccess("Perfil configurado con éxito.");
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || "Error al guardar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4 sm:px-6 animate-fade-up">
      <div className="w-full max-w-lg mb-8">
        {/* Progress bar */}
        <div className="w-full bg-surface-2 h-1.5 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-primary w-full rounded-full transition-all duration-1000 ease-out" />
        </div>
        
        <div className="flex justify-center mb-6">
          <AppLogo />
        </div>
        
        <div className="text-center space-y-2 mb-10">
          <p className="section-label text-primary">Último paso</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Completa tu perfil
          </h1>
          <p className="text-muted-foreground">
            Define tu tipo de operación para activar tu experiencia en PIDO.
          </p>
        </div>

        <form onSubmit={handleOnboardingSubmit} className="space-y-6 panel-muted p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setUserType("engineer")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all",
                userType === "engineer"
                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]"
                  : "border-border bg-surface-1 text-muted-foreground hover:bg-surface-2",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-0 border">
                <User className="h-6 w-6" />
              </div>
              <div>
                <span className="block font-semibold">Ingeniero / Comprador</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setUserType("hardware")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all",
                userType === "hardware"
                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]"
                  : "border-border bg-surface-1 text-muted-foreground hover:bg-surface-2",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-0 border">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <span className="block font-semibold">Ferretería / Proveedor</span>
              </div>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-semibold text-foreground ml-1">
                {userType === "hardware" ? "Nombre de la ferretería" : "Nombre completo"}
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={userType === "hardware" ? "Ferretería Ejemplo" : "Juan Pérez"}
                className="field-soft h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="documentId" className="text-sm font-semibold text-foreground ml-1">
                {userType === "hardware" ? "RNC de la empresa" : "Cédula o RNC"}
              </label>
              <Input
                id="documentId"
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder={userType === "hardware" ? "1-XX-XXXXX-X" : "001-XXXXXXX-X"}
                className="field-soft h-12"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl text-[15px] font-semibold mt-4"
            disabled={loading || !userType || !fullName || !documentId}
          >
            <ShieldCheck className="mr-2 h-5 w-5" />
            Activar mi cuenta
          </Button>
        </form>
      </div>
    </div>
  );
};
