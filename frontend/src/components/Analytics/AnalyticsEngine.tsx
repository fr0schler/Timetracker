import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  Clock,
  Calendar,
  PieChart,
  Activity,
  Zap,
  Award
} from 'lucide-react';
import { TimeEntry } from '../../types';
import { useTimeEntryStore } from '../../store/timeEntryStore';
import { useProjectStore } from '../../store/projectStore';
import { format, subDays, isWeekend } from 'date-fns';

interface AnalyticsInsight {
  id: string;
  type: 'productivity' | 'efficiency' | 'pattern' | 'goal' | 'recommendation';
  title: string;
  description: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  severity: 'low' | 'medium' | 'high';
  icon: React.ComponentType<any>;
  color: string;
}

interface ProductivityMetrics {
  totalHours: number;
  averageSessionLength: number;
  focusScore: number;
  consistencyScore: number;
  efficiencyRating: number;
  burnoutRisk: number;
  weekdayVsWeekend: {
    weekday: number;
    weekend: number;
  };
}

const AnalyticsEngine: React.FC = () => {
  const { timeEntries, fetchTimeEntries } = useTimeEntryStore();
  const { projects, fetchProjects } = useProjectStore();

  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (timeEntries.length > 0 && projects.length > 0) {
      analyzeData();
    }
  }, [timeEntries, projects, timeRange]);

  const analyzeData = async () => {
    setIsLoading(true);

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = subDays(new Date(), days);

    const filteredEntries = timeEntries.filter(entry =>
      new Date(entry.start_time) >= cutoffDate
    );

    const calculatedMetrics = calculateMetrics(filteredEntries);
    const generatedInsights = generateInsights(filteredEntries, calculatedMetrics);

    setMetrics(calculatedMetrics);
    setInsights(generatedInsights);
    setIsLoading(false);
  };

  const calculateMetrics = (entries: TimeEntry[]): ProductivityMetrics => {
    if (entries.length === 0) {
      return {
        totalHours: 0,
        averageSessionLength: 0,
        focusScore: 0,
        consistencyScore: 0,
        efficiencyRating: 0,
        burnoutRisk: 0,
        weekdayVsWeekend: { weekday: 0, weekend: 0 }
      };
    }

    const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
    const totalHours = totalSeconds / 3600;
    const averageSessionLength = totalHours / entries.length;

    // Focus Score: Based on session length (longer sessions = better focus)
    const focusScore = Math.min(100, (averageSessionLength / 2) * 100);

    // Consistency Score: Based on daily activity
    const uniqueDays = new Set(
      entries.map(entry => format(new Date(entry.start_time), 'yyyy-MM-dd'))
    ).size;
    const possibleDays = Math.min(parseInt(timeRange.replace('d', '')), 30);
    const consistencyScore = (uniqueDays / possibleDays) * 100;

    // Efficiency Rating: Based on productive hours vs total tracked time
    const dailyHours = totalHours / uniqueDays;
    const efficiencyRating = Math.min(100, (dailyHours / 8) * 100);

    // Burnout Risk: Based on overwork patterns
    const dailyAverages = entries.reduce((acc, entry) => {
      const day = format(new Date(entry.start_time), 'yyyy-MM-dd');
      acc[day] = (acc[day] || 0) + entry.duration_seconds / 3600;
      return acc;
    }, {} as Record<string, number>);

    const highWorkloadDays = Object.values(dailyAverages).filter(hours => hours > 10).length;
    const burnoutRisk = (highWorkloadDays / uniqueDays) * 100;

    // Weekday vs Weekend
    const weekdayEntries = entries.filter(entry => !isWeekend(new Date(entry.start_time)));
    const weekendEntries = entries.filter(entry => isWeekend(new Date(entry.start_time)));

    const weekdayHours = weekdayEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0) / 3600;
    const weekendHours = weekendEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0) / 3600;

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      averageSessionLength: Math.round(averageSessionLength * 10) / 10,
      focusScore: Math.round(focusScore),
      consistencyScore: Math.round(consistencyScore),
      efficiencyRating: Math.round(efficiencyRating),
      burnoutRisk: Math.round(burnoutRisk),
      weekdayVsWeekend: {
        weekday: Math.round(weekdayHours * 10) / 10,
        weekend: Math.round(weekendHours * 10) / 10
      }
    };
  };

  const generateInsights = (entries: TimeEntry[], metrics: ProductivityMetrics): AnalyticsInsight[] => {
    const insights: AnalyticsInsight[] = [];

    // Productivity Insights
    if (metrics.focusScore < 50) {
      insights.push({
        id: 'low-focus',
        type: 'productivity',
        title: 'Low Focus Score',
        description: 'Your sessions are shorter than optimal. Try working in longer, focused blocks.',
        value: `${metrics.focusScore}%`,
        trend: 'down',
        severity: 'medium',
        icon: Brain,
        color: 'text-orange-600'
      });
    } else if (metrics.focusScore > 80) {
      insights.push({
        id: 'high-focus',
        type: 'productivity',
        title: 'Excellent Focus',
        description: 'Your deep work sessions are highly effective. Keep it up!',
        value: `${metrics.focusScore}%`,
        trend: 'up',
        severity: 'low',
        icon: Target,
        color: 'text-green-600'
      });
    }

    // Burnout Risk
    if (metrics.burnoutRisk > 30) {
      insights.push({
        id: 'burnout-risk',
        type: 'recommendation',
        title: 'Burnout Risk Detected',
        description: 'You have multiple high-workload days. Consider taking breaks.',
        value: `${metrics.burnoutRisk}%`,
        trend: 'up',
        severity: 'high',
        icon: Zap,
        color: 'text-red-600'
      });
    }

    // Consistency Patterns
    if (metrics.consistencyScore < 60) {
      insights.push({
        id: 'low-consistency',
        type: 'pattern',
        title: 'Inconsistent Work Pattern',
        description: 'Try to establish a more regular work routine for better productivity.',
        value: `${metrics.consistencyScore}%`,
        trend: 'down',
        severity: 'medium',
        icon: Calendar,
        color: 'text-yellow-600'
      });
    }

    // Efficiency Rating
    if (metrics.efficiencyRating > 85) {
      insights.push({
        id: 'high-efficiency',
        type: 'efficiency',
        title: 'High Efficiency',
        description: 'You maintain excellent daily productivity levels.',
        value: `${metrics.efficiencyRating}%`,
        trend: 'up',
        severity: 'low',
        icon: Award,
        color: 'text-blue-600'
      });
    }

    // Work-Life Balance
    const workLifeRatio = metrics.weekdayVsWeekend.weekend / metrics.weekdayVsWeekend.weekday;
    if (workLifeRatio > 0.8) {
      insights.push({
        id: 'work-life-balance',
        type: 'recommendation',
        title: 'Work-Life Balance Alert',
        description: 'You work significant hours on weekends. Consider more rest time.',
        value: `${Math.round(workLifeRatio * 100)}%`,
        trend: 'up',
        severity: 'medium',
        icon: Clock,
        color: 'text-purple-600'
      });
    }

    // Project Diversity
    const uniqueProjects = new Set(entries.map(entry => entry.project_id)).size;
    if (uniqueProjects > 5) {
      insights.push({
        id: 'project-diversity',
        type: 'pattern',
        title: 'High Project Diversity',
        description: 'You work on many projects. Consider focusing on fewer for better results.',
        value: uniqueProjects,
        trend: 'up',
        severity: 'medium',
        icon: PieChart,
        color: 'text-indigo-600'
      });
    }

    return insights;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400">Analyzing your productivity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Engine
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            AI-powered insights into your productivity patterns
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Focus Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.focusScore}%
                </p>
              </div>
              <Brain className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Consistency</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.consistencyScore}%
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Efficiency</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.efficiencyRating}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalHours}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          AI-Powered Insights
        </h3>

        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No specific insights available. Keep tracking to generate personalized recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {insight.title}
                        </h4>
                        <span className={`text-sm font-semibold ${insight.color}`}>
                          {insight.value}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {insight.description}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Work Patterns
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average Session</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metrics.averageSessionLength}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Weekday Hours</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metrics.weekdayVsWeekend.weekday}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Weekend Hours</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metrics.weekdayVsWeekend.weekend}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Burnout Risk</span>
                <span className={`font-medium ${
                  metrics.burnoutRisk > 50 ? 'text-red-600' :
                  metrics.burnoutRisk > 30 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metrics.burnoutRisk}%
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Performance Scores
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Focus Score', value: metrics.focusScore, color: 'blue' },
                { label: 'Consistency', value: metrics.consistencyScore, color: 'green' },
                { label: 'Efficiency', value: metrics.efficiencyRating, color: 'purple' }
              ].map((score) => (
                <div key={score.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{score.label}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {score.value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-${score.color}-500`}
                      style={{ width: `${score.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsEngine;