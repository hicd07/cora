"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showError("Por favor, ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    const toastId = showLoading("Enviando correo de recuperación...");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      dismissToast(toastId);

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess("Correo enviado con éxito.");
      setSent(true);
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Send className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold">¡Revisa tu correo!</h2>
          <p className="text-sm text-muted-foreground">
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Sigue las instrucciones para restablecer tu contraseña.
          </p>
        </div>
        <Button variant="outline" onClick={onBack} className="h-12 rounded-xl">
          Volver al inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-2xl font-bold">Recuperar contraseña</h2>
        <p className="text-sm text-muted-foreground">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
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

        <Button 
          type="submit" 
          className="w-full h-14 rounded-2xl text-[15px] font-semibold" 
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;