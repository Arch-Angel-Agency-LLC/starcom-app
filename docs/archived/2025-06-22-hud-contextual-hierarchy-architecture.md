# HUD Contextual Hierarchy System - Architecture Specification

## 🎯 Executive Summary

This document defines the **Contextual Hierarchy System** for the Starcom HUD layout, establishing clear relationships between the **Center View** (dominant) and the surrounding **HUD zones** (submissive or supportive), creating a coherent operational interface where the Left Side controls global state while other zones provide contextual support.

## 🏗️ HUD Zone Architecture

### **Zone Classification System**

```
┌──────────────────────────────────────────────────────────┐
│                      TOP BAR                             │
│                (Context Submissive)                     │
├────────┬─────────────────────────────────────┬──────────┤
│ TL     │                                     │    TR    │
│(Empty) │              CENTER                 │ (Empty)  │
│        │         (DOMINANT VIEW)             │          │
│        │    ┌─────────────────────┐         │          │
│        │    │  3D Globe           │         │          │
│        │    │  Timeline Scrubber  │         │          │
│        │    │  Node-Link Graph    │         │ RIGHT    │
│ LEFT   │    └─────────────────────┘         │ SIDE     │
│ SIDE   │                                     │ BAR      │
│(Ctx    │                                     │(Action   │
│ Dom)   │                                     │ Orient)  │
├────────┼─────────────────────────────────────┼──────────┤
│   BL   │            BOTTOM BAR               │    BR    │
│(Ctx Sub)│        (Context Submissive)        │(Ctx Sub) │
└────────┴─────────────────────────────────────┴──────────┘
```

### **Zone Hierarchy & Relationships**

#### **🎮 CENTER - Dominant Authority** 
- **Role**: Primary operational display - dictates context for entire HUD
- **Views**: 3D Globe | Timeline Scrubber | Node-Link Graph
- **Authority**: Highest - all other zones respond to Center's mode
- **User Control**: No direct HUD controls, receives input from Left Side

#### **🔧 LEFT SIDE - Context Dominant**
- **Role**: Global state controller - changes what Center displays
- **Function**: Mode selection, data layer management, operational control  
- **Authority**: Controls Center, therefore controls all contextual zones
- **Content**: MegaCategoryPanel (PLANETARY/SPACE/CYBER/STELLAR)

#### **⚙️ RIGHT SIDE - Action Oriented**
- **Role**: Performs actions ON the Center content
- **Function**: Globe controls, filters, analysis tools, data manipulation
- **Authority**: Submissive to Center/Left - adapts to current mode
- **Content**: Mission Control, Intelligence Hub, Active Tools

#### **📊 BOTTOM BAR - Deep Context**  
- **Role**: Detailed information about user's current focus
- **Function**: Selected data deep-dive, regional analysis, timeline details
- **Authority**: Submissive to Center - shows details of selected items
- **Content**: Focus panels, detailed metrics, selected object info

#### **📈 TOP BAR - Status Context**
- **Role**: Global status and high-level operational metrics  
- **Function**: System status, alerts, time, user info, mission status
- **Authority**: Submissive to overall state - shows global context
- **Content**: Status marquee, alerts, system health, user identity

#### **📍 CORNERS - Specialized Functions**
- **BOTTOM LEFT**: Data export, bookmarks, saved states
- **BOTTOM RIGHT**: Real-time alerts, notifications, quick actions
- **TOP LEFT**: *Empty for clean interface*
- **TOP RIGHT**: *Empty for clean interface*

## 🔄 Contextual State Flow

### **State Propagation Pattern**
```
LEFT SIDE → CENTER → RIGHT SIDE
    ↓         ↓         ↓
    ↓    BOTTOM BAR ←──┘
    ↓         ↓
    └─→ TOP BAR
```

### **Information Flow Examples**

