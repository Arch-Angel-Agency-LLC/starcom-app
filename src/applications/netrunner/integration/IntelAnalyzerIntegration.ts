/**
 * IntelAnalyzerIntegration.ts
 * 
 * This module defines the integration between NetRunner and the IntelAnalyzer,
 * facilitating the creation and packaging of Intel Reports for the Intelligence Exchange Marketplace.
 */

import { v4 as uuidv4 } from 'uuid';
import { publishBotIntelOutput, buildCreateIntelReportInput } from '../models/IntelReport';
import { intelReportService } from '../../../services/intel/IntelReportService';
import type { BotIntelOutput } from '../types/BotMission';
import { IntelType } from '../tools/NetRunnerPowerTools';

// Intel processing stages
export type ProcessingStage = 
  | 'collection'      // Initial data collection
  | 'processing'      // Data processing
  | 'analysis'        // Data analysis
  | 'verification'    // Verification
  | 'reporting'       // Report generation
  | 'packaging'       // Packaging for exchange
  | 'published';      // Available on the marketplace

// Intel workflow
export interface IntelWorkflow {
  id: string;
  name: string;
  description: string;
  intelTypes: IntelType[];
  stages: WorkflowStage[];
  currentStage: number;
  intelId?: string;         // Associated Intel Report ID if available
  status: 'active' | 'completed' | 'failed' | 'paused';
  progress: number;         // 0-100 percentage
  created: string;          // ISO date string
  updated: string;          // ISO date string
  dueDate?: string;         // ISO date string
  assignedTo?: string;      // User ID
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  tags: string[];
}

// Stage in an Intel workflow
export interface WorkflowStage {
  id: string;
  name: string;
  type: ProcessingStage;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startTime?: string;       // ISO date string
  endTime?: string;         // ISO date string
  duration?: number;        // In seconds
  assignedTools?: string[]; // IDs of NetRunnerTools
  assignedBots?: string[];  // IDs of OsintBots
  notes?: string;
  outputs?: StageOutput[];
  nextStages?: string[];    // IDs of possible next stages (for branching workflows)
}

// Output from a workflow stage
export interface StageOutput {
  id: string;
  type: 'data' | 'entity' | 'relationship' | 'evidence' | 'report' | 'note';
  content: string;          // Content or reference to content
  metadata: Record<string, unknown>;
  confidence: number;       // 0-1 confidence score
  created: string;          // ISO date string
}

// Intel analysis template
export interface AnalysisTemplate {
  id: string;
  name: string;
  description: string;
  intelTypes: IntelType[];
  stages: TemplateStage[];
  estimatedDuration: number; // In minutes
  created: string;           // ISO date string
  updated: string;           // ISO date string
  author: string;            // User ID
  tags: string[];
  categories: string[];
  version: string;
}

// Template stage
export interface TemplateStage {
  id: string;
  name: string;
  type: ProcessingStage;
  description: string;
  duration: number;          // Estimated duration in minutes
  requiredTools?: string[];  // IDs of recommended NetRunnerTools
  recommendedBots?: string[];// IDs of recommended OsintBots
  instructions?: string;
  nextStages?: string[];     // IDs of possible next stages
}

// Intel analysis request
export interface AnalysisRequest {
  id: string;
  title: string;
  description: string;
  intelTypes: IntelType[];
  targetData: string;        // Search term, data, or reference to data
  priority: 'low' | 'medium' | 'high' | 'critical';
  templateId?: string;       // ID of AnalysisTemplate if using one
  assignTo?: string;         // User ID if assigned
  botAssisted: boolean;      // Whether to use bot assistance
  deadline?: string;         // ISO date string
  notes?: string;
  requestedBy: string;       // User ID
  created: string;           // ISO date string
}

