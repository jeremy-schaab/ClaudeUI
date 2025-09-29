# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A local web-based chat interface for Claude CLI that mimics the Claude.ai website experience. The application consists of a React frontend and Node.js backend that communicates with Claude CLI via child process execution.

## Architecture

### Three-Layer Communication Model

1. **Frontend (React + TypeScript + Vite)**: Chat UI that communicates via Socket.IO
2. **Backend (Node.js + Express + Socket.IO)**: Server that spawns Claude CLI processes
3. **Claude CLI**: Executed as child processes to handle user requests

### Key Components

- **App.tsx**: Main chat interface with Socket.IO client, conversation management, and UI state
- **Admin.tsx**: Admin panel for viewing conversation history and CLI call logs
- **server/index.js**: Express server with Socket.IO for real-time communication and REST API endpoints
- **server/database.js**: SQLite database layer using better-sqlite3 for conversations, messages, and CLI call logging

### Database Schema

Three main tables stored in `server/claude-cli.db`:
- **conversations**: Store chat sessions with title and timestamps
- **messages**: Store individual messages linked to conversations (user/assistant roles)
- **cli_calls**: Audit log of all Claude CLI executions with performance metrics, responses, and errors

## Development Commands

### Initial Setup

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Running the Application

**You must run both processes simultaneously:**

Terminal 1 - Backend:
```bash
cd server
npm start
```
Server runs on http://localhost:3001

Terminal 2 - Frontend:
```bash
npm run dev
```
Frontend runs on http://localhost:5173

### Build and Lint

```bash
# Build frontend for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm preview
```

## Important Implementation Details

### Socket.IO Communication Flow

1. Frontend connects to backend via Socket.IO on port 3001
2. User sends message → Frontend emits 'message' event with content
3. Backend spawns `claude chat` child process
4. User message written to Claude CLI stdin
5. Claude CLI stdout/stderr streamed back
6. Backend emits 'response' or 'error' event to frontend
7. Both user and assistant messages saved to database

### Database Integration

- Conversations created automatically on first message in a chat session
- All CLI calls logged with execution metadata (duration, exit code, success status)
- REST API provides access to conversation history and CLI call audit trail

### Port Configuration

- Backend: Port 3001 (configurable in `server/index.js:225`)
- Frontend: Port 5173 (Vite default, configurable in `vite.config.ts`)
- **Important**: When changing backend port, update Socket.IO connection URL in `src/App.tsx:43`

### State Management Pattern

- Conversation ID tracked in both state and ref (conversationIdRef) to handle async operations reliably
- Messages array stores full chat history in memory
- Connection status tracked for UI state management
- Processing state prevents concurrent message submissions

## Prerequisites

- Node.js v16+
- Claude CLI installed and available in system PATH
- Claude CLI must be configured before running the application

## Common Issues

- **"Disconnected" status**: Backend server not running on port 3001
- **"Failed to start Claude CLI"**: Claude CLI not in PATH or not properly configured
- **Port conflicts**: Change ports in both backend server and frontend Socket.IO connection URL