#### **Scenario 1: User Selects PLANETARY → Weather**
1. **Left Side**: User clicks PLANETARY mega-category → Weather sub-category
2. **Center**: 3D Globe switches to Earth weather visualization mode
3. **Right Side**: Shows weather control actions (layer toggles, intensity, time controls)
4. **Bottom Bar**: Hidden until user clicks on specific weather event
5. **Top Bar**: Updates to show current weather data sources and update status

#### **Scenario 2: User Clicks Hurricane on Globe**
1. **Center**: Hurricane highlighted on 3D Globe, camera focuses on region
2. **Right Side**: Shows hurricane-specific tools (track projection, intensity analysis)
3. **Bottom Bar**: Displays detailed hurricane data (wind speed, pressure, forecast path)
4. **Top Bar**: Shows alert level for the hurricane threat
5. **Left Side**: Remains unchanged (still in PLANETARY → Weather mode)

#### **Scenario 3: User Switches to Timeline View**
1. **Left Side**: User selects Timeline display mode
2. **Center**: Switches from 3D Globe to Timeline Scrubber view
3. **Right Side**: Shows timeline controls (speed, range, filters, bookmarks)
4. **Bottom Bar**: Shows detailed event information when timeline item selected
5. **Top Bar**: Shows temporal context (current date/time, playback speed)

## 🎯 Zone-Specific Responsibilities

### **LEFT SIDE (Context Dominant)**

#### **Primary Functions**
- **Mega-Category Selection**: PLANETARY | SPACE | CYBER | STELLAR
- **Data Layer Management**: Enable/disable visualization layers
- **Display Mode Control**: 3D Globe | Timeline | Node-Graph
- **Operation Mode**: Analysis | Investigation | Emergency | Mission Planning

#### **Content Areas**
- **Category Navigator**: 4 mega-categories with sub-categories
- **Active Layers Panel**: Currently enabled data visualizations
- **Quick Operations**: Emergency mode, focus mode, analysis mode
- **System Status**: Priority level, mission state, operation count

#### **Design Principles**
- Always visible (never collapses completely)
- Compact but information-dense
- Clear visual hierarchy
- Gaming/RTS-inspired aesthetics

### **RIGHT SIDE (Action Oriented)**

#### **Primary Functions**  
- **Globe Manipulation**: Zoom, rotate, focus, navigation
- **Layer Controls**: Opacity, filtering, styling, animation
- **Analysis Tools**: Measurements, comparisons, calculations
- **Export Functions**: Screenshots, data export, report generation

#### **Content Areas (Context Sensitive)**
- **PLANETARY Mode**: Weather controls, transport overlays, infrastructure tools
- **SPACE Mode**: Orbital mechanics, satellite controls, space weather tools  
- **CYBER Mode**: Network analysis, threat visualization, intel management
- **STELLAR Mode**: Deep space navigation, astro market tools, communications

#### **Content Sections**
- **Active Controls**: Tools for current mode/layer
- **Intelligence Hub**: Intel reports, analysis results
- **Live Metrics**: Real-time performance data
- **External Tools**: Links to specialized applications

#### **Design Principles**
- Contextually adaptive content
- Action-oriented interface elements
- Professional mission control aesthetics
- Collapsible for space efficiency

### **BOTTOM BAR (Deep Context)**

#### **Primary Functions**
- **Selected Object Details**: Deep-dive information on clicked items
- **Regional Analysis**: Geographic/temporal region examination  
- **Data Drill-Down**: Expanded metrics and detailed information
- **Contextual Tools**: Tools specific to selected content

#### **Content Areas (Context Sensitive)**
- **Globe Focus**: Details about clicked location/object
- **Timeline Focus**: Expanded event information and context
- **Node Focus**: Network relationship details and analysis
- **Multi-Select**: Comparison tools for multiple selected items

#### **Content Panels**
- **Data Panel**: Raw data, metrics, measurements
- **Analysis Panel**: AI insights, pattern detection, correlations
- **History Panel**: Historical context and trend analysis
- **Action Panel**: Available actions for selected objects

