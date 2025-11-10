-- ============================================================================
-- ClaudeUI Project Workspace Management - Database Migration
-- Version: 1.0.0
-- Date: 2025-11-10
-- Description: Add project-aware workspace management to ClaudeUI
-- ============================================================================

-- ============================================================================
-- PART 1: Create Projects Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT UNIQUE NOT NULL,  -- Absolute path to project directory
  description TEXT,            -- Optional user-provided description
  color TEXT DEFAULT '#6366f1', -- Hex color for UI badge (default indigo)
  tags TEXT,                   -- JSON array of tags, e.g., '["web","typescript","react"]'
  is_favorite BOOLEAN DEFAULT 0, -- Star/favorite flag for quick access
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP, -- Last time project was selected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  api_config_id INTEGER,       -- Reference to API configuration (nullable for global default)
  settings TEXT,               -- JSON object for project-specific settings
                               -- e.g., '{"default_model":"claude-sonnet-4-5-20250929"}'
  metadata TEXT,               -- JSON object for auto-detected metadata
                               -- e.g., '{"git_repo_url":"https://github.com/user/repo","language":"TypeScript","framework":"React"}'
  FOREIGN KEY (api_config_id) REFERENCES api_configurations(id) ON DELETE SET NULL
);

-- Index for faster lookups by path
CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path);

-- Index for last_accessed sorting (frequent operation)
CREATE INDEX IF NOT EXISTS idx_projects_last_accessed ON projects(last_accessed DESC);

-- Index for favorites
CREATE INDEX IF NOT EXISTS idx_projects_favorite ON projects(is_favorite) WHERE is_favorite = 1;

-- Index for API config lookups
CREATE INDEX IF NOT EXISTS idx_projects_api_config ON projects(api_config_id);

-- ============================================================================
-- PART 2: Create Context Presets Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS context_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,                -- User-friendly name, e.g., "Frontend Only"
  description TEXT,                  -- Optional description of what this preset includes
  file_patterns TEXT,                -- JSON array of glob patterns, e.g., '["src/**/*.ts","lib/**/*.js"]'
  exclude_patterns TEXT,             -- JSON array of exclusion patterns, e.g., '["**/*.test.ts","node_modules/**"]'
  explicit_files TEXT,               -- JSON array of specific file paths, e.g., '["/src/main.ts","/config.json"]'
  is_default BOOLEAN DEFAULT 0,      -- If true, auto-applies when starting conversation in this project
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, name)  -- Prevent duplicate preset names within same project
);

-- Index for fetching presets by project (very common query)
CREATE INDEX IF NOT EXISTS idx_presets_project ON context_presets(project_id);

-- Index for finding default preset quickly
CREATE INDEX IF NOT EXISTS idx_presets_default ON context_presets(project_id, is_default) WHERE is_default = 1;

-- ============================================================================
-- PART 3: Create API Configurations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,           -- User-friendly name: "Production", "Bedrock Dev", "Azure Test"
  provider TEXT NOT NULL,              -- "anthropic", "bedrock", "azure", "custom"
  api_url TEXT NOT NULL,               -- Base URL for API calls
  api_key_source TEXT NOT NULL,        -- "inline", "env", "file"
  api_key_value TEXT,                  -- Encrypted key if inline, env var name if env, path if file
  auth_type TEXT DEFAULT 'bearer',     -- "bearer", "aws_sig_v4", "azure_ad", "custom"
  region TEXT,                         -- AWS region for Bedrock (e.g., "us-east-1")
  models TEXT,                         -- JSON array of available models (cached)
  model_refresh_strategy TEXT DEFAULT 'manual', -- "manual", "on_start", "periodic"
  connection_timeout INTEGER DEFAULT 30000,     -- Timeout in ms
  max_retries INTEGER DEFAULT 3,
  extra_headers TEXT,                  -- JSON object of additional HTTP headers
  is_active BOOLEAN DEFAULT 1,         -- Enable/disable without deleting
  is_default BOOLEAN DEFAULT 0,        -- Default config for new projects
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick default lookup
CREATE INDEX IF NOT EXISTS idx_api_configs_default ON api_configurations(is_default) WHERE is_default = 1;

-- Index for active configs
CREATE INDEX IF NOT EXISTS idx_api_configs_active ON api_configurations(is_active) WHERE is_active = 1;

-- Create default Anthropic Direct configuration
INSERT INTO api_configurations (
  name,
  provider,
  api_url,
  api_key_source,
  api_key_value,
  auth_type,
  models,
  is_default,
  is_active
) VALUES (
  'Anthropic Direct (Default)',
  'anthropic',
  'https://api.anthropic.com',
  'env',
  'ANTHROPIC_API_KEY',
  'bearer',
  '["claude-opus-4-20250514","claude-sonnet-4-5-20250929","claude-sonnet-4-20250514","claude-haiku-4-20250514","claude-3-5-haiku-20241022"]',
  1,
  1
) ON CONFLICT(name) DO NOTHING;

-- Store default API config ID in settings
INSERT INTO settings (key, value)
SELECT 'DEFAULT_API_CONFIG_ID', id FROM api_configurations WHERE name = 'Anthropic Direct (Default)'
ON CONFLICT(key) DO UPDATE SET value = (SELECT id FROM api_configurations WHERE name = 'Anthropic Direct (Default)');

-- ============================================================================
-- PART 4: Modify Existing Conversations Table
-- ============================================================================

-- Add project_id column to conversations to link conversations to projects
-- This column is nullable to maintain backward compatibility with existing conversations
ALTER TABLE conversations ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Index for filtering conversations by project (will be very common)
CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id);

