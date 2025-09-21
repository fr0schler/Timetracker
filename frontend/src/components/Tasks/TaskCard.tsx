import { useTranslation } from 'react-i18next';
import {
  Clock,
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  MoreVertical,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowUp
} from 'lucide-react';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: (task: Task) => void;
}

const priorityConfig = {
  low: {
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-700',
    icon: Circle
  },
  normal: {
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900',
    icon: Circle
  },
  high: {
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900',
    icon: AlertCircle
  },
  urgent: {
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900',
    icon: ArrowUp
  }
};

const statusConfig = {
  todo: {
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-700',
    icon: Circle
  },
  in_progress: {
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900',
    icon: Clock
  },
  done: {
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900',
    icon: CheckCircle2
  },
  cancelled: {
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900',
    icon: Circle
  }
};

export default function TaskCard({ task, onClick, onEdit }: TaskCardProps) {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && task.status !== 'done';
  };

  const priorityInfo = priorityConfig[task.priority];
  const statusInfo = statusConfig[task.status];
  const PriorityIcon = priorityInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
          <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
            {task.title}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(task);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      {task.description && (
        <div
          className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: task.description }}
        />
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2">
        {/* Priority */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <PriorityIcon className={`h-3 w-3 ${priorityInfo.color}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t(`tasks.priority.${task.priority}`)}
            </span>
          </div>

          {/* Attachments & Comments count */}
          <div className="flex items-center space-x-2">
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center space-x-1 text-gray-400">
                <Paperclip className="h-3 w-3" />
                <span className="text-xs">{task.attachments.length}</span>
              </div>
            )}
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center space-x-1 text-gray-400">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs">{task.comments.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Due Date */}
        {task.due_date && (
          <div className="flex items-center space-x-1">
            <Calendar className={`h-3 w-3 ${isOverdue(task.due_date) ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {formatDate(task.due_date)}
              {isOverdue(task.due_date) && (
                <span className="ml-1 font-medium">
                  (Overdue)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Estimated Hours */}
        {task.estimated_hours && (
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {task.estimated_hours}h estimated
            </span>
          </div>
        )}

        {/* Assignee (placeholder for future team features) */}
        {task.assigned_to_id && (
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Assigned
            </span>
          </div>
        )}
      </div>

      {/* Subtasks indicator */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Subtasks</span>
            <span>
              {task.subtasks.filter(st => st.status === 'done').length} / {task.subtasks.length}
            </span>
          </div>
          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div
              className="bg-primary-500 h-1 rounded-full transition-all"
              style={{
                width: `${(task.subtasks.filter(st => st.status === 'done').length / task.subtasks.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}