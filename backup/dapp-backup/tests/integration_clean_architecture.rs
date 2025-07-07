// Integration Tests for Clean Subnet-Gateway Architecture
// Tests all four deployment patterns and their interactions

use std::time::Duration;
use tokio::time::sleep;
use anyhow::Result;

// Import modules under test
use ai_security_relaynode::{
    clean_config::CleanConfig,
    clean_subnet::CleanSubnet,
    clean_gateway::CleanGateway,
    network_coordinator::NetworkCoordinator,
};

#[cfg(test)]
mod integration_tests {
    use super::*;
    
    /// Test Suite 1: Subnet-Only Node Functionality
    mod subnet_only_tests {
        use super::*;
        
        #[tokio::test]
        async fn test_single_node_subnet_initialization() {
            let config = CleanConfig::subnet_only("test-team-alpha".to_string());
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            
            assert!(coordinator.has_subnet());
            assert!(!coordinator.has_gateway());
            
            // Start the coordinator
            coordinator.start().await.unwrap();
            
            // Verify subnet is operational
            let subnet = coordinator.get_subnet().unwrap();
            assert_eq!(subnet.get_team_id(), "test-team-alpha");
            assert!(subnet.is_active());
            
            // Cleanup
            coordinator.stop().await.unwrap();
        }
        
        #[tokio::test]
        async fn test_multi_node_subnet_formation() {
            // Create leader node
            let leader_config = CleanConfig::subnet_leader("test-team-bravo".to_string());
            let leader = NetworkCoordinator::from_config(leader_config).unwrap();
            
            // Create member nodes
            let member1_config = CleanConfig::subnet_member(
                "test-team-bravo".to_string(), 
                "127.0.0.1:8080".to_string()
            );
            let member1 = NetworkCoordinator::from_config(member1_config).unwrap();
            
            let member2_config = CleanConfig::subnet_member(
                "test-team-bravo".to_string(),
                "127.0.0.1:8080".to_string()
            );
            let member2 = NetworkCoordinator::from_config(member2_config).unwrap();
            
            // Start nodes
            leader.start().await.unwrap();
            sleep(Duration::from_millis(100)).await;
            
            member1.start().await.unwrap();
            sleep(Duration::from_millis(100)).await;
            
            member2.start().await.unwrap();
            sleep(Duration::from_millis(500)).await; // Allow time for discovery
            
            // Verify subnet formation
            let leader_subnet = leader.get_subnet().unwrap();
            assert_eq!(leader_subnet.member_count(), 3); // leader + 2 members
            
            let member1_subnet = member1.get_subnet().unwrap();
            assert_eq!(member1_subnet.member_count(), 3);
            
            // Test internal communication
            let test_message = "Hello team!".to_string();
            leader_subnet.broadcast_message("test-broadcast", &test_message).await.unwrap();
            
            sleep(Duration::from_millis(200)).await;
            
            // Verify message received by members
            assert!(member1_subnet.has_received_message("test-broadcast").await);
            assert!(member2.get_subnet().unwrap().has_received_message("test-broadcast").await);
            
            // Cleanup
            leader.stop().await.unwrap();
            member1.stop().await.unwrap();
            member2.stop().await.unwrap();
        }
        
        #[tokio::test]
        async fn test_subnet_membership_management() {
            let config = CleanConfig::subnet_leader("test-team-charlie".to_string());
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            
            coordinator.start().await.unwrap();
            
            let subnet = coordinator.get_subnet().unwrap();
            
            // Test adding members
            let member_id = "member-001";
            let member_info = subnet.create_member_info(member_id, "Alice", "analyst");
            subnet.add_member(member_info).await.unwrap();
            
            assert!(subnet.has_member(member_id));
            assert_eq!(subnet.member_count(), 2); // leader + 1 member
            
            // Test removing members
            subnet.remove_member(member_id).await.unwrap();
            assert!(!subnet.has_member(member_id));
            assert_eq!(subnet.member_count(), 1); // leader only
            
            coordinator.stop().await.unwrap();
        }
    }
    
