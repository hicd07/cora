import { useState } from "react";
import { Send, Mail, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import AdminLayout from "@/components/admin/AdminLayout";
import { useInvitations, useInviteUser } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";

const ROLE_OPTIONS = [
  { key: "user", label: "Usuario" },
  { key: "engineer", label: "Ingeniero" },
  { key: "hardware", label: "Ferretería" },
  { key: "admin", label: "Administrador" },
];

export const AdminInvitations = () => {
  const { data: invitations, isLoading } = useInvitations();
  const invite = useInviteUser();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const handleInvite = async () => {
    if (!email.includes("@")) {
      showError("Ingresa un correo válido.");
      return;
    }
    try {
      await invite.mutateAsync({ email, role });
      showSuccess(`Invitación enviada a ${email}.`);
      setEmail("");
    } catch (e) {
      showError((e as Error).message);
    }
  };

  return (
    <AdminLayout title="Invitaciones">
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-4 w-4" />
          </div>
          <h2 className="font-display text-base font-semibold">Invitar por correo</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Correo del invitado</Label>
            <Input
              type="email"
              placeholder="nuevo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                    role === r.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-[hsl(var(--surface-2))] text-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleInvite} disabled={invite.isPending}>
            <Send className="h-4 w-4" />
            {invite.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      <h3 className="mb-3 mt-8 font-display text-sm font-semibold text-muted-foreground">
        Historial de invitaciones
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(invitations ?? []).map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
            >
              <div>
                <p className="font-medium text-sm">{inv.email}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{inv.role}</Badge>
                {inv.status === "accepted" ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Aceptada
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Clock className="mr-1 h-3 w-3" />
                    Pendiente
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {(invitations ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay invitaciones aún.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInvitations;
