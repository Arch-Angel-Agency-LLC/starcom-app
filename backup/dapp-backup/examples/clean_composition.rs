use anyhow::Result;
use std::sync::Arc;
use std::net::SocketAddr;
use tokio::sync::RwLock;

// Import our clean components
use crate::examples::clean_subnet::{Subnet, NetworkTopology, MemberRole, SubnetStatus};
use crate::examples::clean_gateway::{Gateway, Request, Response, Protocol, Action, AccessPolicy, NetworkPattern, Condition};

/// Clean composition - this is the ONLY place where Subnet and Gateway interact
pub struct NetworkCoordinator {
    /// Optional subnet membership (this node might be part of a team)
    subnet: Option<Arc<Subnet>>,
    
    /// Optional gateway capabilities (this node might provide protocol translation)
    gateway: Option<Arc<Gateway>>,
    
    /// Node identity
    node_id: String,
}

/// The actual RelayNode with clean separation
pub struct CleanRelayNode {
    /// Core services (always present)
    node_id: String,
    bind_address: SocketAddr,
    
    /// Optional subnet membership
    subnet: Option<Arc<Subnet>>,
    
    /// Optional gateway capabilities  
    gateway: Option<Arc<Gateway>>,
    
    /// Coordination layer (where subnet and gateway compose)
    network_coordinator: Arc<NetworkCoordinator>,
}

impl NetworkCoordinator {
    pub fn new(node_id: String) -> Self {
        Self {
            subnet: None,
            gateway: None,
            node_id,
        }
    }

    /// Join a subnet (become a team member)
    pub async fn join_subnet(&mut self, subnet: Arc<Subnet>, public_key: String, node_address: SocketAddr, role: MemberRole) -> Result<()> {
        // Add ourselves to the subnet
        subnet.add_member(public_key, node_address, role).await?;
        self.subnet = Some(subnet);
        
        tracing::info!("🏠 Node {} joined subnet", self.node_id);
        Ok(())
    }

    /// Enable gateway capabilities (become a protocol bridge)
    pub async fn enable_gateway(&mut self, gateway: Arc<Gateway>) -> Result<()> {
        self.gateway = Some(gateway);
        
        tracing::info!("🚪 Node {} enabled gateway capabilities", self.node_id);
        Ok(())
    }

    /// Handle an external request - this is where subnet and gateway compose
    pub async fn handle_external_request(&self, request: Request) -> Result<Response> {
        tracing::info!("📨 Handling external request: {} from {}", request.request_id, request.source_network);

        // Step 1: If we have a gateway, use it to validate and translate the request
        if let Some(gateway) = &self.gateway {
            // Check access policy
            let access_decision = gateway.enforce_access_policy(&request).await?;
            
            if access_decision.is_denied() {
                return Ok(Response {
                    request_id: request.request_id,
                    status: crate::examples::clean_gateway::ResponseStatus::AccessDenied(access_decision.reason()),
                    payload: vec![],
                    metadata: std::collections::HashMap::new(),
                });
            }

            // Translate protocol if needed
            let translated_request = gateway.translate_request(request, 
                request.protocol.clone(), 
                Protocol::NostrWebSocket).await?;

            // Step 2: If request is for our subnet, handle internally
            if let Some(subnet) = &self.subnet {
                let subnet_status = subnet.get_status().await;
                if translated_request.target_network == subnet_status.subnet_id {
                    return self.handle_internal_request(translated_request).await;
                }
            }

            // Step 3: If request is for external network, route externally
            return gateway.route_to_target(translated_request, &translated_request.target_network).await;
        }

        // No gateway available
        Err(anyhow::anyhow!("No gateway available for external requests"))
    }

    /// Handle internal subnet request
    async fn handle_internal_request(&self, request: Request) -> Result<Response> {
        if let Some(subnet) = &self.subnet {
            match request.action {
                Action::ShareIntelligence => {
                    // Handle intelligence sharing within subnet
                    tracing::info!("📊 Sharing intelligence within subnet");
                    
                    // This would integrate with actual subnet resource sharing
                    Ok(Response {
                        request_id: request.request_id,
                        status: crate::examples::clean_gateway::ResponseStatus::Success,
                        payload: b"Intelligence shared within subnet".to_vec(),
                        metadata: std::collections::HashMap::new(),
                    })
                }
                Action::RequestInformation => {
                    // Handle information request within subnet
                    tracing::info!("🔍 Processing information request within subnet");
                    
                    Ok(Response {
                        request_id: request.request_id,
                        status: crate::examples::clean_gateway::ResponseStatus::Success,
                        payload: b"Information retrieved from subnet".to_vec(),
                        metadata: std::collections::HashMap::new(),
                    })
                }
                _ => {
                    Err(anyhow::anyhow!("Unsupported action for internal request: {:?}", request.action))
                }
            }
        } else {
            Err(anyhow::anyhow!("No subnet available for internal requests"))
        }
    }

    /// Get node status (shows both subnet and gateway status)
    pub async fn get_status(&self) -> NodeStatus {
        let subnet_status = if let Some(subnet) = &self.subnet {
            Some(subnet.get_status().await)
        } else {
            None
        };

        let gateway_enabled = self.gateway.is_some();

        NodeStatus {
            node_id: self.node_id.clone(),
            subnet_status,
            gateway_enabled,
            node_type: self.determine_node_type(),
        }
    }

