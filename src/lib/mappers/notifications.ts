import { AppNotification } from "../types";

export const mapNotificationRow = (row: any): AppNotification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  title: row.title,
  message: row.message,
  isRead: row.is_read,
  entityType: row.entity_type,
  entityId: row.entity_id,
  metadata: row.metadata ?? {}, // Corrección del error TS2353
  createdAt: row.created_at,
  readAt: row.read_at,
});