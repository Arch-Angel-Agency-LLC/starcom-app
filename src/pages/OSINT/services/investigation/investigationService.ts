/**
 * OSINT Investigation Service
 * 
 * Provides investigation management services for the OSINT module.
 * Handles investigation creation, loading, saving, and sharing.
 */

import { osintApi } from '../api/osintApi';
import osintEndpoints from '../api/endpoints';
import { Investigation } from '../../types/osint';

/**
 * Investigation creation options
 */
export interface CreateInvestigationOptions {
  name: string;
  description?: string;
  tags?: string[];
}

/**
 * Investigation service for OSINT operations
 */
class InvestigationService {
  /**
   * Get all investigations for the current user
   */
  async getInvestigations(): Promise<Investigation[]> {
    try {
      // If in development and no real backend, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockInvestigations();
      }
      
      const result = await osintApi.get<Investigation[]>(osintEndpoints.investigations.list, {
        requiresAuth: true
      });
      
      if (result.success && result.data) {
        return result.data;
      }
      
      throw new Error(result.error || 'Failed to get investigations');
    } catch (error) {
      console.error('Error fetching investigations:', error);
      return [];
    }
  }
  
  /**
   * Get a single investigation by ID
   */
  async getInvestigation(id: string): Promise<Investigation | null> {
    try {
      // If in development and no real backend, return mock data
      if (process.env.NODE_ENV === 'development') {
        const mockInvestigations = this.getMockInvestigations();
        const investigation = mockInvestigations.find(inv => inv.id === id);
        return investigation || null;
      }
      
      const endpoint = osintEndpoints.investigations.get(id);
      const result = await osintApi.get<Investigation>(endpoint, {
        requiresAuth: true
      });
      
      if (result.success && result.data) {
        return result.data;
      }
      
      throw new Error(result.error || 'Failed to get investigation');
    } catch (error) {
      console.error('Error fetching investigation:', error);
      return null;
    }
  }
  
  /**
   * Create a new investigation
   */
  async createInvestigation(options: CreateInvestigationOptions): Promise<Investigation | null> {
    try {
      // If in development and no real backend, return mock data
      if (process.env.NODE_ENV === 'development') {
        const newId = `inv-${Date.now()}`;
        const mockInvestigation: Investigation = {
          id: newId,
          title: options.name,
          description: options.description || '',
          entities: [],
          relationships: [],
          timeline: [],
          searches: [],
          notes: [],
          tags: options.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: 'current-user',
          collaborators: [],
          status: 'active'
        };
        
        return mockInvestigation;
      }
      
      const result = await osintApi.post<Investigation>(osintEndpoints.investigations.create, options, {
        requiresAuth: true
      });
      
      if (result.success && result.data) {
        return result.data;
      }
      
      throw new Error(result.error || 'Failed to create investigation');
    } catch (error) {
      console.error('Error creating investigation:', error);
      return null;
    }
  }
  
  /**
   * Update an existing investigation
   */
  async updateInvestigation(id: string, data: Partial<Investigation>): Promise<boolean> {
    try {
      // If in development and no real backend, return success
      if (process.env.NODE_ENV === 'development') {
        console.log('Mock update investigation:', id, data);
        return true;
      }
      
      const endpoint = osintEndpoints.investigations.update(id);
      const result = await osintApi.put<Investigation>(endpoint, data, {
        requiresAuth: true
      });
      
      return result.success;
    } catch (error) {
      console.error('Error updating investigation:', error);
      return false;
    }
  }
  
  /**
   * Delete an investigation
   */
  async deleteInvestigation(id: string): Promise<boolean> {
    try {
      // If in development and no real backend, return success
      if (process.env.NODE_ENV === 'development') {
        console.log('Mock delete investigation:', id);
        return true;
      }
      
      const endpoint = osintEndpoints.investigations.delete(id);
      const result = await osintApi.delete(endpoint, {
        requiresAuth: true
      });
      
      return result.success;
    } catch (error) {
      console.error('Error deleting investigation:', error);
      return false;
    }
  }
  
  /**
   * Export an investigation as a JSON file
   */
  async exportInvestigation(id: string): Promise<Blob | null> {
    try {
      // If in development and no real backend, create a mock export
      if (process.env.NODE_ENV === 'development') {
        const mockInvestigations = this.getMockInvestigations();
        const investigation = mockInvestigations.find(inv => inv.id === id);
        
        if (!investigation) {
          return null;
        }
        
        const json = JSON.stringify(investigation, null, 2);
        return new Blob([json], { type: 'application/json' });
      }
      
      const endpoint = osintEndpoints.investigations.export(id);
      const response = await fetch(`${osintApi.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${osintApi.authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting investigation:', error);
      return null;
    }
  }
  
  /**
   * Generate mock investigations for development
   */
  private getMockInvestigations(): Investigation[] {
    return [
      {
        id: 'inv-1',
        title: 'Deep Space Anomaly Investigation',
        description: 'Analysis of anomalous signals detected near Alpha Centauri',
        entities: [],
        relationships: [],
        timeline: [],
        searches: [],
        notes: [],
        tags: ['space', 'signals', 'alpha-centauri'],
        createdAt: '2025-06-15T08:30:00Z',
        updatedAt: '2025-07-01T14:22:00Z',
        owner: 'current-user',
        collaborators: [],
        status: 'active'
      },
      {
        id: 'inv-2',
        title: 'Mars Colony Security Review',
        description: 'Security assessment of Mars Colony infrastructure and communications',
        entities: [],
        relationships: [],
        timeline: [],
        searches: [],
        notes: [],
        tags: ['mars', 'security', 'infrastructure'],
        createdAt: '2025-06-10T11:45:00Z',
        updatedAt: '2025-06-30T09:12:00Z',
        owner: 'current-user',
        collaborators: ['user-2', 'user-3'],
        status: 'active'
      },
      {
        id: 'inv-3',
        title: 'Quantum Communication Breach',
        description: 'Investigation into potential breach of quantum communication network',
        entities: [],
        relationships: [],
        timeline: [],
        searches: [],
        notes: [],
        tags: ['quantum', 'breach', 'communication'],
        createdAt: '2025-05-22T16:20:00Z',
        updatedAt: '2025-06-15T13:45:00Z',
        owner: 'current-user',
        collaborators: [],
        status: 'archived'
      }
    ];
  }
}

// Create singleton instance
export const investigationService = new InvestigationService();

// Export types
export type { CreateInvestigationOptions };
