import React from 'react';

interface ThreatHorizonFeedProps {
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  className?: string;
}

/**
 * Temporary simplified version during context migration
 * TODO: Restore full functionality with proper unified context types
 */
const ThreatHorizonFeed: React.FC<ThreatHorizonFeedProps> = ({ expanded = false, className }) => {
  return (
    <div className={className} style={{ padding: '20px', background: '#1a1a1a', color: '#fff', borderRadius: '8px' }}>
      <h3>Threat Horizon Feed</h3>
      <p>Temporarily disabled during context migration.</p>
      <p>Will be restored with proper unified context integration.</p>
      <div style={{ marginTop: '20px' }}>
        <div>Status: Migration in progress</div>
        <div>Threats: 0 (migration mode)</div>
        <div>Expanded: {expanded ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default ThreatHorizonFeed;
