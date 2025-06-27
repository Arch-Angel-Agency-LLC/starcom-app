// Common Test Utilities
// Shared utilities for unit tests

use std::net::SocketAddr;
use ai_security_relaynode::{
    clean_subnet::{CleanSubnet, SubnetMember, SubnetRole, SubnetResource, ResourceType},
    clean_gateway::{CleanGateway, GatewayRequest, GatewayAction, GatewayProtocol},
    network_coordinator::NetworkCoordinator,
};

/// Test configuration constants
pub const TEST_SUBNET_ID: &str = "test-subnet-001";
pub const TEST_SUBNET_NAME: &str = "Test Team Alpha";
pub const TEST_GATEWAY_ID: &str = "test-gateway-001";
pub const TEST_NODE_ADDRESS: &str = "127.0.0.1:8080";

/// Create a test subnet with consistent configuration
pub fn create_test_subnet() -> CleanSubnet {
    CleanSubnet::new(
        TEST_SUBNET_ID.to_string(),
        TEST_SUBNET_NAME.to_string(),
        TEST_NODE_ADDRESS.parse().unwrap(),
    )
}

/// Create a test gateway with consistent configuration
pub fn create_test_gateway() -> CleanGateway {
    CleanGateway::new(
        TEST_GATEWAY_ID.to_string(),
        "127.0.0.1:9090".parse().unwrap(),
    )
}

/// Create a test network coordinator
pub fn create_test_coordinator() -> NetworkCoordinator {
    NetworkCoordinator::new(
        "test-coordinator-001".to_string(),
        TEST_NODE_ADDRESS.parse().unwrap(),
    )
}

/// Create a test subnet member with specified role
pub fn create_test_member(public_key: &str, role: SubnetRole) -> SubnetMember {
    SubnetMember {
        public_key: public_key.to_string(),
        node_address: "127.0.0.1:8081".parse().unwrap(),
        role,
        joined_at: get_test_timestamp(),
        last_seen: get_test_timestamp(),
        capabilities: vec!["nostr".to_string(), "ipfs".to_string()],
        is_online: true,
    }
}

/// Create a test resource
pub fn create_test_resource(resource_id: &str, resource_type: ResourceType) -> SubnetResource {
    SubnetResource {
        resource_id: resource_id.to_string(),
        resource_type,
        title: format!("Test Resource {}", resource_id),
        data: format!("Test data for {}", resource_id).into_bytes(),
        shared_with: vec![],
        created_at: get_test_timestamp(),
        created_by: "test_creator".to_string(),
        classification: "TEST".to_string(),
    }
}

/// Create a test gateway request
pub fn create_test_gateway_request(
    request_id: &str,
    protocol: GatewayProtocol,
    action: GatewayAction,
) -> GatewayRequest {
    GatewayRequest {
        request_id: request_id.to_string(),
        source_network: "test-source".to_string(),
        target_network: "test-target".to_string(),
        protocol,
        action,
        payload: format!("Test payload for {}", request_id).into_bytes(),
        metadata: std::collections::HashMap::new(),
        timestamp: get_test_timestamp(),
    }
}

/// Get consistent test timestamp
pub fn get_test_timestamp() -> u64 {
    1640995200 // 2022-01-01 00:00:00 UTC
}

/// Test assertion helpers
pub mod assertions {
    use super::*;

    /// Assert that two socket addresses are equivalent
    pub fn assert_socket_addr_eq(actual: SocketAddr, expected: &str) {
        let expected_addr: SocketAddr = expected.parse().unwrap();
        assert_eq!(actual, expected_addr);
    }

    /// Assert that a vector contains a specific item
    pub fn assert_contains<T: PartialEq + std::fmt::Debug>(vec: &[T], item: &T) {
        assert!(
            vec.contains(item),
            "Vector {:?} does not contain item {:?}",
            vec,
            item
        );
    }

    /// Assert that a result is ok and return the value
    pub fn unwrap_ok<T, E: std::fmt::Debug>(result: Result<T, E>) -> T {
        match result {
            Ok(value) => value,
            Err(e) => panic!("Expected Ok, got Err: {:?}", e),
        }
    }

    /// Assert that a result is an error
    pub fn assert_is_err<T: std::fmt::Debug, E>(result: Result<T, E>) {
        match result {
            Ok(value) => panic!("Expected Err, got Ok: {:?}", value),
            Err(_) => (), // Test passes
        }
    }
}

/// Mock data generators
pub mod generators {
    use super::*;

    /// Generate a series of test members
    pub fn generate_test_members(count: usize) -> Vec<SubnetMember> {
        (0..count)
            .map(|i| create_test_member(&format!("member_{}", i), SubnetRole::Member))
            .collect()
    }

    /// Generate a series of test resources
    pub fn generate_test_resources(count: usize) -> Vec<SubnetResource> {
        (0..count)
            .map(|i| create_test_resource(&format!("resource_{}", i), ResourceType::Intelligence))
            .collect()
    }

    /// Generate test gateway protocols
    pub fn generate_test_protocols() -> Vec<GatewayProtocol> {
        vec![
            GatewayProtocol::NostrWebSocket,
            GatewayProtocol::HttpRest,
            GatewayProtocol::IpfsLibp2p,
        ]
    }
}

/// Test environment setup and cleanup
pub mod environment {
    use tracing_subscriber;

    /// Initialize test logging
    pub fn init_test_logging() {
        let _ = tracing_subscriber::fmt()
            .with_test_writer()
            .try_init();
    }

    /// Clean up test resources
    pub fn cleanup_test_environment() {
        // Cleanup logic for test resources
        // This would remove any temporary files, connections, etc.
    }
}

/// Performance testing utilities
pub mod performance {
    use std::time::{Duration, Instant};

    /// Measure execution time of a function
    pub async fn measure_async<F, Fut, T>(f: F) -> (T, Duration)
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = T>,
    {
        let start = Instant::now();
        let result = f().await;
        let duration = start.elapsed();
        (result, duration)
    }

    /// Assert that an operation completes within a time limit
    pub async fn assert_within_time<F, Fut, T>(
        time_limit: Duration,
        f: F,
    ) -> T
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = T>,
    {
        let (result, duration) = measure_async(f).await;
        assert!(
            duration <= time_limit,
            "Operation took {:?}, expected within {:?}",
            duration,
            time_limit
        );
        result
    }
}
