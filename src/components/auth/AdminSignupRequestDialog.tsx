import { useState } from "react";
import { ShieldCheck, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface AdminSignupRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminSignupRequestDialog = ({ open, onOpenChange }: AdminSignupRequestDialogProps) => {
  const [form, setForm] = useState({ fullName: "", email: "", reason: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.includes("@")) {
      showError("Ingresa un correo válido.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-signup-request", {
        body: form,
      });
      if (error || (data as { error?: string })?.error) {
        throw new Error((data as { error?: string })?.error || error?.message);
      }
      showSuccess("Solicitud enviada. Recibirás una respuesta tras la aprobación.");
      onOpenChange(false);
      setForm({ fullName: "", email: "", reason: "" });
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle>Solicitar acceso administrador</DialogTitle>
          <DialogDescription>
            Completa el formulario y tu solicitud será enviada para aprobación. Recibirás acceso una vez
            sea revisada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Tu nombre"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Correo electrónico</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Motivo de la solicitud</Label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Explica por qué necesitas acceso administrador..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              <Send className="h-4 w-4" />
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSignupRequestDialog;
