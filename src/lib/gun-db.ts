import Gun from 'gun'
import 'gun/sea' // Security, Encryption, Authorization
import 'gun/axe' // Gun extensions

// Initialize Gun with public peers (free forever)
export const gun = Gun({
  peers: [
    'https://gun-manhattan.herokuapp.com/gun',
    'https://gun-us.herokuapp.com/gun', 
    'https://gun-euro.herokuapp.com/gun',
    'https://gunjs.herokuapp.com/gun',
    'https://www.raygun.live/gun'
  ],
  localStorage: true,
  radisk: true
})

// User authentication with Gun
export const user = gun.user().recall({ sessionStorage: true })

// Decentralized data structures
export interface DecentralizedMessage {
  id: string
  sender: {
    address: string
    username: string
  }
  content: string
  encrypted?: boolean
  timestamp: number
  type: 'dm' | 'team' | 'global'
  teamId?: string
  recipientAddress?: string
  attachments?: {
    name: string
    ipfsHash: string
    size: number
    type: string
  }[]
}

export interface DecentralizedIntelReport {
  id: string
  author: {
    address: string
    username: string
  }
  title: string
  content: string
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET'
  tags: string[]
  evidence: {
    ipfsHash: string
    description: string
  }[]
  location?: {
    lat: number
    lng: number
    name?: string
  }
  crossReferences: string[]
  timestamp: number
  signature: string // Cryptographic signature for authenticity
  reviews: {
    reviewerAddress: string
    rating: number
    comments: string
    timestamp: number
  }[]
}

// Team structure
export interface DecentralizedTeam {
  id: string
  name: string
  description: string
  members: {
    address: string
    username: string
    publicKey: string
    joinedAt: number
  }[]
  encryptionKey?: string // Shared team encryption key
  createdBy: string
  createdAt: number
}

// AI-NOTE: Gun.js provides decentralized, real-time data sync without servers
// Data is automatically replicated across all connected peers
// Works offline and syncs when reconnected
