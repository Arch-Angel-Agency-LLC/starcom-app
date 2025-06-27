use anyhow::Result;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tokio::time::Duration;
use tracing::{info, warn, error, debug};
use uuid::Uuid;

use crate::config::{Config, TeamSubnetConfig, BridgePermissions, SecurityPolicy, SubnetMode};
use crate::subnet_types::{TeamAnnouncement, BridgeDiscoveryMessage, DiscoveryMessageType, BridgeRequest};
use crate::nostr_relay::NostrRelay;

/// Get current UNIX timestamp in seconds
fn now_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

/// Manages subnet operations and team coordination
pub struct SubnetManager {
    config: Arc<Config>,
    team_registry: Arc<RwLock<HashMap<String, DiscoveredTeam>>>,
    active_bridges: Arc<RwLock<HashMap<String, ActiveBridge>>>,
    bridge_coordinator: Arc<BridgeCoordinator>,
    security_gateway: Arc<SecurityGateway>,
}

/// Information about a discovered team in the subnet
#[derive(Debug, Clone)]
pub struct DiscoveredTeam {
    pub team_id: String,
    pub team_name: String,
    pub node_id: String,
    pub announcement: TeamAnnouncement,
    pub last_seen: u64,
    pub security_level: String,
    pub capabilities: Vec<String>,
    pub is_trusted: bool,
}

/// Represents an active bridge connection to another team
#[derive(Debug, Clone)]
pub struct ActiveBridge {
    pub bridge_id: String,
    pub source_team_id: String,
    pub target_team_id: String,
    pub established_at: u64,
    pub expires_at: u64,
    pub status: BridgeStatus,
    pub permissions: BridgePermissions,
    pub message_count: u64,
    pub last_activity: u64,
}

#[derive(Debug, Clone, PartialEq)]
pub enum BridgeStatus {
    Requesting,
    Establishing,
    Active,
    Suspended,
    Terminating,
    Terminated,
}

/// Coordinates bridge establishment and management
pub struct BridgeCoordinator {
    config: Arc<Config>,
    nostr_relay: Arc<NostrRelay>,
    pending_requests: Arc<RwLock<HashMap<String, BridgeRequest>>>,
}

/// Security gateway for access control and content filtering
pub struct SecurityGateway {
    config: Arc<Config>,
    security_policy: SecurityPolicy,
    access_log: Arc<RwLock<Vec<AccessLogEntry>>>,
    threat_detector: ThreatDetector,
}

#[derive(Debug, Clone)]
pub struct AccessLogEntry {
    pub timestamp: u64,
    pub source_team: String,
    pub target_team: String,
    pub action: String,
    pub allowed: bool,
    pub reason: Option<String>,
}

/// Basic threat detection system
pub struct ThreatDetector {
    suspicious_patterns: Vec<String>,
    quarantine_list: Arc<RwLock<Vec<String>>>,
}

impl SubnetManager {
    pub fn new(
        config: Arc<Config>,
        nostr_relay: Arc<NostrRelay>,
    ) -> Self {
        let bridge_coordinator = Arc::new(BridgeCoordinator::new(
            config.clone(),
            nostr_relay.clone(),
        ));
        
        let security_gateway = Arc::new(SecurityGateway::new(
            config.clone(),
            config.team_subnet.security_policy.clone(),
        ));

        Self {
            config,
            team_registry: Arc::new(RwLock::new(HashMap::new())),
            active_bridges: Arc::new(RwLock::new(HashMap::new())),
            bridge_coordinator,
            security_gateway,
        }
    }

    /// Start subnet management services
    pub async fn start(&self) -> Result<()> {
        info!("🏠 Starting Subnet Manager");

        // Start team discovery cleanup task
        self.start_team_cleanup_task().await;
        
        // Start bridge maintenance task
        self.start_bridge_maintenance_task().await;
        
        // Start security monitoring
        self.security_gateway.start_monitoring().await?;

        info!("✅ Subnet Manager started successfully");
        Ok(())
    }

