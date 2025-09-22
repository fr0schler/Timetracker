import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Check,
  Trash2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Notification } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onDelete
}) => {
  const { t, i18n } = useTranslation();

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "w-5 h-5";

    switch (type) {
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'reminder':
        return <Clock className={`${iconClass} text-purple-500`} />;
      default:
        return <Info className={`${iconClass} text-gray-500`} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const locale = i18n.language === 'de' ? de : enUS;
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale
    });
  };

  const isExpired = (notification: Notification) => {
    return notification.expiresAt && new Date() > new Date(notification.expiresAt);
  };

  return (
    <div className="space-y-1">
      {notifications.map((notification) => {
        const expired = isExpired(notification);

        return (
          <div
            key={notification.id}
            className={`
              relative border-l-4 p-4 cursor-pointer transition-all duration-200 hover:shadow-sm
              ${getPriorityColor(notification.priority)}
              ${!notification.isRead ? 'shadow-sm' : 'opacity-75'}
              ${expired ? 'opacity-50' : ''}
            `}
            onClick={() => onNotificationClick(notification)}
          >
            {/* Unread indicator */}
            {!notification.isRead && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full"></div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold truncate ${
                    notification.isRead
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {notification.title}
                    {expired && (
                      <span className="ml-2 text-xs text-red-500 font-normal">
                        ({t('notifications.expired')})
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    {notification.priority === 'urgent' && (
                      <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-1.5 py-0.5 rounded-full">
                        {t('notifications.urgent')}
                      </span>
                    )}
                    {notification.priority === 'high' && (
                      <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-1.5 py-0.5 rounded-full">
                        {t('notifications.high')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 ml-2">
                {notification.actionUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(notification.actionUrl, '_blank');
                    }}
                    className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
                    title={t('notifications.openLink')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors"
                    title={t('notifications.markAsRead')}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                  title={t('notifications.delete')}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Message */}
            <p className={`text-sm leading-relaxed ${
              notification.isRead
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {notification.message}
            </p>

            {/* Metadata */}
            {notification.metadata && (
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {notification.metadata.duration && (
                    <span className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      {t('notifications.duration')}: {Math.round(notification.metadata.duration / 1000 / 60 / 60 * 10) / 10}h
                    </span>
                  )}
                  {notification.metadata.daysRemaining && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded">
                      {notification.metadata.daysRemaining} {t('notifications.daysRemaining')}
                    </span>
                  )}
                  {notification.projectId && (
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                      {t('notifications.project')}: {notification.projectId}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Expiration warning */}
            {notification.expiresAt && !expired && (
              <div className="mt-2 flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3 h-3" />
                <span>
                  {t('notifications.expiresIn')} {formatRelativeTime(notification.expiresAt)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NotificationList;