import React from 'react';

/**
 * Deprecated: TimeMapApplication has been removed.
 * Please use IntelAnalyzer → Timeline view instead.
 * This stub remains temporarily to avoid breaking any lingering imports.
 */
const TimeMapApplication: React.FC = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn('[Deprecated] TimeMapApplication is no longer available. Use IntelAnalyzer TimelineView.');
  }
  return (
    <div style={{ padding: 16, color: '#ccc' }}>
      <h2 style={{ margin: '0 0 8px' }}>TimeMap has been removed</h2>
      <p style={{ margin: 0 }}>Use IntelAnalyzer → Timeline for temporal analysis.</p>
    </div>
  );
};

export default TimeMapApplication;
