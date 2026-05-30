"use client";

import React, { useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";

interface ResetPasswordFormProps {
  onSuccess: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      showError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const toastId = showLoading("Actualizando contraseña...");

    try {
      const { error } = await supabase.auth.updateUser({ password });

      dismissToast(toastId);

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess("Contraseña actualizada con éxito.");
      setCompleted(true);
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col gap-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold">¡Contraseña lista!</h2>
          <p className="text-sm text-muted-foreground">
            Tu contraseña ha sido actualizada correctamente. Ya puedes acceder a CORA.
          </p>
        </div>
        <Button onClick={onSuccess} className="h-14 rounded-2xl text-[15px] font-semibold">
          Continuar al Panel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-2xl font-bold">Nueva contraseña</h2>
        <p className="text-sm text-muted-foreground">
          Crea una nueva contraseña segura para tu cuenta.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div className="space-y-4">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="field-soft pl-12 h-14 text-base"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="field-soft pl-12 h-14 text-base"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-14 rounded-2xl text-[15px] font-semibold" 
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Restablecer contraseña"}
        </Button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;