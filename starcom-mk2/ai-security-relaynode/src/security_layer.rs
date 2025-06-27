use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, debug};

use crate::config::Config;
use crate::nostr_relay::NostrEvent;
use crate::event_store::ClearanceLevel;

#[derive(thiserror::Error, Debug)]
pub enum SecurityError {
    #[error("Encryption error: {0}")]
    Encryption(String),
    #[error("Decryption error: {0}")]
    Decryption(String),
    #[error("Authentication error: {0}")]
    Authentication(String),
    #[error("Authorization error: {0}")]
    Authorization(String),
}

/// Earth Alliance user profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EarthAllianceProfile {
    pub pubkey: String,
    pub team_id: Option<String>,
    pub clearance_level: ClearanceLevel,
    pub resistance_cell: Option<String>,
    pub operative_level: String,
    pub verified: bool,
    pub created_at: u64,
    pub last_activity: u64,
}

/// Team configuration for Earth Alliance operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamConfiguration {
    pub team_id: String,
    pub team_name: String,
    pub clearance_required: ClearanceLevel,
    pub isolation_mode: bool, // If true, no cross-team communication
    pub evidence_chain_required: bool,
    pub emergency_contacts: Vec<String>,
    pub operational_status: String,
}

#[derive(Clone)]
pub struct SecurityLayer {
    team_id: Option<String>,
    encryption_key: Vec<u8>,
    // Earth Alliance features
    user_profiles: Arc<RwLock<HashMap<String, EarthAllianceProfile>>>,
    team_configs: Arc<RwLock<HashMap<String, TeamConfiguration>>>,
    evidence_chains: Arc<RwLock<HashMap<String, Vec<String>>>>, // evidence_hash -> chain
}

impl SecurityLayer {
    pub async fn new() -> Result<Arc<Self>> {
        // For Phase 1, use a simple encryption key
        // TODO: Implement proper PQC in Phase 2
        let encryption_key = b"simple_key_for_phase1_testing_32".to_vec();
        
        let security_layer = Self {
            team_id: None,
            encryption_key,
            user_profiles: Arc::new(RwLock::new(HashMap::new())),
            team_configs: Arc::new(RwLock::new(HashMap::new())),
            evidence_chains: Arc::new(RwLock::new(HashMap::new())),
        };

        info!("🔒 Security layer initialized");
        Ok(Arc::new(security_layer))
    }    pub async fn new_with_config(config: &Config) -> Result<Arc<Self>> {
        let encryption_key = b"simple_key_for_phase1_testing_32".to_vec();
        
        let security_layer = Self {
            team_id: Some(config.team_subnet.team_id.clone()),
            encryption_key,
            user_profiles: Arc::new(RwLock::new(HashMap::new())),
            team_configs: Arc::new(RwLock::new(HashMap::new())),
            evidence_chains: Arc::new(RwLock::new(HashMap::new())),
        };

        let security_layer = Arc::new(security_layer);

        info!("🔒 Security layer initialized");
        if let Some(team_id) = &security_layer.team_id {
            info!("👥 Team ID: {}", team_id);
        }

        Ok(security_layer)
    }

    pub async fn encrypt_content(&self, content: &[u8]) -> Result<Vec<u8>, SecurityError> {
        // For Phase 1, implement simple XOR encryption
        // TODO: Replace with ML-KEM-768 in Phase 2
        let encrypted = content.iter()
            .zip(self.encryption_key.iter().cycle())
            .map(|(c, k)| c ^ k)
            .collect();
        
        Ok(encrypted)
    }

    pub async fn decrypt_content(&self, encrypted_content: &[u8]) -> Result<Vec<u8>, SecurityError> {
        // XOR encryption is symmetric, so decryption is the same as encryption
        self.encrypt_content(encrypted_content).await
    }

    pub async fn verify_team_membership(&self, user_id: &str) -> Result<bool, SecurityError> {
        // For Phase 1, allow all users
        // TODO: Implement proper team verification in Phase 2
        if user_id.is_empty() {
            return Ok(false);
        }
        
        info!("✅ User verified: {}", user_id);
        Ok(true)
    }

    pub async fn log_security_event(&self, event_type: &str, details: &str) {
        info!("🔐 Security event [{}]: {}", event_type, details);
    }

    /// Validate Nostr event for Earth Alliance compliance
    pub async fn validate_earth_alliance_event(&self, event: &NostrEvent) -> Result<bool> {
        debug!("🔍 Validating Earth Alliance event: {}", event.id);

        // 1. Check if user is registered in Earth Alliance
        if !self.is_earth_alliance_member(&event.pubkey).await? {
            debug!("❌ User not registered in Earth Alliance: {}", event.pubkey);
            return Ok(false);
        }

        // 2. Validate team permissions
        if !self.validate_team_permissions(&event.pubkey, event).await? {
            debug!("❌ Team permission validation failed for: {}", event.pubkey);
            return Ok(false);
        }

        // 3. Validate clearance level
        if !self.validate_clearance_level(&event.pubkey, event).await? {
            debug!("❌ Clearance level validation failed for: {}", event.pubkey);
            return Ok(false);
        }

        // 4. Validate evidence chain if present
        if let Some(evidence_hash) = self.extract_evidence_hash(event) {
            if !self.validate_evidence_chain(&evidence_hash).await? {
                debug!("❌ Evidence chain validation failed for: {}", evidence_hash);
                return Ok(false);
            }
        }

        debug!("✅ Earth Alliance validation passed for event: {}", event.id);
        Ok(true)
    }

