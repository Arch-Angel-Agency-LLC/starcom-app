# Testing Strategy: Clean Subnet-Gateway Architecture

**Purpose:** Comprehensive testing approach for clean architecture validation  
**Audience:** QA Engineers, Developers, DevOps  
**Version:** 1.0 (Clean Architecture)  

---

## 🎯 **TESTING OBJECTIVES**

### Primary Goals
1. **Functional Validation** - All four deployment patterns work correctly
2. **Integration Validation** - Clean separation doesn't break functionality  
3. **Performance Validation** - No performance regression from clean architecture
4. **Security Validation** - Access controls and policies work as designed
5. **Migration Validation** - Smooth transition from legacy architecture

### Success Criteria
- [ ] 100% test coverage on new clean modules
- [ ] All integration scenarios pass
- [ ] Performance matches or exceeds legacy implementation
- [ ] Zero security vulnerabilities introduced
- [ ] Migration completes without data loss

---

## 🧪 **TESTING PYRAMID**

### Level 1: Unit Tests (Fast, Isolated)
**Target:** Individual modules and functions  
**Coverage:** ~70% of total test suite  

#### Subnet Module Tests (`clean_subnet.rs`)
```rust
#[cfg(test)]
mod subnet_tests {
    use super::*;

    #[test]
    fn test_team_membership_add_remove() {
        let mut subnet = CleanSubnet::new("test-team".to_string());
        let member = TeamMember::new("member-001", "Alice");
        
        subnet.add_member(member.clone()).unwrap();
        assert!(subnet.has_member(&member.id));
        
        subnet.remove_member(&member.id).unwrap();
        assert!(!subnet.has_member(&member.id));
    }

    #[test]
    fn test_subnet_topology_management() {
        // Test subnet topology updates
        // Test neighbor discovery
        // Test network partitioning handling
    }

    #[test]
    fn test_internal_communication() {
        // Test message routing within subnet
        // Test broadcast to all members
        // Test direct member-to-member communication
    }
}
```

#### Gateway Module Tests (`clean_gateway.rs`)
```rust
#[cfg(test)]
mod gateway_tests {
    use super::*;

    #[test]
    fn test_protocol_translation() {
        let gateway = CleanGateway::new(vec!["http", "websocket"]);
        
        // Test HTTP to internal protocol translation
        let http_request = HttpRequest::get("/api/v1/status");
        let internal_message = gateway.translate_inbound(http_request).unwrap();
        assert_eq!(internal_message.service, "status");
    }

    #[test]
    fn test_access_control_policies() {
        // Test authentication requirements
        // Test authorization rules
        // Test rate limiting
        // Test policy enforcement
    }

    #[test]
    fn test_external_api_endpoints() {
        // Test REST API functionality
        // Test WebSocket connections
        // Test error handling
    }
}
```

#### Network Coordinator Tests (`network_coordinator.rs`)
```rust
#[cfg(test)]
mod coordinator_tests {
    use super::*;

    #[test]
    fn test_subnet_only_coordination() {
        let config = CleanConfig::subnet_only("test-team");
        let coordinator = NetworkCoordinator::from_config(config);
        
        assert!(coordinator.has_subnet());
        assert!(!coordinator.has_gateway());
    }

    #[test]
    fn test_gateway_only_coordination() {
        let config = CleanConfig::gateway_only(vec!["http"]);
        let coordinator = NetworkCoordinator::from_config(config);
        
        assert!(!coordinator.has_subnet());
        assert!(coordinator.has_gateway());
    }

    #[test]
    fn test_combined_coordination() {
        // Test subnet+gateway coordination
        // Test message routing between subnet and gateway
        // Test resource sharing
    }
}
```

### Level 2: Integration Tests (Medium, Multi-Component)
**Target:** Component interactions and workflows  
**Coverage:** ~25% of total test suite  

