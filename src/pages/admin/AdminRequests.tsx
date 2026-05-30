import { Check, X, ShieldQuestion } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import AdminLayout from "@/components/admin/AdminLayout";
import { useSignupRequests, useReviewSignupRequest } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";

export const AdminRequests = () => {
  const { data: requests, isLoading } = useSignupRequests();
  const review = useReviewSignupRequest();

  const handleReview = async (requestId: string, approve: boolean) => {
    try {
      await review.mutateAsync({ requestId, approve });
      showSuccess(approve ? "Solicitud aprobada." : "Solicitud rechazada.");
    } catch (e) {
      showError((e as Error).message);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "approved")
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Aprobada</Badge>;
    if (status === "rejected")
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rechazada</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendiente</Badge>;
  };

  return (
    <AdminLayout title="Solicitudes de administrador">
      <p className="mb-5 text-sm text-muted-foreground">
        Aquí aparecen las solicitudes enviadas desde el formulario público de registro de administradores.
        Al aprobar, el usuario obtiene el rol <strong>admin</strong> al iniciar sesión.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(requests ?? []).map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldQuestion className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{r.full_name || "Sin nombre"}</p>
                      <p className="text-sm text-muted-foreground">{r.email}</p>
                    </div>
                  </div>
                  {r.reason && (
                    <p className="mt-3 rounded-xl bg-[hsl(var(--surface-2))] p-3 text-sm text-muted-foreground">
                      "{r.reason}"
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
                {statusBadge(r.status)}
              </div>

              {r.status === "pending" && (
                <div className="mt-4 flex gap-2 border-t border-border pt-4">
                  <Button
                    size="sm"
                    onClick={() => handleReview(r.id, true)}
                    disabled={review.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="h-4 w-4" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(r.id, false)}
                    disabled={review.isPending}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          ))}
          {(requests ?? []).length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay solicitudes pendientes.
            </p>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRequests;