    /// Register a discovered team
    pub async fn register_team(&self, announcement: TeamAnnouncement) -> Result<()> {
        let team_id = announcement.team_id.clone();
        let is_trusted = self.is_team_trusted(&team_id);
        
        let discovered_team = DiscoveredTeam {
            team_id: team_id.clone(),
            team_name: announcement.team_id.clone(), // TODO: Get actual team name
            node_id: announcement.node_id.clone(),
            announcement: announcement.clone(),
            last_seen: now_timestamp(),
            security_level: format!("{:?}", announcement.security_level),
            capabilities: announcement.capabilities.clone(),
            is_trusted,
        };

        {
            let mut registry = self.team_registry.write().unwrap();
            registry.insert(team_id.clone(), discovered_team);
        }

        info!("📝 Registered team: {} (trusted: {})", team_id, is_trusted);

        // If this is a trusted team in bridged mode, consider auto-establishing bridge
        if is_trusted && self.config.team_subnet.subnet_mode == SubnetMode::Bridged {
            if let Err(e) = self.consider_auto_bridge(&team_id).await {
                warn!("Failed to consider auto-bridge for team {}: {}", team_id, e);
            }
        }

        Ok(())
    }

    /// Request a bridge to another team
    pub async fn request_bridge(
        &self,
        target_team_id: &str,
        request_type: &str,
        justification: Option<String>,
    ) -> Result<String> {
        // Check if target team is discovered
        let target_exists = {
            let registry = self.team_registry.read().unwrap();
            registry.contains_key(target_team_id)
        };

        if !target_exists {
            return Err(anyhow::anyhow!("Target team {} not discovered", target_team_id));
        }

        // Check permissions
        if !self.can_request_bridge(target_team_id, request_type)? {
            return Err(anyhow::anyhow!(
                "Bridge request not allowed to team {} for type {}", 
                target_team_id, request_type
            ));
        }

        let request_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp() as u64;
        let bridge_request = BridgeRequest {
            request_id: request_id.clone(),
            source_team_id: self.config.team_subnet.team_id.clone(),
            target_team_id: target_team_id.to_string(),
            requested_at: now,
            expires_at: now + 3600, // 1 hour expiry
            request_type: request_type.to_string(),
            justification,
            requires_approval: self.config.team_subnet.bridge_permissions.require_approval,
            approved: None,
        };

        // Store pending request
        {
            let mut pending = self.bridge_coordinator.pending_requests.write().unwrap();
            pending.insert(request_id.clone(), bridge_request.clone());
        }

        // Send bridge request message
        self.bridge_coordinator.send_bridge_request(&bridge_request).await?;

        info!("🌉 Bridge request sent to team {}: {}", target_team_id, request_id);
        Ok(request_id)
    }

    /// Handle incoming bridge request
    pub async fn handle_bridge_request(
        &self,
        request: BridgeRequest,
    ) -> Result<bool> {
        info!("🌉 Handling bridge request from team: {}", request.source_team_id);

        // Security check
        if !self.security_gateway.allow_bridge_request(&request).await? {
            info!("🛡️ Bridge request denied by security gateway");
            self.bridge_coordinator.send_bridge_response(&request, false, Some("Security policy violation".to_string())).await?;
            return Ok(false);
        }

        // Check if auto-approval is enabled
        let auto_approve = !request.requires_approval && 
                          self.is_team_trusted(&request.source_team_id);

        if auto_approve {
            self.approve_bridge_request(&request.request_id, true).await?;
            info!("✅ Auto-approved bridge request: {}", request.request_id);
            Ok(true)
        } else {
            info!("⏳ Bridge request requires manual approval: {}", request.request_id);
            // TODO: Notify dApp for manual approval
            Ok(false)
        }
    }

