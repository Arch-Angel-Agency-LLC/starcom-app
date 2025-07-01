import React, { useState } from 'react';

interface PointerEventsTestProps {
  className?: string;
}

/**
 * Pointer Events Test Component
 * Simple component to test if pointer events are working in views
 * 
 * AI-NOTE: This component helps verify that views can receive user interaction
 */
const PointerEventsTest: React.FC<PointerEventsTestProps> = ({ className }) => {
  const [clickCount, setClickCount] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    console.log('✅ Pointer events working! Click count:', clickCount + 1);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className={className}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 255, 65, 0.9)',
        color: 'black',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: 1000,
        minWidth: '200px'
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        🎯 POINTER EVENTS TEST
      </div>
      <div>Clicks: {clickCount}</div>
      <div>Mouse: {mousePosition.x}, {mousePosition.y}</div>
      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        Click me to test interactions!
      </div>
      {clickCount > 0 && (
        <div style={{ marginTop: '10px', color: 'green', fontWeight: 'bold' }}>
          ✅ Pointer events working!
        </div>
      )}
    </div>
  );
};

export default PointerEventsTest;
