/**
 * useFloatingPanel Hook
 * 
 * This hook provides an interface for components to interact with the floating panel system.
 * It allows panels to be opened, closed, minimized, and maximized.
 */

import { useContext, useCallback } from 'react';
import { FloatingPanelContext, FloatingPanelData } from '../../components/HUD/FloatingPanels/FloatingPanelContext';

interface UseFloatingPanelOptions {
  title?: string;
  width?: number;
  height?: number;
  resizable?: boolean;
  moveable?: boolean;
  onClose?: () => void;
}

export const useFloatingPanel = () => {
  const context = useContext(FloatingPanelContext);
  
  if (!context) {
    throw new Error('useFloatingPanel must be used within a FloatingPanelManager');
  }
  
  /**
   * Opens a floating panel
   * @param id Unique identifier for the panel
   * @param component The React component to render in the panel
   * @param options Panel options like title, dimensions, etc.
   * @param data Optional data to pass to the panel component
   */
  const openPanel = useCallback((
    id: string,
    component: React.ComponentType<any>,
    options: UseFloatingPanelOptions = {},
    data?: FloatingPanelData
  ) => {
    const {
      title = 'Floating Panel',
      width = 600,
      height = 400,
      resizable = true,
      moveable = true,
      onClose
    } = options;
    
    // Register the panel with the floating panel system
    context.registerPanel({
      id,
      type: 'control',
      title,
      component,
      position: {
        anchorTo: 'screen',
        x: Math.max(0, (window.innerWidth - width) / 2),
        y: Math.max(0, (window.innerHeight - height) / 2),
        offset: { x: 0, y: 0 }
      },
      priority: 'primary',
      triggers: ['manual'],
      isMinimized: false,
      data: {
        ...data,
        width,
        height,
        resizable,
        moveable,
        onClose
      }
    });
    
    // Activate the feature to make the panel visible
    context.addActiveFeature(id);
    
    return id;
  }, [context]);
  
  /**
   * Closes a floating panel
   * @param id The panel ID to close
   */
  const closePanel = useCallback((id: string) => {
    context.removeActiveFeature(id);
  }, [context]);
  
  /**
   * Minimizes a floating panel
   * @param id The panel ID to minimize
   */
  const minimizePanel = useCallback((id: string) => {
    // This would be implemented in the FloatingPanelManager
    // We'll need to add this functionality there
    console.log('Minimize panel:', id);
  }, []);
  
  /**
   * Maximizes a floating panel
   * @param id The panel ID to maximize
   */
  const maximizePanel = useCallback((id: string) => {
    // This would be implemented in the FloatingPanelManager
    // We'll need to add this functionality there
    console.log('Maximize panel:', id);
  }, []);
  
  return {
    openPanel,
    closePanel,
    minimizePanel,
    maximizePanel
  };
};
