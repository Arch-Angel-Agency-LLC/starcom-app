# Database Schema and Backend Integration Specification

## Database Schema Extensions

### Investigation Tables Schema
```sql
-- File: src/migrations/add_investigation_tables.sql
-- Add investigation management tables to existing SQLite database

-- Core investigations table
CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    lead_investigator TEXT,
    team_members TEXT, -- JSON array of team member IDs
    tags TEXT, -- JSON array of tags
    metadata TEXT, -- JSON metadata including custom fields
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (lead_investigator) REFERENCES users(id)
);

-- Investigation tasks table
CREATE TABLE IF NOT EXISTS investigation_tasks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    investigation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in-progress', 'analysis', 'review', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assignee TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    location_lat REAL,
    location_lng REAL,
    location_name TEXT,
    dependencies TEXT, -- JSON array of task IDs this task depends on
    tags TEXT, -- JSON array of tags
    metadata TEXT, -- JSON metadata
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee) REFERENCES users(id)
);

-- Evidence items table
CREATE TABLE IF NOT EXISTS evidence_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    investigation_id TEXT NOT NULL,
    task_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('file', 'screenshot', 'log', 'network', 'external', 'document', 'image', 'video', 'audio')),
    file_path TEXT,
    original_filename TEXT,
    mime_type TEXT,
    file_size INTEGER,
    hash_sha256 TEXT NOT NULL, -- For integrity verification
    hash_md5 TEXT, -- Additional hash for compatibility
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    collected_by TEXT NOT NULL,
    source TEXT, -- Where/how the evidence was collected
    chain_of_custody TEXT, -- JSON array of custody records
    tags TEXT, -- JSON array of tags
    metadata TEXT, -- JSON metadata including EXIF, technical details, etc.
    is_encrypted BOOLEAN DEFAULT FALSE,
    encryption_key_id TEXT,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES investigation_tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (collected_by) REFERENCES users(id)
);

-- Team members table (extends existing user management)
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    investigation_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'investigator' CHECK (role IN ('lead', 'investigator', 'analyst', 'specialist', 'observer')),
    permissions TEXT, -- JSON array of permissions
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    UNIQUE(user_id, investigation_id)
);

-- Investigation timeline/activity log
CREATE TABLE IF NOT EXISTS investigation_activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    investigation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'updated', 'assigned', 'completed', 'comment', 'evidence_added', 'status_changed')),
    target_type TEXT, -- 'investigation', 'task', 'evidence', etc.
    target_id TEXT, -- ID of the target object
    description TEXT NOT NULL,
    details TEXT, -- JSON details of the activity
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS investigation_chat (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    investigation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    reply_to TEXT, -- ID of message being replied to
    file_attachment TEXT, -- File path if message has attachment
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited_at DATETIME,
    is_deleted BOOLEAN DEFAULT FALSE,
    metadata TEXT, -- JSON metadata
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reply_to) REFERENCES investigation_chat(id)
);

-- User presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
    user_id TEXT PRIMARY KEY,
    investigation_id TEXT,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_activity TEXT, -- What the user is currently doing
    location TEXT, -- Optional: where the user is working from
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_created_by ON investigations(created_by);
CREATE INDEX IF NOT EXISTS idx_investigation_tasks_investigation_id ON investigation_tasks(investigation_id);
CREATE INDEX IF NOT EXISTS idx_investigation_tasks_assignee ON investigation_tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_investigation_tasks_status ON investigation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_evidence_items_investigation_id ON evidence_items(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_task_id ON evidence_items(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_collected_by ON evidence_items(collected_by);
CREATE INDEX IF NOT EXISTS idx_evidence_items_hash_sha256 ON evidence_items(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_team_members_investigation_id ON team_members(investigation_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_investigation_activities_investigation_id ON investigation_activities(investigation_id);
CREATE INDEX IF NOT EXISTS idx_investigation_chat_investigation_id ON investigation_chat(investigation_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_investigation_id ON user_presence(investigation_id);

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_investigations_timestamp 
    AFTER UPDATE ON investigations
BEGIN
    UPDATE investigations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_investigation_tasks_timestamp 
    AFTER UPDATE ON investigation_tasks
BEGIN
    UPDATE investigation_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update user presence on activity
CREATE TRIGGER IF NOT EXISTS update_user_presence_on_activity
    AFTER INSERT ON investigation_activities
BEGIN
    INSERT OR REPLACE INTO user_presence (user_id, investigation_id, status, last_seen)
    VALUES (NEW.user_id, NEW.investigation_id, 'online', CURRENT_TIMESTAMP);
END;
```

