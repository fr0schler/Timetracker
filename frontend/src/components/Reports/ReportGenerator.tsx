import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { ReportType } from '../../services/reportService';
import ExportOptions from './ExportOptions';

interface ReportGeneratorProps {
  reportType: ReportType;
  onGenerate: (filters: ReportFilters, format: string) => void;
  isGenerating: boolean;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  projectIds?: string[];
  userIds?: string[];
  includeArchived?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'project' | 'user';
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  onGenerate,
  isGenerating,
}) => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  const { user } = useAuthStore();

  // Default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    projectIds: [],
    userIds: [],
    includeArchived: false,
    groupBy: 'day',
  });

  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleProjectToggle = (projectId: string) => {
    const currentIds = filters.projectIds || [];
    const newIds = currentIds.includes(projectId)
      ? currentIds.filter(id => id !== projectId)
      : [...currentIds, projectId];

    handleFilterChange('projectIds', newIds);
  };

  const handleGenerate = () => {
    onGenerate(filters, selectedFormat);
  };

  const isValidDateRange = filters.startDate && filters.endDate &&
    new Date(filters.startDate) <= new Date(filters.endDate);

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <CalendarIcon className="inline h-4 w-4 mr-1" />
          {t('reports.dateRange')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('reports.startDate')}
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('reports.endDate')}
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>
        {!isValidDateRange && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {t('reports.invalidDateRange')}
          </p>
        )}
      </div>

      {/* Project Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FunnelIcon className="inline h-4 w-4 mr-1" />
          {t('reports.projectFilter')}
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto">
          <div className="p-2 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!filters.projectIds?.length}
                onChange={() => handleFilterChange('projectIds', [])}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('reports.allProjects')}
              </span>
            </label>
            {projects.map((project) => (
              <label key={project.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.projectIds?.includes(project.id.toString()) || false}
                  onChange={() => handleProjectToggle(project.id.toString())}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="ml-2 flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {project.name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Group By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('reports.groupBy')}
        </label>
        <select
          value={filters.groupBy}
          onChange={(e) => handleFilterChange('groupBy', e.target.value)}
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="day">{t('reports.groupBy.day')}</option>
          <option value="week">{t('reports.groupBy.week')}</option>
          <option value="month">{t('reports.groupBy.month')}</option>
          <option value="project">{t('reports.groupBy.project')}</option>
          {user?.is_organization_owner && (
            <option value="user">{t('reports.groupBy.user')}</option>
          )}
        </select>
      </div>

      {/* Include Archived */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.includeArchived || false}
            onChange={(e) => handleFilterChange('includeArchived', e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {t('reports.includeArchived')}
          </span>
        </label>
      </div>

      {/* Export Options */}
      <ExportOptions
        selectedFormat={selectedFormat}
        onFormatChange={setSelectedFormat}
      />

      {/* Generate Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleGenerate}
          disabled={!isValidDateRange || isGenerating}
          className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('reports.generating')}</span>
            </div>
          ) : (
            t('reports.generateReport')
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportGenerator;