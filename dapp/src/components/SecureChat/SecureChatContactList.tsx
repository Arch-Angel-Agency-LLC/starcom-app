import React, { useState, useMemo } from 'react';
import { useSecureChat } from '../../communication/context/useSecureChat';
import { EarthAllianceContact, ThreatLevel } from '../../types/SecureChat';
import styles from './SecureChatContactList.module.css';

interface SecureChatContactListProps {
  isVisible: boolean;
  onClose: () => void;
  onContactSelect: (contact: EarthAllianceContact) => void;
}

const SecureChatContactList: React.FC<SecureChatContactListProps> = ({
  isVisible,
  onClose,
  onContactSelect
}) => {
  const { state } = useSecureChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'trust' | 'activity'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'online' | 'verified'>('all');

  // Convert Map to Array for filtering and sorting
  const contacts = useMemo(() => {
    return Array.from(state.verifiedContacts.values());
  }, [state.verifiedContacts]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.verifiedIdentity.earthAllianceId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (filterBy) {
      case 'online':
        filtered = filtered.filter(contact => contact.isOnline);
        break;
      case 'verified':
        filtered = filtered.filter(contact => contact.isEarthAllianceVerified);
        break;
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'trust':
          return b.trustScore - a.trustScore;
        case 'activity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        case 'name':
        default:
          return a.displayName.localeCompare(b.displayName);
      }
    });

    return filtered;
  }, [contacts, searchTerm, sortBy, filterBy]);

  const getTrustColor = (trustScore: number) => {
    if (trustScore >= 0.8) return '#4ade80'; // green
    if (trustScore >= 0.6) return '#facc15'; // yellow
    if (trustScore >= 0.4) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getThreatLevelColor = (level: ThreatLevel) => {
    switch (level) {
      case 'normal': return '#4ade80';
      case 'elevated': return '#facc15';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!isVisible) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.contactList} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            <h2>Earth Alliance Contacts</h2>
            <div className={styles.networkStatus}>
              <span 
                className={styles.threatIndicator}
                style={{ color: getThreatLevelColor(state.globalThreatLevel) }}
              >
                🛡️ {state.globalThreatLevel.toUpperCase()}
              </span>
              <span className={styles.contactCount}>
                {filteredContacts.length} of {contacts.length} contacts
              </span>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Search and Filters */}
        <div className={styles.controls}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filters}>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'online' | 'verified')}
              className={styles.filterSelect}
            >
              <option value="all">All Contacts</option>
              <option value="online">Online Only</option>
              <option value="verified">Verified Only</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'trust' | 'activity')}
              className={styles.sortSelect}
            >
              <option value="name">Sort by Name</option>
              <option value="trust">Sort by Trust</option>
              <option value="activity">Sort by Activity</option>
            </select>
          </div>
        </div>

        {/* Emergency Mode Notice */}
        {state.emergencyMode && (
          <div className={styles.emergencyNotice}>
            🚨 EMERGENCY MODE - Contact communications restricted
          </div>
        )}

        {/* Contacts */}
        <div className={styles.contactsContainer}>
          {filteredContacts.length === 0 ? (
            <div className={styles.emptyState}>
              {searchTerm ? 'No contacts match your search' : 'No contacts available'}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.pubkey}
                className={`${styles.contactItem} ${contact.isOnline ? styles.online : styles.offline}`}
                onClick={() => onContactSelect(contact)}
              >
                <div className={styles.avatar}>
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.displayName} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {contact.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`${styles.onlineIndicator} ${contact.isOnline ? styles.indicatorOnline : styles.indicatorOffline}`} />
                </div>

                <div className={styles.contactInfo}>
                  <div className={styles.contactHeader}>
                    <span className={styles.contactName}>{contact.displayName}</span>
                    <div className={styles.badges}>
                      {contact.isEarthAllianceVerified && (
                        <span className={styles.verifiedBadge} title="Earth Alliance Verified">
                          ✓
                        </span>
                      )}
                      <span className={styles.clearanceBadge} title={`Security Clearance: ${contact.securityClearance}`}>
                        {contact.securityClearance.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.contactDetails}>
                    <span className={styles.earthAllianceId}>
                      ID: {contact.verifiedIdentity.earthAllianceId}
                    </span>
                    <span className={styles.lastSeen}>
                      {contact.isOnline ? 'Online' : `Last seen ${getTimeSince(contact.lastSeen)}`}
                    </span>
                  </div>

                  <div className={styles.securityMetrics}>
                    <div className={styles.trustScore}>
                      <span className={styles.trustLabel}>Trust:</span>
                      <span 
                        className={styles.trustValue}
                        style={{ color: getTrustColor(contact.trustScore) }}
                      >
                        {Math.round(contact.trustScore * 100)}%
                      </span>
                    </div>
                    
                    <div className={styles.pqcInfo}>
                      <span className={styles.pqcLabel}>PQC:</span>
                      <span className={styles.pqcValue}>
                        {contact.pqcPublicKey.securityLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.contactActions}>
                  <button 
                    className={styles.chatButton}
                    title="Start Secure Chat"
                    disabled={state.emergencyMode}
                  >
                    💬
                  </button>
                  <button 
                    className={styles.callButton}
                    title="Voice Call"
                    disabled={state.emergencyMode || !contact.isOnline}
                  >
                    📞
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Network Status Footer */}
        <div className={styles.footer}>
          <div className={styles.networkInfo}>
            <span className={styles.relayInfo}>
              📡 {state.networkStatus.relayNodes} relays
            </span>
            <span className={styles.ipfsInfo}>
              🌐 {state.networkStatus.ipfsNodes} IPFS peers
            </span>
            <span className={styles.connectionStatus}>
              {state.networkStatus.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureChatContactList;