#### Multi-Node Subnet Formation
```rust
#[tokio::test]
async fn test_three_node_subnet_formation() {
    // Setup three nodes with subnet configuration
    let leader_config = CleanConfig::subnet_leader("team-alpha");
    let member1_config = CleanConfig::subnet_member("team-alpha", "leader-address");
    let member2_config = CleanConfig::subnet_member("team-alpha", "leader-address");
    
    // Start nodes
    let leader = start_node(leader_config).await;
    let member1 = start_node(member1_config).await;
    let member2 = start_node(member2_config).await;
    
    // Wait for subnet formation
    tokio::time::sleep(Duration::from_secs(5)).await;
    
    // Verify all nodes know about each other
    assert_eq!(leader.subnet().member_count(), 3);
    assert_eq!(member1.subnet().member_count(), 3);
    assert_eq!(member2.subnet().member_count(), 3);
    
    // Test internal communication
    let message = InternalMessage::new("test-broadcast", "hello team");
    leader.subnet().broadcast(message).await.unwrap();
    
    // Verify message received by all members
    assert!(member1.received_message("test-broadcast").await);
    assert!(member2.received_message("test-broadcast").await);
}
```

#### Gateway Protocol Translation
```rust
#[tokio::test]
async fn test_http_to_internal_translation() {
    let gateway_config = CleanConfig::gateway_only(vec!["http"]);
    let gateway_node = start_node(gateway_config).await;
    
    // Send HTTP request to gateway
    let client = reqwest::Client::new();
    let response = client
        .get("http://localhost:8080/api/v1/status")
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), 200);
    
    // Verify internal service received translated message
    let internal_service = gateway_node.get_service("status").await;
    assert!(internal_service.received_status_request().await);
}
```

#### Combined Node Functionality
```rust
#[tokio::test]
async fn test_combined_node_subnet_and_gateway() {
    let combined_config = CleanConfig::combined("team-alpha", vec!["http"]);
    let combined_node = start_node(combined_config).await;
    
    // Test subnet functionality
    let member_config = CleanConfig::subnet_member("team-alpha", "combined-node-address");
    let member_node = start_node(member_config).await;
    
    // Wait for subnet formation
    tokio::time::sleep(Duration::from_secs(3)).await;
    assert_eq!(combined_node.subnet().member_count(), 2);
    
    // Test gateway functionality
    let client = reqwest::Client::new();
    let response = client
        .get("http://localhost:8080/api/v1/team/status")
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), 200);
}
```

### Level 3: End-to-End Tests (Slow, Full System)
**Target:** Complete user scenarios and workflows  
**Coverage:** ~5% of total test suite  

#### Scenario: Team Alpha Intelligence Sharing
```rust
#[tokio::test]
async fn test_team_alpha_intelligence_sharing_scenario() {
    // Setup: Team Alpha with leader + 2 members + external gateway
    let leader = start_combined_node("team-alpha-leader", "team-alpha").await;
    let member1 = start_subnet_node("team-alpha-member1", "team-alpha").await;
    let member2 = start_subnet_node("team-alpha-member2", "team-alpha").await;
    let gateway = start_gateway_node("external-gateway").await;
    
    // Wait for network formation
    tokio::time::sleep(Duration::from_secs(10)).await;
    
    // Step 1: External intelligence comes through gateway
    let intel_data = IntelligenceData::new("satellite-imagery", "location-x");
    let http_request = create_intelligence_request(intel_data);
    
    let response = send_http_request(&gateway, http_request).await;
    assert_eq!(response.status(), 200);
    
    // Step 2: Gateway forwards to team leader
    tokio::time::sleep(Duration::from_secs(2)).await;
    assert!(leader.has_received_intelligence("satellite-imagery").await);
    
    // Step 3: Leader distributes to team members
    leader.distribute_intelligence_to_team().await.unwrap();
    
    // Step 4: Verify all team members have intelligence
    tokio::time::sleep(Duration::from_secs(2)).await;
    assert!(member1.has_received_intelligence("satellite-imagery").await);
    assert!(member2.has_received_intelligence("satellite-imagery").await);
    
    // Step 5: Team member adds analysis
    let analysis = IntelligenceAnalysis::new("threat-level-assessment", "medium");
    member1.add_intelligence_analysis(analysis).await.unwrap();
    
    // Step 6: Verify analysis propagated to team
    tokio::time::sleep(Duration::from_secs(2)).await;
    assert!(leader.has_analysis("threat-level-assessment").await);
    assert!(member2.has_analysis("threat-level-assessment").await);
}
```

---

## 🔄 **MIGRATION TESTING**