-- ============================================================================
-- PART 4: Data Migration - Create Default Project for Existing Users
-- ============================================================================

-- Note: This will be handled programmatically in the Node.js server on startup
-- The following is pseudo-SQL for documentation purposes:

/*
-- On server startup, check if any projects exist
IF (SELECT COUNT(*) FROM projects) = 0 THEN
  -- Get current CLI_ROOT setting
  SET @current_root = (SELECT value FROM settings WHERE key = 'CLI_ROOT');

  -- Create default project
  INSERT INTO projects (name, path, description, color, tags, is_favorite, settings)
  VALUES (
    'Default Project',
    @current_root,
    'Auto-created default project for existing conversations',
    '#6366f1',
    '["default"]',
    1,
    '{}'
  );

  -- Get the newly created project ID
  SET @default_project_id = LAST_INSERT_ID();

  -- Link all existing conversations to default project
  UPDATE conversations
  SET project_id = @default_project_id
  WHERE project_id IS NULL;
END IF;
*/

-- ============================================================================
-- PART 5: Sample Data (for development/testing)
-- ============================================================================

-- Sample Project 1: Web Application
-- INSERT INTO projects (name, path, description, color, tags, is_favorite, settings, metadata)
-- VALUES (
--   'ClaudeUI',
--   'C:\Users\jschaab\source\repos\GitHub\ClaudeUI',
--   'Local web-based chat interface for Claude CLI',
--   '#ec4899',
--   '["web","typescript","react","node"]',
--   1,
--   '{"default_model":"claude-sonnet-4-5-20250929"}',
--   '{"git_repo_url":"https://github.com/user/ClaudeUI","language":"TypeScript","framework":"React+Vite"}'
-- );

-- Sample Context Preset 1: Full Stack
-- INSERT INTO context_presets (project_id, name, description, file_patterns, exclude_patterns, explicit_files, is_default)
-- VALUES (
--   1,
--   'Full Stack',
--   'Includes both frontend and backend code',
--   '["claude-ui/src/**/*.tsx","claude-ui/src/**/*.ts","claude-ui/server/**/*.js"]',
--   '["**/*.test.ts","**/*.test.tsx","node_modules/**","dist/**","build/**"]',
--   '["claude-ui/package.json","claude-ui/server/package.json"]',
--   1
-- );

-- Sample Context Preset 2: Frontend Only
-- INSERT INTO context_presets (project_id, name, description, file_patterns, exclude_patterns, explicit_files, is_default)
-- VALUES (
--   1,
--   'Frontend Only',
--   'React components and frontend code',
--   '["claude-ui/src/**/*.tsx","claude-ui/src/**/*.css"]',
--   '["**/*.test.tsx","node_modules/**"]',
--   '["claude-ui/package.json","claude-ui/vite.config.ts"]',
--   0
-- );

-- Sample Context Preset 3: Backend Only
-- INSERT INTO context_presets (project_id, name, description, file_patterns, exclude_patterns, explicit_files, is_default)
-- VALUES (
--   1,
--   'Backend Only',
--   'Server-side code and APIs',
--   '["claude-ui/server/**/*.js"]',
--   '["node_modules/**"]',
--   '["claude-ui/server/package.json"]',
--   0
-- );

-- ============================================================================
-- PART 6: Utility Queries (for development)
-- ============================================================================

-- Get all projects with their conversation counts
-- SELECT
--   p.id,
--   p.name,
--   p.path,
--   p.color,
--   p.is_favorite,
--   p.last_accessed,
--   COUNT(c.id) as conversation_count
-- FROM projects p
-- LEFT JOIN conversations c ON p.id = c.project_id
-- GROUP BY p.id
-- ORDER BY p.last_accessed DESC;

-- Get all context presets for a specific project
-- SELECT * FROM context_presets WHERE project_id = 1 ORDER BY name;

-- Get all conversations for a specific project
-- SELECT
--   c.id,
--   c.title,
--   c.created_at,
--   c.updated_at,
--   p.name as project_name,
--   p.color as project_color
-- FROM conversations c
-- LEFT JOIN projects p ON c.project_id = p.id
-- WHERE c.project_id = 1
-- ORDER BY c.updated_at DESC;

-- Find conversations without a project (legacy/orphaned)
-- SELECT * FROM conversations WHERE project_id IS NULL;

-- Get all unique tags across all projects
-- SELECT DISTINCT json_each.value as tag
-- FROM projects, json_each(projects.tags)
-- ORDER BY tag;

-- ============================================================================
-- PART 7: Rollback Instructions (if needed)
-- ============================================================================

-- WARNING: These commands will delete all project data!
-- Use only if you need to completely remove the project feature.

-- DROP INDEX IF EXISTS idx_conversations_project;
-- ALTER TABLE conversations DROP COLUMN project_id;  -- Note: SQLite doesn't support DROP COLUMN directly
-- DROP TABLE IF EXISTS context_presets;
-- DROP TABLE IF EXISTS projects;

-- For SQLite, to remove a column, you need to recreate the table:
/*
-- Backup conversations
CREATE TABLE conversations_backup AS SELECT
  id, created_at, updated_at, title, hidden, selected_files, cli_session_id, model
FROM conversations;

-- Drop original table
DROP TABLE conversations;

-- Recreate without project_id
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  title TEXT,
  hidden BOOLEAN DEFAULT 0,
  selected_files TEXT,
  cli_session_id TEXT,
  model TEXT
);

-- Restore data
INSERT INTO conversations SELECT * FROM conversations_backup;

-- Drop backup
DROP TABLE conversations_backup;
*/

-- ============================================================================
-- End of Migration Script
-- ============================================================================
