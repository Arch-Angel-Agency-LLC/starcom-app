// Authentication and Authorization Module for AI Security RelayNode
// Implements JWT-based authentication with role-based access control

use axum::{
    extract::{Request, State, FromRequestParts},
    http::{HeaderMap, StatusCode, header::AUTHORIZATION, request::Parts},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use anyhow::{Result, anyhow};
use tracing::{error, warn, info};
use chrono::{Utc, Duration};
use async_trait::async_trait;

// JWT Claims structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub user_id: String,
    pub role: String,
    pub permissions: Vec<String>,
    pub exp: i64,
    pub iat: i64,
    pub iss: String,
}

// User context for database operations
#[derive(Debug, Clone)]
pub struct UserContext {
    pub user_id: String,
    pub role: String,
    pub permissions: Vec<String>,
}

// Implement FromRequestParts for UserContext to use as an extractor
#[async_trait]
impl<S> FromRequestParts<S> for UserContext
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract the authorization header
        let authorization = parts.headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or(StatusCode::UNAUTHORIZED)?;

        if !authorization.starts_with("Bearer ") {
            return Err(StatusCode::UNAUTHORIZED);
        }

        let token = &authorization[7..];
        
        // Decode and validate the JWT token
        match verify_jwt_token(token) {
            Ok(claims) => Ok(UserContext {
                user_id: claims.user_id,
                role: claims.role,
                permissions: claims.permissions,
            }),
            Err(_) => Err(StatusCode::UNAUTHORIZED),
        }
    }
}

// User roles
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum UserRole {
    Admin,
    Investigator,
    Analyst,
    Viewer,
}

impl UserRole {
    pub fn to_string(&self) -> String {
        match self {
            UserRole::Admin => "admin".to_string(),
            UserRole::Investigator => "investigator".to_string(),
            UserRole::Analyst => "analyst".to_string(),
            UserRole::Viewer => "viewer".to_string(),
        }
    }

    pub fn get_permissions(&self) -> Vec<String> {
        match self {
            UserRole::Admin => vec![
                "create_investigation".to_string(),
                "read_investigation".to_string(),
                "update_investigation".to_string(),
                "delete_investigation".to_string(),
                "read_tasks".to_string(),
                "create_tasks".to_string(),
                "read_evidence".to_string(),
                "create_evidence".to_string(),
                "read_activities".to_string(),
                "read_status".to_string(),
                "manage_users".to_string(),
                "view_audit_logs".to_string(),
                "admin".to_string(),
            ],
            UserRole::Investigator => vec![
                "create_investigation".to_string(),
                "read_investigation".to_string(),
                "update_investigation".to_string(),
                "read_tasks".to_string(),
                "create_tasks".to_string(),
                "read_evidence".to_string(),
                "create_evidence".to_string(),
                "read_activities".to_string(),
                "read_status".to_string(),
            ],
            UserRole::Analyst => vec![
                "read_investigation".to_string(),
                "update_investigation".to_string(),
                "read_tasks".to_string(),
                "create_tasks".to_string(),
                "read_evidence".to_string(),
                "create_evidence".to_string(),
                "read_activities".to_string(),
                "read_status".to_string(),
            ],
            UserRole::Viewer => vec![
                "read_investigation".to_string(),
                "read_tasks".to_string(),
                "read_evidence".to_string(),
                "read_activities".to_string(),
                "read_status".to_string(),
            ],
        }
    }
}

// Authentication service
#[derive(Clone)]
pub struct AuthService {
    secret_key: Vec<u8>,
    issuer: String,
}

impl AuthService {
    pub fn new(secret: &str) -> Self {
        Self {
            secret_key: secret.as_bytes().to_vec(),
            issuer: "ai-security-relaynode".to_string(),
        }
    }

