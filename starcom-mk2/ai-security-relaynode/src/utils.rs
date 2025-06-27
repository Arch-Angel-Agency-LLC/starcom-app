// Shared utilities for the AI Security RelayNode
// Common functions used across clean architecture modules

use std::time::{SystemTime, UNIX_EPOCH};

/// Get current timestamp in seconds since Unix epoch
pub fn now_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Generate a random ID string
pub fn generate_id(prefix: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    now_timestamp().hash(&mut hasher);
    format!("{}_{:x}", prefix, hasher.finish())
}

/// Validate network address format
pub fn validate_address(address: &str) -> bool {
    address.parse::<std::net::SocketAddr>().is_ok()
}

/// Format byte size for display
pub fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;
    
    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }
    
    if unit_index == 0 {
        format!("{} {}", bytes, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size, UNITS[unit_index])
    }
}

/// Crypto utilities for clean architecture
pub mod crypto {
    use anyhow::Result;
    
    /// Generate a new keypair (placeholder implementation)
    pub fn generate_keypair() -> Result<(String, String)> {
        // This would use proper cryptographic key generation
        // For now, return placeholder values
        Ok(("public_key_placeholder".to_string(), "private_key_placeholder".to_string()))
    }
    
    /// Verify a signature (placeholder implementation)
    pub fn verify_signature(_message: &[u8], _signature: &[u8], _public_key: &str) -> bool {
        // This would implement proper signature verification
        // For now, return true for testing
        true
    }
    
    /// Sign a message (placeholder implementation)
    pub fn sign_message(_message: &[u8], _private_key: &str) -> Result<Vec<u8>> {
        // This would implement proper message signing
        // For now, return placeholder signature
        Ok(b"signature_placeholder".to_vec())
    }
}

/// Network utilities for clean architecture
pub mod network {
    use std::net::SocketAddr;
    use anyhow::Result;
    
    /// Check if a network address is reachable
    pub async fn is_reachable(_address: SocketAddr) -> bool {
        // This would implement proper network reachability check
        // For now, return true for testing
        true
    }
    
    /// Get local network address
    pub fn get_local_address() -> Result<SocketAddr> {
        "127.0.0.1:0".parse().map_err(|e| anyhow::anyhow!("Failed to parse address: {}", e))
    }
    
    /// Validate network protocol
    pub fn validate_protocol(protocol: &str) -> bool {
        matches!(protocol, "nostr" | "http" | "ipfs" | "tcp")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_now_timestamp() {
        let ts1 = now_timestamp();
        std::thread::sleep(std::time::Duration::from_millis(10));
        let ts2 = now_timestamp();
        assert!(ts2 >= ts1);
    }

    #[test]
    fn test_generate_id() {
        let id1 = generate_id("test");
        let id2 = generate_id("test");
        assert_ne!(id1, id2);
        assert!(id1.starts_with("test_"));
    }

    #[test]
    fn test_validate_address() {
        assert!(validate_address("127.0.0.1:8080"));
        assert!(validate_address("localhost:9090"));
        assert!(!validate_address("invalid_address"));
    }

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1.0 KB");
        assert_eq!(format_bytes(1048576), "1.0 MB");
    }
}
