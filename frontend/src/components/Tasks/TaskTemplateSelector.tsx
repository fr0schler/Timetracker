import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Clock,
  Flag,
  Tag,
  Search,
  Edit3,
  Trash2,
  Copy,
  X
} from 'lucide-react';
import { TaskTemplate, CreateTask } from '../../types';
import { useToastStore } from '../../store/toastStore';

interface TaskTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (taskData: CreateTask) => void;
  onEditTemplate?: (template: TaskTemplate) => void;
  onDeleteTemplate?: (templateId: number) => void;
  templates: TaskTemplate[];
}

const priorityColors = {
  low: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
  normal: 'text-blue-700 bg-blue-100 dark:bg-blue-900',
  high: 'text-orange-700 bg-orange-100 dark:bg-orange-900',
  urgent: 'text-red-700 bg-red-100 dark:bg-red-900'
};

export default function TaskTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  templates
}: TaskTemplateSelectorProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<TaskTemplate[]>([]);

  useEffect(() => {
    const filtered = templates.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredTemplates(filtered);
  }, [templates, searchQuery]);

  const handleSelectTemplate = (template: TaskTemplate) => {
    const taskData: CreateTask = {
      title: template.title_template,
      description: template.description_template,
      priority: template.priority,
      estimated_hours: template.estimated_hours,
      tags: template.tags || []
    };

    onSelectTemplate(taskData);
    addToast('success', 'Template Applied', `Template "${template.name}" has been applied to the new task`);
    onClose();
  };

  const handleDeleteTemplate = async (template: TaskTemplate) => {
    if (!onDeleteTemplate) return;

    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      try {
        await onDeleteTemplate(template.id);
        addToast('success', 'Template Deleted', `Template "${template.name}" has been deleted`);
      } catch (error) {
        console.error('Failed to delete template:', error);
        addToast('error', 'Delete Error', 'Failed to delete template');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Task Template
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <div>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No templates found matching "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div>
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No task templates available
                  </p>
                  <p className="text-sm text-gray-400">
                    Create your first template to get started
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-3">
                      {onEditTemplate && (
                        <button
                          onClick={() => onEditTemplate(template)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          title="Edit template"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      {onDeleteTemplate && (
                        <button
                          onClick={() => handleDeleteTemplate(template)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Template Preview */}
                  <div className="space-y-2 mb-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Task Title:
                      </label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                        {template.title_template}
                      </p>
                    </div>

                    {template.description_template && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Description Preview:
                        </label>
                        <div
                          className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border prose prose-sm max-w-none line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: template.description_template }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Template Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-4">
                      {/* Priority */}
                      <div className="flex items-center space-x-1">
                        <Flag className="h-3 w-3" />
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priorityColors[template.priority]}`}>
                          {t(`tasks.priority.${template.priority}`)}
                        </span>
                      </div>

                      {/* Estimated Hours */}
                      {template.estimated_hours && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{template.estimated_hours}h</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p>Created {formatDate(template.created_at)}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                        >
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Use Template Button */}
                  <button
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full btn btn-primary flex items-center justify-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Use This Template</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </p>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}