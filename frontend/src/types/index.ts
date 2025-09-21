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
  is_billable?: boolean;
  hourly_rate?: number;
  user_id?: number;
  created_at: string;
  updated_at: string;
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
  due_date?: string;
  assigned_to_id?: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  subtasks: Task[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  tags?: string[];
}

export interface CreateTask {
  title: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  parent_id?: number;
  estimated_hours?: number;
  due_date?: string;
  assigned_to_id?: number;
  tags?: string[];
}

export interface UpdateTask {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  parent_id?: number;
  estimated_hours?: number;
  due_date?: string;
  assigned_to_id?: number;
  tags?: string[];
}

// Task Attachment types
export interface TaskAttachment {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  uploaded_by_id: number;
  uploaded_at: string;
}

// Task Comment types
export interface TaskComment {
  id: number;
  content: string;
  created_by_id: number;
  parent_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskComment {
  content: string;
}

// Task Template types
export interface TaskTemplate {
  id: number;
  name: string;
  description?: string;
  title_template: string;
  description_template?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_hours?: number;
  tags?: string[];
  organization_id: number;
  created_by_id: number;
  created_at: string;
}

export interface CreateTaskTemplate {
  name: string;
  description?: string;
  title_template: string;
  description_template?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  estimated_hours?: number;
  tags?: string[];
}

// Task Activity types
export interface TaskActivity {
  id: number;
  task_id: number;
  user_id: number;
  action: 'created' | 'updated' | 'added' | 'removed' | 'deleted';
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string;
  created_at: string;
}

// Team Management types
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserInvitation {
  id: number;
  email: string;
  role: UserRole;
  token: string;
  invited_by_id: number;
  invited_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export interface CreateInvitation {
  email: string;
  role: UserRole;
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