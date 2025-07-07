// Investigation API endpoints for the AI Security RelayNode - Security Hardened
use axum::{
    extract::{State, Path, Query, Request},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
    body::to_bytes,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, error, warn};
use validator::Validate;

use crate::{
    investigation_service::{InvestigationService, Investigation, InvestigationTask, Evidence, Priority, TaskStatus, InvestigationStatus},
    auth::{get_user_context, UserContext},
    validation::{
        ValidatedCreateInvestigationRequest, 
        ValidatedCreateTaskRequest, 
        ValidatedCreateEvidenceRequest,
        ValidatedUpdateInvestigationRequest,
        validate_investigation_id,
        CreateInvestigationRequest,
        UpdateInvestigationRequest,
        CreateTaskRequest,
        CreateEvidenceRequest,
        validation_error_to_status_code,
    },
};

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            timestamp: chrono::Utc::now(),
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
            timestamp: chrono::Utc::now(),
        }
    }
}

// Remove old unvalidated request structures - now using validated ones from validation module

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub status: Option<String>,
    pub priority: Option<String>,
    pub assigned_to: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

// Create router for investigation endpoints
pub fn create_investigation_router() -> Router<Arc<InvestigationService>> {
    Router::new()
        .route("/api/v1/investigations", get(list_investigations))
        .route("/api/v1/investigations", post(create_investigation))
        .route("/api/v1/investigations/:id", get(get_investigation))
        .route("/api/v1/investigations/:id", put(update_investigation))
        .route("/api/v1/investigations/:id", delete(delete_investigation))
        
        // Task endpoints
        .route("/api/v1/investigations/:id/tasks", get(list_tasks))
        .route("/api/v1/investigations/:id/tasks", post(create_task))
        
        // Evidence endpoints
        .route("/api/v1/investigations/:id/evidence", get(list_evidence))
        .route("/api/v1/investigations/:id/evidence", post(create_evidence))
        
        // Activity endpoints
        .route("/api/v1/investigations/:id/activities", get(list_activities))
        
        // Status endpoint
        .route("/api/v1/investigations/status", get(get_status))
}