    /// Test Suite 2: Gateway-Only Node Functionality
    mod gateway_only_tests {
        use super::*;
        
        #[tokio::test]
        async fn test_gateway_initialization() {
            let config = CleanConfig::gateway_only(vec!["http".to_string(), "websocket".to_string()]);
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            
            assert!(!coordinator.has_subnet());
            assert!(coordinator.has_gateway());
            
            coordinator.start().await.unwrap();
            
            let gateway = coordinator.get_gateway().unwrap();
            assert!(gateway.supports_protocol("http"));
            assert!(gateway.supports_protocol("websocket"));
            assert!(!gateway.supports_protocol("grpc"));
            
            coordinator.stop().await.unwrap();
        }
        
        #[tokio::test]
        async fn test_http_protocol_translation() {
            let config = CleanConfig::gateway_only(vec!["http".to_string()]);
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            
            coordinator.start().await.unwrap();
            
            let gateway = coordinator.get_gateway().unwrap();
            
            // Test HTTP request translation
            let http_request = create_mock_http_request("GET", "/api/v1/status", None);
            let internal_message = gateway.translate_inbound(http_request).await.unwrap();
            
            assert_eq!(internal_message.service, "status");
            assert_eq!(internal_message.method, "get");
            assert_eq!(internal_message.path, "/api/v1/status");
            
            // Test response translation
            let internal_response = create_mock_internal_response("status", "ok", Some("System operational"));
            let http_response = gateway.translate_outbound(internal_response).await.unwrap();
            
            assert_eq!(http_response.status_code, 200);
            assert!(http_response.body.contains("System operational"));
            
            coordinator.stop().await.unwrap();
        }
        
        #[tokio::test]
        async fn test_access_control_policies() {
            let mut config = CleanConfig::gateway_only(vec!["http".to_string()]);
            
            // Configure strict access control
            if let Some(ref mut gateway_config) = config.gateway {
                gateway_config.access_control = Some("strict".to_string());
                gateway_config.require_authentication = Some(true);
            }
            
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            coordinator.start().await.unwrap();
            
            let gateway = coordinator.get_gateway().unwrap();
            
            // Test unauthenticated request is blocked
            let unauth_request = create_mock_http_request("GET", "/api/v1/secure", None);
            let result = gateway.process_request(unauth_request).await;
            
            assert!(result.is_err());
            assert!(result.unwrap_err().to_string().contains("authentication required"));
            
            // Test authenticated request succeeds
            let auth_request = create_mock_http_request(
                "GET", 
                "/api/v1/secure", 
                Some("Bearer valid-jwt-token")
            );
            let result = gateway.process_request(auth_request).await;
            
            assert!(result.is_ok());
            
            coordinator.stop().await.unwrap();
        }
        
        #[tokio::test]
        async fn test_rate_limiting() {
            let mut config = CleanConfig::gateway_only(vec!["http".to_string()]);
            
            // Configure rate limiting
            if let Some(ref mut gateway_config) = config.gateway {
                gateway_config.rate_limit_requests_per_minute = Some(5);
            }
            
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            coordinator.start().await.unwrap();
            
            let gateway = coordinator.get_gateway().unwrap();
            
            // Send requests within limit
            for i in 0..5 {
                let request = create_mock_http_request("GET", &format!("/api/v1/test/{}", i), None);
                let result = gateway.process_request(request).await;
                assert!(result.is_ok(), "Request {} should succeed", i);
            }
            
            // Next request should be rate limited
            let request = create_mock_http_request("GET", "/api/v1/test/6", None);
            let result = gateway.process_request(request).await;
            
            assert!(result.is_err());
            assert!(result.unwrap_err().to_string().contains("rate limit exceeded"));
            
            coordinator.stop().await.unwrap();
        }
    }
    
