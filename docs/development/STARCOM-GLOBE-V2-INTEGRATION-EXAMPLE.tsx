// STARCOM Globe V2 Integration Example
// How to migrate from the old system to the new professional architecture

import React, { useRef } from 'react';

// Old import (replace this)
// import { EnhancedGlobeInteractivity } from './components/Globe/EnhancedGlobeInteractivity';

// New import (use this instead)
import { EnhancedGlobeInteractivityV2 } from './components/Globe/EnhancedGlobeInteractivityV2';
import { InteractionMode } from './systems/interaction/InteractionModeSystem';

// Example parent component using the new V2 system
export const GlobeContainer: React.FC = () => {
  const globeRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Your existing data and state
  const [intelReports] = useState([
    // Your intel reports data
  ]);
  
  const [models] = useState([
    // Your 3D models data
  ]);
  
  const [visualizationMode] = useState({
    mode: 'CyberCommand',
    subMode: 'IntelReports'
  });
  
  // Handlers for intel report interactions
  const handleHoverChange = (reportId: string | null) => {
    console.log('Intel report hovered:', reportId);
    // Your existing hover logic here
  };
  
  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', height: '100vh', position: 'relative' }}
    >
      {/* Your globe component (react-globe-gl, three.js, etc.) */}
      <YourGlobeComponent ref={globeRef} />
      
      {/* Replace the old component with V2 */}
      <EnhancedGlobeInteractivityV2
        globeRef={globeRef}
        intelReports={intelReports}
        visualizationMode={visualizationMode}
        models={models}
        onHoverChange={handleHoverChange}
        containerRef={containerRef}
        interactionConfig={{
          // Original settings (preserved)
          dragThreshold: 5,
          timeThreshold: 300,
          enableHoverDuringDrag: false,
          
          // New V2 features
          enableModeSelector: true,           // Show the professional mode selector UI
          modeSelectorPosition: 'left',       // Position: 'top' | 'bottom' | 'left' | 'right'
          enableDebugMode: false,             // Show debug overlay (useful for development)
          allowedModes: [                     // Restrict which modes are available
            InteractionMode.NAVIGATION,       // Standard globe rotation/zoom
            InteractionMode.INTEL_INSPECTION, // Hover/click intel reports (default for Intel mode)
            InteractionMode.INTEL_CREATION,   // Click to create new intel reports
            InteractionMode.MEASUREMENT,      // Distance/area measurement tools
            InteractionMode.ANNOTATION,       // Add text annotations
            // InteractionMode.SIMULATION     // Advanced scenario simulation
          ]
        }}
      />
    </div>
  );
};

// Advanced configuration example
export const AdvancedGlobeContainer: React.FC = () => {
  const globeRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <YourGlobeComponent ref={globeRef} />
      
      <EnhancedGlobeInteractivityV2
        globeRef={globeRef}
        intelReports={intelReports}
        visualizationMode={visualizationMode}
        models={models}
        onHoverChange={handleHoverChange}
        containerRef={containerRef}
        interactionConfig={{
          // Fine-tuned interaction settings
          dragThreshold: 3,                   // Smaller threshold = more sensitive
          timeThreshold: 200,                 // Faster click detection
          
          // Professional UI configuration
          enableModeSelector: true,
          modeSelectorPosition: 'left',       // Try 'top' for horizontal layout
          enableDebugMode: true,              // Enable for development/testing
          
          // Custom mode selection for specific use cases
          allowedModes: [
            InteractionMode.NAVIGATION,       // Always include navigation
            InteractionMode.INTEL_INSPECTION, // Intel operations
            InteractionMode.MEASUREMENT,      // Mission planning tools
          ]
        }}
      />
    </div>
  );
};

// Migration checklist:
// ✅ 1. Replace import statement
// ✅ 2. Update component name
// ✅ 3. Keep all existing props (backward compatible)
// ✅ 4. Add interactionConfig with V2 options
// ✅ 5. Test all existing functionality works
// ✅ 6. Explore new modes: Measurement, Annotation, Simulation

// New features you get automatically:
// 🎮 Professional mode selector with game-style UI
// ⌨️ Keyboard shortcuts (N/I/E/M/A/S for mode switching)
// 🎯 Zero race conditions - perfect click vs drag detection
// 📱 Touch gesture support for tablets/mobile
// 🔍 Debug mode for development and troubleshooting
// 🎨 Professional visual feedback with mode-specific cursors
// 📐 Built-in measurement tools for mission planning
// 📝 Annotation system for collaborative work
// 🎮 Simulation mode for scenario training

// Keyboard shortcuts available to users:
// N - Navigation mode (rotate/zoom globe)
// I - Intel Creation mode (click to create reports)
// E - Intel Inspection mode (examine existing reports)
// M - Measurement mode (distance/area tools)
// A - Annotation mode (add text notes)
// S - Simulation mode (scenario interaction)
// ESC - Return to Navigation mode

export default GlobeContainer;
