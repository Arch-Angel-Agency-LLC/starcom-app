import React from 'react';
import { useIntelDashboard } from '../../hooks/useIntelDashboard';

const TestIntelDashboard: React.FC = () => {
  const { openIntelDashboard } = useIntelDashboard();

  const handleOpenPublic = () => {
    openIntelDashboard({ filterMode: 'PUBLIC' });
  };

  const handleOpenTeam = () => {
    openIntelDashboard({ filterMode: 'TEAM' });
  };

  const handleOpenPersonal = () => {
    openIntelDashboard({ filterMode: 'PERSONAL' });
  };

  const handleOpenAll = () => {
    openIntelDashboard({ filterMode: 'ALL' });
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
      borderRadius: '10px',
      border: '2px solid #00C4FF'
    }}>
      <h3 style={{ color: '#00C4FF', margin: 0, fontSize: '14px' }}>Intel Dashboard Test</h3>
      
      <button 
        onClick={handleOpenPublic}
        style={{
          background: 'linear-gradient(135deg, #0099ff, #00ff41)',
          color: '#000',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        🌐 Public Sharing
      </button>
      
      <button 
        onClick={handleOpenTeam}
        style={{
          background: 'linear-gradient(135deg, #ffa500, #ff6600)',
          color: '#000',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        👥 Team Collaboration
      </button>
      
      <button 
        onClick={handleOpenPersonal}
        style={{
          background: 'linear-gradient(135deg, #ff00ff, #ff0066)',
          color: '#fff',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        👤 Personal Workspace
      </button>
      
      <button 
        onClick={handleOpenAll}
        style={{
          background: 'linear-gradient(135deg, #00ff41, #ffff00)',
          color: '#000',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        📊 All Intel
      </button>
    </div>
  );
};

export default TestIntelDashboard;
