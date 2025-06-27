use anyhow::Result;
use std::sync::Arc;
use std::net::SocketAddr;
use tracing::{info, debug, warn};
use serde::{Serialize, Deserialize};

use crate::clean_subnet::{CleanSubnet, SubnetRole, SubnetResource, ResourceType, SubnetStatus};
use crate::clean_gateway::{CleanGateway, GatewayRequest, GatewayResponse, GatewayAction, 
                          GatewayProtocol, AccessPolicy, NetworkPattern, AccessCondition,
                          NostrToHttpTranslator, HttpToNostrTranslator, GatewayStatus};

/// NetworkCoordinator - The ONLY place where Subnet and Gateway interact
/// This demonstrates clean composition without coupling
#[derive(Clone)]
pub struct NetworkCoordinator {
    node_id: String,
    node_address: SocketAddr,
    
    /// Optional subnet membership (this node might be part of a team)
    subnet: Option<Arc<CleanSubnet>>,
    
    /// Optional gateway capabilities (this node might provide protocol translation)
    gateway: Option<Arc<CleanGateway>>,
}

/// The main RelayNode with clean separation
pub struct CleanRelayNode {
    node_id: String,
    bind_address: SocketAddr,
    
    /// Network coordinator handles subnet/gateway composition
    network_coordinator: NetworkCoordinator,
    
    // Core services would go here (Nostr, IPFS, etc.)
    // nostr_relay: Arc<NostrRelay>,
    // ipfs_node: Arc<IPFSNode>,
    // security_layer: Arc<SecurityLayer>,
}

impl NetworkCoordinator {
    pub fn new(node_id: String, node_address: SocketAddr) -> Self {
        Self {
            node_id,
            node_address,
            subnet: None,
            gateway: None,
        }
    }

    /// Join a subnet (become a team member)
    pub async fn join_subnet(&mut self, subnet_id: String, subnet_name: String, public_key: String, role: SubnetRole) -> Result<()> {
        let subnet = Arc::new(CleanSubnet::new(subnet_id.clone(), subnet_name, public_key.clone(), self.node_address));
        
        // If we're not the initial leader, we'd join an existing subnet
        // For demo purposes, we're creating a new subnet
        if !matches!(role, SubnetRole::Leader) {
            subnet.add_member(public_key, self.node_address, role).await?;
        }
        
        self.subnet = Some(subnet);
        
        info!("🏠 Node {} joined subnet {}", self.node_id, subnet_id);
        Ok(())
    }

    /// Enable gateway capabilities (become a protocol bridge)
    pub async fn enable_gateway(&mut self, gateway_id: String, policies: Vec<AccessPolicy>) -> Result<()> {
        let mut gateway = CleanGateway::new(gateway_id)
            .add_protocol(GatewayProtocol::NostrWebSocket)
            .add_protocol(GatewayProtocol::HttpRest)
            .add_protocol(GatewayProtocol::IpfsLibp2p);
        
        // Add protocol translators
        gateway = gateway.add_translator(
            GatewayProtocol::NostrWebSocket, 
            GatewayProtocol::HttpRest, 
            Box::new(NostrToHttpTranslator)
        );
        
        gateway = gateway.add_translator(
            GatewayProtocol::HttpRest, 
            GatewayProtocol::NostrWebSocket, 
            Box::new(HttpToNostrTranslator)
        );
        
        // Add access policies
        for policy in policies {
            gateway = gateway.add_policy(policy);
        }
        
        self.gateway = Some(Arc::new(gateway));
        
        info!("🚪 Node {} enabled gateway capabilities", self.node_id);
        Ok(())
    }

    /// Handle an external request - this is where subnet and gateway compose
    pub async fn handle_external_request(&self, request: GatewayRequest) -> Result<GatewayResponse> {
        info!("📨 Handling external request: {} from {} to {}", 
              request.request_id, request.source_network, request.target_network);

        // Step 1: If we have a gateway, use it to validate and translate the request
        if let Some(gateway) = &self.gateway {
            // Process through gateway (includes access control and protocol translation)
            let response = gateway.process_request(request).await?;
            
            // Step 2: If the request was for our subnet, handle it internally
            if let Some(subnet) = &self.subnet {
                let subnet_status = subnet.get_status().await;
                if response.request_id.contains(&subnet_status.subnet_id) {
                    return self.handle_internal_subnet_request(response).await;
                }
            }
            
            // Step 3: External request handled by gateway
            return Ok(response);
        }

        // No gateway available for external requests
        Err(anyhow::anyhow!("No gateway available for external requests"))
    }