    // Generate JWT token for user
    pub fn generate_token(&self, user_id: &str, role: UserRole) -> Result<String> {
        let now = Utc::now();
        let exp = now + Duration::hours(8); // 8 hour token lifetime

        let claims = Claims {
            user_id: user_id.to_string(),
            role: role.to_string(),
            permissions: role.get_permissions(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            iss: self.issuer.clone(),
        };

        let header = Header::new(Algorithm::HS256);
        let encoding_key = EncodingKey::from_secret(&self.secret_key);

        encode(&header, &claims, &encoding_key)
            .map_err(|e| anyhow!("Failed to generate token: {}", e))
    }

    // Validate JWT token and extract claims
    pub fn validate_token(&self, token: &str) -> Result<Claims> {
        let decoding_key = DecodingKey::from_secret(&self.secret_key);
        let mut validation = Validation::new(Algorithm::HS256);
        validation.set_issuer(&[&self.issuer]);

        decode::<Claims>(token, &decoding_key, &validation)
            .map(|token_data| token_data.claims)
            .map_err(|e| anyhow!("Token validation failed: {}", e))
    }

    // Check if user has specific permission
    pub fn has_permission(&self, claims: &Claims, permission: &str) -> bool {
        claims.permissions.contains(&permission.to_string())
    }
}

// Authentication middleware
pub async fn auth_middleware(
    headers: HeaderMap,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract Authorization header
    let auth_header = headers
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // Parse Bearer token
    if !auth_header.starts_with("Bearer ") {
        warn!("Invalid authorization header format");
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = auth_header.trim_start_matches("Bearer ");

    // Get auth service from app state (would need to be added to router state)
    // For now, create with default secret (should be from config in production)
    let auth_service = AuthService::new("your-secret-key-change-in-production");

    // Validate token
    let claims = match auth_service.validate_token(token) {
        Ok(claims) => claims,
        Err(e) => {
            warn!("Token validation failed: {}", e);
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // Check token expiration
    if claims.exp < Utc::now().timestamp() {
        warn!("Token expired for user: {}", claims.user_id);
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Create user context
    let user_context = UserContext {
        user_id: claims.user_id.clone(),
        role: claims.role.clone(),
        permissions: claims.permissions.clone(),
    };

    // Add user context to request extensions
    req.extensions_mut().insert(user_context);
    req.extensions_mut().insert(claims.clone());

    // Log successful authentication
    info!("Authenticated user: {} with role: {}", claims.user_id, claims.role);

    Ok(next.run(req).await)
}

// Permission checking middleware for specific operations
pub fn require_permission(permission: &'static str) -> impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, StatusCode>> + Send>> + Clone {
    move |req: Request, next: Next| {
        let perm = permission;
        Box::pin(async move {
            // Get claims from request extensions
            let claims = req.extensions().get::<Claims>()
                .ok_or(StatusCode::UNAUTHORIZED)?;

            // Check permission
            let auth_service = AuthService::new("your-secret-key-change-in-production");
            if !auth_service.has_permission(claims, perm) {
                warn!("User {} lacks permission: {}", claims.user_id, perm);
                return Err(StatusCode::FORBIDDEN);
            }

            Ok(next.run(req).await)
        })
    }
}

// Helper function to extract user context from request
pub fn get_user_context(req: &Request) -> Result<&UserContext, StatusCode> {
    req.extensions()
        .get::<UserContext>()
        .ok_or(StatusCode::UNAUTHORIZED)
}

// Helper function to extract claims from request
pub fn get_claims(req: &Request) -> Result<&Claims, StatusCode> {
    req.extensions()
        .get::<Claims>()
        .ok_or(StatusCode::UNAUTHORIZED)
}

// Mock user database for demo purposes (replace with real database)
pub struct UserStore {
    // In production, this would be a database connection
}

impl UserStore {
    pub fn new() -> Self {
        Self {}
    }

    // Authenticate user with credentials
    pub async fn authenticate_user(&self, username: &str, password: &str) -> Result<(String, UserRole)> {
        // Mock authentication - replace with real credential verification
        match username {
            "admin" if password == "admin123" => Ok(("admin".to_string(), UserRole::Admin)),
            "investigator" if password == "inv123" => Ok(("investigator".to_string(), UserRole::Investigator)),
            "analyst" if password == "analyst123" => Ok(("analyst".to_string(), UserRole::Analyst)),
            "viewer" if password == "viewer123" => Ok(("viewer".to_string(), UserRole::Viewer)),
            _ => Err(anyhow!("Invalid credentials")),
        }
    }

    // Get user role by user ID
    pub async fn get_user_role(&self, user_id: &str) -> Result<UserRole> {
        // Mock implementation - replace with database lookup
        match user_id {
            "admin" => Ok(UserRole::Admin),
            "investigator" => Ok(UserRole::Investigator),
            "analyst" => Ok(UserRole::Analyst),
            "viewer" => Ok(UserRole::Viewer),
            _ => Err(anyhow!("User not found")),
        }
    }
}

// Login endpoint structures
#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub token: Option<String>,
    pub user_id: Option<String>,
    pub role: Option<String>,
    pub error: Option<String>,
}

// Login handler
pub async fn login_handler(
    State(auth_service): State<Arc<AuthService>>,
    axum::Json(req): axum::Json<LoginRequest>,
) -> Result<axum::Json<LoginResponse>, StatusCode> {
    let user_store = UserStore::new();

    // Authenticate user
    match user_store.authenticate_user(&req.username, &req.password).await {
        Ok((user_id, role)) => {
            // Generate token
            match auth_service.generate_token(&user_id, role.clone()) {
                Ok(token) => {
                    info!("User {} logged in successfully", user_id);
                    Ok(axum::Json(LoginResponse {
                        success: true,
                        token: Some(token),
                        user_id: Some(user_id),
                        role: Some(role.to_string()),
                        error: None,
                    }))
                }
                Err(e) => {
                    error!("Token generation failed: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        Err(_) => {
            warn!("Failed login attempt for username: {}", req.username);
            Ok(axum::Json(LoginResponse {
                success: false,
                token: None,
                user_id: None,
                role: None,
                error: Some("Invalid credentials".to_string()),
            }))
        }
    }
}

// Standalone JWT verification function for use in extractors
pub fn verify_jwt_token(token: &str) -> Result<Claims> {
    // Use a default secret key - in production this should come from config
    let secret_key = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "default-secret-key-change-in-production".to_string());
    
    let decoding_key = DecodingKey::from_secret(secret_key.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&["ai-security-relaynode"]);

    decode::<Claims>(token, &decoding_key, &validation)
        .map(|token_data| token_data.claims)
        .map_err(|e| anyhow!("Token verification failed: {}", e))
}
