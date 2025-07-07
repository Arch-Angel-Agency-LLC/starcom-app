import React from 'react';
import { FloatingPanelData } from '../FloatingPanelContext';

interface QuickActionBubbleProps {
  data?: FloatingPanelData;
}

const QuickActionBubble: React.FC<QuickActionBubbleProps> = ({ data }) => {
  const icon = (data?.icon as string) || '👁️';
  const label = (data?.label as string) || 'Watch';

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}>
      <span style={{ fontSize: '0.8rem' }}>{icon}</span>
      <span style={{ fontWeight: '600' }}>{label}</span>
    </div>
  );
};

export default QuickActionBubble;
