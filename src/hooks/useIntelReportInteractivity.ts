// Interactive state management hook for Intel Report 3D models
// Handles hover, click, and popup state for enhanced user experience

import { useState, useCallback, useRef, useMemo } from 'react';
import { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';
import { InteractionState } from '../types/intelReportInteractivity';
import type { IntelReportData } from '../models/IntelReportData';

interface UseIntelReportInteractivityOptions {
  hoverDebounceMs?: number;
  clickDebounceMs?: number;
  enableKeyboardNavigation?: boolean;
  enableTouchInteractions?: boolean;
}

interface IntelReportInteractivityState {
  // Current interaction state
  hoveredReport: IntelReportOverlayMarker | null;
  selectedReport: IntelReportData | null;
  interactionState: InteractionState;
  
  // UI state
  tooltipVisible: boolean;
  popupVisible: boolean;
  popupLoading: boolean;
  
  // Interaction handlers
  handleModelHover: (report: IntelReportOverlayMarker | null) => void;
  handleModelClick: (report: IntelReportOverlayMarker) => Promise<void>;
  handleModelFocus: (report: IntelReportOverlayMarker) => void;
  handlePopupClose: () => void;
  
  // Keyboard navigation
  handleKeyboardNavigation: (event: KeyboardEvent) => void;
  
  // Accessibility
  announceToScreenReader: (message: string) => void;
  
  // Performance
  clearHoverState: () => void;
  preloadDetailedReport: (reportId: string) => Promise<void>;
}

export const useIntelReportInteractivity = (
  options: UseIntelReportInteractivityOptions = {}
): IntelReportInteractivityState => {
  const {
    hoverDebounceMs = 150,
    clickDebounceMs = 300,
    enableKeyboardNavigation = true,
    enableTouchInteractions = true
  } = options;

  // Suppress unused variable warning
  void enableTouchInteractions;

  // Core state
  const [hoveredReport, setHoveredReport] = useState<IntelReportOverlayMarker | null>(null);
  const [selectedReport, setSelectedReport] = useState<IntelReportData | null>(null);
  const [interactionState, setInteractionState] = useState<InteractionState>({
    isHovering: false,
    isClicking: false,
    isLoading: false,
    hasError: false,
    focusedReportId: null,
    lastInteractionTime: Date.now(),
    interactionCount: 0
  });

  // UI state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);

  // Refs for debouncing and cleanup
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const lastClickTimeRef = useRef<number>(0);
  const screenReaderRef = useRef<HTMLDivElement | null>(null);

  // Create screen reader announcement div if it doesn't exist
  useMemo(() => {
    if (!screenReaderRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
      screenReaderRef.current = announcer;
    }
    
    return () => {
      if (screenReaderRef.current) {
        document.body.removeChild(screenReaderRef.current);
      }
    };
  }, []);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    if (screenReaderRef.current) {
      screenReaderRef.current.textContent = message;
    }
  }, []);

  // Hover handler with debouncing
  const handleModelHover = useCallback((report: IntelReportOverlayMarker | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (report !== hoveredReport) {
        setHoveredReport(report);
        setTooltipVisible(!!report);
        setInteractionState(prev => ({
          ...prev,
          isHovering: !!report,
          focusedReportId: report?.pubkey || null,
          lastInteractionTime: Date.now()
        }));

        if (report) {
          announceToScreenReader(`Hovering over intel report: ${report.title}`);
        }
      }
    }, hoverDebounceMs);
  }, [hoveredReport, hoverDebounceMs, announceToScreenReader]);

  // Click handler with debouncing and loading state
  const handleModelClick = useCallback(async (report: IntelReportOverlayMarker) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < clickDebounceMs) {
      return; // Prevent rapid clicks
    }
    lastClickTimeRef.current = now;

    try {
      setInteractionState(prev => ({
        ...prev,
        isClicking: true,
        isLoading: true,
        hasError: false,
        interactionCount: prev.interactionCount + 1
      }));
      setPopupLoading(true);

      // Simulate loading detailed report data
      // In real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const reportData: IntelReportData = {
        id: report.pubkey,
        title: report.title,
        content: report.content,
        tags: report.tags,
        latitude: report.latitude,
        longitude: report.longitude,
        timestamp: report.timestamp,
        author: report.author,
        classification: 'UNCLASS',
        sources: ['OSINT'],
        confidence: 75,
        priority: 'ROUTINE',
        pubkey: report.pubkey,
        subtitle: `Intelligence Report - ${report.title}`,
        date: new Date(report.timestamp * 1000).toISOString(),
        categories: report.tags,
        metaDescription: `Intelligence report for ${report.title}`
      };

      setSelectedReport(reportData);
      setPopupVisible(true);
      setPopupLoading(false);
      
      announceToScreenReader(`Opened detailed view for intel report: ${report.title}`);

    } catch (error) {
      console.error('Error loading detailed report:', error);
      setInteractionState(prev => ({
        ...prev,
        hasError: true,
        isLoading: false
      }));
      setPopupLoading(false);
      announceToScreenReader('Error loading report details');
    } finally {
      setInteractionState(prev => ({
        ...prev,
        isClicking: false
      }));
    }
  }, [clickDebounceMs, announceToScreenReader]);

  // Focus handler for keyboard navigation
  const handleModelFocus = useCallback((report: IntelReportOverlayMarker) => {
    setInteractionState(prev => ({
      ...prev,
      focusedReportId: report.pubkey,
      lastInteractionTime: Date.now()
    }));
    announceToScreenReader(`Focused on intel report: ${report.title}`);
  }, [announceToScreenReader]);

  // Popup close handler
  const handlePopupClose = useCallback(() => {
    setPopupVisible(false);
    setSelectedReport(null);
    setInteractionState(prev => ({
      ...prev,
      focusedReportId: null
    }));
    announceToScreenReader('Closed intel report details');
  }, [announceToScreenReader]);

  // Keyboard navigation handler
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;

    switch (event.key) {
      case 'Escape':
        if (popupVisible) {
          handlePopupClose();
          event.preventDefault();
        }
        break;
      case 'Enter':
      case ' ':
        if (hoveredReport) {
          handleModelClick(hoveredReport);
          event.preventDefault();
        }
        break;
    }
  }, [enableKeyboardNavigation, popupVisible, hoveredReport, handlePopupClose, handleModelClick]);

  // Clear hover state (for performance optimization)
  const clearHoverState = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredReport(null);
    setTooltipVisible(false);
    setInteractionState(prev => ({
      ...prev,
      isHovering: false,
      focusedReportId: null
    }));
  }, []);

  // Preload detailed report (for performance optimization) 
  const preloadDetailedReport = useCallback(async (reportId: string) => {
    // Implementation would cache report data
    console.log(`Preloading detailed report data for ${reportId}`);
  }, []);

  return {
    // State
    hoveredReport,
    selectedReport,
    interactionState,
    tooltipVisible,
    popupVisible,
    popupLoading,
    
    // Handlers
    handleModelHover,
    handleModelClick,
    handleModelFocus,
    handlePopupClose,
    handleKeyboardNavigation,
    announceToScreenReader,
    clearHoverState,
    preloadDetailedReport
  };
};
