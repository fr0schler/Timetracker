export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  action?: () => void;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  userId?: string;
  projectId?: string;
  timeEntryId?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  weeklyDigest: boolean;
  projectUpdates: boolean;
  timeReminders: boolean;
  systemAlerts: boolean;
}

export interface NotificationFilter {
  type?: Notification['type'];
  isRead?: boolean;
  priority?: Notification['priority'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectId?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<Notification['type'], number>;
  byPriority: Record<Notification['priority'], number>;
}