import { useState, useEffect } from 'react';
import { Edit2, Trash2, Clock, Play, Square } from 'lucide-react';
import { useTimeEntryStore } from '../store/timeEntryStore';
import { useProjectStore } from '../store/projectStore';
import { formatDuration, formatDateTime, formatTime } from '../utils/timeUtils';
import { UpdateTimeEntry } from '../types';

export default function TimeEntriesPage() {
  const { timeEntries, fetchTimeEntries, updateTimeEntry, deleteTimeEntry, stopTimeEntry, isLoading } = useTimeEntryStore();
  const { projects, fetchProjects } = useProjectStore();
  const [editingEntry, setEditingEntry] = useState<number | null>(null);

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, [fetchTimeEntries, fetchProjects]);

  const handleUpdateEntry = async (id: number, data: UpdateTimeEntry) => {
    try {
      await updateTimeEntry(id, data);
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to update time entry:', error);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntry(id);
      } catch (error) {
        console.error('Failed to delete time entry:', error);
      }
    }
  };

  const handleStopEntry = async (id: number) => {
    try {
      await stopTimeEntry(id);
    } catch (error) {
      console.error('Failed to stop time entry:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Time Entries
        </h1>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {timeEntries.map((entry) => {
                const project = projects.find(p => p.id === entry.project_id);
                return (
                  <tr key={entry.id}>
                    {editingEntry === entry.id ? (
                      <TimeEntryForm
                        entry={entry}
                        projects={projects}
                        onSubmit={(data) => handleUpdateEntry(entry.id, data)}
                        onCancel={() => setEditingEntry(null)}
                        isLoading={isLoading}
                      />
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: project?.color || '#3B82F6' }}
                            ></span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {project?.name || 'Unknown Project'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {entry.description || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(entry.start_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {entry.end_time ? formatTime(entry.end_time) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <Play className="h-3 w-3 mr-1" />
                              Running
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {entry.is_running ? (
                            <span className="text-green-600">Running...</span>
                          ) : (
                            formatDuration(entry.duration_seconds)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {entry.is_running && (
                              <button
                                onClick={() => handleStopEntry(entry.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Stop timer"
                              >
                                <Square className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingEntry(entry.id)}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Edit entry"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {timeEntries.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No time entries yet. Start tracking your time from the dashboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface TimeEntryFormProps {
  entry: any;
  projects: any[];
  onSubmit: (data: UpdateTimeEntry) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function TimeEntryForm({ entry, projects, onSubmit, onCancel, isLoading }: TimeEntryFormProps) {
  const [description, setDescription] = useState(entry.description || '');
  const [projectId, setProjectId] = useState(entry.project_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description: description || undefined,
      project_id: projectId !== entry.project_id ? projectId : undefined,
    });
  };

  return (
    <td colSpan={6} className="px-6 py-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="input"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="What were you working on?"
            />
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            Update Entry
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </td>
  );
}