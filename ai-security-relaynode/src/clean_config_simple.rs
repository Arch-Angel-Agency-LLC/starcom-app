use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Simplified clean configuration structure
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CleanConfig {
    pub node_id: String,
    pub enabled: bool,
}

impl CleanConfig {
    pub fn new(node_id: String) -> Self {
        Self {
            node_id,
            enabled: true,
        }
    }

    pub fn validate(&self) -> Result<()> {
        if self.node_id.is_empty() {
            return Err(anyhow::anyhow!("Node ID cannot be empty"));
        }
        Ok(())
    }
}

/// Builder for clean configuration
#[derive(Debug, Default)]
pub struct CleanConfigBuilder {
    config: CleanConfig,
}

impl CleanConfigBuilder {
    pub fn new(node_id: String) -> Self {
        Self {
            config: CleanConfig::new(node_id),
        }
    }

    pub fn build(self) -> Result<CleanConfig> {
        self.config.validate()?;
        Ok(self.config)
    }
}
