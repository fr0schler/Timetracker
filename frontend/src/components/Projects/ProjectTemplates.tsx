import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useProjectTemplateStore } from '../../store/projectTemplateStore';
import { useToastStore } from '../../store/toastStore';
import { ProjectTemplate } from '../../types/projectTemplate';
import ProjectTemplateModal from './ProjectTemplateModal';

const ProjectTemplates: React.FC = () => {
  const { t } = useTranslation();
  const { templates, deleteTemplate, toggleFavorite } = useProjectTemplateStore();
  const { addToast } = useToastStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'favorites'>('all');

  const filteredTemplates = templates.filter(template => {
    switch (filter) {
      case 'public':
        return template.isPublic;
      case 'private':
        return !template.isPublic;
      case 'favorites':
        return template.isFavorite;
      default:
        return true;
    }
  });

  const handleEdit = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleDelete = async (templateId: string) => {
    if (window.confirm(t('projectTemplates.confirmDelete'))) {
      try {
        await deleteTemplate(templateId);
        addToast(
          'success',
          t('success.deleted'),
          t('projectTemplates.templateDeleted')
        );
      } catch (error) {
        console.error('Failed to delete template:', error);
        addToast(
          'error',
          t('errors.generic'),
          t('projectTemplates.deleteFailed')
        );
      }
    }
  };

  const handleToggleFavorite = async (templateId: string) => {
    try {
      await toggleFavorite(templateId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Filter Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 py-4">
            {[
              { key: 'all', label: t('projectTemplates.filters.all') },
              { key: 'public', label: t('projectTemplates.filters.public') },
              { key: 'private', label: t('projectTemplates.filters.private') },
              { key: 'favorites', label: t('projectTemplates.filters.favorites') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Templates Grid */}
        <div className="p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('projectTemplates.noTemplatesInFilter')}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('projectTemplates.tryDifferentFilter')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: template.color }}
                      />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {template.isPublic ? (
                        <GlobeAltIcon className="h-4 w-4 text-green-500" title={t('projectTemplates.public')} />
                      ) : (
                        <LockClosedIcon className="h-4 w-4 text-gray-400" title={t('projectTemplates.private')} />
                      )}
                      <button
                        onClick={() => handleToggleFavorite(template.id)}
                        className="text-gray-400 hover:text-yellow-500"
                      >
                        {template.isFavorite ? (
                          <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Category & Tags */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      {template.category}
                    </span>
                    {template.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>{t('projectTemplates.tasks', { count: template.taskCount })}</span>
                      <span>{t('projectTemplates.usedCount', { count: template.usageCount })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('projectTemplates.createdBy')} {template.createdBy}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title={t('common.view')}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title={t('common.edit')}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showModal && (
        <ProjectTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </>
  );
};

export default ProjectTemplates;