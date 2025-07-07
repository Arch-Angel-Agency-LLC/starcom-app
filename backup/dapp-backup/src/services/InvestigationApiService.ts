// Investigation API Service
// Handles all HTTP communications with the AI Security RelayNode backend

import {
  Investigation,
  Task,
  Evidence,
  CreateInvestigationRequest,
  UpdateInvestigationRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateEvidenceRequest,
  UpdateEvidenceRequest,
  ApiResponse,
  PaginatedResponse,
  InvestigationFilters,
  TaskFilters,
  EvidenceFilters,
  EvidenceType,
} from '../interfaces/Investigation';
import { secureLogger } from '../security/logging/SecureLogger';
import { inputValidator } from '../utils/inputValidation';
import { rateLimiter, resourceMonitor } from '../utils/rateLimiting';

// Backend Evidence format (different from frontend)
interface BackendEvidence {
  id: string;
  investigation_id: string;
  task_id?: string;
  title?: string;
  description?: string;
  evidence_type: string;
  source: string;
  content: string;
  hash?: string;
  file_path?: string;
  source_url?: string;
  collected_by?: string;
  collected_at: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

class InvestigationApiService {
  private baseUrl: string;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  
  // Memory management constants
  private readonly MAX_RECORDS_PER_REQUEST = 100; // Prevent memory exhaustion
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_CACHE_SIZE = 50; // Maximum cached responses
  private readonly MEMORY_THRESHOLD_MB = 100; // Alert if memory exceeds 100MB
  
  // Simple LRU cache for API responses
  private responseCache = new Map<string, { data: unknown; timestamp: number }>();

