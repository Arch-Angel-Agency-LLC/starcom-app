/**
 * IPFS-Nostr Integration Dashboard Component
 * 
 * This React component provides a real-time dashboard showing the integration
 * between IPFS content storage and Nostr messaging in the Starcom dApp.
 * 
 * Features:
 * - Real-time content activity feed (IPFS + Nostr)
 * - Team workspace overview with network status
 * - Investigation coordination timeline
 * - Content discovery and search across both protocols
 * - Network health monitoring
 */

import React, { useState, useEffect } from 'react';
import { UnifiedIPFSNostrService } from '../../services/UnifiedIPFSNostrService';
import { IntelPackage, CyberTeam, CyberInvestigation } from '../../types/cyberInvestigation';

interface DashboardProps {
  teamId: string;
  userId: string;
}

interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: 'content-stored' | 'content-updated' | 'collaboration' | 'nostr-announcement';
  user: string;
  description: string;
  contentId?: string;
  ipfsHash?: string;
  source: 'ipfs' | 'nostr' | 'unified';
}

interface NetworkStatus {
  ipfs: {
    connected: boolean;
    peerCount: number;
    contentCount: number;
  };
  nostr: {
    connected: boolean;
    relayCount: number;
    eventsCount: number;
  };
  integration: {
    contentSynced: number;
    replicationHealth: number;
    lastSync: Date;
  };
}