    /// Handle internal subnet operations
    async fn handle_internal_subnet_request(&self, gateway_response: GatewayResponse) -> Result<GatewayResponse> {
        if let Some(subnet) = &self.subnet {
            // This is where we'd integrate gateway responses with subnet operations
            // For demo purposes, just log the interaction
            
            info!("🔗 Gateway response being handled by subnet: {}", gateway_response.request_id);
            
            // Example: If this was an intelligence sharing request, we'd create a subnet resource
            let resource = SubnetResource {
                resource_id: format!("resource_{}", gateway_response.request_id),
                resource_type: ResourceType::IntelligenceReport,
                title: "External Intelligence Report".to_string(),
                data: gateway_response.payload.clone(),
                shared_with: vec![], // Would be populated based on the request
                created_by: "gateway".to_string(),
                created_at: crate::clean_subnet::utils::now_timestamp(),
                classification: "UNCLASSIFIED".to_string(),
            };
            
            // Share with all subnet members (simplified for demo)
            let members = subnet.get_members().await;
            let member_keys: Vec<String> = members.iter().map(|m| m.public_key.clone()).collect();
            
            if !member_keys.is_empty() {
                subnet.share_resource(resource, &member_keys).await?;
            }
            
            Ok(gateway_response)
        } else {
            Err(anyhow::anyhow!("No subnet available for internal requests"))
        }
    }

    /// Share intelligence with another team (goes through gateway)
    pub async fn share_intelligence_with_team(&self, target_team: &str, intel_data: Vec<u8>) -> Result<String> {
        if let Some(gateway) = &self.gateway {
            if let Some(subnet) = &self.subnet {
                let subnet_status = subnet.get_status().await;
                
                let request = GatewayRequest {
                    request_id: uuid::Uuid::new_v4().to_string(),
                    source_network: subnet_status.subnet_id,
                    target_network: target_team.to_string(),
                    protocol: GatewayProtocol::NostrWebSocket,
                    action: GatewayAction::ShareIntelligence,
                    payload: intel_data,
                    metadata: std::collections::HashMap::new(),
                    timestamp: crate::clean_subnet::utils::now_timestamp(),
                };
                
                let response = gateway.process_request(request).await?;
                
                match response.status {
                    crate::clean_gateway::GatewayResponseStatus::Success => {
                        info!("✅ Intelligence shared with team {} successfully", target_team);
                        Ok(response.request_id)
                    }
                    _ => {
                        warn!("❌ Failed to share intelligence with team {}: {:?}", target_team, response.status);
                        Err(anyhow::anyhow!("Intelligence sharing failed"))
                    }
                }
            } else {
                Err(anyhow::anyhow!("Node is not part of any subnet"))
            }
        } else {
            Err(anyhow::anyhow!("Node does not have gateway capabilities"))
        }
    }

    /// Get comprehensive node status
    pub async fn get_status(&self) -> NodeStatus {
        let subnet_status = if let Some(subnet) = &self.subnet {
            Some(subnet.get_status().await)
        } else {
            None
        };

        let gateway_status = if let Some(gateway) = &self.gateway {
            Some(gateway.get_status().await)
        } else {
            None
        };

        NodeStatus {
            node_id: self.node_id.clone(),
            node_address: self.node_address,
            node_type: self.determine_node_type(),
            subnet_status,
            gateway_status,
        }
    }

    /// Determine what type of node this is
    fn determine_node_type(&self) -> NodeType {
        match (&self.subnet, &self.gateway) {
            (Some(_), Some(_)) => NodeType::SubnetGateway,
            (Some(_), None) => NodeType::SubnetMember,
            (None, Some(_)) => NodeType::ProtocolGateway,
            (None, None) => NodeType::BasicRelay,
        }
    }

    /// Perform maintenance tasks
    pub async fn perform_maintenance(&self) -> Result<()> {
        if let Some(subnet) = &self.subnet {
            subnet.cleanup_old_resources().await?;
        }
        
        if let Some(gateway) = &self.gateway {
            gateway.cleanup_expired_sessions().await?;
        }
        
        Ok(())
    }
}

impl CleanRelayNode {
    pub fn new(node_id: String, bind_address: SocketAddr) -> Self {
        let coordinator = NetworkCoordinator::new(node_id.clone(), bind_address);
        
        Self {
            node_id,
            bind_address,
            network_coordinator: coordinator,
        }
    }

    /// Configure this node as a subnet member
    pub async fn join_subnet(&mut self, subnet_id: String, subnet_name: String, public_key: String, role: SubnetRole) -> Result<()> {
        self.network_coordinator.join_subnet(subnet_id, subnet_name, public_key, role).await
    }

    /// Configure this node as a gateway
    pub async fn enable_gateway(&mut self, gateway_id: String, policies: Vec<AccessPolicy>) -> Result<()> {
        self.network_coordinator.enable_gateway(gateway_id, policies).await
    }

