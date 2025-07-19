/**
 * BotRosterIntegration.ts
 * 
 * This module defines the integration between NetRunner and BotRoster,
 * allowing automated bots to perform OSINT operations.
 */

import { v4 as uuidv4 } from 'uuid';
import { IntelType } from '../tools/NetRunnerPowerTools';

// Bot capabilities for OSINT operations
export type BotCapability =
  | 'collection'      // Data collection
  | 'analysis'        // Data analysis
  | 'persistence'     // Long-running operations
  | 'correlation'     // Connecting data points
  | 'verification'    // Verifying information
  | 'reporting'       // Generating reports
  | 'monitoring'      // Continuous monitoring
  | 'alerting';       // Generating alerts

// Bot operational scope
export type BotScope =
  | 'general'         // General-purpose
  | 'specialized'     // Specialized focus
  | 'targeted';       // Targeted operations

// Bot autonomy level
export type AutonomyLevel =
  | 'supervised'      // Requires human supervision
  | 'semi-autonomous' // Partial autonomy with human checkpoints
  | 'autonomous';     // Fully autonomous

// Bot definition
export interface OsintBot {
  id: string;
  name: string;
  description: string;
  avatar: string;
  capabilities: BotCapability[];
  compatibleTools: string[];      // IDs of compatible NetRunnerTools
  specializations: IntelType[];   // Specialized intelligence types
  autonomyLevel: AutonomyLevel;
  scope: BotScope;
  author: string;
  version: string;
  created: string;                // ISO date string
  updated: string;                // ISO date string
  performance: BotPerformance;
  status: 'active' | 'inactive' | 'maintenance';
  configuration: BotConfiguration;
}

// Bot performance metrics
export interface BotPerformance {
  accuracy: number;               // 0-1 score
  speed: number;                  // Operations per minute
  successRate: number;            // 0-1 score
  intelQualityScore: number;      // 0-1 score
  totalOperations: number;
  totalIntelGenerated: number;
  lastEvaluation: string;         // ISO date string
}

// Bot configuration
export interface BotConfiguration {
  maxConcurrentOperations: number;
  maxDailyOperations: number;
  rateLimiting: boolean;
  proxyRotation: boolean;
  obfuscation: boolean;
  loggingLevel: 'minimal' | 'standard' | 'verbose';
  notifyOnCompletion: boolean;
  saveResultsAutomatically: boolean;
  customParameters: Record<string, unknown>;
}

// Bot operation task
export interface BotTask {
  id: string;
  botId: string;
  name: string;
  description: string;
  target: string;                  // Search term, domain, person, etc.
  toolsToUse: string[];            // IDs of NetRunnerTools to use
  parameters: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledStart: string;          // ISO date string
  deadline?: string;               // ISO date string
  maxDuration: number;             // Maximum duration in minutes
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;                // 0-100 percentage
  created: string;                 // ISO date string
  started?: string;                // ISO date string
  completed?: string;              // ISO date string
  result?: BotTaskResult;
}

// Bot operation result
export interface BotTaskResult {
  id: string;
  taskId: string;
  botId: string;
  status: 'success' | 'partial' | 'failure';
  intelGenerated: boolean;
  intelReportIds: string[];        // IDs of generated Intel Reports
  rawDataCollected: number;        // Size in KB
  entitiesDiscovered: number;
  relationshipsIdentified: number;
  executionTime: number;           // In seconds
  toolsUsed: string[];             // IDs of NetRunnerTools used
  errors?: string[];
  warnings?: string[];
  notes?: string;
}

