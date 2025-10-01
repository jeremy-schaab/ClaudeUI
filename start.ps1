# ClaudeUI Launcher Script
# This script starts both the backend and frontend servers

Write-Host "Starting ClaudeUI..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists in both frontend and backend
$frontendNodeModules = "claude-ui\node_modules"
$backendNodeModules = "claude-ui\server\node_modules"

if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location claude-ui
    npm install
    Set-Location ..
}

if (-not (Test-Path $backendNodeModules)) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location claude-ui\server
    npm install
    Set-Location ..\..
}

Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Cyan
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\claude-ui\server'; npm start" -PassThru

Start-Sleep -Seconds 3

Write-Host "Starting frontend dev server..." -ForegroundColor Cyan
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\claude-ui'; npm run dev" -PassThru

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "ClaudeUI is starting up!" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Press Ctrl+C to stop all servers..." -ForegroundColor Yellow
Write-Host ""

# Keep script running and handle cleanup
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "Shutting down servers..." -ForegroundColor Red
    if ($backend -and !$backend.HasExited) {
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontend -and !$frontend.HasExited) {
        Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "ClaudeUI stopped." -ForegroundColor Red
}
