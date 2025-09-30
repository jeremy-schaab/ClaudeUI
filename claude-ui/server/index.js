const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  logCliCall,
  getAllCliCalls,
  getRecentCliCalls,
  getCliCallById,
  createConversation,
  updateConversationTitle,
  getConversation,
  getConversations,
  getVisibleConversationsOnly,
  markConversationHidden,
  permanentlyDeleteConversation,
  saveMessage,
  getMessages,
  getSettingValue,
  setSetting,
  getSettings,
  createPrompt,
  updatePromptById,
  getPrompt,
  getPromptName,
  getPrompts,
  deletePrompt
} = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('message', (data) => {
    console.log('Received message:', data.content);
    console.log('Context files:', data.contextFiles);
    console.log('Model:', data.model);

    const startTime = Date.now();

    // Get CLI settings from database
    const executionPath = getSettingValue('CLI_ROOT', process.cwd());
    const cliCommand = getSettingValue('CLI_COMMAND', 'claude');
    const cliArgs = getSettingValue('CLI_ARGS', 'chat');

    console.log('Using CLI settings:', { executionPath, cliCommand, cliArgs });

    // Execute Claude CLI command with settings
    const args = cliArgs ? cliArgs.split(' ') : [];

    // Add --print and --output-format json for structured output with session ID
    if (!args.includes('--print')) {
      args.push('--print');
    }
    if (!args.includes('--output-format')) {
      args.push('--output-format', 'json');
    }

    // Add model parameter if provided
    if (data.model) {
      args.push('--model', data.model);
      console.log('Adding --model flag:', data.model);
    }

    console.log('Final CLI args:', args);

    const claude = spawn(cliCommand, args, {
      shell: true,
      cwd: executionPath
    });

    let response = '';
    let errorOutput = '';
    let sessionId = null;

    // Prepare message with context files if provided
    let messageToSend = data.content;
    if (data.contextFiles && data.contextFiles.length > 0) {
      const filesList = data.contextFiles.map(f => `- ${f}`).join('\n');
      messageToSend = `Please reference these files for context:\n${filesList}\n\nUser question: ${data.content}`;
      console.log('Including context files:', data.contextFiles);
    }

    // Send the user's message to Claude CLI
    claude.stdin.write(messageToSend + '\n');
    claude.stdin.end();

    claude.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      response += text;
      console.log('Claude output:', text);
    });

    claude.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
      console.error('Claude error:', chunk.toString());
    });

    claude.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      console.log('Claude process exited with code:', code);

      let actualResponse = response.trim();

      // Parse JSON response to extract session_id and result
      try {
        const jsonResponse = JSON.parse(response);
        if (jsonResponse.session_id) {
          sessionId = jsonResponse.session_id;
          console.log('Captured session ID:', sessionId);
        }
        if (jsonResponse.result) {
          actualResponse = jsonResponse.result;
        }
      } catch (parseErr) {
        // If not JSON, use response as-is
        console.log('Response is not JSON, using as-is');
      }

      // Log to database
      try {
        logCliCall({
          userMessage: data.content,
          cliCommand: cliCommand,
          cliArgs: cliArgs,
          executionPath: executionPath,
          response: actualResponse,
          error: errorOutput,
          exitCode: code,
          durationMs: durationMs,
          success: code === 0 && response.length > 0,
          contextFiles: data.contextFiles || [],
          fullStdin: messageToSend,
          model: data.model || null,
          cliSessionId: sessionId
        });
      } catch (err) {
        console.error('Failed to log CLI call to database:', err);
      }

      if (code === 0 && actualResponse) {
        socket.emit('response', { content: actualResponse, sessionId: sessionId });
      } else {
        socket.emit('error', {
          error: errorOutput || 'Failed to get response from Claude CLI'
        });
      }
    });

    claude.on('error', (err) => {
      const durationMs = Date.now() - startTime;
      console.error('Failed to start Claude CLI:', err);

      // Log error to database
      try {
        logCliCall({
          userMessage: data.content,
          cliCommand: cliCommand,
          cliArgs: cliArgs,
          executionPath: executionPath,
          response: '',
          error: err.message,
          exitCode: -1,
          durationMs: durationMs,
          success: false,
          contextFiles: data.contextFiles || [],
          fullStdin: messageToSend,
          model: data.model || null
        });
      } catch (dbErr) {
        console.error('Failed to log CLI call error to database:', dbErr);
      }

      socket.emit('error', {
        error: `Failed to start Claude CLI: ${err.message}. Make sure Claude CLI is installed and available in PATH.`
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API endpoints

// Conversation endpoints
// Get visible conversations only (for user UI) - must come before /:id
app.get('/api/conversations/visible', (req, res) => {
  try {
    const conversations = getVisibleConversationsOnly();
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching visible conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/conversations', (req, res) => {
  try {
    const conversations = getConversations();
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/conversations/:id', (req, res) => {
  try {
    const conversation = getConversation(req.params.id);
    if (conversation) {
      res.json(conversation);
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

app.post('/api/conversations', (req, res) => {
  try {
    const { title, selectedFiles, model } = req.body;
    const id = createConversation(title, selectedFiles, model);
    res.json({ id, title, selectedFiles, model });
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.put('/api/conversations/:id', (req, res) => {
  try {
    const { title, selectedFiles, model } = req.body;
    updateConversationTitle(req.params.id, title, selectedFiles, model);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating conversation:', err);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Message endpoints
app.get('/api/conversations/:id/messages', (req, res) => {
  try {
    const messages = getMessages(req.params.id);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/conversations/:id/messages', (req, res) => {
  try {
    const { role, content } = req.body;
    const messageId = saveMessage(req.params.id, role, content);
    res.json({ id: messageId, conversation_id: req.params.id, role, content });
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Hide conversation (soft delete for user UI)
app.put('/api/conversations/:id/hide', (req, res) => {
  try {
    markConversationHidden(req.params.id);
    res.json({ success: true, message: 'Conversation hidden' });
  } catch (err) {
    console.error('Error hiding conversation:', err);
    res.status(500).json({ error: 'Failed to hide conversation' });
  }
});

// Delete conversation permanently (admin only)
app.delete('/api/conversations/:id', (req, res) => {
  try {
    permanentlyDeleteConversation(req.params.id);
    res.json({ success: true, message: 'Conversation permanently deleted' });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// CLI call endpoints
app.get('/api/cli-calls', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const calls = getRecentCliCalls(limit);
    res.json(calls);
  } catch (err) {
    console.error('Error fetching CLI calls:', err);
    res.status(500).json({ error: 'Failed to fetch CLI calls' });
  }
});

app.get('/api/cli-calls/:id', (req, res) => {
  try {
    const call = getCliCallById(req.params.id);
    if (call) {
      res.json(call);
    } else {
      res.status(404).json({ error: 'CLI call not found' });
    }
  } catch (err) {
    console.error('Error fetching CLI call:', err);
    res.status(500).json({ error: 'Failed to fetch CLI call' });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  try {
    const settings = getSettings();
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.get('/api/settings/:key', (req, res) => {
  try {
    const value = getSettingValue(req.params.key);
    if (value !== null) {
      res.json({ key: req.params.key, value });
    } else {
      res.status(404).json({ error: 'Setting not found' });
    }
  } catch (err) {
    console.error('Error fetching setting:', err);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

app.put('/api/settings/:key', (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }
    setSetting(req.params.key, value);
    res.json({ success: true, key: req.params.key, value });
  } catch (err) {
    console.error('Error updating setting:', err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Get current working directory for CLI_ROOT suggestions
app.get('/api/current-directory', (req, res) => {
  try {
    res.json({ path: process.cwd() });
  } catch (err) {
    console.error('Error getting current directory:', err);
    res.status(500).json({ error: 'Failed to get current directory' });
  }
});

// Prompts endpoints
app.get('/api/prompts', (req, res) => {
  try {
    const prompts = getPrompts();
    res.json(prompts);
  } catch (err) {
    console.error('Error fetching prompts:', err);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

app.get('/api/prompts/:id', (req, res) => {
  try {
    const prompt = getPrompt(req.params.id);
    if (prompt) {
      res.json(prompt);
    } else {
      res.status(404).json({ error: 'Prompt not found' });
    }
  } catch (err) {
    console.error('Error fetching prompt:', err);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

app.get('/api/prompts/name/:name', (req, res) => {
  try {
    const prompt = getPromptName(req.params.name);
    if (prompt) {
      res.json(prompt);
    } else {
      res.status(404).json({ error: 'Prompt not found' });
    }
  } catch (err) {
    console.error('Error fetching prompt by name:', err);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

app.post('/api/prompts', (req, res) => {
  try {
    const { name, description, prompt_text, model } = req.body;
    if (!name || !prompt_text) {
      return res.status(400).json({ error: 'Name and prompt_text are required' });
    }
    const id = createPrompt(name, description || '', prompt_text, model || null);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error creating prompt:', err);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

app.put('/api/prompts/:id', (req, res) => {
  try {
    const { description, prompt_text, model } = req.body;
    if (!prompt_text) {
      return res.status(400).json({ error: 'prompt_text is required' });
    }
    updatePromptById(req.params.id, description || '', prompt_text, model || null);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating prompt:', err);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

app.delete('/api/prompts/:id', (req, res) => {
  try {
    deletePrompt(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting prompt:', err);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// Summarize file endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { content, fileName } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get the summarization prompt
    const promptData = getPromptName('file-summarization');
    if (!promptData) {
      return res.status(500).json({ error: 'Summarization prompt not found' });
    }

    // Build the full message
    const fullMessage = `${promptData.prompt_text}\n\nFile: ${fileName || 'Unknown'}\n\n\`\`\`\n${content}\n\`\`\``;

    // Get CLI settings
    const executionPath = getSettingValue('CLI_ROOT', process.cwd());
    const cliCommand = getSettingValue('CLI_COMMAND', 'claude');
    const cliArgs = getSettingValue('CLI_ARGS', 'chat');

    // Use model from prompt if specified, otherwise use default
    const model = promptData.model || getSettingValue('DEFAULT_MODEL', 'claude-sonnet-4-5-20250929');

    const args = cliArgs ? cliArgs.split(' ') : [];
    args.push('--print', '--output-format', 'json', '--model', model);

    console.log('Summarizing file:', fileName, 'with model:', model);

    const claude = spawn(cliCommand, args, {
      shell: true,
      cwd: executionPath
    });

    let response = '';
    let errorOutput = '';

    claude.stdin.write(fullMessage + '\n');
    claude.stdin.end();

    claude.stdout.on('data', (chunk) => {
      response += chunk.toString();
    });

    claude.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    claude.on('close', (code) => {
      if (code === 0 && response) {
        try {
          const jsonResponse = JSON.parse(response);
          const summary = jsonResponse.result || response;
          res.json({ summary });
        } catch (parseErr) {
          res.json({ summary: response.trim() });
        }
      } else {
        res.status(500).json({ error: errorOutput || 'Failed to summarize file' });
      }
    });

    claude.on('error', (err) => {
      console.error('Failed to start Claude CLI:', err);
      res.status(500).json({ error: 'Failed to start Claude CLI' });
    });

  } catch (err) {
    console.error('Error summarizing file:', err);
    res.status(500).json({ error: 'Failed to summarize file' });
  }
});

// Save summary endpoint
app.post('/api/save-summary', (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || !content) {
      return res.status(400).json({ error: 'Path and content are required' });
    }

    const rootPath = getSettingValue('CLI_ROOT', process.cwd());
    const fullPath = path.join(rootPath, filePath);

    // Create directories if they don't exist
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the summary to file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Summary saved to:', fullPath);

    res.json({ success: true, path: fullPath });
  } catch (err) {
    console.error('Error saving summary:', err);
    res.status(500).json({ error: 'Failed to save summary file' });
  }
});

// File tree endpoint
app.get('/api/files', (req, res) => {
  try {
    const rootPath = getSettingValue('CLI_ROOT', process.cwd());

    const allowedExtensions = ['.md', '.ps1', '.js', '.css', '.html', '.cs', '.razor'];
    const excludedDirs = ['node_modules', 'bin', 'obj'];

    function buildFileTree(dirPath, relativePath = '') {
      const entries = [];

      try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          const itemRelativePath = relativePath ? path.join(relativePath, item.name) : item.name;

          if (item.isDirectory()) {
            // Skip excluded directories
            if (excludedDirs.includes(item.name)) {
              continue;
            }

            const children = buildFileTree(itemPath, itemRelativePath);
            if (children.length > 0) {
              entries.push({
                name: item.name,
                path: itemRelativePath,
                type: 'directory',
                children: children
              });
            }
          } else if (item.isFile()) {
            const ext = path.extname(item.name);
            if (allowedExtensions.includes(ext)) {
              entries.push({
                name: item.name,
                path: itemRelativePath,
                type: 'file',
                extension: ext
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dirPath}:`, err);
      }

      // Sort: directories first, then files, both alphabetically
      return entries.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });
    }

    const fileTree = buildFileTree(rootPath);
    res.json({ root: rootPath, files: fileTree });
  } catch (err) {
    console.error('Error building file tree:', err);
    res.status(500).json({ error: 'Failed to build file tree' });
  }
});

// Read file content endpoint
app.get('/api/files/content', (req, res) => {
  try {
    const rootPath = getSettingValue('CLI_ROOT', process.cwd());
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const fullPath = path.join(rootPath, filePath);

    // Security check: ensure the path is within the root directory
    const normalizedPath = path.normalize(fullPath);
    const normalizedRoot = path.normalize(rootPath);
    if (!normalizedPath.startsWith(normalizedRoot)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ path: filePath, content });
  } catch (err) {
    console.error('Error reading file:', err);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Save file content endpoint
app.put('/api/files/content', (req, res) => {
  try {
    const rootPath = getSettingValue('CLI_ROOT', process.cwd());
    const { path: filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const fullPath = path.join(rootPath, filePath);

    // Security check: ensure the path is within the root directory
    const normalizedPath = path.normalize(fullPath);
    const normalizedRoot = path.normalize(rootPath);
    if (!normalizedPath.startsWith(normalizedRoot)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    res.json({ success: true, path: filePath });
  } catch (err) {
    console.error('Error saving file:', err);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Agents endpoint - list available agents from .claude/agents
app.get('/api/agents', (req, res) => {
  try {
    const rootPath = getSettingValue('CLI_ROOT', process.cwd());
    const projectAgentsPath = path.join(rootPath, '.claude', 'agents');
    const userAgentsPath = path.join(require('os').homedir(), '.claude', 'agents');

    const agents = [];

    // Helper to parse agent frontmatter
    function parseAgent(filePath, source) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/); // Handle both \n and \r\n

        if (lines[0].trim() === '---') {
          const endIndex = lines.findIndex((line, idx) => idx > 0 && line.trim() === '---');
          if (endIndex > 0) {
            const frontmatter = lines.slice(1, endIndex);
            const agent = { source };

            for (const line of frontmatter) {
              const match = line.match(/^([a-zA-Z_-]+):\s*(.+)$/);
              if (match) {
                const [, key, value] = match;
                agent[key] = value.trim();
              }
            }

            if (agent.name) {
              return agent;
            }
          }
        }
      } catch (err) {
        console.error(`Error parsing agent ${filePath}:`, err);
      }
      return null;
    }

    // Read project agents (.claude/agents)
    if (fs.existsSync(projectAgentsPath)) {
      const files = fs.readdirSync(projectAgentsPath).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const agent = parseAgent(path.join(projectAgentsPath, file), 'project');
        if (agent) agents.push(agent);
      }
    }

    // Read user agents (~/.claude/agents)
    if (fs.existsSync(userAgentsPath)) {
      const files = fs.readdirSync(userAgentsPath).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const agent = parseAgent(path.join(userAgentsPath, file), 'user');
        if (agent) {
          // Only add if not already defined at project level
          if (!agents.find(a => a.name === agent.name)) {
            agents.push(agent);
          }
        }
      }
    }

    res.json(agents);
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Slash commands endpoint - list available commands from .claude/commands
app.get('/api/slash-commands', (req, res) => {
  try {
    const rootPath = getSettingValue('CLI_ROOT', process.cwd());
    const commandsPath = path.join(rootPath, '.claude', 'commands');

    const commands = [];

    // Helper to parse command frontmatter and get namespaced name
    function parseCommand(filePath, relativePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/);

        const command = {
          relativePath: relativePath
        };

        // Parse frontmatter if it exists
        if (lines[0].trim() === '---') {
          const endIndex = lines.findIndex((line, idx) => idx > 0 && line.trim() === '---');
          if (endIndex > 0) {
            const frontmatter = lines.slice(1, endIndex);

            for (const line of frontmatter) {
              const match = line.match(/^([a-zA-Z_-]+):\s*(.+)$/);
              if (match) {
                const [, key, value] = match;
                // Convert kebab-case to camelCase for frontend
                const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                command[camelKey] = value.trim();
              }
            }
          }
        }

        // Generate command name from file path
        // .claude/commands/optimize.md -> /optimize
        // .claude/commands/frontend/component.md -> /frontend:component
        const pathWithoutExt = relativePath.replace(/\.md$/, '');
        const parts = pathWithoutExt.split(path.sep);

        if (parts.length === 1) {
          command.name = parts[0];
          command.fullName = `/${parts[0]}`;
        } else {
          // Namespaced command
          const namespace = parts.slice(0, -1).join(':');
          const cmdName = parts[parts.length - 1];
          command.name = cmdName;
          command.fullName = `/${namespace}:${cmdName}`;
        }

        // Use description from frontmatter or first non-empty line after frontmatter
        if (!command.description) {
          const contentStart = command.frontmatterEnd || 0;
          for (let i = contentStart; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('#')) {
              command.description = line.substring(0, 100);
              break;
            }
          }
        }

        return command;
      } catch (err) {
        console.error(`Error parsing command ${filePath}:`, err);
      }
      return null;
    }

    // Recursively read commands directory
    function readCommandsDir(dirPath, relativeBase = '') {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const itemRelative = relativeBase ? path.join(relativeBase, item.name) : item.name;

        if (item.isDirectory()) {
          readCommandsDir(itemPath, itemRelative);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          const command = parseCommand(itemPath, itemRelative);
          if (command) {
            commands.push(command);
          }
        }
      }
    }

    readCommandsDir(commandsPath);

    res.json(commands);
  } catch (err) {
    console.error('Error fetching slash commands:', err);
    res.status(500).json({ error: 'Failed to fetch slash commands' });
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure Claude CLI is installed and available in PATH');
});