    /// Approve or deny a bridge request
    pub async fn approve_bridge_request(
        &self,
        request_id: &str,
        approved: bool,
    ) -> Result<()> {
        let request = {
            let mut pending = self.bridge_coordinator.pending_requests.write().unwrap();
            match pending.get_mut(request_id) {
                Some(req) => {
                    req.approved = Some(approved);
                    req.clone()
                }
                None => return Err(anyhow::anyhow!("Bridge request {} not found", request_id)),
            }
        };

        if approved {
            // Establish the bridge
            self.establish_bridge(&request).await?;
            info!("✅ Bridge request approved and established: {}", request_id);
        } else {
            info!("❌ Bridge request denied: {}", request_id);
        }

        // Send response
        self.bridge_coordinator.send_bridge_response(&request, approved, None).await?;

        // Clean up pending request
        {
            let mut pending = self.bridge_coordinator.pending_requests.write().unwrap();
            pending.remove(request_id);
        }

        Ok(())
    }

    /// Establish an active bridge
    async fn establish_bridge(&self, request: &BridgeRequest) -> Result<String> {
        let bridge_id = Uuid::new_v4().to_string();
        let duration_secs = self.config.team_subnet.bridge_permissions.bridge_duration_hours as u64 * 3600;
        let now = now_timestamp();

        let active_bridge = ActiveBridge {
            bridge_id: bridge_id.clone(),
            source_team_id: request.source_team_id.clone(),
            target_team_id: request.target_team_id.clone(),
            established_at: now,
            expires_at: now + duration_secs,
            status: BridgeStatus::Active,
            permissions: self.config.team_subnet.bridge_permissions.clone(),
            message_count: 0,
            last_activity: now,
        };

        {
            let mut bridges = self.active_bridges.write().unwrap();
            bridges.insert(bridge_id.clone(), active_bridge);
        }

        info!("🌉 Established bridge: {} between {} and {}", 
              bridge_id, request.source_team_id, request.target_team_id);

        Ok(bridge_id)
    }

    /// Check if a team is trusted
    fn is_team_trusted(&self, team_id: &str) -> bool {
        self.config.team_subnet.trusted_teams.contains(&team_id.to_string())
    }

    /// Check if bridge request is allowed
    fn can_request_bridge(&self, target_team_id: &str, request_type: &str) -> Result<bool> {
        let permissions = &self.config.team_subnet.bridge_permissions;
        
        // Check if incoming requests are allowed at all
        if !permissions.allow_incoming_requests {
            return Ok(false);
        }

        // Check if this request type is allowed
        if !permissions.allowed_request_types.contains(&request_type.to_string()) {
            return Ok(false);
        }

        // Check concurrent bridge limit
        let active_count = {
            let bridges = self.active_bridges.read().unwrap();
            bridges.values().filter(|b| b.status == BridgeStatus::Active).count()
        };

        if active_count >= permissions.max_concurrent_bridges as usize {
            return Ok(false);
        }

        Ok(true)
    }

    /// Consider auto-establishing bridge with trusted team
    async fn consider_auto_bridge(&self, team_id: &str) -> Result<()> {
        debug!("Considering auto-bridge with trusted team: {}", team_id);
        
        // Check if we already have an active bridge
        let has_bridge = {
            let bridges = self.active_bridges.read().unwrap();
            bridges.values().any(|b| 
                (b.source_team_id == *team_id || b.target_team_id == *team_id) &&
                b.status == BridgeStatus::Active
            )
        };

        if !has_bridge {
            // Request bridge for intelligence sharing
            if let Err(e) = self.request_bridge(
                team_id, 
                "intelligence_sharing", 
                Some("Auto-bridge with trusted team".to_string())
            ).await {
                warn!("Failed to auto-request bridge with {}: {}", team_id, e);
            }
        }

        Ok(())
    }

