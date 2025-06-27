// Input Validation Module for AI Security RelayNode Backend
// Comprehensive validation and sanitization for all API inputs

use serde::{Deserialize, Serialize};
use validator::{Validate, ValidationError};
use regex::Regex;
use std::collections::HashMap;
use anyhow::{Result, anyhow};
use tracing::{warn, error};
use axum::http::StatusCode;

// Import types from investigation service
use crate::investigation_service::{Priority, InvestigationStatus, TaskStatus};

// Custom validation functions
pub fn validate_investigation_id(id: &str) -> Result<(), ValidationError> {
    if id.is_empty() || id.len() > 50 {
        return Err(ValidationError::new("invalid_length"));
    }
    
    // Allow alphanumeric characters, hyphens, and underscores
    let re = Regex::new(r"^[a-zA-Z0-9_-]+$").unwrap();
    if !re.is_match(id) {
        return Err(ValidationError::new("invalid_format"));
    }
    
    Ok(())
}

pub fn validate_user_id(user_id: &str) -> Result<(), ValidationError> {
    if user_id.is_empty() || user_id.len() > 100 {
        return Err(ValidationError::new("invalid_length"));
    }
    
    // Basic sanitization - no special characters that could be injection vectors
    let re = Regex::new(r"^[a-zA-Z0-9@._-]+$").unwrap();
    if !re.is_match(user_id) {
        return Err(ValidationError::new("invalid_format"));
    }
    
    Ok(())
}

pub fn validate_content_text(text: &str) -> Result<(), ValidationError> {
    if text.len() > 10000 {
        return Err(ValidationError::new("content_too_long"));
    }
    
    // Check for potentially dangerous content
    let dangerous_patterns = [
        r"<script",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<object",
        r"<embed",
    ];
    
    for pattern in &dangerous_patterns {
        let re = Regex::new(pattern).unwrap();
        if re.is_match(&text.to_lowercase()) {
            return Err(ValidationError::new("potentially_dangerous_content"));
        }
    }
    
    Ok(())
}

pub fn validate_file_path(path: &str) -> Result<(), ValidationError> {
    if path.is_empty() || path.len() > 500 {
        return Err(ValidationError::new("invalid_length"));
    }
    
    // Prevent path traversal attacks
    if path.contains("..") || path.contains("//") {
        return Err(ValidationError::new("path_traversal_attempt"));
    }
    
    // Only allow safe characters in file paths
    let re = Regex::new(r"^[a-zA-Z0-9._/-]+$").unwrap();
    if !re.is_match(path) {
        return Err(ValidationError::new("invalid_path_format"));
    }
    
    Ok(())
}

// Validated request structures
#[derive(Debug, Deserialize, Validate)]
pub struct CreateInvestigationRequest {
    #[validate(length(min = 1, max = 200), custom(function = "validate_content_text"))]
    pub title: String,
    
    #[validate(length(max = 5000), custom(function = "validate_content_text"))]
    pub description: Option<String>,
    
    pub priority: crate::investigation_service::Priority,
    
    #[validate(length(min = 1, max = 100), custom(function = "validate_user_id"))]
    pub created_by: String,
    
