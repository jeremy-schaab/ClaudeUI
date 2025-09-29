const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { spawn } = require('child_process');
const {
  logCliCall,
  getAllCliCalls,
  getRecentCliCalls,
  getCliCallById,
  createConversation,
  updateConversationTitle,
  getConversation,
  getConversations,
  saveMessage,
  getMessages,
  getSettingValue,
  setSetting,
  getSettings
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

    const startTime = Date.now();

    // Get CLI settings from database
    const executionPath = getSettingValue('CLI_ROOT', process.cwd());
    const cliCommand = getSettingValue('CLI_COMMAND', 'claude');
    const cliArgs = getSettingValue('CLI_ARGS', 'chat');

    console.log('Using CLI settings:', { executionPath, cliCommand, cliArgs });

    // Execute Claude CLI command with settings
    const args = cliArgs ? cliArgs.split(' ') : [];
    const claude = spawn(cliCommand, args, {
      shell: true,
      cwd: executionPath
    });

    let response = '';
    let errorOutput = '';

    // Send the user's message to Claude CLI
    claude.stdin.write(data.content + '\n');
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

      // Log to database
      try {
        logCliCall({
          userMessage: data.content,
          cliCommand: cliCommand,
          cliArgs: cliArgs,
          executionPath: executionPath,
          response: response.trim(),
          error: errorOutput,
          exitCode: code,
          durationMs: durationMs,
          success: code === 0 && response.length > 0
        });
      } catch (err) {
        console.error('Failed to log CLI call to database:', err);
      }

      if (code === 0 && response) {
        socket.emit('response', { content: response.trim() });
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
          success: false
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
    const { title } = req.body;
    const id = createConversation(title);
    res.json({ id, title });
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.put('/api/conversations/:id', (req, res) => {
  try {
    const { title } = req.body;
    updateConversationTitle(req.params.id, title);
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

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure Claude CLI is installed and available in PATH');
});