    /// Start task to clean up stale team entries
    async fn start_team_cleanup_task(&self) {
        let registry = self.team_registry.clone();
        let cleanup_interval = Duration::from_secs(300); // 5 minutes
        let stale_threshold_secs = 1800; // 30 minutes

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(cleanup_interval);
            
            loop {
                interval.tick().await;
                
                let now = now_timestamp();
                let mut to_remove = Vec::new();
                
                {
                    let registry_read = registry.read().unwrap();
                    for (team_id, team) in registry_read.iter() {
                        if now.saturating_sub(team.last_seen) > stale_threshold_secs {
                            to_remove.push(team_id.clone());
                        }
                    }
                }
                
                if !to_remove.is_empty() {
                    let mut registry_write = registry.write().unwrap();
                    for team_id in to_remove {
                        registry_write.remove(&team_id);
                        debug!("🧹 Cleaned up stale team: {}", team_id);
                    }
                }
            }
        });
    }

    /// Start task to maintain active bridges
    async fn start_bridge_maintenance_task(&self) {
        let bridges = self.active_bridges.clone();
        let maintenance_interval = Duration::from_secs(60); // 1 minute

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(maintenance_interval);
            
            loop {
                interval.tick().await;
                
                let now = now_timestamp();
                let mut to_terminate = Vec::new();
                
                {
                    let bridges_read = bridges.read().unwrap();
                    for (bridge_id, bridge) in bridges_read.iter() {
                        if now > bridge.expires_at {
                            to_terminate.push(bridge_id.clone());
                        }
                    }
                }
                
                if !to_terminate.is_empty() {
                    let mut bridges_write = bridges.write().unwrap();
                    for bridge_id in to_terminate {
                        if let Some(mut bridge) = bridges_write.get_mut(&bridge_id) {
                            bridge.status = BridgeStatus::Terminated;
                            info!("⏰ Bridge expired: {}", bridge_id);
                        }
                    }
                }
            }
        });
    }

    /// Get current subnet status
    pub fn get_status(&self) -> SubnetStatus {
        let registry = self.team_registry.read().unwrap();
        let bridges = self.active_bridges.read().unwrap();
        
        SubnetStatus {
            team_id: self.config.team_subnet.team_id.clone(),
            team_name: self.config.team_subnet.team_name.clone(),
            subnet_mode: self.config.team_subnet.subnet_mode.clone(),
            discovered_teams: registry.len(),
            active_bridges: bridges.values().filter(|b| b.status == BridgeStatus::Active).count(),
            security_level: format!("{:?}", self.config.team_subnet.security_level),
            is_healthy: true, // TODO: Implement health checks
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetStatus {
    pub team_id: String,
    pub team_name: String,
    pub subnet_mode: SubnetMode,
    pub discovered_teams: usize,
    pub active_bridges: usize,
    pub security_level: String,
    pub is_healthy: bool,
}

impl BridgeCoordinator {
    pub fn new(config: Arc<Config>, nostr_relay: Arc<NostrRelay>) -> Self {
        Self {
            config,
            nostr_relay,
            pending_requests: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    async fn send_bridge_request(&self, request: &BridgeRequest) -> Result<()> {
        let message = BridgeDiscoveryMessage::new_bridge_request(
            request.source_team_id.clone(),
            request.target_team_id.clone(),
            request,
        )?;

        self.broadcast_discovery_message(&message).await?;
        Ok(())
    }

    async fn send_bridge_response(
        &self,
        request: &BridgeRequest,
        approved: bool,
        reason: Option<String>,
    ) -> Result<()> {
        let response_data = serde_json::json!({
            "request_id": request.request_id,
            "approved": approved,
            "reason": reason
        });

        let message = BridgeDiscoveryMessage::new_bridge_response(
            self.config.team_subnet.team_id.clone(),
            request.source_team_id.clone(),
            &response_data,
        )?;

        self.broadcast_discovery_message(&message).await?;
        Ok(())
    }

    async fn broadcast_discovery_message(&self, message: &BridgeDiscoveryMessage) -> Result<()> {
        use tokio::net::UdpSocket;
        
        let socket = UdpSocket::bind("0.0.0.0:0").await?;
        socket.set_broadcast(true)?;
        
        let message_data = serde_json::to_vec(message)?;
        let broadcast_addr = "255.255.255.255:8082";
        
        socket.send_to(&message_data, broadcast_addr).await?;
        debug!("📡 Broadcasted discovery message");
        
        Ok(())
    }
}

impl SecurityGateway {
    pub fn new(config: Arc<Config>, security_policy: SecurityPolicy) -> Self {
        let threat_detector = ThreatDetector {
            suspicious_patterns: vec![
                "malware".to_string(),
                "exploit".to_string(),
                "backdoor".to_string(),
            ],
            quarantine_list: Arc::new(RwLock::new(Vec::new())),
        };

        Self {
            config,
            security_policy,
            access_log: Arc::new(RwLock::new(Vec::new())),
            threat_detector,
        }
    }

    pub async fn start_monitoring(&self) -> Result<()> {
        info!("🛡️ Starting security monitoring");
        // TODO: Implement background monitoring tasks
        Ok(())
    }

    pub async fn allow_bridge_request(&self, request: &BridgeRequest) -> Result<bool> {
        // Check if team is quarantined
        {
            let quarantine = self.threat_detector.quarantine_list.read().unwrap();
            if quarantine.contains(&request.source_team_id) {
                self.log_access(request, false, Some("Team quarantined".to_string())).await;
                return Ok(false);
            }
        }

        // Content scanning if enabled
        if self.security_policy.content_scanning {
            if let Some(justification) = &request.justification {
                if self.threat_detector.scan_content(justification) {
                    self.log_access(request, false, Some("Suspicious content detected".to_string())).await;
                    return Ok(false);
                }
            }
        }

        self.log_access(request, true, None).await;
        Ok(true)
    }

    async fn log_access(&self, request: &BridgeRequest, allowed: bool, reason: Option<String>) {
        if self.security_policy.access_logging {
            let entry = AccessLogEntry {
                timestamp: now_timestamp(),
                source_team: request.source_team_id.clone(),
                target_team: request.target_team_id.clone(),
                action: "bridge_request".to_string(),
                allowed,
                reason,
            };

            let mut log = self.access_log.write().unwrap();
            log.push(entry);

            // Keep only last 1000 entries
            if log.len() > 1000 {
                log.drain(..100);
            }
        }
    }
}

impl ThreatDetector {
    fn scan_content(&self, content: &str) -> bool {
        let content_lower = content.to_lowercase();
        self.suspicious_patterns.iter().any(|pattern| content_lower.contains(pattern))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{Config, SecurityLevel};

    #[tokio::test]
    async fn test_subnet_manager_creation() {
        let config = Arc::new(Config::default());
        let nostr_relay = Arc::new(NostrRelay::new(config.clone()).await.unwrap());
        
        let subnet_manager = SubnetManager::new(config, nostr_relay);
        let status = subnet_manager.get_status();
        
        assert_eq!(status.discovered_teams, 0);
        assert_eq!(status.active_bridges, 0);
    }

    #[tokio::test]
    async fn test_team_registration() {
        let config = Arc::new(Config::default());
        let nostr_relay = Arc::new(NostrRelay::new(config.clone()).await.unwrap());
        let subnet_manager = SubnetManager::new(config, nostr_relay);

        let announcement = TeamAnnouncement::new(
            "test_team".to_string(),
            "test_node".to_string(),
            vec!["test_capability".to_string()],
            SecurityLevel::Unclassified,
            "test_pubkey".to_string(),
        );

        subnet_manager.register_team(announcement).await.unwrap();
        let status = subnet_manager.get_status();
        
        assert_eq!(status.discovered_teams, 1);
    }
}
