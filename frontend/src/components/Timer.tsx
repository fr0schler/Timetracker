import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { useTimeEntryStore } from '../store/timeEntryStore';
import { useProjectStore } from '../store/projectStore';
import { useTimer } from '../hooks/useTimer';
import { formatDuration } from '../utils/timeUtils';

export default function Timer() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  const {
    activeTimeEntry,
    startTimeEntry,
    stopTimeEntry,
    fetchActiveTimeEntry,
    isLoading,
  } = useTimeEntryStore();

  const { projects, fetchProjects } = useProjectStore();

  const currentDuration = useTimer(
    activeTimeEntry?.start_time || null,
    activeTimeEntry?.is_running || false
  );

  useEffect(() => {
    fetchActiveTimeEntry();
    fetchProjects();
  }, [fetchActiveTimeEntry, fetchProjects]);

  const handleStart = async () => {
    if (!selectedProjectId) return;

    try {
      await startTimeEntry({
        project_id: selectedProjectId,
        description: description || undefined,
      });
      setDescription('');
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handleStop = async () => {
    if (!activeTimeEntry) return;

    try {
      await stopTimeEntry(activeTimeEntry.id);
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  const activeProject = projects.find(p => p.id === activeTimeEntry?.project_id);

  return (
    <div className="card p-6">
      <div className="text-center">
        <div className="mb-6">
          <Clock className="h-16 w-16 mx-auto text-primary-600 mb-4" />
          <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2">
            {formatDuration(currentDuration)}
          </div>
          {activeTimeEntry && activeProject && (
            <div className="text-lg text-gray-600 dark:text-gray-400">
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: activeProject.color }}
              ></span>
              {activeProject.name}
              {activeTimeEntry.description && (
                <span className="block text-sm mt-1">
                  {activeTimeEntry.description}
                </span>
              )}
            </div>
          )}
        </div>

        {!activeTimeEntry ? (
          <div className="space-y-4">
            <div>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}
                className="input"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on? (optional)"
                className="input"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!selectedProjectId || isLoading}
              className="btn btn-primary flex items-center space-x-2 text-lg px-8 py-3"
            >
              <Play className="h-6 w-6" />
              <span>Start Timer</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleStop}
            disabled={isLoading}
            className="btn btn-danger flex items-center space-x-2 text-lg px-8 py-3"
          >
            <Square className="h-6 w-6" />
            <span>Stop Timer</span>
          </button>
        )}
      </div>
    </div>
  );
}