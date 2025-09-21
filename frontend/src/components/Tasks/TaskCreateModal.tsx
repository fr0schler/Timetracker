import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Save,
  Calendar,
  Clock,
  Flag,
  User,
  Tag,
  FileText,
  AlertCircle
} from 'lucide-react';
import { CreateTask, TaskTemplate, TaskAttachment, Project } from '../../types';
import { useToastStore } from '../../store/toastStore';
import RichTextEditor from './RichTextEditor';
import AttachmentUpload from './AttachmentUpload';
import TaskTemplateSelector from './TaskTemplateSelector';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: CreateTask, attachments: TaskAttachment[]) => Promise<void>;
  project?: Project;
  parentTaskId?: number;
  template?: TaskTemplate;
}

type Priority = 'low' | 'normal' | 'high' | 'urgent';

const priorityColors = {
  low: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
  normal: 'text-blue-700 bg-blue-100 dark:bg-blue-900',
  high: 'text-orange-700 bg-orange-100 dark:bg-orange-900',
  urgent: 'text-red-700 bg-red-100 dark:bg-red-900'
};

export default function TaskCreateModal({
  isOpen,
  onClose,
  onSave,
  project,
  parentTaskId,
  template
}: TaskCreateModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState<CreateTask>({
    title: '',
    description: '',
    priority: 'normal',
    estimated_hours: undefined,
    due_date: undefined,
    assigned_to_id: undefined,
    tags: []
  });

  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title_template,
        description: template.description_template || '',
        priority: template.priority,
        estimated_hours: template.estimated_hours,
        tags: template.tags || [],
        due_date: undefined,
        assigned_to_id: undefined
      });
    }
  }, [template]);

  // Set parent task ID if provided
  useEffect(() => {
    if (parentTaskId) {
      setFormData(prev => ({ ...prev, parent_id: parentTaskId }));
    }
  }, [parentTaskId]);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // TODO: Replace with actual API call
        const mockTemplates: TaskTemplate[] = [
          {
            id: 1,
            name: 'Bug Fix Template',
            description: 'Standard template for bug fixes',
            title_template: 'Fix: [Bug Description]',
            description_template: '## Bug Description\n[Describe the bug]\n\n## Solution\n[Describe the fix]',
            priority: 'high',
            estimated_hours: 4,
            tags: ['bug', 'fix'],
            organization_id: 1,
            created_by_id: 1,
            created_at: '2024-01-01T10:00:00Z'
          },
          {
            id: 2,
            name: 'Feature Development',
            description: 'Complete feature development workflow',
            title_template: 'Feature: [Feature Name]',
            description_template: '## Feature Overview\n[Brief description]\n\n## Acceptance Criteria\n- [ ] Criterion 1\n- [ ] Criterion 2',
            priority: 'normal',
            estimated_hours: 16,
            tags: ['feature', 'development'],
            organization_id: 1,
            created_by_id: 1,
            created_at: '2024-01-02T09:00:00Z'
          }
        ];
        setTemplates(mockTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('tasks.validation.titleRequired');
    }

    if (formData.title.length > 200) {
      newErrors.title = t('tasks.validation.titleTooLong');
    }

    if (formData.estimated_hours && formData.estimated_hours <= 0) {
      newErrors.estimated_hours = t('tasks.validation.invalidHours');
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.due_date = t('tasks.validation.dueDatePast');
      }
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
      await onSave(formData, attachments);
      addToast('success', t('tasks.createSuccess'), t('tasks.createSuccessMessage'));
      handleClose();
    } catch (error) {
      console.error('Task creation failed:', error);
      addToast('error', t('tasks.createError'), t('tasks.createErrorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'normal',
      estimated_hours: undefined,
      due_date: undefined,
      assigned_to_id: undefined,
      tags: []
    });
    setAttachments([]);
    setErrors({});
    setNewTag('');
    onClose();
  };

  const handleTemplateSelect = (taskData: CreateTask) => {
    setFormData({
      ...formData,
      ...taskData
    });
    setIsTemplateSelectorOpen(false);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {parentTaskId ? t('tasks.createSubtask') : t('tasks.createTask')}
            </h2>
            {project && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                {project.name}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTemplateSelectorOpen(true)}
              className="btn btn-secondary flex items-center space-x-2"
              disabled={isLoading}
            >
              <FileText className="h-4 w-4" />
              <span>Use Template</span>
            </button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('tasks.title')} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`input w-full ${errors.title ? 'border-red-500' : ''}`}
                placeholder={t('tasks.titlePlaceholder')}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('tasks.description')}
              </label>
              <RichTextEditor
                value={formData.description || ''}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder={t('tasks.descriptionPlaceholder')}
                disabled={isLoading}
              />
            </div>

            {/* Priority and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Flag className="h-4 w-4 inline mr-1" />
                  {t('tasks.priority')}
                </label>
                <select
                  value={formData.priority}
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
                    {t(`tasks.priority.${formData.priority}`)}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {t('tasks.dueDate')}
                </label>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value || undefined })}
                  className={`input w-full ${errors.due_date ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.due_date}
                  </p>
                )}
              </div>
            </div>

            {/* Estimated Hours and Assignee Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {t('tasks.estimatedHours')}
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

              {/* Assignee (TODO: Add team member selection) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  {t('tasks.assignee')}
                </label>
                <div className="input w-full bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                  {t('tasks.assigneeComingSoon')}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                {t('tasks.tags')}
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
                  placeholder={t('tasks.addTag')}
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
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('tasks.attachments.title')}
              </label>
              <AttachmentUpload
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                disabled={isLoading}
              />
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
              disabled={isLoading || !formData.title.trim()}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? t('common.saving') : t('tasks.createTask')}</span>
            </button>
          </div>
        </form>

        {/* Template Selector Modal */}
        <TaskTemplateSelector
          isOpen={isTemplateSelectorOpen}
          onClose={() => setIsTemplateSelectorOpen(false)}
          onSelectTemplate={handleTemplateSelect}
          templates={templates}
        />
      </div>
    </div>
  );
}