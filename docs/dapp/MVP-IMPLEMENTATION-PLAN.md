# MVP Subnet/Gateway Implementation Plan

## Executive Summary

This document provides a comprehensive, actionable development plan for implementing the MVP subnet/gateway features in the AI Security RelayNode and Starcom dApp ecosystem. The plan prioritizes Team Subnets, Security Gateways, and Bridge Discovery as the core MVP features.

## MVP Feature Scope

### Core Features
1. **Team Subnets** - Enhanced team isolation and local collaboration
2. **Security Gateway** - Basic access control and content filtering
3. **Bridge Discovery** - Protocol for finding and connecting to other team subnets

### Success Metrics
- Teams can operate in isolated subnets with local RelayNode clusters
- Basic security gateway prevents unauthorized cross-team access
- Teams can discover and establish secure bridges for intelligence sharing
- dApp seamlessly switches between subnet and global mesh modes

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
**Goal**: Extend configuration and add subnet awareness to RelayNode

#### 1.1 Config Extension
**File**: `ai-security-relaynode/src/config.rs`
**Changes**:
- Add subnet configuration structures
- Implement subnet mode detection
- Add team discovery and bridge settings

#### 1.2 Main Application Updates
**File**: `ai-security-relaynode/src/main.rs`
**Changes**:
- Initialize subnet services
- Start team announcement broadcasts
- Set up bridge discovery listeners

### Phase 2: Relay Protocol Enhancement (Week 2-3)
**Goal**: Implement subnet-aware message routing and team discovery

#### 2.1 Nostr Relay Enhancement
**File**: `ai-security-relaynode/src/nostr_relay.rs`
**Changes**:
- Add team announcement protocol
- Implement subnet-aware message filtering
- Add bridge discovery message handling

#### 2.2 Security Gateway Implementation
**File**: `ai-security-relaynode/src/security_gateway.rs` (new)
**Changes**:
- Create security gateway module
- Implement access control logic
- Add content filtering capabilities

### Phase 3: dApp Integration (Week 3-4)
**Goal**: Update Starcom dApp to support subnet operations

#### 3.1 RelayNode Service Updates
**File**: `src/services/RelayNodeIPFSService.ts`
**Changes**:
- Add subnet mode detection
- Implement team discovery UI integration
- Add bridge management functions

#### 3.2 Dashboard UI Updates
**Files**: Various dashboard components
**Changes**:
- Add subnet mode selector
- Create team discovery interface
- Implement bridge management UI

### Phase 4: Integration & Testing (Week 4-5)
**Goal**: End-to-end testing and validation

#### 4.1 Multi-Node Testing
- Deploy multiple RelayNodes in different subnets
- Test team discovery and bridge establishment
- Validate security gateway access control

#### 4.2 dApp Integration Testing
- Test dApp subnet mode switching
- Validate team discovery UI
- Test cross-subnet intelligence sharing

## Detailed Implementation Guide

### 1. Config Extension (config.rs)

```rust
// Add to existing Config struct
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    // ... existing fields ...
    pub subnet: SubnetConfig,
    pub gateway: GatewayConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetConfig {
    pub mode: SubnetMode,
    pub team_subnet_id: Option<String>,
    pub discovery_enabled: bool,
    pub bridge_discovery_port: u16,
    pub team_announcement_interval: u64, // seconds
    pub max_team_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubnetMode {
    GlobalMesh,      // Traditional global mesh operation
    TeamSubnet,      // Isolated team subnet
    HybridGateway,   // Gateway between subnets
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayConfig {
    pub enabled: bool,
    pub allowed_teams: Vec<String>,
    pub content_filtering: bool,
    pub access_control_level: SecurityLevel,
    pub bridge_timeout: u64, // seconds
}

impl Default for SubnetConfig {
    fn default() -> Self {
        Self {
            mode: SubnetMode::GlobalMesh,
            team_subnet_id: None,
            discovery_enabled: true,
            bridge_discovery_port: 8082,
            team_announcement_interval: 30,
            max_team_size: 50,
        }
    }
}

impl Default for GatewayConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            allowed_teams: Vec::new(),
            content_filtering: true,
            access_control_level: SecurityLevel::Unclassified,
            bridge_timeout: 300,
        }
    }
}
```