// Investigation handlers with authentication and validation
async fn list_investigations(
    State(service): State<Arc<InvestigationService>>,
    Query(query): Query<ListQuery>,
    user_context: UserContext,
) -> Result<Json<ApiResponse<Vec<Investigation>>>, StatusCode> {
    // Validate user has permission to read investigations
    if !user_context.permissions.contains(&"read_investigation".to_string()) {
        warn!("User {} lacks permission to read investigations", user_context.user_id);
        return Err(StatusCode::FORBIDDEN);
    }

    // Get investigations with user context for proper access control
    match service.list_investigations(&user_context.user_id).await {
        Ok(investigations) => {
            // Apply query filters
            let filtered: Vec<Investigation> = investigations
                .into_iter()
                .filter(|inv| {
                    if let Some(ref status) = query.status {
                        inv.status.to_string() == *status
                    } else {
                        true
                    }
                })
                .filter(|inv| {
                    if let Some(ref priority) = query.priority {
                        inv.priority.to_string() == *priority
                    } else {
                        true
                    }
                })
                .collect();
            
            info!("User {} listed {} investigations", user_context.user_id, filtered.len());
            Ok(Json(ApiResponse::success(filtered)))
        }
        Err(e) => {
            error!("Failed to list investigations for user {}: {}", user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn create_investigation(
    State(service): State<Arc<InvestigationService>>,
    user_context: UserContext,
    Json(request): Json<CreateInvestigationRequest>,
) -> Result<Json<ApiResponse<Investigation>>, StatusCode> {
    // Validate user has permission to create investigations
    if !user_context.permissions.contains(&"create_investigation".to_string()) {
        warn!("User {} lacks permission to create investigation", user_context.user_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate request body
    request.validate().map_err(|_| {
        warn!("Invalid create investigation request");
        StatusCode::BAD_REQUEST
    })?;
    
    match service.create_investigation(
        request.title, 
        request.description, 
        request.priority, 
        user_context.user_id.clone() // Use authenticated user ID
    ).await {
        Ok(investigation) => {
            info!("User {} successfully created investigation {}", user_context.user_id, investigation.id);
            Ok(Json(ApiResponse::success(investigation)))
        },
        Err(e) => {
            error!("Failed to create investigation for user {}: {}", user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
    user_context: UserContext,
) -> Result<Json<ApiResponse<Investigation>>, StatusCode> {
    // Validate user has permission to read investigations
    if !user_context.permissions.contains(&"read_investigation".to_string()) {
        warn!("User {} lacks permission to read investigation {}", user_context.user_id, id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate investigation ID format
    validate_investigation_id(&id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    match service.get_investigation(&id).await {
        Ok(Some(investigation)) => {
            // Check if user can access this specific investigation
            if investigation.created_by != user_context.user_id {
                warn!("User {} attempted to access investigation {} owned by {}", 
                      user_context.user_id, id, investigation.created_by);
                return Err(StatusCode::FORBIDDEN);
            }
            
            info!("User {} successfully accessed investigation {}", user_context.user_id, id);
            Ok(Json(ApiResponse::success(investigation)))
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to get investigation {} for user {}: {}", id, user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn update_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
    user_context: UserContext,
    Json(request): Json<UpdateInvestigationRequest>,
) -> Result<Json<ApiResponse<Investigation>>, StatusCode> {
    // Validate user has permission to update investigations
    if !user_context.permissions.contains(&"update_investigation".to_string()) {
        warn!("User {} lacks permission to update investigation {}", user_context.user_id, id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate investigation ID format
    validate_investigation_id(&id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Validate request body
    request.validate().map_err(|_| {
        warn!("Invalid update investigation request");
        StatusCode::BAD_REQUEST
    })?;
    
    match service.get_investigation(&id).await {
        Ok(Some(mut investigation)) => {
            // Check if user owns this investigation or has admin rights
            if investigation.created_by != user_context.user_id && !user_context.permissions.contains(&"admin".to_string()) {
                warn!("User {} attempted to update investigation {} owned by {}", 
                      user_context.user_id, id, investigation.created_by);
                return Err(StatusCode::FORBIDDEN);
            }
            
            // Update fields
            if let Some(title) = request.title {
                investigation.title = title;
            }
            if let Some(description) = request.description {
                investigation.description = Some(description); // Fixed to wrap in Some
            }
            if let Some(status) = request.status {
                investigation.status = status;
            }
            if let Some(priority) = request.priority {
                investigation.priority = priority;
            }
            // TODO: Fix field mapping - temporarily comment out
            // if let Some(lead_investigator) = req.lead_investigator {
            //     investigation.lead_investigator = Some(lead_investigator);
            // }
            
            match service.update_investigation(&investigation).await { // Fixed to pass reference
                Ok(updated) => {
                    info!("User {} successfully updated investigation {}", user_context.user_id, id);
                    Ok(Json(ApiResponse::success(updated)))
                },
                Err(e) => {
                    error!("Failed to update investigation {} for user {}: {}", id, user_context.user_id, e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to get investigation {} for update by user {}: {}", id, user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn delete_investigation(
    State(service): State<Arc<InvestigationService>>,
    Path(id): Path<String>,
    user_context: UserContext,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    // Validate user has permission to delete investigations
    if !user_context.permissions.contains(&"delete_investigation".to_string()) {
        warn!("User {} lacks permission to delete investigation {}", user_context.user_id, id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate investigation ID format
    validate_investigation_id(&id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // First, check if the investigation exists and user has access
    match service.get_investigation(&id).await {
        Ok(Some(investigation)) => {
            // Check if user owns this investigation or has admin rights
            if investigation.created_by != user_context.user_id && !user_context.permissions.contains(&"admin".to_string()) {
                warn!("User {} attempted to delete investigation {} owned by {}", 
                      user_context.user_id, id, investigation.created_by);
                return Err(StatusCode::FORBIDDEN);
            }
            
            // Proceed with deletion
            match service.delete_investigation(&id).await {
                Ok(_) => {
                    info!("User {} successfully deleted investigation {}", user_context.user_id, id);
                    Ok(Json(ApiResponse::success(())))
                },
                Err(e) => {
                    error!("Failed to delete investigation {} for user {}: {}", id, user_context.user_id, e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to check investigation {} for deletion by user {}: {}", id, user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Task handlers
async fn list_tasks(
    State(service): State<Arc<InvestigationService>>,
    Path(investigation_id): Path<String>,
    user_context: UserContext,
) -> Result<Json<ApiResponse<Vec<InvestigationTask>>>, StatusCode> {
    // Validate user has permission to read tasks
    if !user_context.permissions.contains(&"read_tasks".to_string()) {
        warn!("User {} lacks permission to read tasks for investigation {}", user_context.user_id, investigation_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate investigation ID format
    validate_investigation_id(&investigation_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Check if user can access this investigation
    match service.get_investigation(&investigation_id).await {
        Ok(Some(investigation)) => {
            if investigation.created_by != user_context.user_id && !user_context.permissions.contains(&"admin".to_string()) {
                warn!("User {} attempted to access tasks for investigation {} owned by {}", 
                      user_context.user_id, investigation_id, investigation.created_by);
                return Err(StatusCode::FORBIDDEN);
            }
            
            // User has access, now get the tasks
            match service.list_tasks(&investigation_id).await {
                Ok(tasks) => {
                    info!("User {} successfully accessed tasks for investigation {}", user_context.user_id, investigation_id);
                    Ok(Json(ApiResponse::success(tasks)))
                },
                Err(e) => {
                    error!("Failed to list tasks for investigation {} for user {}: {}", investigation_id, user_context.user_id, e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to verify investigation {} access for user {}: {}", investigation_id, user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn create_task(
    State(service): State<Arc<InvestigationService>>,
    Path(investigation_id): Path<String>,
    user_context: UserContext,
    Json(request): Json<CreateTaskRequest>,
) -> Result<Json<ApiResponse<InvestigationTask>>, StatusCode> {
    // Validate user has permission to create tasks
    if !user_context.permissions.contains(&"create_tasks".to_string()) {
        warn!("User {} lacks permission to create tasks for investigation {}", user_context.user_id, investigation_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate investigation ID format
    validate_investigation_id(&investigation_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Validate request body
    request.validate().map_err(|_| {
        warn!("Invalid create task request");
        StatusCode::BAD_REQUEST
    })?;
    
    // Check if user can access this investigation
    match service.get_investigation(&investigation_id).await {
        Ok(Some(investigation)) => {
            if investigation.created_by != user_context.user_id && !user_context.permissions.contains(&"admin".to_string()) {
                warn!("User {} attempted to create task for investigation {} owned by {}", 
                      user_context.user_id, investigation_id, investigation.created_by);
                return Err(StatusCode::FORBIDDEN);
            }
            
            // User has access, create the task
            match service.create_task(
                investigation_id.clone(), // Now it's already a String
                request.title,
                request.description,
                request.priority,
                request.assigned_to,
                request.due_date,
            ).await {
                Ok(task) => {
                    info!("User {} successfully created task for investigation {}", user_context.user_id, investigation_id);
                    Ok(Json(ApiResponse::success(task)))
                },
                Err(e) => {
                    error!("Failed to create task for investigation {} for user {}: {}", investigation_id, user_context.user_id, e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to verify investigation {} access for user {}: {}", investigation_id, user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Evidence handlers
async fn list_evidence(
    State(service): State<Arc<InvestigationService>>,
    Path(investigation_id): Path<String>,
    user_context: UserContext,
) -> Result<Json<ApiResponse<Vec<Evidence>>>, StatusCode> {
    // Validate user has permission to read evidence
    if !user_context.permissions.contains(&"read_evidence".to_string()) {
        warn!("User {} lacks permission to read evidence for investigation {}", user_context.user_id, investigation_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate investigation ID format
    validate_investigation_id(&investigation_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Check if user can access this investigation
    match service.get_investigation(&investigation_id).await {
        Ok(Some(investigation)) => {
            if investigation.created_by != user_context.user_id && !user_context.permissions.contains(&"admin".to_string()) {
                warn!("User {} attempted to access evidence for investigation {} owned by {}", 
                      user_context.user_id, investigation_id, investigation.created_by);
                return Err(StatusCode::FORBIDDEN);
            }
            
            // User has access, get the evidence
            match service.list_evidence(&investigation_id).await {
                Ok(evidence) => {
                    info!("User {} successfully accessed evidence for investigation {}", user_context.user_id, investigation_id);
                    Ok(Json(ApiResponse::success(evidence)))
                },
                Err(e) => {
                    error!("Failed to list evidence for investigation {} for user {}: {}", investigation_id, user_context.user_id, e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to verify investigation {} access for user {}: {}", investigation_id, user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn create_evidence(
    State(service): State<Arc<InvestigationService>>,
    Path(investigation_id): Path<String>,
    user_context: UserContext,
    Json(request): Json<CreateEvidenceRequest>,
) -> Result<Json<ApiResponse<Evidence>>, StatusCode> {
    // Validate user has permission to create evidence
    if !user_context.permissions.contains(&"create_evidence".to_string()) {
        warn!("User {} lacks permission to create evidence for investigation {}", user_context.user_id, investigation_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate investigation ID format
    validate_investigation_id(&investigation_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Validate request body
    request.validate().map_err(|_| {
        warn!("Invalid create evidence request");
        StatusCode::BAD_REQUEST
    })?;
    
    // Check if user can access this investigation
    match service.get_investigation(&investigation_id).await {
        Ok(Some(investigation)) => {
            if investigation.created_by != user_context.user_id && !user_context.permissions.contains(&"admin".to_string()) {
                warn!("User {} attempted to create evidence for investigation {} owned by {}", 
                      user_context.user_id, investigation_id, investigation.created_by);
                return Err(StatusCode::FORBIDDEN);
            }
            
            // User has access, create the evidence
            match service.create_evidence(
                investigation_id.clone(),
                request.evidence_type.to_string(), // Convert enum to string
                request.source_url.unwrap_or_default(), // Use source_url as source
                request.title, // Use title as content
                request.hash,
                None, // No metadata for now
            ).await {
                Ok(evidence) => {
                    info!("User {} successfully created evidence for investigation {}", user_context.user_id, investigation_id);
                    Ok(Json(ApiResponse::success(evidence)))
                },
                Err(e) => {
                    error!("Failed to create evidence for investigation {} for user {}: {}", investigation_id, user_context.user_id, e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to verify investigation {} access for user {}: {}", investigation_id, user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Activity handlers
async fn list_activities(
    State(service): State<Arc<InvestigationService>>,
    Path(investigation_id): Path<String>,
    user_context: UserContext,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, StatusCode> {
    // Validate user has permission to read activities
    if !user_context.permissions.contains(&"read_activities".to_string()) {
        warn!("User {} lacks permission to read activities for investigation {}", user_context.user_id, investigation_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    // Validate investigation ID format
    validate_investigation_id(&investigation_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Check if user can access this investigation
    match service.get_investigation(&investigation_id).await {
        Ok(Some(investigation)) => {
            if investigation.created_by != user_context.user_id && !user_context.permissions.contains(&"admin".to_string()) {
                warn!("User {} attempted to access activities for investigation {} owned by {}", 
                      user_context.user_id, investigation_id, investigation.created_by);
                return Err(StatusCode::FORBIDDEN);
            }
            
            // User has access, get the activities
            match service.get_activities(&investigation_id, Some(50)).await { // Fixed method name and added limit
                Ok(activities) => {
                    info!("User {} successfully accessed activities for investigation {}", user_context.user_id, investigation_id);
                    Ok(Json(ApiResponse::success(activities)))
                },
                Err(e) => {
                    error!("Failed to get activities for investigation {} for user {}: {}", investigation_id, user_context.user_id, e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to verify investigation {} access for user {}: {}", investigation_id, user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Status handler
async fn get_status(
    State(service): State<Arc<InvestigationService>>,
    user_context: UserContext,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    // Validate user has permission to read status
    if !user_context.permissions.contains(&"read_status".to_string()) {
        warn!("User {} lacks permission to read status", user_context.user_id);
        return Err(StatusCode::FORBIDDEN);
    }
    
    match service.list_investigations(&user_context.user_id).await {
        Ok(investigations) => {
            let status = serde_json::json!({
                "total_investigations": investigations.len(),
                "active_investigations": investigations.iter().filter(|i| i.status == InvestigationStatus::Active).count(),
                "pending_investigations": investigations.iter().filter(|i| i.status == InvestigationStatus::Pending).count(),
                "completed_investigations": investigations.iter().filter(|i| i.status == InvestigationStatus::Completed).count(),
                "archived_investigations": investigations.iter().filter(|i| i.status == InvestigationStatus::Archived).count(),
                "user_id": user_context.user_id,
            });
            
            info!("User {} successfully accessed status", user_context.user_id);
            Ok(Json(ApiResponse::success(status)))
        }
        Err(e) => {
            error!("Failed to get status for user {}: {}", user_context.user_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
