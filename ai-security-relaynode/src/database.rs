// Database initialization and migration management
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePool, Sqlite, Row};
use std::path::Path;
use tracing::{info, error, warn};
use anyhow::Result;

pub struct DatabaseManager {
    pool: SqlitePool,
}

impl DatabaseManager {
    pub async fn new(database_url: &str) -> Result<Self> {
        // Create database if it doesn't exist
        if !Sqlite::database_exists(database_url).await.unwrap_or(false) {
            info!("Creating database: {}", database_url);
            Sqlite::create_database(database_url).await?;
        }

        // Connect to database
        let pool = SqlitePool::connect(database_url).await?;
        
        Ok(Self { pool })
    }

    pub async fn run_migrations(&self) -> Result<()> {
        info!("Running database migrations...");
        
        // Read the migration file
        let migration_content = include_str!("migrations/add_investigation_tables_simple.sql");
        
        // Process the content line by line, removing comments
        let mut clean_lines = Vec::new();
        for line in migration_content.lines() {
            let line = line.trim();
            if !line.is_empty() && !line.starts_with("--") {
                // Remove inline comments (everything after --)
                if let Some(comment_pos) = line.find("--") {
                    let clean_line = line[..comment_pos].trim();
                    if !clean_line.is_empty() {
                        clean_lines.push(clean_line);
                    }
                } else {
                    clean_lines.push(line);
                }
            }
        }
        
        // Join lines and split by semicolon to get complete statements
        let clean_content = clean_lines.join(" ");
        let statements: Vec<&str> = clean_content
            .split(';')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .collect();

        for (i, statement) in statements.iter().enumerate() {
            if !statement.is_empty() {
                info!("Executing migration statement {}", i + 1);
                match sqlx::query(statement).execute(&self.pool).await {
                    Ok(_) => {
                        info!("✅ Migration statement {} executed successfully", i + 1);
                    }
                    Err(e) => {
                        // Check if it's a "table already exists" error - that's OK
                        let error_msg = e.to_string();
                        if error_msg.contains("already exists") || error_msg.contains("duplicate column") {
                            warn!("Migration statement {} skipped (already applied): {}", i + 1, error_msg);
                        } else {
                            error!("Migration error on statement {}: {}", i + 1, e);
                            error!("Failed statement: {}", statement);
                            return Err(anyhow::anyhow!("Migration failed: {}", e));
                        }
                    }
                }
            }
        }
        
        info!("✅ Database migrations completed");
        Ok(())
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub async fn health_check(&self) -> Result<bool> {
        match sqlx::query("SELECT 1").fetch_one(&self.pool).await {
            Ok(_) => Ok(true),
            Err(e) => {
                error!("Database health check failed: {}", e);
                Ok(false)
            }
        }
    }

    pub async fn get_investigation_count(&self) -> Result<i64> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM investigations")
            .fetch_one(&self.pool)
            .await?;
        
        let count: i64 = row.get("count");
        Ok(count)
    }
}
