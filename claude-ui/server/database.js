const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

// Initialize database
const dbPath = path.join(__dirname, 'claude-cli.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    title TEXT,
    hidden BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_creation_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    total_cost_usd REAL DEFAULT 0,
    model_usage TEXT,
    duration_ms INTEGER DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS cli_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER,
    message_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_message TEXT NOT NULL,
    cli_command TEXT NOT NULL,
    cli_args TEXT,
    execution_path TEXT NOT NULL,
    response TEXT,
    error TEXT,
    exit_code INTEGER,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (message_id) REFERENCES messages(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    prompt_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS api_configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL,
    api_url TEXT NOT NULL,
    api_key_source TEXT NOT NULL,
    api_key_value TEXT,
    auth_type TEXT DEFAULT 'bearer',
    region TEXT,
    models TEXT,
    model_refresh_strategy TEXT DEFAULT 'manual',
    connection_timeout INTEGER DEFAULT 30000,
    max_retries INTEGER DEFAULT 3,
    extra_headers TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    tags TEXT,
    is_favorite BOOLEAN DEFAULT 0,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    api_config_id INTEGER,
    settings TEXT,
    metadata TEXT,
    FOREIGN KEY (api_config_id) REFERENCES api_configurations(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS context_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_patterns TEXT,
    exclude_patterns TEXT,
    explicit_files TEXT,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, name)
  );
`);

// Migration: Add hidden column to conversations table if it doesn't exist
try {
  db.exec(`ALTER TABLE conversations ADD COLUMN hidden BOOLEAN DEFAULT 0`);
  console.log('Added hidden column to conversations table');
  // Update any NULL values to 0
  db.exec(`UPDATE conversations SET hidden = 0 WHERE hidden IS NULL`);
} catch (err) {
  // Column already exists or other error - ignore
  if (!err.message.includes('duplicate column')) {
    console.log('Hidden column migration: column may already exist');
    // Still try to update NULL values
    try {
      db.exec(`UPDATE conversations SET hidden = 0 WHERE hidden IS NULL`);
    } catch (updateErr) {
      // Ignore
    }
  }
}

// Migration: Add context_files and full_stdin columns to cli_calls table
try {
  db.exec(`ALTER TABLE cli_calls ADD COLUMN context_files TEXT`);
  console.log('Added context_files column to cli_calls table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('context_files column may already exist');
  }
}

try {
  db.exec(`ALTER TABLE cli_calls ADD COLUMN full_stdin TEXT`);
  console.log('Added full_stdin column to cli_calls table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('full_stdin column may already exist');
  }
}

// Migration: Add selected_files column to conversations table
try {
  db.exec(`ALTER TABLE conversations ADD COLUMN selected_files TEXT`);
  console.log('Added selected_files column to conversations table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('selected_files column may already exist');
  }
}

// Migration: Add model column to cli_calls table
try {
  db.exec(`ALTER TABLE cli_calls ADD COLUMN model TEXT`);
  console.log('Added model column to cli_calls table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('model column may already exist');
  }
}

// Migration: Add cli_session_id columns
try {
  db.exec(`ALTER TABLE conversations ADD COLUMN cli_session_id TEXT`);
  console.log('Added cli_session_id column to conversations table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('cli_session_id column may already exist in conversations');
  }
}

try {
  db.exec(`ALTER TABLE cli_calls ADD COLUMN cli_session_id TEXT`);
  console.log('Added cli_session_id column to cli_calls table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('cli_session_id column may already exist in cli_calls');
  }
}

// Migration: Add model column to conversations table
try {
  db.exec(`ALTER TABLE conversations ADD COLUMN model TEXT`);
  console.log('Added model column to conversations table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('model column may already exist');
  }
}

// Migration: Add model column to prompts table
try {
  db.exec(`ALTER TABLE prompts ADD COLUMN model TEXT`);
  console.log('Added model column to prompts table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('model column may already exist in prompts');
  }
}

// Migration: Add project_id column to conversations table
try {
  db.exec(`ALTER TABLE conversations ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL`);
  console.log('Added project_id column to conversations table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('project_id column may already exist in conversations');
  }
}

// Create indexes for new tables
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path);
    CREATE INDEX IF NOT EXISTS idx_projects_last_accessed ON projects(last_accessed DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_favorite ON projects(is_favorite) WHERE is_favorite = 1;
    CREATE INDEX IF NOT EXISTS idx_projects_api_config ON projects(api_config_id);
    CREATE INDEX IF NOT EXISTS idx_presets_project ON context_presets(project_id);
    CREATE INDEX IF NOT EXISTS idx_presets_default ON context_presets(project_id, is_default) WHERE is_default = 1;
    CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id);
    CREATE INDEX IF NOT EXISTS idx_api_configs_default ON api_configurations(is_default) WHERE is_default = 1;
    CREATE INDEX IF NOT EXISTS idx_api_configs_active ON api_configurations(is_active) WHERE is_active = 1;
  `);
  console.log('Created indexes for project workspace tables');
} catch (err) {
  console.log('Indexes may already exist:', err.message);
}

