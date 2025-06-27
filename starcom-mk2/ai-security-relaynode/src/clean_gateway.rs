use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, debug, warn};
use serde::{Serialize, Deserialize};
use async_trait::async_trait;

/// Clean Gateway implementation - ONLY handles protocol translation and external access control
/// This extracts gateway concerns from the coupled SubnetManager
pub struct CleanGateway {
    gateway_id: String,
    supported_protocols: Vec<GatewayProtocol>,
    access_controller: AccessController,
    protocol_translators: HashMap<(GatewayProtocol, GatewayProtocol), Box<dyn ProtocolTranslator + Send + Sync>>,
    active_sessions: Arc<RwLock<HashMap<String, GatewaySession>>>,
    gateway_config: GatewayConfiguration,
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub enum GatewayProtocol {
    NostrWebSocket,
    HttpRest,
    IpfsLibp2p,
    LegacyTcp,
    MeshRadio,
    Satellite,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayRequest {
    pub request_id: String,
    pub source_network: String,
    pub target_network: String,
    pub protocol: GatewayProtocol,
    pub action: GatewayAction,
    pub payload: Vec<u8>,
    pub metadata: HashMap<String, String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayResponse {
    pub request_id: String,
    pub status: GatewayResponseStatus,
    pub payload: Vec<u8>,
    pub metadata: HashMap<String, String>,
    pub processing_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GatewayResponseStatus {
    Success,
    AccessDenied(String),
    ProtocolError(String),
    NetworkUnavailable(String),
    TranslationFailed(String),
    RateLimited(String),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum GatewayAction {
    ShareIntelligence,
    RequestInformation,
    SendMessage,
    SyncData,
    ReadPublicInfo,
    EstablishBridge,
    TerminateBridge,
}

/// Protocol translator trait for converting between different protocols
pub trait ProtocolTranslator {
    fn translate(&self, request: GatewayRequest, from: GatewayProtocol, to: GatewayProtocol) -> Result<GatewayRequest>;
    fn supports_translation(&self, from: &GatewayProtocol, to: &GatewayProtocol) -> bool;
}

/// Access controller handles external access policies
pub struct AccessController {
    policies: Vec<AccessPolicy>,
    rate_limiters: HashMap<String, RateLimiter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessPolicy {
    pub policy_id: String,
    pub source_network: NetworkPattern,
    pub target_network: NetworkPattern,
    pub allowed_actions: Vec<GatewayAction>,
    pub conditions: Vec<AccessCondition>,
    pub priority: u8, // Higher number = higher priority
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkPattern {
    Exact(String),
    Subnet(String),
    Team(String),
    Internet,
    External,
    Any,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccessCondition {
    RequireApproval,
    RateLimited(u32), // requests per hour
    TimeWindow(u64, u64), // start, end timestamps
    SecurityLevel(String),
    SourceAuthenticated,
    ContentScanned,
}

#[derive(Debug, Clone)]
pub struct AccessDecision {
    pub allowed: bool,
    pub reason: Option<String>,
    pub conditions_applied: Vec<AccessCondition>,
    pub policy_matched: Option<String>,
}

#[derive(Debug, Clone)]
pub struct GatewaySession {
    pub session_id: String,
    pub source_network: String,
    pub target_network: String,
    pub established_at: u64,
    pub expires_at: u64,
    pub request_count: u64,
    pub last_activity: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayConfiguration {
    pub max_concurrent_sessions: usize,
    pub session_timeout_seconds: u64,
    pub enable_content_scanning: bool,
    pub default_rate_limit: u32,
    pub log_all_requests: bool,
}

#[derive(Debug, Clone)]
pub struct RateLimiter {
    requests_per_hour: u32,
    request_timestamps: Vec<u64>,
}

impl CleanGateway {
    pub fn new(gateway_id: String) -> Self {
        Self {
            gateway_id,
            supported_protocols: vec![],
            access_controller: AccessController::new(),
            protocol_translators: HashMap::new(),
            active_sessions: Arc::new(RwLock::new(HashMap::new())),
            gateway_config: GatewayConfiguration::default(),
        }
    }

    /// Add support for a protocol
    pub fn add_protocol(mut self, protocol: GatewayProtocol) -> Self {
        self.supported_protocols.push(protocol);
        self
    }

    /// Add a protocol translator
    pub fn add_translator(mut self, from: GatewayProtocol, to: GatewayProtocol, translator: Box<dyn ProtocolTranslator + Send + Sync>) -> Self {
        self.protocol_translators.insert((from, to), translator);
        self
    }

    /// Add an access policy
    pub fn add_policy(mut self, policy: AccessPolicy) -> Self {
        self.access_controller.add_policy(policy);
        self
    }

    /// Process an external request through the gateway
    pub async fn process_request(&self, request: GatewayRequest) -> Result<GatewayResponse> {
        let start_time = std::time::Instant::now();
        
        info!("🚪 Processing gateway request {} from {} to {}", 
              request.request_id, request.source_network, request.target_network);

        // Step 1: Check access policy
        let access_decision = self.access_controller.check_access(&request).await?;
        
        if !access_decision.allowed {
            return Ok(GatewayResponse {
                request_id: request.request_id,
                status: GatewayResponseStatus::AccessDenied(
                    access_decision.reason.unwrap_or_else(|| "Access denied".to_string())
                ),
                payload: vec![],
                metadata: HashMap::new(),
                processing_time_ms: start_time.elapsed().as_millis() as u64,
            });
        }

        // Step 2: Translate protocol if needed
        let translated_request = self.translate_protocol(request)?;

        // Step 3: Route to target network
        let response = self.route_to_target(translated_request).await?;

        Ok(GatewayResponse {
            request_id: response.request_id,
            status: GatewayResponseStatus::Success,
            payload: response.payload,
            metadata: response.metadata,
            processing_time_ms: start_time.elapsed().as_millis() as u64,
        })
    }

    /// Translate request between protocols
    fn translate_protocol(&self, request: GatewayRequest) -> Result<GatewayRequest> {
        // Determine target protocol based on target network
        let target_protocol = self.determine_target_protocol(&request.target_network);
        
        if request.protocol == target_protocol {
            return Ok(request); // No translation needed
        }

        if let Some(translator) = self.protocol_translators.get(&(request.protocol.clone(), target_protocol.clone())) {
            let from_protocol = request.protocol.clone();
            translator.translate(request, from_protocol, target_protocol)
        } else {
            Err(anyhow::anyhow!("No translator available for {:?} -> {:?}", request.protocol, target_protocol))
        }
    }

    /// Route request to target network
    async fn route_to_target(&self, request: GatewayRequest) -> Result<GatewayResponse> {
        // This would integrate with actual network routing
        // For now, simulate the routing
        debug!("🌐 Routing request {} to network {}", request.request_id, request.target_network);
        
        // Create session for this routing
        self.create_session(&request).await?;
        
        // Simulate network call
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        
        Ok(GatewayResponse {
            request_id: request.request_id,
            status: GatewayResponseStatus::Success,
            payload: b"Response from target network".to_vec(),
            metadata: HashMap::new(),
            processing_time_ms: 10,
        })
    }

    /// Create a gateway session for tracking
    async fn create_session(&self, request: &GatewayRequest) -> Result<()> {
        let session = GatewaySession {
            session_id: format!("{}_{}", request.source_network, request.target_network),
            source_network: request.source_network.clone(),
            target_network: request.target_network.clone(),
            established_at: crate::utils::now_timestamp(),
            expires_at: crate::utils::now_timestamp() + self.gateway_config.session_timeout_seconds,
            request_count: 1,
            last_activity: crate::utils::now_timestamp(),
        };

        let mut sessions = self.active_sessions.write().await;
        sessions.insert(session.session_id.clone(), session);
        
        Ok(())
    }

    /// Determine the appropriate protocol for a target network
    fn determine_target_protocol(&self, target_network: &str) -> GatewayProtocol {
        if target_network.starts_with("http") || target_network.contains("internet") {
            GatewayProtocol::HttpRest
        } else if target_network.contains("mesh") {
            GatewayProtocol::MeshRadio
        } else if target_network.contains("satellite") {
            GatewayProtocol::Satellite
        } else {
            GatewayProtocol::NostrWebSocket // Default
        }
    }

    /// Get gateway status and metrics
    pub async fn get_status(&self) -> GatewayStatus {
        let sessions = self.active_sessions.read().await;
        let active_session_count = sessions.len();
        
        let total_requests: u64 = sessions.values()
            .map(|s| s.request_count)
            .sum();

        GatewayStatus {
            gateway_id: self.gateway_id.clone(),
            supported_protocols: self.supported_protocols.clone(),
            active_sessions: active_session_count,
            total_requests_processed: total_requests,
            policies_count: self.access_controller.policies.len(),
            is_healthy: true,
            uptime_seconds: 0, // TODO: Track actual uptime
        }
    }

    /// Clean up expired sessions
    pub async fn cleanup_expired_sessions(&self) -> Result<()> {
        let now = crate::utils::now_timestamp();
        let mut sessions = self.active_sessions.write().await;
        let initial_count = sessions.len();
        
        sessions.retain(|_, session| session.expires_at > now);
        
        let removed_count = initial_count - sessions.len();
        if removed_count > 0 {
            info!("🧹 Cleaned up {} expired gateway sessions", removed_count);
        }
        
        Ok(())
    }

    // NOTE: What this clean gateway does NOT do:
    // - Manage subnet membership (that's for CleanSubnet)
    // - Handle internal subnet topology (that's for CleanSubnet)
    // - Store subnet-specific resources (that's for CleanSubnet)
    // - Make decisions about who can join subnets (that's for CleanSubnet)
}

impl AccessController {
    pub fn new() -> Self {
        Self {
            policies: vec![],
            rate_limiters: HashMap::new(),
        }
    }

    pub fn add_policy(&mut self, policy: AccessPolicy) {
        // Insert in priority order (higher priority first)
        let insert_pos = self.policies
            .binary_search_by(|p| policy.priority.cmp(&p.priority).reverse())
            .unwrap_or_else(|pos| pos);
        
        self.policies.insert(insert_pos, policy);
    }

    pub async fn check_access(&self, request: &GatewayRequest) -> Result<AccessDecision> {
        // Check rate limiting first
        if let Err(reason) = self.check_rate_limit(&request.source_network).await {
            return Ok(AccessDecision {
                allowed: false,
                reason: Some(reason),
                conditions_applied: vec![],
                policy_matched: None,
            });
        }

        // Check policies in priority order
        for policy in &self.policies {
            if self.matches_pattern(&policy.source_network, &request.source_network) &&
               self.matches_pattern(&policy.target_network, &request.target_network) &&
               policy.allowed_actions.contains(&request.action) {
                
                // Check conditions
                if self.check_conditions(&policy.conditions, request).await? {
                    return Ok(AccessDecision {
                        allowed: true,
                        reason: None,
                        conditions_applied: policy.conditions.clone(),
                        policy_matched: Some(policy.policy_id.clone()),
                    });
                } else {
                    return Ok(AccessDecision {
                        allowed: false,
                        reason: Some("Policy conditions not met".to_string()),
                        conditions_applied: vec![],
                        policy_matched: Some(policy.policy_id.clone()),
                    });
                }
            }
        }

        // No matching policy - deny by default
        Ok(AccessDecision {
            allowed: false,
            reason: Some("No matching access policy found".to_string()),
            conditions_applied: vec![],
            policy_matched: None,
        })
    }

    fn matches_pattern(&self, pattern: &NetworkPattern, network: &str) -> bool {
        match pattern {
            NetworkPattern::Exact(exact) => exact == network,
            NetworkPattern::Subnet(subnet_prefix) => network.starts_with(subnet_prefix),
            NetworkPattern::Team(team_prefix) => network.starts_with(&format!("team-{}", team_prefix)),
            NetworkPattern::Internet => network == "internet" || network.starts_with("http"),
            NetworkPattern::External => !network.starts_with("team-") && !network.starts_with("subnet-"),
            NetworkPattern::Any => true,
        }
    }

    async fn check_conditions(&self, conditions: &[AccessCondition], _request: &GatewayRequest) -> Result<bool> {
        for condition in conditions {
            match condition {
                AccessCondition::RequireApproval => {
                    // In a real implementation, this would check an approval system
                    debug!("⏳ Request requires approval (auto-approved for demo)");
                }
                AccessCondition::RateLimited(limit) => {
                    debug!("🚦 Rate limit check: {} requests/hour", limit);
                }
                AccessCondition::SecurityLevel(_level) => {
                    debug!("🔒 Security level check");
                }
                AccessCondition::SourceAuthenticated => {
                    debug!("🔐 Source authentication check");
                }
                AccessCondition::ContentScanned => {
                    debug!("🔍 Content scanning check");
                }
                _ => {}
            }
        }
        Ok(true) // Simplified for demo
    }

    async fn check_rate_limit(&self, source_network: &str) -> Result<(), String> {
        // Simplified rate limiting - in real implementation would be more sophisticated
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayStatus {
    pub gateway_id: String,
    pub supported_protocols: Vec<GatewayProtocol>,
    pub active_sessions: usize,
    pub total_requests_processed: u64,
    pub policies_count: usize,
    pub is_healthy: bool,
    pub uptime_seconds: u64,
}

impl Default for GatewayConfiguration {
    fn default() -> Self {
        Self {
            max_concurrent_sessions: 100,
            session_timeout_seconds: 3600, // 1 hour
            enable_content_scanning: true,
            default_rate_limit: 100, // requests per hour
            log_all_requests: true,
        }
    }
}

impl AccessDecision {
    pub fn allowed() -> Self {
        Self { 
            allowed: true, 
            reason: None, 
            conditions_applied: vec![], 
            policy_matched: None 
        }
    }
    
    pub fn denied(reason: String) -> Self {
        Self { 
            allowed: false, 
            reason: Some(reason), 
            conditions_applied: vec![], 
            policy_matched: None 
        }
    }
}

// Example protocol translator implementations
pub struct NostrToHttpTranslator;

impl ProtocolTranslator for NostrToHttpTranslator {
    fn translate(&self, mut request: GatewayRequest, _from: GatewayProtocol, to: GatewayProtocol) -> Result<GatewayRequest> {
        request.protocol = to;
        request.metadata.insert("translated_from".to_string(), "nostr".to_string());
        request.metadata.insert("translator".to_string(), "nostr-to-http".to_string());
        Ok(request)
    }

    fn supports_translation(&self, from: &GatewayProtocol, to: &GatewayProtocol) -> bool {
        matches!(from, GatewayProtocol::NostrWebSocket) && matches!(to, GatewayProtocol::HttpRest)
    }
}

pub struct HttpToNostrTranslator;

impl ProtocolTranslator for HttpToNostrTranslator {
    fn translate(&self, mut request: GatewayRequest, _from: GatewayProtocol, to: GatewayProtocol) -> Result<GatewayRequest> {
        request.protocol = to;
        request.metadata.insert("translated_from".to_string(), "http".to_string());
        request.metadata.insert("translator".to_string(), "http-to-nostr".to_string());
        Ok(request)
    }

    fn supports_translation(&self, from: &GatewayProtocol, to: &GatewayProtocol) -> bool {
        matches!(from, GatewayProtocol::HttpRest) && matches!(to, GatewayProtocol::NostrWebSocket)
    }
}
