use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, mpsc};
use tokio_tungstenite::WebSocketStream;
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt}; // Added StreamExt for split()
use tracing::{info, warn, error, debug};
use uuid::Uuid;

use crate::nostr_relay::{NostrEvent, Filter};
use crate::nostr_protocol::{NostrResponse, EarthAllianceMetadata};
use crate::event_store::{EventStore, ClearanceLevel};
use crate::security_layer::SecurityLayer;

/// Connection information for WebSocket clients
#[derive(Debug, Clone)]
pub struct Connection {
    pub id: String,
    pub pubkey: Option<String>,
    pub team_id: Option<String>,
    pub clearance_level: Option<ClearanceLevel>,
    pub connected_at: u64,
    pub last_activity: u64,
    pub subscriptions: Vec<String>,
    pub message_sender: mpsc::UnboundedSender<String>,
}

/// Subscription information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: String,
    pub connection_id: String,
    pub filters: Vec<Filter>,
    pub created_at: u64,
    pub last_activity: u64,
    pub event_count: u64,
    // Earth Alliance specific
    pub team_restricted: bool,
    pub clearance_restricted: bool,
    pub evidence_only: bool,
}

/// Subscription manager for handling client subscriptions and event broadcasting
pub struct SubscriptionManager {
    connections: Arc<RwLock<HashMap<String, Connection>>>,
    subscriptions: Arc<RwLock<HashMap<String, Subscription>>>,
    event_store: Arc<dyn EventStore>,
    security_layer: Arc<SecurityLayer>,
}

