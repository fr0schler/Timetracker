import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart
} from 'recharts';
import { TimeEntry } from '../../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface ProductivityTrendsProps {
  timeEntries: TimeEntry[];
}

const ProductivityTrends: React.FC<ProductivityTrendsProps> = ({ timeEntries }) => {
  const { t } = useTranslation();

  // Generate data for the last 14 days
  const chartData = React.useMemo(() => {
    const data = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // Filter entries for this day
      const dayEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= dayStart && entryDate <= dayEnd;
      });

      // Calculate metrics
      const totalHours = dayEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0) / 3600;
      const totalEntries = dayEntries.length;
      const uniqueProjects = new Set(dayEntries.map(entry => entry.project_id)).size;

      // Calculate focus score (longer entries = better focus)
      const averageSessionLength = totalEntries > 0 ? totalHours / totalEntries : 0;
      const focusScore = Math.min(100, (averageSessionLength / 2) * 100); // 2 hours = 100% focus

      // Calculate productivity score
      const hoursScore = Math.min(100, (totalHours / 8) * 100); // 8 hours = 100%
      const consistencyScore = totalEntries > 0 ? Math.min(100, (totalEntries / 4) * 100) : 0; // 4 entries = 100%
      const productivityScore = (hoursScore + consistencyScore + focusScore) / 3;

      data.push({
        date: format(date, 'MMM dd'),
        fullDate: format(date, 'yyyy-MM-dd'),
        hours: Math.round(totalHours * 10) / 10,
        entries: totalEntries,
        projects: uniqueProjects,
        productivity: Math.round(productivityScore),
        focus: Math.round(focusScore),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    return data;
  }, [timeEntries]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-2">
            {label} {data.isWeekend && '(Weekend)'}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Hours:</span>
              <span className="text-gray-900 dark:text-white">{data.hours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Entries:</span>
              <span className="text-gray-900 dark:text-white">{data.entries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Projects:</span>
              <span className="text-gray-900 dark:text-white">{data.projects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Productivity:</span>
              <span className="text-gray-900 dark:text-white">{data.productivity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Focus:</span>
              <span className="text-gray-900 dark:text-white">{data.focus}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate average values for insights
  const averageHours = chartData.reduce((sum, day) => sum + day.hours, 0) / chartData.length;
  const averageProductivity = chartData.reduce((sum, day) => sum + day.productivity, 0) / chartData.length;
  const weekdayData = chartData.filter(day => !day.isWeekend);
  const weekendData = chartData.filter(day => day.isWeekend);
  const weekdayAvg = weekdayData.length > 0 ? weekdayData.reduce((sum, day) => sum + day.hours, 0) / weekdayData.length : 0;
  const weekendAvg = weekendData.length > 0 ? weekendData.reduce((sum, day) => sum + day.hours, 0) / weekendData.length : 0;

  return (
    <div className="space-y-6">
      {/* Primary Chart - Hours and Productivity */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('dashboard.charts.hoursAndProductivity')}
        </h4>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                yAxisId="hours"
                orientation="left"
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                yAxisId="productivity"
                orientation="right"
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />

              <Bar
                yAxisId="hours"
                dataKey="hours"
                fill="#3B82F6"
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              />

              <Line
                yAxisId="productivity"
                type="monotone"
                dataKey="productivity"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Chart - Focus Score */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('dashboard.charts.focusTrend')}
        </h4>
        <div style={{ width: '100%', height: 120 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="focus"
                stroke="#8B5CF6"
                fillOpacity={1}
                fill="url(#focusGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              {t('dashboard.insights.averageDaily')}
            </span>
            <span className="text-blue-900 dark:text-blue-100 font-semibold">
              {averageHours.toFixed(1)}h
            </span>
          </div>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
            {averageHours >= 6 ? t('dashboard.insights.goodPace') : t('dashboard.insights.roomForImprovement')}
          </p>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-green-700 dark:text-green-300 font-medium">
              {t('dashboard.insights.productivity')}
            </span>
            <span className="text-green-900 dark:text-green-100 font-semibold">
              {Math.round(averageProductivity)}%
            </span>
          </div>
          <p className="text-green-600 dark:text-green-400 text-xs mt-1">
            {averageProductivity >= 70 ? t('dashboard.insights.highPerformance') : t('dashboard.insights.canImprove')}
          </p>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-purple-700 dark:text-purple-300 font-medium">
              {t('dashboard.insights.weekdays')}
            </span>
            <span className="text-purple-900 dark:text-purple-100 font-semibold">
              {weekdayAvg.toFixed(1)}h
            </span>
          </div>
          <p className="text-purple-600 dark:text-purple-400 text-xs mt-1">
            vs {weekendAvg.toFixed(1)}h {t('dashboard.insights.weekends')}
          </p>
        </div>

        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-300 font-medium">
              {t('dashboard.insights.consistency')}
            </span>
            <span className="text-orange-900 dark:text-orange-100 font-semibold">
              {chartData.filter(day => day.hours > 0).length}/14
            </span>
          </div>
          <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">
            {t('dashboard.insights.activeDays')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductivityTrends;