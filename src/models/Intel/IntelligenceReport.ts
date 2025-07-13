// Enhanced Intelligence Report Models
// Implementation of Improvement #3: Enhanced Type Definitions
// Builds upon and enhances the existing IntelReportData

import { ClassificationMarking } from './Classification';
import { SourceMetadata, PrimaryIntelSource } from './Sources';
// Note: ThreatAssessment and RiskAssessment are referenced by ID strings

/**
 * Intelligence Report Types
 */
export type IntelligenceReportType = 
  | 'SITUATION_REPORT'    // Current situation analysis
  | 'THREAT_ASSESSMENT'   // Threat analysis report
  | 'INTELLIGENCE_ESTIMATE' // Intelligence estimate
  | 'WARNING_REPORT'      // Warning of imminent threat
  | 'COLLECTION_REPORT'   // Collection results
  | 'ANALYSIS_REPORT'     // Detailed analysis
  | 'SUMMARY_REPORT'      // Summary of multiple sources
  | 'SPOT_REPORT'         // Immediate tactical report
  | 'TECHNICAL_REPORT'    // Technical intelligence
  | 'STRATEGIC_REPORT';   // Strategic intelligence

/**
 * Report Distribution Types
 */
export type DistributionType = 
  | 'IMMEDIATE'          // Immediate distribution
  | 'ROUTINE'            // Routine distribution
  | 'SPECIAL'            // Special distribution list
  | 'LIMITED'            // Limited distribution
  | 'EYES_ONLY'          // Eyes only distribution
  | 'COMPARTMENTED';     // Compartmented distribution

/**
 * Enhanced Intelligence Report Data
 * Extends the original IntelReportData with comprehensive intelligence features
 */
export interface IntelligenceReportData {
  // Basic identification (from original IntelReportData)
  id: string;
  title: string;
  content: string;
  
  // Enhanced report metadata
  reportType: IntelligenceReportType;
  reportNumber: string; // Formal report numbering
  version: string; // Report version
  supersedes?: string; // Previous report ID
  
  // Classification and handling (enhanced)
  classification: ClassificationMarking;
  distributionType: DistributionType;
  distributionList: string[]; // Recipients
  handlingInstructions: string[];
  
  // Intelligence content
  executiveSummary: string;
  keyFindings: string[];
  analysisAndAssessment: string;
  conclusions: string;
  recommendations: string[];
  intelligenceGaps: string[];
  
  // Source attribution
  sources: SourceMetadata[];
  sourceSummary: string; // Summary of source reliability
  collectionDisciplines: PrimaryIntelSource[];
  
  // Geographic and temporal scope
  geographicScope: {
    type: 'GLOBAL' | 'REGIONAL' | 'NATIONAL' | 'LOCAL' | 'SPECIFIC';
    regions?: string[];
    coordinates?: Array<{
      latitude: number;
      longitude: number;
      description: string;
    }>;
  };
  timeframe: {
    start: number;
    end: number;
    relevantUntil?: number;
  };
  
  // Associated products
  relatedReports: string[]; // Related report IDs
  threatAssessments: string[]; // ThreatAssessment IDs
  riskAssessments: string[]; // RiskAssessment IDs
  attachments: ReportAttachment[];
  
  // Quality and validation
  confidence: number; // 0-100 overall confidence
  reliabilityScore: number; // 0-100 source reliability
  completeness: number; // 0-100 information completeness
  timeliness: number; // 0-100 information timeliness
  
  // Workflow and approval
  status: 'DRAFT' | 'COORDINATION' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';
  workflowSteps: WorkflowStep[];
  approvalChain: ApprovalStep[];
  
  // Production metadata
  author: string; // Primary author
  contributors: string[]; // Contributing analysts
  reviewedBy: string[]; // Reviewers
  approvedBy: string; // Final approver
  
  // Publishing and distribution
  publishedAt?: number;
  distributedAt?: number;
  publishedTo: string[]; // Where it was published
  accessLog: AccessLogEntry[];
  
  // Feedback and metrics
  feedback: ReportFeedback[];
  viewCount: number;
  downloadCount: number;
  citationCount: number;
  
  // Legacy compatibility (from original IntelReportData)
  tags: string[];
  latitude?: number; // Primary location if applicable
  longitude?: number; // Primary location if applicable
  timestamp: number;
  
  // Blockchain integration (from original)
  pubkey?: string; // Solana account public key
  signature?: string; // Transaction signature
  
  // UI fields (from original)
  subtitle?: string;
  date?: string; // ISO date string for display
  categories?: string[];
  metaDescription?: string;
  
  // Deprecated fields (from original)
  /** @deprecated Use latitude instead */
  lat?: number;
  /** @deprecated Use longitude instead */
  long?: number;
}

/**
 * Report Attachment
 */
