import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FolderOpen, TrendingUp, Calendar } from 'lucide-react';
import Timer from '../components/Timer';
import { useTimeEntryStore } from '../store/timeEntryStore';
import { useProjectStore } from '../store/projectStore';
import { formatDuration, formatDate, getTimeAgo } from '../utils/timeUtils';

export default function DashboardPage() {
  const { timeEntries, fetchTimeEntries } = useTimeEntryStore();
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, [fetchTimeEntries, fetchProjects]);

  // Calculate today's total time
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = timeEntries.filter(entry =>
    entry.start_time.startsWith(today) && !entry.is_running
  );
  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);

  // Calculate this week's total time (simple approximation)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEntries = timeEntries.filter(entry =>
    new Date(entry.start_time) >= weekAgo && !entry.is_running
  );
  const weekTotal = weekEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);

  // Recent entries (last 5)
  const recentEntries = timeEntries.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
      </div>

      {/* Timer Section */}
      <Timer />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Today
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatDuration(todayTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                This Week
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatDuration(weekTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Projects
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {projects.filter(p => p.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <Link
              to="/time-entries"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => {
              const project = projects.find(p => p.id === entry.project_id);
              return (
                <div key={entry.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: project?.color || '#3B82F6' }}
                      ></span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {project?.name || 'Unknown Project'}
                        </p>
                        {entry.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.is_running ? (
                          <span className="text-green-600">Running</span>
                        ) : (
                          formatDuration(entry.duration_seconds)
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getTimeAgo(entry.start_time)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No time entries yet. Start tracking your time!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}