console.log('Database initialized at:', dbPath);

// Prepared statements for conversations
const insertConversation = db.prepare(`
  INSERT INTO conversations (title, selected_files, model, project_id) VALUES (?, ?, ?, ?)
`);

const updateConversation = db.prepare(`
  UPDATE conversations SET updated_at = CURRENT_TIMESTAMP, title = ?, selected_files = ?, model = ? WHERE id = ?
`);

const updateConversationSessionId = db.prepare(`
  UPDATE conversations SET cli_session_id = ? WHERE id = ?
`);

const getConversationById = db.prepare('SELECT * FROM conversations WHERE id = ?');
const getAllConversations = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC');
const getVisibleConversations = db.prepare('SELECT * FROM conversations WHERE hidden = 0 ORDER BY updated_at DESC');
const getConversationsByProject = db.prepare('SELECT * FROM conversations WHERE project_id = ? AND hidden = 0 ORDER BY updated_at DESC');
const getAllConversationsAcrossProjects = db.prepare('SELECT * FROM conversations WHERE hidden = 0 ORDER BY updated_at DESC');
const hideConversation = db.prepare('UPDATE conversations SET hidden = 1 WHERE id = ?');
const deleteConversation = db.prepare('DELETE FROM conversations WHERE id = ?');
const deleteMessagesByConversation = db.prepare('DELETE FROM messages WHERE conversation_id = ?');
const deleteCliCallsByConversation = db.prepare('DELETE FROM cli_calls WHERE conversation_id = ?');

// Prepared statements for messages
const insertMessage = db.prepare(`
  INSERT INTO messages (conversation_id, role, content, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_cost_usd, model_usage, duration_ms)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getMessagesByConversation = db.prepare(`
  SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC
`);

// Prepared statements for CLI calls
const insertCliCall = db.prepare(`
  INSERT INTO cli_calls (
    conversation_id,
    message_id,
    user_message,
    cli_command,
    cli_args,
    execution_path,
    response,
    error,
    exit_code,
    duration_ms,
    success,
    context_files,
    full_stdin,
    model,
    cli_session_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getAllCalls = db.prepare('SELECT * FROM cli_calls ORDER BY timestamp DESC');
const getCallById = db.prepare('SELECT * FROM cli_calls WHERE id = ?');
const getRecentCalls = db.prepare('SELECT * FROM cli_calls ORDER BY timestamp DESC LIMIT ?');

// Prepared statements for settings
const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
const upsertSetting = db.prepare(`
  INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
`);
const getAllSettings = db.prepare('SELECT * FROM settings');

// Prepared statements for prompts
const insertPrompt = db.prepare(`
  INSERT INTO prompts (name, description, prompt_text, model) VALUES (?, ?, ?, ?)
`);
const updatePrompt = db.prepare(`
  UPDATE prompts SET description = ?, prompt_text = ?, model = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
`);
const getPromptById = db.prepare('SELECT * FROM prompts WHERE id = ?');
const getPromptByName = db.prepare('SELECT * FROM prompts WHERE name = ?');
const getAllPrompts = db.prepare('SELECT * FROM prompts ORDER BY name ASC');
const deletePromptById = db.prepare('DELETE FROM prompts WHERE id = ?');

// ============================================================================
// API Key Encryption/Decryption Utilities
// ============================================================================

/**
 * Encrypts an API key using AES-256-CBC encryption
 * @param {string} plainKey - The plain text API key
 * @returns {string} - Encrypted key in format "encrypted:AES256:IV:CIPHERTEXT"
 */
function encryptApiKey(plainKey) {
  if (!plainKey) return null;

  // Get or generate encryption key (32 bytes for AES-256)
  let encryptionKey = process.env.API_ENCRYPTION_KEY;
  if (!encryptionKey) {
    // Generate a random key if not set (WARNING: this means keys won't decrypt after restart!)
    console.warn('API_ENCRYPTION_KEY not set in environment - generating temporary key');
    encryptionKey = crypto.randomBytes(32).toString('hex');
  }

  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(encryptionKey, 'hex').slice(0, 32); // Ensure 32 bytes
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `encrypted:AES256:${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted API key
 * @param {string} encryptedKey - Encrypted key from database
 * @returns {string} - Plain text API key
 */
function decryptApiKey(encryptedKey) {
  if (!encryptedKey || !encryptedKey.startsWith('encrypted:AES256:')) {
    throw new Error('Invalid encrypted key format');
  }

  const [, , ivHex, encryptedHex] = encryptedKey.split(':');

  let encryptionKey = process.env.API_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('API_ENCRYPTION_KEY not set - cannot decrypt');
  }

  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(encryptionKey, 'hex').slice(0, 32);
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Resolves an API key based on its storage strategy
 * @param {string} source - "inline", "env", or "file"
 * @param {string} value - The stored value (encrypted key, env var name, or file path)
 * @returns {string|null} - The resolved API key or null
 */
function resolveApiKey(source, value) {
  if (!source || !value) return null;

  try {
    if (source === 'inline') {
      return decryptApiKey(value);
    } else if (source === 'env') {
      return process.env[value] || null;
    } else if (source === 'file') {
      const fs = require('fs');
      return fs.readFileSync(value, 'utf8').trim();
    }
  } catch (err) {
    console.error(`Error resolving API key from ${source}:`, err.message);
    return null;
  }

  return null;
}

// ============================================================================
// Prepared Statements for API Configurations
// ============================================================================

const insertApiConfig = db.prepare(`
  INSERT INTO api_configurations (
    name, provider, api_url, api_key_source, api_key_value, auth_type,
    region, models, model_refresh_strategy, connection_timeout, max_retries,
    extra_headers, is_active, is_default
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateApiConfig = db.prepare(`
  UPDATE api_configurations
  SET name = ?, provider = ?, api_url = ?, api_key_source = ?, api_key_value = ?,
      auth_type = ?, region = ?, models = ?, model_refresh_strategy = ?,
      connection_timeout = ?, max_retries = ?, extra_headers = ?, is_active = ?,
      is_default = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const patchApiConfig = db.prepare(`
  UPDATE api_configurations
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const getApiConfigById = db.prepare('SELECT * FROM api_configurations WHERE id = ?');
const getApiConfigByName = db.prepare('SELECT * FROM api_configurations WHERE name = ?');
const getAllApiConfigs = db.prepare('SELECT * FROM api_configurations ORDER BY name ASC');
const getActiveApiConfigs = db.prepare('SELECT * FROM api_configurations WHERE is_active = 1 ORDER BY name ASC');
const getDefaultApiConfig = db.prepare('SELECT * FROM api_configurations WHERE is_default = 1 LIMIT 1');
const deleteApiConfigById = db.prepare('DELETE FROM api_configurations WHERE id = ?');

// ============================================================================
// Prepared Statements for Projects
// ============================================================================

const insertProject = db.prepare(`
  INSERT INTO projects (
    name, path, description, color, tags, is_favorite, api_config_id, settings, metadata
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateProject = db.prepare(`
  UPDATE projects
  SET name = ?, description = ?, color = ?, tags = ?, is_favorite = ?,
      api_config_id = ?, settings = ?, metadata = ?
  WHERE id = ?
`);

const patchProject = db.prepare(`
  UPDATE projects
  SET last_accessed = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const getProjectById = db.prepare('SELECT * FROM projects WHERE id = ?');
const getProjectByPath = db.prepare('SELECT * FROM projects WHERE path = ?');
const getAllProjects = db.prepare('SELECT * FROM projects ORDER BY last_accessed DESC');
const getFavoriteProjects = db.prepare('SELECT * FROM projects WHERE is_favorite = 1 ORDER BY name ASC');
const deleteProjectById = db.prepare('DELETE FROM projects WHERE id = ?');

// Get project with conversation count
const getProjectWithStats = db.prepare(`
  SELECT p.*, COUNT(c.id) as conversation_count
  FROM projects p
  LEFT JOIN conversations c ON p.id = c.project_id
  WHERE p.id = ?
  GROUP BY p.id
`);

// ============================================================================
// Prepared Statements for Context Presets
// ============================================================================

const insertContextPreset = db.prepare(`
  INSERT INTO context_presets (
    project_id, name, description, file_patterns, exclude_patterns,
    explicit_files, is_default
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const updateContextPreset = db.prepare(`
  UPDATE context_presets
  SET name = ?, description = ?, file_patterns = ?, exclude_patterns = ?,
      explicit_files = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const getContextPresetById = db.prepare('SELECT * FROM context_presets WHERE id = ?');
const getContextPresetsByProject = db.prepare('SELECT * FROM context_presets WHERE project_id = ? ORDER BY name ASC');
const getDefaultPresetForProject = db.prepare('SELECT * FROM context_presets WHERE project_id = ? AND is_default = 1 LIMIT 1');
const deleteContextPresetById = db.prepare('DELETE FROM context_presets WHERE id = ?');

// Conversation functions
function createConversation(title = 'Untitled', selectedFiles = null, model = null, projectId = null) {
  try {
    const filesJson = selectedFiles ? JSON.stringify(selectedFiles) : null;
    const result = insertConversation.run(title, filesJson, model, projectId);
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Error creating conversation:', err);
    throw err;
  }
}

function updateConversationTitle(id, title, selectedFiles = null, model = null) {
  try {
    const filesJson = selectedFiles ? JSON.stringify(selectedFiles) : null;
    return updateConversation.run(title, filesJson, model, id);
  } catch (err) {
    console.error('Error updating conversation:', err);
    throw err;
  }
}

function setConversationSessionId(conversationId, sessionId) {
  try {
    return updateConversationSessionId.run(sessionId, conversationId);
  } catch (err) {
    console.error('Error updating conversation session ID:', err);
    throw err;
  }
}

function getConversation(id) {
  try {
    return getConversationById.get(id);
  } catch (err) {
    console.error('Error getting conversation:', err);
    throw err;
  }
}

function getConversations() {
  try {
    return getAllConversations.all();
  } catch (err) {
    console.error('Error getting conversations:', err);
    throw err;
  }
}

function getVisibleConversationsOnly(projectId = null) {
  try {
    if (projectId !== null) {
      return getConversationsByProject.all(projectId);
    }
    return getVisibleConversations.all();
  } catch (err) {
    console.error('Error getting visible conversations:', err);
    throw err;
  }
}

function getConversationsForProject(projectId) {
  try {
    return getConversationsByProject.all(projectId);
  } catch (err) {
    console.error('Error getting conversations for project:', err);
    throw err;
  }
}

function getAllConversationsAcrossAllProjects() {
  try {
    return getAllConversationsAcrossProjects.all();
  } catch (err) {
    console.error('Error getting all conversations across projects:', err);
    throw err;
  }
}

function markConversationHidden(id) {
  try {
    return hideConversation.run(id);
  } catch (err) {
    console.error('Error hiding conversation:', err);
    throw err;
  }
}

function permanentlyDeleteConversation(id) {
  try {
    // Delete in order: cli_calls, messages, then conversation
    deleteCliCallsByConversation.run(id);
    deleteMessagesByConversation.run(id);
    return deleteConversation.run(id);
  } catch (err) {
    console.error('Error deleting conversation:', err);
    throw err;
  }
}

// Message functions
function saveMessage(conversationId, role, content, tokenData = {}) {
  try {
    const {
      inputTokens = 0,
      outputTokens = 0,
      cacheCreationTokens = 0,
      cacheReadTokens = 0,
      totalCostUsd = 0,
      modelUsage = null,
      durationMs = 0
    } = tokenData;

    const result = insertMessage.run(
      conversationId,
      role,
      content,
      inputTokens,
      outputTokens,
      cacheCreationTokens,
      cacheReadTokens,
      totalCostUsd,
      modelUsage ? JSON.stringify(modelUsage) : null,
      durationMs
    );
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Error saving message:', err);
    throw err;
  }
}

function getMessages(conversationId) {
  try {
    return getMessagesByConversation.all(conversationId);
  } catch (err) {
    console.error('Error getting messages:', err);
    throw err;
  }
}

// CLI call functions
function logCliCall(data) {
  try {
    const result = insertCliCall.run(
      data.conversationId || null,
      data.messageId || null,
      data.userMessage,
      data.cliCommand,
      data.cliArgs || '',
      data.executionPath,
      data.response || '',
      data.error || '',
      data.exitCode || null,
      data.durationMs || null,
      data.success ? 1 : 0,
      data.contextFiles ? JSON.stringify(data.contextFiles) : null,
      data.fullStdin || null,
      data.model || null,
      data.cliSessionId || null
    );
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Error logging CLI call:', err);
    throw err;
  }
}

function getAllCliCalls() {
  try {
    return getAllCalls.all();
  } catch (err) {
    console.error('Error getting CLI calls:', err);
    throw err;
  }
}

function getCliCallById(id) {
  try {
    return getCallById.get(id);
  } catch (err) {
    console.error('Error getting CLI call by ID:', err);
    throw err;
  }
}

function getRecentCliCalls(limit = 100) {
  try {
    return getRecentCalls.all(limit);
  } catch (err) {
    console.error('Error getting recent CLI calls:', err);
    throw err;
  }
}

// Settings functions
function getSettingValue(key, defaultValue = null) {
  try {
    const result = getSetting.get(key);
    return result ? result.value : defaultValue;
  } catch (err) {
    console.error('Error getting setting:', err);
    throw err;
  }
}

function setSetting(key, value) {
  try {
    upsertSetting.run(key, value);
  } catch (err) {
    console.error('Error setting value:', err);
    throw err;
  }
}

function getSettings() {
  try {
    return getAllSettings.all();
  } catch (err) {
    console.error('Error getting all settings:', err);
    throw err;
  }
}

// ============================================================================
// API Configuration Functions
// ============================================================================

function createApiConfig(data) {
  try {
    // Encrypt inline API keys
    let apiKeyValue = data.apiKeyValue;
    if (data.apiKeySource === 'inline' && apiKeyValue && !apiKeyValue.startsWith('encrypted:')) {
      apiKeyValue = encryptApiKey(apiKeyValue);
    }

    const result = insertApiConfig.run(
      data.name,
      data.provider,
      data.apiUrl,
      data.apiKeySource,
      apiKeyValue,
      data.authType || 'bearer',
      data.region || null,
      data.models ? JSON.stringify(data.models) : null,
      data.modelRefreshStrategy || 'manual',
      data.connectionTimeout || 30000,
      data.maxRetries || 3,
      data.extraHeaders ? JSON.stringify(data.extraHeaders) : null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      data.isDefault !== undefined ? (data.isDefault ? 1 : 0) : 0
    );
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Error creating API configuration:', err);
    throw err;
  }
}

function updateApiConfigById(id, data) {
  try {
    // Encrypt inline API keys
    let apiKeyValue = data.apiKeyValue;
    if (data.apiKeySource === 'inline' && apiKeyValue && !apiKeyValue.startsWith('encrypted:')) {
      apiKeyValue = encryptApiKey(apiKeyValue);
    }

    return updateApiConfig.run(
      data.name,
      data.provider,
      data.apiUrl,
      data.apiKeySource,
      apiKeyValue,
      data.authType || 'bearer',
      data.region || null,
      data.models ? JSON.stringify(data.models) : null,
      data.modelRefreshStrategy || 'manual',
      data.connectionTimeout || 30000,
      data.maxRetries || 3,
      data.extraHeaders ? JSON.stringify(data.extraHeaders) : null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      data.isDefault !== undefined ? (data.isDefault ? 1 : 0) : 0,
      id
    );
  } catch (err) {
    console.error('Error updating API configuration:', err);
    throw err;
  }
}

function getApiConfig(id) {
  try {
    return getApiConfigById.get(id);
  } catch (err) {
    console.error('Error getting API configuration:', err);
    throw err;
  }
}

function getApiConfigByNameValue(name) {
  try {
    return getApiConfigByName.get(name);
  } catch (err) {
    console.error('Error getting API configuration by name:', err);
    throw err;
  }
}

function getApiConfigs(activeOnly = false) {
  try {
    return activeOnly ? getActiveApiConfigs.all() : getAllApiConfigs.all();
  } catch (err) {
    console.error('Error getting API configurations:', err);
    throw err;
  }
}

function getDefaultApiConfigValue() {
  try {
    return getDefaultApiConfig.get();
  } catch (err) {
    console.error('Error getting default API configuration:', err);
    throw err;
  }
}

function deleteApiConfig(id) {
  try {
    return deleteApiConfigById.run(id);
  } catch (err) {
    console.error('Error deleting API configuration:', err);
    throw err;
  }
}

// ============================================================================
// Project Functions
// ============================================================================

function createProject(data) {
  try {
    const result = insertProject.run(
      data.name,
      data.path,
      data.description || null,
      data.color || '#6366f1',
      data.tags ? JSON.stringify(data.tags) : null,
      data.isFavorite ? 1 : 0,
      data.apiConfigId || null,
      data.settings ? JSON.stringify(data.settings) : null,
      data.metadata ? JSON.stringify(data.metadata) : null
    );
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Error creating project:', err);
    throw err;
  }
}

function updateProjectById(id, data) {
  try {
    return updateProject.run(
      data.name,
      data.description || null,
      data.color || '#6366f1',
      data.tags ? JSON.stringify(data.tags) : null,
      data.isFavorite !== undefined ? (data.isFavorite ? 1 : 0) : 0,
      data.apiConfigId || null,
      data.settings ? JSON.stringify(data.settings) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      id
    );
  } catch (err) {
    console.error('Error updating project:', err);
    throw err;
  }
}

function updateProjectAccess(id) {
  try {
    return patchProject.run(id);
  } catch (err) {
    console.error('Error updating project access time:', err);
    throw err;
  }
}

function getProject(id) {
  try {
    return getProjectById.get(id);
  } catch (err) {
    console.error('Error getting project:', err);
    throw err;
  }
}

function getProjectByPathValue(path) {
  try {
    return getProjectByPath.get(path);
  } catch (err) {
    console.error('Error getting project by path:', err);
    throw err;
  }
}

function getProjects(favoritesOnly = false) {
  try {
    return favoritesOnly ? getFavoriteProjects.all() : getAllProjects.all();
  } catch (err) {
    console.error('Error getting projects:', err);
    throw err;
  }
}

function getProjectStats(id) {
  try {
    return getProjectWithStats.get(id);
  } catch (err) {
    console.error('Error getting project stats:', err);
    throw err;
  }
}

function deleteProject(id) {
  try {
    return deleteProjectById.run(id);
  } catch (err) {
    console.error('Error deleting project:', err);
    throw err;
  }
}

/**
 * Get the effective API configuration for a project
 * Resolves to project-specific config, or falls back to default
 */
function getEffectiveApiConfig(projectId) {
  try {
    const project = getProjectById.get(projectId);
    if (project && project.api_config_id) {
      return getApiConfigById.get(project.api_config_id);
    }

    // Fall back to default config
    const defaultConfig = getDefaultApiConfig.get();
    if (defaultConfig) {
      return defaultConfig;
    }

    // Fall back to DEFAULT_API_CONFIG_ID setting
    const defaultId = getSettingValue('DEFAULT_API_CONFIG_ID');
    if (defaultId) {
      return getApiConfigById.get(parseInt(defaultId));
    }

    return null;
  } catch (err) {
    console.error('Error getting effective API config:', err);
    throw err;
  }
}

// ============================================================================
// Context Preset Functions
// ============================================================================

function createContextPreset(data) {
  try {
    const result = insertContextPreset.run(
      data.projectId,
      data.name,
      data.description || null,
      data.filePatterns ? JSON.stringify(data.filePatterns) : null,
      data.excludePatterns ? JSON.stringify(data.excludePatterns) : null,
      data.explicitFiles ? JSON.stringify(data.explicitFiles) : null,
      data.isDefault ? 1 : 0
    );
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Error creating context preset:', err);
    throw err;
  }
}

function updateContextPresetById(id, data) {
  try {
    return updateContextPreset.run(
      data.name,
      data.description || null,
      data.filePatterns ? JSON.stringify(data.filePatterns) : null,
      data.excludePatterns ? JSON.stringify(data.excludePatterns) : null,
      data.explicitFiles ? JSON.stringify(data.explicitFiles) : null,
      data.isDefault !== undefined ? (data.isDefault ? 1 : 0) : 0,
      id
    );
  } catch (err) {
    console.error('Error updating context preset:', err);
    throw err;
  }
}

function getContextPreset(id) {
  try {
    return getContextPresetById.get(id);
  } catch (err) {
    console.error('Error getting context preset:', err);
    throw err;
  }
}

function getPresetsForProject(projectId) {
  try {
    return getContextPresetsByProject.all(projectId);
  } catch (err) {
    console.error('Error getting presets for project:', err);
    throw err;
  }
}

function getDefaultPreset(projectId) {
  try {
    return getDefaultPresetForProject.get(projectId);
  } catch (err) {
    console.error('Error getting default preset:', err);
    throw err;
  }
}

function deleteContextPreset(id) {
  try {
    return deleteContextPresetById.run(id);
  } catch (err) {
    console.error('Error deleting context preset:', err);
    throw err;
  }
}

// Initialize default settings if they don't exist
function initializeDefaultSettings() {
  try {
    if (!getSettingValue('CLI_ROOT')) {
      setSetting('CLI_ROOT', process.cwd());
      console.log('Initialized CLI_ROOT setting to:', process.cwd());
    }
    if (!getSettingValue('CLI_COMMAND')) {
      setSetting('CLI_COMMAND', 'claude');
      console.log('Initialized CLI_COMMAND setting to: claude');
    }
    if (!getSettingValue('CLI_ARGS')) {
      setSetting('CLI_ARGS', 'chat');
      console.log('Initialized CLI_ARGS setting to: chat');
    }
    if (!getSettingValue('DEFAULT_MODEL')) {
      setSetting('DEFAULT_MODEL', 'claude-sonnet-4-5-20250929');
      console.log('Initialized DEFAULT_MODEL setting to: claude-sonnet-4-5-20250929');
    }
  } catch (err) {
    console.error('Error initializing default settings:', err);
  }
}

// Prompt functions
function createPrompt(name, description, promptText, model = null) {
  try {
    const result = insertPrompt.run(name, description, promptText, model);
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Error creating prompt:', err);
    throw err;
  }
}

function updatePromptById(id, description, promptText, model = null) {
  try {
    return updatePrompt.run(description, promptText, model, id);
  } catch (err) {
    console.error('Error updating prompt:', err);
    throw err;
  }
}

function getPrompt(id) {
  try {
    return getPromptById.get(id);
  } catch (err) {
    console.error('Error getting prompt:', err);
    throw err;
  }
}

function getPromptName(name) {
  try {
    return getPromptByName.get(name);
  } catch (err) {
    console.error('Error getting prompt by name:', err);
    throw err;
  }
}

function getPrompts() {
  try {
    return getAllPrompts.all();
  } catch (err) {
    console.error('Error getting all prompts:', err);
    throw err;
  }
}

function deletePrompt(id) {
  try {
    return deletePromptById.run(id);
  } catch (err) {
    console.error('Error deleting prompt:', err);
    throw err;
  }
}

// Initialize default prompts
function initializeDefaultPrompts() {
  try {
    if (!getPromptName('file-summarization')) {
      createPrompt(
        'file-summarization',
        'Summarize the content of a file',
        'Please provide a comprehensive summary of the following file. Include:\n\n1. **Purpose**: What is the main purpose of this file?\n2. **Key Components**: What are the main sections, functions, or classes?\n3. **Dependencies**: What libraries or modules does it depend on?\n4. **Key Functionality**: What are the most important features or behaviors?\n5. **Notable Patterns**: Are there any design patterns or architectural decisions worth mentioning?\n\nKeep the summary concise but informative.',
        'claude-3-5-haiku-20241022'  // Use faster, cheaper model for summaries by default
      );
      console.log('Initialized default file-summarization prompt');
    }
  } catch (err) {
    console.error('Error initializing default prompts:', err);
  }
}

// Initialize default API configurations
function initializeDefaultApiConfigs() {
  try {
    if (!getApiConfigByName.get('Anthropic Direct (Default)')) {
      const configId = createApiConfig({
        name: 'Anthropic Direct (Default)',
        provider: 'anthropic',
        apiUrl: 'https://api.anthropic.com',
        apiKeySource: 'env',
        apiKeyValue: 'ANTHROPIC_API_KEY',
        authType: 'bearer',
        models: [
          'claude-opus-4-20250514',
          'claude-sonnet-4-5-20250929',
          'claude-sonnet-4-20250514',
          'claude-haiku-4-20250514',
          'claude-3-5-haiku-20241022'
        ],
        isDefault: true,
        isActive: true
      });

      // Store default API config ID in settings
      setSetting('DEFAULT_API_CONFIG_ID', configId.toString());
      console.log('Initialized default Anthropic API configuration');
    }
  } catch (err) {
    console.error('Error initializing default API configurations:', err);
  }
}

// Create default project for existing users if no projects exist
function initializeDefaultProject() {
  try {
    const projects = getAllProjects.all();
    if (projects.length === 0) {
      const cliRoot = getSettingValue('CLI_ROOT') || process.cwd();
      const projectId = createProject({
        name: 'Default Project',
        path: cliRoot,
        description: 'Auto-created default project for existing conversations',
        color: '#6366f1',
        tags: ['default'],
        isFavorite: true,
        settings: {}
      });

      // Link all existing conversations without a project to this default project
      const orphanedConversations = db.prepare(
        'SELECT id FROM conversations WHERE project_id IS NULL'
      ).all();

      if (orphanedConversations.length > 0) {
        const updateStmt = db.prepare('UPDATE conversations SET project_id = ? WHERE id = ?');
        for (const conv of orphanedConversations) {
          updateStmt.run(projectId, conv.id);
        }
        console.log(`Linked ${orphanedConversations.length} orphaned conversations to default project`);
      }

      console.log('Created default project for existing conversations');
    }
  } catch (err) {
    console.error('Error initializing default project:', err);
  }
}

// Initialize defaults on startup
initializeDefaultSettings();
initializeDefaultPrompts();
initializeDefaultApiConfigs();
initializeDefaultProject();

module.exports = {
  db,
  // Conversation functions
  createConversation,
  updateConversationTitle,
  setConversationSessionId,
  getConversation,
  getConversations,
  getVisibleConversationsOnly,
  getConversationsForProject,
  getAllConversationsAcrossAllProjects,
  markConversationHidden,
  permanentlyDeleteConversation,
  // Message functions
  saveMessage,
  getMessages,
  // CLI call functions
  logCliCall,
  getAllCliCalls,
  getCliCallById,
  getRecentCliCalls,
  // Settings functions
  getSettingValue,
  setSetting,
  getSettings,
  // Prompt functions
  createPrompt,
  updatePromptById,
  getPrompt,
  getPromptName,
  getPrompts,
  deletePrompt,
  // API Configuration functions
  createApiConfig,
  updateApiConfigById,
  getApiConfig,
  getApiConfigByNameValue,
  getApiConfigs,
  getDefaultApiConfigValue,
  deleteApiConfig,
  encryptApiKey,
  decryptApiKey,
  resolveApiKey,
  // Project functions
  createProject,
  updateProjectById,
  updateProjectAccess,
  getProject,
  getProjectByPathValue,
  getProjects,
  getProjectStats,
  deleteProject,
  getEffectiveApiConfig,
  // Context Preset functions
  createContextPreset,
  updateContextPresetById,
  getContextPreset,
  getPresetsForProject,
  getDefaultPreset,
  deleteContextPreset
};