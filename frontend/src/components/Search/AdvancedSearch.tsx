import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  id: number;
  type: 'project' | 'task' | 'time_entry';
  title?: string;
  name?: string;
  description?: string;
  project_name?: string;
  status?: string;
  priority?: string;
  [key: string]: any;
}

interface SearchResults {
  projects: SearchResult[];
  tasks: SearchResult[];
  time_entries: SearchResult[];
  total_count: number;
}

interface AdvancedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onResultSelect,
  className = ''
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters] = useState<any>({});
  const [availableFilters, setAvailableFilters] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load available filters on mount
    loadAvailableFilters();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    // Close results when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !searchRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAvailableFilters = async () => {
    try {
      const response = await fetch('/api/v1/search/filters', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableFilters(data);
      }
    } catch (error) {
      console.error('Failed to load search filters:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const response = await fetch('/api/v1/search/recent', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentSearches(data.popular_searches || []);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20'
      });

      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }

      const response = await fetch(`/api/v1/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions(null);
      return;
    }

    try {
      const response = await fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search and suggestions
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        performSearch(value);
        getSuggestions(value);
      } else {
        setResults(null);
        setSuggestions(null);
        setShowResults(false);
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      searchRef.current?.blur();
    } else if (e.key === 'Enter') {
      performSearch(query);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    onResultSelect?.(result);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setSuggestions(null);
    setShowResults(false);
    searchRef.current?.focus();
  };

  const addQuickFilter = (filterType: string, value: string) => {
    const newQuery = query + ` ${filterType}:${value}`;
    setQuery(newQuery);
    handleInputChange(newQuery);
  };

  const renderSearchResult = (result: SearchResult) => {
    const getResultTitle = () => {
      switch (result.type) {
        case 'project':
          return result.name;
        case 'task':
          return result.title;
        case 'time_entry':
          return result.description || `${result.project_name} - ${result.task_title || 'No task'}`;
        default:
          return 'Unknown';
      }
    };

    const getResultSubtitle = () => {
      switch (result.type) {
        case 'project':
          return `${result.task_count} tasks • ${result.total_time_hours?.toFixed(1)}h`;
        case 'task':
          return `${result.project_name} • ${result.status} • ${result.priority}`;
        case 'time_entry':
          return `${result.duration_hours?.toFixed(2)}h • ${result.is_billable ? 'Billable' : 'Non-billable'}`;
        default:
          return '';
      }
    };

    const getTypeIcon = () => {
      switch (result.type) {
        case 'project':
          return '📁';
        case 'task':
          return '✓';
        case 'time_entry':
          return '⏱';
        default:
          return '?';
      }
    };

    return (
      <button
        key={`${result.type}-${result.id}`}
        onClick={() => handleResultClick(result)}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">{getTypeIcon()}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {getResultTitle()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {getResultSubtitle()}
            </div>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
            {result.type.replace('_', ' ')}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query && setShowResults(true)}
              placeholder={t('search.placeholder') || 'Search...'}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            {isLoading && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${
              showFilters ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-600' : ''
            }`}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Quick Filters */}
        {showFilters && availableFilters && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Quick Filters
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Status</div>
                <div className="flex flex-wrap gap-1">
                  {availableFilters.filters.status.map((status: any) => (
                    <button
                      key={status.value}
                      onClick={() => addQuickFilter('status', status.value)}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Priority</div>
                <div className="flex flex-wrap gap-1">
                  {availableFilters.filters.priority.map((priority: any) => (
                    <button
                      key={priority.value}
                      onClick={() => addQuickFilter('priority', priority.value)}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Popular Searches</div>
              <div className="flex flex-wrap gap-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search);
                      handleInputChange(search);
                    }}
                    className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {showResults && (results || suggestions) && (
          <div
            ref={resultsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto"
          >
            {results && results.total_count > 0 ? (
              <>
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                      Projects ({results.projects.length})
                    </div>
                    {results.projects.map(renderSearchResult)}
                  </div>
                )}
                {results.tasks.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                      Tasks ({results.tasks.length})
                    </div>
                    {results.tasks.map(renderSearchResult)}
                  </div>
                )}
                {results.time_entries.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                      Time Entries ({results.time_entries.length})
                    </div>
                    {results.time_entries.map(renderSearchResult)}
                  </div>
                )}
              </>
            ) : query && !isLoading ? (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                <MagnifyingGlassIcon className="mx-auto h-8 w-8 mb-2" />
                <div className="text-sm">No results found</div>
                <div className="text-xs mt-1">Try a different search query</div>
              </div>
            ) : null}

            {/* Search suggestions */}
            {suggestions && !results && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                  Suggestions
                </div>
                {[...suggestions.projects, ...suggestions.tasks, ...suggestions.users].slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion);
                      handleInputChange(suggestion);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;