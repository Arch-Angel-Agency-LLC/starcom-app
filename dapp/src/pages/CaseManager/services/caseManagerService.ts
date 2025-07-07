/**
 * Case Manager Service
 * 
 * Provides case management functionality.
 * Handles case data, filtering, and CRUD operations.
 */

import { 
  Case, 
  CaseStatus, 
  CasePriority, 
  ClassificationLevel,
  CaseData,
  CaseFilter,
  CaseNote,
  CaseAttachment
} from '../types/cases';

// Simulation utilities for development (to be replaced with actual API calls)

// Simulate case data
function simulateCaseData(filter: CaseFilter = {}): CaseData {
  const cases: Case[] = [];
  
  // Generate mock cases
  for (let i = 0; i < 20; i++) {
    const caseId = `case-${i + 1}`;
    const now = new Date();
    const createdDate = new Date(now);
    createdDate.setDate(now.getDate() - Math.floor(Math.random() * 60));
    
    const updatedDate = new Date(createdDate);
    updatedDate.setDate(createdDate.getDate() + Math.floor(Math.random() * 30));
    
    const status: CaseStatus = ['active', 'pending', 'closed', 'archived'][Math.floor(Math.random() * 4)] as CaseStatus;
    const priority: CasePriority = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as CasePriority;
    const classification: ClassificationLevel = 
      ['unclassified', 'restricted', 'confidential', 'secret', 'top-secret'][Math.floor(Math.random() * 5)] as ClassificationLevel;
    
    const tags = [
      'cyber', 'financial', 'terrorism', 'espionage', 'intelligence', 'counterintelligence',
      'surveillance', 'sabotage', 'technology', 'space', 'maritime', 'military'
    ];
    
    const caseTags = Array.from(
      { length: Math.floor(Math.random() * 4) + 1 },
      () => tags[Math.floor(Math.random() * tags.length)]
    );
    
    // Create a mock case
    cases.push({
      id: caseId,
      title: `Earth Alliance ${tags[Math.floor(Math.random() * tags.length)]} operation ${i + 1}`,
      description: `Investigation into ${priority} priority ${tags[Math.floor(Math.random() * tags.length)]} activities.`,
      status,
      priority,
      classification,
      created: createdDate.toISOString(),
      updated: updatedDate.toISOString(),
      assignedTo: [`user-${Math.floor(Math.random() * 10) + 1}`],
      tags: [...new Set(caseTags)],
      relatedCases: i > 0 ? [`case-${Math.floor(Math.random() * i) + 1}`] : undefined,
      evidenceItems: Array.from(
        { length: Math.floor(Math.random() * 5) },
        (_, idx) => `evidence-${i}-${idx + 1}`
      ),
      timelineEvents: Array.from(
        { length: Math.floor(Math.random() * 8) },
        () => `event-${Math.floor(Math.random() * 100) + 1}`
      ),
      notes: generateMockNotes(i),
      attachments: generateMockAttachments(i)
    });
  }
  
  // Apply filters
  let filteredCases = [...cases];
  
  if (filter.status?.length) {
    filteredCases = filteredCases.filter(c => filter.status!.includes(c.status));
  }
  
  if (filter.priority?.length) {
    filteredCases = filteredCases.filter(c => filter.priority!.includes(c.priority));
  }
  
  if (filter.classification?.length) {
    filteredCases = filteredCases.filter(c => filter.classification!.includes(c.classification));
  }
  
  if (filter.tags?.length) {
    filteredCases = filteredCases.filter(c => 
      c.tags && c.tags.some(tag => filter.tags!.includes(tag))
    );
  }
  
  if (filter.assignedTo?.length) {
    filteredCases = filteredCases.filter(c => 
      c.assignedTo && c.assignedTo.some(user => filter.assignedTo!.includes(user))
    );
  }
  
  if (filter.dateRange?.start) {
    filteredCases = filteredCases.filter(c => 
      new Date(c.created) >= new Date(filter.dateRange!.start!)
    );
  }
  
  if (filter.dateRange?.end) {
    filteredCases = filteredCases.filter(c => 
      new Date(c.created) <= new Date(filter.dateRange!.end!)
    );
  }
  
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filteredCases = filteredCases.filter(c => 
      c.title.toLowerCase().includes(searchLower) || 
      c.description.toLowerCase().includes(searchLower) ||
      (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  }
  
  // Sort by updated date (newest first)
  filteredCases.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
  
  return {
    cases: filteredCases,
    totalCount: filteredCases.length,
    page: 1,
    pageSize: 20,
    availableTags: [...new Set(cases.flatMap(c => c.tags || []))]
  };
}

// Generate mock notes
function generateMockNotes(caseIndex: number): CaseNote[] {
  const noteCount = Math.floor(Math.random() * 5);
  const notes: CaseNote[] = [];
  
  for (let i = 0; i < noteCount; i++) {
    const now = new Date();
    const createdDate = new Date(now);
    createdDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
    
    notes.push({
      id: `note-${caseIndex}-${i}`,
      text: `Case investigation note ${i + 1}. This is a simulated note for testing purposes.`,
      created: createdDate.toISOString(),
      author: `user-${Math.floor(Math.random() * 10) + 1}`,
      isPrivate: Math.random() > 0.7
    });
  }
  
  return notes;
}

// Generate mock attachments
function generateMockAttachments(caseIndex: number): CaseAttachment[] {
  const attachmentCount = Math.floor(Math.random() * 3);
  const attachments: CaseAttachment[] = [];
  
  const fileTypes = [
    { ext: 'pdf', mime: 'application/pdf' },
    { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { ext: 'jpg', mime: 'image/jpeg' },
    { ext: 'png', mime: 'image/png' }
  ];
  
  for (let i = 0; i < attachmentCount; i++) {
    const now = new Date();
    const uploadedDate = new Date(now);
    uploadedDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
    
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    
    attachments.push({
      id: `attachment-${caseIndex}-${i}`,
      name: `evidence-file-${i + 1}.${fileType.ext}`,
      type: fileType.mime,
      size: Math.floor(Math.random() * 10000000),
      uploaded: uploadedDate.toISOString(),
      uploadedBy: `user-${Math.floor(Math.random() * 10) + 1}`,
      url: `/api/cases/${caseIndex}/attachments/${i}`,
      isEncrypted: Math.random() > 0.5
    });
  }
  
  return attachments;
}

// Case Manager Service API
export const caseManagerService = {
  /**
   * Get case data based on filter criteria
   */
  async getCases(filter: CaseFilter = {}): Promise<CaseData> {
    try {
      // Simulation data for development
      return simulateCaseData(filter);
    } catch (error) {
      console.error('Case Manager API error:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific case by ID
   */
  async getCase(caseId: string): Promise<Case> {
    try {
      // For now, get all cases and find the requested one
      const { cases } = await this.getCases();
      const foundCase = cases.find(c => c.id === caseId);
      
      if (!foundCase) {
        throw new Error(`Case not found: ${caseId}`);
      }
      
      return foundCase;
    } catch (error) {
      console.error('Case Manager API error:', error);
      throw error;
    }
  },
  
  /**
   * Create a new case
   */
  async createCase(caseData: Omit<Case, 'id' | 'created' | 'updated'>): Promise<Case> {
    try {
      // In a real implementation, this would make an API call
      const newCase: Case = {
        ...caseData,
        id: `case-${Date.now()}`,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      return newCase;
    } catch (error) {
      console.error('Case Manager API error:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing case
   */
  async updateCase(caseId: string, caseData: Partial<Case>): Promise<Case> {
    try {
      // In a real implementation, this would make an API call
      const existingCase = await this.getCase(caseId);
      
      const updatedCase: Case = {
        ...existingCase,
        ...caseData,
        updated: new Date().toISOString()
      };
      
      return updatedCase;
    } catch (error) {
      console.error('Case Manager API error:', error);
      throw error;
    }
  },
  
  /**
   * Delete a case
   */
  async deleteCase(caseId: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call
      // using the caseId parameter to identify which case to delete
      console.log(`Deleting case with ID: ${caseId}`);
      return true;
    } catch (error) {
      console.error('Case Manager API error:', error);
      throw error;
    }
  }
};

// Export types for consumers
export type { CaseData, CaseFilter, Case };
