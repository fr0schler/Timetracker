export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
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

export interface ApiError {
  detail: string;
}