import axios, { AxiosResponse } from 'axios';
import {
  User,
  Project,
  TimeEntry,
  Task,
  CreateProject,
  UpdateProject,
  CreateTimeEntry,
  UpdateTimeEntry,
  CreateTask,
  UpdateTask,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Subscription,
  SubscriptionPlan,
} from '../types';

import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', formData);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response: AxiosResponse<User> = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/auth/me');
    return response.data;
  },
};

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response: AxiosResponse<Project[]> = await api.get('/projects/');
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: CreateProject): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.post('/projects/', data);
    return response.data;
  },

  update: async (id: number, data: UpdateProject): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

// Time Entries API
export const timeEntriesApi = {
  getAll: async (): Promise<TimeEntry[]> => {
    const response: AxiosResponse<TimeEntry[]> = await api.get('/time-entries/');
    return response.data;
  },

  getById: async (id: number): Promise<TimeEntry> => {
    const response: AxiosResponse<TimeEntry> = await api.get(`/time-entries/${id}`);
    return response.data;
  },

  getActive: async (): Promise<TimeEntry> => {
    const response: AxiosResponse<TimeEntry> = await api.get('/time-entries/active');
    return response.data;
  },

  create: async (data: CreateTimeEntry): Promise<TimeEntry> => {
    const response: AxiosResponse<TimeEntry> = await api.post('/time-entries/', data);
    return response.data;
  },

  stop: async (id: number): Promise<TimeEntry> => {
    const response: AxiosResponse<TimeEntry> = await api.post(`/time-entries/${id}/stop`);
    return response.data;
  },

  update: async (id: number, data: UpdateTimeEntry): Promise<TimeEntry> => {
    const response: AxiosResponse<TimeEntry> = await api.put(`/time-entries/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/time-entries/${id}`);
  },
};

// Tasks API
export const tasksApi = {
  getByProject: async (projectId: number): Promise<Task[]> => {
    const response: AxiosResponse<Task[]> = await api.get(`/projects/${projectId}/tasks/`);
    return response.data;
  },

  getById: async (projectId: number, taskId: number): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  create: async (projectId: number, data: CreateTask): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.post(`/projects/${projectId}/tasks/`, data);
    return response.data;
  },

  update: async (projectId: number, taskId: number, data: UpdateTask): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.put(`/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },

  delete: async (projectId: number, taskId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  },
};

// Subscription API
export const subscriptionApi = {
  getCurrent: async (): Promise<Subscription> => {
    const response: AxiosResponse<Subscription> = await api.get('/subscriptions/current');
    return response.data;
  },

  getPlans: async (): Promise<{ plans: SubscriptionPlan[] }> => {
    const response: AxiosResponse<{ plans: SubscriptionPlan[] }> = await api.get('/subscriptions/plans');
    return response.data;
  },

  createCheckoutSession: async (data: {
    tier: 'professional' | 'enterprise';
    success_url: string;
    cancel_url: string;
  }): Promise<{ checkout_url: string; session_id: string }> => {
    const response = await api.post('/subscriptions/checkout', data);
    return response.data;
  },

  createPortalSession: async (return_url: string): Promise<{ portal_url: string }> => {
    const response = await api.post('/subscriptions/portal', { return_url });
    return response.data;
  },
};

export default api;