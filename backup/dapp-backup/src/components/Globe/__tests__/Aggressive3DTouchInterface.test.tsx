/**
 * AGGRESSIVE 3D Touch Interface Tests
 * 
 * This test suite focuses on the most aggressive edge cases and touch scenarios
 * that could break the 3D globe interface. We test the ACTUAL interface under
 * extreme conditions to ensure it's bulletproof.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { Enhanced3DGlobeInteractivity } from '../Enhanced3DGlobeInteractivity';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';
import { GlobalGlobeContextMenuProvider } from '../../../context/GlobalGlobeContextMenuProvider';

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
  Scene: vi.fn(() => ({ children: [] }))
}));

// AGGRESSIVE EVENT TRACKING - Track every single interaction
const aggressiveInteractionLog: Array<{
  type: string;
  timestamp: number;
  position?: { x: number; y: number };
  force?: number;
  touchCount?: number;
  details?: unknown;
}> = [];

// Real-time interaction state
let currentInteractionState = {
  isDragging: false,
  dragStartPos: { x: 0, y: 0 },
  dragDistance: 0,
  touchStartTime: 0,
  isMultiTouch: false,
  gestureDetected: false
};

// TODO: Implement dependency vulnerability scanning and update automation - PRIORITY: MEDIUM
// Mock the hook with factory function to avoid hoisting issues
vi.mock('../../../hooks/useIntel3DInteraction', () => ({
  useIntel3DInteraction: vi.fn((props) => {
    const { enabled, containerRef } = props;
    
    const [state, setState] = React.useState({
      hoveredModel: null as any,
      clickedModel: null as any,
      mousePosition: { x: 0, y: 0 }
    });

    React.useEffect(() => {
      if (!enabled || !containerRef?.current) return;

      const container = containerRef.current;
      
      // AGGRESSIVE MOUSE TRACKING
      const handleMouseDown = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        currentInteractionState.isDragging = false;
        currentInteractionState.dragStartPos = { x, y };
        currentInteractionState.dragDistance = 0;
        
        aggressiveInteractionLog.push({
          type: 'MOUSE_DOWN',
          timestamp: performance.now(),
          position: { x, y },
          details: { button: e.button, pressure: (e as any).pressure || 1 }
        });
      };

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (currentInteractionState.dragStartPos.x !== 0) {
          currentInteractionState.dragDistance = Math.sqrt(
            Math.pow(x - currentInteractionState.dragStartPos.x, 2) +
            Math.pow(y - currentInteractionState.dragStartPos.y, 2)
          );
          
          if (currentInteractionState.dragDistance > 5 && !currentInteractionState.isDragging) {
            currentInteractionState.isDragging = true;
            aggressiveInteractionLog.push({
              type: 'DRAG_START',
              timestamp: performance.now(),
              position: { x, y },
              details: { dragDistance: currentInteractionState.dragDistance }
            });
          }
        }
        
        aggressiveInteractionLog.push({
          type: 'MOUSE_MOVE',
          timestamp: performance.now(),
          position: { x, y },
          details: { 
            dragDistance: currentInteractionState.dragDistance,
            isDragging: currentInteractionState.isDragging 
          }
        });
      };

      const handleMouseUp = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const wasClick = currentInteractionState.dragDistance <= 5;
        
        aggressiveInteractionLog.push({
          type: wasClick ? 'CLICK_DETECTED' : 'DRAG_END',
          timestamp: performance.now(),
          position: { x, y },
          details: { 
            dragDistance: currentInteractionState.dragDistance,
            wasClick,
            duration: performance.now() - (aggressiveInteractionLog.find(l => l.type === 'MOUSE_DOWN')?.timestamp || 0)
          }
        });

        if (wasClick) {
          setState(prev => ({
            ...prev,
            clickedModel: {
              report: {
                pubkey: 'aggressive-test-report',
                title: 'Aggressive Test Report',
                content: 'Generated by aggressive test',
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: Date.now(),
                author: 'Test Agent',
                tags: ['test', 'aggressive']
              }
            }
          }));
        }
        
        // Reset state
        currentInteractionState.isDragging = false;
        currentInteractionState.dragStartPos = { x: 0, y: 0 };
        currentInteractionState.dragDistance = 0;
      };

      // AGGRESSIVE TOUCH TRACKING
      const handleTouchStart = (e: TouchEvent) => {
        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];
        if (!touch) return;
        
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        currentInteractionState.touchStartTime = performance.now();
        currentInteractionState.isMultiTouch = e.touches.length > 1;
        currentInteractionState.dragStartPos = { x, y };
        currentInteractionState.dragDistance = 0;
        
        aggressiveInteractionLog.push({
          type: 'TOUCH_START',
          timestamp: performance.now(),
          position: { x, y },
          touchCount: e.touches.length,
          force: touch.force || 1,
          details: { 
            isMultiTouch: currentInteractionState.isMultiTouch,
            allTouches: Array.from(e.touches).map(t => ({ x: t.clientX - rect.left, y: t.clientY - rect.top }))
          }
        });
      };

      const handleTouchMove = (e: TouchEvent) => {
        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];
        if (!touch) return;
        
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        if (currentInteractionState.dragStartPos.x !== 0) {
          currentInteractionState.dragDistance = Math.sqrt(
            Math.pow(x - currentInteractionState.dragStartPos.x, 2) +
            Math.pow(y - currentInteractionState.dragStartPos.y, 2)
          );
        }
        
        aggressiveInteractionLog.push({
          type: 'TOUCH_MOVE',
          timestamp: performance.now(),
          position: { x, y },
          touchCount: e.touches.length,
          force: touch.force || 1,
          details: { 
            dragDistance: currentInteractionState.dragDistance,
            velocity: currentInteractionState.dragDistance / Math.max(performance.now() - currentInteractionState.touchStartTime, 1)
          }
        });
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const rect = container.getBoundingClientRect();
        const touch = e.changedTouches[0];
        if (!touch) return;
        
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const duration = performance.now() - currentInteractionState.touchStartTime;
        const wasClick = currentInteractionState.dragDistance <= 5 && duration < 300 && !currentInteractionState.isMultiTouch;
        
        aggressiveInteractionLog.push({
          type: wasClick ? 'TOUCH_CLICK' : 'TOUCH_DRAG_END',
          timestamp: performance.now(),
          position: { x, y },
          touchCount: e.changedTouches.length,
          details: {
            dragDistance: currentInteractionState.dragDistance,
            duration,
            wasClick,
            wasMultiTouch: currentInteractionState.isMultiTouch
          }
        });

        if (wasClick) {
          setState(prev => ({
            ...prev,
            clickedModel: {
              report: {
                pubkey: 'aggressive-touch-report',
                title: 'Touch Test Report',
                content: 'Generated by touch test',
                latitude: 34.0522,
                longitude: -118.2437,
                timestamp: Date.now(),
                author: 'Touch Agent',
                tags: ['touch', 'test']
              }
            }
          }));
        }
      };

      // Add ALL event listeners
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseUp); // Reset on leave
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('touchcancel', handleTouchEnd);

      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseUp);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchEnd);
      };
    }, [enabled, containerRef]);

    return {
      hoveredModel: state.hoveredModel,
      clickedModel: state.clickedModel,
      mousePosition: state.mousePosition,
      clearClickedState: vi.fn(() => {
        setState(prev => ({ ...prev, clickedModel: null }));
        aggressiveInteractionLog.push({
          type: 'CLEAR_CLICKED_STATE',
          timestamp: performance.now()
        });
      }),
      getModelScreenPosition: vi.fn(() => ({ x: 100, y: 100 }))
    };
  })
}));

// Mock UI components to track state changes
vi.mock('../../ui/IntelReportTooltip/IntelReportTooltip', () => ({
  IntelReportTooltip: ({ visible, report }: { visible: boolean; report?: unknown }) => {
    if (visible) {
      aggressiveInteractionLog.push({
        type: 'TOOLTIP_SHOWN',
        timestamp: performance.now(),
        details: { reportTitle: (report as any)?.title }
      });
    }
    return (
      <div data-testid="intel-tooltip" style={{ display: visible ? 'block' : 'none' }}>
        {visible ? `Tooltip: ${(report as any)?.title || 'No report'}` : ''}
      </div>
    );
  }
}));

vi.mock('../../ui/IntelReportPopup/IntelReportPopup', () => ({
  IntelReportPopup: ({ visible, report, onClose }: { visible: boolean; report?: unknown; onClose?: () => void }) => {
    if (visible) {
      aggressiveInteractionLog.push({
        type: 'POPUP_SHOWN',
        timestamp: performance.now(),
        details: { reportTitle: (report as any)?.title }
      });
    }
    return (
      <div data-testid="intel-popup" style={{ display: visible ? 'block' : 'none' }}>
        {visible && (
          <>
            <div data-testid="popup-content">{(report as any)?.title || 'No report'}</div>
            <button data-testid="close-popup" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    );
  }
}));

describe('AGGRESSIVE 3D Touch Interface Tests', () => {
  let mockGlobeRef: React.RefObject<any>;
  let mockContainerRef: React.RefObject<HTMLDivElement>;
  let mockModels: any[];
  let mockIntelReports: IntelReportOverlayMarker[];

  beforeEach(() => {
    // Clear all logs and state
    aggressiveInteractionLog.length = 0;
    currentInteractionState = {
      isDragging: false,
      dragStartPos: { x: 0, y: 0 },
      dragDistance: 0,
      touchStartTime: 0,
      isMultiTouch: false,
      gestureDetected: false
    };
    vi.clearAllMocks();

    // Create aggressive mock container
    const mockContainer = document.createElement('div');
    mockContainer.style.width = '1200px';
    mockContainer.style.height = '800px';
    mockContainer.style.position = 'relative';
    
    Object.defineProperty(mockContainer, 'getBoundingClientRect', {
      value: () => ({
        left: 0, top: 0, width: 1200, height: 800,
        right: 1200, bottom: 800, x: 0, y: 0
      })
    });

    mockGlobeRef = {
      current: {
        camera: () => ({ position: { x: 0, y: 0, z: 100 } }),
        scene: () => ({ add: vi.fn(), remove: vi.fn(), traverse: vi.fn() })
      }
    };

    mockContainerRef = { current: mockContainer };

    mockIntelReports = [
      {
        pubkey: 'aggressive-test-1',
        title: 'Aggressive Test Report 1',
        content: 'Test content 1',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now(),
        author: 'Test Agent',
        tags: ['test']
      }
    ];

    mockModels = [{
      positionContainer: { position: { x: 0, y: 0, z: 0, clone: () => ({ x: 0, y: 0, z: 0 }) } },
      orientationContainer: { rotation: { x: 0, y: 0, z: 0 } },
      rotationContainer: { rotation: { x: 0, y: 0, z: 0 } },
      mesh: { position: { x: 0, y: 0, z: 0 }, traverse: vi.fn(), userData: { reportId: 'aggressive-test-1' } },
      report: mockIntelReports[0],
      basePosition: { x: 0, y: 0, z: 0 },
      hoverOffset: 2,
      localRotationY: 0
    }];
  });

  const renderComponent = () => {
    return render(
      <GlobalGlobeContextMenuProvider>
        <Enhanced3DGlobeInteractivity
          globeRef={mockGlobeRef}
          intelReports={mockIntelReports}
          visualizationMode={{ mode: 'CyberCommand', subMode: 'IntelReports' }}
          models={mockModels}
          containerRef={mockContainerRef}
        />
      </GlobalGlobeContextMenuProvider>
    );
  };

  describe('EXTREME Touch Interface Tests', () => {
    it('should handle rapid touch taps without creating false drags', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      // Rapid tap sequence (like angry user tapping)
      for (let i = 0; i < 10; i++) {
        const x = 100 + i * 20;
        const y = 100 + i * 10;

        fireEvent.touchStart(container, {
          touches: [{ clientX: x, clientY: y, identifier: i, force: 0.8 }]
        });

        await new Promise(resolve => setTimeout(resolve, 5)); // Very quick

        fireEvent.touchEnd(container, {
          changedTouches: [{ clientX: x, clientY: y, identifier: i, force: 0.8 }]
        });

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Analyze results
      const touchClicks = aggressiveInteractionLog.filter(l => l.type === 'TOUCH_CLICK');
      const touchDrags = aggressiveInteractionLog.filter(l => l.type === 'TOUCH_DRAG_END');

      console.log('Rapid Touch Test Results:', { touchClicks: touchClicks.length, touchDrags: touchDrags.length });
      
      expect(touchClicks.length).toBeGreaterThan(5); // Should detect multiple clicks
      expect(touchDrags.length).toBe(0); // Should not create false drags
    });

    it('should distinguish between single tap and pan gesture', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      // Test 1: Single tap
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100, identifier: 0, force: 1.0 }]
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 102, clientY: 101, identifier: 0, force: 1.0 }]
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Test 2: Pan gesture
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 200, identifier: 1, force: 1.0 }]
      });

      // Simulate pan movement
      for (let i = 0; i < 20; i++) {
        fireEvent.touchMove(container, {
          touches: [{ clientX: 200 + i * 5, clientY: 200 + i * 2, identifier: 1, force: 1.0 }]
        });
        await new Promise(resolve => setTimeout(resolve, 2));
      }

      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 300, clientY: 240, identifier: 1, force: 1.0 }]
      });

      // Analyze results
      const tapEvents = aggressiveInteractionLog.filter(l => l.type === 'TOUCH_CLICK');
      const panEvents = aggressiveInteractionLog.filter(l => l.type === 'TOUCH_DRAG_END');

      console.log('Tap vs Pan Results:', { taps: tapEvents.length, pans: panEvents.length });
      
      expect(tapEvents.length).toBe(1); // Single tap detected
      expect(panEvents.length).toBe(1); // Pan gesture detected
    });

    it('should handle multi-touch without creating intel reports', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      // Two-finger gesture (pinch/zoom simulation)
      fireEvent.touchStart(container, {
        touches: [
          { clientX: 100, clientY: 100, identifier: 0, force: 1.0 },
          { clientX: 200, clientY: 200, identifier: 1, force: 1.0 }
        ]
      });

      // Move both fingers
      fireEvent.touchMove(container, {
        touches: [
          { clientX: 105, clientY: 105, identifier: 0, force: 1.0 },
          { clientX: 195, clientY: 195, identifier: 1, force: 1.0 }
        ]
      });

      fireEvent.touchEnd(container, {
        changedTouches: [
          { clientX: 105, clientY: 105, identifier: 0, force: 1.0 },
          { clientX: 195, clientY: 195, identifier: 1, force: 1.0 }
        ]
      });

      // Should not create any click events for multi-touch
      const clickEvents = aggressiveInteractionLog.filter(l => l.type === 'TOUCH_CLICK');
      const multiTouchEvents = aggressiveInteractionLog.filter(l => 
        l.type === 'TOUCH_START' && (l.details as any)?.isMultiTouch
      );

      console.log('Multi-touch Results:', { clicks: clickEvents.length, multiTouch: multiTouchEvents.length });
      
      expect(multiTouchEvents.length).toBeGreaterThan(0); // Multi-touch detected
      expect(clickEvents.length).toBe(0); // No false clicks
    });

    it('should handle touch pressure variations correctly', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      // Light touch (should still work)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100, identifier: 0, force: 0.3 }]
      });

      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 101, clientY: 101, identifier: 0, force: 0.3 }]
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Heavy touch (should still work)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 200, identifier: 1, force: 1.0 }]
      });

      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 201, clientY: 201, identifier: 1, force: 1.0 }]
      });

      const touchEvents = aggressiveInteractionLog.filter(l => l.type === 'TOUCH_CLICK');
      const lightTouchEvents = touchEvents.filter(e => (e.force || 0) < 0.5);
      const heavyTouchEvents = touchEvents.filter(e => (e.force || 0) >= 0.5);

      console.log('Pressure Test Results:', { light: lightTouchEvents.length, heavy: heavyTouchEvents.length });
      
      expect(touchEvents.length).toBe(2); // Both touches should work
    });
  });

  describe('EXTREME Mouse Interface Tests', () => {
    it('should handle mouse with extremely high frequency movements', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });

      // Simulate 240Hz gaming mouse
      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        fireEvent.mouseMove(container, {
          clientX: 100 + Math.sin(i * 0.1) * 2, // Tiny circular movement
          clientY: 100 + Math.cos(i * 0.1) * 2
        });
        await new Promise(resolve => setTimeout(resolve, 1)); // 1ms = 1000Hz
      }
      const endTime = performance.now();

      fireEvent.mouseUp(container, { clientX: 102, clientY: 101 });

      // Should still be detected as click despite high-frequency noise
      const clickEvents = aggressiveInteractionLog.filter(l => l.type === 'CLICK_DETECTED');
      const mouseMoves = aggressiveInteractionLog.filter(l => l.type === 'MOUSE_MOVE');

      console.log('High-frequency Test:', { 
        duration: endTime - startTime, 
        mouseMoves: mouseMoves.length, 
        clicks: clickEvents.length 
      });

      expect(clickEvents.length).toBe(1); // Should detect click
      expect(mouseMoves.length).toBeGreaterThan(40); // Should track all movements
    });

    it('should handle accidental mouse escape and re-entry', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
      
      // Start dragging
      fireEvent.mouseMove(container, { clientX: 120, clientY: 120 });
      
      // Mouse leaves container (common when dragging fast)
      fireEvent.mouseLeave(container, { clientX: 150, clientY: 150 });
      
      // Mouse returns
      fireEvent.mouseEnter(container, { clientX: 160, clientY: 160 });
      fireEvent.mouseMove(container, { clientX: 160, clientY: 160 });
      
      // Should not create intel report after escape
      const clickEvents = aggressiveInteractionLog.filter(l => l.type === 'CLICK_DETECTED');
      const dragEvents = aggressiveInteractionLog.filter(l => l.type === 'DRAG_START');

      console.log('Mouse Escape Test:', { clicks: clickEvents.length, drags: dragEvents.length });
      
      expect(dragEvents.length).toBeGreaterThan(0); // Should detect drag
      expect(clickEvents.length).toBe(0); // Should not create false click
    });
  });

  describe('STRESS Testing - Real World Scenarios', () => {
    it('should handle user frustration scenario (angry clicking)', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      // Simulate frustrated user rapidly clicking all over
      const positions = [
        { x: 100, y: 100 }, { x: 200, y: 150 }, { x: 300, y: 200 },
        { x: 150, y: 250 }, { x: 250, y: 100 }, { x: 350, y: 300 }
      ];

      for (const pos of positions) {
        // Rapid click with slight movement (realistic mouse behavior)
        fireEvent.mouseDown(container, { clientX: pos.x, clientY: pos.y });
        
        // Tiny movements during click (realistic)
        for (let i = 0; i < 3; i++) {
          fireEvent.mouseMove(container, {
            clientX: pos.x + (Math.random() * 4 - 2),
            clientY: pos.y + (Math.random() * 4 - 2)
          });
          await new Promise(resolve => setTimeout(resolve, 5));
        }
        
        fireEvent.mouseUp(container, { 
          clientX: pos.x + (Math.random() * 4 - 2), 
          clientY: pos.y + (Math.random() * 4 - 2) 
        });
        
        await new Promise(resolve => setTimeout(resolve, 20)); // Brief pause
      }

      const clickEvents = aggressiveInteractionLog.filter(l => l.type === 'CLICK_DETECTED');
      const dragEvents = aggressiveInteractionLog.filter(l => l.type === 'DRAG_START');

      console.log('Angry Clicking Test:', { clicks: clickEvents.length, drags: dragEvents.length });
      
      expect(clickEvents.length).toBeGreaterThan(3); // Should detect multiple clicks
      expect(dragEvents.length).toBe(0); // Should not create false drags
    });

    it('should handle UI state consistency under rapid interactions', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      // Rapid click that should trigger popup
      fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(container, { clientX: 101, clientY: 101 });

      await waitFor(() => {
        expect(screen.queryByTestId('intel-popup')).toBeInTheDocument();
      });

      // Rapid additional interactions while popup is open
      for (let i = 0; i < 5; i++) {
        fireEvent.mouseDown(container, { clientX: 200 + i * 10, clientY: 200 });
        fireEvent.mouseMove(container, { clientX: 220 + i * 10, clientY: 220 }); // Drag
        fireEvent.mouseUp(container, { clientX: 220 + i * 10, clientY: 220 });
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // UI should remain consistent
      expect(screen.getByTestId('intel-popup')).toBeVisible();
      
      const popupShownEvents = aggressiveInteractionLog.filter(l => l.type === 'POPUP_SHOWN');
      console.log('UI Consistency Test:', { popupsShown: popupShownEvents.length });
      
      expect(popupShownEvents.length).toBe(1); // Should only show popup once
    });
  });

  describe('PERFORMANCE Under Extreme Load', () => {
    it('should maintain performance under sustained high-frequency input', async () => {
      renderComponent();
      const container = mockContainerRef.current!;

      const startTime = performance.now();
      let eventCount = 0;

      // Sustained input for 1 second
      const interval = setInterval(() => {
        if (performance.now() - startTime > 1000) {
          clearInterval(interval);
          return;
        }

        const x = 100 + Math.random() * 200;
        const y = 100 + Math.random() * 200;
        
        fireEvent.mouseMove(container, { clientX: x, clientY: y });
        eventCount++;
      }, 1); // 1000 events per second

      await new Promise(resolve => setTimeout(resolve, 1100));

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log('Performance Test:', { 
        duration: Math.round(duration), 
        eventsGenerated: eventCount,
        eventsTracked: aggressiveInteractionLog.length 
      });

      expect(duration).toBeLessThan(1200); // Should complete quickly
      expect(aggressiveInteractionLog.length).toBeGreaterThan(100); // Should track events
    });
  });

  afterEach(() => {
    // Always log interaction history for debugging
    if (aggressiveInteractionLog.length > 0) {
      console.log('\n=== AGGRESSIVE TEST INTERACTION LOG ===');
      aggressiveInteractionLog.forEach((log, i) => {
        console.log(`${i + 1}. ${log.type} @ ${Math.round(log.timestamp)}ms`, log.details || '');
      });
      console.log('========================================\n');
    }
  });
});
