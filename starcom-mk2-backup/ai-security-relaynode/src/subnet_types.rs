use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::time::Instant;

use crate::config::SecurityLevel;

/// Represents a pending bridge request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeRequest {
    pub request_id: String,
    pub source_team_id: String,
    pub target_team_id: String,
    pub requested_at: u64, // Use u64 timestamp instead of Instant for serialization
    pub expires_at: u64,
    pub request_type: String,
    pub justification: Option<String>,
    pub requires_approval: bool,
    pub approved: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamAnnouncement {
    pub team_id: String,
    pub node_id: String,
    pub timestamp: u64,
    pub capabilities: Vec<String>,
    pub security_level: SecurityLevel,
    pub public_key: String,
    pub subnet_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeConnection {
    pub remote_team_id: String,
    pub bridge_id: String,
    pub established_at: u64,
    pub last_activity: u64,
    pub security_level: SecurityLevel,
    pub status: BridgeStatus,
    pub connection_info: BridgeConnectionInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BridgeStatus {
    Establishing,
    Active,
    Paused,
    Terminated,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeConnectionInfo {
    pub remote_address: String,
    pub remote_port: u16,
    pub local_port: u16,
    pub encryption_enabled: bool,
    pub protocol_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeDiscoveryMessage {
    pub message_type: DiscoveryMessageType,
    pub source_team_id: String,
    pub target_team_id: Option<String>,
    pub node_id: String,
    pub timestamp: u64,
    pub payload: DiscoveryPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DiscoveryMessageType {
    TeamAnnouncement,
    BridgeRequest,
    BridgeResponse,
    BridgeTermination,
    HealthCheck,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveryPayload {
    pub data: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamNodeInfo {
    pub node_id: String,
    pub team_id: String,
    pub last_seen: u64,
    pub capabilities: Vec<String>,
    pub security_level: SecurityLevel,
    pub connection_status: NodeConnectionStatus,
    pub performance_metrics: NodeMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeConnectionStatus {
    Online,
    Offline,
    Degraded,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeMetrics {
    pub latency_ms: u32,
    pub uptime_percentage: f32,
    pub message_throughput: u32,
    pub last_updated: u64,
}

impl TeamAnnouncement {
    pub fn new(
        team_id: String,
        node_id: String,
        capabilities: Vec<String>,
        security_level: SecurityLevel,
        public_key: String,
    ) -> Self {
        Self {
            team_id,
            node_id,
            timestamp: chrono::Utc::now().timestamp() as u64,
            capabilities,
            security_level,
            public_key,
            subnet_version: "1.0".to_string(),
        }
    }

    pub fn is_expired(&self, max_age_seconds: u64) -> bool {
        let current_time = chrono::Utc::now().timestamp() as u64;
        current_time.saturating_sub(self.timestamp) > max_age_seconds
    }

    pub fn validate(&self) -> Result<()> {
        if self.team_id.is_empty() {
            return Err(anyhow::anyhow!("Team ID cannot be empty"));
        }
        if self.node_id.is_empty() {
            return Err(anyhow::anyhow!("Node ID cannot be empty"));
        }
        if self.public_key.is_empty() {
            return Err(anyhow::anyhow!("Public key cannot be empty"));
        }
        Ok(())
    }
}

impl BridgeConnection {
    pub fn new(
        remote_team_id: String,
        bridge_id: String,
        security_level: SecurityLevel,
        connection_info: BridgeConnectionInfo,
    ) -> Self {
        let now = chrono::Utc::now().timestamp() as u64;
        Self {
            remote_team_id,
            bridge_id,
            established_at: now,
            last_activity: now,
            security_level,
            status: BridgeStatus::Establishing,
            connection_info,
        }
    }

    pub fn update_activity(&mut self) {
        self.last_activity = chrono::Utc::now().timestamp() as u64;
    }

    pub fn is_active(&self) -> bool {
        matches!(self.status, BridgeStatus::Active)
    }

    pub fn is_expired(&self, timeout_seconds: u64) -> bool {
        let current_time = chrono::Utc::now().timestamp() as u64;
        current_time.saturating_sub(self.last_activity) > timeout_seconds
    }
}

impl BridgeDiscoveryMessage {
    pub fn new_team_announcement(
        source_team_id: String,
        node_id: String,
        announcement: &TeamAnnouncement,
    ) -> Result<Self> {
        let mut payload_data = HashMap::new();
        payload_data.insert(
            "announcement".to_string(),
            serde_json::to_value(announcement)?,
        );

        Ok(Self {
            message_type: DiscoveryMessageType::TeamAnnouncement,
            source_team_id,
            target_team_id: None,
            node_id,
            timestamp: chrono::Utc::now().timestamp() as u64,
            payload: DiscoveryPayload { data: payload_data },
        })
    }

    pub fn new_bridge_request(
        source_team_id: String,
        target_team_id: String,
        request: &BridgeRequest,
    ) -> Result<Self> {
        let mut payload_data = HashMap::new();
        payload_data.insert(
            "request".to_string(),
            serde_json::to_value(request)?,
        );

        Ok(Self {
            message_type: DiscoveryMessageType::BridgeRequest,
            source_team_id,
            target_team_id: Some(target_team_id),
            node_id: request.source_team_id.clone(),
            timestamp: chrono::Utc::now().timestamp() as u64,
            payload: DiscoveryPayload { data: payload_data },
        })
    }

    pub fn new_bridge_response(
        source_team_id: String,
        target_team_id: String,
        response_data: &serde_json::Value,
    ) -> Result<Self> {
        let mut payload_data = HashMap::new();
        payload_data.insert(
            "response".to_string(),
            response_data.clone(),
        );

        Ok(Self {
            message_type: DiscoveryMessageType::BridgeResponse,
            source_team_id: source_team_id.clone(),
            target_team_id: Some(target_team_id),
            node_id: source_team_id, // Use source as node_id
            timestamp: chrono::Utc::now().timestamp() as u64,
            payload: DiscoveryPayload { data: payload_data },
        })
    }

    pub fn new_bridge_request_legacy(
        source_team_id: String,
        target_team_id: String,
        node_id: String,
        bridge_info: &BridgeConnectionInfo,
    ) -> Result<Self> {
        let mut payload_data = HashMap::new();
        payload_data.insert(
            "bridge_info".to_string(),
            serde_json::to_value(bridge_info)?,
        );

        Ok(Self {
            message_type: DiscoveryMessageType::BridgeRequest,
            source_team_id,
            target_team_id: Some(target_team_id),
            node_id,
            timestamp: chrono::Utc::now().timestamp() as u64,
            payload: DiscoveryPayload { data: payload_data },
        })
    }

    pub fn validate(&self) -> Result<()> {
        if self.source_team_id.is_empty() {
            return Err(anyhow::anyhow!("Source team ID cannot be empty"));
        }
        if self.node_id.is_empty() {
            return Err(anyhow::anyhow!("Node ID cannot be empty"));
        }
        Ok(())
    }
}

impl Default for NodeMetrics {
    fn default() -> Self {
        Self {
            latency_ms: 0,
            uptime_percentage: 0.0,
            message_throughput: 0,
            last_updated: chrono::Utc::now().timestamp() as u64,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_team_announcement_creation() {
        let announcement = TeamAnnouncement::new(
            "team1".to_string(),
            "node1".to_string(),
            vec!["relay".to_string(), "ipfs".to_string()],
            SecurityLevel::Unclassified,
            "pubkey123".to_string(),
        );

        assert_eq!(announcement.team_id, "team1");
        assert_eq!(announcement.node_id, "node1");
        assert!(announcement.validate().is_ok());
    }

    #[test]
    fn test_bridge_connection_activity() {
        let connection_info = BridgeConnectionInfo {
            remote_address: "127.0.0.1".to_string(),
            remote_port: 8082,
            local_port: 8083,
            encryption_enabled: true,
            protocol_version: "1.0".to_string(),
        };

        let mut bridge = BridgeConnection::new(
            "team2".to_string(),
            "bridge1".to_string(),
            SecurityLevel::Unclassified,
            connection_info,
        );

        assert!(!bridge.is_active());
        bridge.status = BridgeStatus::Active;
        assert!(bridge.is_active());

        let old_activity = bridge.last_activity;
        std::thread::sleep(std::time::Duration::from_millis(10));
        bridge.update_activity();
        assert!(bridge.last_activity > old_activity);
    }

    #[test]
    fn test_discovery_message_validation() {
        let announcement = TeamAnnouncement::new(
            "team1".to_string(),
            "node1".to_string(),
            vec!["relay".to_string()],
            SecurityLevel::Unclassified,
            "pubkey123".to_string(),
        );

        let message = BridgeDiscoveryMessage::new_team_announcement(
            "team1".to_string(),
            "node1".to_string(),
            &announcement,
        ).unwrap();

        assert!(message.validate().is_ok());
        assert_eq!(message.source_team_id, "team1");
        assert!(matches!(message.message_type, DiscoveryMessageType::TeamAnnouncement));
    }
}
