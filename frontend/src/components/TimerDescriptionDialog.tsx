import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, X, Tag, FileText, Timer } from 'lucide-react';
import { TimeEntry } from '../types';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';

interface TimerDescriptionDialogProps {
  timeEntry: TimeEntry;
  onSave: (description: string, taskId?: number) => void;
  onCancel: () => void;
}

export default function TimerDescriptionDialog({
  timeEntry,
  onSave,
  onCancel
}: TimerDescriptionDialogProps) {
  const [description, setDescription] = useState(timeEntry.description || '');
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(timeEntry.task_id || undefined);
  const [isLoading, setIsLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { projects } = useProjectStore();
  const { tasks, fetchTasksByProject } = useTaskStore();

  // Get project for this time entry
  const project = projects.find(p => p.id === timeEntry.project_id);

  // Fetch tasks for the project
  useEffect(() => {
    if (project?.id) {
      fetchTasksByProject(project.id);
    }
  }, [project?.id, fetchTasksByProject]);

  // Focus textarea when dialog opens
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Calculate duration for display
  const duration = timeEntry.end_time
    ? Math.round((new Date(timeEntry.end_time).getTime() - new Date(timeEntry.start_time).getTime()) / 1000)
    : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      textareaRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      await onSave(description.trim(), selectedTaskId);
    } catch (error) {
      console.error('Failed to save time entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Time Entry Complete
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project?.name} • {formatDuration(duration)}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              What did you work on?
            </label>
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you accomplished during this time..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Press Ctrl+Enter to save quickly
            </p>
          </div>

          {/* Task Selection */}
          {tasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Assign to Task (Optional)
              </label>
              <select
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No specific task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(timeEntry.start_time).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Ended:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {timeEntry.end_time ? new Date(timeEntry.end_time).toLocaleTimeString() : 'Now'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400 flex items-center">
                <Timer className="h-4 w-4 mr-1" />
                {formatDuration(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !description.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}