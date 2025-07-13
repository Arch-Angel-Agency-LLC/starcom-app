// Raw Intelligence Data Types
// Base types for raw, unprocessed intelligence data points

export type IntelSource = 
  | 'SIGINT'    // Signals Intelligence
  | 'HUMINT'    // Human Intelligence  
  | 'GEOINT'    // Geospatial Intelligence
  | 'OSINT'     // Open Source Intelligence
  | 'COMINT'    // Communications Intelligence
  | 'ELINT'     // Electronic Intelligence
  | 'MASINT'    // Measurement and Signature Intelligence
  | 'TECHINT';  // Technical Intelligence

export type ClassificationLevel = 
  | 'UNCLASS' 
  | 'CONFIDENTIAL' 
  | 'SECRET' 
  | 'TOP_SECRET';

export type ReliabilityRating = 
  | 'A' // Completely reliable
  | 'B' // Usually reliable  
  | 'C' // Fairly reliable
  | 'D' // Not usually reliable
  | 'E' // Unreliable
  | 'F' // Reliability cannot be judged
  | 'X'; // Deliberate deception suspected

/**
 * Raw Intel Data Point
 * Represents unprocessed intelligence data from various sources
 */
export interface Intel {
  id: string;
  source: IntelSource;
  classification: ClassificationLevel;
  reliability: ReliabilityRating;
  timestamp: number;
  collectedBy: string; // Collector/sensor ID
  
  // Geographic context
  latitude?: number;
  longitude?: number;
  location?: string; // Human-readable location
  
  // Raw data payload
  data: unknown;
  
  // Metadata
  tags: string[];
  hash?: string; // Data integrity hash
  verified?: boolean;
}

/**
 * Intel Collection Requirements
 * Defines what kind of intelligence is needed
 */
export interface IntelRequirement {
  id: string;
  priority: 'IMMEDIATE' | 'PRIORITY' | 'ROUTINE';
  description: string;
  targetLocation?: {
    latitude: number;
    longitude: number;
    radius: number; // meters
  };
  deadline?: number; // timestamp
  requiredSources: IntelSource[];
  classification: ClassificationLevel;
  requestedBy: string;
}
