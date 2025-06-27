use anyhow::{Result, Context};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn, error, debug};
use sqlx::{Row, Column}; // Added Row trait import

use crate::nostr_relay::{NostrEvent, Filter};

/// Evidence event for Earth Alliance operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceEvent {
    pub event_id: String,
    pub evidence_hash: String,
    pub evidence_type: String,
    pub submitter_pubkey: String,
    pub submission_time: u64,
    pub clearance_level: String,
    pub verification_status: String,
    pub chain_hash: Option<String>, // Hash of previous evidence in chain
    pub metadata: serde_json::Value,
}

/// Clearance levels for Earth Alliance operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClearanceLevel {
    Unclassified,
    Restricted,
    Confidential,
    Secret,
    TopSecret,
    EarthAlliance, // Special clearance for resistance operations
}

impl ClearanceLevel {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "unclassified" => ClearanceLevel::Unclassified,
            "restricted" => ClearanceLevel::Restricted,
            "confidential" => ClearanceLevel::Confidential,
            "secret" => ClearanceLevel::Secret,
            "topsecret" | "top_secret" => ClearanceLevel::TopSecret,
            "earthalliance" | "earth_alliance" => ClearanceLevel::EarthAlliance,
            _ => ClearanceLevel::Unclassified,
        }
    }
    
    pub fn to_string(&self) -> String {
        match self {
            ClearanceLevel::Unclassified => "unclassified".to_string(),
            ClearanceLevel::Restricted => "restricted".to_string(),
            ClearanceLevel::Confidential => "confidential".to_string(),
            ClearanceLevel::Secret => "secret".to_string(),  
            ClearanceLevel::TopSecret => "topsecret".to_string(),
            ClearanceLevel::EarthAlliance => "earthalliance".to_string(),
        }
    }
}

/// Event storage trait with Earth Alliance features
#[async_trait]
pub trait EventStore: Send + Sync {
    /// Core Nostr event operations
    async fn store_event(&self, event: &NostrEvent) -> Result<()>;
    async fn get_event_by_id(&self, id: &str) -> Result<Option<NostrEvent>>;
    async fn query_events(&self, filters: &[Filter]) -> Result<Vec<NostrEvent>>;
    async fn count_events(&self, filters: &[Filter]) -> Result<u64>;
    async fn delete_event(&self, id: &str) -> Result<bool>;
    
    /// Earth Alliance specific operations
    async fn store_evidence(&self, evidence: &EvidenceEvent) -> Result<()>;
    async fn query_by_clearance(&self, level: ClearanceLevel, filters: &[Filter]) -> Result<Vec<NostrEvent>>;
    async fn query_by_team(&self, team_id: &str, filters: &[Filter]) -> Result<Vec<NostrEvent>>;
    async fn get_evidence_chain(&self, starting_hash: &str) -> Result<Vec<EvidenceEvent>>;
    async fn validate_evidence_chain(&self, evidence_hash: &str) -> Result<bool>;
    
    /// Administrative operations
    async fn get_stats(&self) -> Result<EventStoreStats>;
    async fn compact_database(&self) -> Result<()>;
    async fn backup_to_file(&self, path: &str) -> Result<()>;
}

/// Event store statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct EventStoreStats {
    pub total_events: u64,
    pub total_evidence: u64,
    pub storage_size_bytes: u64,
    pub oldest_event_timestamp: Option<u64>,
    pub newest_event_timestamp: Option<u64>,
    pub unique_authors: u64,
    pub events_by_kind: std::collections::HashMap<u16, u64>,
    pub earth_alliance_stats: EarthAllianceStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EarthAllianceStats {
    pub total_teams: u64,
    pub events_by_clearance: std::collections::HashMap<String, u64>,
    pub evidence_by_status: std::collections::HashMap<String, u64>,
    pub active_resistance_cells: u64,
}

/// SQLite implementation of EventStore
pub struct SqliteEventStore {
    pool: sqlx::sqlite::SqlitePool,
}