    /// Register a new Earth Alliance member
    pub async fn register_earth_alliance_member(
        &self,
        pubkey: &str,
        team_id: Option<String>,
        clearance_level: ClearanceLevel,
        resistance_cell: Option<String>,
        operative_level: String,
    ) -> Result<()> {
        let profile = EarthAllianceProfile {
            pubkey: pubkey.to_string(),
            team_id,
            clearance_level,
            resistance_cell,
            operative_level,
            verified: true, // In production, this would require verification process
            created_at: chrono::Utc::now().timestamp() as u64,
            last_activity: chrono::Utc::now().timestamp() as u64,
        };

        self.user_profiles.write().await.insert(pubkey.to_string(), profile);
        info!("👤 Registered Earth Alliance member: {}", pubkey);
        Ok(())
    }

    /// Get user's team ID
    pub async fn get_user_team(&self, pubkey: &str) -> Result<Option<String>> {
        let profiles = self.user_profiles.read().await;
        if let Some(profile) = profiles.get(pubkey) {
            Ok(profile.team_id.clone())
        } else {
            Ok(None)
        }
    }

    /// Get user's clearance level
    pub async fn get_user_clearance(&self, pubkey: &str) -> Result<ClearanceLevel> {
        let profiles = self.user_profiles.read().await;
        if let Some(profile) = profiles.get(pubkey) {
            Ok(profile.clearance_level.clone())
        } else {
            Ok(ClearanceLevel::Unclassified)
        }
    }

    /// Check if user is Earth Alliance member
    pub async fn is_earth_alliance_member(&self, pubkey: &str) -> Result<bool> {
        let profiles = self.user_profiles.read().await;
        Ok(profiles.contains_key(pubkey))
    }

    /// Validate team permissions for event
    async fn validate_team_permissions(&self, pubkey: &str, event: &NostrEvent) -> Result<bool> {
        let user_team = self.get_user_team(pubkey).await?;
        let event_team = self.extract_team_id(event);

        match (user_team, event_team) {
            (Some(user_team), Some(event_team)) => {
                // Check if teams match or if cross-team communication is allowed
                if user_team == event_team {
                    Ok(true)
                } else {
                    self.is_cross_team_communication_allowed(&user_team, &event_team).await
                }
            }
            (None, Some(_)) => Ok(false), // User has no team but event requires team
            (_, None) => Ok(true), // No team restriction on event
        }
    }

    /// Validate clearance level for event
    async fn validate_clearance_level(&self, pubkey: &str, event: &NostrEvent) -> Result<bool> {
        let user_clearance = self.get_user_clearance(pubkey).await?;
        let event_clearance = self.extract_clearance_level(event);

        match event_clearance {
            Some(event_level) => {
                let event_clearance_level = ClearanceLevel::from_string(&event_level);
                Ok(self.has_sufficient_clearance(&user_clearance, &event_clearance_level))
            }
            None => Ok(true), // No clearance requirement
        }
    }

    /// Check if user has sufficient clearance
    fn has_sufficient_clearance(&self, user_clearance: &ClearanceLevel, required_clearance: &ClearanceLevel) -> bool {
        use ClearanceLevel::*;
        match (user_clearance, required_clearance) {
            (EarthAlliance, _) => true, // Earth Alliance clearance overrides all
            (TopSecret, TopSecret) | (TopSecret, Secret) | (TopSecret, Confidential) | (TopSecret, Restricted) | (TopSecret, Unclassified) => true,
            (Secret, Secret) | (Secret, Confidential) | (Secret, Restricted) | (Secret, Unclassified) => true,
            (Confidential, Confidential) | (Confidential, Restricted) | (Confidential, Unclassified) => true,
            (Restricted, Restricted) | (Restricted, Unclassified) => true,
            (Unclassified, Unclassified) => true,
            _ => false,
        }
    }

    /// Check if cross-team communication is allowed
    async fn is_cross_team_communication_allowed(&self, from_team: &str, to_team: &str) -> Result<bool> {
        let team_configs = self.team_configs.read().await;
        
        // Check source team's isolation mode
        if let Some(from_config) = team_configs.get(from_team) {
            if from_config.isolation_mode {
                return Ok(false); // Team is isolated
            }
        }

        // Check target team's isolation mode
        if let Some(to_config) = team_configs.get(to_team) {
            if to_config.isolation_mode {
                return Ok(false); // Target team is isolated
            }
        }

        // Default: allow cross-team communication
        Ok(true)
    }

