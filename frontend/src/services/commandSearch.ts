import { Project, TimeEntry, User } from '../types';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: 'project' | 'task' | 'time-entry' | 'user' | 'command' | 'page';
  icon?: string;
  color?: string;
  score: number;
  action: () => void;
  metadata?: Record<string, any>;
}

export interface SearchableItem {
  id: string;
  title: string;
  content: string[];
  type: SearchResult['type'];
  metadata?: Record<string, any>;
}

class CommandSearchService {
  private searchableItems: SearchableItem[] = [];
  private stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

  // Initialize search index with current data
  initializeSearch(data: {
    projects: Project[];
    timeEntries: TimeEntry[];
    users?: User[];
  }) {
    this.searchableItems = [];

    // Index projects
    data.projects.forEach(project => {
      this.searchableItems.push({
        id: `project-${project.id}`,
        title: project.name,
        content: [
          project.name,
          project.description || '',
          'project'
        ],
        type: 'project',
        metadata: {
          project,
          color: project.color,
          isActive: project.is_active
        }
      });
    });

    // Index time entries
    data.timeEntries.forEach(entry => {
      const project = data.projects.find(p => p.id === entry.project_id);
      this.searchableItems.push({
        id: `time-entry-${entry.id}`,
        title: entry.description || 'Untitled Time Entry',
        content: [
          entry.description || '',
          project?.name || '',
          'time entry',
          'tracking'
        ],
        type: 'time-entry',
        metadata: {
          entry,
          project: project?.name,
          duration: this.calculateDuration(entry)
        }
      });
    });

    // Index users (if provided)
    if (data.users) {
      data.users.forEach(user => {
        this.searchableItems.push({
          id: `user-${user.id}`,
          title: user.full_name || user.email,
          content: [
            user.full_name || '',
            user.email,
            'user',
            'team member'
          ],
          type: 'user',
          metadata: { user }
        });
      });
    }

    // Index common pages and commands
    this.addCommonCommands();
  }

  private addCommonCommands() {
    const commands = [
      {
        id: 'page-dashboard',
        title: 'Dashboard',
        content: ['dashboard', 'home', 'overview', 'summary'],
        type: 'page' as const,
        metadata: { path: '/dashboard' }
      },
      {
        id: 'page-projects',
        title: 'Projects',
        content: ['projects', 'manage projects', 'project list'],
        type: 'page' as const,
        metadata: { path: '/projects' }
      },
      {
        id: 'page-tasks',
        title: 'Tasks',
        content: ['tasks', 'task board', 'kanban', 'todo'],
        type: 'page' as const,
        metadata: { path: '/tasks' }
      },
      {
        id: 'page-time-entries',
        title: 'Time Entries',
        content: ['time entries', 'time tracking', 'history', 'logs'],
        type: 'page' as const,
        metadata: { path: '/time-entries' }
      },
      {
        id: 'page-analytics',
        title: 'Analytics',
        content: ['analytics', 'reports', 'insights', 'statistics', 'metrics'],
        type: 'page' as const,
        metadata: { path: '/analytics' }
      },
      {
        id: 'page-team',
        title: 'Team Management',
        content: ['team', 'users', 'members', 'invite', 'manage team'],
        type: 'page' as const,
        metadata: { path: '/team' }
      },
      {
        id: 'command-start-timer',
        title: 'Start Timer',
        content: ['start timer', 'begin tracking', 'start time', 'play'],
        type: 'command' as const,
        metadata: { command: 'start-timer' }
      },
      {
        id: 'command-stop-timer',
        title: 'Stop Timer',
        content: ['stop timer', 'end tracking', 'stop time', 'pause'],
        type: 'command' as const,
        metadata: { command: 'stop-timer' }
      }
    ];

    this.searchableItems.push(...commands);
  }

