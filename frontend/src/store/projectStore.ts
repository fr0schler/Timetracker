import { create } from 'zustand';
import { Project, CreateProject, UpdateProject } from '../types';
import { projectsApi } from '../services/api';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  selectedProject: Project | null;
  currentProject: Project | null; // For keyboard shortcuts compatibility
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProject) => Promise<void>;
  updateProject: (id: number, data: UpdateProject) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  setSelectedProject: (project: Project | null) => void;
  setCurrentProject: (project: Project | null) => void; // Alias for compatibility
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  isLoading: false,
  selectedProject: null,
  currentProject: null,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await projectsApi.getAll();
      set({ projects });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (data: CreateProject) => {
    set({ isLoading: true });
    try {
      const newProject = await projectsApi.create(data);
      set((state) => ({
        projects: [newProject, ...state.projects],
      }));
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (id: number, data: UpdateProject) => {
    set({ isLoading: true });
    try {
      const updatedProject = await projectsApi.update(id, data);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? updatedProject : p
        ),
      }));
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id: number) => {
    set({ isLoading: true });
    try {
      await projectsApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
      }));
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedProject: (project: Project | null) => {
    set({ selectedProject: project, currentProject: project });
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project, selectedProject: project });
  },
}));