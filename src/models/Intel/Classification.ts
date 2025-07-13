// Security Classification and Handling Instructions
// Implementation of Improvement #4: Enhanced Type Definitions

/**
 * Security Classification Levels
 * Based on U.S. Government classification standards
 */
export type ClassificationLevel = 
  | 'UNCLASS'       // Unclassified
  | 'CUI'           // Controlled Unclassified Information
  | 'CONFIDENTIAL'  // Confidential
  | 'SECRET'        // Secret
  | 'TOP_SECRET';   // Top Secret

/**
 * Security Compartments
 * Special access programs and compartmented information
 */
export type SecurityCompartment = 
  | 'SI'       // Special Intelligence
  | 'TK'       // Talent Keyhole (satellite intelligence)
  | 'HCS'      // Human Intelligence Control System
  | 'ORCON'    // Originator Controlled
  | 'NOFORN'   // Not Releasable to Foreign Nationals
  | 'EYES_ONLY'; // Eyes Only

/**
 * Dissemination Controls
 * Controls on how classified information can be shared
 */
export type DisseminationControl = 
  | 'REL_TO'   // Releasable To (specific countries/organizations)
  | 'NOFORN'   // No Foreign Nationals
  | 'ORCON'    // Originator Controlled
  | 'IMCON'    // Intelligence Methods Controlled
  | 'PROPIN'   // Proprietary Information
  | 'LIMDIS';  // Limited Distribution

/**
 * Handling Caveats
 * Special handling instructions
 */
export type HandlingCaveat = 
  | 'PERSONAL_FOR'    // Personal for specific individual
  | 'EYES_ONLY'       // Eyes only for recipient
  | 'IMMEDIATE'       // Immediate handling required
  | 'PRIORITY'        // Priority handling
  | 'ROUTINE'         // Routine handling
  | 'FLASH_OVERRIDE'; // Flash override priority

/**
 * Complete Classification Marking
 * Full classification with all controls and caveats
 */
export interface ClassificationMarking {
  level: ClassificationLevel;
  compartments?: SecurityCompartment[];
  disseminationControls?: DisseminationControl[];
  handlingCaveats?: HandlingCaveat[];
  releasabilityTo?: string[]; // Countries/organizations
  downgradeDate?: number; // Automatic downgrade timestamp
  exemptionCode?: string; // Declassification exemption
}

/**
 * Classification Utilities
 */
export class ClassificationUtils {
  /**
   * Generate standard classification banner
   */
  static generateBanner(marking: ClassificationMarking): string {
    let banner = marking.level;
    
    if (marking.compartments?.length) {
      banner += '//' + marking.compartments.join('/');
    }
    
    if (marking.disseminationControls?.length) {
      banner += '//' + marking.disseminationControls.join('/');
    }
    
    if (marking.handlingCaveats?.length) {
      banner += '//' + marking.handlingCaveats.join('/');
    }
    
    return banner;
  }

  /**
   * Compare classification levels for precedence
   * Returns: -1 if a < b, 0 if equal, 1 if a > b
   */
  static compareClassificationLevel(a: ClassificationLevel, b: ClassificationLevel): number {
    const levels = ['UNCLASS', 'CUI', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    const aIndex = levels.indexOf(a);
    const bIndex = levels.indexOf(b);
    return aIndex - bIndex;
  }

  /**
   * Determine if user has clearance for classification
   */
  static hasAccess(
    userClearance: ClassificationLevel,
    requiredClearance: ClassificationLevel
  ): boolean {
    return this.compareClassificationLevel(userClearance, requiredClearance) >= 0;
  }

  /**
   * Validate classification marking format
   */
  static validate(marking: ClassificationMarking): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate level
    const validLevels: ClassificationLevel[] = ['UNCLASS', 'CUI', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    if (!validLevels.includes(marking.level)) {
      errors.push(`Invalid classification level: ${marking.level}`);
    }

    // Validate compartments don't conflict
    if (marking.level === 'UNCLASS' && marking.compartments?.length) {
      errors.push('Unclassified information cannot have compartments');
    }

    // Validate dissemination controls
    if (marking.disseminationControls?.includes('NOFORN') && 
        marking.releasabilityTo?.length) {
      errors.push('NOFORN cannot be used with releasability markings');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
