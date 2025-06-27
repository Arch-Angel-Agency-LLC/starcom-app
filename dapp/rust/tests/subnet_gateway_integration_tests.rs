use anyhow::Result;
use std::sync::Arc;
use tokio::sync::Mutex;
use starcom_mk2::subnet::{
    subnet_manager::SubnetManager,
    subnet_types::{SubnetId, NodeInfo, BridgeRequest, SubnetStatus, NodeId},
    bridge_protocol::BridgeProtocol,
    security_layer::SecurityLayer,
};

#[tokio::test]
async fn test_subnet_manager_initialization() -> Result<()> {
    let manager = SubnetManager::new("test_subnet".to_string());
    assert_eq!(manager.get_subnet_id(), &SubnetId("test_subnet".to_string()));
    assert_eq!(manager.get_status(), SubnetStatus::Initializing);
    Ok(())
}

#[tokio::test]
async fn test_node_registration() -> Result<()> {
    let mut manager = SubnetManager::new("test_subnet".to_string());
    
    let node_info = NodeInfo {
        id: NodeId("node1".to_string()),
        address: "127.0.0.1:8080".to_string(),
        capabilities: vec!["compute".to_string(), "storage".to_string()],
        last_seen: 1640995200, // Unix timestamp
        trust_score: 0.95,
    };
    
    manager.register_node(node_info.clone()).await?;
    
    let registered_nodes = manager.get_registered_nodes();
    assert_eq!(registered_nodes.len(), 1);
    assert_eq!(registered_nodes[0].id, node_info.id);
    
    Ok(())
}

#[tokio::test]
async fn test_bridge_request_processing() -> Result<()> {
    let mut manager = SubnetManager::new("test_subnet".to_string());
    
    let bridge_request = BridgeRequest {
        id: "req_001".to_string(),
        source_subnet: SubnetId("subnet_a".to_string()),
        target_subnet: SubnetId("subnet_b".to_string()),
        payload: vec![1, 2, 3, 4, 5],
        timestamp: 1640995200,
        signature: vec![],
    };
    
    // Process the bridge request
    let result = manager.process_bridge_request(bridge_request.clone()).await?;
    assert!(result.is_ok());
    
    Ok(())
}

#[tokio::test]
async fn test_security_layer_validation() -> Result<()> {
    let security_layer = SecurityLayer::new();
    
    let node_info = NodeInfo {
        id: NodeId("node1".to_string()),
        address: "127.0.0.1:8080".to_string(),
        capabilities: vec!["compute".to_string()],
        last_seen: 1640995200,
        trust_score: 0.95,
    };
    
    // Test node validation
    let is_valid = security_layer.validate_node(&node_info).await?;
    assert!(is_valid);
    
    // Test with low trust score
    let low_trust_node = NodeInfo {
        trust_score: 0.3,
        ..node_info
    };
    
    let is_valid_low_trust = security_layer.validate_node(&low_trust_node).await?;
    assert!(!is_valid_low_trust);
    
    Ok(())
}

#[tokio::test]
async fn test_bridge_protocol_message_handling() -> Result<()> {
    let bridge_protocol = BridgeProtocol::new();
    
    let test_message = vec![1, 2, 3, 4, 5];
    let source_subnet = SubnetId("subnet_a".to_string());
    let target_subnet = SubnetId("subnet_b".to_string());
    
    // Test message encoding
    let encoded = bridge_protocol.encode_message(&test_message, &source_subnet, &target_subnet).await?;
    assert!(!encoded.is_empty());
    
    // Test message decoding
    let decoded = bridge_protocol.decode_message(&encoded).await?;
    assert_eq!(decoded.payload, test_message);
    assert_eq!(decoded.source_subnet, source_subnet);
    assert_eq!(decoded.target_subnet, target_subnet);
    
    Ok(())
}

#[tokio::test]
async fn test_subnet_status_transitions() -> Result<()> {
    let mut manager = SubnetManager::new("test_subnet".to_string());
    
    // Initial status should be Initializing
    assert_eq!(manager.get_status(), SubnetStatus::Initializing);
    
    // Start the subnet
    manager.start().await?;
    assert_eq!(manager.get_status(), SubnetStatus::Active);
    
    // Stop the subnet
    manager.stop().await?;
    assert_eq!(manager.get_status(), SubnetStatus::Inactive);
    
    Ok(())
}

#[tokio::test]
async fn test_concurrent_node_operations() -> Result<()> {
    let manager = Arc::new(Mutex::new(SubnetManager::new("test_subnet".to_string())));
    
    let mut handles = vec![];
    
    // Spawn multiple tasks to register nodes concurrently
    for i in 0..10 {
        let manager_clone = Arc::clone(&manager);
        let handle = tokio::spawn(async move {
            let node_info = NodeInfo {
                id: NodeId(format!("node_{}", i)),
                address: format!("127.0.0.1:{}", 8080 + i),
                capabilities: vec!["compute".to_string()],
                last_seen: 1640995200,
                trust_score: 0.9,
            };
            
            let mut manager_guard = manager_clone.lock().await;
            manager_guard.register_node(node_info).await
        });
        handles.push(handle);
    }
    
    // Wait for all tasks to complete
    for handle in handles {
        handle.await??;
    }
    
    let manager_guard = manager.lock().await;
    assert_eq!(manager_guard.get_registered_nodes().len(), 10);
    
    Ok(())
}

#[tokio::test]
async fn test_error_handling() -> Result<()> {
    let mut manager = SubnetManager::new("test_subnet".to_string());
    
    // Test duplicate node registration
    let node_info = NodeInfo {
        id: NodeId("node1".to_string()),
        address: "127.0.0.1:8080".to_string(),
        capabilities: vec!["compute".to_string()],
        last_seen: 1640995200,
        trust_score: 0.95,
    };
    
    // First registration should succeed
    manager.register_node(node_info.clone()).await?;
    
    // Second registration of the same node should handle gracefully
    let result = manager.register_node(node_info).await;
    assert!(result.is_ok()); // Should update existing node rather than error
    
    Ok(())
}

#[tokio::test]
async fn test_performance_metrics() -> Result<()> {
    let mut manager = SubnetManager::new("test_subnet".to_string());
    
    let start_time = std::time::Instant::now();
    
    // Register 1000 nodes to test performance
    for i in 0..1000 {
        let node_info = NodeInfo {
            id: NodeId(format!("node_{}", i)),
            address: format!("127.0.0.1:{}", 8080 + (i % 1000)),
            capabilities: vec!["compute".to_string()],
            last_seen: 1640995200,
            trust_score: 0.9,
        };
        
        manager.register_node(node_info).await?;
    }
    
    let elapsed = start_time.elapsed();
    println!("Registered 1000 nodes in {:?}", elapsed);
    
    // Should complete within reasonable time (adjust threshold as needed)
    assert!(elapsed.as_secs() < 10);
    assert_eq!(manager.get_registered_nodes().len(), 1000);
    
    Ok(())
}