### 2. Main Application Updates (main.rs)

```rust
// Add subnet services to main initialization
async fn main() -> Result<()> {
    // ... existing initialization ...
    
    let config = Config::load()?;
    
    // Initialize subnet services based on mode
    match config.subnet.mode {
        SubnetMode::TeamSubnet => {
            info!("🏠 Starting in Team Subnet mode");
            start_team_subnet_services(&config).await?;
        }
        SubnetMode::HybridGateway => {
            info!("🌉 Starting in Hybrid Gateway mode");
            start_gateway_services(&config).await?;
        }
        SubnetMode::GlobalMesh => {
            info!("🌐 Starting in Global Mesh mode");
            // Traditional startup
        }
    }
    
    // ... rest of initialization ...
}

async fn start_team_subnet_services(config: &Config) -> Result<()> {
    // Start team announcement service
    if config.subnet.discovery_enabled {
        tokio::spawn(team_announcement_service(config.clone()));
    }
    
    // Start bridge discovery listener
    tokio::spawn(bridge_discovery_service(config.clone()));
    
    Ok(())
}

async fn start_gateway_services(config: &Config) -> Result<()> {
    // Start security gateway
    let gateway = SecurityGateway::new(config.gateway.clone()).await?;
    tokio::spawn(gateway.start());
    
    // Start bridge management
    tokio::spawn(bridge_management_service(config.clone()));
    
    Ok(())
}
```

### 3. Team Discovery Protocol (nostr_relay.rs)

```rust
// Add team discovery functionality
impl NostrRelay {
    // ... existing methods ...
    
    pub async fn start_team_announcements(&self, config: &SubnetConfig) -> Result<()> {
        if let Some(team_id) = &config.team_subnet_id {
            let announcement_interval = Duration::from_secs(config.team_announcement_interval);
            
            loop {
                let announcement = self.create_team_announcement(team_id).await?;
                self.broadcast_announcement(announcement).await?;
                tokio::time::sleep(announcement_interval).await;
            }
        }
        Ok(())
    }
    
    async fn create_team_announcement(&self, team_id: &str) -> Result<TeamAnnouncement> {
        Ok(TeamAnnouncement {
            team_id: team_id.to_string(),
            node_id: self.get_node_id().await?,
            timestamp: chrono::Utc::now().timestamp() as u64,
            capabilities: self.get_node_capabilities().await?,
            security_level: self.security_layer.get_security_level(),
            public_key: self.get_public_key().await?,
        })
    }
    
    async fn handle_team_discovery_message(&self, message: &str) -> Result<()> {
        if let Ok(announcement) = serde_json::from_str::<TeamAnnouncement>(message) {
            info!("📡 Discovered team node: {} from team {}", 
                  announcement.node_id, announcement.team_id);
            
            // Store discovered team info
            let mut team_registry = self.team_registry.write().await;
            team_registry.insert(announcement.team_id.clone(), announcement);
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamAnnouncement {
    pub team_id: String,
    pub node_id: String,
    pub timestamp: u64,
    pub capabilities: Vec<String>,
    pub security_level: SecurityLevel,
    pub public_key: String,
}
```

### 4. Security Gateway Implementation (security_gateway.rs - new file)

