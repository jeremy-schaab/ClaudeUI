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

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  extension?: string
  children?: FileNode[]
}

function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'admin' | 'files'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<{ path: string, content: string } | null>(null)
  const [selectedContext, setSelectedContext] = useState<Set<string>>(new Set())
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

  // Load file tree
  const loadFileTree = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/files')
      console.log('File tree response:', response.data)
      setFileTree(response.data.files)
    } catch (err) {
      console.error('Failed to load file tree:', err)
    }
  }

  // Load file tree when switching to files view
  useEffect(() => {
    if (currentView === 'files' && fileTree.length === 0) {
      loadFileTree()
    }
  }, [currentView])

  const toggleDirectory = (dirPath: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dirPath)) {
        newSet.delete(dirPath)
      } else {
        newSet.add(dirPath)
      }
      return newSet
    })
  }

  const handleFileClick = async (filePath: string) => {
    try {
      const response = await axios.get('http://localhost:3001/api/files/content', {
        params: { path: filePath }
      })
      setSelectedFile({ path: filePath, content: response.data.content })
    } catch (err) {
      console.error('Failed to load file content:', err)
    }
  }

  const toggleContextSelection = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedContext(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const clearAllContext = () => {
    setSelectedContext(new Set())
  }

  // Recursively collect all file paths from a directory node
  const collectFilesFromNode = (node: FileNode): string[] => {
    if (node.type === 'file') {
      return [node.path]
    }
    // For directories, collect all files from children
    if (node.children) {
      return node.children.flatMap(child => collectFilesFromNode(child))
    }
    return []
  }

  // Get all file paths that should be sent as context
  const getContextFiles = (): string[] => {
    console.log('getContextFiles called')
    console.log('selectedContext:', Array.from(selectedContext))
    console.log('fileTree length:', fileTree.length)

    const files = new Set<string>()

    selectedContext.forEach(path => {
      // Find the node in the tree
      const findNode = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
          if (node.path === path) return node
          if (node.children) {
            const found = findNode(node.children)
            if (found) return found
          }
        }
        return null
      }

      const node = findNode(fileTree)
      console.log('Looking for path:', path, 'Found node:', node?.name, node?.type)
      if (node) {
        const filePaths = collectFilesFromNode(node)
        console.log('Collected file paths:', filePaths)
        filePaths.forEach(f => files.add(f))
      } else {
        console.warn('Could not find node for path:', path)
      }
    })

    const result = Array.from(files)
    console.log('Final context files:', result)
    return result
  }

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

    // Get context files and emit message
    const contextFiles = getContextFiles()
    console.log('Sending message with context files:', contextFiles)
    socketRef.current?.emit('message', { content: input, contextFiles })
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

  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map(node => (
      <div key={node.path} style={{ marginLeft: `${level * 12}px` }}>
        {node.type === 'directory' ? (
          <>
            <div
              className={`file-tree-item directory ${selectedContext.has(node.path) ? 'in-context' : ''}`}
              onClick={() => toggleDirectory(node.path)}
            >
              <input
                type="checkbox"
                className="file-checkbox"
                checked={selectedContext.has(node.path)}
                onChange={(e) => toggleContextSelection(node.path, e)}
                onClick={(e) => e.stopPropagation()}
                title="Include in context"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {expandedDirs.has(node.path) ? (
                  <polyline points="6 9 12 15 18 9"/>
                ) : (
                  <polyline points="9 18 15 12 9 6"/>
                )}
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{node.name}</span>
            </div>
            {expandedDirs.has(node.path) && node.children && (
              <div className="file-tree-children">
                {renderFileTree(node.children, level + 1)}
              </div>
            )}
          </>
        ) : (
          <div
            className={`file-tree-item file ${selectedFile?.path === node.path ? 'selected' : ''} ${selectedContext.has(node.path) ? 'in-context' : ''}`}
            onClick={() => handleFileClick(node.path)}
          >
            <input
              type="checkbox"
              className="file-checkbox"
              checked={selectedContext.has(node.path)}
              onChange={(e) => toggleContextSelection(node.path, e)}
              onClick={(e) => e.stopPropagation()}
              title="Include in context"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
            <span>{node.name}</span>
          </div>
        )}
      </div>
    ))
  }

  if (currentView === 'admin') {
    return <Admin onBackToChat={() => setCurrentView('chat')} />
  }

  if (currentView === 'files') {
    return (
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            </svg>
            <span>Claude</span>
          </div>

          <button className="new-chat-btn" onClick={() => setCurrentView('chat')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to Chat</span>
          </button>

          <div className="sidebar-nav">
            <button className="nav-item" onClick={() => setCurrentView('chat')}>
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
            <button className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
              <span>Files</span>
            </button>
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

        <div className="files-view">
          <div className="file-tree-panel">
            <div className="file-tree-header">
              <h3>File Explorer</h3>
              <div className="file-tree-actions">
                {selectedContext.size > 0 && (
                  <button className="clear-context-btn" onClick={clearAllContext} title={`Clear ${selectedContext.size} selected`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    <span>{selectedContext.size}</span>
                  </button>
                )}
                <button className="refresh-btn" onClick={loadFileTree}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="file-tree-content">
              {fileTree.length === 0 ? (
                <div className="file-tree-empty">
                  <p>Click refresh to load files</p>
                </div>
              ) : (
                renderFileTree(fileTree)
              )}
            </div>
          </div>

          <div className="file-viewer-panel">
            {selectedFile ? (
              <>
                <div className="file-viewer-header">
                  <span className="file-viewer-path">{selectedFile.path}</span>
                  <button className="close-file-btn" onClick={() => setSelectedFile(null)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <pre className="file-viewer-content">
                  <code>{selectedFile.content}</code>
                </pre>
              </>
            ) : (
              <div className="file-viewer-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
                <p>Select a file to view its contents</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
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
          <button className="nav-item" onClick={() => setCurrentView('files')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
            <span>Files</span>
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
              {selectedContext.size > 0 && (
                <button type="button" className="context-indicator" onClick={() => setCurrentView('files')} title={`${selectedContext.size} file(s) in context - click to manage`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  <span>{selectedContext.size} in context</span>
                </button>
              )}
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