// Test JWT validation with the same logic as the RelayNode
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub user_id: String,
    pub role: String,
    pub permissions: Vec<String>,
    pub exp: i64,
    pub iat: i64,
    pub iss: String,
}

fn verify_jwt_token(token: &str) -> Result<Claims> {
    let secret_key = "your-secret-key-change-in-production";
    let decoding_key = DecodingKey::from_secret(secret_key.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&["ai-security-relaynode"]);

    decode::<Claims>(token, &decoding_key, &validation)
        .map(|token_data| token_data.claims)
        .map_err(|e| anyhow::anyhow!("Token verification failed: {}", e))
}

fn main() {
    let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdC1hZG1pbiIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjpbImNyZWF0ZV9pbnZlc3RpZ2F0aW9uIiwicmVhZF9pbnZlc3RpZ2F0aW9uIiwidXBkYXRlX2ludmVzdGlnYXRpb24iLCJkZWxldGVfaW52ZXN0aWdhdGlvbiIsImNyZWF0ZV90YXNrcyIsInJlYWRfdGFza3MiLCJ1cGRhdGVfdGFza3MiLCJkZWxldGVfdGFza3MiLCJjcmVhdGVfZXZpZGVuY2UiLCJyZWFkX2V2aWRlbmNlIiwidXBkYXRlX2V2aWRlbmNlIiwiZGVsZXRlX2V2aWRlbmNlIiwicmVhZF9hY3Rpdml0aWVzIiwicmVhZF9zdGF0dXMiLCJtYW5hZ2VfdXNlcnMiLCJ2aWV3X2F1ZGl0X2xvZ3MiLCJhZG1pbiJdLCJleHAiOjE3NTEwOTExNTIsImlhdCI6MTc1MTA2MjM1MiwiaXNzIjoiYWktc2VjdXJpdHktcmVsYXlub2RlIn0.swyJ4kaXSEHHqoTHkndnijf8m1RZhucEIuYPmlzXfas";
    
    match verify_jwt_token(token) {
        Ok(claims) => {
            println!("✅ Token validation successful!");
            println!("Claims: {:?}", claims);
        },
        Err(e) => {
            println!("❌ Token validation failed: {}", e);
        }
    }
}
