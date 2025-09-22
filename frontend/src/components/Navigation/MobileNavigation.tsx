import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Clock,
  FolderOpen,
  CheckSquare,
  FileText,
  Users,
  BarChart3,
  Download,
  List,
  User,
  Settings,
  Building,
  Key,
  LogOut,
  Home,
  Plus,
  Play,
  Square
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTimeEntryStore } from '../../store/timeEntryStore';

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { activeEntry, startTimer, stopTimer } = useTimeEntryStore();
  const location = useLocation();

  const mainNavigation = [
    { name: t('navigation.dashboard'), href: '/', icon: Home },
    { name: t('navigation.projects'), href: '/projects', icon: FolderOpen },
    { name: t('navigation.tasks'), href: '/tasks', icon: CheckSquare },
    { name: t('navigation.timeEntries'), href: '/time-entries', icon: List },
    { name: t('navigation.reports'), href: '/reports', icon: BarChart3 },
    { name: t('navigation.team'), href: '/team', icon: Users },
  ];

  const secondaryNavigation = [
    { name: 'Templates', href: '/task-templates', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: Download },
  ];

  const profileNavigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Organization', href: '/organization', icon: Building },
    { name: 'API Keys', href: '/api-keys', icon: Key },
    { name: t('navigation.settings'), href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleTimerToggle = () => {
    if (activeEntry) {
      stopTimer(activeEntry.id);
    } else {
      // For demo purposes, start timer on first project
      // In real app, this would open a project selection modal
      const mockProjectId = Date.now(); // Generate a temporary ID
      startTimer(mockProjectId);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out sm:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                TimeTracker
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleTimerToggle}
                  className={`flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors ${
                    activeEntry
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}
                >
                  {activeEntry ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </>
                  )}
                </button>
                <Link
                  to="/projects/new"
                  className="flex items-center justify-center p-3 rounded-lg text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Link>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Main
              </h3>
              <nav className="space-y-1">
                {mainNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Secondary Navigation */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                More
              </h3>
              <nav className="space-y-1">
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile Navigation */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Account
              </h3>
              <nav className="space-y-1">
                {profileNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;