use anyhow::Result;
use std::net::SocketAddr;

use ai_security_relaynode::{
    CleanRelayNode, SubnetRole, AccessPolicy, NetworkPattern, 
    GatewayAction, AccessCondition, GatewayRequest, GatewayProtocol
};

/// Practical examples demonstrating the clean subnet-gateway separation
/// Run with: cargo run --example clean_architecture_demo

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    println!("🚀 Clean Subnet-Gateway Architecture Demo\n");

    // Demonstrate the four deployment patterns
    demo_deployment_patterns().await?;
    
    // Demonstrate clean interactions
    demo_clean_interactions().await?;
    
    println!("\n✅ Clean architecture demonstration complete!");
    Ok(())
}

/// Demonstrate the four clean deployment patterns
async fn demo_deployment_patterns() -> Result<()> {
    println!("📊 Demonstrating Four Clean Deployment Patterns\n");

    // Pattern 1: Subnet-Only Node (Team Member)
    println!("🏠 Pattern 1: Subnet-Only Node (Team Member)");
    let team_member = create_team_member_node().await?;
    team_member.start().await?;
    
    let status = team_member.get_status().await;
    println!("   Status: {:?} with subnet but no gateway\n", status.node_type);

    // Pattern 2: Gateway-Only Node (Protocol Bridge)
    println!("🚪 Pattern 2: Gateway-Only Node (Protocol Bridge)");
    let protocol_gateway = create_protocol_gateway_node().await?;
    protocol_gateway.start().await?;
    
    let status = protocol_gateway.get_status().await;
    println!("   Status: {:?} with gateway but no subnet\n", status.node_type);

    // Pattern 3: Subnet + Gateway Node (Team Leader)
    println!("👑 Pattern 3: Subnet + Gateway Node (Team Leader)");
    let team_leader = create_team_leader_node().await?;
    team_leader.start().await?;
    
    let status = team_leader.get_status().await;
    println!("   Status: {:?} with both subnet and gateway\n", status.node_type);

    // Pattern 4: Basic Relay Node
    println!("📡 Pattern 4: Basic Relay Node");
    let basic_relay = CleanRelayNode::new("basic-relay".to_string(), "127.0.0.1:8083".parse()?);
    basic_relay.start().await?;
    
    let status = basic_relay.get_status().await;
    println!("   Status: {:?} with neither subnet nor gateway\n", status.node_type);

    Ok(())
}

/// Demonstrate clean interactions between components
async fn demo_clean_interactions() -> Result<()> {
    println!("🔗 Demonstrating Clean Component Interactions\n");

    // Create a team leader node (has both subnet and gateway)
    let leader_node = create_team_leader_node().await?;
    leader_node.start().await?;

    // Demonstrate internal subnet operation
    println!("1️⃣ Internal subnet operation (no gateway involved):");
    let status = leader_node.get_status().await;
    if let Some(subnet_status) = status.subnet_status {
        println!("   Subnet '{}' has {} members", subnet_status.subnet_name, subnet_status.total_members);
    }

    // Demonstrate external request handling (gateway processes, then subnet stores)
    println!("2️⃣ External request handling (gateway → subnet coordination):");
    let external_request = create_sample_external_request();
    let response = leader_node.handle_request(external_request).await?;
    println!("   Gateway processed external request: {:?}", response.status);

    // Demonstrate intelligence sharing (subnet → gateway → external)
    println!("3️⃣ Intelligence sharing (subnet → gateway → external):");
    let intel_data = b"Corruption evidence from Team Alpha".to_vec();
    match leader_node.share_intelligence("team-beta", intel_data).await {
        Ok(request_id) => println!("   Intelligence shared successfully: {}", request_id),
        Err(e) => println!("   Intelligence sharing failed: {}", e),
    }

    println!();
    Ok(())
}

/// Create a subnet-only node (team member)
async fn create_team_member_node() -> Result<CleanRelayNode> {
    let mut node = CleanRelayNode::new(
        "team-alpha-member-1".to_string(),
        "127.0.0.1:8080".parse()?
    );

    // Join subnet as a regular member
    node.join_subnet(
        "team-alpha".to_string(),
        "Alpha Investigation Team".to_string(),
        "alice-pubkey".to_string(),
        SubnetRole::Member
    ).await?;

    Ok(node)
}

/// Create a gateway-only node (protocol bridge)
async fn create_protocol_gateway_node() -> Result<CleanRelayNode> {
    let mut node = CleanRelayNode::new(
        "protocol-gateway-1".to_string(),
        "127.0.0.1:8081".parse()?
    );

    // Enable gateway with inter-team sharing policy
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

/// Create a team leader node (both subnet and gateway)
async fn create_team_leader_node() -> Result<CleanRelayNode> {
    let mut node = CleanRelayNode::new(
        "team-alpha-leader".to_string(),
        "127.0.0.1:8082".parse()?
    );

    // First, join subnet as leader
    node.join_subnet(
        "team-alpha".to_string(),
        "Alpha Investigation Team".to_string(),
        "leader-pubkey".to_string(),
        SubnetRole::Leader
    ).await?;

    // Then, enable gateway capabilities
    let policies = vec![
        AccessPolicy {
            policy_id: "team-alpha-external".to_string(),
            source_network: NetworkPattern::External,
            target_network: NetworkPattern::Exact("team-alpha".to_string()),
            allowed_actions: vec![
                GatewayAction::ShareIntelligence,
                GatewayAction::RequestInformation
            ],
            conditions: vec![
                AccessCondition::RequireApproval,
                AccessCondition::SourceAuthenticated
            ],
            priority: 10,
        },
        AccessPolicy {
            policy_id: "team-alpha-outbound".to_string(),
            source_network: NetworkPattern::Exact("team-alpha".to_string()),
            target_network: NetworkPattern::External,
            allowed_actions: vec![GatewayAction::ShareIntelligence],
            conditions: vec![AccessCondition::ContentScanned],
            priority: 5,
        }
    ];

    node.enable_gateway("team-alpha-gateway".to_string(), policies).await?;

    Ok(node)
}

/// Create a sample external request for demonstration
fn create_sample_external_request() -> GatewayRequest {
    use std::collections::HashMap;

    GatewayRequest {
        request_id: "demo-request-001".to_string(),
        source_network: "team-beta".to_string(),
        target_network: "team-alpha".to_string(),
        protocol: GatewayProtocol::NostrWebSocket,
        action: GatewayAction::ShareIntelligence,
        payload: b"Intelligence report: Corruption evidence from Team Beta".to_vec(),
        metadata: {
            let mut meta = HashMap::new();
            meta.insert("classification".to_string(), "CONFIDENTIAL".to_string());
            meta.insert("source_team".to_string(), "team-beta".to_string());
            meta
        },
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    }
}

/// Practical usage scenarios for Earth Alliance teams
mod earth_alliance_scenarios {
    use super::*;

    /// Scenario: Regional investigation team
    pub async fn setup_regional_investigation_team() -> Result<Vec<CleanRelayNode>> {
        let mut nodes = Vec::new();

        // Team leader with external coordination capabilities
        let mut leader = CleanRelayNode::new("region-1-leader".to_string(), "10.0.1.100:8080".parse()?);
        leader.join_subnet("region-1-investigations".to_string(), "Region 1 Investigations".to_string(),
                          "leader-key".to_string(), SubnetRole::Leader).await?;
        
        let leader_policies = vec![
            AccessPolicy {
                policy_id: "regional-coordination".to_string(),
                source_network: NetworkPattern::Team("region".to_string()),
                target_network: NetworkPattern::Exact("region-1-investigations".to_string()),
                allowed_actions: vec![GatewayAction::ShareIntelligence, GatewayAction::RequestInformation],
                conditions: vec![AccessCondition::RequireApproval],
                priority: 10,
            }
        ];
        leader.enable_gateway("region-1-gateway".to_string(), leader_policies).await?;
        nodes.push(leader);

        // Regular team members (subnet-only)
        for i in 1..=3 {
            let mut member = CleanRelayNode::new(
                format!("region-1-investigator-{}", i),
                format!("10.0.1.{}:8080", 100 + i).parse()?
            );
            member.join_subnet("region-1-investigations".to_string(), "Region 1 Investigations".to_string(),
                              format!("investigator-{}-key", i), SubnetRole::Member).await?;
            nodes.push(member);
        }

        Ok(nodes)
    }

    /// Scenario: Inter-regional coordination infrastructure
    pub async fn setup_inter_regional_gateway() -> Result<CleanRelayNode> {
        let mut gateway = CleanRelayNode::new("inter-regional-gateway".to_string(), "10.0.0.1:8080".parse()?);

        let coordination_policies = vec![
            AccessPolicy {
                policy_id: "region-to-region".to_string(),
                source_network: NetworkPattern::Team("region".to_string()),
                target_network: NetworkPattern::Team("region".to_string()),
                allowed_actions: vec![GatewayAction::ShareIntelligence],
                conditions: vec![AccessCondition::RequireApproval, AccessCondition::ContentScanned],
                priority: 5,
            },
            AccessPolicy {
                policy_id: "external-integration".to_string(),
                source_network: NetworkPattern::Internet,
                target_network: NetworkPattern::Team("region".to_string()),
                allowed_actions: vec![GatewayAction::ReadPublicInfo],
                conditions: vec![AccessCondition::RateLimited(10)],
                priority: 1,
            }
        ];

        gateway.enable_gateway("inter-regional-coordinator".to_string(), coordination_policies).await?;

        Ok(gateway)
    }

    /// Demonstrate the complete Earth Alliance network
    pub async fn demonstrate_earth_alliance_network() -> Result<()> {
        println!("🌍 Earth Alliance Network Demonstration\n");

        // Set up regional teams
        let region_1_team = setup_regional_investigation_team().await?;
        println!("✅ Region 1 investigation team: {} nodes", region_1_team.len());

        // Set up inter-regional coordination
        let coordination_gateway = setup_inter_regional_gateway().await?;
        println!("✅ Inter-regional coordination gateway");

        // Start all nodes
        for node in &region_1_team {
            node.start().await?;
        }
        coordination_gateway.start().await?;

        println!("🚀 Complete Earth Alliance network operational\n");

        // Demonstrate cross-team intelligence sharing
        if let Some(leader) = region_1_team.first() {
            let status = leader.get_status().await;
            println!("📊 Team leader status: {:?}", status.node_type);
            
            // Share intelligence with another region
            let intel = b"Corruption evidence requiring inter-regional coordination".to_vec();
            match leader.share_intelligence("region-2-investigations", intel).await {
                Ok(id) => println!("✅ Inter-regional intelligence shared: {}", id),
                Err(e) => println!("❌ Intelligence sharing failed: {}", e),
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_clean_deployment_patterns() {
        // Test that all four patterns work independently
        let team_member = create_team_member_node().await.unwrap();
        let protocol_gateway = create_protocol_gateway_node().await.unwrap();
        let team_leader = create_team_leader_node().await.unwrap();
        let basic_relay = CleanRelayNode::new("test-basic".to_string(), "127.0.0.1:8999".parse().unwrap());

        // Verify node types
        assert!(matches!(team_member.get_status().await.node_type, ai_security_relaynode::NodeType::SubnetMember));
        assert!(matches!(protocol_gateway.get_status().await.node_type, ai_security_relaynode::NodeType::ProtocolGateway));
        assert!(matches!(team_leader.get_status().await.node_type, ai_security_relaynode::NodeType::SubnetGateway));
        assert!(matches!(basic_relay.get_status().await.node_type, ai_security_relaynode::NodeType::BasicRelay));
    }

    #[tokio::test]
    async fn test_earth_alliance_scenario() {
        // Test the Earth Alliance scenario setup
        let nodes = earth_alliance_scenarios::setup_regional_investigation_team().await.unwrap();
        assert_eq!(nodes.len(), 4); // 1 leader + 3 members

        let gateway = earth_alliance_scenarios::setup_inter_regional_gateway().await.unwrap();
        assert!(matches!(gateway.get_status().await.node_type, ai_security_relaynode::NodeType::ProtocolGateway));
    }
}