    /// Test Suite 3: Combined Node Functionality
    mod combined_node_tests {
        use super::*;
        
        #[tokio::test]
        async fn test_combined_node_initialization() {
            let config = CleanConfig::combined(
                "test-team-delta".to_string(),
                vec!["http".to_string(), "websocket".to_string()]
            );
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            
            assert!(coordinator.has_subnet());
            assert!(coordinator.has_gateway());
            
            coordinator.start().await.unwrap();
            
            // Verify both subnet and gateway are operational
            let subnet = coordinator.get_subnet().unwrap();
            let gateway = coordinator.get_gateway().unwrap();
            
            assert_eq!(subnet.get_team_id(), "test-team-delta");
            assert!(gateway.supports_protocol("http"));
            assert!(gateway.supports_protocol("websocket"));
            
            coordinator.stop().await.unwrap();
        }
        
        #[tokio::test]
        async fn test_internal_external_communication_flow() {
            // Setup combined node
            let combined_config = CleanConfig::combined(
                "test-team-echo".to_string(),
                vec!["http".to_string()]
            );
            let combined_node = NetworkCoordinator::from_config(combined_config).unwrap();
            
            // Setup subnet-only member
            let member_config = CleanConfig::subnet_member(
                "test-team-echo".to_string(),
                "127.0.0.1:8080".to_string()
            );
            let member_node = NetworkCoordinator::from_config(member_config).unwrap();
            
            // Start nodes
            combined_node.start().await.unwrap();
            sleep(Duration::from_millis(100)).await;
            
            member_node.start().await.unwrap();
            sleep(Duration::from_millis(300)).await; // Allow subnet formation
            
            // Test external request -> gateway -> subnet -> member
            let gateway = combined_node.get_gateway().unwrap();
            let external_request = create_mock_http_request("POST", "/api/v1/intelligence", Some("classified-data"));
            
            let response = gateway.process_request(external_request).await.unwrap();
            assert_eq!(response.status_code, 200);
            
            sleep(Duration::from_millis(200)).await; // Allow message propagation
            
            // Verify member received the intelligence
            let member_subnet = member_node.get_subnet().unwrap();
            assert!(member_subnet.has_received_message("intelligence").await);
            
            // Test member response -> subnet -> gateway -> external
            let member_response = "Intelligence analyzed: Medium threat level";
            member_subnet.send_response("intelligence", member_response).await.unwrap();
            
            sleep(Duration::from_millis(200)).await;
            
            // Verify gateway can retrieve the response
            let internal_response = gateway.get_pending_response("intelligence").await.unwrap();
            assert!(internal_response.contains("Medium threat level"));
            
            // Cleanup
            combined_node.stop().await.unwrap();
            member_node.stop().await.unwrap();
        }
        
        #[tokio::test]
        async fn test_resource_sharing_between_subnet_and_gateway() {
            let config = CleanConfig::combined(
                "test-team-foxtrot".to_string(),
                vec!["http".to_string()]
            );
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            
            coordinator.start().await.unwrap();
            
            let subnet = coordinator.get_subnet().unwrap();
            let gateway = coordinator.get_gateway().unwrap();
            
            // Test shared authentication context
            let auth_token = "shared-team-token";
            subnet.set_team_authentication(auth_token).await.unwrap();
            
            // Gateway should have access to team authentication
            assert!(gateway.validate_team_token(auth_token).await.unwrap());
            
            // Test shared team member information
            let member_info = subnet.create_member_info("member-002", "Bob", "operator");
            subnet.add_member(member_info.clone()).await.unwrap();
            
            // Gateway should know about team members for access control
            assert!(gateway.is_team_member("member-002").await.unwrap());
            
            coordinator.stop().await.unwrap();
        }
    }
    
    /// Test Suite 4: Pure Relay Node Functionality
    mod pure_relay_tests {
        use super::*;
        