// Template to create basic intel workflows
export const basicIntelWorkflows: AnalysisTemplate[] = [
  {
    id: uuidv4(),
    name: 'Standard Intel Report',
    description: 'Standard workflow for creating basic intelligence reports',
    intelTypes: ['identity', 'network', 'infrastructure'],
    stages: [
      {
        id: uuidv4(),
        name: 'Initial Data Collection',
        type: 'collection',
        description: 'Gather raw data from primary sources',
        duration: 60,
        requiredTools: [],
        instructions: 'Use discovery tools to collect initial data points based on target criteria.'
      },
      {
        id: uuidv4(),
        name: 'Data Processing',
        type: 'processing',
        description: 'Process and normalize collected data',
        duration: 30,
        requiredTools: [],
        instructions: 'Clean and normalize data, identify entities and relationships.'
      },
      {
        id: uuidv4(),
        name: 'Initial Analysis',
        type: 'analysis',
        description: 'Perform initial analysis of processed data',
        duration: 45,
        requiredTools: [],
        instructions: 'Analyze patterns, identify key insights, and generate preliminary findings.'
      },
      {
        id: uuidv4(),
        name: 'Verification',
        type: 'verification',
        description: 'Verify findings with additional sources',
        duration: 60,
        requiredTools: [],
        instructions: 'Cross-reference findings with secondary sources to verify accuracy and reliability.'
      },
      {
        id: uuidv4(),
        name: 'Report Generation',
        type: 'reporting',
        description: 'Generate formal intelligence report',
        duration: 45,
        requiredTools: [],
  instructions: 'Compile verified findings into a structured intelligence report.'
      },
      {
        id: uuidv4(),
        name: 'Packaging for Exchange',
        type: 'packaging',
        description: 'Prepare report for Intelligence Exchange Marketplace',
        duration: 15,
        requiredTools: [],
        instructions: 'Add metadata, determine market value, and prepare for listing on the exchange.'
      }
    ],
    estimatedDuration: 255,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    author: 'system',
    tags: ['standard', 'general'],
    categories: ['general'],
    version: '1.0.0'
  },
  {
    id: uuidv4(),
    name: 'Threat Intelligence Report',
    description: 'Specialized workflow for threat intelligence analysis',
    intelTypes: ['threat', 'vulnerability', 'infrastructure'],
    stages: [
      {
        id: uuidv4(),
        name: 'Threat Data Collection',
        type: 'collection',
        description: 'Gather threat intelligence from various sources',
        duration: 90,
        requiredTools: [],
        recommendedBots: [],
        instructions: 'Use specialized threat intelligence tools to collect data on potential threats.'
      },
      {
        id: uuidv4(),
        name: 'Indicator Extraction',
        type: 'processing',
        description: 'Extract and process threat indicators',
        duration: 45,
        requiredTools: [],
        instructions: 'Identify and extract indicators of compromise, threat actors, and attack patterns.'
      },
      {
        id: uuidv4(),
        name: 'Threat Analysis',
        type: 'analysis',
        description: 'Analyze threat patterns and assess impact',
        duration: 60,
        requiredTools: [],
        instructions: 'Analyze threat behavior, assess potential impact, and determine severity.'
      },
      {
        id: uuidv4(),
        name: 'Threat Verification',
        type: 'verification',
        description: 'Verify threat intelligence with trusted sources',
        duration: 60,
        requiredTools: [],
        instructions: 'Cross-reference threat data with trusted sources and verify authenticity.'
      },
      {
        id: uuidv4(),
        name: 'Mitigation Strategy',
        type: 'analysis',
        description: 'Develop potential mitigation strategies',
        duration: 45,
        requiredTools: [],
        instructions: 'Identify and document potential mitigation strategies for identified threats.'
      },
      {
        id: uuidv4(),
        name: 'Threat Report Generation',
        type: 'reporting',
        description: 'Generate comprehensive threat intelligence report',
        duration: 60,
        requiredTools: [],
  instructions: 'Compile verified threat intelligence into a structured report.'
      },
      {
        id: uuidv4(),
        name: 'Packaging for Exchange',
        type: 'packaging',
        description: 'Prepare threat report for Intelligence Exchange Marketplace',
        duration: 15,
        requiredTools: [],
        instructions: 'Add metadata, determine market value, and prepare for listing on the exchange.'
      }
    ],
    estimatedDuration: 375,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    author: 'system',
    tags: ['threat', 'security', 'vulnerability'],
    categories: ['threat-intelligence'],
    version: '1.0.0'
  }
];

// Function to create a new Intel workflow from a template
export const createWorkflowFromTemplate = (
  template: AnalysisTemplate,
  name: string,
  description: string,
  assignedTo?: string,
  dueDate?: string
): IntelWorkflow => {
  // Generate stages from template
  const stages: WorkflowStage[] = template.stages.map(templateStage => ({
    id: uuidv4(),
    name: templateStage.name,
    type: templateStage.type,
    description: templateStage.description,
    status: 'pending',
    assignedTools: templateStage.requiredTools || [],
    assignedBots: templateStage.recommendedBots || [],
    notes: templateStage.instructions
  }));
  
  // Create the workflow
  return {
    id: uuidv4(),
    name,
    description,
    intelTypes: template.intelTypes,
    stages,
    currentStage: 0,
    status: 'active',
    progress: 0,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    dueDate,
    assignedTo,
    priority: 'medium',
    tags: template.tags
  };
};

// Function to create an analysis request
export const createAnalysisRequest = (
  title: string,
  description: string,
  targetData: string,
  intelTypes: IntelType[],
  requestedBy: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  templateId?: string,
  botAssisted: boolean = true,
  deadline?: string
): AnalysisRequest => {
  return {
    id: uuidv4(),
    title,
    description,
    intelTypes,
    targetData,
    priority,
    templateId,
    botAssisted,
    deadline,
    requestedBy,
    created: new Date().toISOString()
  };
};

// DEPRECATED: createIntelReportFromWorkflow (retained for transitional compatibility)
export const createIntelReportFromWorkflow = (
  workflow: IntelWorkflow,
  _authorId: string,
  _authorName: string
) => {
  console.warn('[DEPRECATED] createIntelReportFromWorkflow: returns CreateIntelReportInput; update callers to call intelReportService.createReport directly.');
  return buildCreateIntelReportInput({
    title: workflow.name,
    content: '',
    summary: workflow.description,
    category: 'general',
    tags: workflow.tags,
    confidence: 0
  });
};

// Publish a workflow-derived NetRunner report to the centralized Intel system.
// Returns the created IntelReportUI via intelReportService. Keeps the existing
// createIntelReportFromWorkflow function unchanged to preserve local flows.
export async function publishIntelReportFromWorkflow(
  workflow: IntelWorkflow,
  authorId: string,
  authorName: string
) {
  // New path: build CreateIntelReportInput directly (avoids NetRunnerIntelReport dependency)
  const input = buildCreateIntelReportInput({
    title: workflow.name,
    content: '',
    summary: workflow.description,
    category: 'general',
    tags: workflow.tags,
    confidence: 0
  });
  return intelReportService.createReport(input, authorName || authorId);
}

// Publish all reports generated by a Bot mission output to the centralized Intel system.
export async function publishBotOutputReports(output: BotIntelOutput, authorName?: string) {
  return publishBotIntelOutput(output, authorName);
}
