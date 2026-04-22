import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { Notification } from '../types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;

  loadNotifications: (params?: { page?: number; size?: number; unreadOnly?: boolean }) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  currentPage: 0,
  pageSize: 15,
  totalElements: 0,
  totalPages: 0,

  loadNotifications: async (params) => {
    set({ loading: true });
    try {
      const page = params?.page ?? get().currentPage;
      const size = params?.size ?? get().pageSize;
      const unreadOnly = params?.unreadOnly ?? false;

      const endpoint = unreadOnly ? '/notification/unread' : '/notification';
      const response = await apiClient.get(endpoint, {
        params: { page, size }
      });

      const data: any = response.data.data || response.data;
      set({
        notifications: data.content || [],
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        pageSize: data.pageSize,
        loading: false
      });
      
      // Also refresh the unread count whenever we load
      get().refreshUnreadCount();
    } catch (error) {
      set({ loading: false });
      console.error('Failed to load notifications', error);
    }
  },

  refreshUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notification/unread/count');
      set({ unreadCount: response.data.data ?? response.data });
    } catch (error) {
      console.error('Failed to refresh unread count', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await apiClient.put(`/notification/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },

  markAllRead: async () => {
    const unreadIds = get().notifications
      .filter(n => !n.isRead)
      .map(n => n.id);
    
    if (unreadIds.length === 0) return;

    try {
      // The backend doesn't seem to have a bulk endpoint in the service, 
      // but the Angular store calls markRead in a loop or sequentially.
      // We'll follow that or assume there might be a bulk one we can use.
      // For now, let's just mark the ones in the current view as read locally
      // and call the API for each or assume a batch endpoint exists.
      // Checking notification.service.ts... it only has markAsRead(id).
      
      await Promise.all(unreadIds.map(id => apiClient.put(`/notification/${id}/read`)));
      
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await apiClient.delete(`/notification/${id}`);
      set((state) => {
        const wasUnread = state.notifications.find(n => n.id === id)?.isRead === false;
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          totalElements: state.totalElements - 1
        };
      });
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  },

  deleteAll: async () => {
    const allIds = get().notifications.map(n => n.id);
    if (allIds.length === 0) return;

    try {
      // Similar to markAllRead, sequential delete if no bulk endpoint.
      await Promise.all(allIds.map(id => apiClient.delete(`/notification/${id}`)));
      set({ notifications: [], unreadCount: 0, totalElements: 0 });
    } catch (error) {
      console.error('Failed to delete all notifications', error);
    }
  }
}));
