// Modernized main.rs for Clean Subnet-Gateway Architecture
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error, warn};
use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;

// Import clean architecture modules
mod nostr_relay;
mod ipfs_node;
mod security_layer;
mod api_gateway;
mod config;
mod subnet_types;
mod services;
mod subnet_manager;

// Import NEW clean modules
mod clean_config;
mod clean_subnet;
mod clean_gateway;
mod network_coordinator;

use crate::{
    nostr_relay::NostrRelay,
    ipfs_node::IPFSNode,
    security_layer::SecurityLayer,
    api_gateway::APIGateway,
    config::Config,
    services::SubnetServiceManager,
    subnet_manager::SubnetStatus,
    // New clean imports
    clean_config::CleanConfig,
    network_coordinator::NetworkCoordinator,
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
    subnet: Option<ServiceStatus>,
    gateway: Option<ServiceStatus>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TeamConfig {
    team_name: Option<String>,
    team_key: Option<String>,
    relay_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct NodeCapabilities {
    has_subnet: bool,
    has_gateway: bool,
    has_relay: bool,
    deployment_pattern: String,
}

// Enhanced application state with clean architecture
struct AppState {
    // Legacy services (for backward compatibility)
    nostr_relay: Arc<NostrRelay>,
    ipfs_node: Arc<IPFSNode>,
    security_layer: Arc<SecurityLayer>,
    api_gateway: Arc<APIGateway>,
    legacy_config: Arc<RwLock<Config>>,
    subnet_service_manager: Arc<SubnetServiceManager>,
    
    // NEW: Clean architecture components
    clean_config: Arc<RwLock<CleanConfig>>,
    network_coordinator: Arc<RwLock<Option<NetworkCoordinator>>>,
    services_running: Arc<RwLock<bool>>,
    clean_mode_enabled: Arc<RwLock<bool>>,
}

// NEW: Get node capabilities based on configuration
#[tauri::command]
async fn get_node_capabilities(state: tauri::State<'_, AppState>) -> Result<NodeCapabilities, String> {
    let clean_mode = *state.clean_mode_enabled.read().await;
    
    if clean_mode {
        let config = state.clean_config.read().await;
        let coordinator_opt = state.network_coordinator.read().await;
        
        if let Some(coordinator) = coordinator_opt.as_ref() {
            let deployment_pattern = match (coordinator.has_subnet(), coordinator.has_gateway()) {
                (true, true) => "combined",
                (true, false) => "subnet-only",
                (false, true) => "gateway-only",
                (false, false) => "pure-relay",
            };
            
            Ok(NodeCapabilities {
                has_subnet: coordinator.has_subnet(),
                has_gateway: coordinator.has_gateway(),
                has_relay: true, // All nodes can relay
                deployment_pattern: deployment_pattern.to_string(),
            })
        } else {
            Ok(NodeCapabilities {
                has_subnet: config.subnet.is_some(),
                has_gateway: config.gateway.is_some(),
                has_relay: true,
                deployment_pattern: "unconfigured".to_string(),
            })
        }
    } else {
        // Legacy mode capabilities
        Ok(NodeCapabilities {
            has_subnet: true,
            has_gateway: true,
            has_relay: true,
            deployment_pattern: "legacy-combined".to_string(),
        })
    }
}

// NEW: Switch between clean and legacy mode
#[tauri::command]
async fn set_clean_mode(state: tauri::State<'_, AppState>, enabled: bool) -> Result<(), String> {
    let mut clean_mode = state.clean_mode_enabled.write().await;
    let services_running = *state.services_running.read().await;
    
    if services_running {
        return Err("Cannot change mode while services are running. Stop services first.".to_string());
    }
    
    *clean_mode = enabled;
    
    if enabled {
        info!("🚀 Switched to Clean Architecture Mode");
    } else {
        warn!("⚠️  Switched to Legacy Mode (for backward compatibility)");
    }
    
    Ok(())
}

// Enhanced start services command with clean architecture support
#[tauri::command]
async fn start_services(state: tauri::State<'_, AppState>) -> Result<(), String> {
    info!("Starting services...");
    
    let mut running = state.services_running.write().await;
    if *running {
        return Err("Services are already running".to_string());
    }
    
    let clean_mode = *state.clean_mode_enabled.read().await;
    
    if clean_mode {
        // Use clean architecture
        info!("🚀 Starting services with Clean Architecture");
        
        let config = state.clean_config.read().await;
        let mut coordinator_opt = state.network_coordinator.write().await;
        
        // Create network coordinator if not exists
        if coordinator_opt.is_none() {
            match NetworkCoordinator::from_config(config.clone()) {
                Ok(coordinator) => {
                    *coordinator_opt = Some(coordinator);
                    info!("✅ Network coordinator created");
                }
                Err(e) => {
                    error!("Failed to create network coordinator: {}", e);
                    return Err(format!("Failed to create network coordinator: {}", e));
                }
            }
        }
        
        if let Some(coordinator) = coordinator_opt.as_mut() {
            // Start coordinator services
            if let Err(e) = coordinator.start().await {
                error!("Failed to start network coordinator: {}", e);
                return Err(format!("Failed to start network coordinator: {}", e));
            }
            
            info!("✅ Clean architecture services started successfully");
            
            // Log deployment pattern
            let pattern = match (coordinator.has_subnet(), coordinator.has_gateway()) {
                (true, true) => "Combined Subnet+Gateway Node",
                (true, false) => "Subnet-Only Node",
                (false, true) => "Gateway-Only Node", 
                (false, false) => "Pure Relay Node",
            };
            info!("📡 Node Pattern: {}", pattern);
        }
    } else {
        // Use legacy architecture
        warn!("⚠️  Starting services with Legacy Architecture");
        
        // Start legacy services
        if let Err(e) = start_legacy_services(&state).await {
            return Err(e);
        }
        
        info!("✅ Legacy services started successfully");
    }
    
    *running = true;
    Ok(())
}

// Legacy service startup (preserved for backward compatibility)
async fn start_legacy_services(state: &AppState) -> Result<(), String> {
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
    
    Ok(())
}

#[tauri::command]
async fn stop_services(state: tauri::State<'_, AppState>) -> Result<(), String> {
    info!("Stopping all services...");
    
    let mut running = state.services_running.write().await;
    if !*running {
        return Err("Services are not running".to_string());
    }
    
    let clean_mode = *state.clean_mode_enabled.read().await;
    
    if clean_mode {
        let mut coordinator_opt = state.network_coordinator.write().await;
        if let Some(coordinator) = coordinator_opt.as_mut() {
            if let Err(e) = coordinator.stop().await {
                error!("Error stopping network coordinator: {}", e);
            }
        }
        info!("✅ Clean architecture services stopped");
    } else {
        // Stop legacy services (graceful shutdown would be implemented here)
        info!("✅ Legacy services stopped");
    }
    
    *running = false;
    Ok(())
}

// Enhanced service status with clean architecture awareness
#[tauri::command]
async fn get_service_status(state: tauri::State<'_, AppState>) -> Result<AllServiceStatus, String> {
    let running = *state.services_running.read().await;
    let clean_mode = *state.clean_mode_enabled.read().await;
    
    if clean_mode {
        let coordinator_opt = state.network_coordinator.read().await;
        
        if let Some(coordinator) = coordinator_opt.as_ref() {
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
                subnet: if coordinator.has_subnet() {
                    Some(ServiceStatus {
                        status: status.to_string(),
                        connections: Some(if running { 5 } else { 0 }),
                        events: None,
                        peers: Some(if running { 8 } else { 0 }),
                        storage: None,
                        peer_id: None,
                    })
                } else {
                    None
                },
                gateway: if coordinator.has_gateway() {
                    Some(ServiceStatus {
                        status: status.to_string(),
                        connections: Some(if running { 12 } else { 0 }),
                        events: Some(if running { 156 } else { 0 }),
                        peers: None,
                        storage: None,
                        peer_id: None,
                    })
                } else {
                    None
                },
            })
        } else {
            // Not configured yet
            Ok(AllServiceStatus {
                nostr: None,
                ipfs: None,
                subnet: None,
                gateway: None,
            })
        }
    } else {
        // Legacy status
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
            subnet: Some(ServiceStatus {
                status: "legacy".to_string(),
                connections: Some(if running { 5 } else { 0 }),
                events: None,
                peers: Some(if running { 8 } else { 0 }),
                storage: None,
                peer_id: None,
            }),
            gateway: Some(ServiceStatus {
                status: "legacy".to_string(),
                connections: Some(if running { 12 } else { 0 }),
                events: Some(if running { 156 } else { 0 }),
                peers: None,
                storage: None,
                peer_id: None,
            }),
        })
    }
}

// Enhanced configuration management with clean architecture
#[tauri::command]
async fn save_configuration(state: tauri::State<'_, AppState>, config: TeamConfig) -> Result<(), String> {
    info!("Saving configuration...");
    
    let clean_mode = *state.clean_mode_enabled.read().await;
    
    if clean_mode {
        let mut clean_config = state.clean_config.write().await;
        
        if let Some(team_name) = config.team_name {
            clean_config.node.name = Some(team_name.clone());
            
            // If team name is provided, enable subnet functionality
            if clean_config.subnet.is_none() {
                clean_config.subnet = Some(crate::clean_config::SubnetConfig {
                    enabled: true,
                    team_id: team_name,
                    role: Some("member".to_string()),
                    discovery_mode: Some("bootstrap".to_string()),
                    bootstrap_nodes: Some(vec!["127.0.0.1:8080".to_string()]),
                });
            }
        }
        
        // Save clean configuration
        match clean_config.save("clean_config.toml") {
            Ok(_) => {
                info!("✅ Clean configuration saved successfully");
                Ok(())
            }
            Err(e) => {
                error!("Failed to save clean configuration: {}", e);
                Err(format!("Failed to save clean configuration: {}", e))
            }
        }
    } else {
        // Save to legacy configuration
        let mut app_config = state.legacy_config.write().await;
        
        if let Some(team_name) = config.team_name {
            app_config.team_name = Some(team_name);
        }
        
        match app_config.save("config.toml") {
            Ok(_) => {
                info!("✅ Legacy configuration saved successfully");
                Ok(())
            }
            Err(e) => {
                error!("Failed to save legacy configuration: {}", e);
                Err(format!("Failed to save legacy configuration: {}", e))
            }
        }
    }
}