    /// Extract team ID from event tags
    fn extract_team_id(&self, event: &NostrEvent) -> Option<String> {
        for tag in &event.tags {
            if tag.len() >= 2 && tag[0] == "team" {
                return Some(tag[1].clone());
            }
        }
        None
    }

    /// Extract clearance level from event tags
    fn extract_clearance_level(&self, event: &NostrEvent) -> Option<String> {
        for tag in &event.tags {
            if tag.len() >= 2 && tag[0] == "clearance" {
                return Some(tag[1].clone());
            }
        }
        None
    }

    /// Extract evidence hash from event tags
    fn extract_evidence_hash(&self, event: &NostrEvent) -> Option<String> {
        for tag in &event.tags {
            if tag.len() >= 2 && tag[0] == "evidence" {
                return Some(tag[1].clone());
            }
        }
        None
    }

    /// Validate evidence chain integrity
    pub async fn validate_evidence_chain(&self, evidence_hash: &str) -> Result<bool> {
        debug!("⛓️ Validating evidence chain: {}", evidence_hash);
        
        let chains = self.evidence_chains.read().await;
        if let Some(chain) = chains.get(evidence_hash) {
            // Basic validation - ensure chain is not empty
            if chain.is_empty() {
                return Ok(false);
            }

            // TODO: Implement cryptographic chain validation
            // For now, just check that chain exists
            debug!("✅ Evidence chain found with {} entries", chain.len());
            Ok(true)
        } else {
            debug!("❌ Evidence chain not found: {}", evidence_hash);
            Ok(false)
        }
    }

    /// Add evidence to chain
    pub async fn add_evidence_to_chain(&self, evidence_hash: &str, previous_hash: Option<String>) -> Result<()> {
        let mut chains = self.evidence_chains.write().await;
        
        match previous_hash {
            Some(prev_hash) => {
                // Add to existing chain
                if let Some(chain) = chains.get(&prev_hash) {
                    let mut new_chain = chain.clone();
                    new_chain.push(evidence_hash.to_string());
                    chains.insert(evidence_hash.to_string(), new_chain);
                } else {
                    // Create new chain
                    let chain = vec![prev_hash, evidence_hash.to_string()];
                    chains.insert(evidence_hash.to_string(), chain);
                }
            }
            None => {
                // Start new chain
                let chain = vec![evidence_hash.to_string()];
                chains.insert(evidence_hash.to_string(), chain);
            }
        }

        debug!("⛓️ Added evidence to chain: {}", evidence_hash);
        Ok(())
    }

    /// Configure team settings
    pub async fn configure_team(
        &self,
        team_id: &str,
        team_name: &str,
        clearance_required: ClearanceLevel,
        isolation_mode: bool,
        evidence_chain_required: bool,
    ) -> Result<()> {
        let team_config = TeamConfiguration {
            team_id: team_id.to_string(),
            team_name: team_name.to_string(),
            clearance_required,
            isolation_mode,
            evidence_chain_required,
            emergency_contacts: Vec::new(),
            operational_status: "active".to_string(),
        };

        self.team_configs.write().await.insert(team_id.to_string(), team_config);
        info!("🏢 Configured team: {} ({})", team_name, team_id);
        Ok(())
    }

    /// Get team configuration
    pub async fn get_team_config(&self, team_id: &str) -> Result<Option<TeamConfiguration>> {
        let configs = self.team_configs.read().await;
        Ok(configs.get(team_id).cloned())
    }

    /// Update user activity
    pub async fn update_user_activity(&self, pubkey: &str) -> Result<()> {
        let mut profiles = self.user_profiles.write().await;
        if let Some(profile) = profiles.get_mut(pubkey) {
            profile.last_activity = chrono::Utc::now().timestamp() as u64;
        }
        Ok(())
    }

    /// Get security statistics
    pub async fn get_security_stats(&self) -> Result<serde_json::Value> {
        let profiles = self.user_profiles.read().await;
        let teams = self.team_configs.read().await;
        let chains = self.evidence_chains.read().await;

        let stats = serde_json::json!({
            "total_users": profiles.len(),
            "total_teams": teams.len(),
            "total_evidence_chains": chains.len(),
            "clearance_distribution": self.get_clearance_distribution(&profiles),
            "team_distribution": self.get_team_distribution(&profiles),
        });

        Ok(stats)
    }

    /// Get clearance level distribution
    fn get_clearance_distribution(&self, profiles: &HashMap<String, EarthAllianceProfile>) -> HashMap<String, usize> {
        let mut distribution = HashMap::new();
        for profile in profiles.values() {
            let level = profile.clearance_level.to_string();
            *distribution.entry(level).or_insert(0) += 1;
        }
        distribution
    }

    /// Get team distribution
    fn get_team_distribution(&self, profiles: &HashMap<String, EarthAllianceProfile>) -> HashMap<String, usize> {
        let mut distribution = HashMap::new();
        for profile in profiles.values() {
            let team = profile.team_id.clone().unwrap_or_else(|| "unassigned".to_string());
            *distribution.entry(team).or_insert(0) += 1;
        }
        distribution
    }
}