  // Advanced search with scoring
  search(query: string, limit: number = 10): SearchResult[] {
    if (!query.trim()) {
      return this.getRecentItems(limit);
    }

    const normalizedQuery = this.normalizeQuery(query);
    const queryTerms = this.tokenize(normalizedQuery);

    const results: Array<SearchableItem & { score: number }> = [];

    this.searchableItems.forEach(item => {
      const score = this.calculateScore(item, queryTerms, normalizedQuery);
      if (score > 0) {
        results.push({ ...item, score });
      }
    });

    // Sort by score and convert to SearchResult
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => this.toSearchResult(item));
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
  }

  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(term => term.length > 1 && !this.stopWords.has(term));
  }

  private calculateScore(item: SearchableItem, queryTerms: string[], fullQuery: string): number {
    let score = 0;
    const allContent = [item.title, ...item.content].join(' ').toLowerCase();

    // Exact title match gets highest score
    if (item.title.toLowerCase() === fullQuery) {
      score += 100;
    }

    // Title starts with query
    if (item.title.toLowerCase().startsWith(fullQuery)) {
      score += 80;
    }

    // Title contains query
    if (item.title.toLowerCase().includes(fullQuery)) {
      score += 60;
    }

    // Content contains full query
    if (allContent.includes(fullQuery)) {
      score += 40;
    }

    // Individual term matches
    queryTerms.forEach(term => {
      if (item.title.toLowerCase().includes(term)) {
        score += 20;
      }
      if (allContent.includes(term)) {
        score += 10;
      }
    });

    // Boost score based on item type (prioritize certain types)
    switch (item.type) {
      case 'command':
        score += 15;
        break;
      case 'page':
        score += 10;
        break;
      case 'project':
        score += 8;
        break;
      case 'task':
        score += 5;
        break;
    }

    // Boost active projects
    if (item.type === 'project' && item.metadata?.isActive) {
      score += 5;
    }

    return score;
  }

  private toSearchResult(item: SearchableItem & { score: number }): SearchResult {
    const baseResult: Omit<SearchResult, 'action'> = {
      id: item.id,
      title: item.title,
      type: item.type,
      score: item.score,
      metadata: item.metadata
    };

    // Generate appropriate action and additional properties based on type
    switch (item.type) {
      case 'project':
        return {
          ...baseResult,
          subtitle: item.metadata?.project?.description,
          color: item.metadata?.color,
          action: () => {
            window.dispatchEvent(new CustomEvent('navigate-to-project', {
              detail: { projectId: item.metadata?.project?.id }
            }));
          }
        };

      case 'time-entry':
        return {
          ...baseResult,
          subtitle: `${item.metadata?.project} • ${item.metadata?.duration}`,
          action: () => {
            window.dispatchEvent(new CustomEvent('navigate-to-time-entry', {
              detail: { entryId: item.metadata?.entry?.id }
            }));
          }
        };

      case 'user':
        return {
          ...baseResult,
          subtitle: item.metadata?.user?.email,
          action: () => {
            window.dispatchEvent(new CustomEvent('navigate-to-user', {
              detail: { userId: item.metadata?.user?.id }
            }));
          }
        };

      case 'page':
        return {
          ...baseResult,
          action: () => {
            window.dispatchEvent(new CustomEvent('navigate-to-page', {
              detail: { path: item.metadata?.path }
            }));
          }
        };

      case 'command':
        return {
          ...baseResult,
          action: () => {
            window.dispatchEvent(new CustomEvent('execute-command', {
              detail: { command: item.metadata?.command }
            }));
          }
        };

      default:
        return {
          ...baseResult,
          action: () => console.log('No action defined for', item.type)
        };
    }
  }

  private getRecentItems(limit: number): SearchResult[] {
    // Return commonly used items when no search query
    const recentItems = this.searchableItems
      .filter(item => ['command', 'page'].includes(item.type))
      .slice(0, limit);

    return recentItems.map(item => this.toSearchResult({ ...item, score: 0 }));
  }

  private calculateDuration(entry: TimeEntry): string {
    if (!entry.end_time) return 'Running...';

    const start = new Date(entry.start_time);
    const end = new Date(entry.end_time);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  }

  // Update search index when data changes
  updateProjects(projects: Project[]) {
    this.searchableItems = this.searchableItems.filter(item => !item.id.startsWith('project-'));
    projects.forEach(project => {
      this.searchableItems.push({
        id: `project-${project.id}`,
        title: project.name,
        content: [project.name, project.description || '', 'project'],
        type: 'project',
        metadata: { project, color: project.color, isActive: project.is_active }
      });
    });
  }

  updateTimeEntries(timeEntries: TimeEntry[], projects: Project[]) {
    this.searchableItems = this.searchableItems.filter(item => !item.id.startsWith('time-entry-'));
    timeEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      this.searchableItems.push({
        id: `time-entry-${entry.id}`,
        title: entry.description || 'Untitled Time Entry',
        content: [entry.description || '', project?.name || '', 'time entry', 'tracking'],
        type: 'time-entry',
        metadata: { entry, project: project?.name, duration: this.calculateDuration(entry) }
      });
    });
  }
}

export const commandSearchService = new CommandSearchService();