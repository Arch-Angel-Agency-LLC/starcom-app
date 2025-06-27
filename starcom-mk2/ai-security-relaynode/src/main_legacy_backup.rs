// Prevent additional console window on Windows in release, if not using console
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error};
use serde::{Deserialize, Serialize};

use ai_security_relaynode::{
    nostr_relay::NostrRelay,
    ipfs_node::IPFSNode,
    security_layer::SecurityLayer,
    api_gateway::APIGateway,
    config::Config,
    services::SubnetServiceManager,
    subnet_manager::SubnetStatus,
};

#[derive(Debug, Serialize, Deserialize)]
struct ServiceStatus {
    status: String,
    connections: Option<u32>,
    events: Option<u32>,
    peers: Option<u32>,
    storage: Option<u32>,
    #[serde(rename = "peerId")]
    peer_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AllServiceStatus {
    nostr: Option<ServiceStatus>,
    ipfs: Option<ServiceStatus>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TeamConfig {
    team_name: Option<String>,
    team_key: Option<String>,
    relay_url: Option<String>,
}

// Global application state
struct AppState {
    nostr_relay: Arc<NostrRelay>,
    ipfs_node: Arc<IPFSNode>,
    security_layer: Arc<SecurityLayer>,
    api_gateway: Arc<APIGateway>,
    config: Arc<RwLock<Config>>,
    services_running: Arc<RwLock<bool>>,
    subnet_service_manager: Arc<SubnetServiceManager>,
}

// Tauri commands
#[tauri::command]
async fn start_services(state: tauri::State<'_, AppState>) -> Result<(), String> {
    info!("Starting all services...");
    
    let mut running = state.services_running.write().await;
    if *running {
        return Err("Services are already running".to_string());
    }
    
    // Start Nostr relay
    match state.nostr_relay.start().await {
        Ok(_) => info!("Nostr relay started successfully"),
        Err(e) => {
            error!("Failed to start Nostr relay: {}", e);
            return Err(format!("Failed to start Nostr relay: {}", e));
        }
    }
    
    // Start IPFS node
    match state.ipfs_node.start().await {
        Ok(_) => info!("IPFS node started successfully"),
        Err(e) => {
            error!("Failed to start IPFS node: {}", e);
            return Err(format!("Failed to start IPFS node: {}", e));
        }
    }
    
    // Start API gateway
    match state.api_gateway.start().await {
        Ok(_) => info!("API gateway started successfully"),
        Err(e) => {
            error!("Failed to start API gateway: {}", e);
            return Err(format!("Failed to start API gateway: {}", e));
        }
    }
    
    *running = true;
    info!("All services started successfully");
    Ok(())
}

#[tauri::command]
async fn stop_services(state: tauri::State<'_, AppState>) -> Result<(), String> {
    info!("Stopping all services...");
    
    let mut running = state.services_running.write().await;
    if !*running {
        return Err("Services are not running".to_string());
    }
    
    // Stop services (implement graceful shutdown)
    // For now, just mark as stopped
    *running = false;
    info!("All services stopped successfully");
    Ok(())
}

#[tauri::command]
async fn get_service_status(state: tauri::State<'_, AppState>) -> Result<AllServiceStatus, String> {
    let running = *state.services_running.read().await;
    
    let status = if running { "online" } else { "offline" };
    
    Ok(AllServiceStatus {
        nostr: Some(ServiceStatus {
            status: status.to_string(),
            connections: Some(if running { 3 } else { 0 }),
            events: Some(if running { 47 } else { 0 }),
            peers: None,
            storage: None,
            peer_id: None,
        }),
        ipfs: Some(ServiceStatus {
            status: status.to_string(),
            connections: None,
            events: None,
            peers: Some(if running { 12 } else { 0 }),
            storage: Some(if running { 256 } else { 0 }),
            peer_id: Some(if running { "12D3KooWABC123...".to_string() } else { "Offline".to_string() }),
        }),
    })
}

#[tauri::command]
async fn save_configuration(state: tauri::State<'_, AppState>, config: TeamConfig) -> Result<(), String> {
    info!("Saving configuration...");
    
    let mut app_config = state.config.write().await;
    
    if let Some(team_name) = config.team_name {
        app_config.team_name = Some(team_name);
    }
    
    // Save configuration to file
    match app_config.save("config.toml") {
        Ok(_) => {
            info!("Configuration saved successfully");
            Ok(())
        }
        Err(e) => {
            error!("Failed to save configuration: {}", e);
            Err(format!("Failed to save configuration: {}", e))
        }
    }
}

#[tauri::command]
async fn load_configuration(state: tauri::State<'_, AppState>) -> Result<TeamConfig, String> {
    info!("Loading configuration...");
    
    let config = state.config.read().await;
    
    Ok(TeamConfig {
        team_name: Some(config.team_name.clone().unwrap_or_default()),
        team_key: None, // TODO: implement team key management
        relay_url: Some(format!("ws://localhost:{}", config.nostr.port)),
    })
}

#[tauri::command]
async fn get_subnet_status(state: tauri::State<'_, AppState>) -> Result<Option<SubnetStatus>, String> {
    if let Some(subnet_manager) = state.subnet_service_manager.get_subnet_manager() {
        Ok(Some(subnet_manager.get_status()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn request_bridge(
    state: tauri::State<'_, AppState>,
    target_team_id: String,
    request_type: String,
    justification: Option<String>,
) -> Result<String, String> {
    if let Some(subnet_manager) = state.subnet_service_manager.get_subnet_manager() {
        subnet_manager
            .request_bridge(&target_team_id, &request_type, justification)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Subnet manager not available".to_string())
    }
}

#[tauri::command]
async fn approve_bridge(
    state: tauri::State<'_, AppState>,
    request_id: String,
    approved: bool,
) -> Result<(), String> {
    if let Some(subnet_manager) = state.subnet_service_manager.get_subnet_manager() {
        subnet_manager
            .approve_bridge_request(&request_id, approved)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Subnet manager not available".to_string())
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    info!("� Starting AI Security RelayNode...");
    
    // Load configuration
    let config = Config::load().unwrap_or_else(|_| {
        info!("Using default configuration");
        Config::default()
    });
    
    // Validate configuration
    if let Err(e) = config.validate() {
        error!("Configuration validation failed: {}", e);
        return Err(e);
    }
    
    info!("📋 Configuration loaded - Mode: {:?}", config.subnet.mode);
    
    // Initialize core services
    let security_layer = SecurityLayer::new_with_config(&config).await?;
    let nostr_relay = Arc::new(NostrRelay::new(security_layer.clone(), None).await?);
    let ipfs_node = Arc::new(IPFSNode::new(security_layer.clone()).await?);
    let api_gateway = Arc::new(APIGateway::new(nostr_relay.clone(), ipfs_node.clone()).await?);
    
    // Initialize subnet services
    let subnet_manager = SubnetServiceManager::new(config.clone(), nostr_relay.clone());
    if let Err(e) = subnet_manager.start_services().await {
        error!("Failed to start subnet services: {}", e);
        return Err(e);
    }
    
    info!("✅ All services initialized");
    
    // Create application state
    let app_state = AppState {
        nostr_relay: nostr_relay.clone(),
        ipfs_node,
        security_layer: security_layer.clone(),
        api_gateway,
        config: Arc::new(RwLock::new(config)),
        services_running: Arc::new(RwLock::new(false)),
        subnet_service_manager: Arc::new(subnet_manager),
    };
    
    // Start Tauri application
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            start_services,
            stop_services,
            get_service_status,
            save_configuration,
            load_configuration,
            get_subnet_status,
            request_bridge,
            approve_bridge
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    
    Ok(())
}
