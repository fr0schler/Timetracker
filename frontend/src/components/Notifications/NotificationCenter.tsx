import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Settings,
  Search
} from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import NotificationList from './NotificationList';
import { Notification } from '../../types/notification';

const NotificationCenter: React.FC = () => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    loadNotifications
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Status filter
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'read' && !notification.isRead) return false;

    // Type filter
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;

    // Search filter
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchTerm) ||
        notification.message.toLowerCase().includes(searchTerm)
      );
    }

    return true;
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Handle notification actions
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    if (notification.action) {
      notification.action();
    }
  };

  const getTypeOptions = () => {
    const types = new Set(notifications.map(n => n.type));
    return Array.from(types).map(type => ({
      value: type,
      label: t(`notifications.types.${type}`)
    }));
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('notifications.title')}
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 flex items-center space-x-1"
                  title={t('notifications.markAllRead')}
                >
                  <CheckCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('notifications.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              {/* Status Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">{t('notifications.filters.all')}</option>
                <option value="unread">{t('notifications.filters.unread')}</option>
                <option value="read">{t('notifications.filters.read')}</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">{t('notifications.filters.allTypes')}</option>
                {getTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Clear All Button */}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  title={t('notifications.clearAll')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {notifications.length === 0
                    ? t('notifications.empty')
                    : t('notifications.noMatches')
                  }
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {notifications.length === 0
                    ? t('notifications.emptyDescription')
                    : t('notifications.tryDifferentFilter')
                  }
                </p>
              </div>
            ) : (
              <NotificationList
                notifications={filteredNotifications}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('notifications.showing', {
                    count: filteredNotifications.length,
                    total: notifications.length
                  })}
                </span>
                <button
                  onClick={() => {
                    // TODO: Navigate to notification settings
                    console.log('Open notification settings');
                  }}
                  className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 flex items-center space-x-1"
                >
                  <Settings className="h-3 w-3" />
                  <span>{t('notifications.settings')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;