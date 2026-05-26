import { AppNotification } from "@/lib/types";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
}

export const mapNotificationRow = (row: NotificationRow): AppNotification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  title: row.title,
  message: row.message,
  isRead: row.is_read,
  entityType: row.entity_type,
  entityId: row.entity_id,
  metadata: row.metadata ?? {},
  createdAt: row.created_at,
  readAt: row.read_at,
});