```rust
use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

use crate::config::{GatewayConfig, SecurityLevel};

#[derive(Clone)]
pub struct SecurityGateway {
    config: GatewayConfig,
    authorized_teams: Arc<RwLock<HashSet<String>>>,
    active_bridges: Arc<RwLock<HashMap<String, BridgeConnection>>>,
    content_filter: ContentFilter,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeConnection {
    pub remote_team_id: String,
    pub established_at: u64,
    pub last_activity: u64,
    pub security_level: SecurityLevel,
    pub status: BridgeStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BridgeStatus {
    Establishing,
    Active,
    Paused,
    Terminated,
}

impl SecurityGateway {
    pub async fn new(config: GatewayConfig) -> Result<Self> {
        let authorized_teams = Arc::new(RwLock::new(
            config.allowed_teams.iter().cloned().collect()
        ));
        
        Ok(Self {
            config,
            authorized_teams,
            active_bridges: Arc::new(RwLock::new(HashMap::new())),
            content_filter: ContentFilter::new(),
        })
    }
    
    pub async fn start(self) -> Result<()> {
        info!("🛡️ Security Gateway starting on port 8083");
        
        // Start bridge listener
        tokio::spawn(self.clone().bridge_listener());
        
        // Start bridge maintenance
        tokio::spawn(self.clone().bridge_maintenance());
        
        Ok(())
    }
    
    async fn bridge_listener(self) -> Result<()> {
        use tokio::net::TcpListener;
        
        let listener = TcpListener::bind("127.0.0.1:8083").await?;
        
        while let Ok((stream, addr)) = listener.accept().await {
            let gateway = self.clone();
            tokio::spawn(async move {
                if let Err(e) = gateway.handle_bridge_request(stream, addr).await {
                    error!("Bridge request error: {}", e);
                }
            });
        }
        
        Ok(())
    }
    
    pub async fn authorize_team(&self, team_id: &str) -> Result<()> {
        let mut teams = self.authorized_teams.write().await;
        teams.insert(team_id.to_string());
        info!("✅ Authorized team: {}", team_id);
        Ok(())
    }
    
    pub async fn establish_bridge(&self, remote_team_id: &str) -> Result<String> {
        // Check authorization
        let teams = self.authorized_teams.read().await;
        if !teams.contains(remote_team_id) {
            return Err(anyhow::anyhow!("Team {} not authorized", remote_team_id));
        }
        
        let bridge = BridgeConnection {
            remote_team_id: remote_team_id.to_string(),
            established_at: chrono::Utc::now().timestamp() as u64,
            last_activity: chrono::Utc::now().timestamp() as u64,
            security_level: self.config.access_control_level.clone(),
            status: BridgeStatus::Establishing,
        };
        
        let bridge_id = format!("bridge_{}", uuid::Uuid::new_v4());
        let mut bridges = self.active_bridges.write().await;
        bridges.insert(bridge_id.clone(), bridge);
        
        info!("🌉 Establishing bridge {} to team {}", bridge_id, remote_team_id);
        Ok(bridge_id)
    }
}

struct ContentFilter {
    // Implement content filtering logic
}

impl ContentFilter {
    fn new() -> Self {
        Self {}
    }
    
    fn filter_content(&self, content: &str, security_level: &SecurityLevel) -> bool {
        // Basic content filtering logic
        // TODO: Implement sophisticated filtering
        !content.contains("CLASSIFIED") || matches!(security_level, SecurityLevel::Secret | SecurityLevel::TopSecret)
    }
}
```

### 5. dApp Integration (RelayNodeIPFSService.ts)

