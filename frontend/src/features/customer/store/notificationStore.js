import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  hasMore: true,
  loading: false,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  fetchNotifications: async (offset = 0, limit = 10) => {
    try {
      set({ loading: true });
      const response = await axiosInstance.get(`/notifications?offset=${offset}&limit=${limit}`);
      const newNotifications = response.data;
      
      set((state) => {
        // If offset is 0, we are doing an initial load. Otherwise we are appending (infinite scroll)
        const updatedNotifications = offset === 0 
          ? newNotifications 
          : [...state.notifications, ...newNotifications];
        
        // Calculate unread count based on the entire loaded list (or just the unread ones in the fetched batch)
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;

        return {
          notifications: updatedNotifications,
          hasMore: newNotifications.length === limit,
          loading: false,
          unreadCount: unreadCount
        };
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({ loading: false });
    }
  },

  markAllAsRead: async () => {
    try {
      await axiosInstance.put('/notifications/mark-read');
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => ({ ...n, is_read: true }))
      }));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0, hasMore: true }),
}));