use anyhow::{Result, Context};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

use crate::security_layer::SecurityLayer;

#[derive(thiserror::Error, Debug)]
pub enum IPFSError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Network error: {0}")]
    Network(String),
    #[error("Storage error: {0}")]
    Storage(String),
    #[error("Security error: {0}")]
    Security(String),
}

#[derive(Clone)]
pub struct IPFSNode {
    content_store: Arc<RwLock<HashMap<String, Vec<u8>>>>,
    security_layer: Arc<SecurityLayer>,
    peer_id: String,
}

impl IPFSNode {
    pub async fn new(security_layer: Arc<SecurityLayer>) -> Result<Self> {
        // Generate a simple peer ID for Phase 1
        let peer_id = format!("peer-{}", uuid::Uuid::new_v4());
        
        Ok(Self {
            content_store: Arc::new(RwLock::new(HashMap::new())),
            security_layer,
            peer_id,
        })
    }

    pub async fn start(&self) -> Result<()> {
        info!("🌐 IPFS node started with peer ID: {}", self.peer_id);
        info!("📦 Content storage initialized");
        
        // For Phase 1, we'll just run a simple storage service
        // TODO: Implement proper libp2p networking in Phase 2
        
        // Keep the service running
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
            info!("📊 IPFS node status: {} items stored", self.get_content_count().await);
        }
    }

    pub async fn store_content(&self, content: &[u8]) -> Result<String> {
        // Generate content hash (simplified for Phase 1)
        let hash = format!("Qm{}", uuid::Uuid::new_v4().to_string().replace("-", "")[..32].to_uppercase());
        
        // Encrypt content using security layer
        let encrypted_content = self.security_layer.encrypt_content(content).await
            .map_err(|e| IPFSError::Security(e.to_string()))?;
        
        // Store content
        {
            let mut store = self.content_store.write().await;
            store.insert(hash.clone(), encrypted_content);
        }
        
        info!("📦 Content stored with hash: {}", hash);
        Ok(hash)
    }

    pub async fn retrieve_content(&self, hash: &str) -> Result<Vec<u8>> {
        // Retrieve encrypted content
        let encrypted_content = {
            let store = self.content_store.read().await;
            store.get(hash).cloned()
                .ok_or_else(|| IPFSError::Storage(format!("Content not found: {}", hash)))?
        };
        
        // Decrypt content using security layer
        let content = self.security_layer.decrypt_content(&encrypted_content).await
            .map_err(|e| IPFSError::Security(e.to_string()))?;
        
        info!("📦 Content retrieved for hash: {}", hash);
        Ok(content)
    }

    pub async fn get_peer_id(&self) -> String {
        self.peer_id.clone()
    }

    pub async fn get_addresses(&self) -> Vec<String> {
        // For Phase 1, return local addresses
        vec![
            "/ip4/127.0.0.1/tcp/4001".to_string(),
            "/ip4/0.0.0.0/tcp/4001".to_string(),
        ]
    }

    pub async fn get_content_count(&self) -> usize {
        let store = self.content_store.read().await;
        store.len()
    }
}
