import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { TimeEntry } from '../../types';
import { Project } from '../../types';

interface TimeDistributionChartProps {
  timeEntries: TimeEntry[];
  projects: Project[];
}

const TimeDistributionChart: React.FC<TimeDistributionChartProps> = ({
  timeEntries,
  projects
}) => {
  const { t } = useTranslation();

  // Process data for the pie chart
  const projectData = React.useMemo(() => {
    const projectTime: Record<string, { duration: number; project: Project }> = {};

    timeEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      if (project) {
        if (!projectTime[project.id]) {
          projectTime[project.id] = { duration: 0, project };
        }
        projectTime[project.id].duration += entry.duration_seconds;
      }
    });

    return Object.values(projectTime)
      .map(({ duration, project }) => ({
        name: project.name,
        value: Math.round(duration / 3600 * 10) / 10, // Hours with 1 decimal
        hours: Math.round(duration / 3600 * 10) / 10,
        color: project.color || '#3B82F6',
        percentage: 0 // Will be calculated after sorting
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Show top 8 projects
  }, [timeEntries, projects]);

  // Calculate percentages
  const totalHours = projectData.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentages = projectData.map(item => ({
    ...item,
    percentage: totalHours > 0 ? Math.round((item.value / totalHours) * 100) : 0
  }));

  const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.hours}h ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="mt-4 space-y-2">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {entry.value}
            </span>
          </div>
          <span className="text-gray-500 dark:text-gray-400">
            {entry.payload.hours}h
          </span>
        </div>
      ))}
    </div>
  );

  if (dataWithPercentages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PieChart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('dashboard.charts.noData')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={dataWithPercentages}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {dataWithPercentages.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="max-h-32 overflow-y-auto">
        <CustomLegend payload={dataWithPercentages.map((item, index) => ({
          value: item.name,
          color: item.color || COLORS[index % COLORS.length],
          payload: item
        }))} />
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {t('dashboard.charts.totalHours')}:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {totalHours.toFixed(1)}h
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500 dark:text-gray-400">
            {t('dashboard.charts.projects')}:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {dataWithPercentages.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeDistributionChart;