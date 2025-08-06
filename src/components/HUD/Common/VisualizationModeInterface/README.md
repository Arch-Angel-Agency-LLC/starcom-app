# VisualizationModeInterface - Complete Documentation

## Overview

The `VisualizationModeInterface` is a new compact control system for managing both primary and secondary visualization modes in the Starcom CyberCommand interface. It provides emoji-based buttons for quick mode switching and integrates seamlessly with the CyberCommandLeftSideBar.

## Architecture

### Component Structure
```
VisualizationModeInterface/
├── VisualizationModeInterface.tsx          # Main container component
├── PrimaryModeSelector.tsx                 # 3 primary mode buttons
├── SecondaryModeSelector.tsx              # Dynamic secondary mode buttons
├── VisualizationModeInterface.module.css  # Container styles
├── PrimaryModeSelector.module.css         # Primary button styles
├── SecondaryModeSelector.module.css       # Secondary button styles
└── index.ts                              # Export definitions
```

### Primary Visualization Modes

1. **CyberCommand** (📑)
   - **Description**: Intelligence & Security Operations
   - **Secondary Modes**: IntelReports, CyberThreats, CyberAttacks, NetworkInfrastructure, CommHubs
   - **Default**: IntelReports

2. **GeoPolitical** (🌍)
   - **Description**: Global Political Analysis
   - **Secondary Modes**: NationalTerritories, DiplomaticEvents, ResourceZones
   - **Default**: NationalTerritories

3. **EcoNatural** (🌿)
   - **Description**: Environmental & Weather Systems
   - **Secondary Modes**: SpaceWeather, EcologicalDisasters, EarthWeather
   - **Default**: SpaceWeather

### Secondary Visualization Modes

#### CyberCommand Secondary Modes
- **IntelReports** (📑): Intelligence Analysis & Reports
- **CyberThreats** (🛡️): Threat Detection & Analysis
- **CyberAttacks** (⚡): Active Attack Monitoring
- **Satellites** (🛰️): Real-time Satellite Tracking (Space Stations & GPS)
- **CommHubs** (📡): Communication Network Analysis

#### GeoPolitical Secondary Modes
- **NationalTerritories** (🗺️): Sovereign Boundaries & Claims
- **DiplomaticEvents** (🤝): International Relations & Treaties
- **ResourceZones** (⛽): Strategic Resources & Trade Routes

#### EcoNatural Secondary Modes
- **SpaceWeather** (☀️): Solar Activity & Geomagnetic Events
- **EcologicalDisasters** (🌋): Natural Disasters & Environmental Crises
- **EarthWeather** (🌦️): Atmospheric Conditions & Climate

## Integration

### CyberCommandLeftSideBar Integration

The interface is integrated into the CyberCommandLeftSideBar positioned directly below the TinyGlobe:

```tsx
<div className={styles.globeContainer}>
  <Suspense fallback={<div className={styles.tinyGlobePlaceholder}>Loading Globe...</div>}>
    <TinyGlobe />
  </Suspense>
</div>

{/* NEW: Visualization Mode Controls */}
<div className={styles.visualizationControls}>
  <VisualizationModeInterface compact={true} />
</div>
```

### Context Integration

The interface uses the existing `VisualizationModeContext` to:
- Get current visualization mode state
- Switch between primary modes
- Switch between secondary modes
- Persist mode selections

## Styling & Design

### Design Principles
- **Compact**: Optimized for narrow sidebar space
- **Emoji-only**: No text labels to maximize space efficiency
- **Visual Hierarchy**: Primary modes are larger than secondary modes
- **State Indication**: Clear visual feedback for active modes
- **Accessibility**: Full ARIA support and keyboard navigation

### Color Scheme
- **Primary Modes**: Cyan/blue theme matching CyberCommand aesthetics
- **Secondary Modes**: Green theme to differentiate from primary
- **Active States**: Increased opacity and glow effects
- **Hover States**: Subtle animations and highlighting

### Responsive Behavior
- **Compact Mode**: Smaller buttons and reduced spacing
- **Reduced Motion**: Respects user accessibility preferences
- **High Contrast**: Enhanced visibility for accessibility

## Usage

### Basic Integration
```tsx
import { VisualizationModeInterface } from '@/components/HUD/Common/VisualizationModeInterface';

// Standard usage
<VisualizationModeInterface />

// Compact mode for narrow spaces
<VisualizationModeInterface compact={true} />
```

### Individual Components
```tsx
import { PrimaryModeSelector, SecondaryModeSelector } from '@/components/HUD/Common/VisualizationModeInterface';

// Use components separately if needed
<PrimaryModeSelector compact={true} />
<SecondaryModeSelector primaryMode="CyberCommand" activeSubMode="IntelReports" />
```

## Future Enhancements

### Planned Features
1. **Mode Descriptions**: Expandable tooltips with detailed mode information
2. **Quick Actions**: Context menus for mode-specific actions
3. **Custom Modes**: User-defined visualization modes
4. **Mode History**: Recently used modes for quick switching
5. **Keyboard Shortcuts**: Number key shortcuts for rapid mode switching

### Intel Integration Opportunities
1. **Intel Mode Indicators**: Show active Intel operations in relevant modes
2. **Intel Quick Actions**: Direct Intel creation from visualization modes
3. **Mode-Specific Data**: Filter Intel by current visualization mode
4. **Intel Status**: Visual indicators for Intel processing status

## Technical Notes

### Performance Considerations
- Uses React.memo for optimization where appropriate
- CSS transitions for smooth animations
- Minimal re-renders through proper state management

### Accessibility Features
- Full ARIA label support
- Keyboard navigation (Tab, Enter, Space)
- Screen reader compatibility
- High contrast mode support
- Reduced motion support

### Browser Compatibility
- Modern browsers with CSS Grid/Flexbox support
- Graceful degradation for older browsers
- Mobile-responsive design

## Testing

### Component Testing
```bash
# Run component tests
npm test VisualizationModeInterface

# Run specific test suites
npm test PrimaryModeSelector
npm test SecondaryModeSelector
```

### Integration Testing
- Test with CyberCommandLeftSideBar
- Test mode persistence across sessions
- Test with different screen sizes
- Test accessibility features

---

**Created**: August 3, 2025  
**Purpose**: Primary and secondary visualization mode controls for CyberCommand  
**Integration**: CyberCommandLeftSideBar positioning below TinyGlobe  
**Design**: Compact emoji-only buttons with visual state indication
