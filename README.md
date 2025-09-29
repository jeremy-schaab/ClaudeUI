# ClaudeUI

A modern, local web-based chat interface for Claude CLI that mimics the Claude.ai website experience with real-time streaming, conversation history, and admin monitoring capabilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)

## ✨ Features

- 🎨 **Modern Chat Interface** - Clean, responsive UI mimicking Claude.ai
- 💬 **Real-Time Streaming** - Live message streaming via Socket.IO
- 📝 **Rich Markdown Support** - Full markdown rendering with syntax highlighting
- 💾 **Conversation Persistence** - SQLite database for chat history
- 📊 **Admin Panel** - Monitor CLI calls, performance metrics, and audit trails
- 🔄 **Conversation Management** - Switch between conversations, view history
- ⚙️ **Settings Panel** - Manage API keys and configuration
- 🗑️ **Soft/Hard Delete** - Flexible conversation deletion options
- 🎯 **TypeScript** - Full type safety for better development experience

## 🏗️ Architecture

### Three-Layer Communication Model

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Vite)                   │
│  - Chat UI with Socket.IO client                        │
│  - Markdown rendering & syntax highlighting             │
│  - Conversation management                              │
└────────────────────┬────────────────────────────────────┘
                     │ Socket.IO (Port 5173 → 3001)
┌────────────────────▼────────────────────────────────────┐
│  Backend (Node.js + Express + Socket.IO)                │
│  - Real-time communication server                       │
│  - REST API endpoints                                   │
│  - Claude CLI process management                        │
└────────────────────┬────────────────────────────────────┘
                     │ Child Process
┌────────────────────▼────────────────────────────────────┐
│  Claude CLI                                             │
│  - Executed as child processes                          │
│  - Handles user requests                                │
└─────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Node.js** v16 or higher
- **Claude CLI** installed and configured
  - Must be available in system PATH
  - Must be configured with valid API credentials

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ClaudeUI

# Navigate to the claude-ui directory
cd claude-ui

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Running the Application

**You must run both processes simultaneously in separate terminals:**

#### Terminal 1 - Backend Server

```bash
cd claude-ui/server
npm start
```

Backend server starts on http://localhost:3001

#### Terminal 2 - Frontend Development Server

```bash
cd claude-ui
npm run dev
```

Frontend starts on http://localhost:5173

🎉 **Access the application at http://localhost:5173**

## 📁 Project Structure

```
ClaudeUI/
├── claude-ui/                  # Main application directory
│   ├── src/                    # Frontend source files
│   │   ├── App.tsx             # Main chat interface
│   │   ├── Admin.tsx           # Admin panel
│   │   ├── App.css             # Styles
│   │   └── main.tsx            # Entry point
│   ├── server/                 # Backend server
│   │   ├── index.js            # Express + Socket.IO server
│   │   ├── database.js         # SQLite database layer
│   │   └── claude-cli.db       # SQLite database (created at runtime)
│   ├── tests/                  # Playwright tests
│   ├── index.html              # HTML entry point
│   ├── package.json            # Frontend dependencies
│   └── vite.config.ts          # Vite configuration
├── CLAUDE.md                   # Claude Code instructions
└── README.md                   # This file
```

## 🛠️ Development

### Build Commands

```bash
# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm preview
```

### Testing

```bash
# Run Playwright tests
cd claude-ui/tests
npx playwright test
```

## 🗄️ Database Schema

The application uses SQLite with three main tables stored in `server/claude-cli.db`:

### conversations
Stores chat sessions with title and timestamps
- `id` (INTEGER PRIMARY KEY)
- `title` (TEXT)
- `created_at` (DATETIME)
- `deleted_at` (DATETIME)

### messages
Stores individual messages linked to conversations
- `id` (INTEGER PRIMARY KEY)
- `conversation_id` (INTEGER)
- `role` (TEXT) - 'user' or 'assistant'
- `content` (TEXT)
- `created_at` (DATETIME)

### cli_calls
Audit log of all Claude CLI executions
- `id` (INTEGER PRIMARY KEY)
- `conversation_id` (INTEGER)
- `command` (TEXT)
- `user_message` (TEXT)
- `response` (TEXT)
- `error` (TEXT)
- `duration_ms` (INTEGER)
- `exit_code` (INTEGER)
- `success` (BOOLEAN)
- `created_at` (DATETIME)

## 🔧 Configuration

### Port Configuration

- **Backend**: Port 3001 (configurable in `server/index.js:225`)
- **Frontend**: Port 5173 (Vite default, configurable in `vite.config.ts`)

⚠️ **Important**: When changing backend port, update Socket.IO connection URL in `src/App.tsx:43`

### CORS Configuration

CORS is configured in `server/index.js` for development. Adjust origins as needed for production deployment.

## 📦 Tech Stack

### Frontend
- **React** 19.1.1 - UI framework
- **TypeScript** 5.8.3 - Type safety
- **Vite** 7.1.7 - Build tool and dev server
- **Socket.IO Client** 4.8.1 - Real-time communication
- **react-markdown** 10.1.0 - Markdown rendering
- **react-syntax-highlighter** 15.6.6 - Code syntax highlighting
- **Axios** 1.12.2 - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express** 5.1.0 - Web server framework
- **Socket.IO** 4.8.1 - Real-time bidirectional communication
- **better-sqlite3** 12.4.1 - SQLite database
- **CORS** 2.8.5 - Cross-origin resource sharing

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Disconnected" status** | Backend server not running on port 3001. Start the backend server. |
| **"Failed to start Claude CLI"** | Claude CLI not in PATH or not configured. Verify installation with `claude --version` |
| **Port conflicts** | Change ports in both backend server and frontend Socket.IO connection URL |
| **Database errors** | Ensure the server directory is writable for SQLite database creation |
| **CORS issues** | Check CORS configuration in `server/index.js` if accessing from different origins |

### Verifying Claude CLI Installation

```bash
# Check if Claude CLI is installed
claude --version

# Test Claude CLI
claude chat
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ using React, TypeScript, Node.js, and Claude CLI