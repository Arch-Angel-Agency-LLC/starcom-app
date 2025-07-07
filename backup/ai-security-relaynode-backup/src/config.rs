use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub team_id: Option<String>,
    pub team_name: Option<String>,
    pub security_level: SecurityLevel,
    pub nostr: NostrConfig,
    pub ipfs: IPFSConfig,
    pub api: APIConfig,
    pub subnet: SubnetConfig,
    pub gateway: GatewayConfig,
    pub team_subnet: TeamSubnetConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityLevel {
    Unclassified,
    Secret,
    TopSecret,
}

impl Default for SecurityLevel {
    fn default() -> Self {
        SecurityLevel::Unclassified
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NostrConfig {
    pub bind_address: String,
    pub port: u16,
    pub max_connections: usize,
    pub enable_auth: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IPFSConfig {
    pub bind_address: String,
    pub port: u16,
    pub storage_path: String,
    pub max_storage_mb: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct APIConfig {
    pub bind_address: String,
    pub port: u16,
    pub enable_cors: bool,
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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SubnetMode {
    GlobalMesh,      // Traditional global mesh operation
    TeamSubnet,      // Isolated team subnet
    HybridGateway,   // Gateway between subnets
    Isolated,    // No cross-team communication
    Bridged,     // Can communicate with trusted teams
    Regional,    // Geographic coordination mode
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayConfig {
    pub enabled: bool,
    pub allowed_teams: Vec<String>,
    pub content_filtering: bool,
    pub access_control_level: SecurityLevel,
    pub bridge_timeout: u64, // seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamSubnetConfig {
    // Existing fields
    pub team_id: String,
    pub team_name: String,
    pub security_level: SecurityLevel,
    
    // MVP additions
    pub subnet_mode: SubnetMode,
    pub trusted_teams: Vec<String>,
    pub bridge_permissions: BridgePermissions,
    pub security_policy: SecurityPolicy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgePermissions {
    pub allow_incoming_requests: bool,
    pub allowed_request_types: Vec<String>,
    pub max_concurrent_bridges: u32,
    pub bridge_duration_hours: u32,
    pub require_approval: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityPolicy {
    pub content_scanning: bool,
    pub access_logging: bool,
    pub threat_detection: bool,
    pub quarantine_suspicious: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            team_id: None,
            team_name: None,
            security_level: SecurityLevel::Unclassified,
            nostr: NostrConfig {
                bind_address: "127.0.0.1".to_string(),
                port: 8080,
                max_connections: 100,
                enable_auth: false,
            },
            ipfs: IPFSConfig {
                bind_address: "127.0.0.1".to_string(),
                port: 4001,
                storage_path: "./data/ipfs".to_string(),
                max_storage_mb: 1000,
            },
            api: APIConfig {
                bind_address: "127.0.0.1".to_string(),
                port: 8081,
                enable_cors: true,
            },
            subnet: SubnetConfig::default(),
            gateway: GatewayConfig::default(),
            team_subnet: TeamSubnetConfig::default(),
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

impl Default for TeamSubnetConfig {
    fn default() -> Self {
        Self {
            team_id: String::new(),
            team_name: String::new(),
            security_level: SecurityLevel::default(),
            subnet_mode: SubnetMode::Isolated,
            trusted_teams: Vec::new(),
            bridge_permissions: BridgePermissions::default(),
            security_policy: SecurityPolicy::default(),
        }
    }
}

impl Default for BridgePermissions {
    fn default() -> Self {
        Self {
            allow_incoming_requests: false,
            allowed_request_types: Vec::new(),
            max_concurrent_bridges: 5,
            bridge_duration_hours: 24,
            require_approval: true,
        }
    }
}

impl Default for SecurityPolicy {
    fn default() -> Self {
        Self {
            content_scanning: true,
            access_logging: true,
            threat_detection: true,
            quarantine_suspicious: true,
        }
    }
}

impl Config {
    pub fn load() -> Result<Self> {
        // For Phase 1, just return default config
        // TODO: Implement proper config file loading in Phase 2
        let config = Self::default();
        
        // Create data directory if it doesn't exist
        std::fs::create_dir_all(&config.ipfs.storage_path)
            .context("Failed to create IPFS storage directory")?;
        
        Ok(config)
    }

    pub fn save(&self, path: &str) -> Result<()> {
        let toml_string = toml::to_string(self)
            .context("Failed to serialize config to TOML")?;
        
        std::fs::write(path, toml_string)
            .context("Failed to write config file")?;
        
        Ok(())
    }

    pub fn load_from_file(path: &str) -> Result<Self> {
        let content = std::fs::read_to_string(path)
            .context("Failed to read config file")?;
        
        let config: Config = toml::from_str(&content)
            .context("Failed to parse config file")?;
        
        Ok(config)
    }

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
        
        // Validate port conflicts
        let ports = vec![
            self.nostr.port,
            self.ipfs.port,
            self.api.port,
            self.subnet.bridge_discovery_port,
        ];
        let unique_ports: std::collections::HashSet<_> = ports.iter().collect();
        if unique_ports.len() != ports.len() {
            return Err(anyhow::anyhow!("Port conflict detected in configuration"));
        }
        
        Ok(())
    }
}
