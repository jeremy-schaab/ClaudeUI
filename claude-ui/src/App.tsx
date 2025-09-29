import { useState, useEffect, useRef } from 'react'
import './App.css'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import Admin from './Admin'
import MarkdownMessage from './MarkdownMessage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface RecentChat {
  id: string
  title: string
  timestamp: Date
}

function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'admin'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const conversationIdRef = useRef<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Keep ref in sync with state
  useEffect(() => {
    conversationIdRef.current = currentConversationId
  }, [currentConversationId])

  // Load recent conversations on mount (only visible ones)
  useEffect(() => {
    const loadRecentConversations = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/conversations/visible')
        const conversations = response.data.slice(0, 20).map((conv: any) => ({
          id: conv.id.toString(),
          title: conv.title || 'Untitled',
          timestamp: new Date(conv.updated_at)
        }))
        setRecentChats(conversations)
      } catch (err) {
        console.error('Failed to load recent conversations:', err)
      }
    }
    loadRecentConversations()
  }, [])

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:3001')

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to server')
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from server')
    })

    socketRef.current.on('response', async (data: { content: string }) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date()
        }
      ])
      setIsProcessing(false)

      // Save assistant response to database
      if (conversationIdRef.current) {
        try {
          await axios.post(`http://localhost:3001/api/conversations/${conversationIdRef.current}/messages`, {
            role: 'assistant',
            content: data.content
          })
        } catch (err) {
          console.error('Failed to save assistant message:', err)
        }
      }
    })

    socketRef.current.on('error', (data: { error: string }) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date()
        }
      ])
      setIsProcessing(false)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsProcessing(true)

    // Create conversation if this is the first message
    if (!currentConversationId) {
      try {
        const title = input.substring(0, 50)
        const response = await axios.post('http://localhost:3001/api/conversations', { title })
        setCurrentConversationId(response.data.id)

        // Save user message to database
        await axios.post(`http://localhost:3001/api/conversations/${response.data.id}/messages`, {
          role: 'user',
          content: input
        })
      } catch (err) {
        console.error('Failed to create conversation:', err)
      }
    } else {
      // Save user message to existing conversation
      try {
        await axios.post(`http://localhost:3001/api/conversations/${currentConversationId}/messages`, {
          role: 'user',
          content: input
        })
      } catch (err) {
        console.error('Failed to save message:', err)
      }
    }

    socketRef.current?.emit('message', { content: input })
    setInput('')
  }

  const handleNewChat = () => {
    if (isProcessing) return

    // Save current chat to recents if it has messages and not already in list
    if (messages.length > 0 && currentConversationId) {
      const chatId = currentConversationId.toString()
      const existingChat = recentChats.find(chat => chat.id === chatId)

      if (!existingChat) {
        const firstUserMessage = messages.find(m => m.role === 'user')
        const title = firstUserMessage?.content.substring(0, 50) || 'Untitled'
        const newChat: RecentChat = {
          id: chatId,
          title,
          timestamp: new Date()
        }
        setRecentChats(prev => [newChat, ...prev.slice(0, 19)]) // Keep last 20
      }
    }

    setMessages([])
    setInput('')
    setCurrentConversationId(null)
  }

  const handleLoadChat = async (chatId: string) => {
    if (isProcessing) return

    try {
      const response = await axios.get(`http://localhost:3001/api/conversations/${chatId}/messages`)
      const loadedMessages = response.data.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }))
      setMessages(loadedMessages)
      setCurrentConversationId(parseInt(chatId))
    } catch (err) {
      console.error('Failed to load chat:', err)
    }
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent loading the chat when clicking delete

    try {
      await axios.put(`http://localhost:3001/api/conversations/${chatId}/hide`)

      // Remove from local state
      setRecentChats(prev => prev.filter(chat => chat.id !== chatId))

      // If deleting the current conversation, clear messages
      if (currentConversationId?.toString() === chatId) {
        setMessages([])
        setCurrentConversationId(null)
      }
    } catch (err) {
      console.error('Failed to hide chat:', err)
    }
  }

  if (currentView === 'admin') {
    return <Admin onBackToChat={() => setCurrentView('chat')} />
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          </svg>
          <span>Claude</span>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat} disabled={isProcessing}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2"/>
          </svg>
          <span>New chat</span>
        </button>

        <div className="sidebar-nav">
          <button className="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Chats</span>
          </button>
          <button className="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span>Projects</span>
          </button>
          <button className="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span>Artifacts</span>
          </button>
        </div>

        <div className="sidebar-recents">
          <div className="recents-header">Recents</div>
          <div className="recents-list">
            {recentChats.map(chat => (
              <div
                key={chat.id}
                className={`recent-item ${currentConversationId?.toString() === chat.id ? 'active' : ''}`}
                onClick={() => handleLoadChat(chat.id)}
              >
                <span className="recent-item-title">{chat.title}</span>
                <button
                  className="delete-chat-btn"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  title="Delete chat"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            ))}
            {recentChats.length === 0 && (
              <div className="recents-empty">No recent chats</div>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="admin-link-btn" onClick={() => setCurrentView('admin')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span>CLI History</span>
          </button>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <h1 className="welcome-title">Back at it, User</h1>
              <p className="welcome-subtitle">How can I help you today?</p>

              <div className="action-buttons">
                <button className="action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                  <span>Code</span>
                </button>
                <button className="action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Write</span>
                </button>
                <button className="action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  <span>Learn</span>
                </button>
                <button className="action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  <span>Life stuff</span>
                </button>
                <button className="action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  <span>From Drive</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map(message => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {message.role === 'assistant' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="input-container">
          <form onSubmit={handleSubmit}>
            <div className="input-header">
              <button type="button" className="input-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button type="button" className="input-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Research
              </button>
              <button type="button" className="input-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
              <div className="model-selector">
                <span>Sonnet 4.5</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <button type="submit" disabled={!input.trim() || isProcessing || !isConnected} className="send-btn-new">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="How can I help you today?"
                rows={1}
                disabled={!isConnected || isProcessing}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App