        #[tokio::test]
        async fn test_pure_relay_initialization() {
            let config = CleanConfig::pure_relay();
            let coordinator = NetworkCoordinator::from_config(config).unwrap();
            
            assert!(!coordinator.has_subnet());
            assert!(!coordinator.has_gateway());
            assert!(coordinator.has_relay());
            
            coordinator.start().await.unwrap();
            
            let relay = coordinator.get_relay().unwrap();
            assert!(relay.is_active());
            assert_eq!(relay.get_routing_table_size(), 0); // Initially empty
            
            coordinator.stop().await.unwrap();
        }
        
        #[tokio::test]
        async fn test_message_routing_through_relay() {
            // Setup: relay node between two subnet nodes
            let relay_config = CleanConfig::pure_relay();
            let relay_node = NetworkCoordinator::from_config(relay_config).unwrap();
            
            let subnet1_config = CleanConfig::subnet_only("team-golf".to_string());
            let subnet1_node = NetworkCoordinator::from_config(subnet1_config).unwrap();
            
            let subnet2_config = CleanConfig::subnet_only("team-hotel".to_string());
            let subnet2_node = NetworkCoordinator::from_config(subnet2_config).unwrap();
            
            // Start nodes
            relay_node.start().await.unwrap();
            sleep(Duration::from_millis(100)).await;
            
            subnet1_node.start().await.unwrap();
            subnet2_node.start().await.unwrap();
            sleep(Duration::from_millis(300)).await; // Allow discovery
            
            // Test message routing
            let subnet1 = subnet1_node.get_subnet().unwrap();
            let subnet2 = subnet2_node.get_subnet().unwrap();
            
            // Send message from team-golf to team-hotel via relay
            let inter_team_message = "Requesting intelligence sharing authorization";
            subnet1.send_inter_team_message("team-hotel", "bridge-request", inter_team_message).await.unwrap();
            
            sleep(Duration::from_millis(300)).await; // Allow routing
            
            // Verify relay handled the routing
            let relay = relay_node.get_relay().unwrap();
            assert!(relay.get_routing_table_size() > 0);
            assert!(relay.has_routed_message("bridge-request").await);
            
            // Verify message arrived at destination
            assert!(subnet2.has_received_inter_team_message("bridge-request").await);
            
            // Cleanup
            relay_node.stop().await.unwrap();
            subnet1_node.stop().await.unwrap();
            subnet2_node.stop().await.unwrap();
        }
    }
    
    /// Helper functions for creating mock data
    fn create_mock_http_request(method: &str, path: &str, auth_header: Option<&str>) -> MockHttpRequest {
        let mut headers = std::collections::HashMap::new();
        if let Some(auth) = auth_header {
            headers.insert("Authorization".to_string(), auth.to_string());
        }
        
        MockHttpRequest {
            method: method.to_string(),
            path: path.to_string(),
            headers,
            body: Vec::new(),
        }
    }
    
    fn create_mock_internal_response(service: &str, status: &str, data: Option<&str>) -> MockInternalResponse {
        MockInternalResponse {
            service: service.to_string(),
            status: status.to_string(),
            data: data.map(|s| s.to_string()),
            timestamp: std::time::SystemTime::now(),
        }
    }
    
    /// Mock types for testing
    #[derive(Debug, Clone)]
    struct MockHttpRequest {
        method: String,
        path: String,
        headers: std::collections::HashMap<String, String>,
        body: Vec<u8>,
    }
    
    #[derive(Debug, Clone)]
    struct MockInternalResponse {
        service: String,
        status: String,
        data: Option<String>,
        timestamp: std::time::SystemTime,
    }
    
    #[derive(Debug, Clone)]
    struct MockHttpResponse {
        status_code: u16,
        headers: std::collections::HashMap<String, String>,
        body: String,
    }
}

/// Test Suite 5: Migration and Compatibility Tests
#[cfg(test)]
mod migration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_legacy_to_clean_config_migration() {
        // Create legacy configuration
        let legacy_config = r#"
            [node]
            id = "legacy-node-001"
            