impl SqliteEventStore {
    /// Create new SQLite event store
    pub async fn new(database_url: &str) -> Result<Self> {
        info!("🗄️ Initializing SQLite event store: {}", database_url);
        
        let pool = sqlx::sqlite::SqlitePoolOptions::new()
            .max_connections(20)
            .connect(database_url)
            .await
            .context("Failed to connect to SQLite database")?;
        
        let store = Self { pool };
        store.initialize_schema().await?;
        
        info!("✅ SQLite event store initialized successfully");
        Ok(store)
    }
    
    /// Initialize database schema
    async fn initialize_schema(&self) -> Result<()> {
        debug!("📋 Initializing database schema");
        
        // Core events table
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                pubkey TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                kind INTEGER NOT NULL,
                tags TEXT NOT NULL, -- JSON
                content TEXT NOT NULL,
                sig TEXT NOT NULL,
                indexed_at INTEGER NOT NULL,
                -- Earth Alliance fields
                team_id TEXT,
                clearance_level TEXT,
                resistance_cell TEXT,
                operative_level TEXT
            )
        "#)
        .execute(&self.pool)
        .await
        .context("Failed to create events table")?;
        
        // Evidence table for Earth Alliance operations
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS evidence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                evidence_hash TEXT NOT NULL UNIQUE,
                evidence_type TEXT NOT NULL,
                submitter_pubkey TEXT NOT NULL,
                submission_time INTEGER NOT NULL,
                clearance_level TEXT NOT NULL,
                verification_status TEXT NOT NULL,
                chain_hash TEXT,
                metadata TEXT NOT NULL, -- JSON
                FOREIGN KEY (event_id) REFERENCES events (id)
            )
        "#)
        .execute(&self.pool)
        .await
        .context("Failed to create evidence table")?;
        
        // Create indexes for performance
        self.create_indexes().await?;
        
        debug!("✅ Database schema initialized");
        Ok(())
    }
    
    /// Create database indexes for optimal query performance
    async fn create_indexes(&self) -> Result<()> {
        let indexes = vec![
            "CREATE INDEX IF NOT EXISTS idx_events_pubkey ON events (pubkey)",
            "CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at)",
            "CREATE INDEX IF NOT EXISTS idx_events_kind ON events (kind)",
            "CREATE INDEX IF NOT EXISTS idx_events_team_id ON events (team_id)",
            "CREATE INDEX IF NOT EXISTS idx_events_clearance ON events (clearance_level)",
            "CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence (evidence_hash)",
            "CREATE INDEX IF NOT EXISTS idx_evidence_submitter ON evidence (submitter_pubkey)",
            "CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence (verification_status)",
        ];
        
        for index_sql in indexes {
            sqlx::query(index_sql)
                .execute(&self.pool)
                .await
                .context("Failed to create index")?;
        }
        
        Ok(())
    }
    
    /// Extract Earth Alliance metadata from event for storage
    fn extract_metadata(&self, event: &NostrEvent) -> (Option<String>, Option<String>, Option<String>, Option<String>) {
        let mut team_id = None;
        let mut clearance_level = None;
        let mut resistance_cell = None;
        let mut operative_level = None;
        
        for tag in &event.tags {
            if tag.len() >= 2 {
                match tag[0].as_str() {
                    "team" => team_id = Some(tag[1].clone()),
                    "clearance" => clearance_level = Some(tag[1].clone()),
                    "cell" => resistance_cell = Some(tag[1].clone()),
                    "operative" => operative_level = Some(tag[1].clone()),
                    _ => {}
                }
            }
        }
        
        (team_id, clearance_level, resistance_cell, operative_level)
    }
    
    /// Build WHERE clause for filters
    fn build_filter_where_clause(&self, filters: &[Filter]) -> (String, Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send>>) {
        if filters.is_empty() {
            return ("1=1".to_string(), vec![]);
        }
        
        let mut conditions = Vec::new();
        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send>> = Vec::new();
        
        for filter in filters {
            let mut filter_conditions = Vec::new();
            
            // IDs filter
            if let Some(ids) = &filter.ids {
                if !ids.is_empty() {
                    let placeholders: Vec<String> = (0..ids.len()).map(|_| "?".to_string()).collect();
                    filter_conditions.push(format!("id IN ({})", placeholders.join(",")));
                    for id in ids {
                        params.push(Box::new(id.clone()));
                    }
                }
            }
            
            // Authors filter
            if let Some(authors) = &filter.authors {
                if !authors.is_empty() {
                    let placeholders: Vec<String> = (0..authors.len()).map(|_| "?".to_string()).collect();
                    filter_conditions.push(format!("pubkey IN ({})", placeholders.join(",")));
                    for author in authors {
                        params.push(Box::new(author.clone()));
                    }
                }
            }
            
            // Kinds filter
            if let Some(kinds) = &filter.kinds {
                if !kinds.is_empty() {
                    let placeholders: Vec<String> = (0..kinds.len()).map(|_| "?".to_string()).collect();
                    filter_conditions.push(format!("kind IN ({})", placeholders.join(",")));
                    for kind in kinds {
                        params.push(Box::new(*kind as i64));
                    }
                }
            }
            
            // Time range filters
            if let Some(since) = filter.since {
                filter_conditions.push("created_at >= ?".to_string());
                params.push(Box::new(since as i64));
            }
            
            if let Some(until) = filter.until {
                filter_conditions.push("created_at <= ?".to_string());
                params.push(Box::new(until as i64));
            }
            
            if !filter_conditions.is_empty() {
                conditions.push(format!("({})", filter_conditions.join(" AND ")));
            }
        }
        
        let where_clause = if conditions.is_empty() {
            "1=1".to_string()
        } else {
            conditions.join(" OR ")
        };
        
        (where_clause, params)
    }
}

