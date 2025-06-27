// Clean Architecture Main - Validation Version
// This version focuses on validating the clean architecture without Tauri

use std::sync::Arc;
use anyhow::Result;
use tokio::sync::RwLock;
use tracing::{info, error};

// Clean architecture modules
mod clean_subnet;
mod clean_gateway;
mod network_coordinator;
mod clean_config;
mod utils;

// Temporarily disable problematic modules
// mod nostr_relay;
// mod ipfs_node;
// mod security_layer;

use crate::{
    clean_config::{CleanConfig, DeploymentPattern},
    network_coordinator::NetworkCoordinator,
    clean_subnet::{CleanSubnet, SubnetRole, SubnetMember},
    clean_gateway::{CleanGateway, GatewayProtocol, GatewayAction},
};

/// Validation Application State
#[derive(Clone)]
pub struct ValidationAppState {
    coordinator: Arc<RwLock<NetworkCoordinator>>,
    config: Arc<RwLock<CleanConfig>>,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    info!("🌟 AI Security RelayNode - Clean Architecture Validation");
    info!("========================================================");
    
    // Load clean configuration
    let config = CleanConfig::default();
    info!("✅ Configuration loaded - Pattern: {:?}", config.deployment.pattern);
    
    // Create network coordinator
    let coordinator = NetworkCoordinator::new(
        config.node.node_id.clone(),
        config.node.bind_address.parse()?,
    );
    
    info!("🎯 Network coordinator created");
    
    // Create application state
    let app_state = ValidationAppState {
        coordinator: Arc::new(RwLock::new(coordinator)),
        config: Arc::new(RwLock::new(config)),
    };
    
    info!("📊 Application state initialized");
    
    // Run validation tests
    run_validation_tests(app_state).await?;
    
    info!("🎉 Clean architecture validation completed successfully!");
    Ok(())
}

async fn run_validation_tests(app_state: ValidationAppState) -> Result<()> {
    info!("🧪 Running Clean Architecture Validation Tests");
    info!("──────────────────────────────────────────────");
    
    // Test 1: Subnet-only deployment pattern
    test_subnet_only_pattern(app_state.clone()).await?;
    
    // Test 2: Gateway-only deployment pattern
    test_gateway_only_pattern(app_state.clone()).await?;
    
    // Test 3: Full node deployment pattern
    test_full_node_pattern(app_state.clone()).await?;
    
    // Test 4: Clean separation validation
    test_clean_separation(app_state.clone()).await?;
    
    info!("✅ All validation tests passed!");
    Ok(())
}

async fn test_subnet_only_pattern(app_state: ValidationAppState) -> Result<()> {
    info!("🔹 Test 1: Subnet-Only Deployment Pattern");
    
    let mut coordinator = app_state.coordinator.write().await;
    
    // Configure as team member
    coordinator.join_subnet(
        "team-alpha".to_string(),
        "Team Alpha".to_string(),
        "member_pub_key".to_string(),
        SubnetRole::Member,
    ).await?;
    
    // Verify configuration
    assert!(coordinator.has_subnet(), "Should have subnet");
    assert!(!coordinator.has_gateway(), "Should not have gateway");
    
    let subnet_info = coordinator.get_subnet_info().await;
    assert!(subnet_info.is_some(), "Subnet info should be available");
    assert_eq!(subnet_info.unwrap().subnet_id, "team-alpha");
    
    info!("  ✅ Subnet-only pattern validated");
    Ok(())
}

async fn test_gateway_only_pattern(app_state: ValidationAppState) -> Result<()> {
    info!("🔹 Test 2: Gateway-Only Deployment Pattern");
    
    // Create fresh coordinator for this test
    let config = app_state.config.read().await;
    let mut coordinator = NetworkCoordinator::new(
        "gateway-test".to_string(),
        config.node.bind_address.parse()?,
    );
    
    // Configure as protocol bridge
    coordinator.enable_gateway(
        "bridge_gateway".to_string(),
        vec![GatewayProtocol::NostrWebSocket, GatewayProtocol::HttpRest],
    ).await?;
    
    // Verify configuration
    assert!(!coordinator.has_subnet(), "Should not have subnet");
    assert!(coordinator.has_gateway(), "Should have gateway");
    
    let gateway_info = coordinator.get_gateway_info().await;
    assert!(gateway_info.is_some(), "Gateway info should be available");
    assert_eq!(gateway_info.unwrap().gateway_id, "bridge_gateway");
    
    info!("  ✅ Gateway-only pattern validated");
    Ok(())
}

async fn test_full_node_pattern(app_state: ValidationAppState) -> Result<()> {
    info!("🔹 Test 3: Full Node Deployment Pattern");
    
    // Create fresh coordinator for this test
    let config = app_state.config.read().await;
    let mut coordinator = NetworkCoordinator::new(
        "full-node-test".to_string(),
        config.node.bind_address.parse()?,
    );
    
    // Configure as team leader (subnet + gateway)
    coordinator.join_subnet(
        "team-beta".to_string(),
        "Team Beta".to_string(),
        "leader_pub_key".to_string(),
        SubnetRole::Leader,
    ).await?;
    
    coordinator.enable_gateway(
        "leader_gateway".to_string(),
        vec![GatewayProtocol::NostrWebSocket, GatewayProtocol::HttpRest, GatewayProtocol::IpfsLibp2p],
    ).await?;
    
    // Verify configuration
    assert!(coordinator.has_subnet(), "Should have subnet");
    assert!(coordinator.has_gateway(), "Should have gateway");
    
    let status = coordinator.get_status().await;
    assert!(status.has_subnet, "Status should show subnet");
    assert!(status.has_gateway, "Status should show gateway");
    
    info!("  ✅ Full node pattern validated");
    Ok(())
}

async fn test_clean_separation(app_state: ValidationAppState) -> Result<()> {
    info!("🔹 Test 4: Clean Architecture Separation");
    
    // Test that we can create subnet and gateway independently
    let subnet = CleanSubnet::new(
        "test-subnet".to_string(),
        "Test Subnet".to_string(),
        "127.0.0.1:8080".parse()?,
    );
    
    let gateway = CleanGateway::new(
        "test-gateway".to_string(),
        "127.0.0.1:9090".parse()?,
    );
    
    // Verify they can operate independently
    assert_eq!(subnet.get_subnet_id(), "test-subnet");
    assert_eq!(gateway.get_gateway_id(), "test-gateway");
    
    // Test that coordinator can work without either
    let coordinator = NetworkCoordinator::new(
        "basic-relay".to_string(),
        "127.0.0.1:8080".parse()?,
    );
    
    assert!(!coordinator.has_subnet(), "Basic relay should not have subnet");
    assert!(!coordinator.has_gateway(), "Basic relay should not have gateway");
    
    let status = coordinator.get_status().await;
    assert!(status.is_online, "Basic relay should be online");
    assert!(!status.has_subnet, "Status should not show subnet");
    assert!(!status.has_gateway, "Status should not show gateway");
    
    info!("  ✅ Clean separation validated");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_basic_functionality() {
        let config = CleanConfig::default();
        let coordinator = NetworkCoordinator::new(
            "test".to_string(),
            "127.0.0.1:8080".parse().unwrap(),
        );
        
        assert_eq!(coordinator.get_node_id(), "test");
    }
}
