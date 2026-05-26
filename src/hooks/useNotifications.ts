import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { mapNotificationRow } from "@/lib/mappers/notifications";
import { AppNotification } from "@/lib/types";

const notificationsKey = ["notifications"];
const unreadCountKey = ["notifications", "unread-count"];

const fetchNotifications = async (): Promise<AppNotification[]> => {
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapNotificationRow);
};

const fetchUnreadCount = async (): Promise<number> => {
  const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

export const useNotifications = () => {
  const { user } = useSessionContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: notificationsKey });
          queryClient.invalidateQueries({ queryKey: unreadCountKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  const notificationsQuery = useQuery({ queryKey: notificationsKey, queryFn: fetchNotifications, enabled: Boolean(user) });
  const unreadCountQuery = useQuery({ queryKey: unreadCountKey, queryFn: fetchUnreadCount, enabled: Boolean(user) });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("is_read", false);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey });
      queryClient.invalidateQueries({ queryKey: unreadCountKey });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("No hay una sesión activa.");
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey });
      queryClient.invalidateQueries({ queryKey: unreadCountKey });
    },
  });

  return {
    notifications: notificationsQuery.data ?? [],
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    error: notificationsQuery.error ?? unreadCountQuery.error,
    markAsRead,
    markAllAsRead,
  };
};
