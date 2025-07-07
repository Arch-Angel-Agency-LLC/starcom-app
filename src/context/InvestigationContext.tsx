// Investigation Context - State management for the investigation management system
// Implements the "Collaborative Operations Bridge" MVP architecture

import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import {
  Investigation,
  Task,
  Evidence,
  InvestigationViewState,
  TaskViewState,
  EvidenceViewState,
  CollaborationEvent,
  TeamMember,
  CreateInvestigationRequest,
  UpdateInvestigationRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateEvidenceRequest,
  UpdateEvidenceRequest,
} from '../interfaces/Investigation';
import investigationApi from '../services/InvestigationApiService';
import { memoryMonitor } from '../utils/memoryMonitor';

// State interfaces
interface InvestigationState {
  // Data
  investigations: Investigation[];
  activeInvestigation: Investigation | null;
  tasks: Task[];
  evidence: Evidence[];
  teamMembers: TeamMember[];
  
  // UI State
  investigationView: InvestigationViewState;
  taskView: TaskViewState;
  evidenceView: EvidenceViewState;
  
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Real-time collaboration
  collaborationEvents: CollaborationEvent[];
  websocket: WebSocket | null;
}

// Action types
type InvestigationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_INVESTIGATIONS'; payload: Investigation[] }
  | { type: 'SET_ACTIVE_INVESTIGATION'; payload: Investigation | null }
  | { type: 'ADD_INVESTIGATION'; payload: Investigation }
  | { type: 'UPDATE_INVESTIGATION'; payload: Investigation }
  | { type: 'DELETE_INVESTIGATION'; payload: string }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_EVIDENCE'; payload: Evidence[] }
  | { type: 'ADD_EVIDENCE'; payload: Evidence }
  | { type: 'UPDATE_EVIDENCE'; payload: Evidence }
  | { type: 'DELETE_EVIDENCE'; payload: string }
  | { type: 'SET_TEAM_MEMBERS'; payload: TeamMember[] }
  | { type: 'UPDATE_INVESTIGATION_VIEW'; payload: Partial<InvestigationViewState> }
  | { type: 'UPDATE_TASK_VIEW'; payload: Partial<TaskViewState> }
  | { type: 'UPDATE_EVIDENCE_VIEW'; payload: Partial<EvidenceViewState> }
  | { type: 'ADD_COLLABORATION_EVENT'; payload: CollaborationEvent }
  | { type: 'SET_WEBSOCKET'; payload: WebSocket | null };

// Initial state
const initialState: InvestigationState = {
  investigations: [],
  activeInvestigation: null,
  tasks: [],
  evidence: [],
  teamMembers: [
    {
      id: 'user-1',
      name: 'Agent Smith',
      role: 'Lead Investigator',
      status: 'online',
    },
    {
      id: 'user-2', 
      name: 'Agent Johnson',
      role: 'Analyst',
      status: 'away',
    },
    {
      id: 'user-3',
      name: 'Agent Brown',
      role: 'Specialist',
      status: 'offline',
      last_seen: '2024-01-15T10:30:00Z',
    },
  ],
  investigationView: {
    selectedTasks: [],
    selectedEvidence: [],
    viewMode: 'grid',
    filters: {},
    sortBy: 'updated_at',
    sortOrder: 'desc',
  },
  taskView: {
    activeTasks: [],
    viewMode: 'kanban',
    filters: {},
    sortBy: 'priority',
    sortOrder: 'desc',
  },
  evidenceView: {
    activeEvidence: [],
    viewMode: 'grid',
    filters: {},
    sortBy: 'collected_at',
    sortOrder: 'desc',
  },
  isConnected: false,
  isLoading: false,
  error: null,
  collaborationEvents: [
    {
      type: 'user_joined',
      investigation_id: 'test-investigation-1',
      user_id: 'Agent Smith',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      data: {},
    },
    {
      type: 'evidence_added',
      investigation_id: 'test-investigation-1', 
      user_id: 'Agent Johnson',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      data: {},
    },
    {
      type: 'task_updated',
      investigation_id: 'test-investigation-1',
      user_id: 'Agent Brown',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      data: {},
    },
  ],
  websocket: null,
};