    /// Start the relay node
    pub async fn start(&self) -> Result<()> {
        info!("🚀 Starting CleanRelayNode {} on {}", self.node_id, self.bind_address);
        
        let status = self.network_coordinator.get_status().await;
        info!("📊 Node type: {:?}", status.node_type);
        
        if let Some(subnet_status) = status.subnet_status {
            info!("🏠 Subnet: {} ({}) with {} members", 
                  subnet_status.subnet_id, subnet_status.subnet_name, subnet_status.total_members);
        }
        
        if status.gateway_status.is_some() {
            info!("🚪 Gateway capabilities enabled");
        }
        
        // Start maintenance task
        let coordinator = self.network_coordinator.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
            loop {
                interval.tick().await;
                if let Err(e) = coordinator.perform_maintenance().await {
                    warn!("Maintenance task failed: {}", e);
                }
            }
        });
        
        Ok(())
    }

    /// Handle external requests
    pub async fn handle_request(&self, request: GatewayRequest) -> Result<GatewayResponse> {
        self.network_coordinator.handle_external_request(request).await
    }

    /// Share intelligence (if this node has both subnet and gateway)
    pub async fn share_intelligence(&self, target_team: &str, intel_data: Vec<u8>) -> Result<String> {
        self.network_coordinator.share_intelligence_with_team(target_team, intel_data).await
    }

    /// Get node status
    pub async fn get_status(&self) -> NodeStatus {
        self.network_coordinator.get_status().await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeStatus {
    pub node_id: String,
    pub node_address: SocketAddr,
    pub node_type: NodeType,
    pub subnet_status: Option<SubnetStatus>,
    pub gateway_status: Option<GatewayStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeType {
    SubnetMember,     // Part of a subnet, no gateway
    ProtocolGateway,  // Gateway only, not part of any subnet
    SubnetGateway,    // Both subnet member AND gateway
    BasicRelay,       // Neither subnet nor gateway
}

// Example usage demonstrations
pub mod examples {
    use super::*;

    /// Example: Team member node (subnet only)
    pub async fn create_team_member_node() -> Result<CleanRelayNode> {
        let mut node = CleanRelayNode::new(
            "team-alpha-member-1".to_string(), 
            "127.0.0.1:8080".parse()?
        );
        
        // This node is just a team member
        node.join_subnet(
            "team-alpha".to_string(),
            "Alpha Investigation Team".to_string(),
            "alice-pubkey".to_string(),
            SubnetRole::Member
        ).await?;
        
        Ok(node)
    }

    /// Example: Protocol gateway node (gateway only)
    pub async fn create_protocol_gateway_node() -> Result<CleanRelayNode> {
        let mut node = CleanRelayNode::new(
            "protocol-gateway-1".to_string(), 
            "127.0.0.1:8081".parse()?
        );
        
        // This node is just a protocol gateway
        let policies = vec![
            AccessPolicy {
                policy_id: "inter-team-sharing".to_string(),
                source_network: NetworkPattern::Team("any".to_string()),
                target_network: NetworkPattern::Team("any".to_string()),
                allowed_actions: vec![GatewayAction::ShareIntelligence],
                conditions: vec![AccessCondition::RequireApproval],
                priority: 1,
            }
        ];
        
        node.enable_gateway("inter-team-gateway".to_string(), policies).await?;
        
        Ok(node)
    }

    /// Example: Team leader node (both subnet and gateway)
    pub async fn create_team_leader_node() -> Result<CleanRelayNode> {
        let mut node = CleanRelayNode::new(
            "team-alpha-leader".to_string(), 
            "127.0.0.1:8082".parse()?
        );
        
        // This node is both a team leader AND has gateway capabilities
        node.join_subnet(
            "team-alpha".to_string(),
            "Alpha Investigation Team".to_string(),
            "leader-pubkey".to_string(),
            SubnetRole::Leader
        ).await?;
        
        let policies = vec![
            AccessPolicy {
                policy_id: "team-alpha-external".to_string(),
                source_network: NetworkPattern::External,
                target_network: NetworkPattern::Exact("team-alpha".to_string()),
                allowed_actions: vec![GatewayAction::ShareIntelligence, GatewayAction::RequestInformation],
                conditions: vec![AccessCondition::RequireApproval, AccessCondition::SourceAuthenticated],
                priority: 10,
            }
        ];
        
        node.enable_gateway("team-alpha-gateway".to_string(), policies).await?;
        
        Ok(node)
    }

    /// Demonstrate clean interaction between subnet and gateway
    pub async fn demonstrate_clean_interaction() -> Result<()> {
        // Create a team leader node (has both subnet and gateway)
        let leader_node = create_team_leader_node().await?;
        leader_node.start().await?;
        
        // Simulate external intelligence sharing request
        let intel_request = GatewayRequest {
            request_id: "intel-001".to_string(),
            source_network: "team-beta".to_string(),
            target_network: "team-alpha".to_string(),
            protocol: GatewayProtocol::NostrWebSocket,
            action: GatewayAction::ShareIntelligence,
            payload: b"Classified intelligence report".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: crate::clean_subnet::utils::now_timestamp(),
        };
        
        // Process the request - gateway handles external concerns, subnet handles internal
        let response = leader_node.handle_request(intel_request).await?;
        
        info!("🔗 Clean interaction complete: {:?}", response.status);
        
        Ok(())
    }
}

// Add uuid dependency for request IDs
#[cfg(not(feature = "uuid"))]
mod uuid {
    pub struct Uuid;
    impl Uuid {
        pub fn new_v4() -> Self { Self }
        pub fn to_string(&self) -> String {
            format!("uuid-{}", std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos())
        }
    }
}
