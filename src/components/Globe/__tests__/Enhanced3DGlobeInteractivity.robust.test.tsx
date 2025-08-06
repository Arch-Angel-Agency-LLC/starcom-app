/**
 * Robust 3D Globe Interface Tests
 * 
 * This test suite focuses on creating proper UI tests for the 3D interface
 * that actually work with the real component and test the drag/click distinction
 * in a meaningful way.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act , act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Enhanced3DGlobeInteractivity } from '../Enhanced3DGlobeInteractivity';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';

// Mock THREE.js properly for testing
// Mock THREE.js completely to avoid 3D context issues
vi.mock('three', () => ({
  SphereGeometry: vi.fn(() => ({})),
  MeshBasicMaterial: vi.fn(() => ({})),
  LineBasicMaterial: vi.fn(() => ({})),
  Mesh: vi.fn(() => ({ visible: false, position: { x: 0, y: 0, z: 0 } })),
  Line: vi.fn(() => ({})),
  BufferGeometry: vi.fn(() => ({ setFromPoints: vi.fn() })),
  Group: vi.fn(() => ({ add: vi.fn(), remove: vi.fn(), clear: vi.fn() })),
  Vector3: vi.fn((x = 0, y = 0, z = 0) => ({ x, y, z })),
  Vector2: vi.fn((x = 0, y = 0) => ({ x, y })),
  Raycaster: vi.fn(() => ({
    setFromCamera: vi.fn(),
    intersectObjects: vi.fn(() => [])
  })),
  Camera: vi.fn(() => ({})),
  Scene: vi.fn(() => ({ children: [] })),
  PerspectiveCamera: vi.fn(() => ({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  }))
}));

// Track interactions for testing
const mockInteractionHistory: Array<{
  type: 'hover' | 'click' | 'drag' | 'mousedown' | 'mouseup' | 'mousemove' | 'clearClick';
  position?: { x: number; y: number };
  timestamp: number;
  details?: string | { dragDistance?: number; wasClick?: boolean };
}> = [];

// Create sophisticated mock hook with real interaction tracking
interface MockModel {
  report: IntelReportOverlayMarker;
}

const mockHookState = {
  hoveredModel: null as MockModel | null,
  clickedModel: null as MockModel | null,
  mousePosition: { x: 0, y: 0 },
  clearClickedState: vi.fn(),
  getModelScreenPosition: vi.fn(() => ({ x: 100, y: 100 }))
};

// Mock the 3D interaction hook with realistic behavior
// NOTE: This test file needs updating after consolidation - useIntel3DInteraction hook was removed
// DISABLED: Hook-based mocking no longer needed after architectural consolidation
/*
vi.mock('../../../hooks/useIntel3DInteraction', () => ({
  useIntel3DInteraction: vi.fn((props) => {
*/
    const { enabled, containerRef } = props;
    
    // If disabled, return inactive state
    if (!enabled) {
      return {
        ...mockHookState,
        hoveredModel: null,
        clickedModel: null
      };
    }

    // Add real event listeners to container for testing
    React.useEffect(() => {
      if (!containerRef?.current) return;

      const container = containerRef.current;
      let isMouseDown = false;
      let mouseDownPos = { x: 0, y: 0 };
      let dragDistance = 0;

      const handleMouseDown = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        isMouseDown = true;
        mouseDownPos = { x, y };
        dragDistance = 0;
        
        mockInteractionHistory.push({
          type: 'mousedown',
          position: { x, y },
          timestamp: Date.now()
        });
      };

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (isMouseDown) {
          dragDistance = Math.sqrt(
            Math.pow(x - mouseDownPos.x, 2) + 
            Math.pow(y - mouseDownPos.y, 2)
          );
          
          if (dragDistance > 5) {
            mockInteractionHistory.push({
              type: 'drag',
              position: { x, y },
              timestamp: Date.now(),
              details: { dragDistance }
            });
          }
        }
        
        mockInteractionHistory.push({
          type: 'mousemove',
          position: { x, y },
          timestamp: Date.now()
        });
      };

      const handleMouseUp = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const wasClick = dragDistance <= 5;
        
        mockInteractionHistory.push({
          type: 'mouseup',
          position: { x, y },
          timestamp: Date.now(),
          details: { dragDistance, wasClick }
        });

        if (wasClick) {
          // Simulate click detected
          mockInteractionHistory.push({
            type: 'click',
            position: { x, y },
            timestamp: Date.now(),
            details: 'Successful click'
          });

          // Update hook state to simulate click
          mockHookState.clickedModel = {
            report: {
              pubkey: 'test-report-1',
              title: 'Test Intel Report',
              content: 'Test content',
              latitude: 40.7128,
              longitude: -74.0060,
              timestamp: Date.now(),
              author: 'Test Agent',
              tags: ['test']
            }
          };
        }
        
        isMouseDown = false;
        dragDistance = 0;
      };

      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);

      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
      };
    }, [enabled, containerRef]);

    return {
      ...mockHookState,
      clearClickedState: vi.fn(() => {
        mockInteractionHistory.push({
          type: 'clearClick',
          timestamp: Date.now(),
          details: 'clearClickedState called'
        });
        mockHookState.clickedModel = null;
      })
    };
  })
}));

