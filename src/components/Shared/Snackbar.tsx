import React, { useEffect } from 'react';

interface SnackbarProps {
  message: string;
  open: boolean;
  onClose: () => void;
  duration?: number; // ms
  type?: 'success' | 'info' | 'error';
}

const Snackbar: React.FC<SnackbarProps> = ({ message, open, onClose, duration = 3000, type = 'info' }) => {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;
  return (
    <div
      className={`snackbar snackbar-${type}`}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#333',
        color: '#fff',
        padding: '1rem 2rem',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 2000,
        minWidth: '200px',
        textAlign: 'center',
      }}
      tabIndex={0}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 4,
          right: 8,
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '1.2rem',
          cursor: 'pointer',
        }}
        data-testid="snackbar-close"
      >
        ×
      </button>
      {message}
    </div>
  );
};

export default Snackbar;
