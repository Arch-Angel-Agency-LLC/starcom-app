/**
 * MessageTypes.ts
 * 
 * Defines the types specific to chat messages and their content.
 * This includes specialized message types for different protocols and contexts.
 */

import { EnhancedChatMessage, Attachment, MessageType, MessageStatus } from './ChatAdapterTypes';

/**
 * Earth Alliance specific message for resistance operations.
 */
export interface EarthAllianceMessage extends EnhancedChatMessage {
  // Corruption evidence specific
  corruptionType?: CorruptionType;
  evidenceType?: EvidenceType;
  targetEntities?: string[];
  timeframe?: { start: number; end: number };
  
  // Truth verification
  sourcesCount?: number;
  independentVerifications?: number;
  conflictingReports?: number;
  reliabilityScore?: number;
  
  // Operative protection
  anonymityLevel?: AnonymityLevel;
  protectionNeeded?: boolean;
  riskLevel?: RiskLevel;
  
  // Additional Earth Alliance fields
  evidenceHash?: string;
  truthScore?: number;
  verificationStatus?: VerificationStatus;
  resistanceCell?: string;
  operativeLevel?: OperativeLevel;
}

/**
 * Types of corruption that can be reported.
 */
export type CorruptionType = 
  | 'financial'
  | 'political'
  | 'media'
  | 'tech'
  | 'pharma'
  | 'energy'
  | 'military'
  | 'legal'
  | 'educational'
  | 'environmental';

/**
 * Types of evidence that can be submitted.
 */
export type EvidenceType = 
  | 'document'
  | 'testimony'
  | 'financial_record'
  | 'communication'
  | 'video'
  | 'audio'
  | 'photograph'
  | 'database'
  | 'whistleblower'
  | 'physical';

/**
 * Levels of anonymity for operatives.
 */
export type AnonymityLevel = 
  | 'public'
  | 'pseudonymous'
  | 'anonymous'
  | 'high_security';

/**
 * Levels of risk for operatives.
 */
export type RiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'extreme';

/**
 * Status of verification for truth claims.
 */
export type VerificationStatus = 
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'disputed'
  | 'requires_more_evidence';

/**
 * Operative levels within the Earth Alliance.
 */
export type OperativeLevel = 
  | 'civilian'
  | 'coordinator'
  | 'cell_leader'
  | 'alliance_command';

/**
 * Intelligence report message for secure communications.
 */
export interface IntelligenceMessage extends EnhancedChatMessage {
  classification: ClassificationLevel;
  sourceReliability: ReliabilityLevel;
  infoConfidence: ConfidenceLevel;
  threatLevel?: ThreatLevel;
  relatedReports?: string[];
  analyticalNotes?: string;
  keywords?: string[];
  actionRequired?: boolean;
  deadline?: number;
  distributionList?: string[];
}

/**
 * Classification levels for intelligence.
 */
export type ClassificationLevel = 
  | 'UNCLASSIFIED'
  | 'CONFIDENTIAL'
  | 'SECRET'
  | 'TOP_SECRET'
  | 'SCI'
  | 'EYES_ONLY';

/**
 * Source reliability levels.
 */
export type ReliabilityLevel = 
  | 'A' // Completely reliable
  | 'B' // Usually reliable
  | 'C' // Fairly reliable
  | 'D' // Not usually reliable
  | 'E' // Unreliable
  | 'F'; // Reliability cannot be judged

/**
 * Information confidence levels.
 */
export type ConfidenceLevel = 
  | '1' // Confirmed by other sources
  | '2' // Probably true
  | '3' // Possibly true
  | '4' // Doubtful
  | '5' // Improbable
  | '6'; // Truth cannot be judged

/**
 * Threat levels for intelligence reports.
 */
export type ThreatLevel = 
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INFORMATIONAL';

/**
 * Command message for operational control.
 */
export interface CommandMessage extends EnhancedChatMessage {
  commandType: CommandType;
  parameters?: Record<string, unknown>;
  authorization?: string;
  expiresAt?: number;
  acknowledgmentRequired?: boolean;
  executionStatus?: ExecutionStatus;
  targetUsers?: string[];
  securityContext?: Record<string, unknown>;
  auditTrail?: CommandAuditEntry[];
}

/**
 * Types of commands that can be issued.
 */
export type CommandType = 
  | 'CONNECT'
  | 'DISCONNECT'
  | 'ENCRYPT'
  | 'AUTHENTICATE'
  | 'EXECUTE'
  | 'REPORT'
  | 'ALERT'
  | 'EVACUATE'
  | 'LOCKDOWN'
  | 'STANDBY';

/**
 * Status of command execution.
 */
export type ExecutionStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABORTED'
  | 'EXPIRED';

/**
 * Entry in a command audit trail.
 */
export interface CommandAuditEntry {
  timestamp: number;
  userId: string;
  action: string;
  status: string;
  details?: Record<string, unknown>;
}

/**
 * System notification message.
 */
export interface SystemMessage extends EnhancedChatMessage {
  category: SystemMessageCategory;
  severity: MessageSeverity;
  affectedUsers?: string[];
  affectedChannels?: string[];
  autoExpire?: boolean;
  expiresAt?: number;
  acknowledgeable?: boolean;
  acknowledgedBy?: string[];
  actions?: SystemMessageAction[];
}

/**
 * Categories of system messages.
 */
export type SystemMessageCategory = 
  | 'maintenance'
  | 'security'
  | 'announcement'
  | 'feature'
  | 'user'
  | 'channel'
  | 'error'
  | 'warning'
  | 'info';

/**
 * Severity levels for messages.
 */
export type MessageSeverity = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

/**
 * Action that can be taken on a system message.
 */
export interface SystemMessageAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'command';
  value?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

/**
 * Type guard for EarthAllianceMessage
 */
export function isEarthAllianceMessage(message: EnhancedChatMessage): message is EarthAllianceMessage {
  return (
    'corruptionType' in message ||
    'evidenceType' in message ||
    'resistanceCell' in message ||
    'operativeLevel' in message
  );
}

/**
 * Type guard for IntelligenceMessage
 */
export function isIntelligenceMessage(message: EnhancedChatMessage): message is IntelligenceMessage {
  return (
    'classification' in message &&
    'sourceReliability' in message &&
    'infoConfidence' in message
  );
}

/**
 * Type guard for CommandMessage
 */
export function isCommandMessage(message: EnhancedChatMessage): message is CommandMessage {
  return 'commandType' in message;
}

/**
 * Type guard for SystemMessage
 */
export function isSystemMessage(message: EnhancedChatMessage): message is SystemMessage {
  return (
    'category' in message &&
    'severity' in message
  );
}
