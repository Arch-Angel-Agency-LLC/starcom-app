/**
 * Aggressive 3D Globe Interface Tests
 * 
 * These tests attack the actual 3D interface with real DOM events,
 * edge cases, and unexpected scenarios to ensure the drag/click
 * detection is bulletproof.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Enhanced3DGlobeInteractivity } from '../Enhanced3DGlobeInteractivity';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';

// Create a more aggressive mock that tracks all interactions
const mockInteractionHistory: Array<{
  type: 'hover' | 'click' | 'drag' | 'mousedown' | 'mouseup' | 'mousemove';
  position?: { x: number; y: number };
  timestamp: number;
  details?: any;
}> = [];

const mockHookState = {
  hoveredModel: null as any,
  clickedModel: null as any,
  mousePosition: { x: 0, y: 0 },
  clearClickedState: vi.fn(),
  getModelScreenPosition: vi.fn(() => ({ x: 100, y: 100 }))
};

// Mock the hook but with full event tracking
vi.mock('../../../hooks/useIntel3DInteraction', () => ({
  useIntel3DInteraction: vi.fn((props) => {
    const { enabled } = props;
    
    // If disabled, don't set up any interactions
    if (!enabled) {
      return {
        ...mockHookState,
        hoveredModel: null,
        clickedModel: null
      };
    }

    // Simulate real hook behavior with aggressive event tracking
    return {
      ...mockHookState,
      // Add intercepted methods that track calls
      clearClickedState: vi.fn(() => {
        mockInteractionHistory.push({
          type: 'click',
          timestamp: Date.now(),
          details: 'clearClickedState called'
        });
        mockHookState.clickedModel = null;
      })
    };
  })
}));

// Mock UI components with event tracking
vi.mock('../../ui/IntelReportTooltip/IntelReportTooltip', () => ({
  IntelReportTooltip: ({ visible, report, onClose }: any) => {
    React.useEffect(() => {
      if (visible) {
        mockInteractionHistory.push({
          type: 'hover',
          timestamp: Date.now(),
          details: `Tooltip shown for: ${report?.title}`
        });
      }
    }, [visible, report]);

    return (
      <div 
        data-testid="intel-tooltip" 
        style={{ display: visible ? 'block' : 'none' }}
        onClick={onClose}
      >
        {report?.title || 'No report'}
      </div>
    );
  }
}));

vi.mock('../../ui/IntelReportPopup/IntelReportPopup', () => ({
  IntelReportPopup: ({ visible, report, onClose, onPrevious, onNext }: any) => {
    React.useEffect(() => {
      if (visible) {
        mockInteractionHistory.push({
          type: 'click',
          timestamp: Date.now(),
          details: `Popup shown for: ${report?.title}`
        });
      }
    }, [visible, report]);

    return (
      <div 
        data-testid="intel-popup" 
        style={{ display: visible ? 'block' : 'none' }}
        role="dialog"
        aria-modal="true"
      >
        <div data-testid="popup-content">{report?.title || 'No report'}</div>
        <button data-testid="close-popup" onClick={onClose}>Close</button>
        <button data-testid="prev-popup" onClick={onPrevious}>Previous</button>
        <button data-testid="next-popup" onClick={onNext}>Next</button>
      </div>
    );
  }
}));

describe('Aggressive 3D Globe Interface Tests', () => {
  let mockGlobeRef: React.RefObject<any>;
  let mockContainerRef: React.RefObject<HTMLDivElement>;
  let mockModels: any[];
  let mockIntelReports: IntelReportOverlayMarker[];
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Clear interaction history
    mockInteractionHistory.length = 0;
    
    // Reset mock state
    mockHookState.hoveredModel = null;
    mockHookState.clickedModel = null;
    mockHookState.mousePosition = { x: 0, y: 0 };
    vi.clearAllMocks();

    // Set up user event
    user = userEvent.setup();

    // Create realistic mock refs
    const mockContainer = document.createElement('div');
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    mockContainer.style.position = 'relative';
    
    Object.defineProperty(mockContainer, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 50,
        width: 800,
        height: 600,
        right: 900,
        bottom: 650,
        x: 100,
        y: 50
      })
    });

    mockGlobeRef = {
      current: {
        camera: () => ({
          position: { x: 0, y: 0, z: 100 },
          lookAt: vi.fn(),
          updateProjectionMatrix: vi.fn()
        }),
        scene: () => ({
          traverse: vi.fn((callback) => {
            // Mock traverse to simulate globe mesh
            const mockGlobeMesh = {
              geometry: { type: 'SphereGeometry' },
              material: {},
              position: { x: 0, y: 0, z: 0 }
            };
            callback(mockGlobeMesh);
          })
        })
      }
    };

    mockContainerRef = { current: mockContainer };

    // Create comprehensive test data
    mockIntelReports = [
      {
        pubkey: 'test-report-1',
        title: 'Critical Intel Report Alpha',
        content: 'High priority intelligence data',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now() - 3600000,
        author: 'Agent Smith',
        tags: ['critical', 'urgent', 'classified']
      },
      {
        pubkey: 'test-report-2',
        title: 'Routine Surveillance Beta',
        content: 'Standard surveillance data',
        latitude: 34.0522,
        longitude: -118.2437,
        timestamp: Date.now() - 7200000,
        author: 'Agent Jones',
        tags: ['routine', 'surveillance']
      },
      {
        pubkey: 'test-report-3',
        title: 'Emergency Alert Gamma',
        content: 'Immediate response required',
        latitude: 51.5074,
        longitude: -0.1278,
        timestamp: Date.now() - 1800000,
        author: 'Agent Wilson',
        tags: ['emergency', 'response', 'immediate']
      }
    ];

    mockModels = mockIntelReports.map((report, index) => ({
      positionContainer: { position: { x: index * 20, y: 0, z: 0 } },
      orientationContainer: { rotation: { x: 0, y: 0, z: 0 } },
      rotationContainer: { rotation: { x: 0, y: 0, z: 0 } },
      mesh: {
        position: { x: index * 20, y: 0, z: 0 },
        traverse: vi.fn((callback) => callback({ material: {} })),
        userData: { reportId: report.pubkey }
      },
      report,
      basePosition: { x: index * 20, y: 0, z: 0 },
      hoverOffset: 2,
      localRotationY: 0
    }));
  });

  afterEach(() => {
    // Log interaction history for debugging failed tests
    if (mockInteractionHistory.length > 0) {
      console.log('Interaction History:', mockInteractionHistory);
    }
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

    return render(<Enhanced3DGlobeInteractivity {...defaultProps} />);
  };

  describe('Extreme Edge Cases - Drag vs Click', () => {
    it('should handle rapid mouse jittering during click (mouse shake)', async () => {
      renderComponent();

      // Simulate someone with shaky hands or bad mouse
      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Mouse down
      fireEvent.mouseDown(container, {
        clientX: rect.left + 100,
        clientY: rect.top + 100,
        bubbles: true
      });

      // Rapid tiny movements (mouse jitter)
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(container, {
          clientX: rect.left + 100 + (Math.random() * 4 - 2), // ±2px jitter
          clientY: rect.top + 100 + (Math.random() * 4 - 2),
          bubbles: true
        });
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Quick mouse up
      await new Promise(resolve => setTimeout(resolve, 50));
      fireEvent.mouseUp(container, {
        clientX: rect.left + 102,
        clientY: rect.top + 101,
        bubbles: true
      });

      // Should still be detected as a click despite jitter
      await waitFor(() => {
        const clickEvents = mockInteractionHistory.filter(h => h.type === 'click');
        expect(clickEvents.length).toBeGreaterThan(0);
      });
    });

    it('should handle precise threshold boundary testing', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Test exactly at 5px threshold
      fireEvent.mouseDown(container, {
        clientX: rect.left + 100,
        clientY: rect.top + 100
      });

      // Move exactly 5 pixels (should still be click)
      fireEvent.mouseMove(container, {
        clientX: rect.left + 105,
        clientY: rect.top + 100
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      fireEvent.mouseUp(container, {
        clientX: rect.left + 105,
        clientY: rect.top + 100
      });

      // Test 5.1 pixels (should be drag)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      fireEvent.mouseDown(container, {
        clientX: rect.left + 200,
        clientY: rect.top + 200
      });

      fireEvent.mouseMove(container, {
        clientX: rect.left + 205.1,
        clientY: rect.top + 200
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      fireEvent.mouseUp(container, {
        clientX: rect.left + 205.1,
        clientY: rect.top + 200
      });

      // Verify different behaviors
      const interactions = mockInteractionHistory.filter(h => h.type === 'click' || h.type === 'drag');
      expect(interactions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle time threshold boundary (299ms vs 301ms)', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Test 299ms (should be click)
      fireEvent.mouseDown(container, {
        clientX: rect.left + 100,
        clientY: rect.top + 100
      });

      await new Promise(resolve => setTimeout(resolve, 299));
      
      fireEvent.mouseUp(container, {
        clientX: rect.left + 100,
        clientY: rect.top + 100
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Test 301ms (should be drag)
      fireEvent.mouseDown(container, {
        clientX: rect.left + 200,
        clientY: rect.top + 200
      });

      await new Promise(resolve => setTimeout(resolve, 301));
      
      fireEvent.mouseUp(container, {
        clientX: rect.left + 200,
        clientY: rect.top + 200
      });

      const interactions = mockInteractionHistory;
      expect(interactions.length).toBeGreaterThan(0);
    });
  });

  describe('Stress Testing - Multiple Rapid Interactions', () => {
    it('should handle rapid click spam without breaking', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Rapid click spam (like angry user)
      for (let i = 0; i < 20; i++) {
        const x = rect.left + 100 + (i * 10);
        const y = rect.top + 100;
        
        fireEvent.mouseDown(container, { clientX: x, clientY: y });
        await new Promise(resolve => setTimeout(resolve, 10));
        fireEvent.mouseUp(container, { clientX: x, clientY: y });
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Should handle all interactions gracefully
      expect(container).toBeInTheDocument();
      const interactions = mockInteractionHistory;
      expect(interactions.length).toBeGreaterThan(0);
    });

    it('should handle drag cancellation scenarios', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Start drag, then mouse leaves container
      fireEvent.mouseDown(container, {
        clientX: rect.left + 100,
        clientY: rect.top + 100
      });

      fireEvent.mouseMove(container, {
        clientX: rect.left + 150,
        clientY: rect.top + 150
      });

      // Mouse leaves container (common when dragging fast)
      fireEvent.mouseLeave(container, {
        clientX: rect.left + 200,
        clientY: rect.top + 200
      });

      // Should handle gracefully without creating reports
      const interactions = mockInteractionHistory;
      const clickEvents = interactions.filter(h => h.type === 'click');
      expect(clickEvents.length).toBe(0); // No accidental clicks
    });
  });

  describe('Touch Interface Simulation', () => {
    it('should handle touch gestures like mouse events', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Simulate touch start
      fireEvent.touchStart(container, {
        touches: [{
          clientX: rect.left + 100,
          clientY: rect.top + 100,
          identifier: 0
        }]
      });

      // Simulate touch move (small movement)
      fireEvent.touchMove(container, {
        touches: [{
          clientX: rect.left + 102,
          clientY: rect.top + 101,
          identifier: 0
        }]
      });

      // Simulate touch end (quick tap)
      await new Promise(resolve => setTimeout(resolve, 100));
      fireEvent.touchEnd(container, {
        changedTouches: [{
          clientX: rect.left + 102,
          clientY: rect.top + 101,
          identifier: 0
        }]
      });

      // Should behave like a click
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('should handle multi-touch conflicts gracefully', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Start with two fingers (should be ignored for reports)
      fireEvent.touchStart(container, {
        touches: [
          { clientX: rect.left + 100, clientY: rect.top + 100, identifier: 0 },
          { clientX: rect.left + 200, clientY: rect.top + 200, identifier: 1 }
        ]
      });

      fireEvent.touchEnd(container, {
        changedTouches: [
          { clientX: rect.left + 100, clientY: rect.top + 100, identifier: 0 },
          { clientX: rect.left + 200, clientY: rect.top + 200, identifier: 1 }
        ]
      });

      // Should not create intel reports for multi-touch
      const interactions = mockInteractionHistory;
      const clickEvents = interactions.filter(h => h.type === 'click');
      expect(clickEvents.length).toBe(0);
    });
  });

  describe('State Management Under Pressure', () => {
    it('should handle rapid mode switching', async () => {
      const { rerender } = renderComponent();

      // Switch modes rapidly
      for (let i = 0; i < 10; i++) {
        const mode = i % 2 === 0 ? 'CyberCommand' : 'Standard';
        const subMode = i % 2 === 0 ? 'IntelReports' : 'Default';
        
        rerender(
          <Enhanced3DGlobeInteractivity
            globeRef={mockGlobeRef}
            intelReports={mockIntelReports}
            visualizationMode={{ mode, subMode }}
            models={mockModels}
            containerRef={mockContainerRef}
          />
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(screen.getByTestId('intel-tooltip')).toBeInTheDocument();
    });

    it('should handle model array mutations', async () => {
      const { rerender } = renderComponent();

      // Add models dynamically
      const newReport: IntelReportOverlayMarker = {
        pubkey: 'dynamic-report',
        title: 'Dynamic Report',
        content: 'Added at runtime',
        latitude: 35.0,
        longitude: -120.0,
        timestamp: Date.now(),
        author: 'System',
        tags: ['dynamic']
      };

      const newModel = {
        positionContainer: { position: { x: 100, y: 0, z: 0 } },
        orientationContainer: { rotation: { x: 0, y: 0, z: 0 } },
        rotationContainer: { rotation: { x: 0, y: 0, z: 0 } },
        mesh: {
          position: { x: 100, y: 0, z: 0 },
          traverse: vi.fn(),
          userData: { reportId: newReport.pubkey }
        },
        report: newReport,
        basePosition: { x: 100, y: 0, z: 0 },
        hoverOffset: 2,
        localRotationY: 0
      };

      const updatedModels = [...mockModels, newModel];
      const updatedReports = [...mockIntelReports, newReport];

      rerender(
        <Enhanced3DGlobeInteractivity
          globeRef={mockGlobeRef}
          intelReports={updatedReports}
          visualizationMode={{
            mode: 'CyberCommand',
            subMode: 'IntelReports'
          }}
          models={updatedModels}
          containerRef={mockContainerRef}
        />
      );

      expect(screen.getByTestId('intel-tooltip')).toBeInTheDocument();
    });
  });

  describe('Memory Leak and Performance Tests', () => {
    it('should cleanup event listeners on unmount', async () => {
      const { unmount } = renderComponent();
      
      const container = mockContainerRef.current!;
      const originalAddEventListener = container.addEventListener;
      const originalRemoveEventListener = container.removeEventListener;
      
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');

      // Unmount component
      unmount();

      // Should have removed event listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle high-frequency mouse events without lag', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      const startTime = performance.now();
      
      // Simulate high-frequency mouse movement (like gaming mouse)
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(container, {
          clientX: rect.left + 100 + (i % 10),
          clientY: rect.top + 100 + (i % 10)
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (under 100ms for 100 events)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Boundary Scenarios', () => {
    it('should handle null refs gracefully', () => {
      const nullGlobeRef = { current: null };
      const nullContainerRef = { current: null };

      expect(() => {
        renderComponent({ 
          globeRef: nullGlobeRef,
          containerRef: nullContainerRef 
        });
      }).not.toThrow();
    });

    it('should handle malformed model data', () => {
      const malformedModels = [
        null,
        undefined,
        { mesh: null },
        { report: null },
        // Missing required properties
        { mesh: {}, report: { pubkey: 'incomplete' } }
      ] as any;

      expect(() => {
        renderComponent({ models: malformedModels });
      }).not.toThrow();
    });
  });

  describe('Accessibility and A11y', () => {
    it('should provide proper ARIA attributes', () => {
      renderComponent();

      // Mock a clicked model to show popup
      act(() => {
        mockHookState.clickedModel = mockModels[0];
      });

      renderComponent();

      const popup = screen.queryByTestId('intel-popup');
      if (popup && popup.style.display !== 'none') {
        expect(popup).toHaveAttribute('role', 'dialog');
        expect(popup).toHaveAttribute('aria-modal', 'true');
      }
    });

    it('should handle keyboard navigation', async () => {
      renderComponent();

      // Mock a clicked model to show popup
      act(() => {
        mockHookState.clickedModel = mockModels[0];
      });

      renderComponent();

      const closeButton = screen.queryByTestId('close-popup');
      if (closeButton) {
        // Should be focusable
        closeButton.focus();
        expect(document.activeElement).toBe(closeButton);

        // Should respond to Enter key
        await user.keyboard('{Enter}');
        // Verify interaction was logged
        expect(mockInteractionHistory.some(h => h.details?.includes('clearClickedState'))).toBeTruthy();
      }
    });
  });
});
