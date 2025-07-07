/**
 * Public Infrastructure Configuration for Starcom dApp
 * 
 * This configuration enables the dApp to work without local RelayNode
 * by connecting to public Nostr relays and IPFS gateways.
 * 
 * DEPLOYMENT MODELS:
 * 1. Pure Web: Use only public infrastructure (zero cost)
 * 2. Hybrid: Auto-detect local RelayNode, fallback to public
 * 3. Enterprise: Private infrastructure only (maximum security)
 */

// PUBLIC NOSTR RELAYS - High-availability, reliable public relays
export const PUBLIC_NOSTR_RELAYS = [
  // Primary relays (high reliability)
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  
  // Secondary relays (geographic distribution)
  'wss://relay.current.fyi',
  'wss://brb.io',
  'wss://relay.nostr.band',
  'wss://nostr.wine',
  'wss://relay.getalby.com',
  
  // Specialized relays for security/intel use
  'wss://nostr.rocks',
  'wss://relay.orangepill.dev',
  'wss://relay.nostrich.de'
];

// PUBLIC IPFS GATEWAYS - Multiple gateways for content retrieval
export const PUBLIC_IPFS_GATEWAYS = [
  // Primary gateways (high performance)
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  
  // Secondary gateways (redundancy)
  'https://dweb.link/ipfs/',
  'https://ipfs.infura.io/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  
  // Specialized gateways
  'https://4everland.io/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://w3s.link/ipfs/'
];

// IPFS UPLOAD SERVICES - For storing content on IPFS
export const IPFS_UPLOAD_SERVICES = [
  {
    name: 'Pinata',
    endpoint: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
    apiKeyRequired: true,
    free: true,
    limits: '1GB free'
  },
  {
    name: 'Web3.Storage',
    endpoint: 'https://api.web3.storage/upload',
    apiKeyRequired: true,
    free: true,
    limits: 'Unlimited free'
  },
  {
    name: 'NFT.Storage',
    endpoint: 'https://api.nft.storage/upload',
    apiKeyRequired: true,
    free: true,
    limits: '32GB per file, unlimited'
  },
  {
    name: 'Infura IPFS',
    endpoint: 'https://ipfs.infura.io:5001/api/v0/add',
    apiKeyRequired: true,
    free: false,
    limits: 'Pay per use'
  }
];

// INFRASTRUCTURE DETECTION CONFIGURATION
export const INFRASTRUCTURE_CONFIG = {
  // RelayNode detection
  LOCAL_RELAYNODE_ENDPOINTS: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://192.168.1.100:8080', // Common LAN IP
    'http://10.0.0.100:8080'     // Common LAN IP
  ],
  
  // Detection timeouts
  DETECTION_TIMEOUT: 3000, // 3 seconds
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  
  // Fallback strategy
  FALLBACK_STRATEGY: 'hybrid', // 'local-only' | 'public-only' | 'hybrid'
  
  // Team collaboration settings
  TEAM_SYNC_INTERVAL: 60000, // 1 minute
  CONTENT_REPLICATION_TIMEOUT: 10000, // 10 seconds
  
  // Public infrastructure limits
  MAX_CONTENT_SIZE_PUBLIC: 5 * 1024 * 1024, // 5MB for public gateways
  MAX_DAILY_UPLOADS: 100, // Rate limiting for public services
  
  // Reliability thresholds
  MIN_RELAY_CONNECTIONS: 2,
  MIN_GATEWAY_AVAILABILITY: 1,
  
  // Security settings for public infrastructure
  ENCRYPT_FOR_PUBLIC: true,
  REQUIRE_TEAM_SIGNATURES: true,
  PUBLIC_CONTENT_CLASSIFICATION_LIMIT: 'CONFIDENTIAL' // Max classification for public infra
};

// TEAM COLLABORATION CONFIGURATION
export const TEAM_CONFIG = {
  // Team discovery methods
  DISCOVERY_METHODS: [
    'invite-link',    // Team leader creates invite link
    'qr-code',        // QR code for easy mobile joining
    'team-id',        // Manual team ID entry
    'nostr-event'     // Discover via Nostr announcements
  ],
  
  // Communication channels
  COMMUNICATION_CHANNELS: [
    'nostr-dm',       // Direct messages via Nostr
    'team-channel',   // Dedicated team channel
    'investigation-thread' // Per-investigation discussions
  ],
  
  // Collaboration modes
  COLLABORATION_MODES: {
    'OPEN': {
      description: 'Anyone can join with invite link',
      security: 'basic',
      suitable_for: 'Public threat intelligence sharing'
    },
    'INVITE_ONLY': {
      description: 'Manual approval required',
      security: 'medium',
      suitable_for: 'Trusted team investigations'
    },
    'ENTERPRISE': {
      description: 'Requires RelayNode and DID verification',
      security: 'maximum',
      suitable_for: 'Classified investigations'
    }
  },
  
  // Default team settings
  DEFAULT_TEAM_SETTINGS: {
    autoShareFindings: true,
    allowExternalCollaboration: false,
    requireApprovalForMembers: true,
    contentRetentionDays: 90,
    maxTeamSize: 20
  }
};