// Sample bot templates
export const sampleBots: OsintBot[] = [
  {
    id: uuidv4(),
    name: 'NetSweeper',
    description: 'General-purpose reconnaissance bot for initial data gathering',
    avatar: 'robot-blue.svg',
    capabilities: ['collection', 'persistence'],
    compatibleTools: [], // Will be filled with actual tool IDs
    specializations: ['identity', 'network', 'infrastructure'],
    autonomyLevel: 'semi-autonomous',
    scope: 'general',
    author: 'Starcom',
    version: '1.0.0',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    performance: {
      accuracy: 0.85,
      speed: 120,
      successRate: 0.92,
      intelQualityScore: 0.78,
      totalOperations: 0,
      totalIntelGenerated: 0,
      lastEvaluation: new Date().toISOString()
    },
    status: 'active',
    configuration: {
      maxConcurrentOperations: 3,
      maxDailyOperations: 100,
      rateLimiting: true,
      proxyRotation: true,
      obfuscation: false,
      loggingLevel: 'standard',
      notifyOnCompletion: true,
      saveResultsAutomatically: true,
      customParameters: {}
    }
  },
  {
    id: uuidv4(),
    name: 'ThreatHunter',
    description: 'Specialized bot for discovering and analyzing potential threats',
    avatar: 'robot-red.svg',
    capabilities: ['analysis', 'correlation', 'alerting'],
    compatibleTools: [], // Will be filled with actual tool IDs
    specializations: ['threat', 'vulnerability', 'darkweb'],
    autonomyLevel: 'supervised',
    scope: 'specialized',
    author: 'Starcom',
    version: '1.0.0',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    performance: {
      accuracy: 0.92,
      speed: 60,
      successRate: 0.88,
      intelQualityScore: 0.91,
      totalOperations: 0,
      totalIntelGenerated: 0,
      lastEvaluation: new Date().toISOString()
    },
    status: 'active',
    configuration: {
      maxConcurrentOperations: 2,
      maxDailyOperations: 50,
      rateLimiting: true,
      proxyRotation: true,
      obfuscation: true,
      loggingLevel: 'verbose',
      notifyOnCompletion: true,
      saveResultsAutomatically: true,
      customParameters: {
        threatFeedIntegration: true,
        alertThreshold: 0.7
      }
    }
  },
  {
    id: uuidv4(),
    name: 'DataMiner',
    description: 'Persistent data collection and aggregation bot',
    avatar: 'robot-green.svg',
    capabilities: ['collection', 'persistence', 'monitoring'],
    compatibleTools: [], // Will be filled with actual tool IDs
    specializations: ['identity', 'social', 'financial'],
    autonomyLevel: 'autonomous',
    scope: 'general',
    author: 'Starcom',
    version: '1.0.0',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    performance: {
      accuracy: 0.82,
      speed: 180,
      successRate: 0.95,
      intelQualityScore: 0.75,
      totalOperations: 0,
      totalIntelGenerated: 0,
      lastEvaluation: new Date().toISOString()
    },
    status: 'active',
    configuration: {
      maxConcurrentOperations: 5,
      maxDailyOperations: 200,
      rateLimiting: true,
      proxyRotation: false,
      obfuscation: false,
      loggingLevel: 'minimal',
      notifyOnCompletion: false,
      saveResultsAutomatically: true,
      customParameters: {
        dataRetentionPeriod: 30, // days
      }
    }
  },
  {
    id: uuidv4(),
    name: 'ReportForge',
    description: 'Intelligence report generation and analysis bot',
    avatar: 'robot-purple.svg',
    capabilities: ['analysis', 'reporting', 'verification'],
    compatibleTools: [], // Will be filled with actual tool IDs
    specializations: ['identity', 'network', 'infrastructure', 'threat'],
    autonomyLevel: 'semi-autonomous',
    scope: 'specialized',
    author: 'Starcom',
    version: '1.0.0',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    performance: {
      accuracy: 0.90,
      speed: 45,
      successRate: 0.93,
      intelQualityScore: 0.88,
      totalOperations: 0,
      totalIntelGenerated: 0,
      lastEvaluation: new Date().toISOString()
    },
    status: 'active',
    configuration: {
      maxConcurrentOperations: 2,
      maxDailyOperations: 20,
      rateLimiting: false,
      proxyRotation: false,
      obfuscation: false,
      loggingLevel: 'standard',
      notifyOnCompletion: true,
      saveResultsAutomatically: true,
      customParameters: {
        reportFormatType: 'comprehensive',
        includeVisualization: true
      }
    }
  }
];

// Helper function to create a new bot task
export const createBotTask = (
  botId: string,
  name: string,
  description: string,
  target: string,
  toolsToUse: string[] = [],
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  parameters: Record<string, unknown> = {}
): BotTask => {
  return {
    id: uuidv4(),
    botId,
    name,
    description,
    target,
    toolsToUse,
    parameters,
    priority,
    scheduledStart: new Date().toISOString(),
    maxDuration: 60, // Default 60 minutes
    status: 'queued',
    progress: 0,
    created: new Date().toISOString()
  };
};
