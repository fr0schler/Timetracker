import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Code,
  Calendar,
  X
} from 'lucide-react';
import { useTimeEntryStore } from '../../store/timeEntryStore';
import { useProjectStore } from '../../store/projectStore';
import { format, subDays } from 'date-fns';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  extension: string;
  mimeType: string;
  supportsCharts: boolean;
}

interface ExportConfig {
  format: string;
  timeRange: {
    start: Date;
    end: Date;
    preset: '7d' | '30d' | '90d' | '1y' | 'custom';
  };
  includeProjects: string[];
  includeFields: string[];
  groupBy: 'day' | 'week' | 'month' | 'project';
  includeCharts: boolean;
  includeStatistics: boolean;
}

interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
}

const ExportManager: React.FC = () => {
  const { timeEntries, fetchTimeEntries } = useTimeEntryStore();
  const { projects, fetchProjects } = useProjectStore();

  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    timeRange: {
      start: subDays(new Date(), 30),
      end: new Date(),
      preset: '30d'
    },
    includeProjects: [],
    includeFields: ['start_time', 'end_time', 'duration_seconds', 'description', 'project_name'],
    groupBy: 'day',
    includeCharts: false,
    includeStatistics: true
  });

  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats: ExportFormat[] = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Comma-separated values for spreadsheet applications',
      icon: FileSpreadsheet,
      extension: 'csv',
      mimeType: 'text/csv',
      supportsCharts: false
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Microsoft Excel workbook with formatted data',
      icon: FileSpreadsheet,
      extension: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      supportsCharts: true
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Formatted report with charts and statistics',
      icon: FileText,
      extension: 'pdf',
      mimeType: 'application/pdf',
      supportsCharts: true
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Structured data for API integration',
      icon: Code,
      extension: 'json',
      mimeType: 'application/json',
      supportsCharts: false
    },
    {
      id: 'ics',
      name: 'Calendar (ICS)',
      description: 'Calendar file for importing into calendar apps',
      icon: Calendar,
      extension: 'ics',
      mimeType: 'text/calendar',
      supportsCharts: false
    }
  ];

  const availableFields = [
    { id: 'start_time', name: 'Start Time', required: true },
    { id: 'end_time', name: 'End Time', required: false },
    { id: 'duration_seconds', name: 'Duration', required: true },
    { id: 'description', name: 'Description', required: false },
    { id: 'project_name', name: 'Project Name', required: true },
    { id: 'project_color', name: 'Project Color', required: false },
    { id: 'task_id', name: 'Task ID', required: false },
    { id: 'is_billable', name: 'Billable', required: false },
    { id: 'hourly_rate', name: 'Hourly Rate', required: false }
  ];

  React.useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, []);

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleExport = async () => {
    setIsExporting(true);

    const jobId = `export-${Date.now()}`;
    const newJob: ExportJob = {
      id: jobId,
      name: `${config.format.toUpperCase()} Export - ${format(new Date(), 'MMM dd, yyyy')}`,
      status: 'processing',
      progress: 0,
      createdAt: new Date()
    };

    setJobs(prev => [newJob, ...prev]);

    try {
      // Simulate export process
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, progress: i } : job
        ));
      }

      // Generate export data
      const exportData = generateExportData();
      const blob = createExportBlob(exportData, config.format);
      const downloadUrl = URL.createObjectURL(blob);

      setJobs(prev => prev.map(job =>
        job.id === jobId ? {
          ...job,
          status: 'completed',
          progress: 100,
          downloadUrl
        } : job
      ));

    } catch (error) {
      setJobs(prev => prev.map(job =>
        job.id === jobId ? {
          ...job,
          status: 'failed',
          error: 'Export failed. Please try again.'
        } : job
      ));
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportData = () => {
    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      const inTimeRange = entryDate >= config.timeRange.start && entryDate <= config.timeRange.end;
      const inProjectFilter = config.includeProjects.length === 0 ||
        config.includeProjects.includes(entry.project_id.toString());
      return inTimeRange && inProjectFilter;
    });

    const enrichedEntries = filteredEntries.map(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      return {
        ...entry,
        project_name: project?.name || 'Unknown',
        project_color: project?.color || '#6B7280',
        end_time: entry.end_time || new Date(new Date(entry.start_time).getTime() + entry.duration_seconds * 1000).toISOString(),
        is_billable: entry.is_billable || false,
        hourly_rate: entry.hourly_rate || 0
      };
    });

    return enrichedEntries;
  };

  const createExportBlob = (data: any[], format: string): Blob => {
    let content = '';
    let mimeType = 'text/plain';

    switch (format) {
      case 'csv':
        content = generateCSV(data);
        mimeType = 'text/csv';
        break;
      case 'json':
        content = JSON.stringify({
          export_info: {
            generated_at: new Date().toISOString(),
            time_range: config.timeRange,
            total_entries: data.length,
            total_hours: data.reduce((sum, entry) => sum + entry.duration_seconds, 0) / 3600
          },
          time_entries: data
        }, null, 2);
        mimeType = 'application/json';
        break;
      case 'ics':
        content = generateICS(data);
        mimeType = 'text/calendar';
        break;
      default:
        content = generateCSV(data);
        mimeType = 'text/csv';
    }

    return new Blob([content], { type: mimeType });
  };

  const generateCSV = (data: any[]) => {
    const headers = config.includeFields
      .map(field => availableFields.find(f => f.id === field)?.name || field);

    const rows = data.map(entry =>
      config.includeFields.map(field => {
        let value = entry[field];
        if (field === 'start_time' || field === 'end_time') {
          value = new Date(value).toLocaleString();
        } else if (field === 'duration_seconds') {
          value = Math.round(value / 3600 * 100) / 100; // Convert to hours
        }
        return `"${value || ''}"`;
      })
    );

    return [headers.map(h => `"${h}"`), ...rows].map(row => row.join(',')).join('\n');
  };

  const generateICS = (data: any[]) => {
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TimeTracker//TimeTracker//EN',
      'CALSCALE:GREGORIAN'
    ];

    data.forEach(entry => {
      const startDate = new Date(entry.start_time);
      const endDate = new Date(entry.end_time);

      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${entry.id}@timetracker.local`,
        `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${entry.project_name}${entry.description ? ` - ${entry.description}` : ''}`,
        `DESCRIPTION:Duration: ${Math.round(entry.duration_seconds / 3600 * 100) / 100} hours`,
        'END:VEVENT'
      );
    });

    icsLines.push('END:VCALENDAR');
    return icsLines.join('\r\n');
  };

  const downloadJob = (job: ExportJob) => {
    if (job.downloadUrl) {
      const format = exportFormats.find(f => f.id === config.format);
      const filename = `timetracker-export-${format?.extension || 'txt'}`;

      const a = document.createElement('a');
      a.href = job.downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const selectedFormat = exportFormats.find(f => f.id === config.format);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Export Manager
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Export your time tracking data in various formats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Export Format
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    onClick={() => updateConfig({ format: format.id })}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      config.format === format.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        config.format === format.id
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {format.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {format.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Time Range
            </h3>
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
                      start: subDays(new Date(), preset.days),
                      end: new Date()
                    }
                  })}
                  className={`p-2 text-sm rounded-md border transition-colors ${
                    config.timeRange.preset === preset.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fields Selection */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Include Fields
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableFields.map((field) => (
                <label key={field.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeFields.includes(field.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateConfig({
                          includeFields: [...config.includeFields, field.id]
                        });
                      } else if (!field.required) {
                        updateConfig({
                          includeFields: config.includeFields.filter(f => f !== field.id)
                        });
                      }
                    }}
                    disabled={field.required}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          {selectedFormat?.supportsCharts && (
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Options
              </h3>
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
                    checked={config.includeStatistics}
                    onChange={(e) => updateConfig({ includeStatistics: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Include Summary Statistics
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Export Jobs */}
        <div className="space-y-6">
          {/* Export Button */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Ready to Export
            </h3>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full btn btn-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Start Export'}
            </button>
          </div>

          {/* Export History */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Export History
            </h3>
            {jobs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No exports yet
              </p>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {job.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(job.createdAt, 'MMM dd, HH:mm')}
                      </p>
                      {job.status === 'processing' && (
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-2">
                          <div
                            className="bg-primary-500 h-1 rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      {job.status === 'completed' && (
                        <button
                          onClick={() => downloadJob(job)}
                          className="text-green-600 hover:text-green-500"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {job.status === 'failed' && (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      {job.status === 'processing' && (
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;