// DEPLOYMENT SCENARIOS
export const DEPLOYMENT_SCENARIOS = {
  // Scenario 1: Pure serverless (no infrastructure costs)
  SERVERLESS: {
    name: 'Serverless Deployment',
    infrastructure: 'public-only',
    cost: '$0/month',
    setup_time: '5 minutes',
    suitable_for: 'Individual analysts, small teams, public threat intelligence',
    limitations: ['5MB content limit', 'Basic collaboration features', 'Public infrastructure dependency'],
    setup_guide: 'SERVERLESS_SETUP.md'
  },
  
  // Scenario 2: Hybrid (best of both worlds)
  HYBRID: {
    name: 'Hybrid Deployment',
    infrastructure: 'auto-detect',
    cost: '$0-50/month (optional RelayNode)',
    setup_time: '15 minutes',
    suitable_for: 'Growing teams, mixed public/private content',
    limitations: ['Setup complexity'],
    setup_guide: 'HYBRID_SETUP.md'
  },
  
  // Scenario 3: Enterprise (maximum security)
  ENTERPRISE: {
    name: 'Enterprise Deployment',
    infrastructure: 'private-only',
    cost: '$100-500/month (infrastructure)',
    setup_time: '1-2 hours',
    suitable_for: 'Government agencies, classified investigations',
    limitations: ['Higher cost', 'Technical expertise required'],
    setup_guide: 'ENTERPRISE_SETUP.md'
  }
};

// PUBLIC INFRASTRUCTURE SERVICE STATUS
export interface InfrastructureStatus {
  relayNode: {
    available: boolean;
    endpoint?: string;
    capabilities?: string[];
  };
  publicRelays: {
    connected: number;
    total: number;
    healthy: string[];
    failed: string[];
  };
  ipfsGateways: {
    available: number;
    total: number;
    healthy: string[];
    failed: string[];
  };
  recommendedMode: 'local' | 'hybrid' | 'public';
}

// UTILITY FUNCTIONS
export const createTeamInviteLink = (teamId: string, teamName: string): string => {
  const baseUrl = window.location.origin;
  const inviteData = btoa(JSON.stringify({ teamId, teamName, timestamp: Date.now() }));
  return `${baseUrl}/join-team?invite=${inviteData}`;
};

export const parseTeamInviteLink = (inviteLink: string): { teamId: string; teamName: string; timestamp: number } | null => {
  try {
    const url = new URL(inviteLink);
    const inviteParam = url.searchParams.get('invite');
    if (!inviteParam) return null;
    
    return JSON.parse(atob(inviteParam));
  } catch {
    return null;
  }
};

export const generateTeamQRCode = (teamId: string, teamName: string): string => {
  const inviteLink = createTeamInviteLink(teamId, teamName);
  // In production, use a QR code library like 'qrcode'
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`;
};

// REAL-WORLD DEPLOYMENT TEMPLATES
export const DEPLOYMENT_TEMPLATES = {
  'small-soc': {
    name: 'Small SOC Team (5-10 analysts)',
    recommended: 'HYBRID',
    monthly_cost: '$25',
    features: ['Team collaboration', 'Threat intelligence sharing', 'Investigation coordination'],
    setup_commands: [
      'git clone https://github.com/your-org/starcom-app',
      'cd dapp && npm install',
      'npm run build',
      'npm run deploy'
    ]
  },
  
  'government-agency': {
    name: 'Government Agency (20+ analysts)',
    recommended: 'ENTERPRISE',
    monthly_cost: '$200-500',
    features: ['Private infrastructure', 'Classified content support', 'Advanced security'],
    setup_commands: [
      'Deploy RelayNode on secure servers',
      'Configure VPN access',
      'Set up DID authentication',
      'Deploy dApp with private config'
    ]
  },
  
  'freelance-analyst': {
    name: 'Freelance Security Analyst',
    recommended: 'SERVERLESS',
    monthly_cost: '$0',
    features: ['Personal investigation tracking', 'Public threat intelligence', 'Portfolio building'],
    setup_commands: [
      'Visit https://starcom-app.vercel.app',
      'Connect wallet',
      'Start investigating'
    ]
  }
};
