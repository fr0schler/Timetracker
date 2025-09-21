import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Save,
  Calendar,
  Clock,
  Flag,
  Tag,
  FileText,
  AlertCircle,
  MessageSquare,
  History,
  Paperclip,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Task, CreateTask, TaskAttachment } from '../../types';
import { useToastStore } from '../../store/toastStore';
import RichTextEditor from './RichTextEditor';
import AttachmentUpload from './AttachmentUpload';
import TaskComments from './TaskComments';
import TaskActivityLog from './TaskActivityLog';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (taskId: number, updates: Partial<CreateTask>, attachments: TaskAttachment[]) => Promise<void>;
  onDelete?: (taskId: number) => Promise<void>;
  onAddComment?: (taskId: number, comment: string) => Promise<void>;
}

type Priority = 'low' | 'normal' | 'high' | 'urgent';

const priorityColors = {
  low: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
  normal: 'text-blue-700 bg-blue-100 dark:bg-blue-900',
  high: 'text-orange-700 bg-orange-100 dark:bg-orange-900',
  urgent: 'text-red-700 bg-red-100 dark:bg-red-900'
};

const statusColors = {
  todo: 'text-gray-700 bg-gray-100 dark:bg-gray-700',
  in_progress: 'text-blue-700 bg-blue-100 dark:bg-blue-900',
  done: 'text-green-700 bg-green-100 dark:bg-green-900',
  cancelled: 'text-red-700 bg-red-100 dark:bg-red-900'
};

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onSave,
  onDelete,
  onAddComment
}: TaskDetailModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateTask>>({});
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimated_hours: task.estimated_hours,
        due_date: task.due_date,
        assigned_to_id: task.assigned_to_id,
        tags: task.tags || []
      });
      setAttachments(task.attachments || []);
    }
  }, [task]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = t('tasks.validation.titleRequired');
    }

    if (formData.title && formData.title.length > 200) {
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

    if (!task || !validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(task.id, formData, attachments);
      addToast('success', t('success.updated'), 'Task updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Task update failed:', error);
      addToast('error', t('errors.generic'), t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;

    if (window.confirm(t('tasks.deleteConfirmation'))) {
      try {
        setIsLoading(true);
        await onDelete(task.id);
        addToast('success', t('success.deleted'), 'Task deleted successfully');
        onClose();
      } catch (error) {
        console.error('Task deletion failed:', error);
        addToast('error', t('errors.generic'), t('errors.serverError'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setErrors({});
    setNewTag('');
    setActiveTab('details');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? t('tasks.editTask') : 'Task Details'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created {formatDateTime(task.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary flex items-center space-x-2"
                  disabled={isLoading}
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{t('common.edit')}</span>
                </button>
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="btn bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{t('common.delete')}</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comments'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Comments ({task.comments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <History className="h-4 w-4 inline mr-2" />
              Activity
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tasks.title')} *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`input w-full ${errors.title ? 'border-red-500' : ''}`}
                    placeholder={t('tasks.titlePlaceholder')}
                    disabled={isLoading}
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {task.title}
                  </h3>
                )}
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Priority Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.status')}
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                    {t(`tasks.status.${task.status}`)}
                  </span>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Flag className="h-4 w-4 inline mr-1" />
                    {t('tasks.priority')}
                  </label>
                  {isEditing ? (
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
                  ) : (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                      {t(`tasks.priority.${task.priority}`)}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tasks.description')}
                </label>
                {isEditing ? (
                  <RichTextEditor
                    value={formData.description || ''}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder={t('tasks.descriptionPlaceholder')}
                    disabled={isLoading}
                  />
                ) : (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: task.description || 'No description provided.' }}
                  />
                )}
              </div>

              {/* Due Date and Estimated Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {t('tasks.dueDate')}
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.due_date || ''}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value || undefined })}
                      className={`input w-full ${errors.due_date ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.due_date ? formatDate(task.due_date) : 'No due date'}
                    </p>
                  )}
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.due_date}
                    </p>
                  )}
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {t('tasks.estimatedHours')}
                  </label>
                  {isEditing ? (
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
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.estimated_hours ? `${task.estimated_hours} hours` : 'No estimate'}
                    </p>
                  )}
                  {errors.estimated_hours && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.estimated_hours}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="h-4 w-4 inline mr-1" />
                  {t('tasks.tags')}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(isEditing ? formData.tags : task.tags)?.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                    >
                      {tag}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
                )}
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Paperclip className="h-4 w-4 inline mr-1" />
                  {t('tasks.attachments.title')}
                </label>
                <AttachmentUpload
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  disabled={!isEditing || isLoading}
                />
              </div>

              {/* Save/Cancel buttons for editing */}
              {isEditing && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="btn btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.title?.trim()}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isLoading ? t('common.saving') : t('common.save')}</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'comments' && (
            <TaskComments
              taskId={task.id}
              comments={task.comments || []}
              onAddComment={onAddComment}
            />
          )}

          {activeTab === 'activity' && (
            <TaskActivityLog taskId={task.id} />
          )}
        </div>
      </div>
    </div>
  );
}