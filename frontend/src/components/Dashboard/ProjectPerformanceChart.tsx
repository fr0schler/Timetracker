import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TimeEntry, Project } from '../../types';

interface ProjectPerformanceChartProps {
  timeEntries: TimeEntry[];
  projects: Project[];
}

const ProjectPerformanceChart: React.FC<ProjectPerformanceChartProps> = ({
  timeEntries,
  projects
}) => {
  const { t } = useTranslation();

  const chartData = React.useMemo(() => {
    const projectStats: Record<string, {
      project: Project;
      totalHours: number;
      entries: number;
      avgSession: number;
    }> = {};

    timeEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      if (project) {
        if (!projectStats[project.id]) {
          projectStats[project.id] = {
            project,
            totalHours: 0,
            entries: 0,
            avgSession: 0
          };
        }
        projectStats[project.id].totalHours += entry.duration_seconds / 3600;
        projectStats[project.id].entries += 1;
      }
    });

    return Object.values(projectStats)
      .map(stats => ({
        name: stats.project.name.length > 15
          ? stats.project.name.substring(0, 15) + '...'
          : stats.project.name,
        fullName: stats.project.name,
        hours: Math.round(stats.totalHours * 10) / 10,
        entries: stats.entries,
        avgSession: stats.entries > 0 ? Math.round((stats.totalHours / stats.entries) * 10) / 10 : 0,
        color: stats.project.color || '#3B82F6',
        efficiency: stats.entries > 0 ? Math.min(100, (stats.totalHours / stats.entries) * 20) : 0
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);
  }, [timeEntries, projects]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-2">
            {data.fullName}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
              <span className="text-gray-900 dark:text-white font-medium">{data.hours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Time Entries:</span>
              <span className="text-gray-900 dark:text-white">{data.entries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Session:</span>
              <span className="text-gray-900 dark:text-white">{data.avgSession}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
              <span className="text-gray-900 dark:text-white">{Math.round(data.efficiency)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('dashboard.charts.noProjectData')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="hours"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Performer */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
              {t('dashboard.performance.topProject')}
            </h4>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          {chartData[0] && (
            <>
              <p className="font-semibold text-green-900 dark:text-green-100">
                {chartData[0].fullName}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {chartData[0].hours}h total • {chartData[0].entries} entries
              </p>
            </>
          )}
        </div>

        {/* Most Efficient */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {t('dashboard.performance.mostEfficient')}
            </h4>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
          {(() => {
            const mostEfficient = chartData.reduce((prev, current) =>
              prev.avgSession > current.avgSession ? prev : current
            );
            return (
              <>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {mostEfficient.fullName}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {mostEfficient.avgSession}h avg session
                </p>
              </>
            );
          })()}
        </div>

        {/* Most Active */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
              {t('dashboard.performance.mostActive')}
            </h4>
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
          {(() => {
            const mostActive = chartData.reduce((prev, current) =>
              prev.entries > current.entries ? prev : current
            );
            return (
              <>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  {mostActive.fullName}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {mostActive.entries} time entries
                </p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('dashboard.performance.projectBreakdown')}
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {chartData.map((project, index) => (
            <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {project.fullName}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {project.hours}h
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {project.entries} entries
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectPerformanceChart;