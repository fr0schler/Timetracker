import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, DocumentTextIcon, FolderIcon } from '@heroicons/react/24/outline';
import ProjectTemplates from '../components/Projects/ProjectTemplates';
import TemplateSelector from '../components/Projects/TemplateSelector';
import { useProjectTemplateStore } from '../store/projectTemplateStore';
import { useToastStore } from '../store/toastStore';

const ProjectTemplatesPage: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const { templates, loadTemplates, createFromTemplate } = useProjectTemplateStore();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateFromTemplate = async (templateId: string, projectData: any) => {
    try {
      await createFromTemplate(templateId, projectData);
      setShowTemplateSelector(false);
      addToast(
        'success',
        t('projectTemplates.success'),
        t('projectTemplates.projectCreated')
      );
    } catch (error) {
      console.error('Failed to create project from template:', error);
      addToast(
        'error',
        t('projectTemplates.error'),
        t('projectTemplates.createFailed')
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('projectTemplates.title')}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('projectTemplates.subtitle')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <FolderIcon className="h-4 w-4" />
              <span>{t('projectTemplates.createFromTemplate')}</span>
            </button>
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>{t('projectTemplates.createTemplate')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Templates Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t('projectTemplates.overview')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('projectTemplates.totalTemplates')}
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {templates.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('projectTemplates.publicTemplates')}
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {templates.filter(t => t.isPublic).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('projectTemplates.myTemplates')}
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {templates.filter(t => !t.isPublic).length}
                </span>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t('projectTemplates.popularCategories')}
            </h3>
            <div className="space-y-3">
              {[
                { name: t('projectTemplates.categories.webDevelopment'), count: 5, color: 'bg-blue-500' },
                { name: t('projectTemplates.categories.mobileApp'), count: 3, color: 'bg-green-500' },
                { name: t('projectTemplates.categories.marketing'), count: 4, color: 'bg-purple-500' },
                { name: t('projectTemplates.categories.research'), count: 2, color: 'bg-orange-500' },
              ].map((category) => (
                <div key={category.name} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {category.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="lg:col-span-2">
          <ProjectTemplates />
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          onClose={() => setShowTemplateSelector(false)}
          onSelect={handleCreateFromTemplate}
        />
      )}

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('projectTemplates.noTemplates')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('projectTemplates.noTemplatesDesc')}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="btn btn-primary"
            >
              {t('projectTemplates.createFirstTemplate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTemplatesPage;