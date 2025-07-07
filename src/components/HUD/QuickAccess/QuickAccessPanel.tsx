import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './QuickAccessPanel.module.css';

const QuickAccessPanel: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'teams',
      label: 'Teams',
      icon: '👥',
      description: 'Join or manage cyber investigation teams',
      path: '/teams',
      color: '#00ff41'
    },
    {
      id: 'investigations',
      label: 'Investigations',
      icon: '🔍',
      description: 'View active investigations and cases',
      path: '/investigations',
      color: '#0099ff'
    },
    {
      id: 'intel',
      label: 'Intel Reports',
      icon: '📊',
      description: 'Create and share intelligence reports',
      path: '/intel',
      color: '#ffa500'
    }
  ];

  return (
    <div className={styles.quickAccessPanel}>
      <div className={styles.header}>
        <h3>Quick Access</h3>
        <p>Get started with cyber operations</p>
      </div>
      
      <div className={styles.actions}>
        {quickActions.map((action) => (
          <button
            key={action.id}
            className={styles.actionButton}
            onClick={() => navigate(action.path)}
            style={{ borderColor: action.color }}
          >
            <div className={styles.actionIcon} style={{ color: action.color }}>
              {action.icon}
            </div>
            <div className={styles.actionInfo}>
              <h4 style={{ color: action.color }}>{action.label}</h4>
              <p>{action.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      <div className={styles.helpSection}>
        <p className={styles.helpText}>
          New to STARCOM? Need help finding your team?
        </p>
        <button 
          className={styles.helpButton}
          onClick={() => navigate('/teams')}
        >
          Get Started Guide
        </button>
      </div>
    </div>
  );
};

export default QuickAccessPanel;
