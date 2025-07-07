/**
 * SecureChatManager-unified.tsx
 * 
 * A unified version of the SecureChatManager component that uses the 
 * ChatContext instead of the legacy SecureChatContext. This component manages
 * secure chat windows and provides a floating UI for accessing Earth Alliance
 * secure communications.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { EarthAllianceContact, ThreatLevel } from '../../types/SecureChat';
import SecureChatWindow from './SecureChatWindow-unified';
import SecureChatContactList from './SecureChatContactList-unified';
import styles from './SecureChatManager.module.css';

interface ChatWindowState {
  id: string;
  contactName: string;
  isMinimized: boolean;
  isMaximized: boolean;
  position: {
    x: number;
    y: number;
    zIndex: number;
  };
  size: {
    width: number;
    height: number;
  };
  threatLevel: ThreatLevel;
}

const SecureChatManager: React.FC = () => {
  const chat = useChat();
  const { 
    isConnected, 
    provider, 
    providerType, 
    setProviderType 
  } = chat;
  
  // Local state for managing chat windows
  const [activeWindows, setActiveWindows] = useState<Map<string, ChatWindowState>>(new Map());
  const [showContactList, setShowContactList] = useState(false);
  const [draggedWindow, setDraggedWindow] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [globalThreatLevel, setGlobalThreatLevel] = useState<ThreatLevel>('normal');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({
    isConnected: false,
    relayNodes: 0,
    ipfsNodes: 0
  });

  // Update network status from provider
  useEffect(() => {
    setNetworkStatus(prev => ({
      ...prev,
      isConnected: isConnected
    }));
    
    // In the unified system, provider doesn't directly expose system info
    // We'll use default values and update from the chat system as needed
  }, [isConnected, provider]);

  // Ensure we're using the secure provider
  useEffect(() => {
    if (isConnected && providerType !== 'secure' && typeof setProviderType === 'function') {
      setProviderType('secure');
    }
  }, [isConnected, providerType, setProviderType]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C to open contact list
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        setShowContactList(true);
      }
      
      // Escape to close contact list
      if (event.key === 'Escape' && showContactList) {
        setShowContactList(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showContactList]);

  // Handle window dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, windowId: string) => {
    if (e.target instanceof Element && !e.target.closest(`.${styles.chatHeader}`)) {
      return; // Only allow dragging from header
    }
    
    const window = activeWindows.get(windowId);
    if (!window) return;

    setDraggedWindow(windowId);
    setDragOffset({
      x: e.clientX - window.position.x,
      y: e.clientY - window.position.y
    });
  }, [activeWindows]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedWindow) return;

    const window = activeWindows.get(draggedWindow);
    if (!window) return;

    // Calculate new position
    const newX = Math.max(0, Math.min(globalThis.window.innerWidth - window.size.width, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(globalThis.window.innerHeight - window.size.height, e.clientY - dragOffset.y));
    
    // Update window position
    setActiveWindows(prev => {
      const updated = new Map(prev);
      const current = prev.get(draggedWindow);
      if (current) {
        updated.set(draggedWindow, {
          ...current,
          position: {
            ...current.position,
            x: newX,
            y: newY
          }
        });
      }
      return updated;
    });
  }, [draggedWindow, dragOffset, activeWindows]);

  const handleMouseUp = useCallback(() => {
    setDraggedWindow(null);
  }, []);

  useEffect(() => {
    if (draggedWindow) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedWindow, handleMouseMove, handleMouseUp]);

  // Handle contact selection
  const handleContactSelect = useCallback(async (contact: EarthAllianceContact) => {
    setShowContactList(false);
    
    // Check if we already have a window for this contact
    if (activeWindows.has(contact.pubkey)) {
      // Just focus the existing window
      setActiveWindows(prev => {
        const updated = new Map(prev);
        const current = prev.get(contact.pubkey);
        if (current) {
          // Bring to front by setting highest z-index
          const highestZ = Array.from(prev.values()).reduce(
            (max, win) => Math.max(max, win.position.zIndex), 0
          );
          
          updated.set(contact.pubkey, {
            ...current,
            isMinimized: false,
            position: {
              ...current.position,
              zIndex: highestZ + 1
            }
          });
        }
        return updated;
      });
      return;
    }
    
    // Create a new window for this contact
    try {
      if (providerType !== 'secure' && typeof setProviderType === 'function') {
        await setProviderType('secure');
      }
      
      // Calculate position for the new window
      const baseX = (globalThis.window.innerWidth / 2) - 200;
      const baseY = (globalThis.window.innerHeight / 2) - 300;
      const offset = activeWindows.size * 30;
      
      // Get highest z-index
      const highestZ = Array.from(activeWindows.values()).reduce(
        (max, win) => Math.max(max, win.position.zIndex), 0
      );
      
      // Add new window
      setActiveWindows(prev => {
        const updated = new Map(prev);
        updated.set(contact.pubkey, {
          id: contact.pubkey,
          contactName: contact.displayName,
          isMinimized: false,
          isMaximized: false,
          position: {
            x: baseX + offset,
            y: baseY + offset,
            zIndex: highestZ + 1
          },
          size: {
            width: 400,
            height: 600
          },
          threatLevel: 'normal' // Default to normal threat level
        });
        return updated;
      });
      
    } catch (error) {
      console.error('Failed to open secure chat:', error);
    }
  }, [activeWindows, providerType, setProviderType]);

  // Handle window operations
  const handleCloseWindow = useCallback((windowId: string) => {
    setActiveWindows(prev => {
      const updated = new Map(prev);
      updated.delete(windowId);
      return updated;
    });
  }, []);

  const handleMinimizeWindow = useCallback((windowId: string) => {
    setActiveWindows(prev => {
      const updated = new Map(prev);
      const current = prev.get(windowId);
      if (current) {
        updated.set(windowId, {
          ...current,
          isMinimized: true
        });
      }
      return updated;
    });
  }, []);

  const handleMaximizeWindow = useCallback((windowId: string) => {
    setActiveWindows(prev => {
      const updated = new Map(prev);
      const current = prev.get(windowId);
      if (current) {
        updated.set(windowId, {
          ...current,
          isMaximized: !current.isMaximized
        });
      }
      return updated;
    });
  }, []);

  // Get active windows as array, sorted by z-index
  const activeWindowsArray = useMemo(() => {
    return Array.from(activeWindows.values())
      .sort((a, b) => a.position.zIndex - b.position.zIndex);
  }, [activeWindows]);

  return (
    <div className={styles.chatManager}>
      {/* Chat Toggle Button */}
      <button
        className={`${styles.chatToggle} ${emergencyMode ? styles.emergencyMode : ''} ${stealthMode ? styles.stealthMode : ''}`}
        onClick={() => setShowContactList(true)}
        title="Earth Alliance Secure Chat (Ctrl+Shift+C)"
        disabled={emergencyMode}
      >
        <div className={styles.toggleIcon}>
          {emergencyMode ? '🚨' : stealthMode ? '👁️' : '💬'}
        </div>
        
        {activeWindows.size > 0 && (
          <div className={styles.activeCount}>
            {activeWindows.size}
          </div>
        )}
        
        <div className={styles.securityIndicator}>
          <div 
            className={styles.threatLevel}
            style={{ 
              backgroundColor: 
                globalThreatLevel === 'critical' ? '#ef4444' :
                globalThreatLevel === 'high' ? '#f97316' :
                globalThreatLevel === 'elevated' ? '#facc15' : '#4ade80'
            }}
          />
        </div>
      </button>

      {/* Active Chat Windows */}
      {activeWindowsArray.map((chatWindow) => (
        <div
          key={chatWindow.id}
          className={styles.chatWindowContainer}
          onMouseDown={(e) => handleMouseDown(e, chatWindow.id)}
          style={{
            position: 'absolute',
            top: `${chatWindow.position.y}px`,
            left: `${chatWindow.position.x}px`,
            width: chatWindow.isMaximized ? '100%' : `${chatWindow.size.width}px`,
            height: chatWindow.isMaximized ? '100%' : `${chatWindow.size.height}px`,
            zIndex: chatWindow.position.zIndex,
            display: chatWindow.isMinimized ? 'none' : 'block'
          }}
        >
          <SecureChatWindow
            chatId={chatWindow.id}
            contactName={chatWindow.contactName}
            onClose={() => handleCloseWindow(chatWindow.id)}
            onMinimize={() => handleMinimizeWindow(chatWindow.id)}
            onMaximize={() => handleMaximizeWindow(chatWindow.id)}
            isActive={true}
            isMaximized={chatWindow.isMaximized}
            isMinimized={chatWindow.isMinimized}
            threatLevel={chatWindow.threatLevel}
          />
        </div>
      ))}

      {/* Contact List Modal */}
      <SecureChatContactList
        isVisible={showContactList}
        onClose={() => setShowContactList(false)}
        onContactSelect={handleContactSelect}
      />

      {/* Network Status Indicator */}
      {!networkStatus.isConnected && (
        <div className={styles.networkWarning}>
          ⚠️ Network connectivity issues detected
        </div>
      )}

      {/* Emergency Mode Overlay */}
      {emergencyMode && (
        <div className={styles.emergencyOverlay}>
          <div className={styles.emergencyMessage}>
            🚨 EMERGENCY MODE ACTIVE
            <div className={styles.emergencySubtext}>
              Secure communications restricted - Command channels only
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureChatManager;