// Reducer
function investigationReducer(state: InvestigationState, action: InvestigationAction): InvestigationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_INVESTIGATIONS':
      return { ...state, investigations: action.payload };
    
    case 'SET_ACTIVE_INVESTIGATION':
      return { ...state, activeInvestigation: action.payload };
    
    case 'ADD_INVESTIGATION':
      return { ...state, investigations: [...state.investigations, action.payload] };
    
    case 'UPDATE_INVESTIGATION':
      return {
        ...state,
        investigations: state.investigations.map(inv =>
          inv.id === action.payload.id ? action.payload : inv
        ),
        activeInvestigation: state.activeInvestigation?.id === action.payload.id 
          ? action.payload 
          : state.activeInvestigation,
      };
    
    case 'DELETE_INVESTIGATION':
      return {
        ...state,
        investigations: state.investigations.filter(inv => inv.id !== action.payload),
        activeInvestigation: state.activeInvestigation?.id === action.payload 
          ? null 
          : state.activeInvestigation,
      };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    
    case 'SET_EVIDENCE':
      return { ...state, evidence: action.payload };
    
    case 'ADD_EVIDENCE':
      return { ...state, evidence: [...state.evidence, action.payload] };
    
    case 'UPDATE_EVIDENCE':
      return {
        ...state,
        evidence: state.evidence.map(ev =>
          ev.id === action.payload.id ? action.payload : ev
        ),
      };
    
    case 'DELETE_EVIDENCE':
      return {
        ...state,
        evidence: state.evidence.filter(ev => ev.id !== action.payload),
      };
    
    case 'SET_TEAM_MEMBERS':
      return { ...state, teamMembers: action.payload };
    
    case 'UPDATE_INVESTIGATION_VIEW':
      return {
        ...state,
        investigationView: { ...state.investigationView, ...action.payload },
      };
    
    case 'UPDATE_TASK_VIEW':
      return {
        ...state,
        taskView: { ...state.taskView, ...action.payload },
      };
    
    case 'UPDATE_EVIDENCE_VIEW':
      return {
        ...state,
        evidenceView: { ...state.evidenceView, ...action.payload },
      };
    
    case 'ADD_COLLABORATION_EVENT':
      return {
        ...state,
        collaborationEvents: [...state.collaborationEvents, action.payload].slice(-100), // Keep last 100 events
      };
    
    case 'SET_WEBSOCKET':
      return { ...state, websocket: action.payload };
    
    default:
      return state;
  }
}

// Context interface
interface InvestigationContextType {
  // State
  state: InvestigationState;
  
  // Investigation actions
  loadInvestigations: (page?: number, perPage?: number) => Promise<void>;
  createInvestigation: (data: CreateInvestigationRequest) => Promise<Investigation | null>;
  updateInvestigation: (id: string, data: UpdateInvestigationRequest) => Promise<Investigation | null>;
  deleteInvestigation: (id: string) => Promise<boolean>;
  setActiveInvestigation: (investigation: Investigation | null) => void;
  
