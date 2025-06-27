use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashMap;
use tracing::{info, warn, error, debug};

use crate::nostr_relay::{NostrEvent, Filter};
use crate::security_layer::SecurityLayer;

/// Core Nostr message types according to NIP-01
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NostrMessage {
    /// ["EVENT", <event JSON as defined above>]
    Event(NostrEvent),
    /// ["REQ", <subscription_id>, <filters JSON>...]
    Req { sub_id: String, filters: Vec<Filter> },
    /// ["CLOSE", <subscription_id>]
    Close { sub_id: String },
    /// ["COUNT", <subscription_id>, <filters JSON>...]
    Count { sub_id: String, filters: Vec<Filter> },
    /// ["AUTH", <event JSON as defined above>]
    Auth(NostrEvent),
}

/// Nostr relay response messages
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NostrResponse {
    /// ["EVENT", <subscription_id>, <event JSON as defined above>]
    Event { sub_id: String, event: NostrEvent },
    /// ["OK", <event_id>, <true|false>, <message>]
    Ok { event_id: String, accepted: bool, message: String },
    /// ["EOSE", <subscription_id>]
    EndOfStoredEvents { sub_id: String },
    /// ["CLOSED", <subscription_id>, <message>]
    Closed { sub_id: String, message: String },
    /// ["NOTICE", <message>]
    Notice { message: String },
    /// ["COUNT", <subscription_id>, <count>]
    Count { sub_id: String, count: u64 },
    /// ["AUTH", <challenge>]
    Auth { challenge: String },
}

/// Earth Alliance specific event metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EarthAllianceMetadata {
    pub team_id: Option<String>,
    pub clearance_level: Option<String>,
    pub evidence_hash: Option<String>,
    pub truth_score: Option<f64>,
    pub verification_status: Option<String>,
    pub resistance_cell: Option<String>,
    pub operative_level: Option<String>,
}

/// Enhanced Nostr event with Earth Alliance features
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedNostrEvent {
    #[serde(flatten)]
    pub base_event: NostrEvent,
    pub earth_alliance: Option<EarthAllianceMetadata>,
}

/// Protocol handler for Nostr messages
pub struct NostrProtocolHandler {
    security_layer: std::sync::Arc<SecurityLayer>,
}

impl NostrProtocolHandler {
    pub fn new(security_layer: std::sync::Arc<SecurityLayer>) -> Self {
        Self { security_layer }
    }

    /// Parse incoming WebSocket message as Nostr protocol message
    pub fn parse_message(&self, raw_message: &str) -> Result<NostrMessage> {
        debug!("📥 Parsing Nostr message: {}", raw_message);
        
        // Parse as JSON array
        let json_array: Vec<Value> = serde_json::from_str(raw_message)
            .context("Failed to parse message as JSON array")?;
        
        if json_array.is_empty() {
            return Err(anyhow::anyhow!("Empty message array"));
        }
        
        let message_type = json_array[0].as_str()
            .context("Message type must be a string")?;
        
        match message_type {
            "EVENT" => {
                if json_array.len() != 2 {
                    return Err(anyhow::anyhow!("EVENT message must have exactly 2 elements"));
                }
                let event: NostrEvent = serde_json::from_value(json_array[1].clone())
                    .context("Failed to parse EVENT")?;
                Ok(NostrMessage::Event(event))
            }
            "REQ" => {
                if json_array.len() < 2 {
                    return Err(anyhow::anyhow!("REQ message must have at least 2 elements"));
                }
                let sub_id = json_array[1].as_str()
                    .context("Subscription ID must be a string")?
                    .to_string();
                
                let mut filters = Vec::new();
                for filter_value in json_array.iter().skip(2) {
                    let filter: Filter = serde_json::from_value(filter_value.clone())
                        .context("Failed to parse filter")?;
                    filters.push(filter);
                }
                
                Ok(NostrMessage::Req { sub_id, filters })
            }
            "CLOSE" => {
                if json_array.len() != 2 {
                    return Err(anyhow::anyhow!("CLOSE message must have exactly 2 elements"));
                }
                let sub_id = json_array[1].as_str()
                    .context("Subscription ID must be a string")?
                    .to_string();
                Ok(NostrMessage::Close { sub_id })
            }
            "COUNT" => {
                if json_array.len() < 2 {
                    return Err(anyhow::anyhow!("COUNT message must have at least 2 elements"));
                }
                let sub_id = json_array[1].as_str()
                    .context("Subscription ID must be a string")?
                    .to_string();
                
                let mut filters = Vec::new();
                for filter_value in json_array.iter().skip(2) {
                    let filter: Filter = serde_json::from_value(filter_value.clone())
                        .context("Failed to parse filter")?;
                    filters.push(filter);
                }
                
                Ok(NostrMessage::Count { sub_id, filters })
            }
            "AUTH" => {
                if json_array.len() != 2 {
                    return Err(anyhow::anyhow!("AUTH message must have exactly 2 elements"));
                }
                let event: NostrEvent = serde_json::from_value(json_array[1].clone())
                    .context("Failed to parse AUTH event")?;
                Ok(NostrMessage::Auth(event))
            }
            _ => Err(anyhow::anyhow!("Unknown message type: {}", message_type))
        }
    }

