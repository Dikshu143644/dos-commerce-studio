import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/database';

export interface NotificationFilters {
  is_read?: boolean;
  page?: number;
  pageSize?: number;
}

export function useNotifications(userId: string | undefined, filters: NotificationFilters = {}) {
  const { page = 1, pageSize = 20, is_read } = filters;

  return useQuery({
    queryKey: ['notifications', userId, { page, pageSize, is_read }],
    queryFn: async () => {
      if (!userId) return { data: [], count: 0, page, pageSize, totalPages: 0 };

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (is_read !== undefined) {
        query = query.eq('is_read', is_read);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: data as Notification[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: !!userId,
  });
}

export function useUnreadNotificationCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId, 'unread-count'],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Notification;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', data.user_id] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
}

/**
 * Hook for real-time notification subscription via Supabase Realtime.
 * Automatically invalidates notification queries when new notifications arrive.
 */
export function useNotificationSubscription(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