#### **Design Principles**
- Hidden when no focus/selection
- Expandable/collapsible height
- Rich data visualization
- Quick-access action buttons

### **TOP BAR (Status Context)**

#### **Primary Functions**
- **System Status**: Overall health and performance
- **Mission Context**: Current operation status and metrics
- **Global Alerts**: High-priority notifications and warnings
- **User Context**: Authentication, permissions, session info

#### **Content Areas**
- **Status Marquee**: Scrolling real-time data feeds
- **Alert Panel**: Critical notifications and warnings
- **Mission Header**: Current operation and priority level
- **User Panel**: Profile, settings, logout

#### **Design Principles**
- Always visible, minimal height
- High-information density
- Clear status indicators
- Professional command center aesthetic

### **CORNERS (Specialized Functions)**

#### **BOTTOM LEFT Corner**
- **Bookmarks**: Saved locations and states
- **Export Tools**: Data and view export functions  
- **History**: Recently accessed locations/modes
- **Presets**: Saved visualization configurations

#### **BOTTOM RIGHT Corner**
- **Live Alerts**: Real-time notifications
- **Quick Actions**: Emergency functions and shortcuts
- **Communication**: Team chat and collaboration tools
- **Help**: Context-sensitive help and tutorials

## 🎮 Gaming UX Integration

### **RTS-Style Interface Elements**

#### **Resource Management (Left Side)**
- **Category selection** like civilization/faction choice
- **Data layer management** like unit/building selection
- **Resource monitoring** with real-time counters

#### **Action Bar (Right Side)** 
- **Context-sensitive tools** like RTS unit abilities
- **Action buttons** for current mode/selection
- **Status indicators** for active operations

#### **Mini-Map & Status (Top Bar)**
- **Global overview** like RTS minimap
- **Resource counters** showing system status
- **Alert notifications** like RTS warnings

#### **Detail Panel (Bottom Bar)**
- **Selected unit details** when object clicked
- **Context information** for current focus
- **Action options** for selected items

## 🔧 Technical Implementation

### **Context Propagation System**
```typescript
interface HUDContextState {
  centerMode: '3D_GLOBE' | 'TIMELINE' | 'NODE_GRAPH';
  operationMode: 'PLANETARY' | 'SPACE' | 'CYBER' | 'STELLAR';
  selectedObject: SelectedObject | null;
  activeLayers: DataLayer[];
  focusRegion: GeographicRegion | null;
  missionContext: MissionState;
}
```

### **Zone Communication Pattern**
```typescript
// Left Side controls global state
const updateOperationMode = (mode: OperationMode) => {
  // Updates center view content
  // Triggers right side context adaptation  
  // Updates top bar status
  // Clears bottom bar if no selection
};

// Center view reports selection/focus
const onObjectSelected = (object: SelectedObject) => {
  // Triggers right side tool adaptation
  // Populates bottom bar with details
  // Updates top bar with selection context
};
```

### **Responsive Behavior**
- **Adaptive layouts** based on screen size
- **Collapsible zones** for smaller screens
- **Context preservation** during layout changes
- **Performance optimization** for real-time updates

---

## 🎯 Success Criteria

### **User Experience Goals**
- ✅ **Intuitive Navigation**: Clear understanding of zone relationships
- ✅ **Contextual Relevance**: Each zone shows appropriate content for current state
- ✅ **Efficient Workflow**: Smooth transitions between different operational modes
- ✅ **Information Hierarchy**: Important information prominently displayed

### **Technical Goals**
- ✅ **State Synchronization**: All zones reflect current context accurately
- ✅ **Performance**: Smooth updates and transitions
- ✅ **Scalability**: System can handle additional zones and features
- ✅ **Maintainability**: Clear separation of concerns between zones

This architecture creates a **coherent operational environment** where each HUD zone has a clear purpose and relationship to the central display, enabling efficient global command and control operations.
