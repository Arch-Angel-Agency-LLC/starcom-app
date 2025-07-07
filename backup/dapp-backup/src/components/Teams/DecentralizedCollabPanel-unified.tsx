import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useDecentralizedIntel } from '../../hooks/useDecentralizedIntel'
import { useChat } from '../../context/ChatContext'
import ChatWindow from '../Chat/ChatWindow'
import DecentralizedIntelList from './DecentralizedIntelList'
import DecentralizedIntelForm from './DecentralizedIntelForm'
import styles from './DecentralizedCollabPanel.module.css'

interface DecentralizedCollabPanelProps {
  teamId?: string
  className?: string
}

export default function DecentralizedCollabPanel({ 
  teamId, 
  className 
}: DecentralizedCollabPanelProps) {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toString()
  
  const [activeTab, setActiveTab] = useState<'chat' | 'intel'>('chat')
  const [chatMode, setChatMode] = useState<'team' | 'global'>('team')
  const [showIntelForm, setShowIntelForm] = useState(false)

  // Use the unified chat context instead of legacy useDecentralizedChat
  const chat = useChat()
  
  // Handle the channel setup based on mode and teamId
  useEffect(() => {
    if (!chat.isConnected) {
      // Connect to chat with appropriate provider
      chat.connect({
        type: 'gun', // Could be dynamically determined based on needs
        options: {
          userId: walletAddress || 'anonymous-user',
          userName: walletAddress ? walletAddress.slice(0, 6) : 'Anonymous'
        }
      });
    }
    
    // Set the current channel based on chat mode and teamId
    const channelId = chatMode === 'team' && teamId 
      ? `team-${teamId}` 
      : 'global';
    
    chat.setCurrentChannel(channelId);
  }, [chat, chatMode, teamId, walletAddress]);

  const intel = useDecentralizedIntel(teamId)

  if (!walletAddress) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.connectPrompt}>
          <div className={styles.connectIcon}>🔗</div>
          <h3>Connect Wallet for Decentralized Collaboration</h3>
          <p>
            Connect your wallet to access the decentralized team collaboration system.
            No servers, no tracking, fully peer-to-peer.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>💬</span>
              <span>P2P Chat (Unified Chat API)</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📊</span>
              <span>Intel Reports (IPFS + Signatures)</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentChannelId = chat.currentChannel || '';
  const messages = chat.messages[currentChannelId] || [];
  const users = chat.users[currentChannelId] || [];

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h2>
          {teamId ? 'Team Collaboration' : 'Global Collaboration'}
        </h2>
        <p className={styles.description}>
          Powered by Unified Chat API (Gun.js, Nostr, and SecureChat)
        </p>

        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('chat')}
            className={`${styles.tab} ${activeTab === 'chat' ? styles.tabActive : ''}`}
          >
            P2P Chat
          </button>
          <button
            onClick={() => setActiveTab('intel')}
            className={`${styles.tab} ${activeTab === 'intel' ? styles.tabActive : ''}`}
          >
            Intel Reports
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'chat' ? (
          <div className={styles.chatContainer}>
            {/* Chat Mode Selector */}
            <div className={styles.chatHeader}>
              <div className={styles.chatModeSelector}>
                <button
                  className={`${styles.modeButton} ${chatMode === 'team' ? styles.modeActive : ''}`}
                  onClick={() => setChatMode('team')}
                  disabled={!teamId}
                >
                  Team Chat
                </button>
                <button
                  className={`${styles.modeButton} ${chatMode === 'global' ? styles.modeActive : ''}`}
                  onClick={() => setChatMode('global')}
                >
                  Global Chat
                </button>
              </div>
              <div className={styles.onlineCount}>
                {users.length} online
              </div>
            </div>

            {/* Chat Window - Using our new unified ChatWindow component */}
            <ChatWindow 
              showHeader={false}
              showChannelSelector={false}
              maxHeight="calc(100vh - 220px)"
              className={styles.chatWindow}
            />
          </div>
        ) : (
          <div className={styles.intelContainer}>
            <div className={styles.intelHeader}>
              <h3>Decentralized Intelligence Reports</h3>
              <button
                className={styles.addIntelButton}
                onClick={() => setShowIntelForm(!showIntelForm)}
              >
                {showIntelForm ? 'Cancel' : 'New Report'}
              </button>
            </div>

            {showIntelForm && (
              <DecentralizedIntelForm
                teamId={teamId}
                onSubmit={(report) => {
                  intel.createReport(report)
                  setShowIntelForm(false)
                }}
                onCancel={() => setShowIntelForm(false)}
              />
            )}

            <DecentralizedIntelList
              reports={intel.reports}
              loading={intel.loading}
              error={intel.error}
              onSelect={intel.viewReport}
            />

            {intel.selectedReport && (
              <div className={styles.reportViewer}>
                <button
                  className={styles.closeButton}
                  onClick={() => intel.viewReport(null)}
                >
                  Close
                </button>
                <h3>{intel.selectedReport.title}</h3>
                <div className={styles.reportMeta}>
                  <span>By: {intel.selectedReport.creator.username}</span>
                  <span>
                    {new Date(intel.selectedReport.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className={styles.reportContent}>
                  {intel.selectedReport.content}
                </div>
                {intel.selectedReport.attachments?.length > 0 && (
                  <div className={styles.attachments}>
                    <h4>Attachments</h4>
                    <div className={styles.attachmentList}>
                      {intel.selectedReport.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.attachment}
                        >
                          {attachment.name || `Attachment ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
