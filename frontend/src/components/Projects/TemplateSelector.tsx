import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useProjectTemplateStore } from '../../store/projectTemplateStore';
import { ProjectTemplate } from '../../types/projectTemplate';

interface TemplateSelectorProps {
  onClose: () => void;
  onSelect: (templateId: string, projectData: { name: string; description: string }) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onClose, onSelect }) => {
  const { t } = useTranslation();
  const { templates } = useProjectTemplateStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectName(template.name);
    setProjectDescription(template.description);
  };

  const handleCreate = () => {
    if (selectedTemplate && projectName.trim()) {
      onSelect(selectedTemplate.id, {
        name: projectName.trim(),
        description: projectDescription.trim(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('projectTemplates.selectTemplate')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div>
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('projectTemplates.searchTemplates')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className="w-4 h-4 rounded-full mt-1"
                        style={{ backgroundColor: template.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm ${
                          selectedTemplate?.id === template.id
                            ? 'text-primary-900 dark:text-primary-100'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {template.name}
                        </h4>
                        <p className={`text-xs mt-1 line-clamp-2 ${
                          selectedTemplate?.id === template.id
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {template.description}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{template.category}</span>
                          <span>{t('projectTemplates.tasks', { count: template.taskCount })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('projectTemplates.noTemplatesFound')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Configuration */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                {t('projectTemplates.projectDetails')}
              </h4>

              {selectedTemplate ? (
                <div className="space-y-4">
                  {/* Template Preview */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {selectedTemplate.name}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {selectedTemplate.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('projects.name')} *
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder={t('projects.namePlaceholder')}
                    />
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('projects.description')}
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder={t('projects.descriptionPlaceholder')}
                    />
                  </div>

                  {/* Template Info */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="mb-1">
                      {t('projectTemplates.willCreate', { count: selectedTemplate.taskCount })}
                    </p>
                    <p>
                      {t('projectTemplates.estimatedTime')}: {selectedTemplate.estimatedHours} {t('common.hours')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>{t('projectTemplates.selectTemplateFirst')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedTemplate || !projectName.trim()}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('projectTemplates.createProject')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;