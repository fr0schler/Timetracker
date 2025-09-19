import { create } from 'zustand';
import { Task, CreateTask, UpdateTask } from '../types';
import { tasksApi } from '../services/api';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasksByProject: (projectId: number) => Promise<void>;
  createTask: (data: CreateTask) => Promise<void>;
  updateTask: (id: number, data: UpdateTask) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  toggleTaskStatus: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasksByProject: async (projectId: number) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await tasksApi.getByProject(projectId);
      set({ tasks, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch tasks',
        isLoading: false
      });
    }
  },

  createTask: async (data: CreateTask) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await tasksApi.create(data);
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to create task',
        isLoading: false
      });
      throw error;
    }
  },

  updateTask: async (id: number, data: UpdateTask) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await tasksApi.update(id, data);
      set((state) => ({
        tasks: state.tasks.map(task => task.id === id ? updatedTask : task),
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to update task',
        isLoading: false
      });
      throw error;
    }
  },

  deleteTask: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await tasksApi.delete(id);
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to delete task',
        isLoading: false
      });
      throw error;
    }
  },

  toggleTaskStatus: async (id: number) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await get().updateTask(id, { status: newStatus });
  },

  clearError: () => {
    set({ error: null });
  }
}));