            [subnet]
            team_id = "legacy-team"
            mode = "leader"
            
            [gateway]
            enabled = true
            protocols = ["http"]
        "#;
        
        // Parse and migrate
        let clean_config = CleanConfig::migrate_from_legacy(legacy_config).unwrap();
        
        // Verify migration preserved settings
        assert_eq!(clean_config.node.id, "legacy-node-001");
        assert!(clean_config.subnet.is_some());
        assert_eq!(clean_config.subnet.unwrap().team_id, "legacy-team");
        assert!(clean_config.gateway.is_some());
        assert_eq!(clean_config.gateway.unwrap().protocols, vec!["http"]);
    }
    
    #[tokio::test]
    async fn test_backward_compatibility_apis() {
        let config = CleanConfig::combined(
            "compat-test-team".to_string(),
            vec!["http".to_string()]
        );
        let coordinator = NetworkCoordinator::from_config(config).unwrap();
        
        coordinator.start().await.unwrap();
        
        // Test legacy API compatibility layer
        let legacy_response = coordinator.handle_legacy_subnet_request(
            "get_members", 
            None
        ).await.unwrap();
        
        assert!(legacy_response.contains("compat-test-team"));
        
        let legacy_gateway_response = coordinator.handle_legacy_gateway_request(
            "get_status",
            None
        ).await.unwrap();
        
        assert!(legacy_gateway_response.contains("online"));
        
        coordinator.stop().await.unwrap();
    }
}

/// Performance and Load Tests
#[cfg(test)]
mod performance_tests {
    use super::*;
    use std::time::Instant;
    
    #[tokio::test]
    async fn test_subnet_message_throughput() {
        let config = CleanConfig::subnet_only("perf-test-team".to_string());
        let coordinator = NetworkCoordinator::from_config(config).unwrap();
        
        coordinator.start().await.unwrap();
        
        let subnet = coordinator.get_subnet().unwrap();
        let message_count = 1000;
        let start_time = Instant::now();
        
        for i in 0..message_count {
            let message = format!("Performance test message {}", i);
            subnet.broadcast_message("perf-test", &message).await.unwrap();
        }
        
        let duration = start_time.elapsed();
        let throughput = message_count as f64 / duration.as_secs_f64();
        
        println!("Subnet throughput: {:.2} messages/second", throughput);
        assert!(throughput >= 100.0, "Throughput too low: {:.2} messages/sec", throughput);
        
        coordinator.stop().await.unwrap();
    }
    
    #[tokio::test]
    async fn test_gateway_concurrent_requests() {
        let config = CleanConfig::gateway_only(vec!["http".to_string()]);
        let coordinator = NetworkCoordinator::from_config(config).unwrap();
        
        coordinator.start().await.unwrap();
        
        let gateway = coordinator.get_gateway().unwrap();
        let concurrent_requests = 50;
        let start_time = Instant::now();
        
        let mut handles = vec![];
        
        for i in 0..concurrent_requests {
            let gateway_clone = gateway.clone();
            let handle = tokio::spawn(async move {
                let request = create_mock_http_request("GET", &format!("/api/v1/test/{}", i), None);
                gateway_clone.process_request(request).await
            });
            handles.push(handle);
        }
        
        let mut success_count = 0;
        for handle in handles {
            if handle.await.unwrap().is_ok() {
                success_count += 1;
            }
        }
        
        let duration = start_time.elapsed();
        let rps = concurrent_requests as f64 / duration.as_secs_f64();
        
        println!("Gateway RPS: {:.2}, Success rate: {:.1}%", 
                rps, (success_count as f64 / concurrent_requests as f64) * 100.0);
        
        assert_eq!(success_count, concurrent_requests);
        assert!(rps >= 10.0, "Requests per second too low: {:.2}", rps);
        
        coordinator.stop().await.unwrap();
    }
}
