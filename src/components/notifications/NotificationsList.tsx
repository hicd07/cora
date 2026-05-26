import NotificationItem from "@/components/notifications/NotificationItem";
import { AppNotification } from "@/lib/types";

interface NotificationsListProps {
  notifications: AppNotification[];
  onOpen: (notification: AppNotification) => void;
  onMarkRead: (notificationId: string) => void;
  isUpdating?: boolean;
}

export const NotificationsList = ({ notifications, onOpen, onMarkRead, isUpdating }: NotificationsListProps) => (
  <div className="space-y-3">
    {notifications.map((notification) => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        onOpen={onOpen}
        onMarkRead={onMarkRead}
        isUpdating={isUpdating}
      />
    ))}
  </div>
);

export default NotificationsList;
