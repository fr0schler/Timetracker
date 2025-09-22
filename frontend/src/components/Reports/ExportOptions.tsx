import React from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTextIcon, DocumentChartBarIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface ExportOptionsProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  selectedFormat,
  onFormatChange,
}) => {
  const { t } = useTranslation();

  const formats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: t('reports.formats.pdfDesc'),
      icon: DocumentTextIcon,
      color: 'text-red-500',
    },
    {
      id: 'excel',
      name: 'Excel',
      description: t('reports.formats.excelDesc'),
      icon: DocumentChartBarIcon,
      color: 'text-green-500',
    },
    {
      id: 'csv',
      name: 'CSV',
      description: t('reports.formats.csvDesc'),
      icon: TableCellsIcon,
      color: 'text-blue-500',
    },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('reports.exportFormat')}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {formats.map((format) => {
          const Icon = format.icon;
          return (
            <button
              key={format.id}
              onClick={() => onFormatChange(format.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedFormat === format.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className={`h-8 w-8 mb-2 ${format.color}`} />
                <h4 className={`font-medium text-sm ${
                  selectedFormat === format.id
                    ? 'text-primary-900 dark:text-primary-100'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {format.name}
                </h4>
                <p className={`text-xs mt-1 ${
                  selectedFormat === format.id
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {format.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Format-specific options */}
      {selectedFormat === 'pdf' && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('reports.pdfOptions')}
          </h5>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('reports.includeCharts')}
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('reports.includeSummary')}
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('reports.includeDetails')}
              </span>
            </label>
          </div>
        </div>
      )}

      {selectedFormat === 'excel' && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('reports.excelOptions')}
          </h5>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('reports.multipleSheets')}
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('reports.includeFormulas')}
              </span>
            </label>
          </div>
        </div>
      )}

      {selectedFormat === 'csv' && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('reports.csvOptions')}
          </h5>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('reports.delimiter')}
              </label>
              <select className="block w-full text-sm rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value=",">{t('reports.comma')}</option>
                <option value=";">{t('reports.semicolon')}</option>
                <option value="\t">{t('reports.tab')}</option>
              </select>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('reports.includeHeaders')}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;