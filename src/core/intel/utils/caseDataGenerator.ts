/**
 * Sample case data generator for IntelDataCore
 * 
 * This file provides utilities to generate sample case records
 * for testing and demonstration purposes.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  CaseRecord, 
  CaseStatus,
  CasePriority,
  ClassificationLevel
} from '../types/intelDataModels';
import { caseManagerAdapter } from '../adapters/caseManagerAdapter';

/**
 * Generate a sample case record
 */
export function generateSampleCase(
  index: number, 
  baseDate = new Date(),
  customOptions: Partial<CaseRecord> = {}
): CaseRecord {
  // Create a random date offset (from -30 days to +30 days from baseDate)
  const dayOffset = Math.floor(Math.random() * 60) - 30;
  const startDate = new Date(baseDate);
  startDate.setDate(baseDate.getDate() + dayOffset);
  
  // For some cases, add a due date
  const hasDueDate = Math.random() > 0.3;
  let dueDate;
  if (hasDueDate) {
    const dueDurationDays = Math.floor(Math.random() * 30) + 7; // 7 to 37 days
    dueDate = new Date(startDate);
    dueDate.setDate(startDate.getDate() + dueDurationDays);
  }

  // For some cases, add a closed date
  const isClosed = Math.random() > 0.7;
  let closedDate;
  let status = CaseStatus.OPEN;
  
  if (isClosed) {
    status = CaseStatus.CLOSED;
    const closedDurationDays = Math.floor(Math.random() * 20) + 1; // 1 to 20 days
    closedDate = new Date(startDate);
    closedDate.setDate(startDate.getDate() + closedDurationDays);
  } else {
    // If not closed, pick a random active status
    const activeStatuses = [
      CaseStatus.NEW, 
      CaseStatus.OPEN, 
      CaseStatus.IN_PROGRESS, 
      CaseStatus.PENDING, 
      CaseStatus.RESOLVED
    ];
    status = activeStatuses[Math.floor(Math.random() * activeStatuses.length)];
  }

  // Determine case priority (weighted to have more medium priority cases)
  let priority;
  const priorityRand = Math.random();
  if (priorityRand > 0.9) {
    priority = CasePriority.CRITICAL;
  } else if (priorityRand > 0.7) {
    priority = CasePriority.HIGH;
  } else if (priorityRand > 0.3) {
    priority = CasePriority.MEDIUM;
  } else {
    priority = CasePriority.LOW;
  }
  
  // Generate a random case number (format: CASE-YYYY-NNNN)
  const year = startDate.getFullYear();
  const caseNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const caseNumber = `CASE-${year}-${caseNum}`;

  // Create assignees (1-3 random people)
  const possibleAssignees = [
    'john.doe@example.com',
    'jane.smith@example.com',
    'alex.wong@example.com',
    'sara.johnson@example.com',
    'michael.brown@example.com',
    'olivia.taylor@example.com'
  ];
  
  const assigneeCount = Math.floor(Math.random() * 3) + 1;
  const assignedTo: string[] = [];
  
  for (let i = 0; i < assigneeCount; i++) {
    const randomIndex = Math.floor(Math.random() * possibleAssignees.length);
    if (!assignedTo.includes(possibleAssignees[randomIndex])) {
      assignedTo.push(possibleAssignees[randomIndex]);
    }
  }
  
  // Set a classification level based on priority
  let classification = ClassificationLevel.UNCLASSIFIED;
  if (priority === CasePriority.CRITICAL) {
    classification = ClassificationLevel.SECRET;
  } else if (priority === CasePriority.HIGH) {
    classification = ClassificationLevel.CONFIDENTIAL;
  } else if (priority === CasePriority.MEDIUM) {
    classification = ClassificationLevel.SENSITIVE;
  }

  // Create the case record
  const caseRecord: CaseRecord = {
    id: customOptions.id || uuidv4(),
    type: 'case_record',
    caseNumber: customOptions.caseNumber || caseNumber,
    title: customOptions.title || `Sample Case ${index}`,
    description: customOptions.description || `This is a sample case record ${index} for testing the Case Manager module.`,
    status: customOptions.status || status,
    priority: customOptions.priority || priority,
    assignedTo: customOptions.assignedTo || assignedTo,
    startDate: customOptions.startDate || startDate.toISOString(),
    dueDate: customOptions.dueDate || (dueDate ? dueDate.toISOString() : undefined),
    closedDate: customOptions.closedDate || (closedDate ? closedDate.toISOString() : undefined),
    relatedEntities: customOptions.relatedEntities || [],
    relatedCases: customOptions.relatedCases || [],
    classification: customOptions.classification || classification,
    createdAt: customOptions.createdAt || new Date().toISOString(),
    updatedAt: customOptions.updatedAt || new Date().toISOString(),
    createdBy: customOptions.createdBy || 'sample_generator',
    metadata: customOptions.metadata || {
      source: 'sample_generator',
      department: ['Security', 'IT', 'Legal', 'Operations'][Math.floor(Math.random() * 4)]
    },
    tags: customOptions.tags || [
      'sample', 
      `priority_${priority.toLowerCase()}`,
      status.toLowerCase().replace('_', '-')
    ]
  };
  
  return caseRecord;
}

