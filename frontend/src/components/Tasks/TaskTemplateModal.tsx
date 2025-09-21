import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Save,
  Clock,
  Flag,
  Tag,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { TaskTemplate, CreateTaskTemplate } from '../../types';
import { useToastStore } from '../../store/toastStore';
import RichTextEditor from './RichTextEditor';

interface TaskTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: CreateTaskTemplate) => Promise<void>;
  template?: TaskTemplate;
  mode: 'create' | 'edit';
}

type Priority = 'low' | 'normal' | 'high' | 'urgent';

const priorityColors = {
  low: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
  normal: 'text-blue-700 bg-blue-100 dark:bg-blue-900',
  high: 'text-orange-700 bg-orange-100 dark:bg-orange-900',
  urgent: 'text-red-700 bg-red-100 dark:bg-red-900'
};

export default function TaskTemplateModal({
  isOpen,
  onClose,
  onSave,
  template,
  mode
}: TaskTemplateModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState<CreateTaskTemplate>({
    name: '',
    description: '',
    title_template: '',
    description_template: '',
    priority: 'normal',
    estimated_hours: undefined,
    tags: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  // Initialize form with template data when editing
  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData({
        name: template.name,
        description: template.description || '',
        title_template: template.title_template,
        description_template: template.description_template || '',
        priority: template.priority,
        estimated_hours: template.estimated_hours,
        tags: template.tags || []
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        title_template: '',
        description_template: '',
        priority: 'normal',
        estimated_hours: undefined,
        tags: []
      });
    }
  }, [template, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (formData.name.length > 100) {
      newErrors.name = 'Template name is too long (max 100 characters)';
    }

    if (!formData.title_template.trim()) {
      newErrors.title_template = 'Task title template is required';
    }

    if (formData.title_template.length > 200) {
      newErrors.title_template = 'Task title template is too long (max 200 characters)';
    }

    if (formData.estimated_hours && formData.estimated_hours <= 0) {
      newErrors.estimated_hours = t('tasks.validation.invalidHours');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      addToast('success', 'Template Saved', `Template "${formData.name}" has been ${mode === 'create' ? 'created' : 'updated'} successfully`);
      handleClose();
    } catch (error) {
      console.error('Template save failed:', error);
      addToast('error', 'Save Error', `Failed to ${mode} template`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      title_template: '',
      description_template: '',
      priority: 'normal',
      estimated_hours: undefined,
      tags: []
    });
    setErrors({});
    setNewTag('');
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.activeElement) {
      e.preventDefault();
      if (newTag.trim()) {
        addTag();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create Task Template' : 'Edit Task Template'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g., Bug Fix Template, Feature Development Template"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Template Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Describe when and how this template should be used..."
                disabled={isLoading}
              />
            </div>

            {/* Task Title Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Title Template *
              </label>
              <input
                type="text"
                value={formData.title_template}
                onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                className={`input w-full ${errors.title_template ? 'border-red-500' : ''}`}
                placeholder="e.g., Fix: [Bug Description], Feature: [Feature Name], Review: [PR Title]"
                disabled={isLoading}
              />
              {errors.title_template && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.title_template}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use [placeholders] that can be replaced when creating tasks from this template
              </p>
            </div>

            {/* Task Description Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Description Template
              </label>
              <RichTextEditor
                value={formData.description_template || ''}
                onChange={(value) => setFormData({ ...formData, description_template: value })}
                placeholder="## Acceptance Criteria&#10;- [ ] Criterion 1&#10;- [ ] Criterion 2&#10;&#10;## Implementation Notes&#10;[Implementation details]&#10;&#10;## Testing&#10;- [ ] Unit tests&#10;- [ ] Integration tests"
                disabled={isLoading}
                maxHeight="200px"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Rich text template for task descriptions. Use [placeholders] for dynamic content.
              </p>
            </div>

            {/* Priority and Estimated Hours Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Default Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Flag className="h-4 w-4 inline mr-1" />
                  Default Priority
                </label>
                <select
                  value={formData.priority || 'normal'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="input w-full"
                  disabled={isLoading}
                >
                  <option value="low">{t('tasks.priority.low')}</option>
                  <option value="normal">{t('tasks.priority.normal')}</option>
                  <option value="high">{t('tasks.priority.high')}</option>
                  <option value="urgent">{t('tasks.priority.urgent')}</option>
                </select>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[formData.priority || 'normal']}`}>
                    {t(`tasks.priority.${formData.priority || 'normal'}`)}
                  </span>
                </div>
              </div>

              {/* Default Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Default Estimated Hours
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  className={`input w-full ${errors.estimated_hours ? 'border-red-500' : ''}`}
                  placeholder="0.0"
                  disabled={isLoading}
                />
                {errors.estimated_hours && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.estimated_hours}
                  </p>
                )}
              </div>
            </div>

            {/* Default Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Default Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="input flex-1"
                  placeholder="Add default tag..."
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || isLoading}
                  className="btn btn-secondary"
                >
                  {t('common.add')}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tags that will be automatically applied to tasks created from this template
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.title_template.trim()}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? t('common.saving') : (mode === 'create' ? 'Create Template' : 'Update Template')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}