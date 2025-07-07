/**
 * OSINT API Client
 * 
 * Base client for all OSINT API operations. Handles authentication,
 * request formatting, error handling, and response parsing.
 */

import { ErrorDetail, ErrorCategory, ErrorCode, createErrorDetail } from '../../types/errors';

// Fetch options with appropriate headers and auth
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  timeout?: number; // Request timeout in milliseconds
}

// Base API response format
interface ApiResponse<T> {
  data?: T;
  error?: string;
  errorDetail?: ErrorDetail;
  status: number;
  success: boolean;
}

/**
 * OSINT API client for making requests to external and internal data sources
 */
class OsintApiClient {
  private baseUrl: string;
  private authToken?: string;
  
  constructor(baseUrl: string = '/api/osint') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Set authentication token for authenticated requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }
  
  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = undefined;
  }
  
  /**
   * Map HTTP status code to error code
   */
  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400: return 'INVALID_DATA';
      case 401: return 'AUTHENTICATION_REQUIRED';
      case 403: return 'PERMISSION_DENIED';
      case 404: return 'DATA_NOT_FOUND';
      case 408: return 'REQUEST_TIMEOUT';
      case 429: return 'RATE_LIMITED';
      case 500: return 'SERVER_ERROR';
      case 502:
      case 503:
      case 504: return 'SERVICE_UNAVAILABLE';
      default: return 'API_ERROR';
    }
  }
  
  /**
   * Map HTTP status code to error category
   */
  private mapHttpStatusToErrorCategory(status: number): ErrorCategory {
    if (status >= 400 && status < 500) {
      if (status === 401 || status === 403) return 'authentication';
      if (status === 404) return 'data';
      if (status === 408) return 'timeout';
      if (status === 429) return 'api';
      return 'client';
    } else if (status >= 500) {
      return 'server';
    } else {
      return 'unknown';
    }
  }
  
  /**
   * Make a request to the API
   */
  async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { requiresAuth = false, timeout = 30000, ...fetchOptions } = options;
    
    // Build request headers
    const headers = new Headers(fetchOptions.headers);
    headers.set('Content-Type', 'application/json');
    
    // Add auth token if required and available
    if (requiresAuth && this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    } else if (requiresAuth && !this.authToken) {
      const errorDetail = createErrorDetail('Authentication required for this operation', {
        code: 'AUTHENTICATION_REQUIRED',
        category: 'authentication',
        severity: 'error',
        operation: 'API request',
        component: 'osintApi',
        recoverable: true,
        retryable: false,
        userActions: ['Log in to continue', 'Try again later']
      });
      
      return {
        error: 'Authentication required for this operation',
        errorDetail,
        status: 401,
        success: false
      };
    }
    
    // Build request URL
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Make the request with abort signal
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check for HTTP errors
      if (!response.ok) {
        let errorMessage: string;
        
        // Try to parse error response as JSON
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `HTTP Error ${response.status}`;
        } catch {
          // If not JSON, get as text
          errorMessage = await response.text() || `HTTP Error ${response.status}`;
        }
        
        // Create error detail
        const errorDetail = createErrorDetail(errorMessage, {
          code: this.mapHttpStatusToErrorCode(response.status),
          category: this.mapHttpStatusToErrorCategory(response.status),
          severity: response.status >= 500 ? 'error' : 'warning',
          operation: 'API request',
          component: 'osintApi',
          context: {
            url,
            method: fetchOptions.method || 'GET',
            status: response.status,
            statusText: response.statusText,
            errorData: null
          },
          recoverable: response.status < 500,
          retryable: response.status !== 400 && response.status !== 401 && response.status !== 403,
          retryAfter: response.headers.get('Retry-After') ? 
            parseInt(response.headers.get('Retry-After') || '0') * 1000 : 
            undefined
        });
        
        return {
          error: errorMessage,
          errorDetail,
          status: response.status,
          success: false
        };
      }
      
      // Parse response as JSON
      const data = await response.json();
      
      return {
        data,
        status: response.status,
        success: true
      };
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Handle AbortError (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        const errorDetail = createErrorDetail('Request timed out', {
          code: 'REQUEST_TIMEOUT',
          category: 'timeout',
          severity: 'warning',
          operation: 'API request',
          component: 'osintApi',
          context: {
            url,
            method: fetchOptions.method || 'GET',
            timeout
          },
          recoverable: true,
          retryable: true,
          retryAfter: 5000, // Suggest waiting 5 seconds before retry
        });
        
        return {
          error: `Request timed out after ${timeout}ms`,
          errorDetail,
          status: 408,
          success: false
        };
      }
      
      // Handle network errors and other exceptions
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetail = createErrorDetail(errorMessage, {
        code: 'UNEXPECTED_ERROR',
        category: error instanceof TypeError && errorMessage.includes('network') ? 
          'network' : 'unknown',
        severity: 'error',
        operation: 'API request',
        component: 'osintApi',
        context: {
          url,
          method: fetchOptions.method || 'GET',
          error: error instanceof Error ? error.toString() : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        recoverable: true,
        retryable: true
      });
      
      return {
        error: errorMessage,
        errorDetail,
        status: 0,
        success: false
      };
    }
  }
  
  /**
   * GET request helper
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options
    });
  }
  
  /**
   * POST request helper
   */
  async post<T>(endpoint: string, data: Record<string, unknown>, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }
  
  /**
   * PUT request helper
   */
  async put<T>(endpoint: string, data: Record<string, unknown>, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }
  
  /**
   * DELETE request helper
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options
    });
  }
  
  /**
   * PATCH request helper
   */
  async patch<T>(endpoint: string, data: Record<string, unknown>, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  }
}

// Create and export a singleton instance
export const osintApi = new OsintApiClient();

// Export types for use in other files
export type { ApiResponse, RequestOptions };