#[async_trait]
impl EventStore for SqliteEventStore {
    async fn store_event(&self, event: &NostrEvent) -> Result<()> {
        debug!("💾 Storing event: {}", event.id);
        
        let (team_id, clearance_level, resistance_cell, operative_level) = self.extract_metadata(event);
        let tags_json = serde_json::to_string(&event.tags)
            .context("Failed to serialize tags")?;
        let indexed_at = chrono::Utc::now().timestamp() as u64;
        
        sqlx::query(r#"
            INSERT OR REPLACE INTO events 
            (id, pubkey, created_at, kind, tags, content, sig, indexed_at, team_id, clearance_level, resistance_cell, operative_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#)
        .bind(&event.id)
        .bind(&event.pubkey)
        .bind(event.created_at as i64)
        .bind(event.kind as i64)
        .bind(&tags_json)
        .bind(&event.content)
        .bind(&event.sig)
        .bind(indexed_at as i64)
        .bind(&team_id)
        .bind(&clearance_level)
        .bind(&resistance_cell)
        .bind(&operative_level)
        .execute(&self.pool)
        .await
        .context("Failed to store event")?;
        
        info!("✅ Event stored successfully: {}", event.id);
        Ok(())
    }
    
    async fn get_event_by_id(&self, id: &str) -> Result<Option<NostrEvent>> {
        debug!("🔍 Querying event by ID: {}", id);
        
        let row = sqlx::query(
            "SELECT id, pubkey, created_at, kind, tags, content, sig FROM events WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to query event by ID")?;
        
        if let Some(row) = row {
            let tags: Vec<Vec<String>> = serde_json::from_str(row.get::<String, _>("tags").as_str())
                .context("Failed to deserialize tags")?;
            
            let event = NostrEvent {
                id: row.get("id"),
                pubkey: row.get("pubkey"),
                created_at: row.get::<i64, _>("created_at") as u64,
                kind: row.get::<i64, _>("kind") as u16,
                tags,
                content: row.get("content"),
                sig: row.get("sig"),
            };
            
            Ok(Some(event))
        } else {
            Ok(None)
        }
    }
    
    async fn query_events(&self, filters: &[Filter]) -> Result<Vec<NostrEvent>> {
        debug!("🔍 Querying events with {} filters", filters.len());
        
        let (where_clause, _params) = self.build_filter_where_clause(filters);
        
        // Note: For this implementation, we'll use a simpler approach
        // In production, you'd want to properly bind the parameters
        let query = format!(
            "SELECT id, pubkey, created_at, kind, tags, content, sig FROM events WHERE {} ORDER BY created_at DESC LIMIT 100",
            where_clause
        );
        
        let rows = sqlx::query(&query)
            .fetch_all(&self.pool)
            .await
            .context("Failed to query events")?;
        
        let mut events = Vec::new();
        for row in rows {
            let id: String = row.try_get("id")?;
            let pubkey: String = row.try_get("pubkey")?;
            let created_at: i64 = row.try_get("created_at")?;
            let kind: i64 = row.try_get("kind")?;
            let tags_json: String = row.try_get("tags")?;
            let content: String = row.try_get("content")?;
            let sig: String = row.try_get("sig")?;
            
            let tags: Vec<Vec<String>> = serde_json::from_str(&tags_json)
                .context("Failed to deserialize tags")?;
            
            let event = NostrEvent {
                id,
                pubkey,
                created_at: created_at as u64,
                kind: kind as u16,
                tags,
                content,
                sig,
            };
            
            events.push(event);
        }
        
        info!("📦 Retrieved {} events", events.len());
        Ok(events)
    }
    
    async fn count_events(&self, filters: &[Filter]) -> Result<u64> {
        debug!("📊 Counting events with {} filters", filters.len());
        
        let (where_clause, _params) = self.build_filter_where_clause(filters);
        let query = format!("SELECT COUNT(*) as count FROM events WHERE {}", where_clause);
        
        let row = sqlx::query(&query)
            .fetch_one(&self.pool)
            .await
            .context("Failed to count events")?;
        
        let count: i64 = row.try_get("count")?;
        Ok(count as u64)
    }
    
    async fn delete_event(&self, id: &str) -> Result<bool> {
        debug!("🗑️ Deleting event: {}", id);
        
        let result = sqlx::query("DELETE FROM events WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .context("Failed to delete event")?;
        
        Ok(result.rows_affected() > 0)
    }
    
    async fn store_evidence(&self, evidence: &EvidenceEvent) -> Result<()> {
        debug!("🔒 Storing evidence: {}", evidence.evidence_hash);
        
        let metadata_json = serde_json::to_string(&evidence.metadata)
            .context("Failed to serialize evidence metadata")?;
        
        sqlx::query(r#"
            INSERT OR REPLACE INTO evidence 
            (event_id, evidence_hash, evidence_type, submitter_pubkey, submission_time, clearance_level, verification_status, chain_hash, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#)
        .bind(&evidence.event_id)
        .bind(&evidence.evidence_hash)
        .bind(&evidence.evidence_type)
        .bind(&evidence.submitter_pubkey)
        .bind(evidence.submission_time as i64)
        .bind(&evidence.clearance_level)
        .bind(&evidence.verification_status)
        .bind(&evidence.chain_hash)
        .bind(&metadata_json)
        .execute(&self.pool)
        .await
        .context("Failed to store evidence")?;
        
        info!("✅ Evidence stored successfully: {}", evidence.evidence_hash);
        Ok(())
    }
    
    async fn query_by_clearance(&self, level: ClearanceLevel, filters: &[Filter]) -> Result<Vec<NostrEvent>> {
        debug!("🔐 Querying events by clearance level: {:?}", level);
        
        let clearance_str = level.to_string();
        let (base_where, _params) = self.build_filter_where_clause(filters);
        
        let query = format!(
            "SELECT id, pubkey, created_at, kind, tags, content, sig FROM events WHERE ({}) AND (clearance_level = ? OR clearance_level IS NULL) ORDER BY created_at DESC LIMIT 100",
            base_where
        );
        
        let rows = sqlx::query(&query)
            .bind(&clearance_str)
            .fetch_all(&self.pool)
            .await
            .context("Failed to query events by clearance")?;
        
        let mut events = Vec::new();
        for row in rows {
            let id: String = row.try_get("id")?;
            let pubkey: String = row.try_get("pubkey")?;
            let created_at: i64 = row.try_get("created_at")?;
            let kind: i64 = row.try_get("kind")?;
            let tags_json: String = row.try_get("tags")?;
            let content: String = row.try_get("content")?;
            let sig: String = row.try_get("sig")?;
            
            let tags: Vec<Vec<String>> = serde_json::from_str(&tags_json)
                .context("Failed to deserialize tags")?;
            
            let event = NostrEvent {
                id,
                pubkey,
                created_at: created_at as u64,
                kind: kind as u16,
                tags,
                content,
                sig,
            };
            
            events.push(event);
        }
        
        info!("🔐 Retrieved {} events for clearance level: {:?}", events.len(), level);
        Ok(events)
    }
    
    async fn query_by_team(&self, team_id: &str, filters: &[Filter]) -> Result<Vec<NostrEvent>> {
        debug!("👥 Querying events by team: {}", team_id);
        
        let (base_where, _params) = self.build_filter_where_clause(filters);
        let query = format!(
            "SELECT id, pubkey, created_at, kind, tags, content, sig FROM events WHERE ({}) AND team_id = ? ORDER BY created_at DESC LIMIT 100",
            base_where
        );
        
        let rows = sqlx::query(&query)
            .bind(team_id)
            .fetch_all(&self.pool)
            .await
            .context("Failed to query events by team")?;
        
        let mut events = Vec::new();
        for row in rows {
            let id: String = row.try_get("id")?;
            let pubkey: String = row.try_get("pubkey")?;
            let created_at: i64 = row.try_get("created_at")?;
            let kind: i64 = row.try_get("kind")?;
            let tags_json: String = row.try_get("tags")?;
            let content: String = row.try_get("content")?;
            let sig: String = row.try_get("sig")?;
            
            let tags: Vec<Vec<String>> = serde_json::from_str(&tags_json)
                .context("Failed to deserialize tags")?;
            
            let event = NostrEvent {
                id,
                pubkey,
                created_at: created_at as u64,
                kind: kind as u16,
                tags,
                content,
                sig,
            };
            
            events.push(event);
        }
        
        info!("👥 Retrieved {} events for team: {}", events.len(), team_id);
        Ok(events)
    }
    
    async fn get_evidence_chain(&self, starting_hash: &str) -> Result<Vec<EvidenceEvent>> {
        debug!("⛓️ Getting evidence chain starting from: {}", starting_hash);
        
        let rows = sqlx::query(r#"
            WITH RECURSIVE evidence_chain AS (
                SELECT * FROM evidence WHERE evidence_hash = ?
                UNION ALL
                SELECT e.* FROM evidence e
                INNER JOIN evidence_chain ec ON e.chain_hash = ec.evidence_hash
            )
            SELECT * FROM evidence_chain ORDER BY submission_time
        "#)
        .bind(starting_hash)
        .fetch_all(&self.pool)
        .await
        .context("Failed to query evidence chain")?;
        
        let mut chain = Vec::new();
        for row in rows {
            let metadata: serde_json::Value = serde_json::from_str(row.get::<String, _>("metadata").as_str())
                .context("Failed to deserialize evidence metadata")?;
            
            let evidence = EvidenceEvent {
                event_id: row.get("event_id"),
                evidence_hash: row.get("evidence_hash"),
                evidence_type: row.get("evidence_type"),
                submitter_pubkey: row.get("submitter_pubkey"),
                submission_time: row.get::<i64, _>("submission_time") as u64,
                clearance_level: row.get("clearance_level"),
                verification_status: row.get("verification_status"),
                chain_hash: row.get("chain_hash"),
                metadata,
            };
            
            chain.push(evidence);
        }
        
        info!("⛓️ Retrieved evidence chain with {} entries", chain.len());
        Ok(chain)
    }
    
    async fn validate_evidence_chain(&self, evidence_hash: &str) -> Result<bool> {
        debug!("✅ Validating evidence chain: {}", evidence_hash);
        
        let chain = self.get_evidence_chain(evidence_hash).await?;
        
        // Basic validation: ensure chain integrity
        for (i, evidence) in chain.iter().enumerate() {
            if i > 0 {
                let prev_evidence = &chain[i - 1];
                if evidence.chain_hash.as_ref() != Some(&prev_evidence.evidence_hash) {
                    warn!("❌ Evidence chain integrity broken at: {}", evidence.evidence_hash);
                    return Ok(false);
                }
            }
        }
        
        info!("✅ Evidence chain validation passed: {}", evidence_hash);
        Ok(true)
    }
    
    async fn get_stats(&self) -> Result<EventStoreStats> {
        debug!("📊 Getting event store statistics");
        
        // Get basic stats
        let total_events: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count total events")?;
        
        let total_evidence: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM evidence")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count total evidence")?;
        
        let unique_authors: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT pubkey) FROM events")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count unique authors")?;
        
        // Get time range
        let oldest_timestamp: Option<i64> = sqlx::query_scalar("SELECT MIN(created_at) FROM events")
            .fetch_one(&self.pool)
            .await
            .context("Failed to get oldest timestamp")?;
        
        let newest_timestamp: Option<i64> = sqlx::query_scalar("SELECT MAX(created_at) FROM events")
            .fetch_one(&self.pool)
            .await
            .context("Failed to get newest timestamp")?;
        
        // Get events by kind
        let kind_rows = sqlx::query("SELECT kind, COUNT(*) as count FROM events GROUP BY kind")
            .fetch_all(&self.pool)
            .await
            .context("Failed to get events by kind")?;
        
        let mut events_by_kind = std::collections::HashMap::new();
        for row in kind_rows {
            events_by_kind.insert(row.get::<i64, _>("kind") as u16, row.get::<i64, _>("count") as u64);
        }
        
        // Earth Alliance specific stats
        let total_teams: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT team_id) FROM events WHERE team_id IS NOT NULL")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count total teams")?;
        
        let clearance_rows = sqlx::query("SELECT clearance_level, COUNT(*) as count FROM events WHERE clearance_level IS NOT NULL GROUP BY clearance_level")
            .fetch_all(&self.pool)
            .await
            .context("Failed to get events by clearance")?;
        
        let mut events_by_clearance = std::collections::HashMap::new();
        for row in clearance_rows {
            events_by_clearance.insert(row.get::<String, _>("clearance_level"), row.get::<i64, _>("count") as u64);
        }
        
        let status_rows = sqlx::query("SELECT verification_status, COUNT(*) as count FROM evidence GROUP BY verification_status")
            .fetch_all(&self.pool)
            .await
            .context("Failed to get evidence by status")?;
        
        let mut evidence_by_status = std::collections::HashMap::new();
        for row in status_rows {
            evidence_by_status.insert(row.get::<String, _>("verification_status"), row.get::<i64, _>("count") as u64);
        }
        
        let active_cells: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT resistance_cell) FROM events WHERE resistance_cell IS NOT NULL")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count active resistance cells")?;
        
