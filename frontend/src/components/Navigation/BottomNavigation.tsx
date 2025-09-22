import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  FolderOpen,
  CheckSquare,
  List,
  BarChart3,
  Play,
  Square
} from 'lucide-react';
import { useTimeEntryStore } from '../../store/timeEntryStore';

const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  const { activeEntry, startTimer, stopTimer } = useTimeEntryStore();
  const location = useLocation();

  const navigation = [
    { name: t('navigation.dashboard'), href: '/', icon: Home },
    { name: t('navigation.projects'), href: '/projects', icon: FolderOpen },
    { name: t('navigation.tasks'), href: '/tasks', icon: CheckSquare },
    { name: t('navigation.timeEntries'), href: '/time-entries', icon: List },
    { name: t('navigation.reports'), href: '/reports', icon: BarChart3 },
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:hidden z-30">
      <div className="grid grid-cols-6 h-16">
        {/* Navigation Items */}
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{item.name}</span>
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
              )}
            </Link>
          );
        })}

        {/* Timer Button */}
        <button
          onClick={handleTimerToggle}
          className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
            activeEntry
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          }`}
        >
          <div className={`p-2 rounded-full ${
            activeEntry
              ? 'bg-red-100 dark:bg-red-900'
              : 'bg-green-100 dark:bg-green-900'
          }`}>
            {activeEntry ? (
              <Square className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-medium">
            {activeEntry ? 'Stop' : 'Start'}
          </span>

          {/* Pulse animation for active timer */}
          {activeEntry && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-red-400 rounded-full animate-ping opacity-75"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;