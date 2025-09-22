export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  tags: string[];
  isPublic: boolean;
  isFavorite: boolean;
  taskCount: number;
  estimatedHours: number;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tasks: TemplateTask[];
}

export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  dependencies: string[];
  order: number;
}

export interface CreateProjectTemplateData {
  name: string;
  description: string;
  category: string;
  color: string;
  tags: string[];
  isPublic: boolean;
  tasks: Omit<TemplateTask, 'id'>[];
}

export interface UpdateProjectTemplateData extends Partial<CreateProjectTemplateData> {
  id: string;
}