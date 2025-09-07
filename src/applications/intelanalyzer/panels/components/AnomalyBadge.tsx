import React from 'react';
import { Chip } from '@mui/material';

export interface AnomalyBadgeProps {
  timestamp?: string | Date | null;
  anomaliesByDay: Set<string>;
  showClusters: boolean;
}

const AnomalyBadge: React.FC<AnomalyBadgeProps> = ({ timestamp, anomaliesByDay, showClusters }) => {
  if (!timestamp || !showClusters) return null;
  let key = '';
  try {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  key = d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
  if (!anomaliesByDay.has(key)) return null;
  return (
    <Chip
      data-testid="inspector-anomaly-badge"
      label="Anomaly"
      size="small"
      sx={{ backgroundColor: 'rgba(255,77,79,0.2)', color: '#ff4d4f' }}
    />
  );
};

export default AnomalyBadge;
