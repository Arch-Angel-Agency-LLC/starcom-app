-- Investigation Management Database Schema
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
    metadata TEXT -- JSON metadata including custom fields
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
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
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
    FOREIGN KEY (task_id) REFERENCES investigation_tasks(id) ON DELETE SET NULL
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    investigation_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'investigator' CHECK (role IN ('lead', 'investigator', 'analyst', 'specialist', 'observer')),
    permissions TEXT, -- JSON array of permissions
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
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
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
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
