@echo off
echo Starting ClaudeUI...
echo.
echo This will open two terminal windows:
echo   1. Backend server (port 3001)
echo   2. Frontend dev server (port 5173)
echo.
echo Close both windows to stop the application.
echo.

REM Start backend server in new window
start "ClaudeUI Backend" cmd /k "cd claude-ui\server && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend dev server in new window
start "ClaudeUI Frontend" cmd /k "cd claude-ui && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ClaudeUI is running!
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the servers.
pause
