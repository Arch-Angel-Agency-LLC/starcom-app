pub mod nostr_relay;
pub mod ipfs_node;
pub mod security_layer;
pub mod api_gateway;
pub mod config;
pub mod subnet_types;
pub mod services;
pub mod subnet_manager;

// Clean architecture modules
pub mod clean_subnet;
pub mod clean_gateway;
pub mod network_coordinator;
pub mod clean_config;
pub mod utils; // Shared utilities for clean architecture

// New Nostr protocol implementation modules
pub mod nostr_protocol;
pub mod event_store;
pub mod subscription_manager;

pub use nostr_relay::NostrRelay;
pub use ipfs_node::IPFSNode;
pub use security_layer::SecurityLayer;
pub use api_gateway::APIGateway;
pub use config::Config;
pub use subnet_manager::{SubnetManager, SubnetStatus};

// Clean architecture exports
pub use clean_subnet::{CleanSubnet, SubnetRole, SubnetMember, SubnetResource, ResourceType};
pub use clean_gateway::{CleanGateway, GatewayRequest, GatewayResponse, GatewayAction, GatewayProtocol, AccessPolicy};
pub use network_coordinator::{NetworkCoordinator, CleanRelayNode, NodeType, NodeStatus};
