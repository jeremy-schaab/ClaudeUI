import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import Admin from './Admin'
import MarkdownMessage from './MarkdownMessage'
import telliLogo from './assets/telli_logo.png'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import Editor, { DiffEditor } from '@monaco-editor/react'
import ProjectSwitcher from './components/ProjectSwitcher'
import ProjectManagement from './components/ProjectManagement'
import ContextPresetSelector from './components/ContextPresetSelector'

interface TokenData {
  inputTokens?: number
  outputTokens?: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
  totalCostUsd?: number
  modelUsage?: any
  durationMs?: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tokenData?: TokenData
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

interface Project {
  id?: number
  name: string
  path: string
  color: string
  description?: string
  tags?: string
  is_favorite?: boolean
  last_accessed?: string
}

const MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5', description: 'Smart, efficient model for everyday use (RECOMMENDED)' },
  { id: 'claude-opus-4-20250514', name: 'Opus 4', description: 'Powerful, large model for complex challenges' },
  { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', description: 'Balanced performance and speed' },
  { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5', description: 'Fast and intelligent, best value' },
  { id: 'claude-3-5-haiku-20241022', name: 'Haiku 3.5', description: 'Previous generation fast model' }
]

function ChatView() {
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // Determine current view from URL
  const currentView: 'chat' | 'admin' | 'files' = location.pathname.startsWith('/admin') ? 'admin'
    : location.pathname.startsWith('/files') ? 'files'
    : 'chat'
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<{ path: string, content: string } | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [selectedContext, setSelectedContext] = useState<Set<string>>(new Set())
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-5-20250929')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<Array<{name: string, description: string, source: string}>>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [availableCommands, setAvailableCommands] = useState<Array<{name: string, fullName: string, description: string, argumentHint?: string}>>([])
  const [showCommandPanel, setShowCommandPanel] = useState(false)
  const [commandFilter, setCommandFilter] = useState<string>('')
  const [selectedCommandHint, setSelectedCommandHint] = useState<{name: string, argumentHint: string, description: string} | null>(null)
  const [availableSkills, setAvailableSkills] = useState<Array<{name: string, description: string, source: string}>>([])
  const [showSkillPanel, setShowSkillPanel] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [fileSummary, setFileSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [activityLog, setActivityLog] = useState<string[]>([])
  const [showActivityLog, setShowActivityLog] = useState(true)
  const [showHtmlPreview, setShowHtmlPreview] = useState(false)
  const [processedHtml, setProcessedHtml] = useState<string | null>(null)
  const [isLoadingCss, setIsLoadingCss] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [showProjectManagement, setShowProjectManagement] = useState(false)
  const [showTokenStats, setShowTokenStats] = useState(false)
  const [skipPermissions, setSkipPermissions] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingChatTitle, setEditingChatTitle] = useState('')
  const conversationIdRef = useRef<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Keep ref in sync with state
  useEffect(() => {
    conversationIdRef.current = currentConversationId
  }, [currentConversationId])

  // Load default model and skip permissions setting from settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const modelResponse = await axios.get('http://localhost:3001/api/settings/DEFAULT_MODEL')
        if (modelResponse.data.value) {
          setSelectedModel(modelResponse.data.value)
        }
      } catch (err) {
        console.error('Failed to load default model:', err)
      }

      try {
        const skipPermsResponse = await axios.get('http://localhost:3001/api/settings/SKIP_PERMISSIONS')
        if (skipPermsResponse.data.value) {
          setSkipPermissions(skipPermsResponse.data.value === 'true')
        }
      } catch (err) {
        console.error('Failed to load skip permissions setting:', err)
      }
    }
    loadSettings()
  }, [])

  // Load recent conversations (filtered by project if provided)
  const loadRecentConversations = async (projectId?: number | null) => {
    try {
      const url = projectId
        ? `http://localhost:3001/api/conversations/visible?project_id=${projectId}`
        : 'http://localhost:3001/api/conversations/visible'
      const response = await axios.get(url)
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

  // Conversations will be loaded by loadDefaultProject() on mount

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

  // Load file tree on mount so it's available for context selection
  useEffect(() => {
    loadFileTree()
  }, [])

  // Load available agents
  const loadAgents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/agents')
      console.log('Available agents:', response.data)
      setAvailableAgents(response.data)
    } catch (err) {
      console.error('Failed to load agents:', err)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  // Load available slash commands
  const loadCommands = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/slash-commands')
      console.log('Available commands:', response.data)
      setAvailableCommands(response.data)
    } catch (err) {
      console.error('Failed to load commands:', err)
    }
  }

  useEffect(() => {
    loadCommands()
  }, [])

  // Load available skills
  const loadSkills = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/skills')
      console.log('Available skills:', response.data)
      setAvailableSkills(response.data)
    } catch (err) {
      console.error('Failed to load skills:', err)
    }
  }

  useEffect(() => {
    loadSkills()
  }, [])

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
      setEditedContent(response.data.content)
      setIsEditMode(false)
      setShowDiff(false)
    } catch (err) {
      console.error('Failed to load file content:', err)
    }
  }

  const handleSaveFile = async () => {
    if (!selectedFile) return

    const confirmed = window.confirm(
      `Are you sure you want to overwrite "${selectedFile.path}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      await axios.put('http://localhost:3001/api/files/content', {
        path: selectedFile.path,
        content: editedContent
      })
      setSelectedFile({ ...selectedFile, content: editedContent })
      setIsEditMode(false)
      setShowDiff(false)
    } catch (err) {
      console.error('Failed to save file:', err)
      alert('Failed to save file')
    }
  }

  const handleCancelEdit = () => {
    setEditedContent(selectedFile?.content || '')
    setIsEditMode(false)
    setShowDiff(false)
  }

  const handleSummarizeFile = async () => {
    if (!selectedFile) return

    setIsSummarizing(true)
    setFileSummary(null)

    try {
      const response = await axios.post('http://localhost:3001/api/summarize', {
        content: selectedFile.content,
        fileName: selectedFile.path
      })

      setFileSummary(response.data.summary)
    } catch (err) {
      console.error('Error summarizing file:', err)
      alert('Failed to summarize file. Please try again.')
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleSaveSummary = async (defaultPath: string) => {
    if (!fileSummary) return

    const userPath = prompt('Save summary to:', defaultPath)
    if (!userPath) return

    try {
      await axios.post('http://localhost:3001/api/save-summary', {
        path: userPath,
        content: fileSummary
      })
      alert(`Summary saved to ${userPath}`)
      loadFileTree() // Refresh file tree
    } catch (err) {
      console.error('Error saving summary:', err)
      alert('Failed to save summary. Please try again.')
    }
  }

  const processHtmlWithCss = async (htmlContent: string, htmlFilePath: string): Promise<string> => {
    try {
      // Parse HTML to find CSS link tags
      const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi
      const matches = [...htmlContent.matchAll(linkRegex)]

      if (matches.length === 0) {
        return htmlContent
      }

      let processedHtml = htmlContent
      const htmlDir = htmlFilePath.substring(0, htmlFilePath.lastIndexOf('\\'))

      // Fetch all CSS files
      for (const match of matches) {
        const cssPath = match[1]
        const fullTag = match[0]

        try {
          // Resolve relative path
          let resolvedPath = cssPath
          if (!cssPath.startsWith('http') && !cssPath.startsWith('/')) {
            resolvedPath = htmlDir + '\\' + cssPath
          }

          // Fetch CSS content
          const response = await axios.get('http://localhost:3001/api/files/content', {
            params: { path: resolvedPath }
          })

          // Replace link tag with inline style tag
          const styleTag = `<style>\n${response.data.content}\n</style>`
          processedHtml = processedHtml.replace(fullTag, styleTag)
        } catch (err) {
          console.error(`Failed to load CSS: ${cssPath}`, err)
          // Keep the original link tag if CSS fails to load
        }
      }

      return processedHtml
    } catch (err) {
      console.error('Error processing HTML with CSS:', err)
      return htmlContent // Return original HTML if processing fails
    }
  }

  const getFileExtension = (path: string): string => {
    const parts = path.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
  }

  const getMonacoLanguage = (path: string): string => {
    const ext = getFileExtension(path)
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cs': 'csharp',
      'cshtml': 'razor',
      'razor': 'razor',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'sh': 'shell',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'ps1': 'powershell',
      'vb': 'vb',
      'bat': 'bat',
      'cmd': 'bat'
    }
    return languageMap[ext] || 'plaintext'
  }

  const toggleContextSelection = (path: string, e: React.MouseEvent | React.ChangeEvent) => {
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

    socketRef.current.on('response', async (data: { content: string, sessionId?: string, tokenData?: TokenData }) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        tokenData: data.tokenData
      };

      setMessages(prev => [...prev, assistantMessage])
      setIsProcessing(false)
      setActivityLog([]) // Clear activity log when processing completes

      // Save assistant response to database
      if (conversationIdRef.current) {
        try {
          await axios.post(`http://localhost:3001/api/conversations/${conversationIdRef.current}/messages`, {
            role: 'assistant',
            content: data.content,
            tokenData: data.tokenData
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
          content: data.error, // Error message is already formatted with markdown
          timestamp: new Date()
        }
      ])
      setIsProcessing(false)
      setActivityLog([]) // Clear activity log on error
    })

    socketRef.current.on('cancelled', (data: { message: string }) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚠️ ${data.message}`,
          timestamp: new Date()
        }
      ])
      setIsProcessing(false)
      setActivityLog([]) // Clear activity log on cancel
      console.log('Command cancelled')
    })

    socketRef.current.on('activity-update', (data: { chunk: string, type: string }) => {
      // Add new activity chunks to the log, keep last 50 lines
      setActivityLog(prev => {
        const newLog = [...prev, data.chunk]
        return newLog.slice(-50) // Keep only last 50 entries
      })
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear command hint if user removes the command from input
  useEffect(() => {
    if (selectedCommandHint && !input.startsWith(selectedCommandHint.name)) {
      setSelectedCommandHint(null)
    }
  }, [input, selectedCommandHint])

  const handleCancel = () => {
    console.log('Cancel requested')
    socketRef.current?.emit('cancel')
    setIsProcessing(false)
  }

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
    setSelectedCommandHint(null) // Clear hint on submit

    // Create conversation if this is the first message
    if (!currentConversationId) {
      try {
        const title = input.substring(0, 50)
        const selectedFilesArray = Array.from(selectedContext)
        const response = await axios.post('http://localhost:3001/api/conversations', {
          title,
          selectedFiles: selectedFilesArray,
          model: selectedModel,
          project_id: currentProject?.id
        })
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

        // Update conversation with current selected files and model
        const selectedFilesArray = Array.from(selectedContext)
        await axios.put(`http://localhost:3001/api/conversations/${currentConversationId}`, {
          title: recentChats.find(c => c.id === currentConversationId.toString())?.title || 'Untitled',
          selectedFiles: selectedFilesArray,
          model: selectedModel
        })
      } catch (err) {
        console.error('Failed to save message:', err)
      }
    }

    // Get context files and emit message
    const contextFiles = getContextFiles()

    // Prefix message with @agent mention if an agent is selected
    let messageContent = input
    if (selectedAgent) {
      messageContent = `@${selectedAgent} ${input}`
      console.log('Sending with agent:', selectedAgent)
    }

    console.log('Sending message with context files:', contextFiles)
    console.log('Sending with model:', selectedModel)
    console.log('Sending with conversation ID:', currentConversationId)
    socketRef.current?.emit('message', {
      content: messageContent,
      contextFiles,
      model: selectedModel,
      conversationId: currentConversationId
    })
    setInput('')
  }

  // Handle command button click - insert command into textarea
  const handleCommandClick = (command: {name: string, fullName: string, description: string, argumentHint?: string}) => {
    // Insert command into textarea with a space for arguments
    setInput(command.fullName + ' ')
    setShowCommandPanel(false)

    // Show hint if command has arguments or description
    if (command.argumentHint || command.description) {
      setSelectedCommandHint({
        name: command.fullName,
        argumentHint: command.argumentHint || '',
        description: command.description || ''
      })
    }

    // Focus the textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea')
      if (textarea) {
        textarea.focus()
        // Move cursor to end
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length
      }
    }, 0)
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
    setSelectedContext(new Set()) // Clear selected files for new chat
  }

  const handleLoadChat = async (chatId: string) => {
    if (isProcessing) return

    // Navigate to the conversation URL
    navigate(`/chat/${chatId}`)
  }

  // Load conversation from URL parameter
  useEffect(() => {
    if (urlConversationId && urlConversationId !== currentConversationId?.toString()) {
      const loadConversation = async () => {
        try {
          // Load messages
          const messagesResponse = await axios.get(`http://localhost:3001/api/conversations/${urlConversationId}/messages`)
          const loadedMessages = messagesResponse.data.map((msg: any) => ({
            id: msg.id.toString(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }))
          setMessages(loadedMessages)
          setCurrentConversationId(parseInt(urlConversationId))

          // Load conversation metadata including selected files and model
          const conversationResponse = await axios.get(`http://localhost:3001/api/conversations/${urlConversationId}`)
          if (conversationResponse.data.selected_files) {
            try {
              const files = JSON.parse(conversationResponse.data.selected_files)
              setSelectedContext(new Set(files))
            } catch (err) {
              console.error('Failed to parse selected files:', err)
            }
          }
          if (conversationResponse.data.model) {
            setSelectedModel(conversationResponse.data.model)
          }
        } catch (err) {
          console.error('Failed to load chat from URL:', err)
          // If conversation doesn't exist, redirect to home
          navigate('/')
        }
      }
      loadConversation()
    }
  }, [urlConversationId])

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

  const handleStartRename = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chatId)
    setEditingChatTitle(currentTitle)
  }

  const handleSaveRename = async (chatId: string) => {
    if (!editingChatTitle.trim()) return

    try {
      await axios.put(`http://localhost:3001/api/conversations/${chatId}`, {
        title: editingChatTitle.trim()
      })

      // Update local state
      setRecentChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, title: editingChatTitle.trim() } : chat
      ))

      setEditingChatId(null)
      setEditingChatTitle('')
    } catch (err) {
      console.error('Failed to rename chat:', err)
    }
  }

  const handleCancelRename = () => {
    setEditingChatId(null)
    setEditingChatTitle('')
  }

  // Project handlers
  const loadDefaultProject = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/projects')
      const projects = response.data.data || []
      if (projects.length > 0) {
        // Check if there's a saved project ID in localStorage
        const savedProjectId = localStorage.getItem('claudeui_selected_project_id')
        let defaultProj: Project | undefined

        // Try to find the saved project first
        if (savedProjectId) {
          defaultProj = projects.find((p: Project) => p.id?.toString() === savedProjectId)
        }

        // If no saved project or saved project not found, use the first project or the one marked as favorite
        if (!defaultProj) {
          defaultProj = projects.find((p: Project) => p.is_favorite) || projects[0]
        }

        setCurrentProject(defaultProj)

        // Update CLI_ROOT to match project path
        await axios.post('http://localhost:3001/api/settings', {
          key: 'CLI_ROOT',
          value: defaultProj.path
        })

        // Load conversations for the selected project
        await loadRecentConversations(defaultProj.id)
      }
    } catch (err) {
      console.error('Failed to load default project:', err)
    }
  }

  const handleProjectSelect = async (project: Project) => {
    setCurrentProject(project)

    // Save selected project ID to localStorage
    if (project.id) {
      localStorage.setItem('claudeui_selected_project_id', project.id.toString())
    }

    // Clear current conversation when switching projects
    setCurrentConversationId(null)
    setMessages([])

    // Update CLI_ROOT
    try {
      await axios.post('http://localhost:3001/api/settings', {
        key: 'CLI_ROOT',
        value: project.path
      })

      // Update project last accessed
      await axios.patch(`http://localhost:3001/api/projects/${project.id!}`, {
        last_accessed: new Date().toISOString()
      })

      // Reload file tree for new project
      loadFileTree()

      // Reload conversations for new project
      await loadRecentConversations(project.id)

      // Reload agents and commands for new project
      await loadAgents()
      await loadCommands()
    } catch (err) {
      console.error('Failed to switch project:', err)
    }
  }

  const handleApplyPreset = (files: string[]) => {
    // Add files to selected context
    setSelectedContext(prev => {
      const newContext = new Set(prev)
      files.forEach(file => newContext.add(file))
      return newContext
    })
  }

  const toggleSkipPermissions = async () => {
    const newValue = !skipPermissions
    setSkipPermissions(newValue)

    try {
      await axios.put('http://localhost:3001/api/settings/SKIP_PERMISSIONS', {
        value: newValue.toString()
      })
      console.log('Skip permissions updated:', newValue)
    } catch (err) {
      console.error('Failed to update skip permissions setting:', err)
      // Revert on error
      setSkipPermissions(!newValue)
    }
  }

  // Calculate conversation token totals
  const getConversationTokenTotals = () => {
    return messages.reduce((totals, msg) => {
      if (msg.tokenData) {
        totals.inputTokens += msg.tokenData.inputTokens || 0
        totals.outputTokens += msg.tokenData.outputTokens || 0
        totals.cacheCreationTokens += msg.tokenData.cacheCreationTokens || 0
        totals.cacheReadTokens += msg.tokenData.cacheReadTokens || 0
        totals.totalCostUsd += msg.tokenData.totalCostUsd || 0
        totals.durationMs += msg.tokenData.durationMs || 0
      }
      return totals
    }, {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalCostUsd: 0,
      durationMs: 0
    })
  }

  // Format token count with commas
  const formatTokens = (tokens: number) => tokens.toLocaleString()

  // Format cost in USD
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`

  // Load default project on mount
  useEffect(() => {
    loadDefaultProject()
  }, [])

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
    return <Admin onBackToChat={() => navigate('/')} />
  }

  if (currentView === 'files') {
    return (
      <div className="app">
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-brand">
            <div className="brand-content">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
              <span>Claude</span>
            </div>
            <button
              className="collapse-sidebar-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarCollapsed ? (
                  <path d="M9 18l6-6-6-6"/>
                ) : (
                  <path d="M15 18l-6-6 6-6"/>
                )}
              </svg>
            </button>
          </div>

          <button className="new-chat-btn" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to Chat</span>
          </button>

          <div className="sidebar-nav">
            <button className="nav-item" onClick={() => navigate('/')}>
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
            <button className="admin-link-btn" onClick={() => navigate('/admin')}>
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
                <ContextPresetSelector
                  projectId={currentProject?.id || null}
                  onApplyPreset={handleApplyPreset}
                  onManagePresets={() => setShowProjectManagement(true)}
                />
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
                  <div className="file-viewer-actions">
                    {!isEditMode ? (
                      <>
                        <button className="edit-file-btn" onClick={() => setIsEditMode(true)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </button>
                        {getFileExtension(selectedFile.path) === 'html' && (
                          <button
                            className="preview-file-btn"
                            onClick={async () => {
                              setIsLoadingCss(true)
                              setShowHtmlPreview(true)
                              const processed = await processHtmlWithCss(selectedFile.content, selectedFile.path)
                              setProcessedHtml(processed)
                              setIsLoadingCss(false)
                            }}
                            disabled={isLoadingCss}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            {isLoadingCss ? 'Loading...' : 'Preview'}
                          </button>
                        )}
                        <button
                          className="summarize-file-btn"
                          onClick={handleSummarizeFile}
                          disabled={isSummarizing}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                          </svg>
                          {isSummarizing ? 'Summarizing...' : 'Summarize'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`diff-btn ${showDiff ? 'active' : ''}`}
                          onClick={() => setShowDiff(!showDiff)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4"/>
                          </svg>
                          {showDiff ? 'Edit' : 'Diff'}
                        </button>
                        <button className="save-file-btn" onClick={handleSaveFile}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Save
                        </button>
                        <button className="cancel-edit-btn" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </>
                    )}
                    <button className="close-file-btn" onClick={() => {
                      setSelectedFile(null)
                      setIsEditMode(false)
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {fileSummary && (
                  <div className="file-summary-panel">
                    <div className="file-summary-header">
                      <h3>File Summary</h3>
                      <div className="file-summary-actions">
                        <button className="save-summary-btn" onClick={() => {
                          const relativePath = selectedFile.path.replace(/\\/g, '/')
                          const summaryPath = `docs/ai/summaries/${relativePath}.md`
                          handleSaveSummary(summaryPath)
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                          </svg>
                          Save As
                        </button>
                        <button className="close-summary-btn" onClick={() => setFileSummary(null)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="file-summary-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {fileSummary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                <div className="file-viewer-content">
                  {isEditMode ? (
                    showDiff ? (
                      <DiffEditor
                        height="100%"
                        language={getMonacoLanguage(selectedFile.path)}
                        original={selectedFile.content}
                        modified={editedContent}
                        theme="vs-dark"
                        options={{
                          renderSideBySide: true,
                          readOnly: false,
                          fontSize: 14,
                          automaticLayout: true
                        }}
                        onMount={(editor) => {
                          const modifiedEditor = editor.getModifiedEditor()
                          modifiedEditor.onDidChangeModelContent(() => {
                            setEditedContent(modifiedEditor.getValue())
                          })
                        }}
                      />
                    ) : (
                      <Editor
                        height="100%"
                        language={getMonacoLanguage(selectedFile.path)}
                        value={editedContent}
                        onChange={(value) => setEditedContent(value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: true },
                          fontSize: 14,
                          lineNumbers: 'on',
                          roundedSelection: false,
                          scrollBeyondLastLine: false,
                          readOnly: false,
                          automaticLayout: true,
                          wordWrap: 'on',
                          tabSize: 2
                        }}
                      />
                    )
                  ) : getFileExtension(selectedFile.path) === 'md' ? (
                    <div className="markdown-viewer">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedFile.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <Editor
                      height="100%"
                      language={getMonacoLanguage(selectedFile.path)}
                      value={selectedFile.content}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                        tabSize: 2,
                        contextmenu: true,
                        selectOnLineNumbers: true
                      }}
                    />
                  )}
                </div>
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

        {/* HTML Preview Modal */}
        {showHtmlPreview && selectedFile && (
          <div className="html-preview-modal" onClick={() => setShowHtmlPreview(false)}>
            <div className="html-preview-content" onClick={(e) => e.stopPropagation()}>
              <div className="html-preview-header">
                <h3>HTML Preview - {selectedFile.path}</h3>
                <button className="close-preview-btn" onClick={() => setShowHtmlPreview(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="html-preview-body">
                {isLoadingCss ? (
                  <div className="html-preview-loading">
                    <p>Loading CSS files...</p>
                  </div>
                ) : (
                  <iframe
                    srcDoc={processedHtml || selectedFile.content}
                    title="HTML Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            </svg>
            <span>Claude</span>
          </div>
          <button
            className="collapse-sidebar-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6"/>
              ) : (
                <path d="M15 18l-6-6 6-6"/>
              )}
            </svg>
          </button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat} disabled={isProcessing}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2"/>
          </svg>
          <span>New chat</span>
        </button>

        <ProjectSwitcher
          currentProject={currentProject}
          onProjectSelect={handleProjectSelect}
          onManageProjects={() => setShowProjectManagement(true)}
          onNewProject={() => setShowProjectManagement(true)}
        />

        <div className="sidebar-nav">
          <button className="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Chats</span>
          </button>
          <button className="nav-item" onClick={() => setShowProjectManagement(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span>Projects</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/files')}>
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
                onClick={() => editingChatId !== chat.id && handleLoadChat(chat.id)}
              >
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    className="rename-input"
                    value={editingChatTitle}
                    onChange={(e) => setEditingChatTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRename(chat.id)
                      } else if (e.key === 'Escape') {
                        handleCancelRename()
                      }
                    }}
                    onBlur={() => handleSaveRename(chat.id)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="recent-item-title">{chat.title}</span>
                )}
                <div className="recent-item-actions">
                  {editingChatId !== chat.id && (
                    <button
                      className="rename-chat-btn"
                      onClick={(e) => handleStartRename(chat.id, chat.title, e)}
                      title="Rename chat"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
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
              </div>
            ))}
            {recentChats.length === 0 && (
              <div className="recents-empty">No recent chats</div>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="admin-link-btn" onClick={() => navigate('/admin')}>
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
            <>
              {(() => {
                const totals = getConversationTokenTotals();
                return totals.inputTokens > 0 || totals.outputTokens > 0 ? (
                  <div className="conversation-token-summary">
                    <div className="summary-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6"/>
                        <polyline points="8 6 2 12 8 18"/>
                      </svg>
                      <span>{formatTokens(totals.inputTokens + totals.outputTokens)} tokens</span>
                    </div>
                    <div className="summary-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      <span>{(totals.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="summary-item cost">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="6" x2="12" y2="12"/>
                        <line x1="16" y1="14" x2="12" y2="12"/>
                        <line x1="8" y1="14" x2="12" y2="12"/>
                      </svg>
                      <span>{formatCost(totals.totalCostUsd)}</span>
                    </div>
                    {totals.cacheReadTokens > 0 && (
                      <div className="summary-item cache">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12h4l3 9 4-18 3 9h4"/>
                        </svg>
                        <span>{formatTokens(totals.cacheReadTokens)} cached</span>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
              <div className="messages">
                {messages.map(message => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                      </svg>
                    ) : (
                      <img src={telliLogo} alt="Telli" width="32" height="32" />
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
                    {message.role === 'assistant' && message.tokenData && (
                      <div className="token-info-badge" title="Click for details" onClick={() => setShowTokenStats(!showTokenStats)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        {formatTokens((message.tokenData.inputTokens || 0) + (message.tokenData.outputTokens || 0))} tokens · {formatCost(message.tokenData.totalCostUsd || 0)}
                        <div className="token-tooltip">
                          <div className="token-tooltip-row">
                            <span>Input:</span>
                            <span>{formatTokens(message.tokenData.inputTokens || 0)}</span>
                          </div>
                          <div className="token-tooltip-row">
                            <span>Output:</span>
                            <span>{formatTokens(message.tokenData.outputTokens || 0)}</span>
                          </div>
                          {(message.tokenData.cacheCreationTokens || 0) > 0 && (
                            <div className="token-tooltip-row">
                              <span>Cache Created:</span>
                              <span>{formatTokens(message.tokenData.cacheCreationTokens || 0)}</span>
                            </div>
                          )}
                          {(message.tokenData.cacheReadTokens || 0) > 0 && (
                            <div className="token-tooltip-row">
                              <span>Cache Read:</span>
                              <span>{formatTokens(message.tokenData.cacheReadTokens || 0)}</span>
                            </div>
                          )}
                          <div className="token-tooltip-row total">
                            <span>Cost:</span>
                            <span>{formatCost(message.tokenData.totalCostUsd || 0)}</span>
                          </div>
                          {message.tokenData.durationMs && (
                            <div className="token-tooltip-row">
                              <span>Duration:</span>
                              <span>{(message.tokenData.durationMs / 1000).toFixed(2)}s</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <img src={telliLogo} alt="Telli" width="32" height="32" />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    {activityLog.length > 0 && (
                      <div className="activity-panel">
                        <div className="activity-header" onClick={() => setShowActivityLog(!showActivityLog)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                          <span>Activity Log ({activityLog.length} lines)</span>
                        </div>
                        {showActivityLog && (
                          <div className="activity-log">
                            {activityLog.slice(-10).map((line, idx) => (
                              <div key={idx} className="activity-line">{line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            </>
          )}
        </div>

        <div className="input-container">
          {/* Slash Commands Panel */}
          {availableCommands.length > 0 && (
            <div className="commands-panel-wrapper">
              <button
                type="button"
                className="commands-panel-toggle"
                onClick={() => setShowCommandPanel(!showCommandPanel)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 9l-6 6 6 6M14 9l6 6-6 6" />
                </svg>
                Slash Commands ({availableCommands.length})
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{transform: showCommandPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showCommandPanel && (
                <div className="commands-panel">
                  <div className="commands-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Filter commands..."
                      value={commandFilter}
                      onChange={(e) => setCommandFilter(e.target.value)}
                    />
                    {commandFilter && (
                      <button
                        type="button"
                        className="clear-filter"
                        onClick={() => setCommandFilter('')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="commands-grid">
                    {availableCommands
                      .filter(command =>
                        !commandFilter ||
                        command.fullName.toLowerCase().includes(commandFilter.toLowerCase()) ||
                        command.description?.toLowerCase().includes(commandFilter.toLowerCase())
                      )
                      .map(command => (
                        <button
                          key={command.fullName}
                          type="button"
                          className="command-btn"
                          onClick={() => handleCommandClick(command)}
                          title={command.description}
                        >
                          <div className="command-btn-header">
                            <span className="command-name">{command.fullName}</span>
                            {command.argumentHint && (
                              <span className="command-args-hint">{command.argumentHint}</span>
                            )}
                          </div>
                          {command.description && (
                            <div className="command-description">{command.description}</div>
                          )}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills Panel */}
          {availableSkills.length > 0 && (
            <div className="commands-panel-wrapper">
              <button
                type="button"
                className="commands-panel-toggle"
                onClick={() => setShowSkillPanel(!showSkillPanel)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Skills ({availableSkills.length})
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{transform: showSkillPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showSkillPanel && (
                <div className="commands-panel">
                  <div className="commands-grid">
                    {availableSkills.map(skill => (
                      <div
                        key={skill.name}
                        className="command-btn skill-item"
                        title={skill.description}
                      >
                        <div className="command-btn-header">
                          <span className="command-name">{skill.name}</span>
                          <span className="skill-source">{skill.source}</span>
                        </div>
                        {skill.description && (
                          <div className="command-description">{skill.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-header">
              <button
                type="button"
                className={`permissions-toggle ${skipPermissions ? 'enabled' : 'disabled'}`}
                onClick={toggleSkipPermissions}
                title={skipPermissions ? 'Auto-approve enabled: Commands will run without asking' : 'Auto-approve disabled: Will ask for permission'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {skipPermissions ? (
                    <polyline points="20 6 9 17 4 12"/>
                  ) : (
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  )}
                </svg>
                <span>{skipPermissions ? 'Auto-approve' : 'Ask permission'}</span>
              </button>
              {selectedContext.size > 0 && (
                <button type="button" className="context-indicator" onClick={() => navigate('/files')} title={`${selectedContext.size} file(s) in context - click to manage`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  <span>{selectedContext.size} in context</span>
                </button>
              )}
              <div className="model-selector">
                <button
                  type="button"
                  className="model-selector-btn"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                >
                  <span>{MODELS.find(m => m.id === selectedModel)?.name || 'Sonnet 4.5'}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showModelDropdown && (
                  <div className="model-dropdown">
                    {MODELS.map(model => (
                      <div
                        key={model.id}
                        className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedModel(model.id)
                          setShowModelDropdown(false)
                        }}
                      >
                        <div className="model-option-header">
                          <span className="model-name">{model.name}</span>
                          {selectedModel === model.id && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <div className="model-description">{model.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {availableAgents.length > 0 && (
                <div className="model-selector agent-selector">
                  <button
                    type="button"
                    className="model-selector-btn"
                    onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  >
                    <span>{selectedAgent || 'No Agent'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {showAgentDropdown && (
                    <div className="model-dropdown">
                      <div
                        className={`model-option ${!selectedAgent ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedAgent(null)
                          setShowAgentDropdown(false)
                        }}
                      >
                        <div className="model-option-header">
                          <span className="model-name">No Agent</span>
                          {!selectedAgent && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <div className="model-description">Use default Claude behavior</div>
                      </div>
                      {availableAgents.map(agent => (
                        <div
                          key={agent.name}
                          className={`model-option ${selectedAgent === agent.name ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedAgent(agent.name)
                            setShowAgentDropdown(false)
                          }}
                        >
                          <div className="model-option-header">
                            <span className="model-name">{agent.name}</span>
                            {selectedAgent === agent.name && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </div>
                          <div className="model-description">{agent.description}</div>
                          <div className="agent-source">Source: {agent.source}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {isProcessing ? (
                <button type="button" onClick={handleCancel} className="cancel-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                  Cancel
                </button>
              ) : (
                <button type="submit" disabled={!input.trim() || !isConnected} className="send-btn-new">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  // Auto-resize textarea
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="How can I help you today?"
                rows={3}
                disabled={!isConnected || isProcessing}
              />
            </div>
          </form>

          {/* Command Hint */}
          {selectedCommandHint && (
            <div className="command-hint">
              <div className="command-hint-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span className="command-hint-name">{selectedCommandHint.name}</span>
                <button
                  type="button"
                  className="command-hint-close"
                  onClick={() => setSelectedCommandHint(null)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              {selectedCommandHint.argumentHint && (
                <div className="command-hint-args">
                  <strong>Arguments:</strong> {selectedCommandHint.argumentHint}
                </div>
              )}
              {selectedCommandHint.description && (
                <div className="command-hint-desc">{selectedCommandHint.description}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {showProjectManagement && (
        <ProjectManagement
          onClose={() => setShowProjectManagement(false)}
          currentProjectId={currentProject?.id || null}
          onProjectSelect={handleProjectSelect}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatView />} />
      <Route path="/chat/:conversationId" element={<ChatView />} />
      <Route path="/admin" element={<ChatView />} />
      <Route path="/files" element={<ChatView />} />
    </Routes>
  )
}

export default App