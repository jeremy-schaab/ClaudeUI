const Database = require('better-sqlite3');
const path = require('path');

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

// Migration: Add model column to conversations table
try {
  db.exec(`ALTER TABLE conversations ADD COLUMN model TEXT`);
  console.log('Added model column to conversations table');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    console.log('model column may already exist');
  }
}

console.log('Database initialized at:', dbPath);

// Prepared statements for conversations
const insertConversation = db.prepare(`
  INSERT INTO conversations (title, selected_files, model) VALUES (?, ?, ?)
`);

const updateConversation = db.prepare(`
  UPDATE conversations SET updated_at = CURRENT_TIMESTAMP, title = ?, selected_files = ?, model = ? WHERE id = ?
`);

const getConversationById = db.prepare('SELECT * FROM conversations WHERE id = ?');
const getAllConversations = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC');
const getVisibleConversations = db.prepare('SELECT * FROM conversations WHERE hidden = 0 ORDER BY updated_at DESC');
const hideConversation = db.prepare('UPDATE conversations SET hidden = 1 WHERE id = ?');
const deleteConversation = db.prepare('DELETE FROM conversations WHERE id = ?');
const deleteMessagesByConversation = db.prepare('DELETE FROM messages WHERE conversation_id = ?');
const deleteCliCallsByConversation = db.prepare('DELETE FROM cli_calls WHERE conversation_id = ?');

// Prepared statements for messages
const insertMessage = db.prepare(`
  INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)
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
    full_stdin
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

// Conversation functions
function createConversation(title = 'Untitled', selectedFiles = null, model = null) {
  try {
    const filesJson = selectedFiles ? JSON.stringify(selectedFiles) : null;
    const result = insertConversation.run(title, filesJson, model);
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

function getVisibleConversationsOnly() {
  try {
    return getVisibleConversations.all();
  } catch (err) {
    console.error('Error getting visible conversations:', err);
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
function saveMessage(conversationId, role, content) {
  try {
    const result = insertMessage.run(conversationId, role, content);
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
      data.fullStdin || null
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

// Initialize defaults on startup
initializeDefaultSettings();

module.exports = {
  db,
  createConversation,
  updateConversationTitle,
  getConversation,
  getConversations,
  getVisibleConversationsOnly,
  markConversationHidden,
  permanentlyDeleteConversation,
  saveMessage,
  getMessages,
  logCliCall,
  getAllCliCalls,
  getCliCallById,
  getRecentCliCalls,
  getSettingValue,
  setSetting,
  getSettings
};