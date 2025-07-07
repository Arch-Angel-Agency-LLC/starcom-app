import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ChatDemoPage.module.css';
import { 
  createChatProvider, 
  ChatProviderType, 
  getRecommendedChatProvider 
} from '../../lib/chat/ChatProviderFactory';
import { ChatMessage, ChatChannel, ChatUser } from '../../lib/chat/ChatInterface';
import { ChatErrorType } from '../../lib/chat/utils/ChatErrorHandling';

/**
 * ChatDemoPage Component
 * 
 * A standalone page to demonstrate the chat system functionality.
 * This page shows a side-by-side view of all three chat types:
 * - Global Chat
 * - Group Chat
 * - Direct Messages
 * 
 * Each chat type can be tested with different providers.
 */
const ChatDemoPage = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const logEndRef = useRef(null);
  
  // State for chat providers
  const [globalChatProvider, setGlobalChatProvider] = useState(null);
  const [groupChatProvider, setGroupChatProvider] = useState(null);
  const [dmChatProvider, setDmChatProvider] = useState(null);
  
  // State for messages
  const [globalMessages, setGlobalMessages] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [dmMessages, setDmMessages] = useState([]);
  
  // State for input
  const [globalInput, setGlobalInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [dmInput, setDmInput] = useState('');
  
  // State for user info
  const [userId, setUserId] = useState(`demo-user-${Date.now().toString(36)}`);
  const [userName, setUserName] = useState('Demo User');
  
  // State for demo configuration
  const [selectedProviders, setSelectedProviders] = useState({
    global: 'gun',
    group: 'nostr',
    dm: 'secure'
  });
  
  // State for logs
  const [logs, setLogs] = useState([]);
  
  // Add a log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    
    // Scroll logs to bottom
    setTimeout(() => {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Handle initial setup
  useEffect(() => {
    addLog('Chat demo initialized', 'system');
    addLog('Please connect to chat providers to begin testing', 'info');
    
    // Cleanup on unmount
    return () => {
      disconnectAll();
    };
  }, []);
  
  // Scroll messages to bottom when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages, groupMessages, dmMessages]);
  
  // Connect to a provider
  const connectProvider = async (type, providerType) => {
    try {
      addLog(`Connecting to ${providerType} provider for ${type} chat...`, 'info');
      
      const provider = await createChatProvider({
        type: providerType,
        options: {
          userId: `${userId}-${type}`,
          userName: `${userName} (${type})`,
          maxRetries: 3
        }
      });
      
      await provider.connect();
      
      // Store the provider in appropriate state
      if (type === 'global') {
        setGlobalChatProvider(provider);
      } else if (type === 'group') {
        setGroupChatProvider(provider);
      } else if (type === 'dm') {
        setDmChatProvider(provider);
      }
      
      addLog(`Connected to ${providerType} provider for ${type} chat`, 'success');
      
      // Join or create the appropriate channel
      await setupChannel(provider, type);
      
      return provider;
    } catch (error) {
      addLog(`Failed to connect to ${providerType} provider for ${type} chat: ${error.message}`, 'error');
      throw error;
    }
  };
  
  // Set up the appropriate channel
  const setupChannel = async (provider, type) => {
    try {
      const channelId = `${type}-chat-demo`;
      const channelName = type === 'global' ? 'Global Chat' : 
                          type === 'group' ? 'Group Chat Demo' : 
                          'Direct Message Demo';
      
      // Try to join first
      try {
        await provider.joinChannel(channelId);
        addLog(`Joined ${type} chat channel`, 'success');
      } catch (error) {
        // If joining fails, create the channel
        addLog(`${type} chat channel does not exist, creating...`, 'info');
        
        const participants = type === 'dm' ? [userId, 'demo-target-user'] : [];
        const channelType = type === 'global' ? 'global' : 
                            type === 'group' ? 'team' : 'direct';
                            
        await provider.createChannel(channelName, channelType, participants);
        await provider.joinChannel(channelId);
        addLog(`Created and joined ${type} chat channel`, 'success');
      }
      
      // Subscribe to messages
      provider.subscribeToMessages(channelId, (message) => {
        if (type === 'global') {
          setGlobalMessages(prev => [...prev, message]);
        } else if (type === 'group') {
          setGroupMessages(prev => [...prev, message]);
        } else if (type === 'dm') {
          setDmMessages(prev => [...prev, message]);
        }
      });
      
      // Get existing messages
      const messages = await provider.getMessages(channelId, 20);
      
      if (type === 'global') {
        setGlobalMessages(messages);
      } else if (type === 'group') {
        setGroupMessages(messages);
      } else if (type === 'dm') {
        setDmMessages(messages);
      }
      
      addLog(`Retrieved ${messages.length} existing messages for ${type} chat`, 'success');
    } catch (error) {
      addLog(`Error setting up ${type} chat channel: ${error.message}`, 'error');
      throw error;
    }
  };
  
  // Send a message
  const sendMessage = async (type, content) => {
    try {
      if (!content.trim()) {
        addLog('Cannot send empty message', 'warning');
        return;
      }
      
      const provider = type === 'global' ? globalChatProvider :
                      type === 'group' ? groupChatProvider :
                      dmChatProvider;
                      
      if (!provider) {
        addLog(`Not connected to ${type} chat provider`, 'warning');
        return;
      }
      
      const channelId = `${type}-chat-demo`;
      
      addLog(`Sending message to ${type} chat...`, 'info');
      const message = await provider.sendMessage(channelId, content);
      
      addLog(`Message sent to ${type} chat: ${message.id}`, 'success');
      
      // Clear input
      if (type === 'global') {
        setGlobalInput('');
      } else if (type === 'group') {
        setGroupInput('');
      } else if (type === 'dm') {
        setDmInput('');
      }
    } catch (error) {
      addLog(`Failed to send message to ${type} chat: ${error.message}`, 'error');
    }
  };
  
  // Disconnect from all providers
  const disconnectAll = async () => {
    try {
      addLog('Disconnecting from all providers...', 'info');
      
      if (globalChatProvider) await globalChatProvider.disconnect();
      if (groupChatProvider) await groupChatProvider.disconnect();
      if (dmChatProvider) await dmChatProvider.disconnect();
      
      setGlobalChatProvider(null);
      setGroupChatProvider(null);
      setDmChatProvider(null);
      
      addLog('Disconnected from all providers', 'success');
    } catch (error) {
      addLog(`Error disconnecting: ${error.message}`, 'error');
    }
  };
  
  // Connect to all providers
  const connectAll = async () => {
    try {
      addLog('Connecting to all providers...', 'info');
      
      await connectProvider('global', selectedProviders.global);
      await connectProvider('group', selectedProviders.group);
      await connectProvider('dm', selectedProviders.dm);
      
      addLog('Connected to all providers', 'success');
    } catch (error) {
      addLog(`Error connecting to all providers: ${error.message}`, 'error');
    }
  };
  
  // Run a full demo
  const runFullDemo = async () => {
    try {
      addLog('Starting full demo...', 'system');
      
      // 1. Connect to all providers
      await connectAll();
      
      // 2. Send a message to each chat
      await sendMessage('global', `Global chat test message at ${new Date().toISOString()}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await sendMessage('group', `Group chat test message at ${new Date().toISOString()}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await sendMessage('dm', `DM test message at ${new Date().toISOString()}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Test error handling
      addLog('Testing error handling...', 'info');
      try {
        await globalChatProvider.sendMessage('', 'This should fail');
      } catch (error) {
        addLog(`Expected error handled correctly: ${error.message}`, 'success');
      }
      
      addLog('Full demo completed successfully', 'success');
    } catch (error) {
      addLog(`Full demo failed: ${error.message}`, 'error');
    }
  };
  
  // Get connection status
  const getConnectionStatus = (provider) => {
    if (!provider) return 'Disconnected';
    return provider.isConnected() ? 'Connected' : 'Disconnected';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Starcom Chat System Demo</h1>
        <p>Test all three chat types with different providers</p>
        
        <div className={styles.controls}>
          <div className={styles.userInfo}>
            <input 
              type="text" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              disabled={globalChatProvider || groupChatProvider || dmChatProvider}
            />
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              placeholder="User Name"
              disabled={globalChatProvider || groupChatProvider || dmChatProvider}
            />
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.connectAllBtn}
              onClick={connectAll}
              disabled={globalChatProvider && groupChatProvider && dmChatProvider}
            >
              Connect All
            </button>
            <button 
              className={styles.disconnectAllBtn}
              onClick={disconnectAll}
              disabled={!globalChatProvider && !groupChatProvider && !dmChatProvider}
            >
              Disconnect All
            </button>
            <button 
              className={styles.demoBtn}
              onClick={runFullDemo}
              disabled={globalChatProvider || groupChatProvider || dmChatProvider}
            >
              Run Full Demo
            </button>
          </div>
        </div>
      </header>
      
      <main className={styles.chatGrid}>
        {/* Global Chat */}
        <section className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <h2>Global Chat</h2>
            <div className={styles.providerSelector}>
              <select 
                value={selectedProviders.global}
                onChange={(e) => setSelectedProviders({...selectedProviders, global: e.target.value})}
                disabled={globalChatProvider}
              >
                <option value="gun">Gun.js</option>
                <option value="nostr">Nostr</option>
                <option value="secure">Secure</option>
              </select>
              
              <div className={`${styles.connectionStatus} ${globalChatProvider?.isConnected() ? styles.connected : styles.disconnected}`}>
                {getConnectionStatus(globalChatProvider)}
              </div>
            </div>
            
            <button 
              className={globalChatProvider ? styles.disconnectBtn : styles.connectBtn}
              onClick={() => globalChatProvider 
                ? (async () => {
                    await globalChatProvider.disconnect();
                    setGlobalChatProvider(null);
                    addLog('Disconnected from global chat provider', 'success');
                  })()
                : connectProvider('global', selectedProviders.global)
              }
            >
              {globalChatProvider ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          
          <div className={styles.chatMessages}>
            {globalMessages.length > 0 ? (
              globalMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`${styles.message} ${msg.senderId === userId ? styles.outgoing : styles.incoming}`}
                >
                  <div className={styles.messageHeader}>
                    <span className={styles.senderName}>{msg.senderName}</span>
                    <span className={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.messageContent}>{msg.content}</div>
                </div>
              ))
            ) : (
              <div className={styles.emptyMessages}>
                {globalChatProvider 
                  ? "No messages yet" 
                  : "Connect to see messages"}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className={styles.chatInput}>
            <input 
              type="text" 
              value={globalInput}
              onChange={(e) => setGlobalInput(e.target.value)}
              placeholder="Type a message..."
              disabled={!globalChatProvider?.isConnected()}
              onKeyPress={(e) => {
                if (e.key === 'Enter') sendMessage('global', globalInput);
              }}
            />
            <button 
              onClick={() => sendMessage('global', globalInput)}
              disabled={!globalChatProvider?.isConnected()}
            >
              Send
            </button>
          </div>
        </section>
        
        {/* Group Chat */}
        <section className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <h2>Group Chat</h2>
            <div className={styles.providerSelector}>
              <select 
                value={selectedProviders.group}
                onChange={(e) => setSelectedProviders({...selectedProviders, group: e.target.value})}
                disabled={groupChatProvider}
              >
                <option value="gun">Gun.js</option>
                <option value="nostr">Nostr</option>
                <option value="secure">Secure</option>
              </select>
              
              <div className={`${styles.connectionStatus} ${groupChatProvider?.isConnected() ? styles.connected : styles.disconnected}`}>
                {getConnectionStatus(groupChatProvider)}
              </div>
            </div>
            
            <button 
              className={groupChatProvider ? styles.disconnectBtn : styles.connectBtn}
              onClick={() => groupChatProvider 
                ? (async () => {
                    await groupChatProvider.disconnect();
                    setGroupChatProvider(null);
                    addLog('Disconnected from group chat provider', 'success');
                  })()
                : connectProvider('group', selectedProviders.group)
              }
            >
              {groupChatProvider ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          
          <div className={styles.chatMessages}>
            {groupMessages.length > 0 ? (
              groupMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`${styles.message} ${msg.senderId === userId ? styles.outgoing : styles.incoming}`}
                >
                  <div className={styles.messageHeader}>
                    <span className={styles.senderName}>{msg.senderName}</span>
                    <span className={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.messageContent}>{msg.content}</div>
                </div>
              ))
            ) : (
              <div className={styles.emptyMessages}>
                {groupChatProvider 
                  ? "No messages yet" 
                  : "Connect to see messages"}
              </div>
            )}
          </div>
          
          <div className={styles.chatInput}>
            <input 
              type="text" 
              value={groupInput}
              onChange={(e) => setGroupInput(e.target.value)}
              placeholder="Type a message..."
              disabled={!groupChatProvider?.isConnected()}
              onKeyPress={(e) => {
                if (e.key === 'Enter') sendMessage('group', groupInput);
              }}
            />
            <button 
              onClick={() => sendMessage('group', groupInput)}
              disabled={!groupChatProvider?.isConnected()}
            >
              Send
            </button>
          </div>
        </section>
        
        {/* DM Chat */}
        <section className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <h2>Direct Messages</h2>
            <div className={styles.providerSelector}>
              <select 
                value={selectedProviders.dm}
                onChange={(e) => setSelectedProviders({...selectedProviders, dm: e.target.value})}
                disabled={dmChatProvider}
              >
                <option value="gun">Gun.js</option>
                <option value="nostr">Nostr</option>
                <option value="secure">Secure</option>
              </select>
              
              <div className={`${styles.connectionStatus} ${dmChatProvider?.isConnected() ? styles.connected : styles.disconnected}`}>
                {getConnectionStatus(dmChatProvider)}
              </div>
            </div>
            
            <button 
              className={dmChatProvider ? styles.disconnectBtn : styles.connectBtn}
              onClick={() => dmChatProvider 
                ? (async () => {
                    await dmChatProvider.disconnect();
                    setDmChatProvider(null);
                    addLog('Disconnected from DM chat provider', 'success');
                  })()
                : connectProvider('dm', selectedProviders.dm)
              }
            >
              {dmChatProvider ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          
          <div className={styles.chatMessages}>
            {dmMessages.length > 0 ? (
              dmMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`${styles.message} ${msg.senderId === userId ? styles.outgoing : styles.incoming}`}
                >
                  <div className={styles.messageHeader}>
                    <span className={styles.senderName}>{msg.senderName}</span>
                    <span className={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.messageContent}>{msg.content}</div>
                </div>
              ))
            ) : (
              <div className={styles.emptyMessages}>
                {dmChatProvider 
                  ? "No messages yet" 
                  : "Connect to see messages"}
              </div>
            )}
          </div>
          
          <div className={styles.chatInput}>
            <input 
              type="text" 
              value={dmInput}
              onChange={(e) => setDmInput(e.target.value)}
              placeholder="Type a message..."
              disabled={!dmChatProvider?.isConnected()}
              onKeyPress={(e) => {
                if (e.key === 'Enter') sendMessage('dm', dmInput);
              }}
            />
            <button 
              onClick={() => sendMessage('dm', dmInput)}
              disabled={!dmChatProvider?.isConnected()}
            >
              Send
            </button>
          </div>
        </section>
      </main>
      
      <aside className={styles.logPanel}>
        <h3>System Logs</h3>
        <div className={styles.logs}>
          {logs.map((log, index) => (
            <div key={index} className={`${styles.logEntry} ${styles[log.type]}`}>
              <span className={styles.logTimestamp}>{log.timestamp}</span>
              <span className={styles.logMessage}>{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
        <button 
          className={styles.clearLogsBtn}
          onClick={() => setLogs([])}
        >
          Clear Logs
        </button>
      </aside>
      
      <footer className={styles.footer}>
        <button onClick={() => navigate('/')}>Back to Home</button>
        <span>Starcom Chat System Demo • {new Date().toLocaleDateString()}</span>
      </footer>
    </div>
  );
};

export default ChatDemoPage;
