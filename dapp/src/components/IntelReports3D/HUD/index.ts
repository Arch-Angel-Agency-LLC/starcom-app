/**
 * Intel Reports 3D HUD Components
 * 
 * This module exports all HUD panel components for Intel Reports 3D integration.
 * These components integrate with the main Starcom HUD architecture to provide
 * seamless Intel Reports functionality across different UI areas.
 */

// Export all HUD panel components
export { default as IntelReportsPanel } from './IntelReportsPanel';
export { default as IntelDetailPanel } from './IntelDetailPanel';
export { default as IntelBottomBarPanel } from './IntelBottomBarPanel';
export { default as IntelFloatingPanel } from './IntelFloatingPanel';

/**
 * HUD Integration Guide:
 * 
 * 1. IntelReportsPanel - Left sidebar integration
 *    - Import and add to LeftSideBar component
 *    - Provides quick access to reports and filters
 * 
 * 2. IntelDetailPanel - Right sidebar integration  
 *    - Import and replace CyberInvestigationHub in RightSideBar
 *    - Shows detailed report information and analysis
 * 
 * 3. IntelBottomBarPanel - Bottom bar integration
 *    - Import and add to BottomBar component
 *    - Provides expandable report overview
 * 
 * 4. IntelFloatingPanel - Floating window integration
 *    - Import and use with FloatingPanelManager
 *    - Provides independent, draggable report viewer
 * 
 * Example usage:
 * 
 * ```tsx
 * import { 
 *   IntelReportsPanel, 
 *   IntelDetailPanel, 
 *   IntelBottomBarPanel, 
 *   IntelFloatingPanel 
 * } from './components/IntelReports3D/HUD';
 * 
 * // In LeftSideBar.tsx
 * <IntelReportsPanel 
 *   isCollapsed={isCollapsed}
 *   onReportSelect={handleReportSelect}
 * />
 * 
 * // In RightSideBar.tsx (replace CyberInvestigationHub)
 * <IntelDetailPanel 
 *   isCollapsed={isCollapsed}
 *   selectedReportId={selectedReportId}
 *   onReportSelect={handleReportSelect}
 * />
 * 
 * // In BottomBar.tsx
 * <IntelBottomBarPanel 
 *   isExpanded={isExpanded}
 *   onToggleExpanded={handleToggleExpanded}
 *   onReportSelect={handleReportSelect}
 * />
 * 
 * // As floating panel
 * <IntelFloatingPanel 
 *   isVisible={showFloatingPanel}
 *   onClose={() => setShowFloatingPanel(false)}
 *   selectedReportId={selectedReportId}
 * />
 * ```
 */