### Legacy Compatibility Tests
```rust
#[tokio::test]
async fn test_legacy_configuration_migration() {
    // Load legacy configuration
    let legacy_config = load_legacy_config("configs/legacy-subnet.toml");
    
    // Migrate to clean configuration
    let clean_config = migrate_to_clean_config(legacy_config).unwrap();
    
    // Verify migration preserved all settings
    assert_eq!(clean_config.node.id, "legacy-node-001");
    assert!(clean_config.subnet.is_some());
    assert_eq!(clean_config.subnet.unwrap().team_id, "team-alpha");
    
    // Start node with migrated config
    let node = start_node(clean_config).await;
    assert!(node.is_healthy().await);
}

#[tokio::test]
async fn test_legacy_api_compatibility() {
    // Start clean architecture node
    let node = start_combined_node("compat-test", "team-test").await;
    
    // Test legacy API endpoints still work
    let client = reqwest::Client::new();
    
    // Legacy subnet management API
    let response = client
        .get("http://localhost:8080/legacy/api/subnet/members")
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 200);
    
    // Legacy gateway API
    let response = client
        .post("http://localhost:8080/legacy/api/gateway/translate")
        .json(&legacy_translate_request())
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 200);
}
```

### Data Migration Tests
```rust
#[tokio::test]
async fn test_subnet_membership_data_migration() {
    // Setup legacy node with member data
    let legacy_node = start_legacy_node().await;
    legacy_node.add_member("member-001", "Alice").await;
    legacy_node.add_member("member-002", "Bob").await;
    
    // Perform migration
    let migration_result = migrate_subnet_data(&legacy_node).await.unwrap();
    
    // Start clean node with migrated data
    let clean_node = start_clean_node_with_data(migration_result).await;
    
    // Verify all members migrated correctly
    assert_eq!(clean_node.subnet().member_count(), 2);
    assert!(clean_node.subnet().has_member("member-001"));
    assert!(clean_node.subnet().has_member("member-002"));
}
```

---

## 🚀 **PERFORMANCE TESTING**

### Baseline Performance Tests
```rust
#[tokio::test]
async fn test_subnet_message_throughput() {
    let node = start_subnet_node("perf-test", "team-perf").await;
    
    let start_time = Instant::now();
    let message_count = 10_000;
    
    for i in 0..message_count {
        let message = InternalMessage::new(&format!("test-{}", i), "performance test");
        node.subnet().send_message(message).await.unwrap();
    }
    
    let duration = start_time.elapsed();
    let throughput = message_count as f64 / duration.as_secs_f64();
    
    // Verify performance meets requirements
    assert!(throughput >= 1000.0, "Throughput too low: {:.2} messages/sec", throughput);
}

#[tokio::test]
async fn test_gateway_request_latency() {
    let gateway = start_gateway_node("latency-test").await;
    let client = reqwest::Client::new();
    
    let mut latencies = Vec::new();
    
    for _ in 0..1000 {
        let start = Instant::now();
        
        let response = client
            .get("http://localhost:8080/api/v1/ping")
            .send()
            .await
            .unwrap();
        
        assert_eq!(response.status(), 200);
        latencies.push(start.elapsed());
    }
    
    let avg_latency = latencies.iter().sum::<Duration>() / latencies.len() as u32;
    let p95_latency = calculate_percentile(&latencies, 95);
    
    // Verify latency meets requirements
    assert!(avg_latency < Duration::from_millis(10), "Average latency too high");
    assert!(p95_latency < Duration::from_millis(50), "P95 latency too high");
}
```

### Load Testing
```rust
#[tokio::test]
async fn test_concurrent_connections() {
    let gateway = start_gateway_node("load-test").await;
    let concurrent_clients = 100;
    let requests_per_client = 100;
    
    let mut handles = Vec::new();
    
    for client_id in 0..concurrent_clients {
        let handle = tokio::spawn(async move {
            let client = reqwest::Client::new();
            
            for request_id in 0..requests_per_client {
                let response = client
                    .get(&format!("http://localhost:8080/api/v1/test?client={}&request={}", 
                                 client_id, request_id))
                    .send()
                    .await
                    .unwrap();
                
                assert_eq!(response.status(), 200);
            }
        });
        
        handles.push(handle);
    }
    
    // Wait for all clients to complete
    for handle in handles {
        handle.await.unwrap();
    }
    
    // Verify gateway handled all requests successfully
    let stats = gateway.get_performance_stats().await;
    assert_eq!(stats.total_requests, concurrent_clients * requests_per_client);
    assert_eq!(stats.failed_requests, 0);
}
```

