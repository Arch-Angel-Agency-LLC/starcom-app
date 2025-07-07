import { useState, useEffect, useCallback, useRef } from 'react'
import { gun, DecentralizedMessage } from '../lib/gun-db'
import { uploadToIPFS } from '../lib/ipfs-client'
import { P2PConnection } from '../lib/webrtc-signaling'
import { useWallet } from '@solana/wallet-adapter-react'

interface UseDecentralizedChatOptions {
  channelType: 'dm' | 'team' | 'global'
  recipientAddress?: string
  teamId?: string
}

export function useDecentralizedChat({
  channelType,
  recipientAddress,
  teamId
}: UseDecentralizedChatOptions) {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toString()
  
  const [messages, setMessages] = useState<DecentralizedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const p2pConnections = useRef<Map<string, P2PConnection>>(new Map())

  // Generate channel ID based on type
  const getChannelId = useCallback(() => {
    if (channelType === 'global') return 'global-chat'
    if (channelType === 'team' && teamId) return `team-${teamId}`
    if (channelType === 'dm' && recipientAddress && walletAddress) {
      // Create deterministic channel ID for DMs
      const addresses = [walletAddress, recipientAddress].sort()
      return `dm-${addresses[0]}-${addresses[1]}`
    }
    return null
  }, [channelType, teamId, recipientAddress, walletAddress])

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    attachments?: File[]
  ) => {
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }

    try {
      setError(null)
      
      // Upload attachments to IPFS
      const ipfsAttachments = []
      if (attachments) {
        for (const file of attachments) {
          const ipfsHash = await uploadToIPFS(file)
          ipfsAttachments.push({
            name: file.name,
            ipfsHash,
            size: file.size,
            type: file.type
          })
        }
      }

      // Create message
      const message: DecentralizedMessage = {
        id: `${Date.now()}-${Math.random()}`,
        sender: {
          address: walletAddress,
          username: walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
        },
        content,
        timestamp: Date.now(),
        type: channelType,
        teamId,
        recipientAddress,
        attachments: ipfsAttachments
      }

      const channelId = getChannelId()
      if (!channelId) {
        setError('Invalid channel configuration')
        return
      }

      // Store in Gun.js
      gun.get('starcom-messages')
        .get(channelId)
        .set(message)

      // Send via P2P if connection exists
      if (channelType === 'dm' && recipientAddress) {
        const p2p = p2pConnections.current.get(recipientAddress)
        if (p2p && p2p.getConnectionState() === 'connected') {
          p2p.send({ type: 'message', data: message })
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
      throw error
    }
  }, [walletAddress, channelType, teamId, recipientAddress, getChannelId])

  // Load messages
  useEffect(() => {
    if (!walletAddress) return

    const channelId = getChannelId()
    if (!channelId) return

    setLoading(true)
    setError(null)
    
    const messageMap = new Map<string, DecentralizedMessage>()

    // Subscribe to messages
    const gunRef = gun.get('starcom-messages').get(channelId)
    
    gunRef.map().on((data: unknown) => {
      if (data && typeof data === 'object' && 'id' in data) {
        const message = data as DecentralizedMessage
        if (message.id && message.sender && message.content && message.timestamp) {
          messageMap.set(message.id, message)
          setMessages(Array.from(messageMap.values()).sort((a, b) => a.timestamp - b.timestamp))
        }
      }
    })

    // Set up presence heartbeat
    const presenceInterval = setInterval(() => {
      gun.get('starcom-presence')
        .get(channelId)
        .get(walletAddress)
        .put({
          address: walletAddress,
          timestamp: Date.now(),
          channel: channelId
        })
    }, 5000) // Heartbeat every 5 seconds

    // Monitor online users
    const presenceRef = gun.get('starcom-presence').get(channelId)
    presenceRef.map().on((data: unknown) => {
      if (data && typeof data === 'object' && 'address' in data && 'timestamp' in data) {
        const presence = data as { address: string; timestamp: number }
        if (presence.timestamp > Date.now() - 15000) { // Consider online if heartbeat within 15s
          setOnlineUsers(prev => new Set(prev).add(presence.address))
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(presence.address)
            return newSet
          })
        }
      }
    })

    setLoading(false)

    return () => {
      clearInterval(presenceInterval)
      // Gun.js automatically handles cleanup for subscriptions
    }
  }, [walletAddress, getChannelId])

  // Set up P2P connections for DMs
  useEffect(() => {
    if (channelType !== 'dm' || !recipientAddress || !walletAddress) return

    const p2p = new P2PConnection(walletAddress, recipientAddress)
    const connections = p2pConnections.current
    connections.set(recipientAddress, p2p)

    p2p.onMessage((data) => {
      if (data && typeof data === 'object' && 'type' in data && 'data' in data) {
        const messageData = data as { type: string; data: DecentralizedMessage }
        if (messageData.type === 'message') {
          setMessages(prev => {
            const existing = prev.find(m => m.id === messageData.data.id)
            if (!existing) {
              return [...prev, messageData.data].sort((a, b) => a.timestamp - b.timestamp)
            }
            return prev
          })
        }
      }
    })

    p2p.onConnection(() => {
      console.log(`P2P connection established with ${recipientAddress}`)
    })

    // Try to establish connection
    p2p.initiate().catch(() => {
      // If initiate fails, try responding
      p2p.respond().catch(err => {
        console.warn('Failed to establish P2P connection:', err)
      })
    })

    return () => {
      p2p.close()
      connections.delete(recipientAddress)
    }
  }, [channelType, recipientAddress, walletAddress])

  return {
    messages,
    loading,
    error,
    sendMessage,
    onlineUsers
  }
}

// AI-NOTE: This hook provides decentralized chat functionality
// - Gun.js for persistent message storage and real-time sync
// - WebRTC for direct P2P connections in DMs
// - IPFS for file attachments
// - Presence system for online status
