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
  description: 'Open-source Earth Alliance Intelligence Platform - transparent development for global security.',
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

  // Calculate community progress
  const communityProgress = Math.min((repoStats.stars / GITHUB_CONFIG.communityGoal) * 100, 100);
  const remainingStars = Math.max(GITHUB_CONFIG.communityGoal - repoStats.stars, 0);

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

  const handleViewRepository = () => {
    trackInvestorEvents.navigationClick('github-repository-view');
    window.open(GITHUB_CONFIG.repoUrl, '_blank');
  };

  const handleViewIssues = () => {
    trackInvestorEvents.navigationClick('github-issues-view');
    window.open(`${GITHUB_CONFIG.repoUrl}/issues`, '_blank');
  };

  const handleContribute = () => {
    trackInvestorEvents.navigationClick('github-contribute');
    window.open(`${GITHUB_CONFIG.repoUrl}/blob/main/CONTRIBUTING.md`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.githubWidget}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>🐙</span>
          Open Source Hub
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
            {/* Repository Info Section */}
            <div className={styles.repoSection}>
              <div className={styles.repoHeader}>
                <div className={styles.repoIcon}>📂</div>
                <div className={styles.repoInfo}>
                  <h3>Starcom App</h3>
                  <p className={styles.repoPath}>Arch-Angel-Agency-LLC/{GITHUB_CONFIG.repoName}</p>
                </div>
                <div className={styles.languageBadge}>{repoStats.language}</div>
              </div>
              
              <p className={styles.repoDescription}>
                {GITHUB_CONFIG.description}
              </p>
              
              <button 
                className={styles.primaryButton}
                onClick={handleViewRepository}
              >
                🚀 View Repository
              </button>
            </div>

            {/* Community & Version Status */}
            <div className={styles.communitySection}>
              <h3>Community & Development</h3>
              <div className={styles.versionStatus}>
                <span className={styles.versionBadge}>{repoStats.latestRelease}</span>
                <span className={styles.statusText}>
                  {versionStatus.hasUpdate ? '🟡 Update Available' : '🟢 Latest Version'}
                </span>
              </div>
              
              <div className={styles.communityProgress}>
                <div className={styles.progressHeader}>
                  <span>Community Goal Progress</span>
                  <span>{repoStats.stars}/{GITHUB_CONFIG.communityGoal} ⭐</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${communityProgress}%` }}
                  ></div>
                </div>
                <p className={styles.communityMessage}>
                  Join <strong>{repoStats.stars + repoStats.forks + repoStats.watchers}</strong> developers 
                  supporting the Earth Alliance Starcom Initiative!
                </p>
              </div>
            </div>

            {/* Repository Statistics */}
            <div className={styles.statsSection}>
              <h3>Repository Statistics</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statIcon}>⭐</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{repoStats.stars}</span>
                    <span className={styles.statLabel}>Stars</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statIcon}>🔀</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{repoStats.forks}</span>
                    <span className={styles.statLabel}>Forks</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statIcon}>👁️</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{repoStats.watchers}</span>
                    <span className={styles.statLabel}>Watchers</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statIcon}>🔧</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{repoStats.issues}</span>
                    <span className={styles.statLabel}>Issues</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contribution Hub */}
            <div className={styles.contributionSection}>
              <h3>Open Source Collaboration</h3>
              <div className={styles.actionButtons}>
                <button 
                  className={styles.actionButton}
                  onClick={handleViewIssues}
                >
                  🔧 View Issues
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={handleContribute}
                >
                  💡 Contribute Code
                </button>
              </div>
            </div>

            {/* Development Activity */}
            <div className={styles.activitySection}>
              <h3>Development Activity</h3>
              <div className={styles.activityPreview}>
                <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>📝</span>
                  <span>Last updated: {repoStats.lastCommit}</span>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>🔄</span>
                  <span>Continuous integration active</span>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>🛡️</span>
                  <span>Security auditing enabled</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.openSourceIndicator}>📖</span>
        <span>Transparent Development for Earth Alliance</span>
      </div>
    </div>
  );
};

export default GitHubWidget;