    fn determine_node_type(&self) -> NodeType {
        match (&self.subnet, &self.gateway) {
            (Some(_), Some(_)) => NodeType::SubnetGateway,
            (Some(_), None) => NodeType::SubnetMember,
            (None, Some(_)) => NodeType::ProtocolGateway,
            (None, None) => NodeType::BasicRelay,
        }
    }
}

impl CleanRelayNode {
    pub fn new(node_id: String, bind_address: SocketAddr) -> Self {
        let coordinator = Arc::new(NetworkCoordinator::new(node_id.clone()));
        
        Self {
            node_id,
            bind_address,
            subnet: None,
            gateway: None,
            network_coordinator: coordinator,
        }
    }

    /// Configure this node as a subnet member
    pub async fn join_subnet(&mut self, subnet_id: String, public_key: String, role: MemberRole) -> Result<()> {
        let subnet = Arc::new(Subnet::new(subnet_id, NetworkTopology::Mesh));
        subnet.add_member(public_key.clone(), self.bind_address, role).await?;
        
        self.subnet = Some(subnet.clone());
        
        // Update coordinator
        let mut coordinator = Arc::try_unwrap(self.network_coordinator.clone())
            .map_err(|_| anyhow::anyhow!("Failed to get coordinator"))?;
        coordinator.join_subnet(subnet, public_key, self.bind_address, role).await?;
        self.network_coordinator = Arc::new(coordinator);
        
        Ok(())
    }

    /// Configure this node as a gateway
    pub async fn enable_gateway(&mut self, gateway_id: String, policies: Vec<AccessPolicy>) -> Result<()> {
        let mut gateway = Gateway::new(gateway_id)
            .add_protocol(Protocol::NostrWebSocket)
            .add_protocol(Protocol::HttpRest);
        
        for policy in policies {
            gateway = gateway.add_policy(policy);
        }
        
        let gateway = Arc::new(gateway);
        self.gateway = Some(gateway.clone());
        
        // Update coordinator
        let mut coordinator = Arc::try_unwrap(self.network_coordinator.clone())
            .map_err(|_| anyhow::anyhow!("Failed to get coordinator"))?;
        coordinator.enable_gateway(gateway).await?;
        self.network_coordinator = Arc::new(coordinator);
        
        Ok(())
    }

    /// Start the relay node
    pub async fn start(&self) -> Result<()> {
        tracing::info!("🚀 Starting CleanRelayNode {} on {}", self.node_id, self.bind_address);
        
        let status = self.network_coordinator.get_status().await;
        tracing::info!("📊 Node type: {:?}", status.node_type);
        
        if let Some(subnet_status) = status.subnet_status {
            tracing::info!("🏠 Subnet: {} with {} members", subnet_status.subnet_id, subnet_status.member_count);
        }
        
        if status.gateway_enabled {
            tracing::info!("🚪 Gateway capabilities enabled");
        }
        
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct NodeStatus {
    pub node_id: String,
    pub subnet_status: Option<SubnetStatus>,
    pub gateway_enabled: bool,
    pub node_type: NodeType,
}

#[derive(Debug, Clone)]
pub enum NodeType {
    SubnetMember,     // Part of a subnet, no gateway
    ProtocolGateway,  // Gateway only, not part of any subnet
    SubnetGateway,    // Both subnet member AND gateway
    BasicRelay,       // Neither subnet nor gateway
}

// Example usage functions
pub async fn example_team_member_node() -> Result<()> {
    let mut node = CleanRelayNode::new("team-alpha-member-1".to_string(), "127.0.0.1:8080".parse()?);
    
    // This node is just a team member
    node.join_subnet("team-alpha".to_string(), "alice-pubkey".to_string(), MemberRole::Member).await?;
    
    node.start().await?;
    Ok(())
}

pub async fn example_gateway_node() -> Result<()> {
    let mut node = CleanRelayNode::new("protocol-gateway-1".to_string(), "127.0.0.1:8081".parse()?);
    
    // This node is just a protocol gateway
    let policies = vec![
        AccessPolicy {
            source_network: NetworkPattern::Team("beta".to_string()),
            target_network: NetworkPattern::Team("alpha".to_string()),
            allowed_actions: vec![Action::ShareIntelligence],
            conditions: vec![Condition::RequireApproval],
        }
    ];
    
    node.enable_gateway("inter-team-gateway".to_string(), policies).await?;
    
    node.start().await?;
    Ok(())
}

pub async fn example_team_leader_node() -> Result<()> {
    let mut node = CleanRelayNode::new("team-alpha-leader".to_string(), "127.0.0.1:8082".parse()?);
    
    // This node is both a team member AND a gateway
    node.join_subnet("team-alpha".to_string(), "leader-pubkey".to_string(), MemberRole::Leader).await?;
    
    let policies = vec![
        AccessPolicy {
            source_network: NetworkPattern::Any,
            target_network: NetworkPattern::Exact("team-alpha".to_string()),
            allowed_actions: vec![Action::ShareIntelligence, Action::RequestInformation],
            conditions: vec![Condition::RequireApproval],
        }
    ];
    
    node.enable_gateway("team-alpha-gateway".to_string(), policies).await?;
    
    node.start().await?;
    Ok(())
}