---

## 🛡️ **SECURITY TESTING**

### Access Control Tests
```rust
#[tokio::test]
async fn test_unauthorized_access_blocked() {
    let gateway = start_secure_gateway().await;
    let client = reqwest::Client::new();
    
    // Test unauthenticated request is blocked
    let response = client
        .get("http://localhost:8080/api/v1/secure/intelligence")
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), 401); // Unauthorized
    
    // Test authenticated request succeeds
    let response = client
        .get("http://localhost:8080/api/v1/secure/intelligence")
        .header("Authorization", "Bearer valid-jwt-token")
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), 200);
}

#[tokio::test]
async fn test_rate_limiting() {
    let gateway = start_rate_limited_gateway(10).await; // 10 requests per minute
    let client = reqwest::Client::new();
    
    // Send requests within limit
    for _ in 0..10 {
        let response = client
            .get("http://localhost:8080/api/v1/test")
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), 200);
    }
    
    // Next request should be rate limited
    let response = client
        .get("http://localhost:8080/api/v1/test")
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), 429); // Too Many Requests
}
```

### Input Validation Tests
```rust
#[tokio::test]
async fn test_malicious_input_handling() {
    let gateway = start_gateway_node("security-test").await;
    let client = reqwest::Client::new();
    
    // Test SQL injection attempt
    let malicious_payload = json!({
        "query": "'; DROP TABLE users; --"
    });
    
    let response = client
        .post("http://localhost:8080/api/v1/search")
        .json(&malicious_payload)
        .send()
        .await
        .unwrap();
    
    // Should reject malicious input
    assert_eq!(response.status(), 400); // Bad Request
    
    // Test XSS attempt
    let xss_payload = json!({
        "message": "<script>alert('xss')</script>"
    });
    
    let response = client
        .post("http://localhost:8080/api/v1/message")
        .json(&xss_payload)
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), 400); // Bad Request
}
```

---

## 📊 **TEST EXECUTION STRATEGY**

### Development Testing
```bash
# Run unit tests during development
cargo test --lib

# Run integration tests
cargo test --test integration

# Run with coverage
cargo tarpaulin --out Html --output-dir coverage/
```

### CI/CD Pipeline Testing
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run unit tests
        run: cargo test --lib
      
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start test services
        run: docker-compose -f test/docker-compose.yml up -d
      - name: Run integration tests
        run: cargo test --test integration
      - name: Cleanup
        run: docker-compose -f test/docker-compose.yml down
        
  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v2
      - name: Run performance benchmarks
        run: cargo bench
      - name: Compare with baseline
        run: ./scripts/compare-performance.sh
```

### Pre-Production Testing
```bash
# Full test suite with coverage
./scripts/run-full-test-suite.sh

# Performance benchmarking
./scripts/run-performance-tests.sh

# Security scanning
./scripts/run-security-scan.sh

# Migration testing
./scripts/test-migration-scenarios.sh
```

---

## 🎯 **TEST METRICS AND REPORTING**

### Code Coverage Targets
- **Unit Tests:** 90% coverage minimum
- **Integration Tests:** 80% of critical paths covered
- **End-to-End Tests:** 100% of user scenarios covered

### Performance Baselines
- **Subnet Message Throughput:** >1000 messages/second
- **Gateway Request Latency:** <10ms average, <50ms P95
- **Memory Usage:** <500MB per node under normal load
- **CPU Usage:** <50% under normal load

### Quality Gates
- [ ] All tests pass
- [ ] Code coverage targets met
- [ ] Performance baselines met
- [ ] Security scans pass
- [ ] Migration tests pass
- [ ] Documentation updated

---

## 🔗 **RELATED DOCUMENTATION**

- `IMPLEMENTATION-CHECKLIST.md` - Development progress tracker
- `CONFIGURATION-GUIDE.md` - Node configuration guide
- `CLEAN-SUBNET-GATEWAY-SEPARATION.md` - Architecture overview
- `DEVELOPMENT-ROADMAP.md` - Technical implementation details
