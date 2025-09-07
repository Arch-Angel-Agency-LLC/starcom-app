import React, { useEffect, useMemo, useState } from 'react';
import { RelayNodeIPFSService } from '../../services/RelayNodeIPFSService';
import { loadRuntimeConfig } from '../../config/runtimeConfig';

const relay = RelayNodeIPFSService.getInstance();

type Status = 'relay' | 'serverless' | 'mock';

export const StorageStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<Status>('mock');
  // Visible by default unless user dismissed or env disabled
  const initialHidden = useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        const persisted = localStorage.getItem('hideStorageStatusBadge') === 'true';
        const envHidden = (import.meta.env.VITE_SHOW_STORAGE_BADGE as string | undefined) === 'false';
        return persisted || envHidden;
      }
    } catch {
      // ignore storage errors
    }
    return false;
  }, []);
  const [visible, setVisible] = useState<boolean>(!initialHidden);

  useEffect(() => {
    (async () => {
      // Runtime config can explicitly disable the badge
      try {
        const cfg = await loadRuntimeConfig();
        if (cfg.features && cfg.features.storageBadge === false) {
          setVisible(false);
          return;
        }
      } catch {
        // ignore config load errors; fall back to env/visibility state
      }

      if (!visible) return;

      const s = relay.getRelayNodeStatus();
      if (s.available) {
        setStatus('relay');
        return;
      }
      const cfg = await loadRuntimeConfig();
      const pin = cfg.features?.serverlessPin || (import.meta.env.VITE_PIN_API === 'true');
      setStatus(pin ? 'serverless' : 'mock');
    })();
  }, [visible]);

  if (!visible) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    bottom: 10,
    right: 10,
    padding: '6px 10px 6px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    background: status === 'relay' ? '#0b3d0b' : status === 'serverless' ? '#2c2c6c' : '#5a1a1a',
    color: '#fff',
    opacity: 0.9,
    zIndex: 10002,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  };

  const label = status === 'relay' ? 'IPFS: RelayNode' : status === 'serverless' ? 'IPFS: Serverless Pin' : 'IPFS: Mock';

  return (
    <div style={style} title="Storage pathway status">
      <span>{label}</span>
      <button
        aria-label="Hide storage status"
        onClick={() => {
          try {
            localStorage.setItem('hideStorageStatusBadge', 'true');
          } catch {
            // ignore storage errors
          }
          setVisible(false);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          opacity: 0.85,
          cursor: 'pointer',
          padding: 0,
          lineHeight: 1,
          fontSize: 14,
        }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

export default StorageStatusBadge;
