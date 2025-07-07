use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Simplified clean config without external dependencies for now
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SubnetRole {
    pub role_type: String,
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SubnetConfiguration {
    pub subnet_id: String,
    pub role: SubnetRole,
    pub encryption_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GatewayProtocol {
    pub protocol_type: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AccessPolicy {
    pub policy_type: String,
    pub conditions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GatewayConfiguration {
    pub gateway_id: String,
    pub protocol: GatewayProtocol,
    pub access_policy: AccessPolicy,
}

// Additional simplified types for examples
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NetworkPattern {
    pub pattern_type: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GatewayAction {
    pub action_type: String,
    pub parameters: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AccessCondition {
    pub condition_type: String,
    pub value: String,
}

/// Clean configuration structure that separates subnet and gateway concerns
/// This replaces the coupled configuration with optional, independent components
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanConfig {
    /// Core node configuration (always present)
    pub core: CoreConfig,
    
    /// Subnet configuration (optional - only if node joins a subnet)
    pub subnet: Option<SubnetNodeConfig>,
    
    /// Gateway configuration (optional - only if node provides gateway services)
    pub gateway: Option<GatewayNodeConfig>,
    
    /// Legacy compatibility (for migration period)
    pub legacy_mode: bool,
}

/// Core node configuration that's always present
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoreConfig {
    pub node_id: String,
    pub bind_address: String,
    pub security_level: SecurityLevel,
    pub nostr: NostrConfig,
    pub ipfs: IPFSConfig,
    pub api: APIConfig,
}

/// Subnet-specific configuration (ONLY subnet concerns)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetNodeConfig {
    /// Subnet to join
    pub subnet_id: String,
    pub subnet_name: String,
    
    /// This node's role in the subnet
    pub node_role: SubnetRole,
    pub node_public_key: String,
    
    /// Subnet-specific settings
    pub subnet_config: SubnetConfiguration,
    
    /// Discovery settings for finding other subnet members
    pub discovery: SubnetDiscoveryConfig,
}

/// Gateway-specific configuration (ONLY gateway concerns)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayNodeConfig {
    /// Gateway identity
    pub gateway_id: String,
    
    /// Protocols this gateway supports
    pub supported_protocols: Vec<GatewayProtocol>,
    
    /// Access control policies
    pub access_policies: Vec<AccessPolicy>,
    
    /// Gateway-specific settings
    pub gateway_config: GatewayConfiguration,
    
    /// Protocol translation settings
    pub translation: ProtocolTranslationConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetDiscoveryConfig {
    pub enabled: bool,
    pub discovery_port: u16,
    pub announcement_interval_seconds: u64,
    pub discovery_timeout_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolTranslationConfig {
    pub enable_nostr_to_http: bool,
    pub enable_http_to_nostr: bool,
    pub enable_ipfs_bridging: bool,
    pub custom_translators: HashMap<String, String>, // protocol_pair -> translator_class
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityLevel {
    Unclassified,
    Confidential,
    Secret,
    TopSecret,
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

/// Deployment pattern determination based on configuration
#[derive(Debug, Clone, PartialEq)]
pub enum DeploymentPattern {
    SubnetOnly,      // subnet: Some, gateway: None
    GatewayOnly,     // subnet: None, gateway: Some
    SubnetGateway,   // subnet: Some, gateway: Some
    BasicRelay,      // subnet: None, gateway: None
}

impl CleanConfig {
    /// Load configuration from file or environment
    pub fn load() -> Result<Self> {
        // Try to load from config file first
        if let Ok(config) = Self::load_from_file("config.toml") {
            return Ok(config);
        }
        
        // Fall back to environment variables
        if let Ok(config) = Self::load_from_env() {
            return Ok(config);
        }
        
        // Use default configuration
        Ok(Self::default())
    }
    
    /// Load from TOML configuration file
    pub fn load_from_file(path: &str) -> Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let config: CleanConfig = toml::from_str(&content)?;
        config.validate()?;
        Ok(config)
    }
    
    /// Load from environment variables
    pub fn load_from_env() -> Result<Self> {
        // Implementation would read from environment variables
        // For now, return default
        Ok(Self::default())
    }
    
    /// Validate configuration consistency
    pub fn validate(&self) -> Result<()> {
        // Validate core config
        if self.core.node_id.is_empty() {
            return Err(anyhow::anyhow!("node_id cannot be empty"));
        }
        
        // Validate subnet config if present
        if let Some(subnet_config) = &self.subnet {
            if subnet_config.subnet_id.is_empty() {
                return Err(anyhow::anyhow!("subnet_id cannot be empty"));
            }
            if subnet_config.node_public_key.is_empty() {
                return Err(anyhow::anyhow!("node_public_key cannot be empty"));
            }
        }
        
        // Validate gateway config if present
        if let Some(gateway_config) = &self.gateway {
            if gateway_config.gateway_id.is_empty() {
                return Err(anyhow::anyhow!("gateway_id cannot be empty"));
            }
            if gateway_config.supported_protocols.is_empty() {
                return Err(anyhow::anyhow!("gateway must support at least one protocol"));
            }
        }
        
        Ok(())
    }
    
    /// Determine deployment pattern from configuration
    pub fn deployment_pattern(&self) -> DeploymentPattern {
        match (&self.subnet, &self.gateway) {
            (Some(_), Some(_)) => DeploymentPattern::SubnetGateway,
            (Some(_), None) => DeploymentPattern::SubnetOnly,
            (None, Some(_)) => DeploymentPattern::GatewayOnly,
            (None, None) => DeploymentPattern::BasicRelay,
        }
    }
    
    /// Check if this node should join a subnet
    pub fn should_join_subnet(&self) -> bool {
        self.subnet.is_some()
    }
    
    /// Check if this node should enable gateway capabilities
    pub fn should_enable_gateway(&self) -> bool {
        self.gateway.is_some()
    }
    
    /// Get subnet configuration (if enabled)
    pub fn get_subnet_config(&self) -> Option<&SubnetNodeConfig> {
        self.subnet.as_ref()
    }
    
    /// Get gateway configuration (if enabled)
    pub fn get_gateway_config(&self) -> Option<&GatewayNodeConfig> {
        self.gateway.as_ref()
    }
}

impl Default for CleanConfig {
    fn default() -> Self {
        Self {
            core: CoreConfig::default(),
            subnet: None,  // No subnet by default
            gateway: None, // No gateway by default
            legacy_mode: false,
        }
    }
}

impl Default for CoreConfig {
    fn default() -> Self {
        Self {
            node_id: format!("relay-node-{}", uuid::Uuid::new_v4()),
            bind_address: "127.0.0.1".to_string(),
            security_level: SecurityLevel::Unclassified,
            nostr: NostrConfig::default(),
            ipfs: IPFSConfig::default(),
            api: APIConfig::default(),
        }
    }
}

impl Default for NostrConfig {
    fn default() -> Self {
        Self {
            bind_address: "127.0.0.1".to_string(),
            port: 8080,
            max_connections: 100,
            enable_auth: false,
        }
    }
}

impl Default for IPFSConfig {
    fn default() -> Self {
        Self {
            bind_address: "127.0.0.1".to_string(),
            port: 4001,
            storage_path: "./data/ipfs".to_string(),
            max_storage_mb: 1000,
        }
    }
}

impl Default for APIConfig {
    fn default() -> Self {
        Self {
            bind_address: "127.0.0.1".to_string(),
            port: 8081,
            enable_cors: true,
        }
    }
}

impl Default for SubnetDiscoveryConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            discovery_port: 8082,
            announcement_interval_seconds: 30,
            discovery_timeout_seconds: 300,
        }
    }
}

impl Default for ProtocolTranslationConfig {
    fn default() -> Self {
        Self {
            enable_nostr_to_http: true,
            enable_http_to_nostr: true,
            enable_ipfs_bridging: true,
            custom_translators: HashMap::new(),
        }
    }
}

impl Default for SecurityLevel {
    fn default() -> Self {
        SecurityLevel::Unclassified
    }
}

/// Configuration builder for easy creation of specific deployment patterns
pub struct CleanConfigBuilder {
    config: CleanConfig,
}

impl CleanConfigBuilder {
    pub fn new(node_id: String) -> Self {
        let mut config = CleanConfig::default();
        config.core.node_id = node_id;
        Self { config }
    }
    
    /// Configure this node to join a subnet
    pub fn with_subnet(mut self, subnet_id: String, subnet_name: String, public_key: String, role: SubnetRole) -> Self {
        self.config.subnet = Some(SubnetNodeConfig {
            subnet_id,
            subnet_name,
            node_role: role,
            node_public_key: public_key,
            subnet_config: SubnetConfiguration::default(),
            discovery: SubnetDiscoveryConfig::default(),
        });
        self
    }
    
    /// Configure this node to provide gateway services
    pub fn with_gateway(mut self, gateway_id: String, protocols: Vec<GatewayProtocol>, policies: Vec<AccessPolicy>) -> Self {
        self.config.gateway = Some(GatewayNodeConfig {
            gateway_id,
            supported_protocols: protocols,
            access_policies: policies,
            gateway_config: GatewayConfiguration::default(),
            translation: ProtocolTranslationConfig::default(),
        });
        self
    }
    
    /// Set core configuration
    pub fn with_core_config(mut self, core: CoreConfig) -> Self {
        self.config.core = core;
        self
    }
    
    /// Build the final configuration
    pub fn build(self) -> Result<CleanConfig> {
        self.config.validate()?;
        Ok(self.config)
    }
}

// Simplified UUID implementation for this module
mod uuid {
    pub struct Uuid;
    impl Uuid {
        pub fn new_v4() -> Self { Self }
    }
    impl std::fmt::Display for Uuid {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}", std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos())
        }
    }
}
