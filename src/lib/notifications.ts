import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { BellRing, CheckCircle2, Gavel, LucideIcon, MessageCircleWarning } from "lucide-react";
import { AppNotification } from "@/lib/types";

export const getNotificationMeta = (notification: AppNotification): {
  icon: LucideIcon;
  accent: string;
  actionLabel: string;
  href: string;
  eyebrow: string;
} => {
  switch (notification.type) {
    case "bid_created":
      return {
        icon: Gavel,
        accent: "text-primary bg-[hsl(var(--primary)/0.14)]",
        actionLabel: "Ver subasta",
        href: notification.entityId ? `/?tab=bids&requestId=${notification.entityId}` : "/",
        eyebrow: "Nueva oferta",
      };
    case "bid_updated":
      return {
        icon: BellRing,
        accent: "text-[hsl(var(--warning-foreground))] bg-[hsl(var(--warning)/0.95)]",
        actionLabel: "Ver cambios",
        href: notification.entityId ? `/?tab=bids&requestId=${notification.entityId}` : "/",
        eyebrow: "Cambio en subasta",
      };
    case "order_completed":
      return {
        icon: CheckCircle2,
        accent: "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.14)]",
        actionLabel: "Ver pedido",
        href: notification.entityId ? `/?tab=orders&requestId=${notification.entityId}` : "/?tab=orders",
        eyebrow: "Estado de orden",
      };
    case "human_escalation":
      return {
        icon: MessageCircleWarning,
        accent: "text-destructive bg-destructive/10",
        actionLabel: "Atender chat",
        href: notification.entityId ? `/quote/${notification.entityId}/live` : "/",
        eyebrow: "Intervención requerida",
      };
    default:
      return {
        icon: BellRing,
        accent: "text-primary bg-[hsl(var(--primary)/0.14)]",
        actionLabel: "Abrir",
        href: "/",
        eyebrow: "Notificación",
      };
  }
};

export const formatNotificationTime = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
