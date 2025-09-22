import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTextIcon, ArrowDownTrayIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import ReportGenerator from '../components/Reports/ReportGenerator';
import { reportService, ReportType } from '../services/reportService';
import { useToastStore } from '../store/toastStore';

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [selectedReport, setSelectedReport] = useState<ReportType>('time-tracking');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    {
      id: 'time-tracking' as ReportType,
      name: t('reports.timeTrackingReport'),
      description: t('reports.timeTrackingReportDesc'),
      icon: ClockIcon,
    },
    {
      id: 'project-summary' as ReportType,
      name: t('reports.projectSummaryReport'),
      description: t('reports.projectSummaryReportDesc'),
      icon: DocumentTextIcon,
    },
    {
      id: 'user-activity' as ReportType,
      name: t('reports.userActivityReport'),
      description: t('reports.userActivityReportDesc'),
      icon: CalendarIcon,
    },
  ];

  const handleGenerateReport = async (filters: any, format: string) => {
    try {
      setIsGenerating(true);
      const result = await reportService.generateReport(selectedReport, filters, format);

      if (result.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast(
          'success',
          t('reports.success'),
          t('reports.reportGenerated')
        );
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      addToast(
        'error',
        t('reports.error'),
        t('reports.generationFailed')
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('reports.title')}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('reports.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Type Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t('reports.selectReportType')}
            </h3>
            <div className="space-y-3">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedReport === report.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-6 w-6 mt-1 ${
                        selectedReport === report.id
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className={`font-medium ${
                          selectedReport === report.id
                            ? 'text-primary-900 dark:text-primary-100'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {report.name}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          selectedReport === report.id
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Report Generator */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {t('reports.configureReport')}
              </h3>
              {isGenerating && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>{t('reports.generating')}</span>
                </div>
              )}
            </div>

            <ReportGenerator
              reportType={selectedReport}
              onGenerate={handleGenerateReport}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('reports.recentReports')}
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <ArrowDownTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('reports.noReports')}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('reports.noReportsDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;