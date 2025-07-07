import React, { useEffect, useState } from 'react';

interface SessionExpiryCountdownProps {
  expiry: number; // timestamp in ms
  onExpire: () => void;
  warningThreshold?: number; // ms before expiry to trigger warning
  onWarning?: () => void;
}

const SessionExpiryCountdown: React.FC<SessionExpiryCountdownProps> = ({ expiry, onExpire, warningThreshold = 5 * 60 * 1000, onWarning }) => {
  const [timeLeft, setTimeLeft] = useState(expiry - Date.now());
  const [warning, setWarning] = useState(false);
  const [warned, setWarned] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = expiry - Date.now();
      setTimeLeft(left);
      const isWarning = left <= warningThreshold;
      setWarning(isWarning);
      if (isWarning && !warned) {
        setWarned(true);
        if (onWarning) onWarning();
      }
      if (left <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiry, onExpire, warningThreshold, onWarning, warned]);

  if (timeLeft <= 0) return null;
  const min = Math.floor(timeLeft / 60000);
  const sec = Math.floor((timeLeft % 60000) / 1000);
  return (
    <div
      className="session-expiry-countdown"
      style={{
        background: warning ? '#fffde7' : '#e8f5e9',
        color: warning ? '#fbc02d' : '#388e3c',
        padding: '0.25rem 0.75rem',
        borderRadius: '4px',
        display: 'inline-block',
        fontWeight: 500,
        marginLeft: '1rem',
      }}
      role="status"
      aria-live="polite"
    >
      Session expires in {min}:{sec.toString().padStart(2, '0')}
      {warning && <span style={{ marginLeft: 8 }}>(Re-auth soon!)</span>}
    </div>
  );
};

export default SessionExpiryCountdown;
