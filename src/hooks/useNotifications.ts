import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { mapNotificationRow } from "@/lib/mappers/notifications";
import { AppNotification } from "@/lib/types";
import { useAdminMode } from "@/contexts/AdminModeContext";

const notificationsKey = (isTestMode: boolean) => ["notifications", isTestMode];
const unreadCountKey = (isTestMode: boolean) => ["notifications", "unread-count", isTestMode];

const fetchNotifications = async (isAdmin: boolean, isTestMode: boolean): Promise<AppNotification[]> => {
  let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);

  if (isAdmin) {
    query = query.eq('is_test', isTestMode);
  } else {
    query = query.or('is_test.eq.false,is_test.is.null');
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapNotificationRow);
};

const fetchUnreadCount = async (isAdmin: boolean, isTestMode: boolean): Promise<number> => {
  let query = supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);

  if (isAdmin) {
    query = query.eq('is_test', isTestMode);
  } else {
    query = query.or('is_test.eq.false,is_test.is.null');
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
};

export const useNotifications = () => {
  const { user, isAdmin } = useSessionContext();
  const { isTestMode } = useAdminMode();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: notificationsKey(isTestMode) });
          queryClient.invalidateQueries({ queryKey: unreadCountKey(isTestMode) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user, isTestMode]);

  const notificationsQuery = useQuery({ queryKey: notificationsKey(isTestMode), queryFn: () => fetchNotifications(isAdmin, isTestMode), enabled: Boolean(user) });
  const unreadCountQuery = useQuery({ queryKey: unreadCountKey(isTestMode), queryFn: () => fetchUnreadCount(isAdmin, isTestMode), enabled: Boolean(user) });

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
      queryClient.invalidateQueries({ queryKey: notificationsKey(isTestMode) });
      queryClient.invalidateQueries({ queryKey: unreadCountKey(isTestMode) });
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
      queryClient.invalidateQueries({ queryKey: notificationsKey(isTestMode) });
      queryClient.invalidateQueries({ queryKey: unreadCountKey(isTestMode) });
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