impl SubscriptionManager {
    pub fn new(
        event_store: Arc<dyn EventStore>,
        security_layer: Arc<SecurityLayer>,
    ) -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
            subscriptions: Arc::new(RwLock::new(HashMap::new())),
            event_store,
            security_layer,
        }
    }

    /// Register a new WebSocket connection
    pub async fn register_connection(
        &self,
        ws_stream: WebSocketStream<tokio::net::TcpStream>,
    ) -> Result<String> {
        let connection_id = Uuid::new_v4().to_string();
        let (sender, mut receiver) = mpsc::unbounded_channel();
        
        let connection = Connection {
            id: connection_id.clone(),
            pubkey: None,
            team_id: None,
            clearance_level: None,
            connected_at: chrono::Utc::now().timestamp() as u64,
            last_activity: chrono::Utc::now().timestamp() as u64,
            subscriptions: Vec::new(),
            message_sender: sender,
        };

        // Store connection
        self.connections.write().await.insert(connection_id.clone(), connection);

        // Spawn task to handle outgoing messages for this connection
        let connection_id_clone = connection_id.clone();
        let connections_clone = Arc::clone(&self.connections);
        tokio::spawn(async move {
            let (mut ws_sender, _) = ws_stream.split();
            
            while let Some(message) = receiver.recv().await {
                if let Err(e) = ws_sender.send(Message::Text(message)).await {
                    error!("Failed to send message to connection {}: {}", connection_id_clone, e);
                    break;
                }
            }
            
            // Clean up connection when task ends
            connections_clone.write().await.remove(&connection_id_clone);
            info!("Connection {} closed and cleaned up", connection_id_clone);
        });

        info!("📡 New connection registered: {}", connection_id);
        Ok(connection_id)
    }

    /// Authenticate a connection with Earth Alliance credentials
    pub async fn authenticate_connection(
        &self,
        connection_id: &str,
        pubkey: &str,
        auth_event: &NostrEvent,
    ) -> Result<bool> {
        debug!("🔐 Authenticating connection: {}", connection_id);

        // Validate auth event
        if !self.validate_auth_event(auth_event).await? {
            warn!("❌ Invalid auth event for connection: {}", connection_id);
            return Ok(false);
        }

        // Get user's Earth Alliance profile
        let team_id = self.security_layer.get_user_team(pubkey).await?;
        let clearance_level = self.security_layer.get_user_clearance(pubkey).await?;

        // Update connection with authenticated info
        if let Some(connection) = self.connections.write().await.get_mut(connection_id) {
            connection.pubkey = Some(pubkey.to_string());
            connection.team_id = team_id;
            connection.clearance_level = Some(clearance_level);
            connection.last_activity = chrono::Utc::now().timestamp() as u64;
            
            info!("✅ Connection authenticated: {} (pubkey: {})", connection_id, pubkey);
            Ok(true)
        } else {
            warn!("❌ Connection not found for authentication: {}", connection_id);
            Ok(false)
        }
    }

    /// Create a new subscription
    pub async fn create_subscription(
        &self,
        connection_id: &str,
        sub_id: &str,
        filters: Vec<Filter>,
    ) -> Result<()> {
        debug!("📝 Creating subscription: {} for connection: {}", sub_id, connection_id);

        // Validate connection exists
        let connection = {
            let connections = self.connections.read().await;
            connections.get(connection_id).cloned()
        };

        let connection = connection.ok_or_else(|| {
            anyhow::anyhow!("Connection not found: {}", connection_id)
        })?;

        // Analyze filters for Earth Alliance features
        let (team_restricted, clearance_restricted, evidence_only) = 
            self.analyze_filters(&filters);

        let subscription = Subscription {
            id: sub_id.to_string(),
            connection_id: connection_id.to_string(),
            filters,
            created_at: chrono::Utc::now().timestamp() as u64,
            last_activity: chrono::Utc::now().timestamp() as u64,
            event_count: 0,
            team_restricted,
            clearance_restricted,
            evidence_only,
        };

        // Store subscription
        self.subscriptions.write().await.insert(sub_id.to_string(), subscription);

        // Update connection's subscription list
        if let Some(conn) = self.connections.write().await.get_mut(connection_id) {
            conn.subscriptions.push(sub_id.to_string());
            conn.last_activity = chrono::Utc::now().timestamp() as u64;
        }

        // Send historical events for this subscription
        self.send_historical_events(connection_id, sub_id).await?;

        info!("✅ Subscription created: {}", sub_id);
        Ok(())
    }

    /// Close a subscription
    pub async fn close_subscription(&self, connection_id: &str, sub_id: &str) -> Result<()> {
        debug!("🚫 Closing subscription: {} for connection: {}", sub_id, connection_id);

        // Remove subscription
        self.subscriptions.write().await.remove(sub_id);

        // Update connection's subscription list
        if let Some(connection) = self.connections.write().await.get_mut(connection_id) {
            connection.subscriptions.retain(|s| s != sub_id);
            connection.last_activity = chrono::Utc::now().timestamp() as u64;
        }

        // Send CLOSED message
        self.send_to_connection(
            connection_id,
            &NostrResponse::Closed {
                sub_id: sub_id.to_string(),
                message: "Subscription closed".to_string(),
            },
        ).await?;

        info!("✅ Subscription closed: {}", sub_id);
        Ok(())
    }

    /// Broadcast an event to all matching subscriptions
    pub async fn broadcast_event(&self, event: &NostrEvent) -> Result<()> {
        debug!("📢 Broadcasting event: {}", event.id);

        let subscriptions = self.subscriptions.read().await;
        let connections = self.connections.read().await;

        let mut broadcast_count = 0;

        for subscription in subscriptions.values() {
            // Check if event matches subscription filters
            if !self.event_matches_filters(event, &subscription.filters) {
                continue;
            }

            // Get connection for this subscription
            let connection = match connections.get(&subscription.connection_id) {
                Some(conn) => conn,
                None => {
                    warn!("Connection not found for subscription: {}", subscription.id);
                    continue;
                }
            };

            // Earth Alliance security checks
            if !self.can_access_event(connection, event, subscription).await? {
                debug!("🔒 Access denied for event {} to connection {}", event.id, connection.id);
                continue;
            }

            // Send event to connection
            let response = NostrResponse::Event {
                sub_id: subscription.id.clone(),
                event: event.clone(),
            };

            if let Err(e) = self.send_response_to_connection(connection, &response).await {
                warn!("Failed to send event to connection {}: {}", connection.id, e);
            } else {
                broadcast_count += 1;
            }
        }

        info!("📢 Event {} broadcast to {} connections", event.id, broadcast_count);
        Ok(())
    }

    /// Send historical events for a new subscription
    async fn send_historical_events(&self, connection_id: &str, sub_id: &str) -> Result<()> {
        debug!("📜 Sending historical events for subscription: {}", sub_id);

        let subscription = {
            let subscriptions = self.subscriptions.read().await;
            subscriptions.get(sub_id).cloned()
        };

        let subscription = subscription.ok_or_else(|| {
            anyhow::anyhow!("Subscription not found: {}", sub_id)
        })?;

        let connection = {
            let connections = self.connections.read().await;
            connections.get(connection_id).cloned() 
        };

        let connection = connection.ok_or_else(|| {
            anyhow::anyhow!("Connection not found: {}", connection_id)
        })?;

        // Query events based on filters and Earth Alliance permissions
        let events = if subscription.team_restricted {
            if let Some(team_id) = &connection.team_id {
                self.event_store.query_by_team(team_id, &subscription.filters).await?
            } else {
                Vec::new() // No team access
            }
        } else if subscription.clearance_restricted {
            if let Some(clearance) = &connection.clearance_level {
                self.event_store.query_by_clearance(clearance.clone(), &subscription.filters).await?
            } else {
                self.event_store.query_events(&subscription.filters).await?
            }
        } else {
            self.event_store.query_events(&subscription.filters).await?
        };

        // Send events to client
        let mut sent_count = 0;
        for event in events {
            if self.can_access_event(&connection, &event, &subscription).await? {
                let response = NostrResponse::Event {
                    sub_id: sub_id.to_string(),
                    event,
                };

                if let Err(e) = self.send_response_to_connection(&connection, &response).await {
                    warn!("Failed to send historical event: {}", e);
                } else {
                    sent_count += 1;
                }
            }
        }

        // Send EOSE (End of Stored Events)
        let eose_response = NostrResponse::EndOfStoredEvents {
            sub_id: sub_id.to_string(),
        };
        self.send_response_to_connection(&connection, &eose_response).await?;

        info!("📜 Sent {} historical events for subscription: {}", sent_count, sub_id);
        Ok(())
    }

    /// Check if a connection can access a specific event
    async fn can_access_event(
        &self,
        connection: &Connection,
        event: &NostrEvent,
        subscription: &Subscription,
    ) -> Result<bool> {
        // Extract event metadata
        let metadata = self.extract_event_metadata(event);

        // Team-based access control
        if let Some(event_team) = &metadata.team_id {
            if let Some(connection_team) = &connection.team_id {
                if event_team != connection_team && !subscription.team_restricted {
                    return Ok(false);
                }
            } else {
                return Ok(false); // No team membership
            }
        }

        // Clearance level check
        if let Some(event_clearance) = &metadata.clearance_level {
            if let Some(connection_clearance) = &connection.clearance_level {
                if !self.has_clearance_access(connection_clearance, event_clearance) {
                    return Ok(false);
                }
            } else {
                // No clearance - only allow unclassified
                if event_clearance != "unclassified" {
                    return Ok(false);
                }
            }
        }

        // Evidence-only filter
        if subscription.evidence_only && metadata.evidence_hash.is_none() {
            return Ok(false);
        }

        Ok(true)
    }

    /// Check if connection has sufficient clearance level
    fn has_clearance_access(&self, connection_clearance: &ClearanceLevel, event_clearance: &str) -> bool {
        let event_level = ClearanceLevel::from_string(event_clearance);
        
        use ClearanceLevel::*;
        match (connection_clearance, &event_level) {
            (EarthAlliance, _) => true, // Earth Alliance clearance can access everything
            (TopSecret, TopSecret | Secret | Confidential | Restricted | Unclassified) => true,
            (Secret, Secret | Confidential | Restricted | Unclassified) => true,
            (Confidential, Confidential | Restricted | Unclassified) => true,
            (Restricted, Restricted | Unclassified) => true,
            (Unclassified, Unclassified) => true,
            _ => false,
        }
    }

    /// Extract Earth Alliance metadata from event
    fn extract_event_metadata(&self, event: &NostrEvent) -> EarthAllianceMetadata {
        let mut metadata = EarthAllianceMetadata {
            team_id: None,
            clearance_level: None,
            evidence_hash: None,
            truth_score: None,
            verification_status: None,
            resistance_cell: None,
            operative_level: None,
        };

        for tag in &event.tags {
            if tag.len() >= 2 {
                match tag[0].as_str() {
                    "team" => metadata.team_id = Some(tag[1].clone()),
                    "clearance" => metadata.clearance_level = Some(tag[1].clone()),
                    "evidence" => metadata.evidence_hash = Some(tag[1].clone()),
                    "truth_score" => {
                        if let Ok(score) = tag[1].parse::<f64>() {
                            metadata.truth_score = Some(score);
                        }
                    }
                    "verification" => metadata.verification_status = Some(tag[1].clone()),
                    "cell" => metadata.resistance_cell = Some(tag[1].clone()),
                    "operative" => metadata.operative_level = Some(tag[1].clone()),
                    _ => {}
                }
            }
        }

        metadata
    }

    /// Analyze filters to determine Earth Alliance features
    fn analyze_filters(&self, filters: &[Filter]) -> (bool, bool, bool) {
        let mut team_restricted = false;
        let mut clearance_restricted = false;
        let mut evidence_only = false;

        for filter in filters {
            // Check for team-specific tags
            // Note: This is a simplified implementation
            // In practice, you'd need to look at the filter structure more carefully
            if let Some(authors) = &filter.authors {
                if !authors.is_empty() {
                    team_restricted = true;
                }
            }

            // Check for clearance restrictions
            if let Some(kinds) = &filter.kinds {
                // Kind 30000+ typically reserved for classified content
                if kinds.iter().any(|&k| k >= 30000) {
                    clearance_restricted = true;
                }
            }

            // Check for evidence-only filters
            // Kind 1984 is used for evidence events in Earth Alliance
            if let Some(kinds) = &filter.kinds {
                if kinds.contains(&1984) {
                    evidence_only = true;
                }
            }
        }

        (team_restricted, clearance_restricted, evidence_only)
    }

    /// Check if event matches filters
    fn event_matches_filters(&self, event: &NostrEvent, filters: &[Filter]) -> bool {
        if filters.is_empty() {
            return true;
        }

        for filter in filters {
            if self.event_matches_filter(event, filter) {
                return true;
            }
        }

        false
    }

    /// Check if event matches a specific filter
    fn event_matches_filter(&self, event: &NostrEvent, filter: &Filter) -> bool {
        // Check IDs
        if let Some(ids) = &filter.ids {
            if !ids.is_empty() && !ids.contains(&event.id) {
                return false;
            }
        }

        // Check authors
        if let Some(authors) = &filter.authors {
            if !authors.is_empty() && !authors.contains(&event.pubkey) {
                return false;
            }
        }

        // Check kinds
        if let Some(kinds) = &filter.kinds {
            if !kinds.is_empty() && !kinds.contains(&event.kind) {
                return false;
            }
        }

        // Check time range
        if let Some(since) = filter.since {
            if event.created_at < since {
                return false;
            }
        }

        if let Some(until) = filter.until {
            if event.created_at > until {
                return false;
            }
        }

        true
    }

    /// Validate authentication event
    async fn validate_auth_event(&self, auth_event: &NostrEvent) -> Result<bool> {
        // Basic validation - in production you'd want more comprehensive checks
        if auth_event.kind != 22242 {
            return Ok(false); // NIP-42 auth event kind
        }

        // Validate signature and structure
        // This is simplified - you'd want proper NIP-42 validation
        Ok(!auth_event.sig.is_empty() && !auth_event.pubkey.is_empty())
    }

    /// Send response to a specific connection
    async fn send_response_to_connection(
        &self,
        connection: &Connection,
        response: &NostrResponse,
    ) -> Result<()> {
        let response_json = self.serialize_response(response)?;
        
        if let Err(e) = connection.message_sender.send(response_json) {
            return Err(anyhow::anyhow!("Failed to send to connection: {}", e));
        }

        Ok(())
    }

    /// Send message to connection by ID
    async fn send_to_connection(&self, connection_id: &str, response: &NostrResponse) -> Result<()> {
        let connection = {
            let connections = self.connections.read().await;
            connections.get(connection_id).cloned()
        };

        if let Some(connection) = connection {
            self.send_response_to_connection(&connection, response).await
        } else {
            Err(anyhow::anyhow!("Connection not found: {}", connection_id))
        }
    }

    /// Serialize response to JSON
    fn serialize_response(&self, response: &NostrResponse) -> Result<String> {
        use serde_json::json;

        let json_array = match response {
            NostrResponse::Event { sub_id, event } => {
                json!(["EVENT", sub_id, event])
            }
            NostrResponse::Ok { event_id, accepted, message } => {
                json!(["OK", event_id, accepted, message])
            }
            NostrResponse::EndOfStoredEvents { sub_id } => {
                json!(["EOSE", sub_id])
            }
            NostrResponse::Closed { sub_id, message } => {
                json!(["CLOSED", sub_id, message])
            }
            NostrResponse::Notice { message } => {
                json!(["NOTICE", message])
            }
            NostrResponse::Count { sub_id, count } => {
                json!(["COUNT", sub_id, count])
            }
            NostrResponse::Auth { challenge } => {
                json!(["AUTH", challenge])
            }
        };

        serde_json::to_string(&json_array)
            .context("Failed to serialize response")
    }

    /// Get connection statistics
    pub async fn get_connection_count(&self) -> usize {
        self.connections.read().await.len()
    }

    /// Get subscription statistics  
    pub async fn get_subscription_count(&self) -> usize {
        self.subscriptions.read().await.len()
    }

    /// Clean up inactive connections and subscriptions
    pub async fn cleanup_inactive(&self, max_idle_seconds: u64) -> Result<()> {
        let current_time = chrono::Utc::now().timestamp() as u64;
        let mut removed_connections = Vec::new();
        let mut removed_subscriptions = Vec::new();

        // Clean up connections
        {
            let mut connections = self.connections.write().await;
            connections.retain(|id, connection| {
                let is_active = (current_time - connection.last_activity) < max_idle_seconds;
                if !is_active {
                    removed_connections.push(id.clone());
                }
                is_active
            });
        }

        // Clean up subscriptions for removed connections
        {
            let mut subscriptions = self.subscriptions.write().await;
            subscriptions.retain(|id, subscription| {
                let is_active = !removed_connections.contains(&subscription.connection_id);
                if !is_active {
                    removed_subscriptions.push(id.clone());
                }
                is_active
            });
        }

        if !removed_connections.is_empty() || !removed_subscriptions.is_empty() {
            info!("🧹 Cleaned up {} inactive connections and {} subscriptions", 
                  removed_connections.len(), removed_subscriptions.len());
        }

        Ok(())
    }
}