    /// Serialize Nostr response to JSON string
    pub fn serialize_response(&self, response: &NostrResponse) -> Result<String> {
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
            .context("Failed to serialize response to JSON")
    }

    /// Validate Nostr event according to NIP-01
    pub async fn validate_event(&self, event: &NostrEvent) -> Result<bool> {
        debug!("🔍 Validating event: {}", event.id);
        
        // 1. Validate event ID calculation
        if !self.validate_event_id(event)? {
            warn!("❌ Event ID validation failed for event: {}", event.id);
            return Ok(false);
        }
        
        // 2. Validate signature
        if !self.validate_signature(event)? {
            warn!("❌ Signature validation failed for event: {}", event.id);
            return Ok(false);
        }
        
        // 3. Earth Alliance specific validation
        if !self.security_layer.validate_earth_alliance_event(event).await? {
            warn!("❌ Earth Alliance validation failed for event: {}", event.id);
            return Ok(false);
        }
        
        info!("✅ Event validation passed: {}", event.id);
        Ok(true)
    }

    /// Validate event ID calculation
    fn validate_event_id(&self, event: &NostrEvent) -> Result<bool> {
        use sha2::{Sha256, Digest};
        
        // Calculate expected ID according to NIP-01
        let serialized = json!([
            0,
            event.pubkey,
            event.created_at,
            event.kind,
            event.tags,
            event.content
        ]);
        
        let canonical_json = serialized.to_string();
        let mut hasher = Sha256::new();
        hasher.update(canonical_json.as_bytes());
        let hash = hasher.finalize();
        let expected_id = hex::encode(hash);
        
        Ok(event.id == expected_id)
    }

    /// Validate event signature using secp256k1
    fn validate_signature(&self, event: &NostrEvent) -> Result<bool> {
        use secp256k1::{Secp256k1, Message, PublicKey, ecdsa::Signature};
        
        let secp = Secp256k1::new();
        
        // Parse public key
        let pubkey_bytes = hex::decode(&event.pubkey)
            .context("Failed to decode public key")?;
        let pubkey = PublicKey::from_slice(&pubkey_bytes)
            .context("Invalid public key")?;
        
        // Parse signature
        let sig_bytes = hex::decode(&event.sig)
            .context("Failed to decode signature")?;
        let signature = Signature::from_compact(&sig_bytes)
            .context("Invalid signature format")?;
        
        // Create message hash (event ID)
        let id_bytes = hex::decode(&event.id)
            .context("Failed to decode event ID")?;
        let message = Message::from_digest_slice(&id_bytes)
            .context("Invalid message hash")?;
        
        // Verify signature
        match secp.verify_ecdsa(&message, &signature, &pubkey) {
            Ok(()) => {
                debug!("✅ Signature verification passed for event: {}", event.id);
                Ok(true)
            }
            Err(e) => {
                debug!("❌ Signature verification failed for event {}: {}", event.id, e);
                Ok(false)
            }
        }
    }

    /// Check if event matches any of the provided filters
    pub fn event_matches_filters(&self, event: &NostrEvent, filters: &[Filter]) -> bool {
        if filters.is_empty() {
            return true; // No filters means match all
        }
        
        for filter in filters {
            if self.event_matches_filter(event, filter) {
                return true;
            }
        }
        
        false
    }

    /// Check if event matches a specific filter
    pub fn event_matches_filter(&self, event: &NostrEvent, filter: &Filter) -> bool {
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

    /// Extract Earth Alliance metadata from event tags
    pub fn extract_earth_alliance_metadata(&self, event: &NostrEvent) -> EarthAllianceMetadata {
        let mut metadata = EarthAllianceMetadata {
            team_id: None,
            clearance_level: None,
            evidence_hash: None,
            truth_score: None,
            verification_status: None,
            resistance_cell: None,
            operative_level: None,
        };
        
        // Parse tags for Earth Alliance specific data
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
                    _ => {} // Ignore unknown tags
                }
            }
        }
        
        metadata
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    
    #[tokio::test]
    async fn test_parse_event_message() {
        let security_layer = Arc::new(SecurityLayer::new().await.unwrap());
        let handler = NostrProtocolHandler::new(security_layer);
        
        let msg = r#"["EVENT", {"id": "test", "pubkey": "test", "created_at": 1234567890, "kind": 1, "tags": [], "content": "Hello World", "sig": "test"}]"#;
        
        let parsed = handler.parse_message(msg).unwrap();
        match parsed {
            NostrMessage::Event(event) => {
                assert_eq!(event.content, "Hello World");
            }
            _ => panic!("Expected Event message"),
        }
    }
    
    #[tokio::test]
    async fn test_parse_req_message() {
        let security_layer = Arc::new(SecurityLayer::new().await.unwrap());
        let handler = NostrProtocolHandler::new(security_layer);
        
        let msg = r#"["REQ", "sub1", {"authors": ["test"]}]"#;
        
        let parsed = handler.parse_message(msg).unwrap();
        match parsed {
            NostrMessage::Req { sub_id, filters } => {
                assert_eq!(sub_id, "sub1");
                assert_eq!(filters.len(), 1);
            }
            _ => panic!("Expected REQ message"),
        }
    }
}