export const IPFSNostrDashboard: React.FC<DashboardProps> = ({ teamId, userId }) => {
  const [unifiedService] = useState(() => UnifiedIPFSNostrService.getInstance());
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [teamContent, setTeamContent] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'activity' | 'content' | 'network' | 'search'>('activity');

  useEffect(() => {
    // Initialize dashboard
    loadInitialData();
    
    // Set up real-time event listeners
    const unsubscribers = [
      unifiedService.on('content-stored', handleContentStored),
      unifiedService.on('content-updated', handleContentUpdated),
      unifiedService.on('collaboration', handleCollaboration),
      unifiedService.on('content-retrieved', handleContentRetrieved)
    ];

    // Set up periodic updates
    const statusInterval = setInterval(updateNetworkStatus, 10000); // Every 10 seconds
    const contentInterval = setInterval(loadTeamContent, 30000); // Every 30 seconds

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(statusInterval);
      clearInterval(contentInterval);
    };
  }, [teamId, userId]);

  const loadInitialData = async () => {
    await updateNetworkStatus();
    await loadTeamContent();
    loadActivityFeed();
  };

  const updateNetworkStatus = async () => {
    try {
      const status = unifiedService.getSystemStatus();
      setNetworkStatus(status);
    } catch (error) {
      console.error('Failed to update network status:', error);
    }
  };

  const loadTeamContent = async () => {
    try {
      const content = unifiedService.getTeamContent(teamId, userId);
      setTeamContent(content);
    } catch (error) {
      console.error('Failed to load team content:', error);
    }
  };

  const loadActivityFeed = () => {
    // Mock activity feed - in real implementation would come from service
    const mockActivity: ActivityEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'content-stored',
        user: 'alice.mil',
        description: 'Uploaded new threat intelligence package',
        contentId: 'content-123',
        ipfsHash: 'QmX1234...',
        source: 'unified'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'nostr-announcement',
        user: 'bob.socom',
        description: 'Announced evidence update via Nostr',
        contentId: 'content-456',
        source: 'nostr'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'collaboration',
        user: 'charlie.sf',
        description: 'Joined investigation team workspace',
        source: 'unified'
      }
    ];
    
    setActivityFeed(mockActivity);
  };

  const handleContentStored = (event: any) => {
    const newActivity: ActivityEvent = {
      id: `activity-${Date.now()}`,
      timestamp: new Date(),
      type: 'content-stored',
      user: event.options.creator,
      description: `Stored ${event.content.type}: ${event.content.title}`,
      contentId: event.content.id,
      ipfsHash: event.content.ipfsHash,
      source: 'unified'
    };
    
    setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]);
    loadTeamContent();
  };

  const handleContentUpdated = (event: any) => {
    const newActivity: ActivityEvent = {
      id: `activity-${Date.now()}`,
      timestamp: new Date(),
      type: 'content-updated',
      user: event.user,
      description: `Updated content v${event.version}`,
      contentId: event.contentId,
      ipfsHash: event.newHash,
      source: 'unified'
    };
    
    setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]);
    loadTeamContent();
  };

  const handleCollaboration = (event: any) => {
    const newActivity: ActivityEvent = {
      id: `activity-${Date.now()}`,
      timestamp: new Date(),
      type: 'collaboration',
      user: event.userId,
      description: `Collaboration: ${event.type}`,
      contentId: event.contentId,
      source: 'nostr'
    };
    
    setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]);
  };

  const handleContentRetrieved = (event: any) => {
    console.log('Content retrieved:', event);
    // Update activity or stats as needed
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await unifiedService.searchContent(
        searchQuery,
        { teamId },
        userId
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStoreContent = async (contentData: IntelPackage | CyberTeam | CyberInvestigation) => {
    try {
      await unifiedService.storeContent(contentData, {
        teamId,
        creator: userId,
        classification: 'CONFIDENTIAL',
        tags: ['dashboard-upload'],
        announceToNostr: true,
        replicateToTeam: true
      });
    } catch (error) {
      console.error('Failed to store content:', error);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getStatusColor = (connected: boolean) => connected ? 'text-green-500' : 'text-red-500';
  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-500';
    if (health >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="ipfs-nostr-dashboard bg-gray-900 text-white p-6 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">IPFS-Nostr Integration Dashboard</h2>
        <p className="text-gray-400">Team: {teamId} | User: {userId}</p>
      </div>

      {/* Network Status Bar */}
      {networkStatus && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Network Status</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400">IPFS</div>
              <div className={`font-bold ${getStatusColor(networkStatus.ipfs.connected)}`}>
                {networkStatus.ipfs.connected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-xs text-gray-500">
                {networkStatus.ipfs.peerCount} peers | {networkStatus.ipfs.contentCount} content
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-400">Nostr</div>
              <div className={`font-bold ${getStatusColor(networkStatus.nostr.connected)}`}>
                {networkStatus.nostr.connected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-xs text-gray-500">
                {networkStatus.nostr.relayCount} relays | {networkStatus.nostr.eventsCount} events
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-400">Integration</div>
              <div className={`font-bold ${getHealthColor(networkStatus.integration.replicationHealth)}`}>
                {networkStatus.integration.replicationHealth.toFixed(0)}% Health
              </div>
              <div className="text-xs text-gray-500">
                {networkStatus.integration.contentSynced} synced
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-gray-700">
        {[
          { id: 'activity', label: 'Activity Feed' },
          { id: 'content', label: 'Team Content' },
          { id: 'network', label: 'Network' },
          { id: 'search', label: 'Search' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`pb-2 px-1 border-b-2 transition-colors ${ 
              selectedTab === tab.id 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Feed Tab */}
      {selectedTab === 'activity' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Real-time Activity</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityFeed.map(activity => (
              <div key={activity.id} className="bg-gray-800 p-3 rounded-lg flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.source === 'ipfs' ? 'bg-purple-500' :
                  activity.source === 'nostr' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-sm text-gray-400">by {activity.user}</div>
                    </div>
                    <div className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</div>
                  </div>
                  {activity.ipfsHash && (
                    <div className="text-xs text-purple-400 mt-1">
                      IPFS: {activity.ipfsHash.substring(0, 12)}...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Content Tab */}
      {selectedTab === 'content' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Team Content ({teamContent.length})</h3>
            <button 
              onClick={() => {
                // Mock content creation
                const mockContent: IntelPackage = {
                  id: `intel-${Date.now()}`,
                  name: 'Test Intelligence Package',
                  description: 'Created from dashboard',
                  type: 'THREAT_ANALYSIS',
                  createdBy: userId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  reportIds: [],
                  tags: ['test', 'dashboard'],
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  affectedSystems: [],
                  threatActors: [],
                  ioCs: [],
                  timeline: [],
                  collaborators: [userId],
                  sharedWith: [teamId]
                };
                handleStoreContent(mockContent);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              Add Test Content
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {teamContent.map(content => (
              <div key={content.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{content.title}</div>
                    <div className="text-sm text-gray-400">{content.type}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    v{content.version} | {formatTimestamp(content.updatedAt)}
                  </div>
                </div>
                
                <div className="text-sm text-gray-300 mb-2">{content.description}</div>
                
                <div className="flex justify-between items-center text-xs">
                  <div className="flex space-x-4">
                    <span className={`px-2 py-1 rounded ${
                      content.classification === 'PUBLIC' ? 'bg-green-700' :
                      content.classification === 'CONFIDENTIAL' ? 'bg-yellow-700' :
                      content.classification === 'SECRET' ? 'bg-orange-700' : 'bg-red-700'
                    }`}>
                      {content.classification}
                    </span>
                    <span className="text-gray-400">{content.size} bytes</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      content.replicationStatus.health === 'healthy' ? 'bg-green-500' :
                      content.replicationStatus.health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></span>
                    <span className={`w-2 h-2 rounded-full ${
                      content.nostrStatus.announced ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Tab */}
      {selectedTab === 'search' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Content Search</h3>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content across IPFS and Nostr..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchResults.map(result => (
              <div key={result.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="font-medium">{result.title}</div>
                <div className="text-sm text-gray-400 mb-2">{result.description}</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-400">IPFS: {result.ipfsHash.substring(0, 12)}...</span>
                  <span className="text-gray-500">{result.type} | {result.classification}</span>
                </div>
              </div>
            ))}
            
            {searchResults.length === 0 && searchQuery && !isSearching && (
              <div className="text-center text-gray-400 py-8">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IPFSNostrDashboard;
