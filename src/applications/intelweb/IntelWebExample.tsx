/**
 * IntelWeb Usage Example
 * 
 * Demonstrates how to use the IntelWebApplication component
 * Phase 2: Basic vault loading and file exploration
 */

import React from 'react';
import { IntelWebApplication } from './IntelWebApplication';
import './IntelWeb.css';

// Example usage in an application
export const IntelWebExample: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Phase 2 Example: Load IntelWeb without initial package (empty state) */}
      <IntelWebApplication />
      
      {/* 
      Phase 3 will add:
      - Graph visualization integration
      - 2D/3D mode switching
      - Performance optimization for 1000+ nodes
      
      Phase 4 will add:
      - Monaco editor with markdown support
      - Wikilink autocomplete
      - Intelligence-specific frontmatter editing
      */}
    </div>
  );
};

export default IntelWebExample;