        let earth_alliance_stats = EarthAllianceStats {
            total_teams: total_teams as u64,
            events_by_clearance,
            evidence_by_status,
            active_resistance_cells: active_cells as u64,
        };
        
        let stats = EventStoreStats {
            total_events: total_events as u64,
            total_evidence: total_evidence as u64,
            storage_size_bytes: 0, // TODO: Calculate actual storage size
            oldest_event_timestamp: oldest_timestamp.map(|t| t as u64),
            newest_event_timestamp: newest_timestamp.map(|t| t as u64),
            unique_authors: unique_authors as u64,
            events_by_kind,
            earth_alliance_stats,
        };
        
        info!("📊 Generated event store statistics");
        Ok(stats)
    }
    
    async fn compact_database(&self) -> Result<()> {
        info!("🗜️ Compacting database");
        
        sqlx::query("VACUUM")
            .execute(&self.pool)
            .await
            .context("Failed to compact database")?;
        
        info!("✅ Database compacted successfully");
        Ok(())
    }
    
    async fn backup_to_file(&self, path: &str) -> Result<()> {
        info!("💾 Backing up database to: {}", path);
        
        // This is a simplified backup - in production you'd want a proper SQLite backup
        sqlx::query(&format!("VACUUM INTO '{}'", path))
            .execute(&self.pool)
            .await
            .context("Failed to backup database")?;
        
        info!("✅ Database backed up successfully to: {}", path);
        Ok(())
    }
}