/**
 * Generate and store multiple sample case records
 */
export async function generateSampleCaseData(count = 15): Promise<string[]> {
  const caseIds: string[] = [];
  const baseDate = new Date();
  
  // Create sample cases with various statuses and priorities
  for (let i = 0; i < count; i++) {
    const caseRecord = generateSampleCase(i + 1, baseDate);
    
    // Add some related entities for more complex relationships
    if (caseIds.length > 0 && Math.random() > 0.7) {
      // Relate this case to 1-3 previous cases
      const numRelations = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numRelations && j < caseIds.length; j++) {
        const randomIndex = Math.floor(Math.random() * caseIds.length);
        if (!caseRecord.relatedCases.includes(caseIds[randomIndex])) {
          caseRecord.relatedCases.push(caseIds[randomIndex]);
        }
      }
    }
    
    // Store the case
    const caseId = await caseManagerAdapter.addCase(caseRecord);
    if (caseId) {
      caseIds.push(caseId);
    }
  }
  
  return caseIds;
}

/**
 * Generate a related case series
 */
export async function generateRelatedCaseSeries(
  count = 5,
  baseTitle = "Security Incident",
  startDate = new Date()
): Promise<string[]> {
  const caseIds: string[] = [];
  
  // Generate a series of related cases (like phases of an investigation)
  for (let i = 0; i < count; i++) {
    const phaseDate = new Date(startDate);
    phaseDate.setDate(startDate.getDate() + i * 7); // Each phase is a week apart
    
    let status = CaseStatus.CLOSED;
    if (i === count - 1) {
      // Last case is in progress
      status = CaseStatus.IN_PROGRESS;
    } else if (i === count - 2) {
      // Second to last case is pending
      status = CaseStatus.PENDING;
    }
    
    const priority = i === 0 ? 
      CasePriority.MEDIUM : 
      (i < count / 2 ? CasePriority.HIGH : CasePriority.CRITICAL);
    
    const caseRecord = generateSampleCase(i + 1, phaseDate, {
      title: `${baseTitle} - Phase ${i + 1}`,
      description: `Phase ${i + 1} of the ${baseTitle} investigation process.`,
      status,
      priority,
      startDate: phaseDate.toISOString(),
      relatedCases: [...caseIds] // Link to all previous cases in the series
    });
    
    // Store the case
    const caseId = await caseManagerAdapter.addCase(caseRecord);
    if (caseId) {
      caseIds.push(caseId);
      
      // For all but the first case, update the previous cases to point to this one
      if (i > 0) {
        for (let j = 0; j < i; j++) {
          await caseManagerAdapter.linkCases(caseIds[j], [caseId]);
        }
      }
    }
  }
  
  return caseIds;
}

export default {
  generateSampleCase,
  generateSampleCaseData,
  generateRelatedCaseSeries
};
