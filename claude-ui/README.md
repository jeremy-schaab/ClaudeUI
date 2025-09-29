# Claude Code UI

A local web-based chat interface for Claude CLI that mimics the Claude.ai website experience.

## Features

- 🎨 Claude.ai-inspired UI design
- 💬 Real-time chat interface
- 🔌 WebSocket communication
- 🖥️ Local Claude CLI execution
- ⚡ Built with React + TypeScript + Vite

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- [Claude CLI](https://github.com/anthropics/claude-code) installed and configured

## Installation

1. Navigate to the project directory:
```bash
cd claude-ui
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
cd ..
```

## Running the Application

You need to run both the backend server and the frontend application.

### Terminal 1 - Start the Backend Server

```bash
cd server
npm start
```

The server will start on `http://localhost:3001`

### Terminal 2 - Start the Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Ensure the connection status shows "Connected to Claude CLI"
3. Type your message in the input box at the bottom
4. Press Enter or click the send button
5. Claude CLI will process your request and respond

## Project Structure

```
claude-ui/
├── src/
│   ├── App.tsx          # Main React component with chat interface
│   ├── App.css          # Styling (Claude.ai-inspired)
│   ├── index.css        # Global styles
│   └── main.tsx         # React entry point
├── server/
│   ├── index.js         # Express + Socket.IO server
│   └── package.json     # Server dependencies
├── package.json         # Frontend dependencies
└── README.md           # This file
```

## How It Works

1. **Frontend (React)**: Provides a chat interface using Socket.IO client to communicate with the backend
2. **Backend (Node.js + Express + Socket.IO)**: Receives messages from the frontend and executes Claude CLI commands
3. **Claude CLI**: Processes the user's requests and returns responses

## Troubleshooting

### "Disconnected" status
- Ensure the backend server is running on port 3001
- Check the browser console for connection errors

### "Failed to start Claude CLI" error
- Verify Claude CLI is installed: `claude --version`
- Ensure Claude CLI is in your system PATH
- Check that Claude CLI is properly configured

### Port conflicts
- If port 3001 or 5173 is already in use, you can change them:
  - Backend: Edit `server/index.js` (line with `const PORT = 3001`)
  - Frontend: Uses Vite default (5173), check `vite.config.ts` to change

## Customization

### Change the server port
Edit `server/index.js`:
```javascript
const PORT = 3001; // Change to your preferred port
```

Also update the frontend connection in `src/App.tsx`:
```typescript
socketRef.current = io('http://localhost:3001'); // Update port here
```

### Modify Claude CLI command
Edit `server/index.js` to customize how Claude CLI is invoked:
```javascript
const claude = spawn('claude', ['chat'], {
  shell: true,
  cwd: process.cwd()
});
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Styling**: Custom CSS (Claude.ai-inspired)

## License

MIT