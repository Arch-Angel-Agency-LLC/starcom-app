use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub team_id: Option<String>,
    pub team_name: Option<String>,
    pub security_level: SecurityLevel,
    pub nostr: NostrConfig,
    pub ipfs: IPFSConfig,
    pub api: APIConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityLevel {
    Unclassified,
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
}