  // Task actions
  loadTasks: (investigationId: string) => Promise<void>;
  createTask: (investigationId: string, data: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (investigationId: string, taskId: string, data: UpdateTaskRequest) => Promise<Task | null>;
  deleteTask: (investigationId: string, taskId: string) => Promise<boolean>;
  
  // Evidence actions
  loadEvidence: (investigationId: string) => Promise<void>;
  createEvidence: (investigationId: string, data: CreateEvidenceRequest) => Promise<Evidence | null>;
  updateEvidence: (investigationId: string, evidenceId: string, data: UpdateEvidenceRequest) => Promise<Evidence | null>;
  deleteEvidence: (investigationId: string, evidenceId: string) => Promise<boolean>;
  
  // View state actions
  updateInvestigationView: (updates: Partial<InvestigationViewState>) => void;
  updateTaskView: (updates: Partial<TaskViewState>) => void;
  updateEvidenceView: (updates: Partial<EvidenceViewState>) => void;
  
  // Real-time collaboration
  connectToInvestigation: (investigationId: string) => void;
  disconnectFromInvestigation: () => void;
}

// Create context
const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

// Provider component
export const InvestigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(investigationReducer, initialState);

  // Investigation actions
  const loadInvestigations = useCallback(async (page: number = 1, perPage?: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      // Use memory monitor to determine safe page size
      const safePerPage = perPage || memoryMonitor.getRecommendedPageSize(20, 100);
      
      // Check if we should proceed with the operation
      if (!memoryMonitor.shouldProceedWithLargeOperation()) {
        dispatch({ type: 'SET_ERROR', payload: 'Memory usage too high. Please try again later.' });
        return;
      }
      
      const response = await investigationApi.listInvestigations({}, page, safePerPage);
      if (response.success && response.data) {
        // For first page, replace all investigations; for subsequent pages, append
        if (page === 1) {
          dispatch({ type: 'SET_INVESTIGATIONS', payload: response.data });
        } else {
          // If implementing pagination with append, you'd need a different action type
          // For now, just replace to prevent memory issues
          dispatch({ type: 'SET_INVESTIGATIONS', payload: response.data });
        }
        dispatch({ type: 'SET_CONNECTED', payload: true });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load investigations' });
      }
    } catch (err) {
      console.error('Network error loading investigations:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Network error loading investigations' });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createInvestigation = useCallback(async (data: CreateInvestigationRequest): Promise<Investigation | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const response = await investigationApi.createInvestigation(data);
      if (response.success && response.data) {
        dispatch({ type: 'ADD_INVESTIGATION', payload: response.data });
        return response.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to create investigation' });
        return null;
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Network error creating investigation' });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateInvestigation = useCallback(async (id: string, data: UpdateInvestigationRequest): Promise<Investigation | null> => {
    try {
      const response = await investigationApi.updateInvestigation(id, data);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_INVESTIGATION', payload: response.data });
        return response.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to update investigation' });
        return null;
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Network error updating investigation' });
      return null;
    }
  }, []);

  const deleteInvestigation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await investigationApi.deleteInvestigation(id);
      if (response.success) {
        dispatch({ type: 'DELETE_INVESTIGATION', payload: id });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to delete investigation' });
        return false;
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Network error deleting investigation' });
      return false;
    }
  }, []);

  const setActiveInvestigation = useCallback((investigation: Investigation | null) => {
    dispatch({ type: 'SET_ACTIVE_INVESTIGATION', payload: investigation });
  }, []);

  // Task actions
  const loadTasks = useCallback(async (investigationId: string) => {
    try {
      const response = await investigationApi.listTasks(investigationId);
      if (response.success && response.data) {
        dispatch({ type: 'SET_TASKS', payload: response.data });
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, []);

  const createTask = useCallback(async (investigationId: string, data: CreateTaskRequest): Promise<Task | null> => {
    try {
      const response = await investigationApi.createTask(investigationId, data);
      if (response.success && response.data) {
        dispatch({ type: 'ADD_TASK', payload: response.data });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }, []);

  const updateTask = useCallback(async (investigationId: string, taskId: string, data: UpdateTaskRequest): Promise<Task | null> => {
    try {
      const response = await investigationApi.updateTask(investigationId, taskId, data);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_TASK', payload: response.data });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }, []);

  const deleteTask = useCallback(async (investigationId: string, taskId: string): Promise<boolean> => {
    try {
      const response = await investigationApi.deleteTask(investigationId, taskId);
      if (response.success) {
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }, []);

  // Evidence actions
  const loadEvidence = useCallback(async (investigationId: string) => {
    try {
      const response = await investigationApi.listEvidence(investigationId);
      if (response.success && response.data) {
        dispatch({ type: 'SET_EVIDENCE', payload: response.data });
      }
    } catch (error) {
      console.error('Error loading evidence:', error);
    }
  }, []);

  const createEvidence = useCallback(async (investigationId: string, data: CreateEvidenceRequest): Promise<Evidence | null> => {
    try {
      const response = await investigationApi.createEvidence(investigationId, data);
      if (response.success && response.data) {
        dispatch({ type: 'ADD_EVIDENCE', payload: response.data });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error creating evidence:', error);
      return null;
    }
  }, []);

  const updateEvidence = useCallback(async (investigationId: string, evidenceId: string, data: UpdateEvidenceRequest): Promise<Evidence | null> => {
    try {
      const response = await investigationApi.updateEvidence(investigationId, evidenceId, data);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_EVIDENCE', payload: response.data });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error updating evidence:', error);
      return null;
    }
  }, []);

  const deleteEvidence = useCallback(async (investigationId: string, evidenceId: string): Promise<boolean> => {
    try {
      const response = await investigationApi.deleteEvidence(investigationId, evidenceId);
      if (response.success) {
        dispatch({ type: 'DELETE_EVIDENCE', payload: evidenceId });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting evidence:', error);
      return false;
    }
  }, []);

  // View state actions
  const updateInvestigationView = useCallback((updates: Partial<InvestigationViewState>) => {
    dispatch({ type: 'UPDATE_INVESTIGATION_VIEW', payload: updates });
  }, []);

  const updateTaskView = useCallback((updates: Partial<TaskViewState>) => {
    dispatch({ type: 'UPDATE_TASK_VIEW', payload: updates });
  }, []);

  const updateEvidenceView = useCallback((updates: Partial<EvidenceViewState>) => {
    dispatch({ type: 'UPDATE_EVIDENCE_VIEW', payload: updates });
  }, []);

  // Real-time collaboration
  const connectToInvestigation = useCallback((investigationId: string) => {
    if (state.websocket) {
      state.websocket.close();
    }

    const ws = investigationApi.createWebSocketConnection(investigationId);
    if (ws) {
      ws.onmessage = (event) => {
        try {
          const collaborationEvent: CollaborationEvent = JSON.parse(event.data);
          dispatch({ type: 'ADD_COLLABORATION_EVENT', payload: collaborationEvent });
          
          // Handle real-time updates based on event type
          // This would trigger UI updates, notifications, etc.
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      dispatch({ type: 'SET_WEBSOCKET', payload: ws });
    }
  }, [state.websocket]);

  const disconnectFromInvestigation = useCallback(() => {
    if (state.websocket) {
      state.websocket.close();
      dispatch({ type: 'SET_WEBSOCKET', payload: null });
    }
  }, [state.websocket]);

  // Health check on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await investigationApi.healthCheck();
        dispatch({ type: 'SET_CONNECTED', payload: response.success });
      } catch {
        dispatch({ type: 'SET_CONNECTED', payload: false });
      }
    };

    checkHealth();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.websocket) {
        state.websocket.close();
      }
    };
  }, [state.websocket]);

  const contextValue: InvestigationContextType = {
    state,
    loadInvestigations,
    createInvestigation,
    updateInvestigation,
    deleteInvestigation,
    setActiveInvestigation,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    loadEvidence,
    createEvidence,
    updateEvidence,
    deleteEvidence,
    updateInvestigationView,
    updateTaskView,
    updateEvidenceView,
    connectToInvestigation,
    disconnectFromInvestigation,
  };

  return (
    <InvestigationContext.Provider value={contextValue}>
      {children}
    </InvestigationContext.Provider>
  );
};

export default InvestigationContext;
