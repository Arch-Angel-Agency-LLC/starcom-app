use anyhow::{Result, Context};
use axum::{
    extract::State,
    http::{StatusCode, Method, header::{AUTHORIZATION, CONTENT_TYPE}},
    response::Json,
    routing::{get, post},
    Router, middleware,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, error};
use tower_http::cors::{CorsLayer, Any};

use crate::{
    nostr_relay::NostrRelay, 
    ipfs_node::IPFSNode, 
    investigation_service::InvestigationService, 
    investigation_api,
    auth::auth_middleware,
};

#[derive(thiserror::Error, Debug)]
pub enum APIError {
    #[error("Server error: {0}")]
    Server(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub services: Vec<ServiceStatus>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct ServiceStatus {
    pub name: String,
    pub healthy: bool,
    pub details: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ServicesResponse {
    pub nostr_relay: NostrServiceInfo,
    pub ipfs_node: IPFSServiceInfo,
}

#[derive(Debug, Serialize)]
pub struct NostrServiceInfo {
    pub endpoint: String,
    pub status: String,
    pub connections: usize,
}

#[derive(Debug, Serialize)]
pub struct IPFSServiceInfo {
    pub peer_id: String,
    pub addresses: Vec<String>,
    pub status: String,
    pub content_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct StoreContentRequest {
    pub data: Vec<u8>,
}

#[derive(Debug, Serialize)]
pub struct StoreContentResponse {
    pub hash: String,
}

#[derive(Clone)]
pub struct APIGateway {
    nostr_relay: Arc<NostrRelay>,
    ipfs_node: Arc<IPFSNode>,
    investigation_service: Arc<InvestigationService>,
}

impl APIGateway {
    pub async fn new(
        nostr_relay: Arc<NostrRelay>,
        ipfs_node: Arc<IPFSNode>,
        investigation_service: Arc<InvestigationService>,
    ) -> Result<Self> {
        Ok(Self {
            nostr_relay,
            ipfs_node,
            investigation_service,
        })
    }

    pub async fn start(&self) -> Result<()> {
        // Configure CORS for secure cross-origin requests
        let cors = CorsLayer::new()
            .allow_origin("http://localhost:3000".parse::<axum::http::HeaderValue>().unwrap())
            .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
            .allow_headers([AUTHORIZATION, CONTENT_TYPE])
            .allow_credentials(true);

        // Create investigation router with investigation service
        let investigation_router = investigation_api::create_investigation_router()
            .with_state(self.investigation_service.clone());

        // Create public routes (no authentication required)
        let public_routes = Router::new()
            .route("/api/v1/health", get(health_check))
            .route("/api/v1/services", get(get_services))
            .with_state(self.clone());

        // Create protected routes (authentication required)
        let protected_routes = Router::new()
            .route("/api/v1/nostr/status", get(nostr_status))
            .route("/api/v1/ipfs/status", get(ipfs_status))
            .route("/api/v1/ipfs/store", post(store_content))
            .merge(investigation_router)
            .layer(middleware::from_fn(auth_middleware))
            .with_state(self.clone());
            
        let app = Router::new()
            .merge(public_routes)
            .merge(protected_routes)
            // Apply CORS to all routes
            .layer(cors);

        let listener = tokio::net::TcpListener::bind("127.0.0.1:8081").await
            .context("Failed to bind API server to port 8081")?;
            
        info!("🌐 API Gateway started on http://127.0.0.1:8081");
        info!("🔐 Authentication middleware enabled");
        info!("🛡️  CORS protection configured");
        
        axum::serve(listener, app).await
            .context("API server failed")?;
            
        Ok(())
    }
}

// API endpoint handlers
async fn health_check(State(gateway): State<APIGateway>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        services: vec![
            ServiceStatus {
                name: "nostr-relay".to_string(),
                healthy: true,
                details: Some("Running on ws://127.0.0.1:8080".to_string()),
            },
            ServiceStatus {
                name: "ipfs-node".to_string(),
                healthy: true,
                details: Some("Storage service active".to_string()),
            },
        ],
        timestamp: chrono::Utc::now(),
    })
}

async fn get_services(State(gateway): State<APIGateway>) -> Json<ServicesResponse> {
    let nostr_connections = gateway.nostr_relay.get_connection_count().await;
    let ipfs_peer_id = gateway.ipfs_node.get_peer_id().await;
    let ipfs_addresses = gateway.ipfs_node.get_addresses().await;
    let ipfs_content_count = gateway.ipfs_node.get_content_count().await;

    Json(ServicesResponse {
        nostr_relay: NostrServiceInfo {
            endpoint: "ws://127.0.0.1:8080".to_string(),
            status: "active".to_string(),
            connections: nostr_connections,
        },
        ipfs_node: IPFSServiceInfo {
            peer_id: ipfs_peer_id,
            addresses: ipfs_addresses,
            status: "active".to_string(),
            content_count: ipfs_content_count,
        },
    })
}

async fn nostr_status(State(gateway): State<APIGateway>) -> Json<NostrServiceInfo> {
    let connections = gateway.nostr_relay.get_connection_count().await;
    
    Json(NostrServiceInfo {
        endpoint: "ws://127.0.0.1:8080".to_string(),
        status: "active".to_string(),
        connections,
    })
}

async fn ipfs_status(State(gateway): State<APIGateway>) -> Json<IPFSServiceInfo> {
    let peer_id = gateway.ipfs_node.get_peer_id().await;
    let addresses = gateway.ipfs_node.get_addresses().await;
    let content_count = gateway.ipfs_node.get_content_count().await;
    
    Json(IPFSServiceInfo {
        peer_id,
        addresses,
        status: "active".to_string(),
        content_count,
    })
}

async fn store_content(
    State(gateway): State<APIGateway>,
    Json(request): Json<StoreContentRequest>
) -> Result<Json<StoreContentResponse>, StatusCode> {
    match gateway.ipfs_node.store_content(&request.data).await {
        Ok(hash) => Ok(Json(StoreContentResponse { hash })),
        Err(e) => {
            error!("Failed to store content: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
