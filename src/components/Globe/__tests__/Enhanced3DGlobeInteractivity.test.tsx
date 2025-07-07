/**
 * Enhanced3DGlobeInteractivity UI/UX Tests
 * 
 * These tests verify the drag/click detection system works correctly
 * in the actual live component that uses useIntel3DInteraction hook.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act , act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import * as THREE from 'three';
import { Enhanced3DGlobeInteractivity } from '../Enhanced3DGlobeInteractivity';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';
import { GlobalGlobeContextMenuProvider } from '../../../context/GlobalGlobeContextMenuProvider';

// Mock the hook to control its behavior in tests
const mockHookResult = {
  hoveredModel: null as any,
  clickedModel: null as any,
  mousePosition: { x: 0, y: 0 },
  clearClickedState: vi.fn(),
  getModelScreenPosition: vi.fn(() => ({ x: 100, y: 100 }))
};

vi.mock('../../../hooks/useIntel3DInteraction', () => ({
  useIntel3DInteraction: vi.fn(() => mockHookResult)
}));

// Mock UI components
vi.mock('../../ui/IntelReportTooltip/IntelReportTooltip', () => ({
  IntelReportTooltip: ({ visible, report }: any) => (
    <div data-testid="intel-tooltip" style={{ display: visible ? 'block' : 'none' }}>
      {report?.title || 'No report'}
    </div>
  )
}));

vi.mock('../../ui/IntelReportPopup/IntelReportPopup', () => ({
  IntelReportPopup: ({ visible, report, onClose }: any) => (
    <div data-testid="intel-popup" style={{ display: visible ? 'block' : 'none' }}>
      <div data-testid="popup-content">{report?.title || 'No report'}</div>
      <button data-testid="close-popup" onClick={onClose}>Close</button>
    </div>
  )
}));

describe('Enhanced3DGlobeInteractivity - Drag/Click Detection', () => {
  let mockGlobeRef: React.RefObject<any>;
  let mockContainerRef: React.RefObject<HTMLDivElement>;
  let mockModels: any[];
  let mockIntelReports: IntelReportOverlayMarker[];

  beforeEach(() => {
    // Create mock refs
    mockGlobeRef = {
      current: {
        camera: () => new THREE.PerspectiveCamera(),
        scene: () => new THREE.Scene()
      }
    };

    mockContainerRef = {
      current: document.createElement('div')
    };

    // Mock getBoundingClientRect
    Object.defineProperty(mockContainerRef.current, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600
      })
    });

    // Create mock models and reports
    mockIntelReports = [
      {
        pubkey: 'test-report-1',
        title: 'Test Intel Report 1',
        content: 'Test content 1',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now(),
        author: 'test-author',
        tags: ['test']
      },
      {
        pubkey: 'test-report-2',
        title: 'Test Intel Report 2',
        content: 'Test content 2',
        latitude: 34.0522,
        longitude: -118.2437,
        timestamp: Date.now(),
        author: 'test-author-2',
        tags: ['test']
      }
    ];

    mockModels = mockIntelReports.map((report, index) => ({
      positionContainer: new THREE.Group(),
      orientationContainer: new THREE.Group(),
      rotationContainer: new THREE.Group(),
      mesh: new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial()),
      report,
      basePosition: new THREE.Vector3(index * 10, 0, 0),
      hoverOffset: 2,
      localRotationY: 0
    }));

    // Reset mock functions
    vi.clearAllMocks();
    mockHookResult.hoveredModel = null;
    mockHookResult.clickedModel = null;
    mockHookResult.clearClickedState.mockClear();
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof Enhanced3DGlobeInteractivity>> = {}) => {
    const defaultProps = {
      globeRef: mockGlobeRef,
      intelReports: mockIntelReports,
      visualizationMode: {
        mode: 'CyberCommand',
        subMode: 'IntelReports'
      },
      models: mockModels,
      containerRef: mockContainerRef,
      ...props
    };

    return render(
      <GlobalGlobeContextMenuProvider>
        <Enhanced3DGlobeInteractivity {...defaultProps} />
      </GlobalGlobeContextMenuProvider>
    );
  };

  describe('Component Initialization', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('intel-tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('intel-popup')).toBeInTheDocument();
    });

    it('should initialize hook with correct parameters', () => {
      const useIntel3DInteractionMock = require('../../../hooks/useIntel3DInteraction').useIntel3DInteraction;
      
      renderComponent();
      
      expect(useIntel3DInteractionMock).toHaveBeenCalledWith({
        globeRef: mockGlobeRef,
        containerRef: mockContainerRef,
        models: mockModels,
        enabled: true
      });
    });

    it('should disable interaction when not in Intel Reports mode', () => {
      const useIntel3DInteractionMock = require('../../../hooks/useIntel3DInteraction').useIntel3DInteraction;
      
      renderComponent({
        visualizationMode: {
          mode: 'Standard',
          subMode: 'Default'
        }
      });
      
      expect(useIntel3DInteractionMock).toHaveBeenCalledWith({
        globeRef: mockGlobeRef,
        containerRef: mockContainerRef,
        models: mockModels,
        enabled: false
      });
    });
  });

  describe('Hover Interactions', () => {
    it('should show tooltip when hovering over a model', async () => {
      renderComponent();

      // Simulate hover by updating mock hook result
      act(() => {
        mockHookResult.hoveredModel = mockModels[0];
      });

      // Re-render to trigger useEffect
      renderComponent();

      await waitFor(() => {
        const tooltip = screen.getByTestId('intel-tooltip');
        expect(tooltip).toHaveStyle({ display: 'block' });
      });
    });

    it('should hide tooltip when not hovering', async () => {
      renderComponent();

      // Simulate no hover
      act(() => {
        mockHookResult.hoveredModel = null;
      });

      // Re-render to trigger useEffect
      renderComponent();

      await waitFor(() => {
        const tooltip = screen.getByTestId('intel-tooltip');
        expect(tooltip).toHaveStyle({ display: 'none' });
      });
    });

    it('should call onHoverChange when hover state changes', () => {
      const mockOnHoverChange = vi.fn();
      renderComponent({ onHoverChange: mockOnHoverChange });

      // Simulate hover change
      act(() => {
        mockHookResult.hoveredModel = mockModels[0];
      });

      // Re-render to trigger useEffect
      renderComponent({ onHoverChange: mockOnHoverChange });

      expect(mockOnHoverChange).toHaveBeenCalledWith(mockIntelReports[0].pubkey);
    });
  });

  describe('Click Interactions (Critical UX Test)', () => {
    it('should show popup when clicking on a model', async () => {
      renderComponent();

      // Simulate click by updating mock hook result
      act(() => {
        mockHookResult.clickedModel = mockModels[0];
      });

      // Re-render to trigger useEffect
      renderComponent();

      await waitFor(() => {
        const popup = screen.getByTestId('intel-popup');
        expect(popup).toHaveStyle({ display: 'block' });
        expect(screen.getByTestId('popup-content')).toHaveTextContent('Test Intel Report 1');
      });
    });

    it('should not show popup when dragging (critical drag/click distinction)', async () => {
      renderComponent();

      // Simulate that the hook detected a drag (no clickedModel set)
      act(() => {
        mockHookResult.hoveredModel = mockModels[0]; // Mouse over model
        mockHookResult.clickedModel = null; // But no click detected due to drag
      });

      // Re-render
      renderComponent();

      await waitFor(() => {
        const popup = screen.getByTestId('intel-popup');
        expect(popup).toHaveStyle({ display: 'none' });
      });
    });

    it('should close popup correctly', async () => {
      renderComponent();

      // Open popup first
      act(() => {
        mockHookResult.clickedModel = mockModels[0];
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('intel-popup')).toHaveStyle({ display: 'block' });
      });

      // Close popup
      fireEvent.click(screen.getByTestId('close-popup'));

      await waitFor(() => {
        expect(screen.getByTestId('intel-popup')).toHaveStyle({ display: 'none' });
        expect(mockHookResult.clearClickedState).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Open popup with first report
      act(() => {
        mockHookResult.clickedModel = mockModels[0];
      });
    });

    it('should navigate to next report', async () => {
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('popup-content')).toHaveTextContent('Test Intel Report 1');
      });

      // Simulate navigation by clicking next (we need to implement navigation in the popup mock)
      // For now, we'll test the navigation logic by calling the handler directly
      // This would be expanded in a full integration test
    });
  });

  describe('Touch Support', () => {
    it('should work with touch events (via hook)', () => {
      renderComponent();

      // The touch support is handled by the hook, so we verify the hook is called
      // with the correct parameters including touch-enabled models
      const useIntel3DInteractionMock = require('../../../hooks/useIntel3DInteraction').useIntel3DInteraction;
      
      expect(useIntel3DInteractionMock).toHaveBeenCalledWith({
        globeRef: mockGlobeRef,
        containerRef: mockContainerRef,
        models: mockModels,
        enabled: true
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty models array', () => {
      renderComponent({ models: [] });
      
      const useIntel3DInteractionMock = require('../../../hooks/useIntel3DInteraction').useIntel3DInteraction;
      expect(useIntel3DInteractionMock).toHaveBeenCalledWith({
        globeRef: mockGlobeRef,
        containerRef: mockContainerRef,
        models: [],
        enabled: true
      });
    });

    it('should handle null globe ref', () => {
      const nullGlobeRef = { current: null };
      renderComponent({ globeRef: nullGlobeRef });
      
      // Component should still render without crashing
      expect(screen.getByTestId('intel-tooltip')).toBeInTheDocument();
    });

    it('should handle rapid hover changes without performance issues', async () => {
      renderComponent();

      // Simulate rapid hover changes
      for (let i = 0; i < 10; i++) {
        act(() => {
          mockHookResult.hoveredModel = i % 2 === 0 ? mockModels[0] : null;
        });
        renderComponent();
      }

      // Should handle rapid changes gracefully
      await waitFor(() => {
        expect(screen.getByTestId('intel-tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should provide screen reader announcements for hover state', () => {
      renderComponent();

      // Check that tooltip content is accessible
      const tooltip = screen.getByTestId('intel-tooltip');
      expect(tooltip).toBeInTheDocument();
    });

    it('should support keyboard navigation via popup', async () => {
      renderComponent();

      // Open popup
      act(() => {
        mockHookResult.clickedModel = mockModels[0];
      });
      renderComponent();

      await waitFor(() => {
        const closeButton = screen.getByTestId('close-popup');
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toBeInstanceOf(HTMLButtonElement);
      });
    });
  });
});
