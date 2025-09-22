import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Settings,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useTimeEntryStore } from '../../store/timeEntryStore';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import DashboardWidget from './DashboardWidget';
import TimeDistributionChart from './TimeDistributionChart';
import ProductivityTrends from './ProductivityTrends';
import ProjectPerformanceChart from './ProjectPerformanceChart';
import RecentActivityWidget from './RecentActivityWidget';
import QuickStatsWidget from './QuickStatsWidget';
import { formatDuration } from '../../utils/timeUtils';

interface DashboardConfig {
  widgets: string[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  refreshInterval: number;
}

const AdvancedDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { timeEntries, fetchTimeEntries } = useTimeEntryStore();
  const { projects, fetchProjects } = useProjectStore();
  const { user } = useAuthStore();

  const [config, setConfig] = useState<DashboardConfig>({
    widgets: ['stats', 'productivity', 'distribution', 'projects', 'activity'],
    timeRange: '30d',
    refreshInterval: 300000 // 5 minutes
  });

  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadDashboardData();
    }, config.refreshInterval);

    return () => clearInterval(interval);
  }, [config.timeRange, config.refreshInterval]);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchTimeEntries(),
        fetchProjects()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getFilteredTimeEntries = () => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (config.timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return timeEntries.filter(entry =>
      new Date(entry.start_time) >= cutoffDate && !entry.is_running
    );
  };

  const calculateDashboardStats = () => {
    const filteredEntries = getFilteredTimeEntries();
    const totalDuration = filteredEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
    const uniqueDays = new Set(filteredEntries.map(entry =>
      new Date(entry.start_time).toDateString()
    )).size;

    const averageDailyHours = uniqueDays > 0 ? totalDuration / 3600 / uniqueDays : 0;
    const totalProjects = new Set(filteredEntries.map(entry => entry.project_id)).size;

    // Calculate productivity score (based on consistency and volume)
    const dailyHours = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayEntries = filteredEntries.filter(entry =>
        new Date(entry.start_time).toDateString() === date.toDateString()
      );
      return dayEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0) / 3600;
    });

    const consistency = dailyHours.filter(hours => hours > 0).length / 7;
    const productivityScore = Math.round((averageDailyHours / 8 + consistency) * 50);

    return {
      totalHours: totalDuration / 3600,
      averageDailyHours,
      totalProjects,
      productivity: Math.min(100, productivityScore),
      entriesCount: filteredEntries.length,
      uniqueDays
    };
  };

  const stats = calculateDashboardStats();

  const handleConfigChange = (newConfig: Partial<DashboardConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const toggleWidget = (widgetId: string) => {
    setConfig(prev => ({
      ...prev,
      widgets: prev.widgets.includes(widgetId)
        ? prev.widgets.filter(id => id !== widgetId)
        : [...prev.widgets, widgetId]
    }));
  };

  const exportDashboardData = () => {
    const data = {
      stats,
      timeEntries: getFilteredTimeEntries(),
      projects: projects,
      generatedAt: new Date().toISOString(),
      timeRange: config.timeRange
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${config.timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.advanced.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.advanced.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={config.timeRange}
            onChange={(e) => handleConfigChange({ timeRange: e.target.value as any })}
            className="input text-sm"
          >
            <option value="7d">{t('dashboard.timeRange.7d')}</option>
            <option value="30d">{t('dashboard.timeRange.30d')}</option>
            <option value="90d">{t('dashboard.timeRange.90d')}</option>
            <option value="1y">{t('dashboard.timeRange.1y')}</option>
          </select>

          {/* Actions */}
          <button
            onClick={() => setIsConfiguring(!isConfiguring)}
            className="btn btn-secondary p-2"
            title={t('dashboard.configure')}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={exportDashboardData}
            className="btn btn-secondary p-2"
            title={t('dashboard.export')}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="btn btn-primary p-2"
            title={t('dashboard.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {isConfiguring && (
        <div className="card p-6 border-l-4 border-primary-500">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('dashboard.configuration')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('dashboard.widgets')}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'stats', name: t('dashboard.widgets.quickStats') },
                  { id: 'productivity', name: t('dashboard.widgets.productivity') },
                  { id: 'distribution', name: t('dashboard.widgets.timeDistribution') },
                  { id: 'projects', name: t('dashboard.widgets.projectPerformance') },
                  { id: 'activity', name: t('dashboard.widgets.recentActivity') }
                ].map(widget => (
                  <label key={widget.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.widgets.includes(widget.id)}
                      onChange={() => toggleWidget(widget.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {widget.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('dashboard.refreshInterval')}
              </label>
              <select
                value={config.refreshInterval}
                onChange={(e) => handleConfigChange({ refreshInterval: parseInt(e.target.value) })}
                className="input"
              >
                <option value={60000}>{t('dashboard.intervals.1min')}</option>
                <option value={300000}>{t('dashboard.intervals.5min')}</option>
                <option value={600000}>{t('dashboard.intervals.10min')}</option>
                <option value={1800000}>{t('dashboard.intervals.30min')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Quick Stats Widget */}
        {config.widgets.includes('stats') && (
          <div className="xl:col-span-3">
            <QuickStatsWidget stats={stats} timeRange={config.timeRange} />
          </div>
        )}

        {/* Productivity Trends */}
        {config.widgets.includes('productivity') && (
          <div className="lg:col-span-2">
            <DashboardWidget
              title={t('dashboard.widgets.productivityTrends')}
              icon={<TrendingUp className="w-5 h-5" />}
            >
              <ProductivityTrends timeEntries={getFilteredTimeEntries()} />
            </DashboardWidget>
          </div>
        )}

        {/* Time Distribution */}
        {config.widgets.includes('distribution') && (
          <DashboardWidget
            title={t('dashboard.widgets.timeDistribution')}
            icon={<PieChart className="w-5 h-5" />}
          >
            <TimeDistributionChart
              timeEntries={getFilteredTimeEntries()}
              projects={projects}
            />
          </DashboardWidget>
        )}

        {/* Project Performance */}
        {config.widgets.includes('projects') && (
          <div className="lg:col-span-2">
            <DashboardWidget
              title={t('dashboard.widgets.projectPerformance')}
              icon={<BarChart3 className="w-5 h-5" />}
            >
              <ProjectPerformanceChart
                timeEntries={getFilteredTimeEntries()}
                projects={projects}
              />
            </DashboardWidget>
          </div>
        )}

        {/* Recent Activity */}
        {config.widgets.includes('activity') && (
          <DashboardWidget
            title={t('dashboard.widgets.recentActivity')}
            icon={<Activity className="w-5 h-5" />}
          >
            <RecentActivityWidget
              timeEntries={timeEntries.slice(0, 5)}
              projects={projects}
            />
          </DashboardWidget>
        )}
      </div>
    </div>
  );
};

export default AdvancedDashboard;