## Backend Service Integration

### Rust Backend Services
```rust
// File: src/services/investigation_service.rs
// New service for investigation management

use sqlx::{SqlitePool, Row};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Investigation {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: InvestigationStatus,
    pub priority: Priority,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub lead_investigator: Option<String>,
    pub team_members: Vec<String>,
    pub tags: Vec<String>,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InvestigationTask {
    pub id: String,
    pub investigation_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Priority,
    pub assignee: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub due_date: Option<DateTime<Utc>>,
    pub estimated_hours: Option<i32>,
    pub actual_hours: Option<i32>,
    pub location: Option<Location>,
    pub dependencies: Vec<String>,
    pub tags: Vec<String>,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EvidenceItem {
    pub id: String,
    pub investigation_id: String,
    pub task_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub evidence_type: EvidenceType,
    pub file_path: Option<String>,
    pub original_filename: Option<String>,
    pub mime_type: Option<String>,
    pub file_size: Option<i64>,
    pub hash_sha256: String,
    pub hash_md5: Option<String>,
    pub collected_at: DateTime<Utc>,
    pub collected_by: String,
    pub source: String,
    pub chain_of_custody: Vec<CustodyRecord>,
    pub tags: Vec<String>,
    pub metadata: serde_json::Value,
    pub is_encrypted: bool,
    pub encryption_key_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum InvestigationStatus {
    Active,
    Paused,
    Completed,
    Archived,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum TaskStatus {
    Backlog,
    InProgress,
    Analysis,
    Review,
    Completed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum EvidenceType {
    File,
    Screenshot,
    Log,
    Network,
    External,
    Document,
    Image,
    Video,
    Audio,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Location {
    pub lat: f64,
    pub lng: f64,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustodyRecord {
    pub timestamp: DateTime<Utc>,
    pub user_id: String,
    pub action: String,
    pub details: Option<String>,
}

pub struct InvestigationService {
    db: SqlitePool,
}

impl InvestigationService {
    pub fn new(db: SqlitePool) -> Self {
        Self { db }
    }

    // Investigation CRUD operations
    pub async fn create_investigation(&self, investigation: &Investigation) -> Result<Investigation> {
        let team_members_json = serde_json::to_string(&investigation.team_members)?;
        let tags_json = serde_json::to_string(&investigation.tags)?;
        let metadata_json = serde_json::to_string(&investigation.metadata)?;

        sqlx::query!(
            r#"
            INSERT INTO investigations (
                id, title, description, status, priority, created_by, 
                lead_investigator, team_members, tags, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            investigation.id,
            investigation.title,
            investigation.description,
            investigation.status.to_string(),
            investigation.priority.to_string(),
            investigation.created_by,
            investigation.lead_investigator,
            team_members_json,
            tags_json,
            metadata_json
        )
        .execute(&self.db)
        .await?;

        Ok(investigation.clone())
    }

    pub async fn get_investigation(&self, id: &str) -> Result<Option<Investigation>> {
        let row = sqlx::query!(
            "SELECT * FROM investigations WHERE id = ?",
            id
        )
        .fetch_optional(&self.db)
        .await?;

        if let Some(row) = row {
            let team_members: Vec<String> = serde_json::from_str(&row.team_members.unwrap_or_default())?;
            let tags: Vec<String> = serde_json::from_str(&row.tags.unwrap_or_default())?;
            let metadata: serde_json::Value = serde_json::from_str(&row.metadata.unwrap_or_default())?;

            Ok(Some(Investigation {
                id: row.id,
                title: row.title,
                description: row.description,
                status: row.status.parse()?,
                priority: row.priority.parse()?,
                created_at: row.created_at.parse()?,
                updated_at: row.updated_at.parse()?,
                created_by: row.created_by,
                lead_investigator: row.lead_investigator,
                team_members,
                tags,
                metadata,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn list_investigations(&self, user_id: &str) -> Result<Vec<Investigation>> {
        let rows = sqlx::query!(
            r#"
            SELECT * FROM investigations 
            WHERE created_by = ? OR lead_investigator = ? 
               OR json_extract(team_members, '$') LIKE '%' || ? || '%'
            ORDER BY updated_at DESC
            "#,
            user_id,
            user_id,
            user_id
        )
        .fetch_all(&self.db)
        .await?;

        let mut investigations = Vec::new();
        for row in rows {
            let team_members: Vec<String> = serde_json::from_str(&row.team_members.unwrap_or_default())?;
            let tags: Vec<String> = serde_json::from_str(&row.tags.unwrap_or_default())?;
            let metadata: serde_json::Value = serde_json::from_str(&row.metadata.unwrap_or_default())?;

            investigations.push(Investigation {
                id: row.id,
                title: row.title,
                description: row.description,
                status: row.status.parse()?,
                priority: row.priority.parse()?,
                created_at: row.created_at.parse()?,
                updated_at: row.updated_at.parse()?,
                created_by: row.created_by,
                lead_investigator: row.lead_investigator,
                team_members,
                tags,
                metadata,
            });
        }

        Ok(investigations)
    }

    // Task management
    pub async fn create_task(&self, task: &InvestigationTask) -> Result<InvestigationTask> {
        let dependencies_json = serde_json::to_string(&task.dependencies)?;
        let tags_json = serde_json::to_string(&task.tags)?;
        let metadata_json = serde_json::to_string(&task.metadata)?;
        let location_json = if let Some(ref location) = task.location {
            Some(serde_json::to_string(location)?)
        } else {
            None
        };

        sqlx::query!(
            r#"
            INSERT INTO investigation_tasks (
                id, investigation_id, title, description, status, priority,
                assignee, due_date, estimated_hours, location_lat, location_lng,
                location_name, dependencies, tags, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            task.id,
            task.investigation_id,
            task.title,
            task.description,
            task.status.to_string(),
            task.priority.to_string(),
            task.assignee,
            task.due_date,
            task.estimated_hours,
            task.location.as_ref().map(|l| l.lat),
            task.location.as_ref().map(|l| l.lng),
            task.location.as_ref().and_then(|l| l.name.as_ref()),
            dependencies_json,
            tags_json,
            metadata_json
        )
        .execute(&self.db)
        .await?;

        Ok(task.clone())
    }

    pub async fn get_tasks_by_investigation(&self, investigation_id: &str) -> Result<Vec<InvestigationTask>> {
        let rows = sqlx::query!(
            "SELECT * FROM investigation_tasks WHERE investigation_id = ? ORDER BY created_at ASC",
            investigation_id
        )
        .fetch_all(&self.db)
        .await?;

        let mut tasks = Vec::new();
        for row in rows {
            let dependencies: Vec<String> = serde_json::from_str(&row.dependencies.unwrap_or_default())?;
            let tags: Vec<String> = serde_json::from_str(&row.tags.unwrap_or_default())?;
            let metadata: serde_json::Value = serde_json::from_str(&row.metadata.unwrap_or_default())?;
            let location = if let (Some(lat), Some(lng)) = (row.location_lat, row.location_lng) {
                Some(Location {
                    lat,
                    lng,
                    name: row.location_name,
                })
            } else {
                None
            };

            tasks.push(InvestigationTask {
                id: row.id,
                investigation_id: row.investigation_id,
                title: row.title,
                description: row.description,
                status: row.status.parse()?,
                priority: row.priority.parse()?,
                assignee: row.assignee,
                created_at: row.created_at.parse()?,
                updated_at: row.updated_at.parse()?,
                due_date: row.due_date.map(|d| d.parse()).transpose()?,
                estimated_hours: row.estimated_hours,
                actual_hours: row.actual_hours,
                location,
                dependencies,
                tags,
                metadata,
            });
        }

        Ok(tasks)
    }

    // Evidence management
    pub async fn add_evidence(&self, evidence: &EvidenceItem) -> Result<EvidenceItem> {
        let chain_of_custody_json = serde_json::to_string(&evidence.chain_of_custody)?;
        let tags_json = serde_json::to_string(&evidence.tags)?;
        let metadata_json = serde_json::to_string(&evidence.metadata)?;

        sqlx::query!(
            r#"
            INSERT INTO evidence_items (
                id, investigation_id, task_id, title, description, type,
                file_path, original_filename, mime_type, file_size,
                hash_sha256, hash_md5, collected_by, source,
                chain_of_custody, tags, metadata, is_encrypted, encryption_key_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            evidence.id,
            evidence.investigation_id,
            evidence.task_id,
            evidence.title,
            evidence.description,
            evidence.evidence_type.to_string(),
            evidence.file_path,
            evidence.original_filename,
            evidence.mime_type,
            evidence.file_size,
            evidence.hash_sha256,
            evidence.hash_md5,
            evidence.collected_by,
            evidence.source,
            chain_of_custody_json,
            tags_json,
            metadata_json,
            evidence.is_encrypted,
            evidence.encryption_key_id
        )
        .execute(&self.db)
        .await?;

        Ok(evidence.clone())
    }

    // Activity logging
    pub async fn log_activity(
        &self,
        investigation_id: &str,
        user_id: &str,
        activity_type: &str,
        target_type: Option<&str>,
        target_id: Option<&str>,
        description: &str,
        details: Option<&serde_json::Value>,
    ) -> Result<()> {
        let details_json = details.map(|d| serde_json::to_string(d)).transpose()?;

        sqlx::query!(
            r#"
            INSERT INTO investigation_activities (
                id, investigation_id, user_id, activity_type,
                target_type, target_id, description, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            Uuid::new_v4().to_string(),
            investigation_id,
            user_id,
            activity_type,
            target_type,
            target_id,
            description,
            details_json
        )
        .execute(&self.db)
        .await?;

        Ok(())
    }
}

// Implement Display traits for enums
impl std::fmt::Display for InvestigationStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InvestigationStatus::Active => write!(f, "active"),
            InvestigationStatus::Paused => write!(f, "paused"),
            InvestigationStatus::Completed => write!(f, "completed"),
            InvestigationStatus::Archived => write!(f, "archived"),
        }
    }
}

impl std::str::FromStr for InvestigationStatus {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "active" => Ok(InvestigationStatus::Active),
            "paused" => Ok(InvestigationStatus::Paused),
            "completed" => Ok(InvestigationStatus::Completed),
            "archived" => Ok(InvestigationStatus::Archived),
            _ => Err(anyhow::anyhow!("Invalid investigation status: {}", s)),
        }
    }
}

// Similar implementations for other enums...
```

