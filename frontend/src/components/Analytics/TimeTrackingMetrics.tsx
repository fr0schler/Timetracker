import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface ProjectData {
  name: string;
  hours: number;
  color: string;
}

interface TimeTrackingMetricsProps {
  data: ProjectData[];
}

const TimeTrackingMetrics: React.FC<TimeTrackingMetricsProps> = ({ data }) => {
  const { t } = useTranslation();

  const COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#F97316',
    '#06B6D4',
    '#84CC16',
    '#EC4899',
    '#6366F1',
  ];

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }));

  const totalHours = data.reduce((sum, item) => sum + item.hours, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.hours / totalHours) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {`${data.hours.toFixed(1)} ${t('common.hours')} (${percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <p className="text-sm">{t('analytics.noProjectData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="hours"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Project Legend and Details */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t('analytics.projectBreakdownDetails')}
        </h5>
        <div className="space-y-2">
          {chartData
            .sort((a, b) => b.hours - a.hours)
            .map((project, index) => {
              const percentage = ((project.hours / totalHours) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-32">
                      {project.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{project.hours.toFixed(1)} {t('common.hours')}</span>
                    <span className="text-xs">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('analytics.totalTime')}
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {totalHours.toFixed(1)} {t('common.hours')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingMetrics;