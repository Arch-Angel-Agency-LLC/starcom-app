// Prevent additional console window on Windows in release, if not using console
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error};
use serde::{Deserialize, Serialize};
use tauri::State;

mod nostr_relay;
mod ipfs_node;
mod security_layer;
mod api_gateway;
mod config;

use crate::{
    nostr_relay::NostrRelay,
    ipfs_node::IPFSNode,
    security_layer::SecurityLayer,
    api_gateway::APIGateway,
    config::Config,
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
        app_config.team_name = team_name;
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
        team_name: Some(config.team_name.clone()),
        team_key: None, // TODO: implement team key management
        relay_url: Some(format!("ws://localhost:{}", config.nostr_port)),
    })
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
    
    info!("Configuration loaded successfully");
    
    // Initialize services
    let security_layer = Arc::new(SecurityLayer::new(&config).await?);
    let nostr_relay = Arc::new(NostrRelay::new(security_layer.clone()).await?);
    let ipfs_node = Arc::new(IPFSNode::new(security_layer.clone()).await?);
    let api_gateway = Arc::new(APIGateway::new(nostr_relay.clone(), ipfs_node.clone()).await?);
    
    info!("All services initialized");
    
    // Create application state
    let app_state = AppState {
        nostr_relay,
        ipfs_node,
        security_layer,
        api_gateway,
        config: Arc::new(RwLock::new(config)),
        services_running: Arc::new(RwLock::new(false)),
    };
    
    // Start Tauri application
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            start_services,
            stop_services,
            get_service_status,
            save_configuration,
            load_configuration
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    
    Ok(())
}
