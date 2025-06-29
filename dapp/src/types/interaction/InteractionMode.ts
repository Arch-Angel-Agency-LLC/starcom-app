// InteractionMode.ts
// Core interaction mode system for 3D globe interface

export enum InteractionMode {
  NAVIGATION = 'navigation',
  INTEL_PLACEMENT = 'intel_placement', 
  INTEL_INSPECTION = 'intel_inspection',
  MEASUREMENT = 'measurement',
  TACTICAL_OVERLAY = 'tactical_overlay'
}

export interface ModeConfig {
  id: InteractionMode;
  name: string;
  icon: string;
  cursor: string;
  description: string;
  shortcutKey: string;
  overlays: OverlayType[];
  statusBarConfig: StatusBarConfig;
  touchGestures: GestureConfig[];
}

export interface OverlayType {
  type: 'grid' | 'coordinates' | 'measurement' | 'tactical' | 'placement_guide';
  enabled: boolean;
  config: Record<string, string | number | boolean>;
}

export interface StatusBarConfig {
  showCoordinates: boolean;
  coordinateFormat: 'latlon' | 'mgrs' | 'utm';
  showZoom: boolean;
  showBearing: boolean;
  customText?: string;
}

export interface GestureConfig {
  type: 'tap' | 'double_tap' | 'long_press' | 'pinch' | 'pan' | 'rotate';
  fingers: number;
  action: string;
  threshold?: number;
  duration?: number;
}

export const MODE_CONFIGS: Record<InteractionMode, ModeConfig> = {
  [InteractionMode.NAVIGATION]: {
    id: InteractionMode.NAVIGATION,
    name: 'Navigation',
    icon: '🌐',
    cursor: 'grab',
    description: 'Navigate and explore the globe',
    shortcutKey: '1',
    overlays: [
      { type: 'coordinates', enabled: true, config: { format: 'latlon' } }
    ],
    statusBarConfig: {
      showCoordinates: true,
      coordinateFormat: 'latlon',
      showZoom: true,
      showBearing: false
    },
    touchGestures: [
      { type: 'pan', fingers: 1, action: 'rotate_globe' },
      { type: 'pinch', fingers: 2, action: 'zoom' },
      { type: 'double_tap', fingers: 1, action: 'zoom_to_point' }
    ]
  },
  
  [InteractionMode.INTEL_PLACEMENT]: {
    id: InteractionMode.INTEL_PLACEMENT,
    name: 'Intel Placement',
    icon: '📍',
    cursor: 'crosshair',
    description: 'Click to place new intelligence reports',
    shortcutKey: '2',
    overlays: [
      { type: 'grid', enabled: true, config: { spacing: 10 } },
      { type: 'coordinates', enabled: true, config: { format: 'mgrs' } },
      { type: 'placement_guide', enabled: true, config: { snapToGrid: false } }
    ],
    statusBarConfig: {
      showCoordinates: true,
      coordinateFormat: 'mgrs',
      showZoom: true,
      showBearing: false,
      customText: 'Click to place intel report'
    },
    touchGestures: [
      { type: 'tap', fingers: 1, action: 'place_intel' },
      { type: 'long_press', fingers: 1, action: 'show_placement_menu', duration: 500 }
    ]
  },
  
  [InteractionMode.INTEL_INSPECTION]: {
    id: InteractionMode.INTEL_INSPECTION,
    name: 'Intel Inspection',
    icon: '🔍',
    cursor: 'pointer',
    description: 'Inspect existing intelligence reports',
    shortcutKey: '3',
    overlays: [
      { type: 'coordinates', enabled: true, config: { format: 'latlon' } }
    ],
    statusBarConfig: {
      showCoordinates: true,
      coordinateFormat: 'latlon',
      showZoom: false,
      showBearing: false,
      customText: 'Hover to inspect, click for details'
    },
    touchGestures: [
      { type: 'tap', fingers: 1, action: 'select_intel' },
      { type: 'double_tap', fingers: 1, action: 'open_intel_details' },
      { type: 'long_press', fingers: 1, action: 'show_intel_menu', duration: 300 }
    ]
  },
  
  [InteractionMode.MEASUREMENT]: {
    id: InteractionMode.MEASUREMENT,
    name: 'Measurement',
    icon: '📏',
    cursor: 'crosshair',
    description: 'Measure distances and areas',
    shortcutKey: '4',
    overlays: [
      { type: 'grid', enabled: true, config: { spacing: 5 } },
      { type: 'coordinates', enabled: true, config: { format: 'utm' } },
      { type: 'measurement', enabled: true, config: { units: 'metric' } }
    ],
    statusBarConfig: {
      showCoordinates: true,
      coordinateFormat: 'utm',
      showZoom: true,
      showBearing: true,
      customText: 'Click and drag to measure'
    },
    touchGestures: [
      { type: 'tap', fingers: 1, action: 'start_measurement' },
      { type: 'pan', fingers: 1, action: 'extend_measurement' },
      { type: 'double_tap', fingers: 1, action: 'complete_measurement' }
    ]
  },
  
  [InteractionMode.TACTICAL_OVERLAY]: {
    id: InteractionMode.TACTICAL_OVERLAY,
    name: 'Tactical View',
    icon: '⚔️',
    cursor: 'grab',
    description: 'Military grid overlays and tactical information',
    shortcutKey: '5',
    overlays: [
      { type: 'grid', enabled: true, config: { spacing: 1, type: 'mgrs' } },
      { type: 'coordinates', enabled: true, config: { format: 'mgrs' } },
      { type: 'tactical', enabled: true, config: { showSectors: true } }
    ],
    statusBarConfig: {
      showCoordinates: true,
      coordinateFormat: 'mgrs',
      showZoom: true,
      showBearing: true,
      customText: 'Tactical overlay active'
    },
    touchGestures: [
      { type: 'pan', fingers: 1, action: 'rotate_globe' },
      { type: 'tap', fingers: 1, action: 'query_grid' },
      { type: 'pinch', fingers: 2, action: 'zoom' }
    ]
  }
};

export const getDefaultMode = (): InteractionMode => InteractionMode.NAVIGATION;

export const getModeConfig = (mode: InteractionMode): ModeConfig => {
  return MODE_CONFIGS[mode];
};

export const getAllModes = (): ModeConfig[] => {
  return Object.values(MODE_CONFIGS);
};