export interface ReportAttachment {
  id: string;
  filename: string;
  description: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'DATA' | 'MAP' | 'CHART';
  size: number; // bytes
  hash: string; // File integrity hash
  classification: ClassificationMarking;
  uploadedBy: string;
  uploadedAt: number;
  accessRestrictions?: string[];
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
  step: string;
  assignedTo: string;
  startedAt?: number;
  completedAt?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  notes?: string;
  duration?: number; // minutes
}

/**
 * Approval Step
 */
export interface ApprovalStep {
  approver: string;
  role: string;
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL' | 'PENDING';
  timestamp: number;
  comments?: string;
  conditions?: string[]; // For conditional approval
}

/**
 * Access Log Entry
 */
export interface AccessLogEntry {
  userId: string;
  action: 'VIEW' | 'DOWNLOAD' | 'PRINT' | 'SHARE' | 'EDIT';
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

/**
 * Report Feedback
 */
export interface ReportFeedback {
  id: string;
  userId: string;
  rating: number; // 1-5
  category: 'ACCURACY' | 'TIMELINESS' | 'RELEVANCE' | 'COMPLETENESS' | 'CLARITY';
  comments: string;
  submittedAt: number;
  helpful?: boolean; // Was feedback helpful
}

/**
 * Report Statistics
 */
export interface ReportStatistics {
  reportId: string;
  
  // Usage metrics
  totalViews: number;
  uniqueViewers: number;
  downloads: number;
  shares: number;
  citations: number;
  
  // Quality metrics
  averageRating: number;
  feedbackCount: number;
  accuracyScore: number;
  
  // Performance metrics
  productionTime: number; // hours from start to publish
  coordinationTime: number; // hours in coordination
  approvalTime: number; // hours in approval process
  
  // Distribution metrics
  recipientCount: number;
  distributionReach: string[]; // Organizations reached
  
  // Temporal metrics
  firstViewed?: number;
  peakViewingPeriod?: {
    start: number;
    end: number;
    viewCount: number;
  };
}

/**
 * Intelligence Report Utilities
 */
export class IntelligenceReportUtils {
  /**
   * Calculate overall quality score
   */
  static calculateQualityScore(report: IntelligenceReportData): number {
    const weights = {
      confidence: 0.3,
      reliability: 0.25,
      completeness: 0.25,
      timeliness: 0.2
    };
    
    return (
      report.confidence * weights.confidence +
      report.reliabilityScore * weights.reliability +
      report.completeness * weights.completeness +
      report.timeliness * weights.timeliness
    );
  }

  /**
   * Determine if report needs update
   */
  static needsUpdate(report: IntelligenceReportData): boolean {
    const now = Date.now();
    const age = now - report.timestamp;
    const maxAge = this.getMaxAge(report.reportType);
    
    return age > maxAge || 
           (report.timeframe.relevantUntil && now > report.timeframe.relevantUntil);
  }

  /**
   * Get maximum age for report type (in milliseconds)
   */
  private static getMaxAge(reportType: IntelligenceReportType): number {
    const ages = {
      'SPOT_REPORT': 24 * 60 * 60 * 1000, // 1 day
      'SITUATION_REPORT': 7 * 24 * 60 * 60 * 1000, // 1 week
      'WARNING_REPORT': 24 * 60 * 60 * 1000, // 1 day
      'THREAT_ASSESSMENT': 30 * 24 * 60 * 60 * 1000, // 1 month
      'INTELLIGENCE_ESTIMATE': 90 * 24 * 60 * 60 * 1000, // 3 months
      'COLLECTION_REPORT': 14 * 24 * 60 * 60 * 1000, // 2 weeks
      'ANALYSIS_REPORT': 30 * 24 * 60 * 60 * 1000, // 1 month
      'SUMMARY_REPORT': 7 * 24 * 60 * 60 * 1000, // 1 week
      'TECHNICAL_REPORT': 180 * 24 * 60 * 60 * 1000, // 6 months
      'STRATEGIC_REPORT': 365 * 24 * 60 * 60 * 1000 // 1 year
    };
    
    return ages[reportType] || 30 * 24 * 60 * 60 * 1000; // Default 1 month
  }

  /**
   * Generate report citation
   */
  static generateCitation(report: IntelligenceReportData): string {
    const date = new Date(report.timestamp).toISOString().split('T')[0];
    return `${report.reportNumber || report.id}, "${report.title}", ${report.author}, ${date}`;
  }

  /**
   * Validate report completeness
   */
  static validateReport(report: IntelligenceReportData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!report.title?.trim()) {
      errors.push('Title is required');
    }

    if (!report.content?.trim()) {
      errors.push('Content is required');
    }

    if (!report.executiveSummary?.trim()) {
      errors.push('Executive summary is required');
    }

    if (!report.author?.trim()) {
      errors.push('Author is required');
    }

    // Quality checks
    if (report.confidence < 50) {
      warnings.push('Low confidence score');
    }

    if (!report.sources?.length) {
      warnings.push('No sources specified');
    }

    if (!report.keyFindings?.length) {
      warnings.push('No key findings specified');
    }

    if (!report.recommendations?.length) {
      warnings.push('No recommendations provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
