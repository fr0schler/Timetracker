import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Mail, MessageSquare, Clock, Save } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  category: 'timer' | 'team' | 'system';
  channels: {
    inApp: boolean;
    email: boolean;
    desktop: boolean;
  };
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settings, setSettings] = useState<NotificationSetting[]>([]);

  useEffect(() => {
    // Initialize notification settings
    const defaultSettings: NotificationSetting[] = [
      {
        id: 'timer_started',
        name: t('notifications.timerStarted'),
        description: t('notifications.timerStartedDesc'),
        category: 'timer',
        channels: { inApp: true, email: false, desktop: true }
      },
      {
        id: 'timer_stopped',
        name: t('notifications.timerStopped'),
        description: t('notifications.timerStoppedDesc'),
        category: 'timer',
        channels: { inApp: true, email: false, desktop: true }
      },
      {
        id: 'daily_summary',
        name: t('notifications.dailySummary'),
        description: t('notifications.dailySummaryDesc'),
        category: 'system',
        channels: { inApp: false, email: true, desktop: false }
      },
      {
        id: 'task_assigned',
        name: t('notifications.taskAssigned'),
        description: t('notifications.taskAssignedDesc'),
        category: 'team',
        channels: { inApp: true, email: true, desktop: true }
      },
      {
        id: 'project_shared',
        name: t('notifications.projectShared'),
        description: t('notifications.projectSharedDesc'),
        category: 'team',
        channels: { inApp: true, email: true, desktop: false }
      },
      {
        id: 'team_invitation',
        name: t('notifications.teamInvitation'),
        description: t('notifications.teamInvitationDesc'),
        category: 'team',
        channels: { inApp: true, email: true, desktop: true }
      },
      {
        id: 'billing_reminder',
        name: t('notifications.billingReminder'),
        description: t('notifications.billingReminderDesc'),
        category: 'system',
        channels: { inApp: true, email: true, desktop: false }
      },
      {
        id: 'security_alert',
        name: t('notifications.securityAlert'),
        description: t('notifications.securityAlertDesc'),
        category: 'system',
        channels: { inApp: true, email: true, desktop: true }
      }
    ];

    setSettings(defaultSettings);
  }, [t]);

  const handleToggleSetting = (settingId: string, channel: keyof NotificationSetting['channels']) => {
    setSettings(prev => prev.map(setting =>
      setting.id === settingId
        ? {
            ...setting,
            channels: {
              ...setting.channels,
              [channel]: !setting.channels[channel]
            }
          }
        : setting
    ));
  };

  const handleGlobalToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (!enabled) {
      // Disable all notifications
      setSettings(prev => prev.map(setting => ({
        ...setting,
        channels: {
          inApp: false,
          email: false,
          desktop: false
        }
      })));
    }
  };

  const saveSettings = async () => {
    try {
      // TODO: Implement API call to save notification settings
      localStorage.setItem('notification-settings', JSON.stringify({
        enabled: notificationsEnabled,
        settings
      }));

      addToast('success', t('notifications.saveSuccess'), t('notifications.saveSuccessMessage'));
    } catch (error) {
      addToast('error', t('notifications.saveError'), t('notifications.saveErrorMessage'));
    }
  };

  const requestDesktopPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addToast('success', t('notifications.permissionGranted'), t('notifications.permissionGrantedMessage'));
      } else {
        addToast('warning', t('notifications.permissionDenied'), t('notifications.permissionDeniedMessage'));
      }
    }
  };

  const categories = {
    timer: { name: t('notifications.timerCategory'), icon: Clock, color: 'text-blue-600' },
    team: { name: t('notifications.teamCategory'), icon: MessageSquare, color: 'text-green-600' },
    system: { name: t('notifications.systemCategory'), icon: Bell, color: 'text-orange-600' }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  return (
    <div className="space-y-6">
      {/* Global Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t('notifications.enableNotifications')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('notifications.enableNotificationsDesc')}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => handleGlobalToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {/* Desktop Permission */}
      {notificationsEnabled && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t('notifications.desktopPermission')}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                {t('notifications.desktopPermissionDesc')}
              </p>
            </div>
            <button
              onClick={requestDesktopPermission}
              className="btn btn-primary btn-sm"
            >
              {t('notifications.enableDesktop')}
            </button>
          </div>
        </div>
      )}

      {/* Notification Settings by Category */}
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => {
          const categoryInfo = categories[category as keyof typeof categories];
          const CategoryIcon = categoryInfo.icon;

          return (
            <div key={category}>
              <div className="flex items-center space-x-2 mb-4">
                <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {categoryInfo.name}
                </h3>
              </div>

              <div className="space-y-4">
                {categorySettings.map((setting) => (
                  <div key={setting.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {setting.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {setting.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* In-App Notifications */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${setting.id}-inApp`}
                          checked={setting.channels.inApp && notificationsEnabled}
                          onChange={() => handleToggleSetting(setting.id, 'inApp')}
                          disabled={!notificationsEnabled}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor={`${setting.id}-inApp`} className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                          <Bell className="h-4 w-4" />
                          <span>{t('notifications.inApp')}</span>
                        </label>
                      </div>

                      {/* Email Notifications */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${setting.id}-email`}
                          checked={setting.channels.email && notificationsEnabled}
                          onChange={() => handleToggleSetting(setting.id, 'email')}
                          disabled={!notificationsEnabled}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor={`${setting.id}-email`} className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                          <Mail className="h-4 w-4" />
                          <span>{t('notifications.email')}</span>
                        </label>
                      </div>

                      {/* Desktop Notifications */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${setting.id}-desktop`}
                          checked={setting.channels.desktop && notificationsEnabled}
                          onChange={() => handleToggleSetting(setting.id, 'desktop')}
                          disabled={!notificationsEnabled}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor={`${setting.id}-desktop`} className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                          <BellOff className="h-4 w-4" />
                          <span>{t('notifications.desktop')}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={saveSettings}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{t('common.save')}</span>
        </button>
      </div>
    </div>
  );
}