    #[validate(length(max = 100))]
    pub team_id: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateInvestigationRequest {
    #[validate(length(min = 1, max = 200), custom(function = "validate_content_text"))]
    pub title: Option<String>,
    
    #[validate(length(max = 5000), custom(function = "validate_content_text"))]
    pub description: Option<String>,
    
    pub priority: Option<crate::investigation_service::Priority>,
    pub status: Option<crate::investigation_service::InvestigationStatus>,
    
    #[validate(length(max = 100))]
    pub team_id: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTaskRequest {
    #[validate(length(min = 1, max = 200), custom(function = "validate_content_text"))]
    pub title: String,
    
    #[validate(length(max = 2000), custom(function = "validate_content_text"))]
    pub description: Option<String>,
    
    pub priority: crate::investigation_service::Priority,
    
    #[validate(custom(function = "validate_user_id"))]
    pub assigned_to: Option<String>,
    
    pub due_date: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateEvidenceRequest {
    #[validate(length(min = 1, max = 200), custom(function = "validate_content_text"))]
    pub title: String,
    
    #[validate(length(max = 2000), custom(function = "validate_content_text"))]
    pub description: Option<String>,
    
    pub evidence_type: EvidenceType,
    
    #[validate(custom(function = "validate_file_path"))]
    pub file_path: Option<String>,
    
    #[validate(url)]
    pub source_url: Option<String>,
    
    #[validate(length(max = 64))]
    pub hash: Option<String>,
    
    #[validate(custom(function = "validate_user_id"))]
    pub collected_by: String,
}

#[derive(Debug, Deserialize, Validate, Clone)]
pub struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    pub limit: Option<i32>,
    
    #[validate(range(min = 0))]
    pub offset: Option<i32>,
    
    #[validate(length(max = 50))]
    pub status: Option<String>,
    
    #[validate(length(max = 50))]
    pub priority: Option<String>,
    
    #[validate(custom(function = "validate_user_id"))]
    pub created_by: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum EvidenceType {
    Document,
    Image,
    Video,
    Audio,
    Log,
    Network,
    Other,
}

impl EvidenceType {
    pub fn to_string(&self) -> String {
        match self {
            EvidenceType::Document => "document".to_string(),
            EvidenceType::Image => "image".to_string(),
            EvidenceType::Video => "video".to_string(),
            EvidenceType::Audio => "audio".to_string(),
            EvidenceType::Log => "log".to_string(),
            EvidenceType::Network => "network".to_string(),
            EvidenceType::Other => "other".to_string(),
        }
    }
}

// Type aliases for validated requests used in investigation API
pub type ValidatedCreateInvestigationRequest = CreateInvestigationRequest;
pub type ValidatedCreateTaskRequest = CreateTaskRequest;
pub type ValidatedCreateEvidenceRequest = CreateEvidenceRequest;
pub type ValidatedUpdateInvestigationRequest = UpdateInvestigationRequest;
pub type ValidatedQueryParams = QueryParams;

// Validation result
#[derive(Debug)]
pub struct ValidationResult<T> {
    pub is_valid: bool,
    pub data: Option<T>,
    pub errors: Vec<String>,
}

// Input sanitization functions
pub fn sanitize_html(input: &str) -> String {
    input
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
        .replace('&', "&amp;")
}

pub fn sanitize_sql_input(input: &str) -> String {
    input
        .replace('\'', "''")
        .replace('\\', "\\\\")
        .replace('\n', " ")
        .replace('\r', " ")
        .replace('\t', " ")
}

pub fn remove_control_characters(input: &str) -> String {
    input
        .chars()
        .filter(|c| !c.is_control() || *c == '\n' || *c == '\r' || *c == '\t')
        .collect()
}

// Validation service
pub struct ValidationService {
    max_content_length: usize,
    max_file_size: usize,
}

impl ValidationService {
    pub fn new() -> Self {
        Self {
            max_content_length: 10000,
            max_file_size: 10 * 1024 * 1024, // 10MB
        }
    }

    // Validate and sanitize investigation creation request
    pub fn validate_create_investigation(&self, req: &CreateInvestigationRequest) -> ValidationResult<CreateInvestigationRequest> {
        let mut errors = Vec::new();

        // Validate using validator crate
        if let Err(validation_errors) = req.validate() {
            for (field, field_errors) in validation_errors.field_errors() {
                for error in field_errors {
                    errors.push(format!("{}: {}", field, error.code));
                }
            }
        }

        // Additional custom validations
        if req.title.trim().is_empty() {
            errors.push("Title cannot be empty".to_string());
        }

        if let Some(ref description) = req.description {
            if description.len() > self.max_content_length {
                errors.push("Description exceeds maximum length".to_string());
            }
        }

        // Sanitize data if validation passes
        if errors.is_empty() {
            let sanitized = CreateInvestigationRequest {
                title: sanitize_html(&req.title.trim()),
                description: req.description.as_ref().map(|d| sanitize_html(&d.trim())),
                priority: req.priority.clone(),
                created_by: sanitize_html(&req.created_by.trim()),
                team_id: req.team_id.as_ref().map(|t| sanitize_html(&t.trim())),
            };

            ValidationResult {
                is_valid: true,
                data: Some(sanitized),
                errors: Vec::new(),
            }
        } else {
            warn!("Validation failed for create investigation request: {:?}", errors);
            ValidationResult {
                is_valid: false,
                data: None,
                errors,
            }
        }
    }

    // Validate investigation ID from path parameter
    pub fn validate_investigation_id_param(&self, id: &str) -> Result<String> {
        if let Err(_) = validate_investigation_id(id) {
            return Err(anyhow!("Invalid investigation ID format"));
        }
        
        // Additional security checks
        if id.contains("../") || id.contains("..\\") {
            return Err(anyhow!("Path traversal attempt detected"));
        }
        
        if id.len() > 50 {
            return Err(anyhow!("Investigation ID too long"));
        }
        
        Ok(id.to_string())
    }

    // Validate query parameters
    pub fn validate_query_params(&self, params: &QueryParams) -> ValidationResult<QueryParams> {
        let mut errors = Vec::new();

        if let Err(validation_errors) = params.validate() {
            for (field, field_errors) in validation_errors.field_errors() {
                for error in field_errors {
                    errors.push(format!("{}: {}", field, error.code));
                }
            }
        }

        // Additional validations
        if let Some(limit) = params.limit {
            if limit > 1000 {
                errors.push("Limit exceeds maximum allowed value".to_string());
            }
        }

        if errors.is_empty() {
            ValidationResult {
                is_valid: true,
                data: Some(params.clone()),
                errors: Vec::new(),
            }
        } else {
            ValidationResult {
                is_valid: false,
                data: None,
                errors,
            }
        }
    }

    // Check for malicious content patterns
    pub fn detect_malicious_content(&self, content: &str) -> Vec<String> {
        let mut threats = Vec::new();

        // SQL injection patterns
        let sql_patterns = [
            r"(?i)(union\s+select)",
            r"(?i)(drop\s+table)",
            r"(?i)(delete\s+from)",
            r"(?i)(insert\s+into)",
            r"(?i)(update\s+.+set)",
            r"(?i)(\-\-)",
            r"(?i)(/\*|\*/)",
        ];

        for pattern in &sql_patterns {
            let re = Regex::new(pattern).unwrap();
            if re.is_match(content) {
                threats.push(format!("Potential SQL injection: {}", pattern));
            }
        }

        // XSS patterns
        let xss_patterns = [
            r"(?i)<script",
            r"(?i)javascript:",
            r"(?i)on\w+\s*=",
            r"(?i)<iframe",
            r"(?i)<object",
            r"(?i)<embed",
        ];

        for pattern in &xss_patterns {
            let re = Regex::new(pattern).unwrap();
            if re.is_match(content) {
                threats.push(format!("Potential XSS: {}", pattern));
            }
        }

        if !threats.is_empty() {
            error!("Malicious content detected: {:?}", threats);
        }

        threats
    }
}

impl Default for ValidationService {
    fn default() -> Self {
        Self::new()
    }
}

// Convert ValidationError to StatusCode for HTTP responses
pub fn validation_error_to_status_code(_: &ValidationError) -> StatusCode {
    StatusCode::BAD_REQUEST
}
