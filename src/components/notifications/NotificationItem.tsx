import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotificationMeta, formatNotificationTime } from "@/lib/notifications";
import { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
  onMarkRead: (notificationId: string) => void;
  isUpdating?: boolean;
}

export const NotificationItem = ({ notification, onOpen, onMarkRead, isUpdating }: NotificationItemProps) => {
  const meta = getNotificationMeta(notification);
  const Icon = meta.icon;

  return (
    <article
      className={cn(
        "app-shell interactive-card p-4 transition-[border-color,box-shadow,transform]",
        !notification.isRead && "border-primary/20 shadow-[0_20px_40px_-34px_hsl(var(--primary)/0.55)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem]", meta.accent)}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="section-label">{meta.eyebrow}</span>
                {!notification.isRead ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </div>
              <h3 className="font-display mt-1 text-sm font-semibold text-foreground">{notification.title}</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">{formatNotificationTime(notification.createdAt)}</span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{notification.message}</p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onOpen(notification)}
              className="font-display inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-primary transition-opacity hover:opacity-80"
            >
              {meta.actionLabel}
              <ChevronRight className="h-4 w-4" />
            </button>

            {!notification.isRead ? (
              <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => onMarkRead(notification.id)} className="rounded-full px-3">
                <Check className="h-4 w-4" />Marcar leída
              </Button>
            ) : (
              <span className="data-chip">Leída</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default NotificationItem;
