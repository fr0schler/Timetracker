import api from './api';
import { ProjectTemplate, CreateProjectTemplateData, UpdateProjectTemplateData } from '../types/projectTemplate';

class ProjectTemplateService {
  async getTemplates(): Promise<ProjectTemplate[]> {
    try {
      const response = await api.get('/project-templates');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project templates:', error);
      // Return mock data for development
      return this.getMockTemplates();
    }
  }

  async getTemplate(id: string): Promise<ProjectTemplate> {
    try {
      const response = await api.get(`/project-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project template:', error);
      throw error;
    }
  }

  async createTemplate(data: CreateProjectTemplateData): Promise<ProjectTemplate> {
    try {
      const response = await api.post('/project-templates', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create project template:', error);
      throw error;
    }
  }

  async updateTemplate(data: UpdateProjectTemplateData): Promise<ProjectTemplate> {
    try {
      const response = await api.put(`/project-templates/${data.id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update project template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await api.delete(`/project-templates/${id}`);
    } catch (error) {
      console.error('Failed to delete project template:', error);
      throw error;
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    try {
      await api.post(`/project-templates/${id}/toggle-favorite`);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }

  async createFromTemplate(templateId: string, projectData: { name: string; description: string }): Promise<void> {
    try {
      await api.post(`/project-templates/${templateId}/create-project`, projectData);
    } catch (error) {
      console.error('Failed to create project from template:', error);
      throw error;
    }
  }

  async getPublicTemplates(): Promise<ProjectTemplate[]> {
    try {
      const response = await api.get('/project-templates/public');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch public templates:', error);
      return [];
    }
  }

  // Mock data for development
  private getMockTemplates(): ProjectTemplate[] {
    return [
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete website redesign project template with modern UI/UX workflow',
        category: 'Web Development',
        color: '#3B82F6',
        tags: ['UI/UX', 'Frontend', 'Responsive'],
        isPublic: true,
        isFavorite: false,
        taskCount: 12,
        estimatedHours: 120,
        usageCount: 15,
        createdBy: 'John Doe',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        tasks: [
          {
            id: '1',
            title: 'User Research & Analysis',
            description: 'Conduct user interviews and analyze current website performance',
            priority: 'HIGH',
            estimatedHours: 16,
            dependencies: [],
            order: 1,
          },
          {
            id: '2',
            title: 'Wireframing & Prototyping',
            description: 'Create wireframes and interactive prototypes',
            priority: 'HIGH',
            estimatedHours: 24,
            dependencies: ['1'],
            order: 2,
          },
          {
            id: '3',
            title: 'Visual Design',
            description: 'Design the visual elements and create style guide',
            priority: 'NORMAL',
            estimatedHours: 32,
            dependencies: ['2'],
            order: 3,
          },
          {
            id: '4',
            title: 'Frontend Development',
            description: 'Implement the design using modern frameworks',
            priority: 'HIGH',
            estimatedHours: 40,
            dependencies: ['3'],
            order: 4,
          },
          {
            id: '5',
            title: 'Testing & QA',
            description: 'Cross-browser testing and quality assurance',
            priority: 'NORMAL',
            estimatedHours: 8,
            dependencies: ['4'],
            order: 5,
          },
        ],
      },
      {
        id: '2',
        name: 'Mobile App Development',
        description: 'Complete mobile application development lifecycle template',
        category: 'Mobile Development',
        color: '#10B981',
        tags: ['Mobile', 'React Native', 'iOS', 'Android'],
        isPublic: true,
        isFavorite: true,
        taskCount: 18,
        estimatedHours: 200,
        usageCount: 8,
        createdBy: 'Jane Smith',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-25T11:45:00Z',
        tasks: [],
      },
      {
        id: '3',
        name: 'Marketing Campaign',
        description: 'Digital marketing campaign template for product launches',
        category: 'Marketing',
        color: '#F59E0B',
        tags: ['Digital Marketing', 'Social Media', 'Content'],
        isPublic: false,
        isFavorite: false,
        taskCount: 8,
        estimatedHours: 60,
        usageCount: 3,
        createdBy: 'Mike Johnson',
        createdAt: '2024-01-20T14:00:00Z',
        updatedAt: '2024-01-22T16:20:00Z',
        tasks: [],
      },
      {
        id: '4',
        name: 'API Development',
        description: 'RESTful API development template with authentication and documentation',
        category: 'Backend Development',
        color: '#8B5CF6',
        tags: ['API', 'Backend', 'Documentation', 'Testing'],
        isPublic: true,
        isFavorite: true,
        taskCount: 10,
        estimatedHours: 80,
        usageCount: 12,
        createdBy: 'Sarah Wilson',
        createdAt: '2024-01-12T11:00:00Z',
        updatedAt: '2024-01-18T13:15:00Z',
        tasks: [],
      },
      {
        id: '5',
        name: 'E-commerce Setup',
        description: 'Complete e-commerce platform setup with payment integration',
        category: 'Web Development',
        color: '#EF4444',
        tags: ['E-commerce', 'Payment', 'Inventory', 'Frontend'],
        isPublic: false,
        isFavorite: false,
        taskCount: 15,
        estimatedHours: 150,
        usageCount: 5,
        createdBy: 'Alex Brown',
        createdAt: '2024-01-18T10:30:00Z',
        updatedAt: '2024-01-24T09:45:00Z',
        tasks: [],
      },
    ];
  }
}

export const projectTemplateService = new ProjectTemplateService();