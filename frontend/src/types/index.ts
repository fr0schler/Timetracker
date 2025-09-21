export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  keyboard_shortcuts_enabled?: boolean;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  user_id: number;
  created_at: string;
}

export interface TimeEntry {
  id: number;
  start_time: string;
  end_time?: string;
  description?: string;
  project_id: number;
  task_id?: number;
  user_id: number;
  created_at: string;
  is_running: boolean;
  duration_seconds: number;
}

export interface CreateProject {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProject {
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface CreateTimeEntry {
  project_id: number;
  description?: string;
  start_time?: string;
}

export interface UpdateTimeEntry {
  end_time?: string;
  description?: string;
  project_id?: number;
  task_id?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Task-related types
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  project_id: number;
  parent_id?: number;
  estimated_hours?: number;
  created_at: string;
  updated_at: string;
  subtasks: Task[];
}

export interface CreateTask {
  title: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  parent_id?: number;
  estimated_hours?: number;
}

export interface UpdateTask {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  parent_id?: number;
  estimated_hours?: number;
}

// Subscription-related types
export interface Subscription {
  id: string | null;
  status: string;
  tier: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  is_active: boolean;
  plan: SubscriptionPlan;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  max_users: number;
  max_projects: number;
}

export interface ApiError {
  detail: string;
}

// User Profile related types
export interface UpdateUserProfile {
  full_name?: string;
  bio?: string;
  timezone?: string;
}