import { useState, useEffect } from 'react'
import './Admin.css'
import axios from 'axios'
import MarkdownMessage from './MarkdownMessage'

const MODELS = [
  { id: 'claude-opus-4-20250514', name: 'Opus 4', description: 'Powerful, large model for complex challenges' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5', description: 'Smart, efficient model for everyday use' },
  { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', description: 'Balanced performance and speed' },
  { id: 'claude-haiku-4-20250514', name: 'Haiku 4', description: 'Fast, lightweight model for simple tasks' }
]

interface Conversation {
  id: number
  created_at: string
  updated_at: string
  title: string
}

interface Message {
  id: number
  conversation_id: number
  timestamp: string
  role: string
  content: string
}

interface CliCall {
  id: number
  conversation_id: number
  message_id: number
  timestamp: string
  user_message: string
  cli_command: string
  cli_args: string
  execution_path: string
  response: string
  error: string
  exit_code: number
  duration_ms: number
  success: boolean
  context_files?: string
  full_stdin?: string
  model?: string
}

interface Setting {
  key: string
  value: string
  updated_at: string
}

interface AdminProps {
  onBackToChat: () => void
}

function Admin({ onBackToChat }: AdminProps) {
  const [view, setView] = useState<'conversations' | 'cli-calls' | 'settings'>('conversations')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [cliCalls, setCliCalls] = useState<CliCall[]>([])
  const [selectedCall, setSelectedCall] = useState<CliCall | null>(null)
  const [settings, setSettings] = useState<Setting[]>([])
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    if (view === 'conversations') {
      fetchConversations()
    } else if (view === 'cli-calls') {
      fetchCliCalls()
    } else if (view === 'settings') {
      fetchSettings()
    }
  }, [view])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3001/api/conversations')
      setConversations(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/conversations/${conversationId}/messages`)
      setMessages(response.data)
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  const fetchCliCalls = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3001/api/cli-calls?limit=100')
      setCliCalls(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching CLI calls:', err)
      setError('Failed to load CLI calls')
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3001/api/settings')
      setSettings(response.data)
      const initialEditingValues: Record<string, string> = {}
      response.data.forEach((setting: Setting) => {
        initialEditingValues[setting.key] = setting.value
      })
      setEditingSettings(initialEditingValues)
      setError(null)
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  const handleDeleteConversation = async (conversationId: number) => {
    if (!confirm('Are you sure you want to permanently delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`http://localhost:3001/api/conversations/${conversationId}`)
      setSaveMessage('Conversation permanently deleted')
      setTimeout(() => setSaveMessage(null), 3000)

      // Clear selection if deleted conversation was selected
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }

      // Refresh conversations list
      fetchConversations()
    } catch (err) {
      console.error('Error deleting conversation:', err)
      setError('Failed to delete conversation')
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSetting = async (key: string) => {
    try {
      await axios.put(`http://localhost:3001/api/settings/${key}`, {
        value: editingSettings[key]
      })
      setSaveMessage(`${key} saved successfully`)
      setTimeout(() => setSaveMessage(null), 3000)
      fetchSettings() // Refresh to show updated timestamp
    } catch (err) {
      console.error('Error saving setting:', err)
      setError(`Failed to save ${key}`)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="admin">
      <div className="admin-sidebar">
        <div className="admin-header">
          <h2>Admin</h2>
          <button onClick={onBackToChat} className="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Chat
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab ${view === 'conversations' ? 'active' : ''}`}
            onClick={() => setView('conversations')}
          >
            Conversations
          </button>
          <button
            className={`tab ${view === 'cli-calls' ? 'active' : ''}`}
            onClick={() => setView('cli-calls')}
          >
            CLI Calls
          </button>
          <button
            className={`tab ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
          >
            Settings
          </button>
        </div>

        {view !== 'settings' && (
          <div className="admin-actions">
            <button
              onClick={() => view === 'conversations' ? fetchConversations() : fetchCliCalls()}
              className="refresh-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              Refresh
            </button>
          </div>
        )}

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
        {saveMessage && <div className="success-message">{saveMessage}</div>}

        {view === 'settings' ? (
          <div className="settings-list">
            <div className="settings-info">
              <p>Configure CLI execution settings</p>
            </div>
          </div>
        ) : view === 'conversations' ? (
          <div className="conversations-list">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="conversation-title">{conversation.title || 'Untitled'}</div>
                <div className="conversation-date">{formatDate(conversation.updated_at)}</div>
              </div>
            ))}
            {!loading && conversations.length === 0 && (
              <div className="empty-state">No conversations yet</div>
            )}
          </div>
        ) : (
          <div className="calls-list">
          {cliCalls.map(call => (
            <div
              key={call.id}
              className={`call-item ${selectedCall?.id === call.id ? 'active' : ''} ${call.success ? 'success' : 'failed'}`}
              onClick={() => setSelectedCall(call)}
            >
              <div className="call-item-header">
                <span className={`status-badge ${call.success ? 'success' : 'failed'}`}>
                  {call.success ? '✓' : '✗'}
                </span>
                <span className="call-time">{formatDate(call.timestamp)}</span>
              </div>
              <div className="call-message">{call.user_message.substring(0, 60)}...</div>
              <div className="call-meta">
                <span className="duration">{formatDuration(call.duration_ms)}</span>
                <span className="exit-code">Exit: {call.exit_code}</span>
                {call.model && <span className="model-badge">{call.model}</span>}
              </div>
            </div>
          ))}
          {!loading && cliCalls.length === 0 && (
            <div className="empty-state">No CLI calls recorded yet</div>
          )}
          </div>
        )}
      </div>

      <div className="admin-content">
        {view === 'settings' ? (
          <div className="settings-form">
            <h2>CLI Settings</h2>
            <p className="settings-description">Configure how the Claude CLI is executed</p>

            {settings.map(setting => (
              <div key={setting.key} className="setting-item">
                <label htmlFor={setting.key}>{setting.key}</label>
                <div className="setting-input-group">
                  {setting.key === 'DEFAULT_MODEL' ? (
                    <select
                      id={setting.key}
                      value={editingSettings[setting.key] || ''}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="setting-select"
                    >
                      {MODELS.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} - {model.description}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={setting.key}
                      type="text"
                      value={editingSettings[setting.key] || ''}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="setting-input"
                    />
                  )}
                  <button
                    onClick={() => handleSaveSetting(setting.key)}
                    className="save-setting-btn"
                  >
                    Save
                  </button>
                </div>
                <div className="setting-meta">
                  Last updated: {formatDate(setting.updated_at)}
                </div>
                <div className="setting-help">
                  {setting.key === 'CLI_ROOT' && 'The directory where CLI commands will be executed'}
                  {setting.key === 'CLI_COMMAND' && 'The CLI command to execute (e.g., claude, node)'}
                  {setting.key === 'CLI_ARGS' && 'Arguments to pass to the CLI command'}
                  {setting.key === 'DEFAULT_MODEL' && 'The default Claude model to use for new conversations'}
                </div>
              </div>
            ))}
          </div>
        ) : view === 'conversations' && selectedConversation ? (
          <div className="conversation-messages">
            <div className="conversation-header">
              <h2>{selectedConversation.title || 'Untitled'}</h2>
              <button
                onClick={() => handleDeleteConversation(selectedConversation.id)}
                className="delete-conversation-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete Permanently
              </button>
            </div>
            <div className="messages-list">
              {messages.map(message => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-role">{message.role}</div>
                  <div className="message-content">
                    {message.role === 'assistant' ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className="message-time">{formatDate(message.timestamp)}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="empty-state">No messages in this conversation</div>
              )}
            </div>
          </div>
        ) : view === 'cli-calls' && selectedCall ? (
          <div className="call-details">
            <div className="detail-section">
              <h3>Call Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>ID:</label>
                  <span>{selectedCall.id}</span>
                </div>
                <div className="detail-item">
                  <label>Timestamp:</label>
                  <span>{formatDate(selectedCall.timestamp)}</span>
                </div>
                <div className="detail-item">
                  <label>Duration:</label>
                  <span>{formatDuration(selectedCall.duration_ms)}</span>
                </div>
                <div className="detail-item">
                  <label>Exit Code:</label>
                  <span className={selectedCall.exit_code === 0 ? 'success-text' : 'error-text'}>
                    {selectedCall.exit_code}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={selectedCall.success ? 'success-text' : 'error-text'}>
                    {selectedCall.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {selectedCall.model && (
                  <div className="detail-item">
                    <label>Model:</label>
                    <span className="model-text">{selectedCall.model}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>CLI Execution</h3>
              <div className="detail-grid">
                <div className="detail-item full-width">
                  <label>Command:</label>
                  <code className="code-block">{selectedCall.cli_command} {selectedCall.cli_args}</code>
                </div>
                <div className="detail-item full-width">
                  <label>Execution Path:</label>
                  <code className="code-block">{selectedCall.execution_path}</code>
                </div>
              </div>
            </div>

            {selectedCall.context_files && (
              <div className="detail-section">
                <h3>Context Files</h3>
                <div className="info-box">
                  <pre className="code-block">{JSON.stringify(JSON.parse(selectedCall.context_files), null, 2)}</pre>
                </div>
              </div>
            )}

            {selectedCall.full_stdin && (
              <div className="detail-section">
                <h3>Full CLI Input (stdin)</h3>
                <div className="info-box">
                  <pre className="code-block">{selectedCall.full_stdin}</pre>
                </div>
              </div>
            )}

            <div className="detail-section">
              <h3>User Message (Original)</h3>
              <div className="message-box">{selectedCall.user_message}</div>
            </div>

            {selectedCall.response && (
              <div className="detail-section">
                <h3>Response</h3>
                <div className="response-box">{selectedCall.response}</div>
              </div>
            )}

            {selectedCall.error && (
              <div className="detail-section">
                <h3>Error Output</h3>
                <div className="error-box">{selectedCall.error}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-detail">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8" />
            </svg>
            <h3>{view === 'conversations' ? 'Select a conversation to view messages' : 'Select a CLI call to view details'}</h3>
            <p>{view === 'conversations' ? 'Choose a conversation from the list on the left to see its messages' : 'Choose a call from the list on the left to see its full execution details'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin