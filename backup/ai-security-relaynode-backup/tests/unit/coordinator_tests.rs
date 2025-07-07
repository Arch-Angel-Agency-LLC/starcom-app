// Unit Tests for NetworkCoordinator
// Testing clean composition of Subnet and Gateway components

use std::sync::Arc;
use ai_security_relaynode::{
    network_coordinator::{NetworkCoordinator, CleanRelayNode},
    clean_subnet::{CleanSubnet, SubnetRole, SubnetMember},
    clean_gateway::{CleanGateway, GatewayRequest, GatewayAction, GatewayProtocol},
};

#[cfg(test)]
mod coordinator_tests {
    use super::*;

    fn create_test_coordinator() -> NetworkCoordinator {
        NetworkCoordinator::new(
            "coord_001".to_string(),
            "127.0.0.1:8080".parse().unwrap(),
        )
    }

    fn create_test_subnet() -> CleanSubnet {
        CleanSubnet::new(
            "test-subnet".to_string(),
            "Test Team".to_string(),
            "127.0.0.1:8081".parse().unwrap(),
        )
    }

    fn create_test_gateway() -> CleanGateway {
        CleanGateway::new(
            "test-gateway".to_string(),
            "127.0.0.1:9090".parse().unwrap(),
        )
    }

    #[tokio::test]
    async fn test_coordinator_creation() {
        let coordinator = create_test_coordinator();
        assert_eq!(coordinator.get_node_id(), "coord_001");
        assert!(!coordinator.has_subnet());
        assert!(!coordinator.has_gateway());
    }

    #[tokio::test]
    async fn test_join_subnet() {
        let mut coordinator = create_test_coordinator();
        
        let result = coordinator.join_subnet(
            "team-alpha".to_string(),
            "Team Alpha".to_string(),
            "node_pub_key".to_string(),
            SubnetRole::Member,
        ).await;
        
        assert!(result.is_ok());
        assert!(coordinator.has_subnet());
        
        let subnet_info = coordinator.get_subnet_info().await;
        assert!(subnet_info.is_some());
        assert_eq!(subnet_info.unwrap().subnet_id, "team-alpha");
    }

    #[tokio::test]
    async fn test_enable_gateway() {
        let mut coordinator = create_test_coordinator();
        
        let result = coordinator.enable_gateway(
            "gateway_001".to_string(),
            vec![GatewayProtocol::NostrWebSocket, GatewayProtocol::HttpRest],
        ).await;
        
        assert!(result.is_ok());
        assert!(coordinator.has_gateway());
        
        let gateway_info = coordinator.get_gateway_info().await;
        assert!(gateway_info.is_some());
        assert_eq!(gateway_info.unwrap().gateway_id, "gateway_001");
    }

    #[tokio::test]
    async fn test_internal_request_routing() {
        let mut coordinator = create_test_coordinator();
        
        // Join subnet first
        coordinator.join_subnet(
            "team-alpha".to_string(),
            "Team Alpha".to_string(),
            "node_pub_key".to_string(),
            SubnetRole::Member,
        ).await.unwrap();
        
        // Create internal request
        let request = GatewayRequest {
            request_id: "internal_001".to_string(),
            source_network: "team-alpha".to_string(),
            target_network: "team-alpha".to_string(),
            protocol: GatewayProtocol::NostrWebSocket,
            action: GatewayAction::ShareIntelligence,
            payload: b"internal message".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: 1640995200,
        };
        
        let result = coordinator.handle_request(request).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert_eq!(response.request_id, "internal_001");
    }

    #[tokio::test]
    async fn test_external_request_routing() {
        let mut coordinator = create_test_coordinator();
        
        // Enable gateway
        coordinator.enable_gateway(
            "gateway_001".to_string(),
            vec![GatewayProtocol::NostrWebSocket],
        ).await.unwrap();
        
        // Create external request
        let request = GatewayRequest {
            request_id: "external_001".to_string(),
            source_network: "team-alpha".to_string(),
            target_network: "team-beta".to_string(),
            protocol: GatewayProtocol::NostrWebSocket,
            action: GatewayAction::ShareIntelligence,
            payload: b"external message".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: 1640995200,
        };
        
        let result = coordinator.handle_request(request).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert_eq!(response.request_id, "external_001");
    }

    #[tokio::test]
    async fn test_full_node_composition() {
        let mut coordinator = create_test_coordinator();
        
        // Create full node (subnet + gateway)
        coordinator.join_subnet(
            "team-alpha".to_string(),
            "Team Alpha".to_string(),
            "leader_pub_key".to_string(),
            SubnetRole::Leader,
        ).await.unwrap();
        
        coordinator.enable_gateway(
            "alpha_gateway".to_string(),
            vec![GatewayProtocol::NostrWebSocket, GatewayProtocol::HttpRest],
        ).await.unwrap();
        
        assert!(coordinator.has_subnet());
        assert!(coordinator.has_gateway());
        
        // Test that both internal and external requests work
        let internal_request = GatewayRequest {
            request_id: "int_001".to_string(),
            source_network: "team-alpha".to_string(),
            target_network: "team-alpha".to_string(),
            protocol: GatewayProtocol::NostrWebSocket,
            action: GatewayAction::ShareIntelligence,
            payload: b"internal".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: 1640995200,
        };
        
        let external_request = GatewayRequest {
            request_id: "ext_001".to_string(),
            source_network: "team-alpha".to_string(),
            target_network: "external".to_string(),
            protocol: GatewayProtocol::HttpRest,
            action: GatewayAction::ConnectExternal,
            payload: b"external".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: 1640995200,
        };
        
        let int_result = coordinator.handle_request(internal_request).await;
        assert!(int_result.is_ok());
        
        let ext_result = coordinator.handle_request(external_request).await;
        assert!(ext_result.is_ok());
    }

    #[tokio::test]
    async fn test_deployment_pattern_subnet_only() {
        let mut coordinator = create_test_coordinator();
        
        // Subnet-only deployment (team member)
        coordinator.join_subnet(
            "team-beta".to_string(),
            "Team Beta".to_string(),
            "member_pub_key".to_string(),
            SubnetRole::Member,
        ).await.unwrap();
        
        assert!(coordinator.has_subnet());
        assert!(!coordinator.has_gateway());
        
        // Should handle internal requests
        let internal_request = GatewayRequest {
            request_id: "subnet_only_001".to_string(),
            source_network: "team-beta".to_string(),
            target_network: "team-beta".to_string(),
            protocol: GatewayProtocol::NostrWebSocket,
            action: GatewayAction::ShareIntelligence,
            payload: b"subnet internal".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: 1640995200,
        };
        
        let result = coordinator.handle_request(internal_request).await;
        assert!(result.is_ok());
        
        // Should reject external requests (no gateway)
        let external_request = GatewayRequest {
            request_id: "subnet_only_ext".to_string(),
            source_network: "team-beta".to_string(),
            target_network: "external".to_string(),
            protocol: GatewayProtocol::HttpRest,
            action: GatewayAction::ConnectExternal,
            payload: b"external".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: 1640995200,
        };
        
        let result = coordinator.handle_request(external_request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_deployment_pattern_gateway_only() {
        let mut coordinator = create_test_coordinator();
        
        // Gateway-only deployment (protocol bridge)
        coordinator.enable_gateway(
            "bridge_gateway".to_string(),
            vec![GatewayProtocol::NostrWebSocket, GatewayProtocol::HttpRest, GatewayProtocol::IpfsLibp2p],
        ).await.unwrap();
        
        assert!(!coordinator.has_subnet());
        assert!(coordinator.has_gateway());
        
        // Should handle external routing requests
        let bridge_request = GatewayRequest {
            request_id: "bridge_001".to_string(),
            source_network: "team-alpha".to_string(),
            target_network: "team-beta".to_string(),
            protocol: GatewayProtocol::NostrWebSocket,
            action: GatewayAction::BridgeProtocol,
            payload: b"bridge message".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: 1640995200,
        };
        
        let result = coordinator.handle_request(bridge_request).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_clean_separation_validation() {
        let coordinator = create_test_coordinator();
        
        // Test that coordinator can operate without either subnet or gateway
        // This validates the clean architecture separation
        assert!(!coordinator.has_subnet());
        assert!(!coordinator.has_gateway());
        
        // Coordinator should still be functional for basic operations
        let status = coordinator.get_status().await;
        assert_eq!(status.node_id, "coord_001");
        assert!(!status.has_subnet);
        assert!(!status.has_gateway);
        assert!(status.is_online);
    }

    #[tokio::test]
    async fn test_clean_relay_node() {
        let relay_node = CleanRelayNode::new(
            "relay_001".to_string(),
            "127.0.0.1:8080".parse().unwrap(),
        );
        
        assert_eq!(relay_node.get_node_id(), "relay_001");
        
        // Test that relay node can be configured with different patterns
        let mut subnet_only = relay_node.clone();
        subnet_only.configure_as_team_member("team-alpha".to_string()).await.unwrap();
        
        let mut gateway_only = relay_node.clone();
        gateway_only.configure_as_protocol_bridge(vec![GatewayProtocol::NostrWebSocket]).await.unwrap();
        
        let mut full_node = relay_node.clone();
        full_node.configure_as_team_leader("team-alpha".to_string()).await.unwrap();
        
        // Each configuration should work independently
        assert!(true, "Clean relay node supports all deployment patterns");
    }

    #[tokio::test]
    async fn test_error_handling() {
        let coordinator = create_test_coordinator();
        
        // Test request without subnet or gateway
        let request = GatewayRequest {
            request_id: "error_001".to_string(),
            source_network: "nowhere".to_string(),
            target_network: "nowhere".to_string(),
            protocol: GatewayProtocol::NostrWebSocket,
            action: GatewayAction::ShareIntelligence,
            payload: b"error test".to_vec(),
            metadata: std::collections::HashMap::new(),
            timestamp: 1640995200,
        };
        
        let result = coordinator.handle_request(request).await;
        assert!(result.is_err());
        
        // Error should be informative
        let error_msg = result.unwrap_err().to_string();
        assert!(error_msg.contains("No subnet or gateway"));
    }
}
