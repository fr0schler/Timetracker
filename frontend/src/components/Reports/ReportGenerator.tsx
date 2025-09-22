import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import { useTimeEntryStore } from '../../store/timeEntryStore';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';

export interface ReportConfig {
  title: string;
  type: 'summary' | 'detailed' | 'productivity' | 'project' | 'team';
  timeRange: {
    start: Date;
    end: Date;
    preset: '7d' | '30d' | '90d' | '1y' | 'custom';
  };
  groupBy: 'day' | 'week' | 'month' | 'project' | 'user';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeDetails: boolean;
}

const ReportGenerator: React.FC = () => {
  const { timeEntries, fetchTimeEntries } = useTimeEntryStore();
  const { projects, fetchProjects } = useProjectStore();
  const { user } = useAuthStore();

  const [config, setConfig] = useState<ReportConfig>({
    title: 'Time Tracking Report',
    type: 'summary',
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      preset: '30d'
    },
    groupBy: 'day',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, []);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const reportData = generateReportData();
      downloadReport(reportData, config.format);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportData = () => {
    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= config.timeRange.start && entryDate <= config.timeRange.end;
    });

    const projectStats = projects.map(project => {
      const projectEntries = filteredEntries.filter(entry => entry.project_id === project.id);
      const totalHours = projectEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0) / 3600;

      return {
        projectName: project.name,
        totalHours: Math.round(totalHours * 100) / 100,
        entries: projectEntries.length,
        color: project.color
      };
    }).filter(stat => stat.totalHours > 0);

    return {
      title: config.title,
      generatedAt: new Date().toISOString(),
      timeRange: config.timeRange,
      summary: {
        totalHours: Math.round(filteredEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0) / 3600 * 100) / 100,
        totalEntries: filteredEntries.length,
        projectCount: projectStats.length,
        averageDailyHours: 0
      },
      projectStats,
      entries: config.includeDetails ? filteredEntries : []
    };
  };

  const downloadReport = (data: any, format: string) => {
    let content = '';
    let filename = `report-${Date.now()}`;
    let mimeType = 'application/octet-stream';

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        content = generateCSV(data);
        filename += '.csv';
        mimeType = 'text/csv';
        break;
      case 'excel':
        content = generateCSV(data);
        filename += '.xlsx';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        content = generateTextReport(data);
        filename += '.txt';
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (data: any) => {
    const headers = ['Project', 'Total Hours', 'Entries'];
    const rows = data.projectStats.map((stat: any) => [
      stat.projectName,
      stat.totalHours,
      stat.entries
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateTextReport = (data: any) => {
    return `
${data.title}
Generated: ${new Date(data.generatedAt).toLocaleString()}
Time Range: ${data.timeRange.start.toLocaleDateString()} - ${data.timeRange.end.toLocaleDateString()}

SUMMARY
=======
Total Hours: ${data.summary.totalHours}
Total Entries: ${data.summary.totalEntries}
Projects: ${data.summary.projectCount}

PROJECT BREAKDOWN
================
${data.projectStats.map((stat: any) => `${stat.projectName}: ${stat.totalHours}h (${stat.entries} entries)`).join('\n')}
    `;
  };

  const updateConfig = (updates: Partial<ReportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const reportTypes = [
    {
      id: 'summary',
      name: 'Summary Report',
      description: 'High-level overview of time tracking data',
      icon: BarChart3
    },
    {
      id: 'detailed',
      name: 'Detailed Report',
      description: 'Comprehensive breakdown of all activities',
      icon: FileText
    },
    {
      id: 'productivity',
      name: 'Productivity Report',
      description: 'Focus on productivity metrics and trends',
      icon: TrendingUp
    },
    {
      id: 'project',
      name: 'Project Report',
      description: 'Project-specific time allocation analysis',
      icon: Target
    },
    {
      id: 'team',
      name: 'Team Report',
      description: 'Team performance and collaboration insights',
      icon: Users,
      requiresOwner: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Report Generator
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create comprehensive reports from your time tracking data
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-secondary"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Report Type
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                const isDisabled = type.requiresOwner && !user?.is_organization_owner;

                return (
                  <button
                    key={type.id}
                    onClick={() => updateConfig({ type: type.id as any })}
                    disabled={isDisabled}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      config.type === type.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        config.type === type.id
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {type.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => updateConfig({ title: e.target.value })}
                  className="input"
                  placeholder="Enter report title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Range
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: '7d', label: 'Last 7 days', days: 7 },
                    { id: '30d', label: 'Last 30 days', days: 30 },
                    { id: '90d', label: 'Last 90 days', days: 90 },
                    { id: '1y', label: 'Last year', days: 365 }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => updateConfig({
                        timeRange: {
                          ...config.timeRange,
                          preset: preset.id as any,
                          start: new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000),
                          end: new Date()
                        }
                      })}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        config.timeRange.preset === preset.id
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['pdf', 'excel', 'csv', 'json'].map((format) => (
                    <button
                      key={format}
                      onClick={() => updateConfig({ format: format as any })}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        config.format === format
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeCharts}
                    onChange={(e) => updateConfig({ includeCharts: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Include Charts and Visualizations
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeDetails}
                    onChange={(e) => updateConfig({ includeDetails: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Include Detailed Time Entry Breakdown
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Report Preview
            </h3>
            <div className="space-y-4">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {config.title}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  {config.timeRange.start.toLocaleDateString()} - {config.timeRange.end.toLocaleDateString()}
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Report Details
                </h4>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div>Type: {config.type}</div>
                  <div>Format: {config.format.toUpperCase()}</div>
                  <div>Group by: {config.groupBy}</div>
                  <div>Include charts: {config.includeCharts ? 'Yes' : 'No'}</div>
                  <div>Include details: {config.includeDetails ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;