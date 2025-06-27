// AI Security RelayNode - Production Ready
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tracing::{info, error};
use serde::{Deserialize, Serialize};
use anyhow::Result;

use ai_security_relaynode::{
    NostrRelay,
    IPFSNode,
    SecurityLayer,
    APIGateway,
    Config,
    DatabaseManager,
    InvestigationService,
};

#[derive(Debug, Serialize, Deserialize)]
struct ServiceStatus {
    status: String,
    connections: Option<u32>,
    events: Option<u32>,
    peers: Option<u32>,
    storage: Option<u32>,
    investigations: Option<i64>,
    #[serde(rename = "peerId")]
    peer_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SystemStatus {
    version: String,
    timestamp: String,
    services: ServiceStatus,
    subnet_role: String,
    gateway_status: String,
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    info!("🚀 AI Security RelayNode - Production Deployment");
    info!("================================================");
    
    // Load configuration
    let _config = Config::load()?;
    info!("✅ Configuration loaded");
    
    // Initialize database and run migrations
    let database_url = "sqlite:./data/relaynode.db";
    let db_manager = DatabaseManager::new(database_url).await?;
    db_manager.run_migrations().await?;
    info!("✅ Database initialized and migrations completed");
    
    // Initialize investigation service
    let investigation_service = Arc::new(InvestigationService::new(db_manager.pool().clone()).await?);
    info!("✅ Investigation service initialized");

    // Initialize services
    let security_layer = SecurityLayer::new().await?;
    let ipfs_node = Arc::new(IPFSNode::new(security_layer.clone()).await?);
    let nostr_relay = Arc::new(NostrRelay::new(security_layer.clone(), None).await?);
    let api_gateway = Arc::new(APIGateway::new(
        nostr_relay.clone(), 
        ipfs_node.clone(),
        investigation_service.clone(),
    ).await?);
    
    info!("✅ All services initialized");
    
    // Start services
    let ipfs_handle = {
        let ipfs = ipfs_node.clone();
        tokio::spawn(async move {
            if let Err(e) = ipfs.start().await {
                error!("IPFS service error: {}", e);
            }
        })
    };
    
    let nostr_handle = {
        let nostr = nostr_relay.clone();
        tokio::spawn(async move {
            if let Err(e) = nostr.start().await {
                error!("Nostr relay error: {}", e);
            }
        })
    };
    
    let api_handle = {
        let gateway = api_gateway.clone();
        tokio::spawn(async move {
            if let Err(e) = gateway.start().await {
                error!("API Gateway error: {}", e);
            }
        })
    };
    
    info!("🎯 RelayNode operational - Ready for cyber investigation team");
    info!("📊 Monitoring services...");
    
    // Background task for status monitoring including investigation metrics
    let status_task = {
        let db_manager_clone = Arc::new(db_manager);
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
            loop {
                interval.tick().await;
                
                // Get investigation count
                match db_manager_clone.get_investigation_count().await {
                    Ok(count) => {
                        info!("📊 System Status - Active investigations: {}", count);
                        
                        // Health check
                        if let Ok(healthy) = db_manager_clone.health_check().await {
                            if healthy {
                                info!("✅ Database health check passed");
                            } else {
                                error!("❌ Database health check failed");
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to get investigation count: {}", e);
                    }
                }
            }
        })
    };

    // Wait for services
    let _ = tokio::try_join!(ipfs_handle, nostr_handle, api_handle, status_task)?;
    
    Ok(())
}
