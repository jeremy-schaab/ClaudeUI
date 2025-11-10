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
  setConversationSessionId,
  getConversation,
  getConversations,
  getVisibleConversationsOnly,
  getConversationsForProject,
  getAllConversationsAcrossAllProjects,
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
  deletePrompt,
  // API Configuration functions
  createApiConfig,
  updateApiConfigById,
  getApiConfig,
  getApiConfigByNameValue,
  getApiConfigs,
  getDefaultApiConfigValue,
  deleteApiConfig,
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
} = require('./database');

// Project detection module
const { detectProject } = require('./projectDetector');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST']
  }
});

// Track active Claude CLI processes per socket
const activeProcesses = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('message', (data) => {
    console.log('Received message:', data.content);
    console.log('Context files:', data.contextFiles);
    console.log('Model:', data.model);
    console.log('Conversation ID:', data.conversationId);

    const startTime = Date.now();

    // Get CLI settings from database
    const executionPath = getSettingValue('CLI_ROOT', process.cwd());
    const cliCommand = getSettingValue('CLI_COMMAND', 'claude');
    const cliArgs = getSettingValue('CLI_ARGS', 'chat');
    const skipPermissions = getSettingValue('SKIP_PERMISSIONS', 'false') === 'true';

    console.log('Using CLI settings:', { executionPath, cliCommand, cliArgs, skipPermissions });

    // Look up existing session ID if this is part of an ongoing conversation
    let existingSessionId = null;
    if (data.conversationId) {
      try {
        const conversation = getConversation(data.conversationId);
        if (conversation && conversation.cli_session_id) {
          existingSessionId = conversation.cli_session_id;
          console.log('Continuing conversation with session ID:', existingSessionId);
        }
      } catch (err) {
        console.error('Error looking up conversation session:', err);
      }
    }

    // Execute Claude CLI command with settings
    const args = cliArgs ? cliArgs.split(' ') : [];

    // Add --print and --output-format json for structured output with session ID
    if (!args.includes('--print')) {
      args.push('--print');
    }
    if (!args.includes('--output-format')) {
      args.push('--output-format', 'json');
    }

    // Add auto-approval flag if enabled
    if (skipPermissions && !args.includes('--dangerously-skip-permissions')) {
      args.push('--dangerously-skip-permissions');
      console.log('Auto-approval enabled: skipping permissions');
    }

    // Add model parameter if provided
    if (data.model) {
      args.push('--model', data.model);
      console.log('Adding --model flag:', data.model);
    }

    // Add session parameter if continuing existing conversation
    if (existingSessionId) {
      args.push('--session', existingSessionId);
      console.log('Adding --session flag:', existingSessionId);
    }

    console.log('Final CLI args:', args);

    const claude = spawn(cliCommand, args, {
      shell: true,
      cwd: executionPath
    });

    // Store the active process for this socket
    activeProcesses.set(socket.id, claude);

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

      // Emit real-time activity updates to frontend
      socket.emit('activity-update', { chunk: text, type: 'stdout' });
    });

    claude.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
      console.error('Claude error:', chunk.toString());

      // Emit real-time activity updates to frontend
      socket.emit('activity-update', { chunk: chunk.toString(), type: 'stderr' });
    });

    claude.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      console.log('Claude process exited with code:', code);

      // Remove from active processes
      activeProcesses.delete(socket.id);

      let actualResponse = response.trim();
      let tokenData = null;

      // Parse JSON response to extract session_id, result, and token usage
      try {
        const jsonResponse = JSON.parse(response);
        if (jsonResponse.session_id) {
          sessionId = jsonResponse.session_id;
          console.log('Captured session ID:', sessionId);
        }
        if (jsonResponse.result) {
          actualResponse = jsonResponse.result;
        }

        // Extract token usage data
        if (jsonResponse.usage || jsonResponse.modelUsage || jsonResponse.total_cost_usd) {
          tokenData = {
            inputTokens: jsonResponse.usage?.input_tokens || 0,
            outputTokens: jsonResponse.usage?.output_tokens || 0,
            cacheCreationTokens: jsonResponse.usage?.cache_creation_input_tokens || 0,
            cacheReadTokens: jsonResponse.usage?.cache_read_input_tokens || 0,
            totalCostUsd: jsonResponse.total_cost_usd || 0,
            modelUsage: jsonResponse.modelUsage || null,
            durationMs: jsonResponse.duration_ms || durationMs
          };
          console.log('Token data:', tokenData);
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
        // Save session ID to conversation if this is the first message or session ID changed
        if (sessionId && data.conversationId) {
          try {
            setConversationSessionId(data.conversationId, sessionId);
            console.log('Saved session ID to conversation:', data.conversationId, sessionId);
          } catch (err) {
            console.error('Failed to save session ID to conversation:', err);
          }
        }

        socket.emit('response', { content: actualResponse, sessionId: sessionId, tokenData: tokenData });
      } else {
        // Check if there's an API error in the JSON response
        let apiError = null;
        try {
          const jsonResponse = JSON.parse(response);
          if (jsonResponse.is_error && jsonResponse.result) {
            apiError = jsonResponse.result;
          }
        } catch (e) {
          // Not JSON or no API error
        }

        let errorMessage = '';

        if (apiError) {
          // Show API error directly
          errorMessage = '❌ **Claude API Error**\n\n';
          errorMessage += apiError;
          errorMessage += '\n\n💡 **This is an API error from Claude.** Check the model name and your API configuration.';
        } else {
          // Provide detailed error information
          errorMessage = '❌ **Claude CLI Error**\n\n';
          errorMessage += `**Exit Code:** ${code}\n\n`;
          errorMessage += `**Command:** \`${cliCommand} ${args.join(' ')}\`\n\n`;
          errorMessage += `**Working Directory:** ${executionPath}\n\n`;

          if (errorOutput) {
            errorMessage += `**Error Output (stderr):**\n\`\`\`\n${errorOutput}\n\`\`\`\n\n`;
          }

          if (response && response.trim() && !apiError) {
            errorMessage += `**Partial Output (stdout):**\n\`\`\`\n${response}\n\`\`\`\n\n`;
          }

          if (!errorOutput && !response) {
            errorMessage += '**No output captured from CLI process.**\n\n';
          }

          errorMessage += '💡 **Troubleshooting:**\n';
          errorMessage += '- Verify Claude CLI is installed and in PATH\n';
          errorMessage += '- Check that your API key is configured (`claude config`)\n';
          errorMessage += '- Try running the command directly in your terminal';
        }

        socket.emit('error', {
          error: errorMessage,
          exitCode: code,
          stderr: errorOutput,
          stdout: response
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

      // Provide detailed error information for spawn failures
      let errorMessage = '❌ **Failed to Start Claude CLI**\n\n';
      errorMessage += `**Error:** ${err.message}\n\n`;
      errorMessage += `**Command:** \`${cliCommand} ${args.join(' ')}\`\n\n`;
      errorMessage += `**Working Directory:** ${executionPath}\n\n`;
      errorMessage += '💡 **Troubleshooting:**\n';
      errorMessage += '- Ensure Claude CLI is installed: `npm install -g @anthropic-ai/claude-cli`\n';
      errorMessage += '- Verify it is in your PATH: `where claude` (Windows) or `which claude` (Mac/Linux)\n';
      errorMessage += '- Check that your API key is configured: `claude config`\n';
      errorMessage += '- Try restarting your terminal or system\n';
      errorMessage += '- Check that Node.js has permission to execute the CLI';

      socket.emit('error', {
        error: errorMessage,
        exitCode: -1,
        stderr: err.message
      });
    });
  });

  socket.on('cancel', () => {
    console.log('Cancel request received from:', socket.id);
    const process = activeProcesses.get(socket.id);
    if (process) {
      console.log('Killing active Claude CLI process');
      process.kill('SIGTERM');
      activeProcesses.delete(socket.id);
      socket.emit('cancelled', { message: 'Command cancelled' });
    } else {
      console.log('No active process to cancel');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Kill any active process when client disconnects
    const process = activeProcesses.get(socket.id);
    if (process) {
      console.log('Killing active process due to disconnect');
      process.kill('SIGTERM');
      activeProcesses.delete(socket.id);
    }
  });
});

