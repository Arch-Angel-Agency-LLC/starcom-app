import React, { useState, useRef, useEffect } from 'react'
import { DecentralizedMessage } from '../../lib/gun-db'
import { getIPFSGatewayUrl } from '../../lib/ipfs-client'
import { useWallet } from '@solana/wallet-adapter-react'
import styles from './DecentralizedChatWindow.module.css'

interface DecentralizedChatWindowProps {
  messages: DecentralizedMessage[]
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
  onlineUsers: Set<string>
  loading: boolean
  error: string | null
}

export default function DecentralizedChatWindow({
  messages,
  onSendMessage,
  onlineUsers,
  loading,
  error
}: DecentralizedChatWindowProps) {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toString()
  
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return

    setSending(true)
    try {
      await onSendMessage(message, attachments)
      setMessage('')
      setAttachments([])
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files].slice(0, 5)) // Limit to 5 files
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Connecting to decentralized network...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <div className={styles.messages}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <h3>No messages yet</h3>
              <p>Start the conversation! Messages are stored decentralized via Gun.js</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender.address === walletAddress
              const isOnline = onlineUsers.has(msg.sender.address)

              return (
                <div
                  key={msg.id}
                  className={`${styles.message} ${isOwn ? styles.messageOwn : styles.messageOther}`}
                >
                  <div className={styles.messageContent}>
                    {!isOwn && (
                      <div className={styles.messageSender}>
                        <span className={styles.senderName}>
                          {msg.sender.username}
                        </span>
                        {isOnline && (
                          <div className={styles.onlineIndicator} />
                        )}
                      </div>
                    )}
                    
                    <div className={styles.messageBody}>
                      <p className={styles.messageText}>{msg.content}</p>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={styles.attachments}>
                          {msg.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={getIPFSGatewayUrl(att.ipfsHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.attachment}
                            >
                              <span className={styles.attachmentIcon}>📎</span>
                              <span className={styles.attachmentName}>{att.name}</span>
                              <span className={styles.attachmentSize}>
                                ({(att.size / 1024).toFixed(1)}KB)
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        {attachments.length > 0 && (
          <div className={styles.attachmentPreview}>
            {attachments.map((file, idx) => (
              <div key={idx} className={styles.attachmentItem}>
                <span className={styles.attachmentIcon}>📎</span>
                <span className={styles.attachmentName}>{file.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className={styles.removeAttachment}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputControls}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className={styles.fileInput}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={styles.attachButton}
            title="Attach files (stored on IPFS)"
            disabled={sending}
          >
            📎
          </button>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className={styles.messageInput}
            rows={1}
            disabled={sending}
          />
          
          <button
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || sending}
            className={styles.sendButton}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}

// AI-NOTE: This component provides the decentralized chat interface
// - Messages stored in Gun.js for real-time sync
// - File attachments uploaded to IPFS
// - Online presence indicators
// - Auto-scroll and responsive design
