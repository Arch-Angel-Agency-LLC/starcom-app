// Simple Intelligence Report Data for UI
// Simplified version for Intel Transformation UI

export interface IntelligenceReportData {
  id?: string;
  title?: string;
  content?: string;
  reportType?: string;
  
  // Content structure
  executiveSummary?: string;
  keyFindings?: string[];
  analysisAndAssessment?: string;
  conclusions?: string;
  recommendations?: string[];
  intelligenceGaps?: string[];
  
  // Classification
  classification?: {
    level: string;
  };
  
  // Source attribution
  sources?: any[];
  sourceSummary?: string;
  collectionDisciplines?: string[];
  
  // Geographic scope
  geographicScope?: {
    type: string;
    coordinates?: Array<{
      latitude: number;
      longitude: number;
      description: string;
    }>;
  };
  
  // Timeframe
  timeframe?: { start: number; end: number };
  
  // Quality metrics
  confidence?: number;
  reliabilityScore?: number;
  completeness?: number;
  timeliness?: number;
  
  // Production metadata
  author?: string;
  timestamp?: number;
  
  // Legacy compatibility
  tags?: string[];
  latitude?: number;
  longitude?: number;
}
