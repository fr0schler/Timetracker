import api from './api';

export interface UsageAnalyticsData {
  totalTimeTracked: number;
  totalProjects: number;
  totalTasks: number;
  activeUsers: number;
  weeklyData: Array<{
    week: string;
    hours: number;
    projects: number;
    tasks: number;
  }>;
  projectBreakdown: Array<{
    name: string;
    hours: number;
    color: string;
  }>;
  userActivity: Array<{
    user: string;
    hours: number;
    tasksCompleted: number;
  }>;
}

export interface TimeTrackingAnalytics {
  dailyHours: Array<{
    date: string;
    hours: number;
  }>;
  projectDistribution: Array<{
    projectName: string;
    hours: number;
    percentage: number;
  }>;
  taskCompletion: {
    completed: number;
    inProgress: number;
    todo: number;
    cancelled: number;
  };
  userProductivity: Array<{
    userId: string;
    userName: string;
    averageHoursPerDay: number;
    tasksCompletedPerWeek: number;
    efficiency: number;
  }>;
}

class AnalyticsService {
  async getUsageAnalytics(timeRange: string = '30d'): Promise<UsageAnalyticsData> {
    try {
      const response = await api.get(`/analytics/usage?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch usage analytics:', error);
      // Return mock data for development
      return this.getMockUsageData();
    }
  }

  async getTimeTrackingAnalytics(timeRange: string = '30d'): Promise<TimeTrackingAnalytics> {
    try {
      const response = await api.get(`/analytics/time-tracking?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch time tracking analytics:', error);
      // Return mock data for development
      return this.getMockTimeTrackingData();
    }
  }

  async getProjectAnalytics(projectId: string, timeRange: string = '30d') {
    const response = await api.get(`/analytics/projects/${projectId}?timeRange=${timeRange}`);
    return response.data;
  }

  async getUserAnalytics(userId: string, timeRange: string = '30d') {
    const response = await api.get(`/analytics/users/${userId}?timeRange=${timeRange}`);
    return response.data;
  }

  async getOrganizationMetrics(timeRange: string = '30d') {
    const response = await api.get(`/analytics/organization?timeRange=${timeRange}`);
    return response.data;
  }

  // Mock data for development
  private getMockUsageData(): UsageAnalyticsData {
    const now = new Date();
    const weeklyData = [];

    for (let i = 7; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 7);
      weeklyData.push({
        week: `W${Math.ceil(date.getDate() / 7)}`,
        hours: Math.floor(Math.random() * 40) + 20,
        projects: Math.floor(Math.random() * 8) + 2,
        tasks: Math.floor(Math.random() * 25) + 10,
      });
    }

    const projects = [
      { name: 'Website Redesign', color: '#3B82F6' },
      { name: 'Mobile App', color: '#10B981' },
      { name: 'API Development', color: '#F59E0B' },
      { name: 'Database Migration', color: '#EF4444' },
      { name: 'Testing', color: '#8B5CF6' },
    ];

    const projectBreakdown = projects.map(project => ({
      ...project,
      hours: Math.floor(Math.random() * 50) + 10,
    }));

    const userActivity = [
      { user: 'John Doe', hours: 156.5, tasksCompleted: 23 },
      { user: 'Jane Smith', hours: 142.0, tasksCompleted: 19 },
      { user: 'Mike Johnson', hours: 98.5, tasksCompleted: 15 },
      { user: 'Sarah Wilson', hours: 87.0, tasksCompleted: 12 },
    ];

    return {
      totalTimeTracked: 484,
      totalProjects: 12,
      totalTasks: 89,
      activeUsers: 4,
      weeklyData,
      projectBreakdown,
      userActivity,
    };
  }

  private getMockTimeTrackingData(): TimeTrackingAnalytics {
    const dailyHours = [];
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dailyHours.push({
        date: date.toISOString().split('T')[0],
        hours: Math.floor(Math.random() * 8) + 1,
      });
    }

    return {
      dailyHours,
      projectDistribution: [
        { projectName: 'Website Redesign', hours: 120, percentage: 35.3 },
        { projectName: 'Mobile App', hours: 95, percentage: 27.9 },
        { projectName: 'API Development', hours: 78, percentage: 22.9 },
        { projectName: 'Testing', hours: 47, percentage: 13.8 },
      ],
      taskCompletion: {
        completed: 45,
        inProgress: 12,
        todo: 23,
        cancelled: 3,
      },
      userProductivity: [
        {
          userId: '1',
          userName: 'John Doe',
          averageHoursPerDay: 7.8,
          tasksCompletedPerWeek: 8.5,
          efficiency: 92.5,
        },
        {
          userId: '2',
          userName: 'Jane Smith',
          averageHoursPerDay: 7.1,
          tasksCompletedPerWeek: 7.2,
          efficiency: 89.2,
        },
      ],
    };
  }
}

export const analyticsService = new AnalyticsService();