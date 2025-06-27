// AI Security RelayNode - Working Clean Architecture
// Infrastructure modules first
pub mod utils;
pub mod config;
pub mod database;
pub mod nostr_protocol;
pub mod event_store;
pub mod subscription_manager;
pub mod nostr_relay;
pub mod ipfs_node;
pub mod security_layer;
pub mod api_gateway;
pub mod investigation_service;
pub mod investigation_api;

// Security modules
pub mod auth;
pub mod validation;

// Legacy modules for compatibility
pub mod subnet_types;
pub mod services;
pub mod subnet_manager;

// Clean architecture modules (simplified for now)
pub mod clean_config_simple;

// Exports for compatibility
pub use nostr_relay::NostrRelay;
pub use ipfs_node::IPFSNode;
pub use security_layer::SecurityLayer;
pub use api_gateway::APIGateway;
pub use config::Config;
pub use subnet_manager::{SubnetManager, SubnetStatus};
pub use event_store::ClearanceLevel;
pub use investigation_service::{InvestigationService, Investigation, InvestigationTask, Evidence};
pub use database::DatabaseManager;

// Result type
pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
