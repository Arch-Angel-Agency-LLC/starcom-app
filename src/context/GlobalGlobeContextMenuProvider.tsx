/**
 * GlobalGlobeContextMenuProvider - Top-level context menu provider
 * 
 * Provides a context menu that renders above all other UI elements,
 * including HUDLayout. This ensures the menu appears on top of everything.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GlobeContextMenu, GlobeContextAction, GlobeContextActionData } from '../components/ui/GlobeContextMenu/GlobeContextMenu';

interface GlobalGlobeContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  geoLocation: { lat: number; lng: number } | null;
  onAction?: (action: GlobeContextAction, data?: GlobeContextActionData) => void;
}

interface GlobalGlobeContextMenuContextValue {
  showContextMenu: (
    position: { x: number; y: number },
    geoLocation: { lat: number; lng: number } | null,
    onAction?: (action: GlobeContextAction, data?: GlobeContextActionData) => void
  ) => void;
  hideContextMenu: () => void;
  isVisible: boolean;
}

const GlobalGlobeContextMenuContext = createContext<GlobalGlobeContextMenuContextValue | null>(null);

export const useGlobalGlobeContextMenu = (): GlobalGlobeContextMenuContextValue => {
  const context = useContext(GlobalGlobeContextMenuContext);
  if (!context) {
    throw new Error('useGlobalGlobeContextMenu must be used within a GlobalGlobeContextMenuProvider');
  }
  return context;
};

interface GlobalGlobeContextMenuProviderProps {
  children: React.ReactNode;
}

export const GlobalGlobeContextMenuProvider: React.FC<GlobalGlobeContextMenuProviderProps> = ({ children }) => {
  const [menuState, setMenuState] = useState<GlobalGlobeContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    geoLocation: null,
    onAction: undefined
  });

  const showContextMenu = useCallback((
    position: { x: number; y: number },
    geoLocation: { lat: number; lng: number } | null,
    onAction?: (action: GlobeContextAction, data?: GlobeContextActionData) => void
  ) => {
    setMenuState({
      visible: true,
      position,
      geoLocation,
      onAction
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      visible: false
    }));
  }, []);

  const handleAction = useCallback((action: GlobeContextAction, data?: GlobeContextActionData) => {
    if (menuState.onAction) {
      menuState.onAction(action, data);
    }
    hideContextMenu();
  }, [menuState.onAction, hideContextMenu]);

  const contextValue: GlobalGlobeContextMenuContextValue = {
    showContextMenu,
    hideContextMenu,
    isVisible: menuState.visible
  };

  return (
    <GlobalGlobeContextMenuContext.Provider value={contextValue}>
      {children}
      
      {/* Top-level context menu - rendered above everything */}
      <GlobeContextMenu
        visible={menuState.visible}
        position={menuState.position}
        geoLocation={menuState.geoLocation}
        onClose={hideContextMenu}
        onAction={handleAction}
      />
    </GlobalGlobeContextMenuContext.Provider>
  );
};

export default GlobalGlobeContextMenuProvider;
