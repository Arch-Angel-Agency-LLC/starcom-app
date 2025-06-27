-- Investigation Management Database Schema - Simplified
-- Add investigation management tables to existing SQLite database

-- Core investigations table
CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Completed', 'Archived')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    lead_investigator TEXT,
    metadata TEXT
);

-- Investigation tasks table
CREATE TABLE IF NOT EXISTS investigation_tasks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    investigation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'InProgress', 'Review', 'Completed')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    metadata TEXT,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
);

-- Evidence items table
CREATE TABLE IF NOT EXISTS evidence_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    investigation_id TEXT NOT NULL,
    task_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    content TEXT NOT NULL,
    hash TEXT,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES investigation_tasks(id) ON DELETE SET NULL
);

-- Activity log table
CREATE TABLE IF NOT EXISTS investigation_activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    investigation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
);

-- Team collaboration and presence
CREATE TABLE IF NOT EXISTS investigation_collaborators (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    investigation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('lead', 'analyst', 'observer')),
    permissions TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    UNIQUE(investigation_id, user_id)
);

-- User presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
    user_id TEXT PRIMARY KEY,
    investigation_id TEXT,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_location TEXT,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_priority ON investigations(priority);
CREATE INDEX IF NOT EXISTS idx_investigations_created_by ON investigations(created_by);
CREATE INDEX IF NOT EXISTS idx_investigations_lead ON investigations(lead_investigator);

CREATE INDEX IF NOT EXISTS idx_tasks_investigation ON investigation_tasks(investigation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON investigation_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON investigation_tasks(status);

CREATE INDEX IF NOT EXISTS idx_evidence_investigation ON evidence_items(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_task ON evidence_items(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence_items(type);

CREATE INDEX IF NOT EXISTS idx_activities_investigation ON investigation_activities(investigation_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON investigation_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON investigation_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_collaborators_investigation ON investigation_collaborators(investigation_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON investigation_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_presence_user ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_investigation ON user_presence(investigation_id);
