import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './PopupManager.module.css';

interface Popup {
  id: string;
  component: React.ComponentType<{ onClose: () => void; [key: string]: unknown }>;
  props?: Record<string, unknown>;
  zIndex?: number;
  backdrop?: boolean;
  onClose?: () => void;
}

interface PopupContextValue {
  showPopup: (popup: Omit<Popup, 'id'>) => string;
  hidePopup: (id: string) => void;
  hideAllPopups: () => void;
  activePopups: Popup[];
}

const PopupContext = createContext<PopupContextValue | null>(null);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

interface PopupProviderProps {
  children: React.ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [popups, setPopups] = useState<Map<string, Popup>>(new Map());

  const showPopup = useCallback((popupData: Omit<Popup, 'id'>) => {
    const id = `popup_${Date.now()}_${Math.random()}`;
    const popup: Popup = {
      id,
      zIndex: 3000 + popups.size, // Higher than floating panels
      backdrop: true,
      ...popupData,
    };

    setPopups(prev => new Map(prev).set(id, popup));
    return id;
  }, [popups.size]);

  const hidePopup = useCallback((id: string) => {
    setPopups(prev => {
      const newMap = new Map(prev);
      const popup = newMap.get(id);
      if (popup?.onClose) {
        popup.onClose();
      }
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const hideAllPopups = useCallback(() => {
    popups.forEach(popup => {
      if (popup.onClose) {
        popup.onClose();
      }
    });
    setPopups(new Map());
  }, [popups]);

  const activePopups = Array.from(popups.values());

  const contextValue: PopupContextValue = {
    showPopup,
    hidePopup,
    hideAllPopups,
    activePopups,
  };

  const renderPopups = () => {
    if (activePopups.length === 0) return null;

    return createPortal(
      <div className={styles.popupLayer}>
        {activePopups.map(popup => {
          const PopupComponent = popup.component;
          return (
            <div key={popup.id} className={styles.popupContainer} style={{ zIndex: popup.zIndex }}>
              {popup.backdrop && (
                <div 
                  className={styles.popupBackdrop} 
                  onClick={() => hidePopup(popup.id)}
                />
              )}
              <div className={styles.popupContent}>
                <PopupComponent 
                  {...popup.props}
                  onClose={() => hidePopup(popup.id)}
                />
              </div>
            </div>
          );
        })}
      </div>,
      document.body
    );
  };

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
      {renderPopups()}
    </PopupContext.Provider>
  );
};
