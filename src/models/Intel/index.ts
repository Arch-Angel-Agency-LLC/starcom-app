// Intel Domain Models - Barrel Export
// Implementation of Improvement #6: API Endpoint Structure

// Raw Intel Types
export * from './Intel';

// Processed Intelligence Types  
export * from './Intelligence';

// Intelligence Reports
export * from './IntelligenceReport';

// Classifications and Security
export * from './Classification';

// Sources and Collection
export * from './Sources';
export * from './Requirements';

// Assessments
export * from './Assessments';

// Utilities
export * from './Transformers';
export * from './IntelFusion';
export * from './Validators';

// Re-export key interfaces for convenience
export type {
  Intel,
  IntelRequirement
} from './Intel';

export type {
  Intelligence,
  IntelligenceSummary
} from './Intelligence';

export type {
  IntelligenceReportData,
  IntelligenceReportType,
  ReportAttachment,
  ReportStatistics
} from './IntelligenceReport';

export type {
  ThreatAssessment,
  RiskAssessment,
  ThreatCategory,
  ThreatActorType,
  RiskLevel
} from './Assessments';

export type {
  SourceMetadata,
  SourceCapabilities,
  CollectionMethod,
  DataQuality,
  PrimaryIntelSource
} from './Sources';

export type {
  CollectionPriority,
  RequirementCategory,
  EssentialElement,
  AreaOfInterest,
  CollectionPlan,
  CollectionTasking
} from './Requirements';

export type {
  ClassificationLevel,
  ClassificationMarking
} from './Classification';

// Utility exports
export {
  IntelligenceTransformers,
  FormTransformers
} from './Transformers';

export {
  IntelValidator,
  IntelligenceValidator,
  IntelligenceReportValidator,
  RequirementValidator,
  ThreatAssessmentValidator
} from './Validators';

export {
  ClassificationUtils
} from './Classification';

export {
  SourceUtils
} from './Sources';

export {
  RequirementsUtils
} from './Requirements';

export {
  ThreatAssessmentUtils
} from './Assessments';

export {
  IntelligenceReportUtils
} from './IntelligenceReport';

// Version information
export const INTEL_DOMAIN_VERSION = '1.0.0';
export const INTEL_DOMAIN_UPDATED = '2025-07-12';
