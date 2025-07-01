import React, { useState, useCallback, useEffect } from 'react';
import { useSecureChat } from '../../communication/context/useSecureChat';
import { EarthAllianceContact } from '../../types/SecureChat';
import SecureChatWindow from './SecureChatWindow';
import SecureChatContactList from './SecureChatContactList';
import styles from './SecureChatManager.module.css';

const SecureChatManager: React.FC = () => {
  const { state, openSecureChat, closeSecureChat, minimizeChat, maximizeChat } = useSecureChat();
  const [showContactList, setShowContactList] = useState(false);
  const [draggedWindow, setDraggedWindow] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    
    const window = state.activeWindows.get(windowId);
    if (!window) return;

    setDraggedWindow(windowId);
    setDragOffset({
      x: e.clientX - window.position.x,
      y: e.clientY - window.position.y
    });
  }, [state.activeWindows]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedWindow) return;

    const window = state.activeWindows.get(draggedWindow);
    if (!window) return;

    // TODO: Update window position through SecureChatContext
    // This would involve calling a updateWindowPosition action
    const newX = Math.max(0, Math.min(globalThis.window.innerWidth - window.size.width, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(globalThis.window.innerHeight - window.size.height, e.clientY - dragOffset.y));
    
    // For now, we'll just handle this in a future update to the context
    console.log('Moving window to:', newX, newY);
  }, [draggedWindow, dragOffset, state.activeWindows]);

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
    await openSecureChat(contact);
  }, [openSecureChat]);

  // Handle window operations
  const handleCloseWindow = useCallback(async (windowId: string) => {
    await closeSecureChat(windowId);
  }, [closeSecureChat]);

  const handleMinimizeWindow = useCallback((windowId: string) => {
    minimizeChat(windowId);
  }, [minimizeChat]);

  const handleMaximizeWindow = useCallback((windowId: string) => {
    maximizeChat(windowId);
  }, [maximizeChat]);

  // Get active windows as array, sorted by z-index
  const activeWindowsArray = Array.from(state.activeWindows.values())
    .sort((a, b) => a.position.zIndex - b.position.zIndex);

  return (
    <div className={styles.chatManager}>
      {/* Chat Toggle Button */}
      <button
        className={`${styles.chatToggle} ${state.emergencyMode ? styles.emergencyMode : ''} ${state.stealthMode ? styles.stealthMode : ''}`}
        onClick={() => setShowContactList(true)}
        title="Earth Alliance Secure Chat (Ctrl+Shift+C)"
        disabled={state.emergencyMode}
      >
        <div className={styles.toggleIcon}>
          {state.emergencyMode ? '🚨' : state.stealthMode ? '👁️' : '💬'}
        </div>
        
        {state.activeWindows.size > 0 && (
          <div className={styles.activeCount}>
            {state.activeWindows.size}
          </div>
        )}
        
        <div className={styles.securityIndicator}>
          <div 
            className={styles.threatLevel}
            style={{ 
              backgroundColor: 
                state.globalThreatLevel === 'critical' ? '#ef4444' :
                state.globalThreatLevel === 'high' ? '#f97316' :
                state.globalThreatLevel === 'elevated' ? '#facc15' : '#4ade80'
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
        >
          <SecureChatWindow
            chatWindow={chatWindow}
            onClose={() => handleCloseWindow(chatWindow.id)}
            onMinimize={() => handleMinimizeWindow(chatWindow.id)}
            onMaximize={() => handleMaximizeWindow(chatWindow.id)}
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
      {!state.networkStatus.isConnected && (
        <div className={styles.networkWarning}>
          ⚠️ Network connectivity issues detected
        </div>
      )}

      {/* Emergency Mode Overlay */}
      {state.emergencyMode && (
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
