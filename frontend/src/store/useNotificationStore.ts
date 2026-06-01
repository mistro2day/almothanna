import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loadingNotifications: boolean;
  eventSource: EventSource | null;
  fetchNotifications: (userId: string) => Promise<Notification[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  connectSSE: (userId: string, onNewNotification?: (notification: Notification) => void) => void;
  disconnectSSE: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loadingNotifications: false,
  eventSource: null,

  fetchNotifications: async (userId) => {
    set({ loadingNotifications: true });
    try {
      const { data } = await apiClient.get<Notification[]>(`/notifications/${userId}`);
      const unreadCount = data.filter((n) => !n.isRead).length;
      set({ notifications: data, unreadCount, loadingNotifications: false });
      return data;
    } catch (e) {
      console.error('Failed to fetch notifications', e);
      set({ loadingNotifications: false });
      return [];
    }
  },

  markAsRead: async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      const updated = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = updated.filter((n) => !n.isRead).length;
      set({ notifications: updated, unreadCount });
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      await apiClient.patch(`/notifications/read-all/${userId}`);
      const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  },

  connectSSE: (userId, onNewNotification) => {
    get().disconnectSSE();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const sseUrl = `${API_URL}/notifications/sse/${userId}`;
    const es = new EventSource(sseUrl);

    es.onmessage = (event) => {
      try {
        const notif: Notification = JSON.parse(event.data);
        const updated = [notif, ...get().notifications];
        const unreadCount = updated.filter((n) => !n.isRead).length;
        set({ notifications: updated, unreadCount });

        if (onNewNotification) {
          onNewNotification(notif);
        }
      } catch (err) {
        console.error('Error parsing SSE event data', err);
      }
    };

    es.onerror = (err) => {
      console.error('SSE Error:', err);
    };

    set({ eventSource: es });
  },

  disconnectSSE: () => {
    const { eventSource } = get();
    if (eventSource) {
      eventSource.close();
      set({ eventSource: null });
    }
  },
}));
