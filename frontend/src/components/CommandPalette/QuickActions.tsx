import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Play,
  Square,
  Users,
  FileText,
  BarChart3,
  Download,
  Key,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useTimeEntryStore } from '../../store/timeEntryStore';
import { useToastStore } from '../../store/toastStore';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'timer' | 'create' | 'admin';
  shortcut?: string;
  requiresOwner?: boolean;
}

interface QuickActionsProps {
  onAction: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { activeEntry, startTimer, stopTimer } = useTimeEntryStore();
  const { addToast } = useToastStore();

  const handleStartTimer = () => {
    if (projects.length === 0) {
      addToast('error', t('errors.noProjects'), t('timer.noProjectsMessage'));
      return;
    }

    const currentProject = projects[0]; // Use first project or implement project selection
    startTimer(currentProject.id);
    addToast('success', t('timer.started'), `${t('timer.startedFor')} ${currentProject.name}`);
  };

  const handleStopTimer = () => {
    if (activeEntry) {
      stopTimer(activeEntry.id);
      addToast('success', t('timer.stopped'), t('timer.stoppedMessage'));
    }
  };

  const quickActions: QuickAction[] = [
    // Timer Actions
    {
      id: 'start-timer',
      label: t('quickActions.startTimer'),
      description: t('quickActions.startTimerDesc'),
      icon: <Play className="w-4 h-4" />,
      action: handleStartTimer,
      category: 'timer',
      shortcut: 'S',
    },
    {
      id: 'stop-timer',
      label: t('quickActions.stopTimer'),
      description: t('quickActions.stopTimerDesc'),
      icon: <Square className="w-4 h-4" />,
      action: handleStopTimer,
      category: 'timer',
      shortcut: 'T',
    },

    // Create Actions
    {
      id: 'new-project',
      label: t('quickActions.newProject'),
      description: t('quickActions.newProjectDesc'),
      icon: <Plus className="w-4 h-4" />,
      action: () => navigate('/projects'),
      category: 'create',
      shortcut: 'P',
    },
    {
      id: 'new-task',
      label: t('quickActions.newTask'),
      description: t('quickActions.newTaskDesc'),
      icon: <FileText className="w-4 h-4" />,
      action: () => navigate('/tasks'),
      category: 'create',
      shortcut: 'N',
    },

    // Navigation Actions
    {
      id: 'analytics',
      label: t('quickActions.viewAnalytics'),
      description: t('quickActions.viewAnalyticsDesc'),
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => navigate('/analytics'),
      category: 'navigation',
      shortcut: 'A',
    },
    {
      id: 'reports',
      label: t('quickActions.generateReport'),
      description: t('quickActions.generateReportDesc'),
      icon: <Download className="w-4 h-4" />,
      action: () => navigate('/reports'),
      category: 'navigation',
      shortcut: 'R',
    },
    {
      id: 'team',
      label: t('quickActions.manageTeam'),
      description: t('quickActions.manageTeamDesc'),
      icon: <Users className="w-4 h-4" />,
      action: () => navigate('/team'),
      category: 'admin',
      shortcut: 'M',
      requiresOwner: true,
    },

    // Admin Actions
    {
      id: 'api-keys',
      label: t('quickActions.manageAPIKeys'),
      description: t('quickActions.manageAPIKeysDesc'),
      icon: <Key className="w-4 h-4" />,
      action: () => navigate('/api-keys'),
      category: 'admin',
      shortcut: 'K',
      requiresOwner: true,
    },
    {
      id: 'settings',
      label: t('quickActions.openSettings'),
      description: t('quickActions.openSettingsDesc'),
      icon: <Settings className="w-4 h-4" />,
      action: () => navigate('/settings'),
      category: 'navigation',
      shortcut: 'E',
    },
  ];

  // Filter actions based on current state
  const availableActions = quickActions.filter(action => {
    // Hide timer actions based on current state
    if (action.id === 'start-timer' && activeEntry) return false;
    if (action.id === 'stop-timer' && !activeEntry) return false;

    // TODO: Filter based on user permissions
    // if (action.requiresOwner && !user?.is_organization_owner) return false;

    return true;
  });

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'timer': return t('quickActions.categories.timer');
      case 'create': return t('quickActions.categories.create');
      case 'navigation': return t('quickActions.categories.navigation');
      case 'admin': return t('quickActions.categories.admin');
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'timer': return 'text-green-600 dark:text-green-400';
      case 'create': return 'text-blue-600 dark:text-blue-400';
      case 'navigation': return 'text-purple-600 dark:text-purple-400';
      case 'admin': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Group actions by category
  const groupedActions = availableActions.reduce((groups, action) => {
    if (!groups[action.category]) {
      groups[action.category] = [];
    }
    groups[action.category].push(action);
    return groups;
  }, {} as Record<string, QuickAction[]>);

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('quickActions.title')}
      </h3>

      <div className="space-y-4">
        {Object.entries(groupedActions).map(([category, actions]) => (
          <div key={category}>
            <h4 className={`text-xs font-medium uppercase tracking-wide mb-2 ${getCategoryColor(category)}`}>
              {getCategoryLabel(category)}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.action();
                    onAction();
                  }}
                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className={`mb-2 ${getCategoryColor(category)} group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100 text-center mb-1">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center line-clamp-2">
                    {action.description}
                  </div>
                  {action.shortcut && (
                    <div className="mt-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                      {action.shortcut}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('quickActions.tip')}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;