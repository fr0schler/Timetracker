import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Play, ExternalLink } from 'lucide-react';
import { TimeEntry, Project } from '../../types';
import { formatDuration, getTimeAgo } from '../../utils/timeUtils';
import { Link } from 'react-router-dom';

interface RecentActivityWidgetProps {
  timeEntries: TimeEntry[];
  projects: Project[];
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  timeEntries,
  projects
}) => {
  const { t } = useTranslation();

  const getProjectInfo = (projectId: string | number) => {
    return projects.find(p => p.id === projectId) || {
      name: 'Unknown Project',
      color: '#6B7280'
    };
  };

  if (timeEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('dashboard.activity.noRecentActivity')}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          {t('dashboard.activity.startTrackingPrompt')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeEntries.map((entry) => {
        const project = getProjectInfo(entry.project_id);

        return (
          <div
            key={entry.id}
            className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            {/* Project Color & Status */}
            <div className="flex-shrink-0 relative">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {entry.is_running && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {project.name}
                </p>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  {entry.is_running ? (
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <Play className="w-3 h-3" />
                      <span>{t('dashboard.activity.running')}</span>
                    </div>
                  ) : (
                    <span>{formatDuration(entry.duration_seconds)}</span>
                  )}
                </div>
              </div>

              {entry.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {entry.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {getTimeAgo(entry.start_time)}
                </span>

                {entry.task_id && (
                  <Link
                    to={`/tasks/${entry.task_id}`}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-500 flex items-center space-x-1"
                  >
                    <span>{t('dashboard.activity.viewTask')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* View All Link */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/time-entries"
          className="flex items-center justify-center w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors"
        >
          {t('dashboard.activity.viewAllEntries')}
          <ExternalLink className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default RecentActivityWidget;