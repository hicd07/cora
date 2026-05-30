import { Users, Mail, ShieldCheck, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminUsers, useSignupRequests, useInvitations, useAdminSettings } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({
  icon: Icon,
  label,
  value,
  to,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  to: string;
  accent: string;
}) => (
  <Link
    to={to}
    className="group rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/40 hover:shadow-[0_20px_40px_-34px_hsl(var(--primary)/0.5)]"
  >
    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="font-display text-2xl font-bold">{value}</p>
    <p className="mt-1 text-sm text-muted-foreground">{label}</p>
  </Link>
);

export const AdminDashboard = () => {
  const { data: users, isLoading: loadingUsers } = useAdminUsers();
  const { data: requests } = useSignupRequests();
  const { data: invitations } = useInvitations();
  const { data: settings } = useAdminSettings();

  const aiProvider = settings?.find((s) => s.key === "AI_PROVIDER")?.value || "openai";
  const pendingRequests = requests?.filter((r) => r.status === "pending").length ?? 0;
  const adminCount = users?.filter((u) => u.roles.includes("admin")).length ?? 0;

  return (
    <AdminLayout title="Resumen">
      {loadingUsers ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Usuarios totales"
            value={users?.length ?? 0}
            to="/admin/users"
            accent="bg-primary/10 text-primary"
          />
          <StatCard
            icon={ShieldCheck}
            label="Administradores"
            value={adminCount}
            to="/admin/users"
            accent="bg-emerald-500/10 text-emerald-600"
          />
          <StatCard
            icon={Mail}
            label="Solicitudes pendientes"
            value={pendingRequests}
            to="/admin/requests"
            accent="bg-amber-500/10 text-amber-600"
          />
          <StatCard
            icon={Bot}
            label="Proveedor de IA"
            value={aiProvider === "google" ? "Google" : "OpenAI"}
            to="/admin/settings"
            accent="bg-purple-500/10 text-purple-600"
          />
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-border bg-background p-6">
        <h2 className="font-display text-base font-semibold">Bienvenido al panel de administración</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Desde aquí puedes gestionar usuarios, asignar permisos, enviar invitaciones por correo,
          revisar solicitudes de acceso administrador y configurar las variables de entorno del
          sistema, incluyendo las claves de API para los proveedores de IA (OpenAI y Google Gemini).
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[hsl(var(--surface-2))] px-3 py-1.5 font-medium">
            {invitations?.length ?? 0} invitaciones enviadas
          </span>
          <span className="rounded-full bg-[hsl(var(--surface-2))] px-3 py-1.5 font-medium">
            {requests?.length ?? 0} solicitudes recibidas
          </span>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
