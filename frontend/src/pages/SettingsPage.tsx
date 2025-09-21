import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Keyboard, Sun, Bell, Shield, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import KeyboardSettings from '../components/Settings/KeyboardSettings';
import ThemeSettings from '../components/Settings/ThemeSettings';
import NotificationSettings from '../components/Settings/NotificationSettings';
import LanguageSettings from '../components/Settings/LanguageSettings';

type SettingsTab = 'general' | 'keyboard' | 'appearance' | 'notifications' | 'organization' | 'security';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs = [
    {
      id: 'general' as SettingsTab,
      name: t('settings.preferences'),
      icon: Settings,
      description: t('settings.generalDescription')
    },
    {
      id: 'keyboard' as SettingsTab,
      name: t('settings.keyboardShortcuts'),
      icon: Keyboard,
      description: t('settings.keyboardDescription')
    },
    {
      id: 'appearance' as SettingsTab,
      name: t('settings.theme'),
      icon: Sun,
      description: t('settings.appearanceDescription')
    },
    {
      id: 'notifications' as SettingsTab,
      name: t('settings.notifications'),
      icon: Bell,
      description: t('settings.notificationsDescription')
    },
    {
      id: 'organization' as SettingsTab,
      name: t('settings.organization'),
      icon: Users,
      description: t('settings.organizationDescription')
    },
    {
      id: 'security' as SettingsTab,
      name: t('settings.security'),
      icon: Shield,
      description: t('settings.securityDescription')
    }
  ];

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('settings.title')}
            </h1>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6">
            {/* Tab Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tabs.find(tab => tab.id === activeTab)?.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <LanguageSettings />

                  {/* Timezone Setting */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.timezone')}
                    </label>
                    <select className="input w-full max-w-xs">
                      <option value="UTC">UTC</option>
                      <option value="Europe/Berlin">Europe/Berlin</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                    </select>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.dateFormat')}
                    </label>
                    <select className="input w-full max-w-xs">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  {/* Time Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.timeFormat')}
                    </label>
                    <select className="input w-full max-w-xs">
                      <option value="24h">24-hour</option>
                      <option value="12h">12-hour (AM/PM)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'keyboard' && <KeyboardSettings />}
              {activeTab === 'appearance' && <ThemeSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}

              {activeTab === 'organization' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t('settings.organizationInfo')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('settings.organizationInfoDescription')}
                    </p>
                    <button className="btn btn-primary mt-4">
                      {t('settings.manageOrganization')}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {t('settings.changePassword')}
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <input
                        type="password"
                        placeholder={t('settings.currentPassword')}
                        className="input w-full"
                      />
                      <input
                        type="password"
                        placeholder={t('settings.newPassword')}
                        className="input w-full"
                      />
                      <input
                        type="password"
                        placeholder={t('settings.confirmPassword')}
                        className="input w-full"
                      />
                      <button className="btn btn-primary">
                        {t('settings.updatePassword')}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {t('settings.twoFactorAuth')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {t('settings.twoFactorDescription')}
                    </p>
                    <button className="btn btn-secondary">
                      {t('settings.enableTwoFactor')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}