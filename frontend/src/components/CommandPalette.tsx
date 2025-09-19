import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, FolderOpen, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useTimeEntryStore } from '../store/timeEntryStore';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { projects, setCurrentProject } = useProjectStore();
  const { startTimer, stopTimer, activeEntry } = useTimeEntryStore();

  // Generate commands dynamically
  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your time tracking overview',
      icon: <Clock className="w-4 h-4" />,
      action: () => { navigate('/'); setIsOpen(false); },
      keywords: ['dashboard', 'home', 'overview']
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      description: 'Manage your projects',
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => { navigate('/projects'); setIsOpen(false); },
      keywords: ['projects', 'manage']
    },
    {
      id: 'nav-time-entries',
      label: 'Go to Time Entries',
      description: 'View your time tracking history',
      icon: <Clock className="w-4 h-4" />,
      action: () => { navigate('/time-entries'); setIsOpen(false); },
      keywords: ['time', 'entries', 'history', 'tracking']
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Configure your preferences',
      icon: <Settings className="w-4 h-4" />,
      action: () => { navigate('/settings'); setIsOpen(false); },
      keywords: ['settings', 'preferences', 'config']
    },

    // Timer actions
    {
      id: 'timer-toggle',
      label: activeEntry ? 'Stop Timer' : 'Start Timer',
      description: activeEntry ? 'Stop the running timer' : 'Start timing the current project',
      icon: <Clock className="w-4 h-4" />,
      action: () => {
        if (activeEntry) {
          stopTimer(activeEntry.id);
        } else {
          const currentProject = projects[0]; // TODO: Get selected project
          if (currentProject) {
            startTimer(currentProject.id);
          }
        }
        setIsOpen(false);
      },
      keywords: ['timer', 'start', 'stop', 'toggle']
    },

    // Project switching
    ...projects.map(project => ({
      id: `project-${project.id}`,
      label: `Switch to ${project.name}`,
      description: `Start tracking time for ${project.name}`,
      icon: <div className="w-4 h-4 rounded" style={{ backgroundColor: project.color }} />,
      action: () => {
        setCurrentProject(project);
        startTimer(project.id);
        setIsOpen(false);
      },
      keywords: ['project', 'switch', project.name.toLowerCase(), project.client_name?.toLowerCase() || '']
    })),

    // Account actions
    {
      id: 'auth-logout',
      label: 'Sign Out',
      description: 'Sign out of your account',
      icon: <LogOut className="w-4 h-4" />,
      action: () => { logout(); setIsOpen(false); },
      keywords: ['logout', 'sign out', 'exit']
    }
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(command => {
    if (!query) return true;
    const searchTerm = query.toLowerCase();
    return command.label.toLowerCase().includes(searchTerm) ||
           command.description?.toLowerCase().includes(searchTerm) ||
           command.keywords.some(keyword => keyword.includes(searchTerm));
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev === 0 ? filteredCommands.length - 1 : prev - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Listen for global open command
  useEffect(() => {
    const handleOpenCommand = () => {
      setIsOpen(true);
      setQuery('');
      setSelectedIndex(0);
    };

    window.addEventListener('open-command-palette', handleOpenCommand);
    return () => window.removeEventListener('open-command-palette', handleOpenCommand);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={command.action}
                className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex-shrink-0">{command.icon}</div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {command.label}
                  </div>
                  {command.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {command.description}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>esc Close</span>
            </div>
            <span>Ctrl+K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}