### API Endpoints Integration
```rust
// File: src/api/investigation_routes.rs
// REST API endpoints for investigation management

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use crate::services::investigation_service::{InvestigationService, Investigation, InvestigationTask, EvidenceItem};

#[derive(Deserialize)]
pub struct CreateInvestigationRequest {
    pub title: String,
    pub description: Option<String>,
    pub priority: String,
    pub team_members: Vec<String>,
    pub tags: Vec<String>,
}

#[derive(Deserialize)]
pub struct UpdateInvestigationRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub lead_investigator: Option<String>,
    pub team_members: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub priority: String,
    pub assignee: Option<String>,
    pub due_date: Option<String>,
    pub estimated_hours: Option<i32>,
    pub location: Option<Location>,
    pub tags: Vec<String>,
}

pub fn investigation_routes() -> Router<InvestigationService> {
    Router::new()
        // Investigation management
        .route("/investigations", get(list_investigations).post(create_investigation))
        .route("/investigations/:id", get(get_investigation).put(update_investigation).delete(delete_investigation))
        
        // Task management
        .route("/investigations/:id/tasks", get(list_tasks).post(create_task))
        .route("/investigations/:id/tasks/:task_id", get(get_task).put(update_task).delete(delete_task))
        
        // Evidence management
        .route("/investigations/:id/evidence", get(list_evidence).post(add_evidence))
        .route("/investigations/:id/evidence/:evidence_id", get(get_evidence).delete(delete_evidence))
        
        // Team management
        .route("/investigations/:id/team", get(get_team).post(add_team_member))
        .route("/investigations/:id/team/:user_id", delete(remove_team_member))
        
        // Activity and timeline
        .route("/investigations/:id/activities", get(get_activities))
        .route("/investigations/:id/timeline", get(get_timeline))
        
        // Chat and collaboration
        .route("/investigations/:id/chat", get(get_chat_messages).post(send_chat_message))
        .route("/investigations/:id/presence", get(get_team_presence).put(update_presence))
}

// Handler implementations
pub async fn create_investigation(
    State(service): State<InvestigationService>,
    Json(request): Json<CreateInvestigationRequest>,
) -> Result<Json<Investigation>, StatusCode> {
    // Implementation details...
    todo!()
}

pub async fn list_investigations(
    State(service): State<InvestigationService>,
    // Extract user ID from authentication context
) -> Result<Json<Vec<Investigation>>, StatusCode> {
    // Implementation details...
    todo!()
}

// Additional handler implementations...
```

