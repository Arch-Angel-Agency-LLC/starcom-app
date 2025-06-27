/**
 * Enhanced IPFS-Nostr Integration Dashboard
 * 
 * This React component provides a comprehensive real-time dashboard showing
 * the integrated IPFS-Nostr functionality with enhanced team collaboration,
 * investigation coordination, and content management features.
 */

import React, { useState, useEffect } from 'react';
import { useIPFSNostrIntegration } from '../../hooks/useIPFSNostrIntegration';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import styles from './EnhancedIPFSNostrDashboard.module.css';

interface EnhancedDashboardProps {
  teamId?: string;
  userId: string;
  className?: string;
}

export const EnhancedIPFSNostrDashboard: React.FC<EnhancedDashboardProps> = ({ 
  teamId, 
  userId, 
  className = '' 
}) => {
  
  // Integration hook
  const {
    isConnected,
    isLoading,
    error,
    networkHealth,
    recentActivity,
    activeTeams,
    activeInvestigations,
    lastSync,
    initialize,
    storeContent,
    searchContent,
    getTeamWorkspace,
    refresh
  } = useIPFSNostrIntegration({
    autoInitialize: true,
    enableRealTimeSync: true,
    enableTeamWorkspaces: true,
    enableInvestigationCoordination: true
  });
  
  // Local state
  const [selectedTab, setSelectedTab] = useState<'overview' | 'activity' | 'teams' | 'investigations' | 'search'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [teamWorkspaces, setTeamWorkspaces] = useState<Record<string, Record<string, unknown>>>({});
  const [newContentData, setNewContentData] = useState('');
  const [contentClassification, setContentClassification] = useState<'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET'>('PUBLIC');
  const [isUploading, setIsUploading] = useState(false);
  
  // Load team workspaces when active teams change
  useEffect(() => {
    const loadTeamWorkspaces = async () => {
      const workspaces: Record<string, Record<string, unknown>> = {};
      for (const teamId of activeTeams) {
        try {
          workspaces[teamId] = await getTeamWorkspace(teamId);
        } catch (error) {
          console.error(`Failed to load workspace for team ${teamId}:`, error);
        }
      }
      setTeamWorkspaces(workspaces);
    };
    
    if (activeTeams.length > 0) {
      loadTeamWorkspaces();
    }
  }, [activeTeams, getTeamWorkspace]);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchContent(searchQuery, {
        teamId: teamId,
        contentType: 'all'
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle content upload
  const handleContentUpload = async () => {
    if (!newContentData.trim()) return;
    
    setIsUploading(true);
    try {
      const content = {
        type: 'user-generated',
        data: newContentData,
        timestamp: new Date().toISOString(),
        userId
      };
      
      await storeContent(content, {
        teamId: teamId,
        classification: contentClassification,
        announceViaNostr: true
      });
      
      setNewContentData('');
      alert('Content uploaded successfully!');
    } catch (error) {
      console.error('Content upload failed:', error);
      alert('Content upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Render network health indicator
  const renderNetworkHealth = () => (
    <div className={styles.networkHealth}>
      <div className={`${styles.healthIndicator} ${styles[networkHealth.ipfs]}`}>
        <span className={styles.healthLabel}>IPFS</span>
        <span className={styles.healthStatus}>{networkHealth.ipfs.toUpperCase()}</span>
      </div>
      <div className={`${styles.healthIndicator} ${styles[networkHealth.nostr]}`}>
        <span className={styles.healthLabel}>Nostr</span>
        <span className={styles.healthStatus}>{networkHealth.nostr.toUpperCase()}</span>
      </div>
      <div className={styles.healthIndicator}>
        <span className={styles.healthLabel}>Peers</span>
        <span className={styles.healthValue}>{networkHealth.relayNodes}</span>
      </div>
    </div>
  );
  
  // Render activity feed
  const renderActivityFeed = () => (
    <div className={styles.activityFeed}>
      {recentActivity.slice(0, 10).map((activity) => (
        <div key={activity.id} className={styles.activityItem}>
          <div className={styles.activityIcon}>
            {activity.type === 'content-stored' && '📦'}
            {activity.type === 'content-updated' && '🔄'}
            {activity.type === 'collaboration' && '👥'}
            {activity.type === 'team-join' && '🏢'}
            {activity.type === 'investigation-created' && '🔍'}
          </div>
          <div className={styles.activityContent}>
            <div className={styles.activityDescription}>{activity.description}</div>
            <div className={styles.activityMeta}>
              <span className={styles.activityTime}>
                {activity.timestamp.toLocaleTimeString()}
              </span>
              <span className={styles.activitySource}>
                {activity.source.toUpperCase()}
              </span>
              {activity.teamId && (
                <span className={styles.activityTeam}>Team: {activity.teamId}</span>
              )}
            </div>
          </div>
        </div>
      ))}
      {recentActivity.length === 0 && (
        <div className={styles.emptyState}>No recent activity</div>
      )}
    </div>
  );
  
  // Render teams overview
  const renderTeamsOverview = () => (
    <div className={styles.teamsOverview}>
      {activeTeams.map((teamId) => (
        <Card key={teamId} className={styles.teamCard}>
          <CardHeader>
            <CardTitle>Team: {teamId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.teamStats}>
              <div>Status: {String(teamWorkspaces[teamId]?.status) || 'Loading...'}</div>
              <div>Members: {Number(teamWorkspaces[teamId]?.memberCount) || 0}</div>
            </div>
          </CardContent>
        </Card>
      ))}
      {activeTeams.length === 0 && (
        <div className={styles.emptyState}>No active teams</div>
      )}
    </div>
  );
  
  // Render investigations overview
  const renderInvestigationsOverview = () => (
    <div className={styles.investigationsOverview}>
      {activeInvestigations.map((investigationId) => (
        <Card key={investigationId} className={styles.investigationCard}>
          <CardHeader>
            <CardTitle>Investigation: {investigationId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.investigationStats}>
              <div>Status: Active</div>
              <div>Content Items: 0</div>
            </div>
          </CardContent>
        </Card>
      ))}
      {activeInvestigations.length === 0 && (
        <div className={styles.emptyState}>No active investigations</div>
      )}
    </div>
  );
  
  // Render search interface
  const renderSearchInterface = () => (
    <div className={styles.searchInterface}>
      <div className={styles.searchForm}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search content across IPFS and Nostr..."
          className={styles.searchInput}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className={styles.searchButton}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <div className={styles.searchResults}>
        {searchResults.map((result, index) => (
          <Card key={index} className={styles.searchResultCard}>
            <CardContent>
              <div>Result {index + 1}: {JSON.stringify(result)}</div>
            </CardContent>
          </Card>
        ))}
        {searchResults.length === 0 && searchQuery && !isSearching && (
          <div className={styles.emptyState}>No results found</div>
        )}
      </div>
    </div>
  );
  
  // Render content upload interface
  const renderContentUpload = () => (
    <div className={styles.contentUpload}>
      <h4>Upload New Content</h4>
      <textarea
        value={newContentData}
        onChange={(e) => setNewContentData(e.target.value)}
        placeholder="Enter content to upload..."
        className={styles.contentInput}
        rows={4}
      />
      <div className={styles.uploadControls}>
        <select
          value={contentClassification}
          onChange={(e) => setContentClassification(e.target.value as typeof contentClassification)}
          className={styles.classificationSelect}
        >
          <option value="PUBLIC">Public</option>
          <option value="CONFIDENTIAL">Confidential</option>
          <option value="SECRET">Secret</option>
          <option value="TOP_SECRET">Top Secret</option>
        </select>
        <button
          onClick={handleContentUpload}
          disabled={isUploading || !newContentData.trim()}
          className={styles.uploadButton}
        >
          {isUploading ? 'Uploading...' : 'Upload Content'}
        </button>
      </div>
    </div>
  );
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`${styles.dashboard} ${className}`}>
        <Card>
          <CardContent>
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <div>Initializing IPFS-Nostr Integration...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`${styles.dashboard} ${className}`}>
        <Card>
          <CardContent>
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <div className={styles.errorMessage}>
                Integration Error: {error}
              </div>
              <button onClick={() => initialize()} className={styles.retryButton}>
                Retry Initialization
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`${styles.dashboard} ${className}`}>
      {/* Header */}
      <Card className={styles.headerCard}>
        <CardHeader>
          <CardTitle>IPFS-Nostr Integration Dashboard</CardTitle>
          <div className={styles.headerControls}>
            <div className={styles.connectionStatus}>
              <span className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className={styles.lastSync}>
              Last Sync: {lastSync.toLocaleTimeString()}
            </div>
            <button onClick={refresh} className={styles.refreshButton}>
              🔄 Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {renderNetworkHealth()}
        </CardContent>
      </Card>
      
      {/* Navigation Tabs */}
      <div className={styles.tabNavigation}>
        {(['overview', 'activity', 'teams', 'investigations', 'search'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`${styles.tabButton} ${selectedTab === tab ? styles.activeTab : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className={styles.tabContent}>
        {selectedTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.statsGrid}>
              <Card>
                <CardHeader><CardTitle>Active Teams</CardTitle></CardHeader>
                <CardContent>
                  <div className={styles.statValue}>{activeTeams.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Active Investigations</CardTitle></CardHeader>
                <CardContent>
                  <div className={styles.statValue}>{activeInvestigations.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className={styles.statValue}>{recentActivity.length}</div>
                </CardContent>
              </Card>
            </div>
            {renderContentUpload()}
          </div>
        )}
        
        {selectedTab === 'activity' && (
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>{renderActivityFeed()}</CardContent>
          </Card>
        )}
        
        {selectedTab === 'teams' && (
          <Card>
            <CardHeader><CardTitle>Team Workspaces</CardTitle></CardHeader>
            <CardContent>{renderTeamsOverview()}</CardContent>
          </Card>
        )}
        
        {selectedTab === 'investigations' && (
          <Card>
            <CardHeader><CardTitle>Investigations</CardTitle></CardHeader>
            <CardContent>{renderInvestigationsOverview()}</CardContent>
          </Card>
        )}
        
        {selectedTab === 'search' && (
          <Card>
            <CardHeader><CardTitle>Content Search</CardTitle></CardHeader>
            <CardContent>{renderSearchInterface()}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedIPFSNostrDashboard;
