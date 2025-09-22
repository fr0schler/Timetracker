import { create } from 'zustand';
import { ProjectTemplate, CreateProjectTemplateData, UpdateProjectTemplateData } from '../types/projectTemplate';
import { projectTemplateService } from '../services/projectTemplateService';

interface ProjectTemplateStore {
  templates: ProjectTemplate[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTemplates: () => Promise<void>;
  createTemplate: (data: CreateProjectTemplateData) => Promise<ProjectTemplate>;
  updateTemplate: (data: UpdateProjectTemplateData) => Promise<ProjectTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  createFromTemplate: (templateId: string, projectData: { name: string; description: string }) => Promise<void>;
  clearError: () => void;
}

export const useProjectTemplateStore = create<ProjectTemplateStore>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,

  loadTemplates: async () => {
    try {
      set({ isLoading: true, error: null });
      const templates = await projectTemplateService.getTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      console.error('Failed to load templates:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load templates',
        isLoading: false
      });
    }
  },

  createTemplate: async (data: CreateProjectTemplateData) => {
    try {
      set({ isLoading: true, error: null });
      const template = await projectTemplateService.createTemplate(data);
      const { templates } = get();
      set({
        templates: [template, ...templates],
        isLoading: false
      });
      return template;
    } catch (error) {
      console.error('Failed to create template:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create template',
        isLoading: false
      });
      throw error;
    }
  },

  updateTemplate: async (data: UpdateProjectTemplateData) => {
    try {
      set({ isLoading: true, error: null });
      const template = await projectTemplateService.updateTemplate(data);
      const { templates } = get();
      set({
        templates: templates.map(t => t.id === template.id ? template : t),
        isLoading: false
      });
      return template;
    } catch (error) {
      console.error('Failed to update template:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update template',
        isLoading: false
      });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await projectTemplateService.deleteTemplate(id);
      const { templates } = get();
      set({
        templates: templates.filter(t => t.id !== id),
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete template',
        isLoading: false
      });
      throw error;
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      const { templates } = get();
      const template = templates.find(t => t.id === id);
      if (!template) return;

      await projectTemplateService.toggleFavorite(id);
      set({
        templates: templates.map(t =>
          t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        )
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle favorite'
      });
      throw error;
    }
  },

  createFromTemplate: async (templateId: string, projectData: { name: string; description: string }) => {
    try {
      set({ isLoading: true, error: null });
      await projectTemplateService.createFromTemplate(templateId, projectData);

      // Update usage count
      const { templates } = get();
      set({
        templates: templates.map(t =>
          t.id === templateId ? { ...t, usageCount: t.usageCount + 1 } : t
        ),
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to create from template:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create from template',
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));