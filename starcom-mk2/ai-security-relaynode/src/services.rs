use anyhow::Result;
use std::sync::Arc;
use tokio::time::{Duration, interval};
use tracing::{info, error, warn};

use crate::config::{Config, SubnetMode};
use crate::nostr_relay::NostrRelay;
use crate::subnet_types::{TeamAnnouncement, BridgeDiscoveryMessage, DiscoveryMessageType};
use crate::subnet_manager::SubnetManager;

/// Service management for subnet operations
pub struct SubnetServiceManager {
    config: Config,
    nostr_relay: Arc<NostrRelay>,
    subnet_manager: Option<Arc<SubnetManager>>,
}

impl SubnetServiceManager {
    pub fn new(config: Config, nostr_relay: Arc<NostrRelay>) -> Self {
        let subnet_manager = if config.subnet.mode != SubnetMode::Regional {
            Some(Arc::new(SubnetManager::new(
                Arc::new(config.clone()),
                nostr_relay.clone(),
            )))
        } else {
            None
        };

        Self {
            config,
            nostr_relay,
            subnet_manager,
        }
    }

    pub async fn start_services(&self) -> Result<()> {
        // Start subnet manager if available
        if let Some(subnet_manager) = &self.subnet_manager {
            subnet_manager.start().await?;
        }

        match self.config.subnet.mode {
            SubnetMode::Isolated => {
                info!("🏠 Starting Isolated Team Subnet services");
                self.start_team_subnet_services().await?;
            }
            SubnetMode::Bridged => {
                info!("🌉 Starting Bridged Team Subnet services");
                self.start_team_subnet_services().await?;
            }
            SubnetMode::Regional => {
                info!("🌐 Starting Regional Mesh services");
                // Traditional startup - no additional services needed
            }
            SubnetMode::GlobalMesh => {
                info!("🌍 Starting Global Mesh services");
                // Traditional global mesh operation
            }
            SubnetMode::TeamSubnet => {
                info!("👥 Starting Team Subnet services");
                self.start_team_subnet_services().await?;
            }
            SubnetMode::HybridGateway => {
                info!("🚪 Starting Hybrid Gateway services");
                self.start_team_subnet_services().await?;
            }
        }
        Ok(())
    }

    async fn start_team_subnet_services(&self) -> Result<()> {
        // Start team announcement service
        if self.config.subnet.discovery_enabled {
            let config_clone = self.config.clone();
            let relay_clone = self.nostr_relay.clone();
            let subnet_manager_clone = self.subnet_manager.clone();
            
            tokio::spawn(async move {
                if let Err(e) = team_announcement_service(config_clone, relay_clone, subnet_manager_clone).await {
                    error!("Team announcement service error: {}", e);
                }
            });
        }
        
        // Start bridge discovery listener
        let config_clone = self.config.clone();
        let relay_clone = self.nostr_relay.clone();
        let subnet_manager_clone = self.subnet_manager.clone();
        
        tokio::spawn(async move {
            if let Err(e) = bridge_discovery_service(config_clone, relay_clone, subnet_manager_clone).await {
                error!("Bridge discovery service error: {}", e);
            }
        });
        
        Ok(())
    }

    async fn start_gateway_services(&self) -> Result<()> {
        // TODO: Implement gateway services in Phase 2
        info!("🌉 Gateway services initialization - Phase 2");
        Ok(())
    }

    /// Get access to the subnet manager (if available)
    pub fn get_subnet_manager(&self) -> Option<Arc<SubnetManager>> {
        self.subnet_manager.clone()
    }
}

