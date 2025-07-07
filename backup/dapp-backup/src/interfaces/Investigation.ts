// Investigation Management TypeScript Interfaces
// Corresponds to the Rust backend investigation system

export interface Investigation {
  id: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  team_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  investigation_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Evidence {
  id: string;
  investigation_id: string;
  task_id?: string;
  title: string;
  description: string;
  evidence_type: EvidenceType;
  file_path?: string;
  file_hash?: string;
  source_url?: string;
  collected_by: string;
  collected_at: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export type InvestigationStatus = 
  | 'draft' 
  | 'active' 
  | 'on_hold' 
  | 'completed' 
  | 'archived';

export type InvestigationPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'blocked' 
  | 'completed' 
  | 'cancelled';

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type EvidenceType = 
  | 'document' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'network_log' 
  | 'system_log' 
  | 'screenshot' 
  | 'url' 
  | 'other';

// API Request/Response types
export interface CreateInvestigationRequest {
  title: string;
  description: string;
  priority: InvestigationPriority;
  team_id: string;
  metadata?: Record<string, any>;
}

export interface UpdateInvestigationRequest {
  title?: string;
  description?: string;
  status?: InvestigationStatus;
  priority?: InvestigationPriority;
  metadata?: Record<string, any>;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  metadata?: Record<string, any>;
}

export interface CreateEvidenceRequest {
  title: string;
  description: string;
  evidence_type: EvidenceType;
  task_id?: string;
  file_path?: string;
  file_hash?: string;
  source_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEvidenceRequest {
  title?: string;
  description?: string;
  evidence_type?: EvidenceType;
  task_id?: string;
  file_path?: string;
  file_hash?: string;
  source_url?: string;
  metadata?: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Filter and search types
export interface InvestigationFilters {
  status?: InvestigationStatus[];
  priority?: InvestigationPriority[];
  team_id?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface TaskFilters {
  investigation_id?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}

export interface EvidenceFilters {
  investigation_id?: string;
  task_id?: string;
  evidence_type?: EvidenceType[];
  collected_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Real-time collaboration types
export interface CollaborationEvent {
  type: 'investigation_updated' | 'task_updated' | 'evidence_added' | 'user_joined' | 'user_left';
  investigation_id: string;
  user_id: string;
  timestamp: string;
  data: any;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  last_seen?: string;
}

// UI State types
export interface InvestigationViewState {
  activeInvestigation?: Investigation;
  selectedTasks: string[];
  selectedEvidence: string[];
  viewMode: 'grid' | 'list' | 'kanban';
  filters: InvestigationFilters;
  sortBy: 'created_at' | 'updated_at' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface TaskViewState {
  activeTasks: Task[];
  selectedTask?: Task;
  viewMode: 'list' | 'kanban' | 'calendar';
  filters: TaskFilters;
  sortBy: 'created_at' | 'due_date' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface EvidenceViewState {
  activeEvidence: Evidence[];
  selectedEvidence?: Evidence;
  viewMode: 'grid' | 'list' | 'timeline';
  filters: EvidenceFilters;
  sortBy: 'collected_at' | 'created_at' | 'evidence_type';
  sortOrder: 'asc' | 'desc';
}
