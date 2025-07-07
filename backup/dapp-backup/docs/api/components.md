# Component Documentation Index

This document consolidates all component documentation from across the codebase into a centralized reference.

## Core Application Components

### Main App Components
- **App.tsx**: Main application entry point
- **Globe**: 3D globe visualization engine
- **HUD**: Heads-up display interface system

### HUD System Components

#### Bars
- **TopBar**: Main navigation and controls
- **BottomBar**: Status and information display  
- **LeftSideBar**: Tool panels and features
- **RightSideBar**: Data panels and analytics

#### Corners
- **TopLeft**: Quick access controls
- **TopRight**: User and system status
- **BottomLeft**: Notifications and alerts
- **BottomRight**: Mini controls and toggles

#### Overlays
- **Overlay**: General overlay system
- **MiniMap**: Miniature navigation map
- **Tooltip**: Interactive tooltip system
- **TimeScrubber**: Timeline navigation control

### Globe Features

#### Geographic Elements
- **GlobeGeoEvent**: Geographic event markers
- **GlobeGeoHeatmap**: Heat map visualizations
- **GlobeGeoMarker**: Geographic location markers
- **GlobeGeoOverlay**: Geographic data overlays
- **GlobeGeoWeather**: Weather data visualization

#### Space Elements
- **GlobeSpaceAsset**: Space-based assets
- **GlobeSpacecraft**: Spacecraft tracking
- **GlobeSpaceEntity**: General space entities
- **GlobeIntelNode**: Intelligence network nodes

#### Interaction Systems
- **GlobeHandlers**: Event handling system

## Documentation Standards

All component documentation should follow the pattern:
- Purpose and functionality
- Props interface
- Usage examples
- Related components
- AI-NOTE comments for context

---
*Consolidated: June 22, 2025*
*AI-NOTE: This replaces scattered component.md files throughout src/ directory*