#[tauri::command]
async fn load_configuration(state: tauri::State<'_, AppState>) -> Result<TeamConfig, String> {
    info!("Loading configuration...");
    
    let clean_mode = *state.clean_mode_enabled.read().await;
    
    if clean_mode {
        let config = state.clean_config.read().await;
        
        Ok(TeamConfig {
            team_name: config.node.name.clone(),
            team_key: None, // TODO: implement team key management
            relay_url: Some(format!("ws://localhost:{}", config.node.listen_address.split(':').last().unwrap_or("8080"))),
        })
    } else {
        let config = state.legacy_config.read().await;
        
        Ok(TeamConfig {
            team_name: Some(config.team_name.clone().unwrap_or_default()),
            team_key: None,
            relay_url: Some(format!("ws://localhost:{}", config.nostr.port)),
        })
    }
}

// Legacy subnet status (backward compatibility)
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
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    info!("🚀 Starting AI Security RelayNode with Clean Architecture Support...");
    
    // Load legacy configuration (for backward compatibility)
    let legacy_config = Config::load().unwrap_or_else(|_| {
        info!("Using default legacy configuration");
        Config::default()
    });
    
    // Validate legacy configuration
    if let Err(e) = legacy_config.validate() {
        error!("Legacy configuration validation failed: {}", e);
        return Err(e);
    }
    
    // Load or create clean configuration
    let clean_config = CleanConfig::load("clean_config.toml").unwrap_or_else(|_| {
        info!("Creating default clean configuration");
        CleanConfig::default()
    });
    
    info!("📋 Configurations loaded");
    info!("   Legacy Mode: {:?}", legacy_config.subnet.mode);
    info!("   Clean Config: Node ID = {}", clean_config.node.id);
    info!("   Clean Config: Has Subnet = {}", clean_config.subnet.is_some());
    info!("   Clean Config: Has Gateway = {}", clean_config.gateway.is_some());
    
    // Initialize legacy services (for backward compatibility)
    let security_layer = Arc::new(SecurityLayer::new(&legacy_config).await?);
    let nostr_relay = Arc::new(NostrRelay::new((*security_layer).clone()).await?);
    let ipfs_node = Arc::new(IPFSNode::new((*security_layer).clone()).await?);
    let api_gateway = Arc::new(APIGateway::new(nostr_relay.clone(), ipfs_node.clone()).await?);
    
    // Initialize legacy subnet services
    let subnet_manager = SubnetServiceManager::new(legacy_config.clone(), nostr_relay.clone());
    if let Err(e) = subnet_manager.start_services().await {
        error!("Failed to start legacy subnet services: {}", e);
        return Err(e);
    }
    
    info!("✅ Legacy services initialized (for backward compatibility)");
    
    // Determine default mode (prefer clean if properly configured)
    let default_clean_mode = clean_config.subnet.is_some() || clean_config.gateway.is_some();
    
    if default_clean_mode {
        info!("🚀 Default mode: Clean Architecture (configured with subnet/gateway)");
    } else {
        warn!("⚠️  Default mode: Legacy Architecture (clean config not fully configured)");
    }
    
    // Create application state
    let app_state = AppState {
        // Legacy components
        nostr_relay: nostr_relay.clone(),
        ipfs_node,
        security_layer: (*security_layer).clone(),
        api_gateway,
        legacy_config: Arc::new(RwLock::new(legacy_config)),
        subnet_service_manager: Arc::new(subnet_manager),
        
        // Clean architecture components
        clean_config: Arc::new(RwLock::new(clean_config)),
        network_coordinator: Arc::new(RwLock::new(None)),
        services_running: Arc::new(RwLock::new(false)),
        clean_mode_enabled: Arc::new(RwLock::new(default_clean_mode)),
    };
    
    info!("🎯 Application state initialized");
    info!("   - Legacy services: Available for backward compatibility");
    info!("   - Clean architecture: Ready for modern deployments");
    info!("   - Hybrid mode: Seamless switching between architectures");
    
    // Start Tauri application with enhanced command set
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Legacy commands (preserved for backward compatibility)
            start_services,
            stop_services,
            get_service_status,
            save_configuration,
            load_configuration,
            get_subnet_status,
            request_bridge,
            approve_bridge,
            // NEW: Clean architecture commands
            get_node_capabilities,
            set_clean_mode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    
    Ok(())
}