### Nostr Event Integration
```rust
// File: src/services/collaboration_events.rs
// Integration with existing Nostr relay for real-time collaboration

use serde::{Deserialize, Serialize};
use crate::nostr_relay::NostrRelay;

#[derive(Debug, Serialize, Deserialize)]
pub enum CollaborationEventType {
    InvestigationUpdate,
    TaskUpdate,
    EvidenceAdded,
    ChatMessage,
    PresenceUpdate,
    TeamMemberJoined,
    TeamMemberLeft,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CollaborationEvent {
    pub event_type: CollaborationEventType,
    pub investigation_id: String,
    pub user_id: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub payload: serde_json::Value,
}

pub struct CollaborationService {
    nostr_relay: NostrRelay,
    investigation_service: InvestigationService,
}

impl CollaborationService {
    pub fn new(nostr_relay: NostrRelay, investigation_service: InvestigationService) -> Self {
        Self {
            nostr_relay,
            investigation_service,
        }
    }

    pub async fn broadcast_event(&self, event: CollaborationEvent) -> anyhow::Result<()> {
        // Convert collaboration event to Nostr event
        let nostr_event = self.create_nostr_event(event)?;
        
        // Broadcast via existing Nostr relay
        self.nostr_relay.broadcast_event(nostr_event).await?;
        
        Ok(())
    }

    pub async fn subscribe_to_investigation(&self, investigation_id: &str) -> anyhow::Result<()> {
        // Set up Nostr subscription for investigation-specific events
        let filter = format!("investigation:{}", investigation_id);
        self.nostr_relay.subscribe(filter).await?;
        
        Ok(())
    }

    fn create_nostr_event(&self, event: CollaborationEvent) -> anyhow::Result<NostrEvent> {
        // Convert CollaborationEvent to Nostr event format
        // Implementation depends on existing Nostr event structure
        todo!()
    }
}
```

