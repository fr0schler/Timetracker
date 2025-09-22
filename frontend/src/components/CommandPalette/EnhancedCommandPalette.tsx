import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Command,
  Sparkles,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useTimeEntryStore } from '../../store/timeEntryStore';
import { useAuthStore } from '../../store/authStore';
import { commandSearchService, SearchResult } from '../../services/commandSearch';
import QuickActions from './QuickActions';

export interface EnhancedCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaletteMode = 'search' | 'quickActions';

const EnhancedCommandPalette: React.FC<EnhancedCommandPaletteProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { timeEntries, activeEntry, startTimer, stopTimer } = useTimeEntryStore();
  const { user } = useAuthStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<PaletteMode>('search');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Initialize search service when data changes
  useEffect(() => {
    commandSearchService.initializeSearch({
      projects,
      timeEntries,
      users: user ? [user] : []
    });
  }, [projects, timeEntries, user]);

  // Perform search when query changes
  useEffect(() => {
    if (mode !== 'search') return;

    setIsLoading(true);
    const debounceTimeout = setTimeout(() => {
      const results = commandSearchService.search(query, 8);
      setSearchResults(results);
      setSelectedIndex(0);
      setIsLoading(false);
    }, 150);

    return () => {
      clearTimeout(debounceTimeout);
      setIsLoading(false);
    };
  }, [query, mode]);

  // Handle custom events from search service
  useEffect(() => {
    const handleNavigateToProject = () => {
      navigate(`/projects`);
      onClose();
    };

    const handleNavigateToPage = (event: CustomEvent) => {
      navigate(event.detail.path);
      onClose();
    };

    const handleExecuteCommand = (event: CustomEvent) => {
      switch (event.detail.command) {
        case 'start-timer':
          if (projects.length > 0) {
            startTimer(projects[0].id);
          }
          break;
        case 'stop-timer':
          if (activeEntry) {
            stopTimer(activeEntry.id);
          }
          break;
      }
      onClose();
    };

    window.addEventListener('navigate-to-project', handleNavigateToProject as EventListener);
    window.addEventListener('navigate-to-page', handleNavigateToPage as EventListener);
    window.addEventListener('execute-command', handleExecuteCommand as EventListener);

    return () => {
      window.removeEventListener('navigate-to-project', handleNavigateToProject as EventListener);
      window.removeEventListener('navigate-to-page', handleNavigateToPage as EventListener);
      window.removeEventListener('execute-command', handleExecuteCommand as EventListener);
    };
  }, [navigate, onClose, projects, activeEntry, startTimer, stopTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (mode === 'search') {
            setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (mode === 'search') {
            setSelectedIndex(prev => Math.max(prev - 1, 0));
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (mode === 'search' && searchResults[selectedIndex]) {
            searchResults[selectedIndex].action();
            onClose();
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'Tab':
          e.preventDefault();
          setMode(prev => prev === 'search' ? 'quickActions' : 'search');
          break;

        // Quick access shortcuts
        case 's':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setMode('search');
            setQuery('start timer');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mode, searchResults, selectedIndex, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current && mode === 'search') {
      inputRef.current.focus();
    }
  }, [isOpen, mode]);

  // Scroll to selected item
  useEffect(() => {
    if (resultsRef.current && mode === 'search') {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex, mode]);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    setMode('search');
    onClose();
  }, [onClose]);

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'project':
        return (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: result.color || '#3B82F6' }}
          />
        );
      case 'command':
        return <Command className="w-4 h-4 text-blue-500" />;
      case 'page':
        return <ArrowRight className="w-4 h-4 text-purple-500" />;
      case 'time-entry':
        return <Clock className="w-4 h-4 text-green-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      project: t('commandPalette.types.project'),
      task: t('commandPalette.types.task'),
      'time-entry': t('commandPalette.types.timeEntry'),
      user: t('commandPalette.types.user'),
      command: t('commandPalette.types.command'),
      page: t('commandPalette.types.page')
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Command className="w-5 h-5 text-primary-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {t('commandPalette.title')}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setMode('search')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'search'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('commandPalette.modes.search')}
              </button>
              <button
                onClick={() => setMode('quickActions')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'quickActions'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                {t('commandPalette.modes.quickActions')}
              </button>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {mode === 'search' ? (
          <>
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" />
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t('commandPalette.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 text-lg"
                />
              </div>
            </div>

            {/* Search Results */}
            <div
              ref={resultsRef}
              className="max-h-96 overflow-y-auto"
            >
              {searchResults.length === 0 && !isLoading ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {query ? t('commandPalette.noResults') : t('commandPalette.startTyping')}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {t('commandPalette.searchTip')}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        result.action();
                        onClose();
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        index === selectedIndex
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-500'
                          : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getResultIcon(result)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Quick Actions */
          <QuickActions onAction={handleClose} />
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              {mode === 'search' && (
                <>
                  <span>↑↓ {t('commandPalette.navigate')}</span>
                  <span>↵ {t('commandPalette.select')}</span>
                </>
              )}
              <span>Tab {t('commandPalette.switchMode')}</span>
              <span>esc {t('commandPalette.close')}</span>
            </div>
            <span>{t('commandPalette.shortcut')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCommandPalette;