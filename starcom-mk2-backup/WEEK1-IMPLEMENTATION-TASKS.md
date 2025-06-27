# Week 1 Implementation Tasks

## Overview
This document provides detailed, actionable tasks for Week 1 of the MVP subnet/gateway implementation. Each task includes specific code changes, file modifications, and validation steps.

## Day 1-2: Config Extensions

### Task 1.1: Extend Config Structure
**File**: `ai-security-relaynode/src/config.rs`
**Estimated Time**: 2 hours

**Specific Changes**:
1. Add subnet and gateway configuration structs
2. Update Default implementations
3. Add validation methods
4. Update Config::load() method

**Validation**:
- Config loads without errors
- Default values are sensible
- TOML serialization/deserialization works

### Task 1.2: Add Subnet Types Module
**File**: `ai-security-relaynode/src/subnet_types.rs` (new)
**Estimated Time**: 1 hour

**Create new module** for subnet-specific data structures:
- SubnetMode enum
- TeamAnnouncement struct
- BridgeConnection struct
- Discovery messages

### Task 1.3: Update Cargo.toml Dependencies
**File**: `ai-security-relaynode/Cargo.toml`
**Estimated Time**: 30 minutes

**Add dependencies**:
- uuid for bridge IDs
- chrono for timestamps
- Additional serde features if needed

## Day 3-4: Main Application Updates

### Task 1.4: Update Main Initialization
**File**: `ai-security-relaynode/src/main.rs`
**Estimated Time**: 3 hours

**Changes**:
1. Add subnet mode detection
2. Initialize subnet services based on mode
3. Create service spawning functions
4. Add proper error handling

### Task 1.5: Create Service Starters
**File**: `ai-security-relaynode/src/services/mod.rs` (new)
**Estimated Time**: 2 hours

**Create service management module**:
- Team announcement service
- Bridge discovery service
- Gateway service starter
- Service health monitoring

## Day 5-6: Team Announcement Protocol

### Task 1.6: Extend Nostr Relay
**File**: `ai-security-relaynode/src/nostr_relay.rs`
**Estimated Time**: 4 hours

**Changes**:
1. Add team announcement broadcasting
2. Create team discovery message handling
3. Add team registry storage
4. Implement announcement intervals

### Task 1.7: Create Team Registry
**File**: `ai-security-relaynode/src/team_registry.rs` (new)
**Estimated Time**: 2 hours

**New module for team management**:
- Store discovered teams
- Team node tracking
- Health monitoring
- Expiration handling

## Day 7: Testing and Debugging

### Task 1.8: Unit Tests
**File**: `ai-security-relaynode/src/config.rs` (tests)
**Estimated Time**: 2 hours

**Create tests for**:
- Config loading/saving
- Default value validation
- Error handling
- TOML format compatibility

### Task 1.9: Integration Testing
**File**: `ai-security-relaynode/tests/integration_tests.rs`
**Estimated Time**: 3 hours

**Create integration tests**:
- Basic RelayNode startup in subnet mode
- Team announcement broadcasting
- Config file loading scenarios

## Detailed Code Templates

### Config Extension Template

```rust
// Add to config.rs after existing structs
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
    pub team_announcement_interval: u64,
    pub max_team_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubnetMode {
    GlobalMesh,
    TeamSubnet,
    HybridGateway,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayConfig {
    pub enabled: bool,
    pub allowed_teams: Vec<String>,
    pub content_filtering: bool,
    pub access_control_level: SecurityLevel,
    pub bridge_timeout: u64,
}

// Update Default impl
impl Default for Config {
    fn default() -> Self {
        Self {
            // ... existing defaults ...
            subnet: SubnetConfig::default(),
            gateway: GatewayConfig::default(),
        }
    }
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

impl Config {
    pub fn validate(&self) -> Result<()> {
        // Validate subnet config
        if matches!(self.subnet.mode, SubnetMode::TeamSubnet) {
            if self.subnet.team_subnet_id.is_none() {
                return Err(anyhow::anyhow!("Team subnet ID required for TeamSubnet mode"));
            }
        }
        
        // Validate gateway config
        if self.gateway.enabled && self.gateway.allowed_teams.is_empty() {
            return Err(anyhow::anyhow!("Gateway enabled but no allowed teams specified"));
        }
        
        Ok(())
    }
}
```

### Main.rs Updates Template

```rust
// Add to main.rs imports
use crate::services::{start_team_subnet_services, start_gateway_services};

// Update main function
async fn main() -> Result<()> {
    tracing_subscriber::init();
    
    let config = Config::load()?;
    config.validate()?;
    
    info!("🚀 Starting AI Security RelayNode");
    info!("📋 Mode: {:?}", config.subnet.mode);
    
    // Initialize core services
    let security_layer = Arc::new(SecurityLayer::new(&config).await?);
    let nostr_relay = Arc::new(NostrRelay::new(security_layer.clone()).await?);
    
    // Initialize subnet-specific services
    match config.subnet.mode {
        SubnetMode::TeamSubnet => {
            info!("🏠 Starting Team Subnet services");
            start_team_subnet_services(&config, nostr_relay.clone()).await?;
        }
        SubnetMode::HybridGateway => {
            info!("🌉 Starting Gateway services");
            start_gateway_services(&config, nostr_relay.clone()).await?;
        }
        SubnetMode::GlobalMesh => {
            info!("🌐 Starting Global Mesh services");
            // Traditional startup
        }
    }
    
    // Start core services
    let api_gateway = APIGateway::new(&config, nostr_relay.clone()).await?;
    
    // Spawn services
    let nostr_handle = tokio::spawn({
        let relay = nostr_relay.clone();
        async move { relay.start().await }
    });
    
    let api_handle = tokio::spawn({
        async move { api_gateway.start().await }
    });
    
    // Wait for services
    tokio::select! {
        result = nostr_handle => {
            error!("Nostr relay stopped: {:?}", result);
        }
        result = api_handle => {
            error!("API gateway stopped: {:?}", result);
        }
        _ = tokio::signal::ctrl_c() => {
            info!("Received shutdown signal");
        }
    }
    
    Ok(())
}
```

