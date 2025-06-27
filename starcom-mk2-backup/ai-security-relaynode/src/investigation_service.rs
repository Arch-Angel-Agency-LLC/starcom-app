// Investigation service with simplified SQL queries
use sqlx::{SqlitePool, Row};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use std::str::FromStr;
use tracing::{info, error, warn};

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
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InvestigationTask {
    pub id: String,
    pub investigation_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Priority,
    pub assigned_to: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub due_date: Option<DateTime<Utc>>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Evidence {
    pub id: String,
    pub investigation_id: String,
    pub task_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub evidence_type: String,
    pub source: String,
    pub content: String,
    pub hash: Option<String>,
    pub collected_at: DateTime<Utc>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InvestigationActivity {
    pub id: String,
    pub investigation_id: String,
    pub user_id: String,
    pub activity_type: String,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum InvestigationStatus {
    Active,
    Pending,
    Completed,
    Archived,
}

impl FromStr for InvestigationStatus {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s {
            "Active" => Ok(InvestigationStatus::Active),
            "Pending" => Ok(InvestigationStatus::Pending),
            "Completed" => Ok(InvestigationStatus::Completed),
            "Archived" => Ok(InvestigationStatus::Archived),
            _ => Err(anyhow::anyhow!("Invalid investigation status: {}", s)),
        }
    }
}

impl ToString for InvestigationStatus {
    fn to_string(&self) -> String {
        match self {
            InvestigationStatus::Active => "Active".to_string(),
            InvestigationStatus::Pending => "Pending".to_string(),
            InvestigationStatus::Completed => "Completed".to_string(),
            InvestigationStatus::Archived => "Archived".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum TaskStatus {
    Open,
    InProgress,
    Review,
    Completed,
}

impl FromStr for TaskStatus {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s {
            "Open" => Ok(TaskStatus::Open),
            "InProgress" => Ok(TaskStatus::InProgress),
            "Review" => Ok(TaskStatus::Review),
            "Completed" => Ok(TaskStatus::Completed),
            _ => Err(anyhow::anyhow!("Invalid task status: {}", s)),
        }
    }
}

impl ToString for TaskStatus {
    fn to_string(&self) -> String {
        match self {
            TaskStatus::Open => "Open".to_string(),
            TaskStatus::InProgress => "InProgress".to_string(),
            TaskStatus::Review => "Review".to_string(),
            TaskStatus::Completed => "Completed".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

impl FromStr for Priority {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s {
            "Low" => Ok(Priority::Low),
            "Medium" => Ok(Priority::Medium),
            "High" => Ok(Priority::High),
            "Critical" => Ok(Priority::Critical),
            _ => Err(anyhow::anyhow!("Invalid priority: {}", s)),
        }
    }
}

impl ToString for Priority {
    fn to_string(&self) -> String {
        match self {
            Priority::Low => "Low".to_string(),
            Priority::Medium => "Medium".to_string(),
            Priority::High => "High".to_string(),
            Priority::Critical => "Critical".to_string(),
        }
    }
}

pub struct InvestigationService {
    pool: SqlitePool,
}

impl InvestigationService {
    pub async fn new(pool: SqlitePool) -> Result<Self> {
        Ok(Self { pool })
    }

    // Create a new investigation
    pub async fn create_investigation(
        &self,
        title: String,
        description: Option<String>,
        priority: Priority,
        created_by: String,
    ) -> Result<Investigation> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let metadata_json = serde_json::to_string(&serde_json::Value::Null)?;

        sqlx::query(
            r#"
            INSERT INTO investigations (
                id, title, description, status, priority, created_by, 
                created_at, updated_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&title)
        .bind(&description)
        .bind(InvestigationStatus::Active.to_string())
        .bind(priority.to_string())
        .bind(&created_by)
        .bind(now)
        .bind(now)
        .bind(metadata_json)
        .execute(&self.pool)
        .await?;

        Ok(Investigation {
            id,
            title,
            description,
            status: InvestigationStatus::Active,
            priority,
            created_at: now,
            updated_at: now,
            created_by,
            lead_investigator: None,
            metadata: None,
        })
    }

    // Get investigation by ID
    pub async fn get_investigation(&self, id: &str) -> Result<Option<Investigation>> {
        let row = sqlx::query("SELECT * FROM investigations WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            Ok(Some(Investigation {
                id: row.get("id"),
                title: row.get("title"),
                description: row.get("description"),
                status: InvestigationStatus::from_str(&row.get::<String, _>("status"))?,
                priority: Priority::from_str(&row.get::<String, _>("priority"))?,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                created_by: row.get("created_by"),
                lead_investigator: row.get("lead_investigator"),
                metadata: row.get::<Option<String>, _>("metadata")
                    .map(|s| serde_json::from_str(&s))
                    .transpose()?,
            }))
        } else {
            Ok(None)
        }
    }

    // Get investigation with user access control
    pub async fn get_investigation_for_user(&self, id: &str, user_id: &str) -> Result<Option<Investigation>> {
        let row = sqlx::query(
            r#"
            SELECT * FROM investigations 
            WHERE id = ? AND (created_by = ? OR lead_investigator = ?)
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            Ok(Some(Investigation {
                id: row.get("id"),
                title: row.get("title"),
                description: row.get("description"),
                status: InvestigationStatus::from_str(&row.get::<String, _>("status"))?,
                priority: Priority::from_str(&row.get::<String, _>("priority"))?,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                created_by: row.get("created_by"),
                lead_investigator: row.get("lead_investigator"),
                metadata: row.get::<Option<String>, _>("metadata")
                    .map(|s| serde_json::from_str(&s))
                    .transpose()?,
            }))
        } else {
            Ok(None)
        }
    }

    // List investigations for a user
    pub async fn list_investigations(&self, user_id: &str) -> Result<Vec<Investigation>> {
        let rows = sqlx::query(
            r#"
            SELECT * FROM investigations 
            WHERE created_by = ? OR lead_investigator = ? 
            ORDER BY created_at DESC
            "#,
        )
        .bind(user_id)
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        let mut investigations = Vec::new();
        for row in rows {
            investigations.push(Investigation {
                id: row.get("id"),
                title: row.get("title"),
                description: row.get("description"),
                status: InvestigationStatus::from_str(&row.get::<String, _>("status"))?,
                priority: Priority::from_str(&row.get::<String, _>("priority"))?,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                created_by: row.get("created_by"),
                lead_investigator: row.get("lead_investigator"),
                metadata: row.get::<Option<String>, _>("metadata")
                    .map(|s| serde_json::from_str(&s))
                    .transpose()?,
            });
        }

        Ok(investigations)
    }

    // Update investigation
    pub async fn update_investigation(&self, investigation: &Investigation) -> Result<Investigation> {
        let now = Utc::now();
        let metadata_json = investigation.metadata.as_ref()
            .map(|m| serde_json::to_string(m))
            .transpose()?
            .unwrap_or_else(|| "null".to_string());

        sqlx::query(
            r#"
            UPDATE investigations 
            SET title = ?, description = ?, status = ?, priority = ?, 
                lead_investigator = ?, updated_at = ?, metadata = ?
            WHERE id = ?
            "#,
        )
        .bind(&investigation.title)
        .bind(&investigation.description)
        .bind(investigation.status.to_string())
        .bind(investigation.priority.to_string())
        .bind(&investigation.lead_investigator)
        .bind(now)
        .bind(metadata_json)
        .bind(&investigation.id)
        .execute(&self.pool)
        .await?;

        let mut updated = investigation.clone();
        updated.updated_at = now;
        Ok(updated)
    }

    // Add a simple delete method
    pub async fn delete_investigation(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM investigations WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // Task management methods (simplified)
    pub async fn list_tasks(&self, investigation_id: &str) -> Result<Vec<InvestigationTask>> {
        let rows = sqlx::query(
            "SELECT * FROM investigation_tasks WHERE investigation_id = ? ORDER BY created_at ASC"
        )
        .bind(investigation_id)
        .fetch_all(&self.pool)
        .await?;

        let mut tasks = Vec::new();
        for row in rows {
            tasks.push(InvestigationTask {
                id: row.get("id"),
                investigation_id: row.get("investigation_id"),
                title: row.get("title"),
                description: row.get("description"),
                status: TaskStatus::from_str(&row.get::<String, _>("status"))?,
                priority: Priority::from_str(&row.get::<String, _>("priority"))?,
                assigned_to: row.get("assigned_to"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                due_date: row.get("due_date"),
                metadata: row.get::<Option<String>, _>("metadata")
                    .map(|s| serde_json::from_str(&s))
                    .transpose()?,
            });
        }

        Ok(tasks)
    }

    pub async fn create_task(
        &self,
        investigation_id: String,
        title: String,
        description: Option<String>,
        priority: Priority,
        assigned_to: Option<String>,
        due_date: Option<DateTime<Utc>>,
    ) -> Result<InvestigationTask> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let metadata_json = serde_json::to_string(&serde_json::Value::Null)?;

        sqlx::query(
            r#"
            INSERT INTO investigation_tasks (
                id, investigation_id, title, description, status, priority,
                assigned_to, created_at, updated_at, due_date, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&investigation_id)
        .bind(&title)
        .bind(&description)
        .bind(TaskStatus::Open.to_string())
        .bind(priority.to_string())
        .bind(&assigned_to)
        .bind(now)
        .bind(now)
        .bind(due_date)
        .bind(metadata_json)
        .execute(&self.pool)
        .await?;

        Ok(InvestigationTask {
            id,
            investigation_id,
            title,
            description,
            status: TaskStatus::Open,
            priority,
            assigned_to,
            created_at: now,
            updated_at: now,
            due_date,
            metadata: None,
        })
    }

    // Evidence management methods (simplified)
    pub async fn list_evidence(&self, investigation_id: &str) -> Result<Vec<Evidence>> {
        let rows = sqlx::query(
            "SELECT * FROM evidence_items WHERE investigation_id = ? ORDER BY collected_at DESC"
        )
        .bind(investigation_id)
        .fetch_all(&self.pool)
        .await?;

        let mut evidence_list = Vec::new();
        for row in rows {
            evidence_list.push(Evidence {
                id: row.get("id"),
                investigation_id: row.get("investigation_id"),
                task_id: row.get("task_id"),
                title: row.get("title"),
                description: row.get("description"),
                evidence_type: row.get("type"),
                source: row.get("source"),
                content: row.get("content"),
                hash: row.get("hash"),
                collected_at: row.get("collected_at"),
                metadata: row.get::<Option<String>, _>("metadata")
                    .map(|s| serde_json::from_str(&s))
                    .transpose()?,
            });
        }

        Ok(evidence_list)
    }

    pub async fn create_evidence(
        &self,
        investigation_id: String,
        evidence_type: String,
        source: String,
        content: String,
        hash: Option<String>,
        metadata: Option<serde_json::Value>,
    ) -> Result<Evidence> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let metadata_json = metadata
            .as_ref()
            .map(|m| serde_json::to_string(m))
            .transpose()?
            .unwrap_or_else(|| "null".to_string());

        sqlx::query(
            r#"
            INSERT INTO evidence_items (
                id, investigation_id, title, description, type, source,
                content, hash, collected_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&investigation_id)
        .bind("Evidence Item") // Default title
        .bind("") // Default description
        .bind(&evidence_type)
        .bind(&source)
        .bind(&content)
        .bind(&hash)
        .bind(now)
        .bind(metadata_json)
        .execute(&self.pool)
        .await?;

        Ok(Evidence {
            id,
            investigation_id,
            task_id: None,
            title: "Evidence Item".to_string(),
            description: Some("".to_string()),
            evidence_type,
            source,
            content,
            hash,
            collected_at: now,
            metadata,
        })
    }

    // Activity log methods (simplified)
    pub async fn get_activities(&self, investigation_id: &str, limit: Option<i32>) -> Result<Vec<serde_json::Value>> {
        let limit_value = limit.unwrap_or(50);
        let rows = sqlx::query(
            "SELECT * FROM investigation_activities WHERE investigation_id = ? ORDER BY created_at DESC LIMIT ?"
        )
        .bind(investigation_id)
        .bind(limit_value)
        .fetch_all(&self.pool)
        .await?;

        let mut activities = Vec::new();
        for row in rows {
            let activity = serde_json::json!({
                "id": row.get::<String, _>("id"),
                "investigation_id": row.get::<String, _>("investigation_id"),
                "user_id": row.get::<String, _>("user_id"),
                "activity_type": row.get::<String, _>("activity_type"),
                "description": row.get::<String, _>("description"),
                "created_at": row.get::<DateTime<Utc>, _>("created_at"),
                "details": row.get::<Option<String>, _>("details")
                    .map(|d| serde_json::from_str(&d))
                    .transpose()?
                    .unwrap_or(serde_json::Value::Null)
            });
            activities.push(activity);
        }

        Ok(activities)
    }

    pub async fn add_activity(
        &self,
        investigation_id: &str,
        user_id: &str,
        activity_type: &str,
        description: &str,
        details: Option<serde_json::Value>,
    ) -> Result<()> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let details_json = details
            .map(|d| serde_json::to_string(&d))
            .transpose()?
            .unwrap_or_else(|| "null".to_string());

        sqlx::query(
            r#"
            INSERT INTO investigation_activities (
                id, investigation_id, user_id, activity_type,
                description, created_at, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(id)
        .bind(investigation_id)
        .bind(user_id)
        .bind(activity_type)
        .bind(description)
        .bind(now)
        .bind(details_json)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