/// Team announcement service - broadcasts team presence
async fn team_announcement_service(
    config: Config,
    nostr_relay: Arc<NostrRelay>,
    subnet_manager: Option<Arc<SubnetManager>>,
) -> Result<()> {
    let mut interval = interval(Duration::from_secs(config.subnet.team_announcement_interval));
    
    info!("📡 Starting team announcement service with interval: {}s", 
          config.subnet.team_announcement_interval);
    
    loop {
        interval.tick().await;
        
        if let Some(team_id) = &config.subnet.team_subnet_id {
            match create_team_announcement(team_id, &config).await {
                Ok(announcement) => {
                    if let Err(e) = broadcast_team_announcement(&nostr_relay, &announcement).await {
                        error!("Failed to broadcast team announcement: {}", e);
                    } else {
                        info!("📡 Broadcasted team announcement for team: {}", team_id);
                    }
                }
                Err(e) => {
                    error!("Failed to create team announcement: {}", e);
                }
            }
        }
    }
}

/// Bridge discovery service - listens for and handles discovery messages
async fn bridge_discovery_service(
    config: Config,
    nostr_relay: Arc<NostrRelay>,
    subnet_manager: Option<Arc<SubnetManager>>,
) -> Result<()> {
    use tokio::net::UdpSocket;
    
    let bind_addr = format!("127.0.0.1:{}", config.subnet.bridge_discovery_port);
    let socket = UdpSocket::bind(&bind_addr).await?;
    
    info!("🔍 Bridge discovery service listening on: {}", bind_addr);
    
    let mut buf = [0; 4096];
    
    loop {
        match socket.recv_from(&mut buf).await {
            Ok((size, addr)) => {
                let message_data = &buf[..size];
                
                match serde_json::from_slice::<BridgeDiscoveryMessage>(message_data) {
                    Ok(discovery_message) => {
                        info!("📨 Received discovery message from {}: {:?}", 
                              addr, discovery_message.message_type);
                        
                        if let Err(e) = handle_discovery_message(&discovery_message, &nostr_relay, &subnet_manager).await {
                            warn!("Failed to handle discovery message: {}", e);
                        }
                    }
                    Err(e) => {
                        warn!("Failed to parse discovery message from {}: {}", addr, e);
                    }
                }
            }
            Err(e) => {
                error!("UDP receive error: {}", e);
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }
    }
}

async fn create_team_announcement(team_id: &str, config: &Config) -> Result<TeamAnnouncement> {
    let node_id = generate_node_id().await?;
    let capabilities = vec![
        "nostr-relay".to_string(),
        "ipfs-node".to_string(),
        "subnet-aware".to_string(),
    ];
    
    // TODO: Replace with actual public key generation
    let public_key = "temp_public_key_placeholder".to_string();
    
    let announcement = TeamAnnouncement::new(
        team_id.to_string(),
        node_id,
        capabilities,
        config.security_level.clone(),
        public_key,
    );
    
    announcement.validate()?;
    Ok(announcement)
}

async fn broadcast_team_announcement(
    nostr_relay: &Arc<NostrRelay>,
    announcement: &TeamAnnouncement
) -> Result<()> {
    // Create discovery message
    let discovery_message = BridgeDiscoveryMessage::new_team_announcement(
        announcement.team_id.clone(),
        announcement.node_id.clone(),
        announcement,
    )?;
    
    // Broadcast via UDP to discovery port
    broadcast_discovery_message(&discovery_message).await?;
    
    // TODO: Also broadcast via Nostr relay for wider network reach
    
    Ok(())
}

async fn broadcast_discovery_message(message: &BridgeDiscoveryMessage) -> Result<()> {
    use tokio::net::UdpSocket;
    
    let socket = UdpSocket::bind("0.0.0.0:0").await?;
    socket.set_broadcast(true)?;
    
    let message_data = serde_json::to_vec(message)?;
    let broadcast_addr = "255.255.255.255:8082"; // Use default discovery port
    
    socket.send_to(&message_data, broadcast_addr).await?;
    info!("📡 Broadcasted discovery message to {}", broadcast_addr);
    
    Ok(())
}

async fn handle_discovery_message(
    message: &BridgeDiscoveryMessage,
    nostr_relay: &Arc<NostrRelay>,
    subnet_manager: &Option<Arc<SubnetManager>>,
) -> Result<()> {
    if let Err(e) = message.validate() {
        return Err(anyhow::anyhow!("Invalid discovery message: {}", e));
    }
    
    match message.message_type {
        DiscoveryMessageType::TeamAnnouncement => {
            info!("📡 Processing team announcement from team: {}", message.source_team_id);
            
            // Extract team announcement from payload
            if let Some(announcement_value) = message.payload.data.get("announcement") {
                match serde_json::from_value::<TeamAnnouncement>(announcement_value.clone()) {
                    Ok(announcement) => {
                        // Register with subnet manager if available
                        if let Some(subnet_mgr) = subnet_manager {
                            if let Err(e) = subnet_mgr.register_team(announcement.clone()).await {
                                error!("Failed to register team with subnet manager: {}", e);
                            }
                        }
                        
                        info!("✅ Discovered team node: {} from team: {}", 
                              announcement.node_id, announcement.team_id);
                    }
                    Err(e) => {
                        warn!("Failed to parse team announcement: {}", e);
                    }
                }
            }
        }
        DiscoveryMessageType::BridgeRequest => {
            info!("🌉 Processing bridge request from team: {}", message.source_team_id);
            
            if let Some(subnet_mgr) = subnet_manager {
                // Extract bridge request from payload
                if let Some(request_data) = message.payload.data.get("request") {
                    // TODO: Parse bridge request and handle via subnet manager
                    info!("Bridge request handling via subnet manager - TODO");
                }
            } else {
                info!("Bridge request received but no subnet manager available");
            }
        }
        DiscoveryMessageType::BridgeResponse => {
            info!("🌉 Processing bridge response from team: {}", message.source_team_id);
            // TODO: Handle bridge response via subnet manager
        }
        DiscoveryMessageType::BridgeTermination => {
            info!("🌉 Processing bridge termination from team: {}", message.source_team_id);
            // TODO: Handle bridge termination via subnet manager
        }
        DiscoveryMessageType::HealthCheck => {
            info!("💓 Processing health check from team: {}", message.source_team_id);
            // TODO: Implement health check response
        }
    }
    
    Ok(())
}

async fn generate_node_id() -> Result<String> {
    // Generate a unique node ID based on system information
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    
    // Hash system information
    if let Ok(hostname) = std::env::var("HOSTNAME") {
        hostname.hash(&mut hasher);
    }
    std::process::id().hash(&mut hasher);
    chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0).hash(&mut hasher);
    
    let hash = hasher.finish();
    Ok(format!("node_{:x}", hash))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{Config, SecurityLevel};

    #[tokio::test]
    async fn test_team_announcement_creation() {
        let config = Config::default();
        let announcement = create_team_announcement("test_team", &config).await.unwrap();
        
        assert_eq!(announcement.team_id, "test_team");
        assert!(!announcement.node_id.is_empty());
        assert!(announcement.capabilities.contains(&"subnet-aware".to_string()));
        assert!(announcement.validate().is_ok());
    }

    #[tokio::test]
    async fn test_node_id_generation() {
        let id1 = generate_node_id().await.unwrap();
        let id2 = generate_node_id().await.unwrap();
        
        assert!(!id1.is_empty());
        assert!(!id2.is_empty());
        assert_ne!(id1, id2); // Should be unique
        assert!(id1.starts_with("node_"));
    }

    #[test]
    fn test_discovery_message_handling() {
        // Test message validation
        let announcement = TeamAnnouncement::new(
            "test_team".to_string(),
            "test_node".to_string(),
            vec!["test_capability".to_string()],
            SecurityLevel::Unclassified,
            "test_pubkey".to_string(),
        );
        
        let message = BridgeDiscoveryMessage::new_team_announcement(
            "test_team".to_string(),
            "test_node".to_string(),
            &announcement,
        ).unwrap();
        
        assert!(message.validate().is_ok());
        assert_eq!(message.source_team_id, "test_team");
    }
}
