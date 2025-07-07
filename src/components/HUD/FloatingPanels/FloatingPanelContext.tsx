import React from 'react';

// Core floating panel types
export interface FloatingPanelPosition {
  anchorTo: 'geographic' | 'orbital' | 'magnetic' | 'screen';
  lat?: number;
  lng?: number;
  x?: number; // Screen coordinates
  y?: number;
  offset: { x: number; y: number };
}

export interface FloatingPanelData {
  [key: string]: unknown;
}

export interface FloatingPanel {
  id: string;
  type: 'bubble' | 'stream' | 'control' | 'alert';
  title: string;
  component: React.ComponentType<{ data?: FloatingPanelData }>;
  position: FloatingPanelPosition;
  priority: 'primary' | 'secondary' | 'tertiary';
  triggers: string[];
  isVisible: boolean;
  isMinimized?: boolean;
  zIndex: number;
  data?: FloatingPanelData;
}

export interface GlobeInteraction {
  hoveredRegion: string | null;
  clickedPosition: { lat: number; lng: number } | null;
  activeFeatures: string[];
}

export interface FloatingPanelContextType {
  registerPanel: (panel: Omit<FloatingPanel, 'isVisible' | 'zIndex'>) => void;
  activePanels: FloatingPanel[];
  globeInteraction: GlobeInteraction;
  simulateGlobeHover: (region: string | null) => void;
  simulateGlobeClick: (lat: number, lng: number) => void;
  addActiveFeature: (feature: string) => void;
  removeActiveFeature: (feature: string) => void;
}

// Context for floating panels
export const FloatingPanelContext = React.createContext<FloatingPanelContextType | null>(null);

export const useFloatingPanels = () => {
  const context = React.useContext(FloatingPanelContext);
  if (!context) {
    throw new Error('useFloatingPanels must be used within FloatingPanelManager');
  }
  return context;
};
