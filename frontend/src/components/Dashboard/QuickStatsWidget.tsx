import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Activity,
  Award
} from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

interface QuickStatsProps {
  stats: {
    totalHours: number;
    averageDailyHours: number;
    totalProjects: number;
    productivity: number;
    entriesCount: number;
    uniqueDays: number;
  };
  timeRange: string;
}

const QuickStatsWidget: React.FC<QuickStatsProps> = ({ stats, timeRange }) => {
  const { t } = useTranslation();

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return t('dashboard.timeRange.7d');
      case '30d': return t('dashboard.timeRange.30d');
      case '90d': return t('dashboard.timeRange.90d');
      case '1y': return t('dashboard.timeRange.1y');
      default: return timeRange;
    }
  };

  const statCards = [
    {
      title: t('dashboard.stats.totalHours'),
      value: formatDuration(stats.totalHours * 3600),
      icon: Clock,
      color: 'blue',
      trend: '+12%',
      trendDirection: 'up' as const
    },
    {
      title: t('dashboard.stats.averageDaily'),
      value: `${stats.averageDailyHours.toFixed(1)}h`,
      icon: Calendar,
      color: 'green',
      trend: '+8%',
      trendDirection: 'up' as const
    },
    {
      title: t('dashboard.stats.activeProjects'),
      value: stats.totalProjects.toString(),
      icon: Target,
      color: 'purple',
      trend: '+3',
      trendDirection: 'up' as const
    },
    {
      title: t('dashboard.stats.productivity'),
      value: `${stats.productivity}%`,
      icon: Award,
      color: 'orange',
      trend: stats.productivity >= 75 ? '+5%' : '-2%',
      trendDirection: stats.productivity >= 75 ? 'up' as const : 'down' as const
    },
    {
      title: t('dashboard.stats.timeEntries'),
      value: stats.entriesCount.toString(),
      icon: Activity,
      color: 'indigo',
      trend: '+15%',
      trendDirection: 'up' as const
    },
    {
      title: t('dashboard.stats.activeDays'),
      value: stats.uniqueDays.toString(),
      icon: TrendingUp,
      color: 'emerald',
      trend: `${Math.round((stats.uniqueDays / 30) * 100)}%`,
      trendDirection: 'up' as const
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 text-blue-100',
      green: 'bg-green-500 text-green-100',
      purple: 'bg-purple-500 text-purple-100',
      orange: 'bg-orange-500 text-orange-100',
      indigo: 'bg-indigo-500 text-indigo-100',
      emerald: 'bg-emerald-500 text-emerald-100'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getTrendColor = (direction: 'up' | 'down') => {
    return direction === 'up'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('dashboard.overview')} - {getTimeRangeLabel()}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('dashboard.lastUpdated')}: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="card p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`text-sm font-medium ${getTrendColor(stat.trendDirection)}`}>
                  {stat.trendDirection === 'up' ? '↗' : '↘'} {stat.trend}
                </div>
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
              </div>

              {/* Progress bar for productivity */}
              {stat.title === t('dashboard.stats.productivity') && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        stats.productivity >= 75
                          ? 'bg-green-500'
                          : stats.productivity >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, stats.productivity)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Insights */}
      <div className="card p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-l-4 border-primary-500">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              {t('dashboard.insights.title')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {stats.productivity >= 75
                ? t('dashboard.insights.highProductivity')
                : stats.productivity >= 50
                ? t('dashboard.insights.moderateProductivity')
                : t('dashboard.insights.lowProductivity')
              } {t('dashboard.insights.averageDaily', { hours: stats.averageDailyHours.toFixed(1) })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsWidget;