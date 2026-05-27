import React, { useState, useEffect } from "react";
import { useSessionContext } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Save, User, Store, HardHat } from "lucide-react";
import { dismissToast, showError, showLoading, showSuccess } from "@/utils/toast";

const Profile: React.FC = () => {
  const { profile, refreshProfile } = useSessionContext();
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);

  const isProvider = profile?.user_type === "hardware";

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDocumentId(profile.document_id || "");
      setStoreName(profile.store_name || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    const toastId = showLoading("Guardando cambios...");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          document_id: documentId,
          store_name: isProvider ? storeName : null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();
      dismissToast(toastId);
      showSuccess("Perfil actualizado correctamente.");
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || "Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const toastId = showLoading("Cerrando sesión...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dismissToast(toastId);
      showSuccess("Sesión cerrada correctamente.");
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || "Error al cerrar sesión.");
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Mi Cuenta</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu información de perfil y preferencias.</p>
      </div>

      {/* Active Mode Panel moved from Header */}
      <div className="panel-muted flex items-center justify-between gap-4 px-4 py-3.5">
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

      <Card className="border-border/70 bg-surface-1">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Datos Personales</CardTitle>
          <CardDescription>Actualiza la información de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="field-soft"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentId">Cédula o RNC</Label>
              <Input
                id="documentId"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="001-XXXXXXX-X"
                className="field-soft"
                required
              />
            </div>

            {isProvider && (
              <div className="space-y-2">
                <Label htmlFor="storeName">Nombre de la Ferretería</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ferretería Ejemplo"
                  className="field-soft"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full h-11 rounded-xl" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar Sesión
      </Button>
    </div>
  );
};

export default Profile;