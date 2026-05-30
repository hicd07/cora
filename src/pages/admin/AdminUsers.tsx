import { useState } from "react";
import { UserPlus, Trash2, ShieldCheck, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  useAdminUsers,
  useCreateUser,
  useSetUserRole,
  useDeleteUser,
  AdminUser,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showError, showSuccess } from "@/utils/toast";
import { useSessionContext } from "@/components/auth/SessionContext";

const MANAGEABLE_ROLES = [
  { key: "admin", label: "Administrador" },
  { key: "engineer", label: "Ingeniero" },
  { key: "hardware", label: "Ferretería" },
];

export const AdminUsers = () => {
  const { user: currentUser } = useSessionContext();
  const { data: users, isLoading } = useAdminUsers();
  const createUser = useCreateUser();
  const setRole = useSetUserRole();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "user" });

  const filtered = (users ?? []).filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!form.email || !form.password) {
      showError("Correo y contraseña son obligatorios.");
      return;
    }
    try {
      await createUser.mutateAsync(form);
      showSuccess("Usuario creado correctamente.");
      setCreateOpen(false);
      setForm({ email: "", password: "", fullName: "", role: "user" });
    } catch (e) {
      showError((e as Error).message);
    }
  };

  const handleToggleRole = async (u: AdminUser, role: string, enabled: boolean) => {
    try {
      await setRole.mutateAsync({ userId: u.id, role, enabled });
      showSuccess(`Permiso ${enabled ? "asignado" : "removido"}.`);
    } catch (e) {
      showError((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      showSuccess("Usuario eliminado.");
      setDeleteTarget(null);
    } catch (e) {
      showError((e as Error).message);
    }
  };

  return (
    <AdminLayout title="Usuarios y permisos">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{u.full_name || "Sin nombre"}</p>
                    {u.roles.includes("admin") && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                </div>
                {u.id !== currentUser?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(u)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3">
                {MANAGEABLE_ROLES.map((r) => (
                  <div key={r.key} className="flex items-center gap-2">
                    <Switch
                      checked={u.roles.includes(r.key)}
                      onCheckedChange={(checked) => handleToggleRole(u, r.key, checked)}
                      disabled={r.key === "admin" && u.id === currentUser?.id}
                    />
                    <Label className="text-sm text-muted-foreground">{r.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No se encontraron usuarios.</p>
          )}
        </div>
      )}

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@correo.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña temporal</Label>
              <Input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol inicial</Label>
              <div className="flex flex-wrap gap-2">
                {[{ key: "user", label: "Usuario" }, ...MANAGEABLE_ROLES].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.key })}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.role === r.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-[hsl(var(--surface-2))] text-muted-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createUser.isPending}>
              {createUser.isPending ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a <strong>{deleteTarget?.email}</strong> y todos sus
              datos asociados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
