import React, { useEffect, useState } from 'react';
import { RelayNodeIPFSService } from '../../services/RelayNodeIPFSService';
import { loadRuntimeConfig } from '../../config/runtimeConfig';

const relay = RelayNodeIPFSService.getInstance();

type Status = 'relay' | 'serverless' | 'mock';

export const StorageStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<Status>('mock');

  useEffect(() => {
    (async () => {
      const s = relay.getRelayNodeStatus();
      if (s.available) {
        setStatus('relay');
        return;
      }
      const cfg = await loadRuntimeConfig();
      const pin = cfg.features?.serverlessPin || (import.meta.env.VITE_PIN_API === 'true');
      setStatus(pin ? 'serverless' : 'mock');
    })();
  }, []);

  const style: React.CSSProperties = {
    position: 'fixed',
    bottom: 10,
    right: 10,
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    background: status === 'relay' ? '#0b3d0b' : status === 'serverless' ? '#2c2c6c' : '#5a1a1a',
    color: '#fff',
    opacity: 0.9,
    zIndex: 10002
  };

  const label = status === 'relay' ? 'IPFS: RelayNode' : status === 'serverless' ? 'IPFS: Serverless Pin' : 'IPFS: Mock';

  return <div style={style} title="Storage pathway status">{label}</div>;
};

export default StorageStatusBadge;