### Service Management Template

```rust
// Create services/mod.rs
use anyhow::Result;
use std::sync::Arc;
use tokio::time::{Duration, interval};
use tracing::{info, error};

use crate::config::{Config, SubnetMode};
use crate::nostr_relay::NostrRelay;
use crate::team_registry::TeamRegistry;

pub async fn start_team_subnet_services(
    config: &Config, 
    nostr_relay: Arc<NostrRelay>
) -> Result<()> {
    // Initialize team registry
    let team_registry = Arc::new(TeamRegistry::new().await?);
    
    // Start team announcement service
    if config.subnet.discovery_enabled {
        let config_clone = config.clone();
        let relay_clone = nostr_relay.clone();
        let registry_clone = team_registry.clone();
        
        tokio::spawn(async move {
            if let Err(e) = team_announcement_service(config_clone, relay_clone, registry_clone).await {
                error!("Team announcement service error: {}", e);
            }
        });
    }
    
    // Start bridge discovery listener
    let config_clone = config.clone();
    let registry_clone = team_registry.clone();
    
    tokio::spawn(async move {
        if let Err(e) = bridge_discovery_service(config_clone, registry_clone).await {
            error!("Bridge discovery service error: {}", e);
        }
    });
    
    Ok(())
}

async fn team_announcement_service(
    config: Config,
    nostr_relay: Arc<NostrRelay>,
    team_registry: Arc<TeamRegistry>
) -> Result<()> {
    let mut interval = interval(Duration::from_secs(config.subnet.team_announcement_interval));
    
    loop {
        interval.tick().await;
        
        if let Some(team_id) = &config.subnet.team_subnet_id {
            match nostr_relay.create_team_announcement(team_id).await {
                Ok(announcement) => {
                    if let Err(e) = nostr_relay.broadcast_announcement(&announcement).await {
                        error!("Failed to broadcast team announcement: {}", e);
                    } else {
                        info!("📡 Broadcasted team announcement for {}", team_id);
                    }
                }
                Err(e) => {
                    error!("Failed to create team announcement: {}", e);
                }
            }
        }
    }
}

pub async fn start_gateway_services(
    config: &Config,
    nostr_relay: Arc<NostrRelay>
) -> Result<()> {
    // TODO: Implement gateway services in Week 2
    info!("🌉 Gateway services initialization - Phase 2");
    Ok(())
}

async fn bridge_discovery_service(
    config: Config,
    team_registry: Arc<TeamRegistry>
) -> Result<()> {
    // TODO: Implement bridge discovery in Week 2
    info!("🔍 Bridge discovery service - Phase 2");
    Ok(())
}
```

## Validation Checklist

### Day 1-2 Completion
- [ ] Config struct extended with subnet/gateway fields
- [ ] Default implementations work correctly
- [ ] Config validation method implemented
- [ ] TOML serialization/deserialization tested
- [ ] New dependencies added to Cargo.toml

### Day 3-4 Completion
- [ ] Main.rs updated with subnet mode detection
- [ ] Service management module created
- [ ] Team subnet services initialization implemented
- [ ] Error handling added for all new code paths
- [ ] Basic service spawning works

### Day 5-6 Completion
- [ ] Team announcement protocol implemented
- [ ] Nostr relay extended with discovery features
- [ ] Team registry module created
- [ ] Announcement broadcasting works
- [ ] Discovery message handling implemented

### Day 7 Completion
- [ ] Unit tests for config module pass
- [ ] Integration tests for basic startup pass
- [ ] No regressions in existing functionality
- [ ] Code compiles without warnings
- [ ] Documentation updated for new features

## Common Issues and Solutions

### Config Loading Issues
**Problem**: Config fails to load with new fields
**Solution**: Ensure Default implementations are complete and TOML format is valid

### Service Startup Issues
**Problem**: Services fail to start in subnet mode
**Solution**: Check port availability and permissions, validate config before service startup

### Compilation Issues
**Problem**: Missing dependencies or type errors
**Solution**: Add required dependencies to Cargo.toml, check import statements

### Testing Issues
**Problem**: Tests fail or don't run
**Solution**: Ensure test dependencies are included, check test module structure

## Week 1 Success Criteria

1. **Config System**: New subnet/gateway configuration loads and validates correctly
2. **Service Management**: Services start and initialize based on subnet mode
3. **Team Announcements**: Basic team discovery protocol broadcasts announcements
4. **Code Quality**: All new code compiles without warnings and passes basic tests
5. **Documentation**: New features are documented and understood by team

## Preparation for Week 2

### Ready for Week 2 Development
- [ ] All Week 1 tasks completed and validated
- [ ] Development environment set up for multi-node testing
- [ ] Team registry populated with test data
- [ ] Bridge discovery protocol ready for implementation
- [ ] Security gateway module structure planned

### Week 2 Preview
Week 2 will focus on:
1. **Bridge Discovery Protocol**: Implement peer-to-peer bridge establishment
2. **Security Gateway**: Create access control and filtering logic
3. **Message Routing**: Add subnet-aware message handling
4. **Integration Testing**: Multi-node subnet testing

This foundation from Week 1 will enable rapid development of the core subnet functionality in subsequent weeks.
