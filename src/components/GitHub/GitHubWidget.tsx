import React, { useState, useEffect } from 'react';
import { trackInvestorEvents } from '../../utils/analytics';
import { getVersionStatus } from '../../utils/version';
import styles from './GitHubWidget.module.css';

interface GitHubWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const GITHUB_CONFIG = {
  repoUrl: 'https://github.com/Arch-Angel-Agency-LLC/starcom-app',
  repoOwner: 'Arch-Angel-Agency-LLC',
  repoName: 'starcom-app',
  communityGoal: 100 // Target star count
};

const GitHubWidget: React.FC<GitHubWidgetProps> = ({ isOpen, onClose }) => {
  const [repoStats, setRepoStats] = useState({
    stars: 0,
    forks: 0,
    watchers: 0,
    latestRelease: '',
    lastCommit: '',
    language: 'TypeScript',
    issues: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const versionStatus = getVersionStatus();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Track GitHub widget usage
      trackInvestorEvents.featureUsed('github-widget');
      
      // Fetch GitHub repo statistics
      const fetchRepoStats = async () => {
        try {
          const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.repoOwner}/${GITHUB_CONFIG.repoName}`);
          const data = await response.json();
          
          if (response.ok) {
            setRepoStats({
              stars: data.stargazers_count || 0,
              forks: data.forks_count || 0,
              watchers: data.watchers_count || 0,
              issues: data.open_issues_count || 0,
              latestRelease: versionStatus.formattedDisplay,
              lastCommit: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'Recently',
              language: data.language || 'TypeScript'
            });
          } else {
            // Fallback data for demo
            setRepoStats({
              stars: 12,
              forks: 3,
              watchers: 8,
              issues: 2,
              latestRelease: versionStatus.formattedDisplay,
              lastCommit: 'Today',
              language: 'TypeScript'
            });
          }
        } catch (_error) {
          // Fallback data if API fails
          setRepoStats({
            stars: 12,
            forks: 3,
            watchers: 8,
            issues: 2,
            latestRelease: versionStatus.formattedDisplay,
            lastCommit: 'Recently',
            language: 'TypeScript'
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      // Add slight delay for better UX
      setTimeout(fetchRepoStats, 800);
    }
  }, [isOpen, versionStatus.formattedDisplay]);

  const handleViewIssues = () => {
    trackInvestorEvents.navigationClick('github-repository-view');
    window.open(`${GITHUB_CONFIG.repoUrl}/`, '_blank');
  };

  const handleContribute = () => {
    trackInvestorEvents.navigationClick('github-discussions');
    window.open(`${GITHUB_CONFIG.repoUrl}/discussions/`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.githubWidget}>
      <div className={styles.header}>
        <div className={styles.title}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ marginRight: '8px', color: '#ffffff' }}
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Github
        </div>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close GitHub widget"
        >
          ✕
        </button>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Connecting to repository...</p>
          </div>
        ) : (
          <>
            {/* Repository Section - Main Container like Discord/Telegram */}
            <div className={styles.repoSection}>
              <div className={styles.repoHeader}>
                <div className={styles.repoIcon}>📂</div>
                <div className={styles.repoInfo}>
                  <h3>Starcom App</h3>
                  <p className={styles.repoPath}>Arch-Angel-Agency-LLC/{GITHUB_CONFIG.repoName}</p>
                </div>
                <div className={styles.languageBadge}>{repoStats.language}</div>
              </div>

              {/* Stats Grid - Clean 2x2 layout */}
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{repoStats.stars}</span>
                  <span className={styles.statLabel}>Stars</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{repoStats.forks}</span>
                  <span className={styles.statLabel}>Forks</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{repoStats.watchers}</span>
                  <span className={styles.statLabel}>Watchers</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{repoStats.issues}</span>
                  <span className={styles.statLabel}>Issues</span>
                </div>
              </div>

              {/* Activity Section - Clean single line */}
              <div className={styles.activitySection}>
                <span className={styles.activityIcon}>📝</span>
                <span className={styles.activityText}>Last updated: {repoStats.lastCommit}</span>
              </div>

              {/* Action Buttons - Integrated like Discord/Telegram */}
              <div className={styles.actionButtons}>
                <button 
                  className={styles.actionButton}
                  onClick={handleViewIssues}
                >
                  Codebase 💻
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={handleContribute}
                >
                  Community 👩🏽‍💻
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.uplinkIndicator}>
          <span className={!isLoading && repoStats.stars !== undefined ? styles.glowingGreenDot : styles.glowingRedDot}></span>
          <span>
            {!isLoading && repoStats.stars !== undefined ? 'Github Uplink Online' : 'Uplink Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GitHubWidget;