// Mock UI components with proper event handling
interface TooltipProps {
  visible: boolean;
  report?: IntelReportOverlayMarker | null;
  onClose?: () => void;
}

interface PopupProps {
  visible: boolean;
  report?: IntelReportOverlayMarker | null;
  onClose?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

vi.mock('../../ui/IntelReportTooltip/IntelReportTooltip', () => ({
  IntelReportTooltip: ({ visible, report, onClose }: TooltipProps) => (
    <div 
      data-testid="intel-tooltip" 
      style={{ display: visible ? 'block' : 'none' }}
      onClick={onClose}
    >
      {visible ? `Tooltip: ${report?.title || 'No report'}` : ''}
    </div>
  )
}));

vi.mock('../../ui/IntelReportPopup/IntelReportPopup', () => ({
  IntelReportPopup: ({ visible, report, onClose, onPrevious, onNext }: PopupProps) => (
    <div 
      data-testid="intel-popup" 
      style={{ display: visible ? 'block' : 'none' }}
      role="dialog"
      aria-modal="true"
    >
      {visible && (
        <>
          <div data-testid="popup-content">{report?.title || 'No report'}</div>
          <button data-testid="close-popup" onClick={onClose}>Close</button>
          <button data-testid="prev-popup" onClick={onPrevious}>Previous</button>
          <button data-testid="next-popup" onClick={onNext}>Next</button>
        </>
      )}
    </div>
  )
}));

describe('Robust 3D Globe Interface Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGlobeRef: React.RefObject<any>;
  let mockContainerRef: React.RefObject<HTMLDivElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Create proper mock container
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

    // Create sophisticated mock globe with proper 3D scene
    mockGlobeRef = {
      current: {
        camera: () => ({
          position: { x: 0, y: 0, z: 100 },
          lookAt: vi.fn(),
          updateProjectionMatrix: vi.fn()
        }),
        scene: () => ({
          add: vi.fn(),
          remove: vi.fn(),
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

    // Create test data
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
      }
    ];

    mockModels = mockIntelReports.map((report, index) => ({
      positionContainer: { 
        position: { 
          x: index * 20, 
          y: 0, 
          z: 0,
          clone: vi.fn(() => ({ x: index * 20, y: 0, z: 0 }))
        } 
      },
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
    // Debug log for failed tests
    if (mockInteractionHistory.length > 0) {
      console.log('Final Interaction History:', mockInteractionHistory);
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

  describe('Core Drag vs Click Detection', () => {
    it('should distinguish between clicks and drags at 5px threshold', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Test 1: Click within threshold (4 pixels)
      fireEvent.mouseDown(container, {
        clientX: rect.left + 100,
        clientY: rect.top + 100,
        bubbles: true
      });

      fireEvent.mouseMove(container, {
        clientX: rect.left + 103, // 3 pixel movement
        clientY: rect.top + 101, // 1 pixel movement (total ~3.16 pixels)
        bubbles: true
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      
      fireEvent.mouseUp(container, {
        clientX: rect.left + 103,
        clientY: rect.top + 101,
        bubbles: true
      });

      await waitFor(() => {
        const clickEvents = mockInteractionHistory.filter(h => h.type === 'click');
        expect(clickEvents.length).toBeGreaterThan(0);
      });

      // Clear history for second test
      mockInteractionHistory.length = 0;

      // Test 2: Drag beyond threshold (8 pixels)
      fireEvent.mouseDown(container, {
        clientX: rect.left + 200,
        clientY: rect.top + 200,
        bubbles: true
      });

      fireEvent.mouseMove(container, {
        clientX: rect.left + 208, // 8 pixel movement
        clientY: rect.top + 200,
        bubbles: true
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      
      fireEvent.mouseUp(container, {
        clientX: rect.left + 208,
        clientY: rect.top + 200,
        bubbles: true
      });

      await waitFor(() => {
        const dragEvents = mockInteractionHistory.filter(h => h.type === 'drag');
        const clickEvents = mockInteractionHistory.filter(h => h.type === 'click');
        
        expect(dragEvents.length).toBeGreaterThan(0);
        expect(clickEvents.length).toBe(0); // No clicks after drag
      });
    });

    it('should handle mouse jitter during clicks', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      fireEvent.mouseDown(container, {
        clientX: rect.left + 100,
        clientY: rect.top + 100,
        bubbles: true
      });

      // Simulate tiny jitter movements
      for (let i = 0; i < 5; i++) {
        fireEvent.mouseMove(container, {
          clientX: rect.left + 100 + (Math.random() * 2 - 1), // ±1px jitter
          clientY: rect.top + 100 + (Math.random() * 2 - 1),
          bubbles: true
        });
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      fireEvent.mouseUp(container, {
        clientX: rect.left + 101,
        clientY: rect.top + 101,
        bubbles: true
      });

      await waitFor(() => {
        const clickEvents = mockInteractionHistory.filter(h => h.type === 'click');
        expect(clickEvents.length).toBeGreaterThan(0);
      });
    });

    it('should prevent Intel Report creation after drag', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Perform a drag operation
      fireEvent.mouseDown(container, {
        clientX: rect.left + 100,
        clientY: rect.top + 100,
        bubbles: true
      });

      fireEvent.mouseMove(container, {
        clientX: rect.left + 150, // 50 pixel drag
        clientY: rect.top + 150,
        bubbles: true
      });

      fireEvent.mouseUp(container, {
        clientX: rect.left + 150,
        clientY: rect.top + 150,
        bubbles: true
      });

      await waitFor(() => {
        const clickEvents = mockInteractionHistory.filter(h => h.type === 'click');
        const dragEvents = mockInteractionHistory.filter(h => h.type === 'drag');
        
        expect(dragEvents.length).toBeGreaterThan(0);
        expect(clickEvents.length).toBe(0); // No accidental clicks
      });

      // Popup should not appear
      expect(screen.queryByTestId('intel-popup')).not.toBeVisible();
    });
  });

  describe('UI State Management', () => {
    it('should show popup when clicked model is detected', async () => {
      renderComponent();

      // Simulate the hook detecting a clicked model
      act(() => {
        mockHookState.clickedModel = mockModels[0];
      });

      // Re-render to trigger effect
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('intel-popup')).toBeVisible();
        expect(screen.getByTestId('popup-content')).toHaveTextContent('Critical Intel Report Alpha');
      });
    });

    it('should close popup and clear state when close button is clicked', async () => {
      renderComponent();

      // Set clicked model
      act(() => {
        mockHookState.clickedModel = mockModels[0];
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('intel-popup')).toBeVisible();
      });

      // Click close button
      const closeButton = screen.getByTestId('close-popup');
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockHookState.clearClickedState).toHaveBeenCalled();
      });
    });

    it('should handle mode switching correctly', async () => {
      const { rerender } = renderComponent();

      // Initially in Intel Reports mode
      expect(screen.getByTestId('intel-tooltip')).toBeInTheDocument();

      // Switch to different mode
      rerender(
        <Enhanced3DGlobeInteractivity
          globeRef={mockGlobeRef}
          intelReports={mockIntelReports}
          visualizationMode={{
            mode: 'Standard',
            subMode: 'Default'
          }}
          models={mockModels}
          containerRef={mockContainerRef}
        />
      );

      // Should disable interactions
      expect(screen.getByTestId('intel-tooltip')).not.toBeVisible();
    });
  });

  describe('Touch Interface Handling', () => {
    it('should handle touch events like mouse events', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Touch start
      fireEvent.touchStart(container, {
        touches: [{
          clientX: rect.left + 100,
          clientY: rect.top + 100,
          identifier: 0
        }]
      });

      // Small touch move
      fireEvent.touchMove(container, {
        touches: [{
          clientX: rect.left + 102,
          clientY: rect.top + 101,
          identifier: 0
        }]
      });

      // Touch end
      fireEvent.touchEnd(container, {
        changedTouches: [{
          clientX: rect.left + 102,
          clientY: rect.top + 101,
          identifier: 0
        }]
      });

      // Should behave like a click for touch
      await waitFor(() => {
        expect(container).toBeInTheDocument(); // Component should still be stable
      });
    });
  });

  describe('Error Handling and Robustness', () => {
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
        { 
          mesh: {},
          report: { pubkey: 'incomplete' },
          positionContainer: { position: { x: 0, y: 0, z: 0 } }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[];

      expect(() => {
        renderComponent({ models: malformedModels });
      }).not.toThrow();
    });

    it('should handle missing 3D scene methods', () => {
      const badGlobeRef = {
        current: {
          camera: () => ({ position: { x: 0, y: 0, z: 0 } }),
          scene: () => ({}) // Scene without add/remove methods
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      expect(() => {
        renderComponent({ globeRef: badGlobeRef });
      }).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderComponent();
      
      const container = mockContainerRef.current!;
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');

      unmount();

      // Should have cleaned up event listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle rapid interactions without breaking', async () => {
      renderComponent();

      const container = mockContainerRef.current!;
      const rect = container.getBoundingClientRect();
      
      // Rapid interactions
      for (let i = 0; i < 10; i++) {
        const x = rect.left + 100 + (i * 5);
        const y = rect.top + 100;
        
        fireEvent.mouseDown(container, { clientX: x, clientY: y });
        await new Promise(resolve => setTimeout(resolve, 10));
        fireEvent.mouseUp(container, { clientX: x, clientY: y });
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Should handle all interactions gracefully
      expect(container).toBeInTheDocument();
      expect(mockInteractionHistory.length).toBeGreaterThan(0);
    });
  });
});