```typescript
// Add subnet awareness to the service
interface SubnetConfig {
  mode: 'global-mesh' | 'team-subnet' | 'hybrid-gateway';
  teamSubnetId?: string;
  discoveryEnabled: boolean;
  maxTeamSize: number;
}

interface TeamDiscoveryResult {
  teamId: string;
  nodeId: string;
  capabilities: string[];
  securityLevel: string;
  lastSeen: number;
}

class RelayNodeIPFSService {
  private subnetMode: 'global-mesh' | 'team-subnet' | 'hybrid-gateway' = 'global-mesh';
  private discoveredTeams: Map<string, TeamDiscoveryResult> = new Map();
  private activeBridges: Map<string, BridgeConnection> = new Map();

  // ... existing methods ...

  /**
   * Initialize subnet operations
   */
  async initializeSubnetMode(config: SubnetConfig): Promise<void> {
    this.subnetMode = config.mode;
    
    if (config.mode === 'team-subnet' && config.discoveryEnabled) {
      await this.startTeamDiscovery(config.teamSubnetId);
    }
    
    if (config.mode === 'hybrid-gateway') {
      await this.initializeGatewayMode();
    }
    
    console.log(`🏠 Subnet mode initialized: ${config.mode}`);
  }

  /**
   * Start team discovery process
   */
  async startTeamDiscovery(teamId?: string): Promise<void> {
    try {
      const response = await fetch(`${this.relayNodeApiUrl}/api/team/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });

      if (response.ok) {
        const teams = await response.json();
        this.updateDiscoveredTeams(teams);
        console.log(`📡 Discovered ${teams.length} team nodes`);
      }
    } catch (error) {
      console.warn('Team discovery failed:', error);
    }
  }

  /**
   * Get discovered teams
   */
  getDiscoveredTeams(): TeamDiscoveryResult[] {
    return Array.from(this.discoveredTeams.values());
  }

  /**
   * Establish bridge to another team
   */
  async establishBridge(targetTeamId: string): Promise<string> {
    try {
      const response = await fetch(`${this.relayNodeApiUrl}/api/bridge/establish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTeamId })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`🌉 Bridge established: ${result.bridgeId}`);
        return result.bridgeId;
      } else {
        throw new Error(result.error || 'Bridge establishment failed');
      }
    } catch (error) {
      console.error('Bridge establishment failed:', error);
      throw error;
    }
  }

  /**
   * Upload content with subnet awareness
   */
  async uploadWithSubnetMode(
    content: string | Uint8Array | File,
    options: UploadOptions & { shareWithTeams?: string[] } = {}
  ): Promise<IPFSUploadResult> {
    // Add subnet-specific metadata
    const subnetMetadata = {
      subnetMode: this.subnetMode,
      teamId: options.metadata?.teamId,
      shareWithTeams: options.shareWithTeams || [],
      bridgeRequired: options.shareWithTeams && options.shareWithTeams.length > 0
    };

    const enhancedOptions = {
      ...options,
      metadata: {
        ...options.metadata,
        subnet: subnetMetadata
      }
    };

    return this.upload(content, enhancedOptions);
  }

  private updateDiscoveredTeams(teams: TeamDiscoveryResult[]): void {
    teams.forEach(team => {
      this.discoveredTeams.set(team.teamId, team);
    });
    
    // Emit discovery event
    this.emit('teams-discovered', teams);
  }
}
```

### 6. Dashboard UI Components

Create new React components for subnet management:

**SubnetModeSelector.tsx**:
```typescript
import React, { useState, useEffect } from 'react';
import { relayNodeService } from '../services/RelayNodeIPFSService';

interface SubnetModeSelectorProps {
  onModeChange: (mode: string) => void;
}

export const SubnetModeSelector: React.FC<SubnetModeSelectorProps> = ({ onModeChange }) => {
  const [currentMode, setCurrentMode] = useState('global-mesh');
  const [teamId, setTeamId] = useState('');

  const handleModeChange = async (mode: string) => {
    setCurrentMode(mode);
    onModeChange(mode);
    
    if (mode === 'team-subnet') {
      await relayNodeService.initializeSubnetMode({
        mode: 'team-subnet',
        teamSubnetId: teamId,
        discoveryEnabled: true,
        maxTeamSize: 50
      });
    }
  };

  return (
    <div className="subnet-mode-selector">
      <h3>Network Mode</h3>
      <div className="mode-options">
        <label>
          <input
            type="radio"
            value="global-mesh"
            checked={currentMode === 'global-mesh'}
            onChange={(e) => handleModeChange(e.target.value)}
          />
          Global Mesh
        </label>
        <label>
          <input
            type="radio"
            value="team-subnet"
            checked={currentMode === 'team-subnet'}
            onChange={(e) => handleModeChange(e.target.value)}
          />
          Team Subnet
        </label>
        <label>
          <input
            type="radio"
            value="hybrid-gateway"
            checked={currentMode === 'hybrid-gateway'}
            onChange={(e) => handleModeChange(e.target.value)}
          />
          Gateway Mode
        </label>
      </div>
      
      {currentMode === 'team-subnet' && (
        <div className="team-config">
          <input
            type="text"
            placeholder="Team ID"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
```

## Development Timeline

### Week 1: Foundation
- [ ] Day 1-2: Implement config.rs extensions
- [ ] Day 3-4: Update main.rs initialization
- [ ] Day 5-6: Basic team announcement protocol
- [ ] Day 7: Testing and debugging

### Week 2: Core Protocol
- [ ] Day 1-2: Complete nostr_relay.rs enhancements
- [ ] Day 3-4: Implement security_gateway.rs
- [ ] Day 5-6: Bridge discovery protocol
- [ ] Day 7: Integration testing

### Week 3: dApp Integration
- [ ] Day 1-2: Update RelayNodeIPFSService.ts
- [ ] Day 3-4: Create subnet UI components
- [ ] Day 5-6: Dashboard integration
- [ ] Day 7: UI testing and polish

### Week 4: End-to-End Testing
- [ ] Day 1-2: Multi-node deployment testing
- [ ] Day 3-4: Cross-subnet communication testing
- [ ] Day 5-6: Security gateway validation
- [ ] Day 7: Performance optimization

### Week 5: Documentation & Deployment
- [ ] Day 1-2: User documentation
- [ ] Day 3-4: Deployment guide
- [ ] Day 5-6: Final testing and bug fixes
- [ ] Day 7: MVP release preparation

## Testing Strategy

### Unit Tests
- Config loading and validation
- Team discovery protocol
- Security gateway access control
- Bridge establishment logic

### Integration Tests
- Multi-RelayNode subnet operations
- dApp to RelayNode communication
- Cross-subnet intelligence sharing
- Security policy enforcement

### End-to-End Tests
- Complete user workflows
- Multi-team collaboration scenarios
- Failover and recovery testing
- Performance under load

## Deployment Strategy

### Phase 1: Single Team Testing
- Deploy 3-5 RelayNodes in one team subnet
- Test local team collaboration
- Validate security isolation

### Phase 2: Multi-Team Testing
- Deploy 2-3 team subnets
- Test bridge establishment
- Validate cross-team intelligence sharing

### Phase 3: Production Pilot
- Deploy with real user teams
- Monitor performance and security
- Collect feedback for improvements

## Success Criteria

1. **Team Isolation**: Teams can operate independently with local RelayNode clusters
2. **Bridge Discovery**: Teams can discover and connect to authorized teams
3. **Security Gateway**: Unauthorized access is blocked, content is filtered appropriately
4. **dApp Integration**: Seamless switching between subnet and global modes
5. **Performance**: No significant degradation compared to global mesh mode
6. **Reliability**: 99%+ uptime for subnet operations

## Risk Mitigation

### Technical Risks
- **Config Complexity**: Keep configuration simple and well-documented
- **Protocol Compatibility**: Maintain backward compatibility with existing nodes
- **Performance Impact**: Monitor and optimize critical paths

### Security Risks
- **Access Control**: Implement defense-in-depth for team isolation
- **Bridge Security**: Use strong authentication for bridge establishment
- **Content Filtering**: Regular updates to filtering rules

### Operational Risks
- **Deployment Complexity**: Provide clear deployment guides and automation
- **Monitoring**: Implement comprehensive logging and metrics
- **Rollback**: Maintain ability to revert to global mesh mode

## Next Steps

1. **Start Implementation**: Begin with Phase 1 config extensions
2. **Set Up Testing Environment**: Prepare multi-node test infrastructure
3. **Create Development Branch**: Establish feature branch for MVP development
4. **Regular Reviews**: Weekly progress reviews and adjustments
5. **User Feedback**: Engage with early users for requirements validation

This implementation plan provides a solid foundation for building the MVP subnet/gateway features while maintaining the existing system's stability and security.
