import { create } from 'zustand';
import { Notification, NotificationPreferences, NotificationFilter, NotificationStats } from '../types/notification';

interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;

  // Actions
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  getStats: () => NotificationStats;
  filterNotifications: (filter: NotificationFilter) => Notification[];
}

// Mock data for development
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Project Deadline Approaching',
    message: 'TimeTracker SaaS project deadline is in 3 days',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    priority: 'high',
    projectId: 'project-1',
    metadata: {
      daysRemaining: 3
    }
  },
  {
    id: '2',
    title: 'Time Entry Created',
    message: 'Successfully logged 2 hours of work on Frontend Development',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    priority: 'low',
    timeEntryId: 'entry-1',
    metadata: {
      duration: 7200000 // 2 hours in ms
    }
  },
  {
    id: '3',
    title: 'Weekly Report Available',
    message: 'Your weekly time tracking report is ready for review',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // read 12 hours ago
    priority: 'medium',
    actionUrl: '/reports/weekly'
  },
  {
    id: '4',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM EST',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    priority: 'medium',
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000) // expires in 18 hours
  },
  {
    id: '5',
    title: 'Timer Still Running',
    message: 'You have been tracking time for 4 hours. Don\'t forget to take a break!',
    type: 'reminder',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    priority: 'medium',
    metadata: {
      duration: 14400000 // 4 hours in ms
    }
  }
];

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  weeklyDigest: true,
  projectUpdates: true,
  timeReminders: true,
  systemAlerts: true
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  preferences: defaultPreferences,
  isLoading: false,
  error: null,
  unreadCount: 0,

  loadNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app, this would be an API call
      const notifications = mockNotifications.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const unreadCount = notifications.filter(n => !n.isRead).length;

      set({
        notifications,
        unreadCount,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load notifications',
        isLoading: false
      });
    }
  },

  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  markAsRead: (notificationId: string) => {
    set(state => ({
      notifications: state.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true, updatedAt: new Date() }
          : notification
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(notification => ({
        ...notification,
        isRead: true,
        updatedAt: new Date()
      })),
      unreadCount: 0
    }));
  },

  deleteNotification: (notificationId: string) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.isRead;

      return {
        notifications: state.notifications.filter(n => n.id !== notificationId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    });
  },

  clearAllNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0
    });
  },

  updatePreferences: (newPreferences) => {
    set(state => ({
      preferences: { ...state.preferences, ...newPreferences }
    }));
  },

  getStats: () => {
    const { notifications } = get();

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      byType: {
        info: 0,
        success: 0,
        warning: 0,
        error: 0,
        reminder: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      }
    };

    notifications.forEach(notification => {
      stats.byType[notification.type]++;
      stats.byPriority[notification.priority]++;
    });

    return stats;
  },

  filterNotifications: (filter: NotificationFilter) => {
    const { notifications } = get();

    return notifications.filter(notification => {
      if (filter.type && notification.type !== filter.type) return false;
      if (filter.isRead !== undefined && notification.isRead !== filter.isRead) return false;
      if (filter.priority && notification.priority !== filter.priority) return false;
      if (filter.projectId && notification.projectId !== filter.projectId) return false;

      if (filter.dateRange) {
        const createdAt = new Date(notification.createdAt);
        if (createdAt < filter.dateRange.start || createdAt > filter.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }
}));