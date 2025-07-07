import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const show = () => {
    timeoutRef.current = window.setTimeout(() => setVisible(true), 300);
  };
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onMouseEnter={show}
        onFocus={show}
        onMouseLeave={hide}
        onBlur={hide}
        tabIndex={0}
        aria-describedby="tooltip"
        style={{ outline: 'none' }}
      >
        {children}
      </span>
      {visible && (
        <span
          id="tooltip"
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#222',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 3000,
            fontSize: '0.9rem',
            pointerEvents: 'none',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
