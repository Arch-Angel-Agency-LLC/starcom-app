// DiagnosticGlobeTest.tsx - Simple test to diagnose the real issue

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Create a minimal test component to isolate the issue
// TODO: Implement quality gate enforcement in CI/CD pipeline - PRIORITY: MEDIUM
const TestGlobeInteractivity: React.FC = () => {
  const [clicks, setClicks] = React.useState(0);
  const [drags, setDrags] = React.useState(0);
  const [state, setState] = React.useState('idle');
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Simplified interaction state
  const [interactionState, setInteractionState] = React.useState({
    isMouseDown: false,
    dragStartPos: { x: 0, y: 0 },
    mouseDownTime: 0,
    hasDraggedPastThreshold: false
  });
  
  const dragThreshold = 5;
  const timeThreshold = 300;
  
  const handleMouseDown = React.useCallback((event: React.MouseEvent) => {
    console.log('🔍 DIAGNOSTIC: Mouse down triggered');
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setInteractionState({
      isMouseDown: true,
      dragStartPos: { x, y },
      mouseDownTime: Date.now(),
      hasDraggedPastThreshold: false
    });
    
    setState('mouse_down');
  }, []);
  
  const handleMouseMove = React.useCallback((event: React.MouseEvent) => {
    if (!interactionState.isMouseDown) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const dragDistance = Math.sqrt(
      Math.pow(x - interactionState.dragStartPos.x, 2) + 
      Math.pow(y - interactionState.dragStartPos.y, 2)
    );
    
    if (dragDistance > dragThreshold && !interactionState.hasDraggedPastThreshold) {
      console.log('🔍 DIAGNOSTIC: Drag detected', { dragDistance, dragThreshold });
      setInteractionState(prev => ({ ...prev, hasDraggedPastThreshold: true }));
      setState('dragging');
      setDrags(prev => prev + 1);
    }
  }, [interactionState, dragThreshold]);
  
  const handleMouseUp = React.useCallback(() => {
    if (!interactionState.isMouseDown) return;
    
    const timeSinceMouseDown = Date.now() - interactionState.mouseDownTime;
    const wasClick = !interactionState.hasDraggedPastThreshold && timeSinceMouseDown < timeThreshold;
    
    console.log('🔍 DIAGNOSTIC: Mouse up', {
      wasClick,
      hasDraggedPastThreshold: interactionState.hasDraggedPastThreshold,
      timeSinceMouseDown,
      timeThreshold
    });
    
    if (wasClick) {
      console.log('🔍 DIAGNOSTIC: Click detected - creating intel report');
      setClicks(prev => prev + 1);
      setState('clicked');
    } else {
      setState('dragged');
    }
    
    setInteractionState({
      isMouseDown: false,
      dragStartPos: { x: 0, y: 0 },
      mouseDownTime: 0,
      hasDraggedPastThreshold: false
    });
  }, [interactionState, timeThreshold]);
  
  return (
    <div 
      ref={containerRef}
      data-testid="diagnostic-container"
      style={{ 
        width: '400px', 
        height: '300px', 
        border: '1px solid black',
        background: 'lightgray'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div data-testid="clicks">Clicks: {clicks}</div>
      <div data-testid="drags">Drags: {drags}</div>
      <div data-testid="state">State: {state}</div>
    </div>
  );
};

describe('Diagnostic Globe Interaction Test', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should detect clicks correctly', async () => {
    console.log('🧪 DIAGNOSTIC: Testing basic click detection');
    
    render(<TestGlobeInteractivity />);
    const container = screen.getByTestId('diagnostic-container');
    
    // Quick click
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    
    act(() => {
      vi.advanceTimersByTime(100); // 100ms - under threshold
    });
    
    fireEvent.mouseUp(container, { clientX: 100, clientY: 100 });
    
    // Check if click was detected
    const clickCount = screen.getByTestId('clicks').textContent;
    const state = screen.getByTestId('state').textContent;
    
    console.log('🔍 DIAGNOSTIC Results:', { clickCount, state });
    
    expect(clickCount).toBe('Clicks: 1');
    expect(state).toBe('State: clicked');
  });

  it('should detect drags correctly', async () => {
    console.log('🧪 DIAGNOSTIC: Testing basic drag detection');
    
    render(<TestGlobeInteractivity />);
    const container = screen.getByTestId('diagnostic-container');
    
    // Start drag
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    
    // Move mouse to trigger drag
    fireEvent.mouseMove(container, { clientX: 110, clientY: 100 });
    
    fireEvent.mouseUp(container, { clientX: 110, clientY: 100 });
    
    // Check if drag was detected
    const dragCount = screen.getByTestId('drags').textContent;
    const state = screen.getByTestId('state').textContent;
    
    console.log('🔍 DIAGNOSTIC Results:', { dragCount, state });
    
    expect(dragCount).toBe('Drags: 1');
    expect(state).toBe('State: dragged');
  });
});
