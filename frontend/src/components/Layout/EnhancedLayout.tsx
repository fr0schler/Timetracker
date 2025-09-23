import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  FolderOpen,
  List,
  CheckSquare,
  FileText,
  Users,
  LogOut,
  User,
  Settings,
  Building,
  BarChart3,
  Download,
  Key,
  Menu,
  Search,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import MobileNavigation from '../Navigation/MobileNavigation';
import BottomNavigation from '../Navigation/BottomNavigation';
import NotificationCenter from '../Notifications/NotificationCenter';
import CommandPalette from '../CommandPalette';

const EnhancedLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary navigation - most important items for desktop navbar
  const primaryNavigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: Clock },
    { name: t('navigation.projects'), href: '/projects', icon: FolderOpen },
    { name: t('navigation.tasks'), href: '/tasks', icon: CheckSquare },
    { name: t('navigation.timeEntries'), href: '/time-entries', icon: List },
    { name: t('navigation.team'), href: '/team', icon: Users },
  ];

  // Secondary navigation - accessible via dropdown or secondary menu
  const secondaryNavigation = [
    { name: 'Advanced Dashboard', href: '/advanced-dashboard', icon: BarChart3 },
    { name: 'Templates', href: '/task-templates', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: t('navigation.reports'), href: '/reports', icon: Download },
    { name: 'Export', href: '/export', icon: Download },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              {/* Logo/Brand */}
              <Link to="/dashboard" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                  TimeTracker
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                {primaryNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors min-h-[44px] ${
                        isActive(item.href)
                          ? 'border-primary-500 text-gray-900 dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* More Menu Dropdown */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors min-h-[44px] ${
                      secondaryNavigation.some(item => isActive(item.href))
                        ? 'border-primary-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    More
                    <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMoreMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="py-1">
                        {secondaryNavigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setIsMoreMenuOpen(false)}
                              className={`flex items-center px-4 py-3 text-sm transition-colors min-h-[44px] ${
                                isActive(item.href)
                                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              <Icon className="h-4 w-4 mr-3" />
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Right Side */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={handleOpenCommandPalette}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Search (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">Search...</span>
                <span className="hidden lg:inline text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">⌘K</span>
              </button>

              {/* Mobile Search Button */}
              <button
                onClick={handleOpenCommandPalette}
                className="sm:hidden p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <NotificationCenter />

              {/* Desktop Profile Menu */}
              <div className="hidden sm:flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors min-h-[44px] px-2 py-2"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden lg:inline">{user?.full_name || user?.email}</span>
                </Link>

                <Link
                  to="/organization"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Organization Settings"
                >
                  <Building className="h-5 w-5" />
                </Link>

                <Link
                  to="/api-keys"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="API Keys"
                >
                  <Key className="h-5 w-5" />
                </Link>

                <Link
                  to="/settings"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Link>

                <button
                  onClick={logout}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">{t('navigation.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8" role="main">
        <div className="px-4 py-8 sm:px-0 pb-24 sm:pb-8 space-y-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNavigation />

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
};

export default EnhancedLayout;