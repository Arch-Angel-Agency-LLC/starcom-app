use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

use crate::security_layer::SecurityLayer;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NostrEvent {
    pub id: String,
    pub pubkey: String,
    pub created_at: u64,
    pub kind: u16,
    pub tags: Vec<Vec<String>>,
    pub content: String,
    pub sig: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: String,
    pub filters: Vec<Filter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Filter {
    pub ids: Option<Vec<String>>,
    pub authors: Option<Vec<String>>,
    pub kinds: Option<Vec<u16>>,
    pub since: Option<u64>,
    pub until: Option<u64>,
    pub limit: Option<u64>,
}

#[derive(thiserror::Error, Debug)]
pub enum RelayError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("WebSocket error: {0}")]
    WebSocket(#[from] tokio_tungstenite::tungstenite::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Security error: {0}")]
    Security(String),
}

#[derive(Clone)]
pub struct NostrRelay {
    subscriptions: Arc<RwLock<HashMap<String, Subscription>>>,
    events: Arc<RwLock<Vec<NostrEvent>>>,
    security_layer: Arc<SecurityLayer>,
}

impl NostrRelay {
    pub async fn new(security_layer: Arc<SecurityLayer>) -> Result<Self> {
        Ok(Self {
            subscriptions: Arc::new(RwLock::new(HashMap::new())),
            events: Arc::new(RwLock::new(Vec::new())),
            security_layer,
        })
    }

    pub async fn start(&self) -> Result<()> {
        use tokio::net::TcpListener;
        use tokio_tungstenite::accept_async;
        
        let listener = TcpListener::bind("127.0.0.1:8080").await
            .context("Failed to bind to port 8080")?;
            
        info!("🚀 Nostr relay started on ws://127.0.0.1:8080");

        while let Ok((stream, addr)) = listener.accept().await {
            let relay = self.clone();
            tokio::spawn(async move {
                match accept_async(stream).await {
                    Ok(ws_stream) => {
                        info!("📡 New connection from {}", addr);
                        if let Err(e) = relay.handle_connection(ws_stream).await {
                            error!("Connection error: {}", e);
                        }
                    }
                    Err(e) => {
                        error!("WebSocket handshake failed: {}", e);
                    }
                }
            });
        }

        Ok(())
    }

    async fn handle_connection(
        &self,
        mut ws_stream: tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>
    ) -> Result<()> {
        use tokio_tungstenite::tungstenite::Message;
        use futures_util::{SinkExt, StreamExt};

        while let Some(msg) = ws_stream.next().await {
            match msg? {
                Message::Text(text) => {
                    if let Err(e) = self.process_message(&text, &mut ws_stream).await {
                        warn!("Failed to process message: {}", e);
                    }
                }
                Message::Close(_) => {
                    info!("Connection closed");
                    break;
                }
                _ => {}
            }
        }

        Ok(())
    }

    async fn process_message(
        &self,
        message: &str,
        ws_stream: &mut tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>
    ) -> Result<()> {
        use tokio_tungstenite::tungstenite::Message;
        use futures_util::SinkExt;

        // Basic Nostr message processing
        // For Phase 1, we'll implement basic echo functionality
        info!("📨 Received message: {}", message);
        
        // Echo the message back for now
        let response = format!("Echo: {}", message);
        ws_stream.send(Message::Text(response)).await?;

        Ok(())
    }

    pub async fn get_connection_count(&self) -> usize {
        // TODO: Implement connection tracking
        0
    }
}
