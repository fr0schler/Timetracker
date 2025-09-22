import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface UsageData {
  week: string;
  hours: number;
  projects: number;
  tasks: number;
}

interface UsageChartsProps {
  data: UsageData[];
}

const UsageCharts: React.FC<UsageChartsProps> = ({ data }) => {
  const { t } = useTranslation();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{`${t('analytics.week')}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Hours Tracked Over Time */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('analytics.hoursTrackedOverTime')}
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="week"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name={t('analytics.hours')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projects and Tasks Activity */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('analytics.projectsAndTasks')}
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="week"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="projects"
                fill="#10B981"
                name={t('analytics.projects')}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="tasks"
                fill="#F59E0B"
                name={t('analytics.tasks')}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UsageCharts;