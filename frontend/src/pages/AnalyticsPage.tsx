import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon, ClockIcon, UserGroupIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import UsageCharts from '../components/Analytics/UsageCharts';
import TimeTrackingMetrics from '../components/Analytics/TimeTrackingMetrics';
import { useAuthStore } from '../store/authStore';
import { analyticsService } from '../services/analyticsService';

interface AnalyticsData {
  totalTimeTracked: number;
  totalProjects: number;
  totalTasks: number;
  activeUsers: number;
  weeklyData: Array<{
    week: string;
    hours: number;
    projects: number;
    tasks: number;
  }>;
  projectBreakdown: Array<{
    name: string;
    hours: number;
    color: string;
  }>;
  userActivity: Array<{
    user: string;
    hours: number;
    tasksCompleted: number;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const analyticsData = await analyticsService.getUsageAnalytics(timeRange);
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('analytics.noData')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('analytics.noDataDescription')}
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: t('analytics.totalTimeTracked'),
      stat: `${Math.round(data.totalTimeTracked)} ${t('common.hours')}`,
      icon: ClockIcon,
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      name: t('analytics.totalProjects'),
      stat: data.totalProjects.toString(),
      icon: ChartBarIcon,
      change: '+19%',
      changeType: 'increase' as const,
    },
    {
      name: t('analytics.totalTasks'),
      stat: data.totalTasks.toString(),
      icon: CursorArrowRaysIcon,
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      name: t('analytics.activeUsers'),
      stat: data.activeUsers.toString(),
      icon: UserGroupIcon,
      change: '+3%',
      changeType: 'increase' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('analytics.title')}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('analytics.subtitle')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="7d">{t('analytics.timeRange.7d')}</option>
              <option value="30d">{t('analytics.timeRange.30d')}</option>
              <option value="90d">{t('analytics.timeRange.90d')}</option>
              <option value="1y">{t('analytics.timeRange.1y')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-primary-500 p-3">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {item.stat}
                </p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === 'increase'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {item.change}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {t('analytics.usageOverTime')}
          </h3>
          <UsageCharts data={data.weeklyData} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {t('analytics.projectBreakdown')}
          </h3>
          <TimeTrackingMetrics data={data.projectBreakdown} />
        </div>
      </div>

      {/* User Activity Table */}
      {user?.is_organization_owner && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('analytics.userActivity')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('analytics.user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('analytics.hoursTracked')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('analytics.tasksCompleted')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.userActivity.map((user, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(user.hours)} {t('common.hours')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.tasksCompleted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;