// REST API endpoints

// Conversation endpoints
// Get visible conversations only (for user UI) - must come before /:id
app.get('/api/conversations/visible', (req, res) => {
  try {
    const projectId = req.query.project_id ? parseInt(req.query.project_id) : null;
    const conversations = getVisibleConversationsOnly(projectId);
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
    const { title, selectedFiles, model, project_id } = req.body;
    const projectId = project_id ? parseInt(project_id) : null;
    const id = createConversation(title, selectedFiles, model, projectId);
    res.json({ id, title, selectedFiles, model, project_id: projectId });
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
    const { role, content, tokenData } = req.body;
    const messageId = saveMessage(req.params.id, role, content, tokenData);
    res.json({ id: messageId, conversation_id: req.params.id, role, content, tokenData });
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

// POST endpoint for settings (same as PUT, for compatibility)
app.post('/api/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    setSetting(key, value);
    res.json({ success: true, key, value });
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

// Skills endpoint - list available skills from .claude/skills
app.get('/api/skills', (req, res) => {
  try {
    const rootPath = getSettingValue('CLI_ROOT', process.cwd());
    const projectSkillsPath = path.join(rootPath, '.claude', 'skills');
    const userSkillsPath = path.join(require('os').homedir(), '.claude', 'skills');

    const skills = [];

    // Helper to parse skill frontmatter from SKILL.md
    function parseSkill(skillDir, source) {
      try {
        const skillFilePath = path.join(skillDir, 'SKILL.md');

        // Check if SKILL.md exists
        if (!fs.existsSync(skillFilePath)) {
          return null;
        }

        const content = fs.readFileSync(skillFilePath, 'utf8');
        const lines = content.split(/\r?\n/);

        if (lines[0].trim() === '---') {
          const endIndex = lines.findIndex((line, idx) => idx > 0 && line.trim() === '---');
          if (endIndex > 0) {
            const frontmatter = lines.slice(1, endIndex);
            const skill = { source };

            for (const line of frontmatter) {
              const match = line.match(/^([a-zA-Z_-]+):\s*(.+)$/);
              if (match) {
                const [, key, value] = match;
                skill[key] = value.trim();
              }
            }

            if (skill.name) {
              return skill;
            }
          }
        }
      } catch (err) {
        console.error(`Error parsing skill ${skillDir}:`, err);
      }
      return null;
    }

    // Read project skills (.claude/skills)
    if (fs.existsSync(projectSkillsPath)) {
      const dirs = fs.readdirSync(projectSkillsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());

      for (const dir of dirs) {
        const skillDirPath = path.join(projectSkillsPath, dir.name);
        const skill = parseSkill(skillDirPath, 'project');
        if (skill) skills.push(skill);
      }
    }

    // Read user skills (~/.claude/skills)
    if (fs.existsSync(userSkillsPath)) {
      const dirs = fs.readdirSync(userSkillsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());

      for (const dir of dirs) {
        const skillDirPath = path.join(userSkillsPath, dir.name);
        const skill = parseSkill(skillDirPath, 'user');
        if (skill) {
          // Only add if not already defined at project level
          if (!skills.find(s => s.name === skill.name)) {
            skills.push(skill);
          }
        }
      }
    }

    res.json(skills);
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// ============================================================================
// Project Management API Endpoints
// ============================================================================

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    const { favorite, tag, limit, offset } = req.query;
    let projects = getProjects(favorite === 'true');

    // Filter by tag if provided
    if (tag) {
      projects = projects.filter(p => {
        if (!p.tags) return false;
        const tags = JSON.parse(p.tags);
        return tags.includes(tag);
      });
    }

    const total = projects.length;

    // Apply pagination
    const limitNum = limit ? parseInt(limit) : null;
    const offsetNum = offset ? parseInt(offset) : 0;
    if (limitNum) {
      projects = projects.slice(offsetNum, offsetNum + limitNum);
    }

    res.json({
      data: projects,
      meta: {
        total,
        count: projects.length,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch projects',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
  try {
    const project = getProjectStats(req.params.id);
    if (!project) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Project not found',
          timestamp: new Date().toISOString()
        }
      });
    }
    res.json({ data: project });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch project',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Create new project
app.post('/api/projects', (req, res) => {
  try {
    const { name, path: projectPath, description, color, tags, isFavorite, apiConfigId, settings, metadata } = req.body;

    if (!name || !projectPath) {
      return res.status(400).json({
        error: {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            name: name ? null : 'Name is required',
            path: projectPath ? null : 'Path is required'
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if project with this path already exists
    const existing = getProjectByPathValue(projectPath);
    if (existing) {
      return res.status(409).json({
        error: {
          status: 409,
          code: 'DUPLICATE_PROJECT',
          message: 'A project with this path already exists',
          timestamp: new Date().toISOString()
        }
      });
    }

    const id = createProject({
      name,
      path: projectPath,
      description,
      color,
      tags,
      isFavorite,
      apiConfigId,
      settings,
      metadata
    });

    const newProject = getProject(id);
    res.status(201).json({ data: newProject });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to create project',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update project
app.patch('/api/projects/:id', (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Project not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { name, description, color, tags, isFavorite, apiConfigId, settings, metadata, lastAccessed } = req.body;

    // If lastAccessed is being updated, use the special update function
    if (lastAccessed) {
      updateProjectAccess(req.params.id);
    }

    // Update other fields if provided
    if (name || description || color || tags !== undefined || isFavorite !== undefined ||
        apiConfigId !== undefined || settings !== undefined || metadata !== undefined) {
      updateProjectById(req.params.id, {
        name: name || project.name,
        description: description !== undefined ? description : project.description,
        color: color || project.color,
        tags: tags !== undefined ? tags : (project.tags ? JSON.parse(project.tags) : null),
        isFavorite: isFavorite !== undefined ? isFavorite : project.is_favorite,
        apiConfigId: apiConfigId !== undefined ? apiConfigId : project.api_config_id,
        settings: settings !== undefined ? settings : (project.settings ? JSON.parse(project.settings) : null),
        metadata: metadata !== undefined ? metadata : (project.metadata ? JSON.parse(project.metadata) : null)
      });
    }

    const updatedProject = getProject(req.params.id);
    res.json({ data: updatedProject });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to update project',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Project not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    deleteProject(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete project',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ============================================================================
// Context Preset API Endpoints
// ============================================================================

// Get all presets for a project
app.get('/api/projects/:projectId/presets', (req, res) => {
  try {
    const presets = getPresetsForProject(req.params.projectId);
    res.json({ data: presets });
  } catch (err) {
    console.error('Error fetching context presets:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch context presets',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get single preset
app.get('/api/projects/:projectId/presets/:id', (req, res) => {
  try {
    const preset = getContextPreset(req.params.id);
    if (!preset || preset.project_id != req.params.projectId) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Context preset not found',
          timestamp: new Date().toISOString()
        }
      });
    }
    res.json({ data: preset });
  } catch (err) {
    console.error('Error fetching context preset:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch context preset',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Create context preset
app.post('/api/projects/:projectId/presets', (req, res) => {
  try {
    const { name, description, filePatterns, excludePatterns, explicitFiles, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({
        error: {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Name is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const id = createContextPreset({
      projectId: req.params.projectId,
      name,
      description,
      filePatterns,
      excludePatterns,
      explicitFiles,
      isDefault
    });

    const newPreset = getContextPreset(id);
    res.status(201).json({ data: newPreset });
  } catch (err) {
    console.error('Error creating context preset:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to create context preset',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update context preset
app.patch('/api/projects/:projectId/presets/:id', (req, res) => {
  try {
    const preset = getContextPreset(req.params.id);
    if (!preset || preset.project_id != req.params.projectId) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Context preset not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { name, description, filePatterns, excludePatterns, explicitFiles, isDefault } = req.body;

    updateContextPresetById(req.params.id, {
      name: name || preset.name,
      description: description !== undefined ? description : preset.description,
      filePatterns: filePatterns !== undefined ? filePatterns : (preset.file_patterns ? JSON.parse(preset.file_patterns) : null),
      excludePatterns: excludePatterns !== undefined ? excludePatterns : (preset.exclude_patterns ? JSON.parse(preset.exclude_patterns) : null),
      explicitFiles: explicitFiles !== undefined ? explicitFiles : (preset.explicit_files ? JSON.parse(preset.explicit_files) : null),
      isDefault: isDefault !== undefined ? isDefault : preset.is_default
    });

    const updatedPreset = getContextPreset(req.params.id);
    res.json({ data: updatedPreset });
  } catch (err) {
    console.error('Error updating context preset:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to update context preset',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Delete context preset
app.delete('/api/projects/:projectId/presets/:id', (req, res) => {
  try {
    const preset = getContextPreset(req.params.id);
    if (!preset || preset.project_id != req.params.projectId) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Context preset not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    deleteContextPreset(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting context preset:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete context preset',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get resolved files for a preset (computed sub-resource)
app.get('/api/projects/:projectId/presets/:id/files', (req, res) => {
  try {
    const preset = getContextPreset(req.params.id);
    if (!preset || preset.project_id != req.params.projectId) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Context preset not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const project = getProject(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Project not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Parse preset patterns
    const filePatterns = preset.file_patterns ? JSON.parse(preset.file_patterns) : [];
    const excludePatterns = preset.exclude_patterns ? JSON.parse(preset.exclude_patterns) : [];
    const explicitFiles = preset.explicit_files ? JSON.parse(preset.explicit_files) : [];

    // Resolve files using glob patterns
    const glob = require('glob');
    const resolvedFiles = new Set(explicitFiles);

    // Add files matching patterns
    for (const pattern of filePatterns) {
      const matches = glob.sync(pattern, {
        cwd: project.path,
        ignore: excludePatterns,
        nodir: true
      });
      matches.forEach(file => resolvedFiles.add(file));
    }

    res.json({
      data: {
        preset_id: preset.id,
        preset_name: preset.name,
        files: Array.from(resolvedFiles),
        count: resolvedFiles.size
      }
    });
  } catch (err) {
    console.error('Error resolving preset files:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to resolve preset files',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ============================================================================
// API Configuration Endpoints
// ============================================================================

// Get all API configurations
app.get('/api/api-configs', (req, res) => {
  try {
    const { active } = req.query;
    const configs = getApiConfigs(active === 'true');

    // Never return api_key_value in responses - return status instead
    const sanitized = configs.map(config => {
      const { api_key_value, ...safe } = config;
      return {
        ...safe,
        api_key_status: api_key_value ? 'configured' : 'not_configured'
      };
    });

    res.json({ data: sanitized });
  } catch (err) {
    console.error('Error fetching API configurations:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch API configurations',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get single API configuration
app.get('/api/api-configs/:id', (req, res) => {
  try {
    const config = getApiConfig(req.params.id);
    if (!config) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'API configuration not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Never return api_key_value
    const { api_key_value, ...safe } = config;
    res.json({
      data: {
        ...safe,
        api_key_status: api_key_value ? 'configured' : 'not_configured'
      }
    });
  } catch (err) {
    console.error('Error fetching API configuration:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch API configuration',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Create API configuration
app.post('/api/api-configs', (req, res) => {
  try {
    const { name, provider, apiUrl, apiKeySource, apiKeyValue, authType, region, models,
            modelRefreshStrategy, connectionTimeout, maxRetries, extraHeaders, isActive, isDefault } = req.body;

    if (!name || !provider || !apiUrl || !apiKeySource) {
      return res.status(400).json({
        error: {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Required fields missing',
          details: {
            name: name ? null : 'Required',
            provider: provider ? null : 'Required',
            apiUrl: apiUrl ? null : 'Required',
            apiKeySource: apiKeySource ? null : 'Required'
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    const id = createApiConfig({
      name, provider, apiUrl, apiKeySource, apiKeyValue, authType, region, models,
      modelRefreshStrategy, connectionTimeout, maxRetries, extraHeaders, isActive, isDefault
    });

    const newConfig = getApiConfig(id);
    const { api_key_value, ...safe } = newConfig;

    res.status(201).json({
      data: {
        ...safe,
        api_key_status: api_key_value ? 'configured' : 'not_configured'
      }
    });
  } catch (err) {
    console.error('Error creating API configuration:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to create API configuration',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update API configuration
app.patch('/api/api-configs/:id', (req, res) => {
  try {
    const config = getApiConfig(req.params.id);
    if (!config) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'API configuration not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { name, provider, apiUrl, apiKeySource, apiKeyValue, authType, region, models,
            modelRefreshStrategy, connectionTimeout, maxRetries, extraHeaders, isActive, isDefault } = req.body;

    updateApiConfigById(req.params.id, {
      name: name || config.name,
      provider: provider || config.provider,
      apiUrl: apiUrl || config.api_url,
      apiKeySource: apiKeySource || config.api_key_source,
      apiKeyValue: apiKeyValue !== undefined ? apiKeyValue : config.api_key_value,
      authType: authType || config.auth_type,
      region: region !== undefined ? region : config.region,
      models: models !== undefined ? models : (config.models ? JSON.parse(config.models) : null),
      modelRefreshStrategy: modelRefreshStrategy || config.model_refresh_strategy,
      connectionTimeout: connectionTimeout || config.connection_timeout,
      maxRetries: maxRetries || config.max_retries,
      extraHeaders: extraHeaders !== undefined ? extraHeaders : (config.extra_headers ? JSON.parse(config.extra_headers) : null),
      isActive: isActive !== undefined ? isActive : config.is_active,
      isDefault: isDefault !== undefined ? isDefault : config.is_default
    });

    const updatedConfig = getApiConfig(req.params.id);
    const { api_key_value, ...safe } = updatedConfig;

    res.json({
      data: {
        ...safe,
        api_key_status: api_key_value ? 'configured' : 'not_configured'
      }
    });
  } catch (err) {
    console.error('Error updating API configuration:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to update API configuration',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Delete API configuration
app.delete('/api/api-configs/:id', (req, res) => {
  try {
    const config = getApiConfig(req.params.id);
    if (!config) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'API configuration not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    deleteApiConfig(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting API configuration:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete API configuration',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get effective API configuration for a project
app.get('/api/projects/:projectId/api-config', (req, res) => {
  try {
    const config = getEffectiveApiConfig(req.params.projectId);
    if (!config) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'NOT_FOUND',
          message: 'No API configuration found for this project',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { api_key_value, ...safe } = config;
    res.json({
      data: {
        ...safe,
        api_key_status: api_key_value ? 'configured' : 'not_configured'
      }
    });
  } catch (err) {
    console.error('Error fetching effective API configuration:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch API configuration',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ============================================================================
// Project Detection API
// ============================================================================

// Detect project type and metadata from filesystem path
app.post('/api/project-detections', (req, res) => {
  try {
    const { path: projectPath } = req.body;

    // Validate path is provided
    if (!projectPath) {
      return res.status(400).json({
        error: {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Path is required',
          details: {
            path: 'Path parameter is required'
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    // Security: validate path exists and is accessible
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'PATH_NOT_FOUND',
          message: 'Project path does not exist',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if path is actually a directory
    const stats = fs.statSync(projectPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({
        error: {
          status: 400,
          code: 'INVALID_PATH',
          message: 'Path must be a directory',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Perform project detection
    const detection = detectProject(projectPath);

    // Check if detection failed
    if (!detection.detected) {
      return res.status(400).json({
        error: {
          status: 400,
          code: 'DETECTION_FAILED',
          message: detection.error || 'Failed to detect project',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.status(201).json({ data: detection });
  } catch (err) {
    console.error('Error detecting project:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to detect project',
        details: err.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Folder browsing endpoint for folder picker
app.get('/api/browse-folders', (req, res) => {
  try {
    const currentPath = req.query.path || require('os').homedir();

    // Security: prevent path traversal attacks
    const resolvedPath = path.resolve(currentPath);

    // Check if path exists and is accessible
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'Path not found' });
    }

    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    // Read directory contents
    const items = fs.readdirSync(resolvedPath, { withFileTypes: true });

    const folders = items
      .filter(item => item.isDirectory() && !item.name.startsWith('.'))
      .map(item => ({
        name: item.name,
        path: path.join(resolvedPath, item.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Get parent directory
    const parentPath = path.dirname(resolvedPath);
    const isRoot = resolvedPath === parentPath;

    res.json({
      currentPath: resolvedPath,
      parentPath: isRoot ? null : parentPath,
      folders: folders
    });
  } catch (err) {
    console.error('Error browsing folders:', err);
    res.status(500).json({ error: 'Failed to browse folders', details: err.message });
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure Claude CLI is installed and available in PATH');
});