  constructor() {
    // Use the AI Security RelayNode backend URL
    this.baseUrl = 'http://127.0.0.1:8081/api/v1';
    
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  // Get client identifier for rate limiting
  private getClientIdentifier(): string {
    // Use combination of IP, user agent, and session info
    const userAgent = navigator.userAgent;
    const sessionInfo = sessionStorage.getItem('session_id') || 'anonymous';
    
    // Create a simple hash for identification
    const identifier = `${userAgent.substring(0, 50)}_${sessionInfo}`;
    return btoa(identifier).substring(0, 32);
  }

  // Helper method for making HTTP requests with security enhancements
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Rate limiting check
    const clientId = this.getClientIdentifier();
    const rateLimitResult = rateLimiter.checkRateLimit(clientId, 'api');
    
    if (!rateLimitResult.allowed) {
      secureLogger.logAuditEvent(
        'rateLimitExceeded',
        clientId.substring(0, 8) + '...',
        'FAILURE',
        { 
          component: 'InvestigationApiService',
          classification: 'CONFIDENTIAL'
        },
        {
          endpoint: this.sanitizeForLog(endpoint),
          remaining: rateLimitResult.remaining
        }
      );
      
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    // Monitor resource usage
    resourceMonitor.recordConnection();

    try {
      // Input validation
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid endpoint provided');
      }

      // Sanitize endpoint to prevent path traversal
      const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
      
      // Add authentication and security headers
      const secureHeaders = await this.getSecureHeaders();
      
      // Add request timeout and abort controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT); // 30 second timeout

      const response = await fetch(`${this.baseUrl}${sanitizedEndpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...secureHeaders,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      resourceMonitor.recordDisconnection();

      // Record successful request for rate limiting
      rateLimiter.recordRequest(clientId, response.ok, endpoint, 'api');

      if (!response.ok) {
        // Don't expose internal error details
        const errorMessage = this.getSafeErrorMessage(response.status);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      resourceMonitor.recordDisconnection();
      
      // Record failed request for rate limiting
      rateLimiter.recordRequest(clientId, false, endpoint, 'api');

      // Check if this is a connection error (backend not running)
      const isConnectionError = error instanceof Error && 
        (error.message.includes('fetch') || 
         error.message.includes('ERR_CONNECTION_REFUSED') ||
         error.name === 'TypeError');

      // Only log non-connection errors to reduce noise when backend is offline
      if (!isConnectionError) {
        secureLogger.log('error', 'API request failed', {
          endpoint: this.sanitizeForLog(endpoint),
          status: 'error',
          timestamp: new Date().toISOString()
        }, { component: 'InvestigationAPI' });
      }
      
      return {
        success: false,
        error: isConnectionError ? 
          'Investigation API unavailable' : 
          (error instanceof Error ? this.getSafeErrorMessage(error.message) : 'Request failed'),
      };
    }
  }

  // Sanitize endpoint to prevent path traversal attacks
  private sanitizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/\.\./g, '') // Remove path traversal attempts
      .replace(/[<>"/\\]/g, '') // Remove potentially dangerous characters
      .replace(/\/{2,}/g, '/'); // Normalize multiple slashes
  }

  // Get secure headers including authentication
  private async getSecureHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Content-Type-Options': 'nosniff',
    };

    // Add authentication token if available
    const authToken = await this.getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Add CSRF protection
    const csrfToken = this.getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }

  // Get authentication token securely
  private async getAuthToken(): Promise<string | null> {
    try {
      // Get from secure storage (not localStorage for sensitive tokens)
      // TODO: Integrate with actual auth system
      const sessionToken = sessionStorage.getItem('auth-session');
      return sessionToken;
    } catch {
      return null;
    }
  }

  // Get CSRF token
  private getCSRFToken(): string | null {
    // Generate or retrieve CSRF token
    let csrfToken = sessionStorage.getItem('csrf-token');
    if (!csrfToken) {
      csrfToken = this.generateCSRFToken();
      sessionStorage.setItem('csrf-token', csrfToken);
    }
    return csrfToken;
  }

  // Generate secure CSRF token
  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Get safe error messages without exposing internals
  private getSafeErrorMessage(statusOrMessage: number | string): string {
    if (typeof statusOrMessage === 'number') {
      switch (statusOrMessage) {
        case 400: return 'Invalid request';
        case 401: return 'Authentication required';
        case 403: return 'Access denied';
        case 404: return 'Resource not found';
        case 429: return 'Too many requests';
        case 500: return 'Service temporarily unavailable';
        default: return 'Request failed';
      }
    }
    
    // For string messages, sanitize to prevent information disclosure
    return 'Request failed';
  }

  // Sanitize data for logging
  private sanitizeForLog(data: unknown): string {
    if (typeof data === 'string') {
      // Remove potential sensitive patterns
      return data.replace(/[a-zA-Z0-9]{20,}/g, '[ID]'); // Replace long IDs
    }
    return '[DATA]';
  }

  // Input validation methods
  private validateId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    // Allow alphanumeric, hyphens, and underscores, reasonable length
    return /^[a-zA-Z0-9_-]{1,50}$/.test(id);
  }

  // Investigation CRUD operations with comprehensive input validation
  async createInvestigation(data: CreateInvestigationRequest): Promise<ApiResponse<Investigation>> {
    // Comprehensive input validation using validation utility
    const validationResult = inputValidator.validateObject(
      data as unknown as Record<string, unknown>, 
      inputValidator.getInvestigationSchema()
    );
    
    if (!validationResult.isValid) {
      secureLogger.logAuditEvent(
        'createInvestigation', 
        'system',
        'FAILURE',
        { 
          component: 'InvestigationApiService',
          classification: 'CONFIDENTIAL'
        },
        { errors: validationResult.errors }
      );
      
      return {
        success: false,
        error: `Validation failed: ${validationResult.errors.join(', ')}`
      };
    }

    // Use sanitized data from validator
    const sanitizedData = validationResult.sanitized as CreateInvestigationRequest;
    
    return this.makeRequest<Investigation>('/investigations', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
  }

  async getInvestigation(id: string): Promise<ApiResponse<Investigation>> {
    if (!this.validateId(id)) {
      return {
        success: false,
        error: 'Invalid investigation ID'
      };
    }

    return this.makeRequest<Investigation>(`/investigations/${encodeURIComponent(id)}`);
  }

  async listInvestigations(
    filters: InvestigationFilters = {},
    page: number = 1,
    perPage: number = this.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResponse<Investigation>> {
    // Validate and enforce pagination limits to prevent memory exhaustion
    const validatedParams = this.validatePaginationParams(page, perPage);
    
    const params = new URLSearchParams({
      page: validatedParams.page.toString(),
      per_page: validatedParams.perPage.toString(),
      ...this.buildFilterParams(filters),
    });

    // Check cache first
    const cacheKey = this.getCacheKey(`/investigations?${params}`);
    const cachedResult = this.getFromCache<PaginatedResponse<Investigation>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await fetch(`${this.baseUrl}/investigations?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Cache successful responses
      if (result.success) {
        this.setCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('API Error (list investigations):', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: validatedParams.page,
        per_page: validatedParams.perPage,
        total_pages: 0,
      };
    }
  }

  async updateInvestigation(
    id: string,
    data: UpdateInvestigationRequest
  ): Promise<ApiResponse<Investigation>> {
    return this.makeRequest<Investigation>(`/investigations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvestigation(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/investigations/${id}`, {
      method: 'DELETE',
    });
  }

  // Task CRUD operations with validation
  async createTask(investigationId: string, data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    // Validate investigation ID
    if (!this.validateId(investigationId)) {
      return {
        success: false,
        error: 'Invalid investigation ID'
      };
    }

    // Validate task data
    const validationResult = inputValidator.validateObject(
      data as unknown as Record<string, unknown>, 
      inputValidator.getTaskSchema()
    );
    
    if (!validationResult.isValid) {
      secureLogger.logAuditEvent(
        'createTask',
        'system',
        'FAILURE',
        { 
          component: 'InvestigationApiService',
          classification: 'CONFIDENTIAL'
        },
        { errors: validationResult.errors, investigationId }
      );
      
      return {
        success: false,
        error: `Task validation failed: ${validationResult.errors.join(', ')}`
      };
    }

    const sanitizedData = validationResult.sanitized as CreateTaskRequest;
    
    return this.makeRequest<Task>(`/investigations/${encodeURIComponent(investigationId)}/tasks`, {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
  }

  async getTask(investigationId: string, taskId: string): Promise<ApiResponse<Task>> {
    return this.makeRequest<Task>(`/investigations/${investigationId}/tasks/${taskId}`);
  }

  async listTasks(
    investigationId: string,
    filters: TaskFilters = {},
    page: number = 1,
    perPage: number = this.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResponse<Task>> {
    // Validate and enforce pagination limits
    const validatedParams = this.validatePaginationParams(page, perPage);
    
    const params = new URLSearchParams({
      page: validatedParams.page.toString(),
      per_page: validatedParams.perPage.toString(),
      ...this.buildFilterParams(filters),
    });

    // Check cache first
    const cacheKey = this.getCacheKey(`/investigations/${investigationId}/tasks?${params}`);
    const cachedResult = this.getFromCache<PaginatedResponse<Task>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await fetch(`${this.baseUrl}/investigations/${investigationId}/tasks?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Cache successful responses
      if (result.success) {
        this.setCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('API Error (list tasks):', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: validatedParams.page,
        per_page: validatedParams.perPage,
        total_pages: 0,
      };
    }
  }

  async updateTask(
    investigationId: string,
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<ApiResponse<Task>> {
    return this.makeRequest<Task>(`/investigations/${investigationId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(investigationId: string, taskId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/investigations/${investigationId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Evidence CRUD operations with validation
  async createEvidence(investigationId: string, data: CreateEvidenceRequest): Promise<ApiResponse<Evidence>> {
    // Validate investigation ID
    if (!this.validateId(investigationId)) {
      return {
        success: false,
        error: 'Invalid investigation ID'
      };
    }

    // Validate evidence data
    const validationResult = inputValidator.validateObject(
      data as unknown as Record<string, unknown>, 
      inputValidator.getEvidenceSchema()
    );
    
    if (!validationResult.isValid) {
      secureLogger.logAuditEvent(
        'createEvidence',
        'system',
        'FAILURE',
        { 
          component: 'InvestigationApiService',
          classification: 'CONFIDENTIAL'
        },
        { errors: validationResult.errors, investigationId }
      );
      
      return {
        success: false,
        error: `Evidence validation failed: ${validationResult.errors.join(', ')}`
      };
    }

    const sanitizedData = validationResult.sanitized as CreateEvidenceRequest;
    
    return this.makeRequest<Evidence>(`/investigations/${encodeURIComponent(investigationId)}/evidence`, {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
  }

  async getEvidence(investigationId: string, evidenceId: string): Promise<ApiResponse<Evidence>> {
    return this.makeRequest<Evidence>(`/investigations/${investigationId}/evidence/${evidenceId}`);
  }

  // Evidence format mapping - Backend uses different field names
  private mapBackendEvidenceToFrontend(backendEvidence: BackendEvidence): Evidence {
    return {
      id: backendEvidence.id,
      investigation_id: backendEvidence.investigation_id,
      task_id: backendEvidence.task_id,
      title: backendEvidence.title || 'Evidence Item',
      description: backendEvidence.description || backendEvidence.content || '',
      evidence_type: backendEvidence.evidence_type as EvidenceType,
      file_path: backendEvidence.file_path,
      file_hash: backendEvidence.hash,
      source_url: backendEvidence.source_url,
      collected_by: backendEvidence.collected_by || 'system',
      collected_at: backendEvidence.collected_at,
      created_at: backendEvidence.created_at || backendEvidence.collected_at,
      metadata: {
        ...backendEvidence.metadata,
        source: backendEvidence.source,
        content: backendEvidence.content,
      },
    };
  }

  async listEvidence(
    investigationId: string,
    filters: EvidenceFilters = {},
    page: number = 1,
    perPage: number = this.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResponse<Evidence>> {
    // Validate and enforce pagination limits
    const validatedParams = this.validatePaginationParams(page, perPage);
    
    const params = new URLSearchParams({
      page: validatedParams.page.toString(),
      per_page: validatedParams.perPage.toString(),
      ...this.buildFilterParams(filters),
    });

    // Check cache first
    const cacheKey = this.getCacheKey(`/investigations/${investigationId}/evidence?${params}`);
    const cachedResult = this.getFromCache<PaginatedResponse<Evidence>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await fetch(`${this.baseUrl}/investigations/${investigationId}/evidence?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // Map backend evidence format to frontend format
      if (result.success && result.data) {
        result.data = result.data.map((item: BackendEvidence) => this.mapBackendEvidenceToFrontend(item));
      }
      
      // Cache successful responses
      if (result.success) {
        this.setCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('API Error (list evidence):', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: validatedParams.page,
        per_page: validatedParams.perPage,
        total_pages: 0,
      };
    }
  }

  async updateEvidence(
    investigationId: string,
    evidenceId: string,
    data: UpdateEvidenceRequest
  ): Promise<ApiResponse<Evidence>> {
    return this.makeRequest<Evidence>(`/investigations/${investigationId}/evidence/${evidenceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvidence(investigationId: string, evidenceId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/investigations/${investigationId}/evidence/${evidenceId}`, {
      method: 'DELETE',
    });
  }

  // Helper methods
  private buildFilterParams(filters: InvestigationFilters | TaskFilters | EvidenceFilters): Record<string, string> {
    const params: Record<string, string> = {};
    
    Object.keys(filters).forEach(key => {
      const value = (filters as Record<string, unknown>)[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params[key] = value.join(',');
        } else {
          params[key] = value.toString();
        }
      }
    });

    return params;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }

  // Secure WebSocket connection for real-time updates
  createWebSocketConnection(investigationId: string): WebSocket | null {
    try {
      // Validate investigation ID
      if (!this.validateId(investigationId)) {
        secureLogger.log('error', 'Invalid investigation ID for WebSocket connection', null, { 
          component: 'InvestigationAPI' 
        });
        return null;
      }

      // Use secure WebSocket URL
      const wsUrl = `wss://localhost:8080/ws/investigations/${encodeURIComponent(investigationId)}`;
      const ws = new WebSocket(wsUrl);

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          secureLogger.log('warn', 'WebSocket connection timeout', null, { 
            component: 'InvestigationAPI' 
          });
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        secureLogger.log('info', 'WebSocket connected', { 
          investigationId: this.sanitizeForLog(investigationId)
        }, { component: 'InvestigationAPI' });
        
        // Send authentication if available
        this.authenticateWebSocket(ws);
      };

      ws.onerror = () => {
        clearTimeout(connectionTimeout);
        secureLogger.log('error', 'WebSocket error', {
          investigationId: this.sanitizeForLog(investigationId)
        }, { component: 'InvestigationAPI' });
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        secureLogger.log('info', 'WebSocket disconnected', {
          investigationId: this.sanitizeForLog(investigationId),
          code: event.code
        }, { component: 'InvestigationAPI' });
      };

      // Add message validation
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.validateWebSocketMessage(data)) {
            // Message is valid, can be processed
            // TODO: Add message handling logic
          } else {
            secureLogger.log('warn', 'Invalid WebSocket message received', null, { 
              component: 'InvestigationAPI' 
            });
          }
        } catch {
          secureLogger.log('error', 'WebSocket message parsing failed', null, { 
            component: 'InvestigationAPI' 
          });
        }
      };

      return ws;
    } catch {
      secureLogger.log('error', 'Failed to create WebSocket connection', null, { 
        component: 'InvestigationAPI' 
      });
      return null;
    }
  }

  // Authenticate WebSocket connection
  private async authenticateWebSocket(ws: WebSocket): Promise<void> {
    try {
      const authToken = await this.getAuthToken();
      if (authToken && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'auth',
          token: authToken,
          timestamp: Date.now()
        }));
      }
    } catch {
      secureLogger.log('error', 'WebSocket authentication failed', null, { 
        component: 'InvestigationAPI' 
      });
    }
  }

  // Validate WebSocket messages
  private validateWebSocketMessage(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const message = data as Record<string, unknown>;
    
    // Must have a type field
    if (!message.type || typeof message.type !== 'string') return false;
    
    // Validate allowed message types
    const allowedTypes = ['update', 'notification', 'status', 'auth_response'];
    if (!allowedTypes.includes(message.type)) return false;
    
    return true;
  }

  // Memory management and monitoring methods
  private startMemoryMonitoring(): void {
    // Check memory usage every 30 seconds
    setInterval(() => {
      this.checkMemoryUsage();
      this.cleanupCache();
    }, 30000);
  }

  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      if (memInfo) {
        const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
        
        if (usedMB > this.MEMORY_THRESHOLD_MB) {
          secureLogger.log('warn', 'High memory usage detected', {
            usedMB: Math.round(usedMB),
            totalMB: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
            threshold: this.MEMORY_THRESHOLD_MB
          }, { component: 'InvestigationAPI' });
          
          // Force cache cleanup when memory is high
          this.clearCache();
        }
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    // Remove expired entries
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        this.responseCache.delete(key);
      }
    }
    
    // If cache is still too large, remove oldest entries
    if (this.responseCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.responseCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.responseCache.delete(key));
    }
  }

  private clearCache(): void {
    this.responseCache.clear();
    secureLogger.log('info', 'API response cache cleared', {
      reason: 'memory_management'
    }, { component: 'InvestigationAPI' });
  }

  private getCacheKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.responseCache.get(key);
    if (cached) {
      const now = Date.now();
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for API responses
      
      if (now - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
      } else {
        this.responseCache.delete(key);
      }
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    // Only cache successful responses and limit cache size
    if (this.responseCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.responseCache.keys().next().value;
      if (firstKey) {
        this.responseCache.delete(firstKey);
      }
    }
    
    this.responseCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private validatePaginationParams(page: number, perPage: number): { page: number; perPage: number } {
    // Enforce strict limits to prevent memory exhaustion
    const validatedPage = Math.max(1, Math.floor(page));
    const validatedPerPage = Math.max(1, Math.min(perPage, this.MAX_RECORDS_PER_REQUEST));
    
    if (perPage > this.MAX_RECORDS_PER_REQUEST) {
      secureLogger.log('warn', 'Pagination limit exceeded', {
        requested: perPage,
        enforced: this.MAX_RECORDS_PER_REQUEST,
        page: validatedPage
      }, { component: 'InvestigationAPI' });
    }
    
    return { page: validatedPage, perPage: validatedPerPage };
  }
}

// Export singleton instance
export const investigationApi = new InvestigationApiService();
export default investigationApi;
