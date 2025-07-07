use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use async_trait::async_trait;

/// Clean Gateway implementation - ONLY handles protocol translation and access control
/// No subnet membership logic, no internal topology concerns
pub struct Gateway {
    gateway_id: String,
    supported_protocols: Vec<Protocol>,
    access_controller: AccessController,
    protocol_translators: HashMap<(Protocol, Protocol), Box<dyn ProtocolTranslator + Send + Sync>>,
}

#[derive(Debug, Clone, Hash, PartialEq, Eq)]
pub enum Protocol {
    NostrWebSocket,
    HttpRest,
    IpfsLibp2p,
    LegacyTcp,
    MeshRadio,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Request {
    pub request_id: String,
    pub source_network: String,
    pub target_network: String,
    pub protocol: Protocol,
    pub action: Action,
    pub payload: Vec<u8>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Response {
    pub request_id: String,
    pub status: ResponseStatus,
    pub payload: Vec<u8>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResponseStatus {
    Success,
    AccessDenied(String),
    ProtocolError(String),
    NetworkUnavailable(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Action {
    ShareIntelligence,
    RequestInformation,
    SendMessage,
    SyncData,
    ReadPublicInfo,
}

/// Protocol translator trait - converts between different protocols
#[async_trait]
pub trait ProtocolTranslator {
    async fn translate(&self, request: Request, from: Protocol, to: Protocol) -> Result<Request>;
}

/// Access controller - enforces policies for external requests
pub struct AccessController {
    policies: Vec<AccessPolicy>,
}

#[derive(Debug, Clone)]
pub struct AccessPolicy {
    pub source_network: NetworkPattern,
    pub target_network: NetworkPattern,
    pub allowed_actions: Vec<Action>,
    pub conditions: Vec<Condition>,
}

#[derive(Debug, Clone)]
pub enum NetworkPattern {
    Exact(String),
    Subnet(String),
    Team(String),
    Internet,
    Any,
}

#[derive(Debug, Clone)]
pub enum Condition {
    RequireApproval,
    RateLimited(u32), // requests per hour
    TimeWindow(u64, u64), // start, end timestamps
    SecurityLevel(String),
}

#[derive(Debug, Clone)]
pub struct AccessDecision {
    allowed: bool,
    reason: Option<String>,
    conditions_met: Vec<Condition>,
}

impl AccessDecision {
    pub fn allowed() -> Self {
        Self { allowed: true, reason: None, conditions_met: vec![] }
    }
    
    pub fn denied(reason: String) -> Self {
        Self { allowed: false, reason: Some(reason), conditions_met: vec![] }
    }
    
    pub fn is_denied(&self) -> bool {
        !self.allowed
    }
    
    pub fn reason(&self) -> String {
        self.reason.clone().unwrap_or_else(|| "No reason provided".to_string())
    }
}

impl Gateway {
    pub fn new(gateway_id: String) -> Self {
        Self {
            gateway_id,
            supported_protocols: vec![],
            access_controller: AccessController::new(),
            protocol_translators: HashMap::new(),
        }
    }

    /// Add support for a protocol
    pub fn add_protocol(mut self, protocol: Protocol) -> Self {
        self.supported_protocols.push(protocol);
        self
    }

    /// Add a protocol translator
    pub fn add_translator(mut self, from: Protocol, to: Protocol, translator: Box<dyn ProtocolTranslator + Send + Sync>) -> Self {
        self.protocol_translators.insert((from, to), translator);
        self
    }

    /// Add an access policy
    pub fn add_policy(mut self, policy: AccessPolicy) -> Self {
        self.access_controller.add_policy(policy);
        self
    }

    /// Translate a request from one protocol to another
    pub async fn translate_request(&self, request: Request, from: Protocol, to: Protocol) -> Result<Request> {
        if from == to {
            return Ok(request); // No translation needed
        }

        if let Some(translator) = self.protocol_translators.get(&(from.clone(), to.clone())) {
            translator.translate(request, from, to).await
        } else {
            Err(anyhow::anyhow!("No translator available for {:?} -> {:?}", from, to))
        }
    }

    /// Enforce access policy for an external request
    pub async fn enforce_access_policy(&self, request: &Request) -> Result<AccessDecision> {
        self.access_controller.check_access(request).await
    }

    /// Route a request to target network (this would integrate with actual networking)
    pub async fn route_to_target(&self, request: Request, target_network: &str) -> Result<Response> {
        // This is where actual network routing would happen
        // For now, just simulate
        tracing::info!("🌐 Routing request {} to network {}", request.request_id, target_network);
        
        Ok(Response {
            request_id: request.request_id,
            status: ResponseStatus::Success,
            payload: b"Response from target network".to_vec(),
            metadata: HashMap::new(),
        })
    }

    // NOTE: What this gateway does NOT do:
    // - Manage subnet membership (that's Subnet)
    // - Handle internal subnet topology (that's Subnet)
    // - Store subnet-specific resources (that's Subnet)
    // - Make decisions about who can join subnets (that's Subnet)
    // - Coordinate internal subnet communications (that's Subnet)
}

impl AccessController {
    pub fn new() -> Self {
        Self {
            policies: vec![],
        }
    }

    pub fn add_policy(&mut self, policy: AccessPolicy) {
        self.policies.push(policy);
    }

    pub async fn check_access(&self, request: &Request) -> Result<AccessDecision> {
        // Check each policy to see if request is allowed
        for policy in &self.policies {
            if self.matches_pattern(&policy.source_network, &request.source_network) &&
               self.matches_pattern(&policy.target_network, &request.target_network) {
                
                if policy.allowed_actions.contains(&request.action) {
                    // Check conditions
                    if self.check_conditions(&policy.conditions, request).await? {
                        return Ok(AccessDecision::allowed());
                    } else {
                        return Ok(AccessDecision::denied("Policy conditions not met".to_string()));
                    }
                }
            }
        }

        // No matching policy found - deny by default
        Ok(AccessDecision::denied("No matching access policy found".to_string()))
    }

    fn matches_pattern(&self, pattern: &NetworkPattern, network: &str) -> bool {
        match pattern {
            NetworkPattern::Exact(exact) => exact == network,
            NetworkPattern::Subnet(subnet_prefix) => network.starts_with(subnet_prefix),
            NetworkPattern::Team(team_prefix) => network.starts_with(&format!("team-{}", team_prefix)),
            NetworkPattern::Internet => network == "internet" || network.starts_with("http"),
            NetworkPattern::Any => true,
        }
    }

    async fn check_conditions(&self, conditions: &[Condition], _request: &Request) -> Result<bool> {
        // For now, just return true
        // In a real implementation, this would check rate limits, time windows, etc.
        for condition in conditions {
            match condition {
                Condition::RequireApproval => {
                    // Would integrate with approval system
                    tracing::info!("⏳ Request requires approval");
                }
                Condition::RateLimited(limit) => {
                    tracing::info!("🚦 Rate limit: {} requests/hour", limit);
                }
                _ => {}
            }
        }
        Ok(true)
    }
}

// Example protocol translator
pub struct NostrToHttpTranslator;

#[async_trait]
impl ProtocolTranslator for NostrToHttpTranslator {
    async fn translate(&self, mut request: Request, _from: Protocol, to: Protocol) -> Result<Request> {
        // Convert Nostr WebSocket request to HTTP REST request
        request.protocol = to;
        request.metadata.insert("translated".to_string(), "nostr-to-http".to_string());
        Ok(request)
    }
}