### File System Integration
```rust
// File: src/services/evidence_storage.rs
// Evidence file storage using Tauri filesystem APIs

use std::path::PathBuf;
use tokio::fs;
use sha2::{Sha256, Digest};
use crate::security_layer::SecurityLayer;

pub struct EvidenceStorageService {
    storage_path: PathBuf,
    security_layer: SecurityLayer,
}

impl EvidenceStorageService {
    pub fn new(storage_path: PathBuf, security_layer: SecurityLayer) -> Self {
        Self {
            storage_path,
            security_layer,
        }
    }

    pub async fn store_evidence_file(
        &self,
        investigation_id: &str,
        evidence_id: &str,
        filename: &str,
        data: &[u8],
        encrypt: bool,
    ) -> anyhow::Result<(String, String)> { // Returns (file_path, hash)
        
        // Create evidence directory structure
        let evidence_dir = self.storage_path
            .join("investigations")
            .join(investigation_id)
            .join("evidence");
        
        fs::create_dir_all(&evidence_dir).await?;

        // Generate hash for integrity
        let mut hasher = Sha256::new();
        hasher.update(data);
        let hash = format!("{:x}", hasher.finalize());

        // Determine file path
        let file_extension = PathBuf::from(filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        
        let stored_filename = if encrypt {
            format!("{}.enc", evidence_id)
        } else {
            format!("{}.{}", evidence_id, file_extension)
        };

        let file_path = evidence_dir.join(&stored_filename);

        // Encrypt if requested
        let final_data = if encrypt {
            self.security_layer.encrypt(data).await?
        } else {
            data.to_vec()
        };

        // Write file
        fs::write(&file_path, final_data).await?;

        // Return relative path and hash
        let relative_path = file_path
            .strip_prefix(&self.storage_path)?
            .to_string_lossy()
            .to_string();

        Ok((relative_path, hash))
    }

    pub async fn retrieve_evidence_file(
        &self,
        file_path: &str,
        is_encrypted: bool,
    ) -> anyhow::Result<Vec<u8>> {
        let full_path = self.storage_path.join(file_path);
        let data = fs::read(full_path).await?;

        if is_encrypted {
            self.security_layer.decrypt(&data).await
        } else {
            Ok(data)
        }
    }

    pub async fn verify_evidence_integrity(
        &self,
        file_path: &str,
        expected_hash: &str,
        is_encrypted: bool,
    ) -> anyhow::Result<bool> {
        let data = self.retrieve_evidence_file(file_path, is_encrypted).await?;
        
        let mut hasher = Sha256::new();
        hasher.update(&data);
        let actual_hash = format!("{:x}", hasher.finalize());

        Ok(actual_hash == expected_hash)
    }
}
```

This comprehensive database and backend integration specification ensures:

1. **Proper data modeling** for investigation management
2. **Secure evidence storage** with integrity verification
3. **Real-time collaboration** via existing Nostr relay
4. **RESTful API** for frontend integration
5. **File system security** using existing security layer
6. **Audit trails** for compliance and forensic requirements
7. **Performance optimization** through proper indexing
8. **Data integrity** through foreign key constraints and triggers

The implementation leverages all existing infrastructure while adding the necessary investigation management capabilities.
