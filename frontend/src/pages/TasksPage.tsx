import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Filter,
  Search,
  Flag
} from 'lucide-react';
import { Task, Project, CreateTask, TaskAttachment } from '../types';
import { useToastStore } from '../store/toastStore';
import TaskCreateModal from '../components/Tasks/TaskCreateModal';
import TaskBoard from '../components/Tasks/TaskBoard';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';

export default function TasksPage() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Load initial data
  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Implement user authentication',
          description: 'Set up JWT authentication with refresh tokens',
          status: 'todo',
          priority: 'high',
          project_id: 1,
          estimated_hours: 8,
          due_date: '2024-01-15',
          created_by_id: 1,
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z',
          subtasks: [],
          tags: ['backend', 'security']
        },
        {
          id: 2,
          title: 'Design user dashboard',
          description: 'Create mockups and implement responsive dashboard',
          status: 'in_progress',
          priority: 'normal',
          project_id: 1,
          estimated_hours: 12,
          created_by_id: 1,
          created_at: '2024-01-08T09:00:00Z',
          updated_at: '2024-01-11T14:30:00Z',
          subtasks: [],
          tags: ['frontend', 'ui/ux']
        },
        {
          id: 3,
          title: 'Setup CI/CD pipeline',
          description: 'Configure automated deployment pipeline',
          status: 'done',
          priority: 'normal',
          project_id: 2,
          estimated_hours: 6,
          created_by_id: 1,
          created_at: '2024-01-05T08:00:00Z',
          updated_at: '2024-01-09T16:00:00Z',
          subtasks: [],
          tags: ['devops', 'automation']
        }
      ];
      setTasks(mockTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      addToast('error', t('errors.generic'), t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      // TODO: Replace with actual API call
      const mockProjects: Project[] = [
        {
          id: 1,
          name: 'TimeTracker SaaS',
          description: 'Main SaaS application development',
          hourly_rate: 75,
          color: '#3B82F6',
          is_billable: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Infrastructure Setup',
          description: 'DevOps and infrastructure configuration',
          hourly_rate: 85,
          color: '#10B981',
          is_billable: false,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleCreateTask = async (taskData: CreateTask, attachments: TaskAttachment[]) => {
    try {
      // TODO: Replace with actual API call
      const newTask: Task = {
        id: Math.max(...tasks.map(t => t.id)) + 1,
        ...taskData,
        status: 'todo',
        priority: taskData.priority || 'normal',
        project_id: selectedProject?.id || 1,
        created_by_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: [],
        attachments
      };

      setTasks(prev => [...prev, newTask]);
      addToast('success', t('tasks.createSuccess'), t('tasks.createSuccessMessage'));
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const handleTaskStatusChange = useCallback(async (taskId: number, newStatus: Task['status']) => {
    try {
      // TODO: Replace with actual API call
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
          : task
      ));

      addToast('success', t('success.updated'), 'Task status updated successfully');
    } catch (error) {
      console.error('Failed to update task status:', error);
      addToast('error', t('errors.generic'), t('errors.serverError'));
    }
  }, [addToast, t]);

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleTaskUpdate = async (taskId: number, updates: Partial<CreateTask>, attachments: TaskAttachment[]) => {
    try {
      // TODO: Replace with actual API call
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, ...updates, attachments, updated_at: new Date().toISOString() }
          : task
      ));

      addToast('success', t('success.updated'), 'Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    try {
      // TODO: Replace with actual API call
      setTasks(prev => prev.filter(task => task.id !== taskId));
      addToast('success', t('success.deleted'), 'Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  };

  const handleAddComment = async (taskId: number, comment: string, parentId?: number) => {
    try {
      // TODO: Replace with actual API call
      const newComment = {
        id: Math.random(),
        content: comment,
        created_by_id: 1,
        parent_id: parentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, comments: [...(task.comments || []), newComment] }
          : task
      ));

      // Update selectedTask if it's the same task
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : null);
      }

      addToast('success', 'Comment Added', 'Your comment has been added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('navigation.tasks')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track your tasks across projects
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('tasks.createTask')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input py-1.5 text-sm"
              >
                <option value="all">All Status</option>
                <option value="todo">{t('tasks.status.todo')}</option>
                <option value="in_progress">{t('tasks.status.in_progress')}</option>
                <option value="done">{t('tasks.status.done')}</option>
                <option value="cancelled">{t('tasks.status.cancelled')}</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Flag className="h-4 w-4 text-gray-500" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input py-1.5 text-sm"
              >
                <option value="all">All Priority</option>
                <option value="low">{t('tasks.priority.low')}</option>
                <option value="normal">{t('tasks.priority.normal')}</option>
                <option value="high">{t('tasks.priority.high')}</option>
                <option value="urgent">{t('tasks.priority.urgent')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Task Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">
            {t('common.loading')}
          </div>
        </div>
      ) : viewMode === 'board' ? (
        <TaskBoard
          tasks={filteredTasks}
          onTaskStatusChange={handleTaskStatusChange}
          onTaskEdit={handleTaskEdit}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* List View - TODO: Implement list view */}
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            List view coming soon...
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedProject(undefined);
        }}
        onSave={handleCreateTask}
        project={selectedProject}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={handleTaskUpdate}
        onDelete={handleTaskDelete}
        onAddComment={handleAddComment}
      />
    </div>
  );
}