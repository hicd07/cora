import { useMemo, useState } from "react";
import { ArrowLeft, BellRing, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLogo from "@/components/branding/AppLogo";
import NotificationsEmptyState from "@/components/notifications/NotificationsEmptyState";
import NotificationsList from "@/components/notifications/NotificationsList";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { getNotificationMeta } from "@/lib/notifications";
import { AppNotification } from "@/lib/types";
import { showError } from "@/utils/toast";

const filters = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No leídas" },
  { id: "read", label: "Leídas" },
] as const;

const Notifications = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["id"]>("all");
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } = useNotifications();

  const visibleNotifications = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return notifications.filter((notification) => !notification.isRead);
      case "read":
        return notifications.filter((notification) => notification.isRead);
      default:
        return notifications;
    }
  }, [activeFilter, notifications]);

  const openNotification = async (notification: AppNotification) => {
    try {
      if (!notification.isRead) {
        await markAsRead.mutateAsync(notification.id);
      }
      navigate(getNotificationMeta(notification).href);
    } catch {
      showError("No se pudo abrir la notificación.");
    }
  };

  const markOneAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch {
      showError("No se pudo marcar la notificación como leída.");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch {
      showError("No se pudieron actualizar las notificaciones.");
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-0))] px-0 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-border bg-background md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:shadow-[0_28px_60px_-40px_hsl(var(--foreground)/0.45)]">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-[hsl(var(--surface-1)/0.92)] px-4 py-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => navigate("/")} aria-label="Volver al inicio" className="rounded-[1rem]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[0.95rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_12px_22px_-18px_hsl(var(--foreground)/0.35)]">
                    <AppLogo variant="symbol" context="header" size={18} />
                  </div>
                  <p className="section-label">Inbox Cora</p>
                </div>
                <h1 className="font-display text-xl font-semibold text-foreground">Notificaciones</h1>
                <p className="text-xs text-muted-foreground">Historial en tiempo real de eventos clave en tus compras y subastas.</p>
              </div>
            </div>
            <div className="panel-muted flex h-12 min-w-12 items-center justify-center rounded-[1.2rem] px-3 text-sm font-semibold text-foreground">
              {unreadCount}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => {
                const isActive = filter.id === activeFilter;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_16px_28px_-20px_hsl(var(--primary)/0.8)]"
                        : "bg-[hsl(var(--surface-2))] text-muted-foreground"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markAllAsRead.isPending}
              className="rounded-full px-3"
            >
              <CheckCheck className="h-4 w-4" />Marcar todas
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-8 pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="app-shell animate-pulse p-4">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-[1.2rem] bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-20 rounded-full bg-muted" />
                      <div className="h-4 w-40 rounded-full bg-muted" />
                      <div className="h-3 w-full rounded-full bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <NotificationsEmptyState
              title="No pudimos cargar tu inbox"
              description="Ocurrió un problema al consultar las notificaciones en tiempo real. Intenta volver al inicio y reabrir esta sección."
              actionLabel="Volver al inicio"
              onAction={() => navigate("/")}
            />
          ) : visibleNotifications.length === 0 ? (
            <NotificationsEmptyState
              title={activeFilter === "unread" ? "No tienes pendientes" : "Tu inbox está vacío"}
              description={
                activeFilter === "unread"
                  ? "Cuando llegue una nueva oferta o se cierre una compra, aparecerá aquí como no leída."
                  : "Todavía no hay eventos para mostrar. Las nuevas ofertas y cambios de estado aparecerán aquí."
              }
              actionLabel="Ir al inicio"
              onAction={() => navigate("/")}
            />
          ) : (
            <>
              <section className="mb-4 app-shell p-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.2rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_16px_28px_-22px_hsl(var(--foreground)/0.35)]">
                    <div className="absolute inset-[3px] rounded-[0.95rem] bg-[hsl(var(--primary)/0.08)]" />
                    <AppLogo variant="symbol" context="header" size={24} className="relative" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-semibold text-foreground">{unreadCount} sin leer</p>
                      <BellRing className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">Tu historial se actualiza automáticamente cuando llega un nuevo evento.</p>
                  </div>
                </div>
              </section>

              <NotificationsList
                notifications={visibleNotifications}
                onOpen={openNotification}
                onMarkRead={markOneAsRead}
                isUpdating={markAsRead.isPending}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;