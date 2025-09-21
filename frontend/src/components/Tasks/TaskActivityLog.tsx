import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  User,
  Clock,
  Edit3,
  Flag,
  Calendar,
  CheckCircle2,
  Paperclip,
  Tag,
  MessageSquare,
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import { TaskActivity } from '../../types';

interface TaskActivityLogProps {
  taskId: number;
}

// Mock activity data generator
const generateMockActivities = (taskId: number): TaskActivity[] => {
  const activities: TaskActivity[] = [
    {
      id: 1,
      task_id: taskId,
      user_id: 1,
      action: 'created',
      field: null,
      old_value: null,
      new_value: null,
      description: 'Task created',
      created_at: '2024-01-10T10:00:00Z'
    },
    {
      id: 2,
      task_id: taskId,
      user_id: 1,
      action: 'updated',
      field: 'status',
      old_value: 'todo',
      new_value: 'in_progress',
      description: 'Status changed from To Do to In Progress',
      created_at: '2024-01-11T14:30:00Z'
    },
    {
      id: 3,
      task_id: taskId,
      user_id: 1,
      action: 'updated',
      field: 'priority',
      old_value: 'normal',
      new_value: 'high',
      description: 'Priority changed from Normal to High',
      created_at: '2024-01-11T15:45:00Z'
    },
    {
      id: 4,
      task_id: taskId,
      user_id: 1,
      action: 'updated',
      field: 'due_date',
      old_value: null,
      new_value: '2024-01-15',
      description: 'Due date set to January 15, 2024',
      created_at: '2024-01-11T16:20:00Z'
    },
    {
      id: 5,
      task_id: taskId,
      user_id: 1,
      action: 'added',
      field: 'comment',
      old_value: null,
      new_value: 'Initial implementation completed',
      description: 'Added comment',
      created_at: '2024-01-12T09:15:00Z'
    },
    {
      id: 6,
      task_id: taskId,
      user_id: 1,
      action: 'added',
      field: 'attachment',
      old_value: null,
      new_value: 'requirements.pdf',
      description: 'Added attachment: requirements.pdf',
      created_at: '2024-01-12T11:30:00Z'
    },
    {
      id: 7,
      task_id: taskId,
      user_id: 1,
      action: 'updated',
      field: 'tags',
      old_value: 'backend',
      new_value: 'backend,security',
      description: 'Added tag: security',
      created_at: '2024-01-12T13:45:00Z'
    }
  ];

  return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export default function TaskActivityLog({ taskId }: TaskActivityLogProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        const mockActivities = generateMockActivities(taskId);
        setActivities(mockActivities);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [taskId]);

  const getActivityIcon = (action: string, field: string | null) => {
    switch (action) {
      case 'created':
        return Plus;
      case 'updated':
        switch (field) {
          case 'status':
            return CheckCircle2;
          case 'priority':
            return Flag;
          case 'due_date':
            return Calendar;
          case 'estimated_hours':
            return Clock;
          case 'tags':
            return Tag;
          default:
            return Edit3;
        }
      case 'added':
        switch (field) {
          case 'comment':
            return MessageSquare;
          case 'attachment':
            return Paperclip;
          default:
            return Plus;
        }
      case 'removed':
      case 'deleted':
        return Trash2;
      default:
        return Activity;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-500 bg-green-100 dark:bg-green-900';
      case 'updated':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900';
      case 'added':
        return 'text-green-500 bg-green-100 dark:bg-green-900';
      case 'removed':
      case 'deleted':
        return 'text-red-500 bg-red-100 dark:bg-red-900';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatFieldValue = (field: string | null, value: string | null) => {
    if (!value) return 'None';

    switch (field) {
      case 'status':
        return value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      case 'priority':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'due_date':
        return new Date(value).toLocaleDateString();
      case 'estimated_hours':
        return `${value} hours`;
      case 'tags':
        return value.split(',').map(tag => `#${tag}`).join(', ');
      default:
        return value;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Activity className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Log
          </h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500 dark:text-gray-400">
            {t('common.loading')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Activity Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Activity Log ({activities.length})
        </h3>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No activity recorded yet.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.action, activity.field);
              const iconColor = getActivityColor(activity.action);

              return (
                <div key={activity.id} className="relative flex items-start space-x-4">
                  {/* Activity Icon */}
                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${iconColor} flex items-center justify-center`}>
                    <ActivityIcon className="h-5 w-5" />
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0 pb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                User #{activity.user_id}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(activity.created_at)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {activity.description}
                          </p>

                          {/* Field change details */}
                          {activity.action === 'updated' && activity.field && (
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                                {formatFieldValue(activity.field, activity.old_value || null)}
                              </span>
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                {formatFieldValue(activity.field, activity.new_value || null)}
                              </span>
                            </div>
                          )}

                          {/* Added/removed content */}
                          {(activity.action === 'added' || activity.action === 'removed') && activity.new_value && (
                            <div className="text-xs">
                              <span className={`px-2 py-1 rounded ${
                                activity.action === 'added'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {formatFieldValue(activity.field, activity.new_value || null)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}