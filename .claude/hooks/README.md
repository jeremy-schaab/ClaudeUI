# Claude CLI Tool Activity Logger

This directory contains a globally-installed hook system for logging all tool usage when Claude CLI executes commands. This provides visibility into Claude's tool calls for monitoring, debugging, and auditing purposes across all projects.

## Overview

The tool activity logger captures two events for every tool call:
- **PreToolUse**: Logged before the tool executes (captures tool name and input parameters)
- **PostToolUse**: Logged after the tool completes (captures tool response and output)

**Key Features:**
- **Global Installation**: Works across all projects automatically
- **Project-Specific Logs**: Each project gets its own log directory organized by project name
- **Centralized Storage**: All logs stored in `~/.claude/tool_logs/<project-name>/activity.jsonl`

## Files

### Project-Local Files (This Directory)
- **tool_logger.py**: Reference copy of the Python hook script
- **README.md**: This documentation file

### Global Installation Files
- **~/.claude/hooks/tool_logger.py**: The active hook script used by Claude CLI
- **~/.claude/settings.json**: Global hook configuration
- **~/.claude/tool_logs/**: Directory containing all project-specific logs

## Log Organization

Logs are organized by project name:
```
~/.claude/tool_logs/
├── ClaudeUI/
│   └── activity.jsonl
├── MyOtherProject/
│   └── activity.jsonl
└── unknown/
    └── activity.jsonl  (for commands run outside projects)
```

## Configuration

The hooks are configured globally in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python C:\\Users\\jschaab\\.claude\\hooks\\tool_logger.py pre",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python C:\\Users\\jschaab\\.claude\\hooks\\tool_logger.py post",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

## Installation

The hook is already installed globally. To install on another machine or update:

1. Copy the hook script to the global hooks directory:
   ```bash
   mkdir -p ~/.claude/hooks
   cp .claude/hooks/tool_logger.py ~/.claude/hooks/
   ```

2. Update `~/.claude/settings.json` to add the hooks configuration shown above.

3. The hook will now run automatically for all Claude CLI commands across all projects.

## Log Format

Each log entry is a JSON object with the following structure:

### PreToolUse Entry
```json
{
  "timestamp": "2025-11-11T14:32:15.123456",
  "phase": "pre",
  "tool_name": "Read",
  "tool_input": {
    "file_path": "/path/to/file.txt"
  },
  "project_dir": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI"
}
```

### PostToolUse Entry
```json
{
  "timestamp": "2025-11-11T14:32:15.456789",
  "phase": "post",
  "tool_name": "Read",
  "tool_input": {
    "file_path": "/path/to/file.txt"
  },
  "tool_response": "File contents here...",
  "project_dir": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI"
}
```

## Querying Logs

### Using Python

```python
import json
from pathlib import Path

# Get log file for a specific project
log_file = Path.home() / ".claude" / "tool_logs" / "ClaudeUI" / "activity.jsonl"

# Read all log entries
with open(log_file, 'r', encoding='utf-8') as f:
    entries = [json.loads(line) for line in f]

# Filter by tool name
read_calls = [e for e in entries if e['tool_name'] == 'Read']

# Get only pre-execution entries
pre_entries = [e for e in entries if e['phase'] == 'pre']

# Count tool usage
from collections import Counter
tool_counts = Counter(e['tool_name'] for e in entries)
print(tool_counts.most_common(10))

# Query across all projects
logs_dir = Path.home() / ".claude" / "tool_logs"
all_entries = []
for project_dir in logs_dir.iterdir():
    if project_dir.is_dir():
        log_file = project_dir / "activity.jsonl"
        if log_file.exists():
            with open(log_file, 'r', encoding='utf-8') as f:
                all_entries.extend([json.loads(line) for line in f])
```

### Using jq (if available)

```bash
# Get all Read tool calls for ClaudeUI project
jq 'select(.tool_name == "Read")' ~/.claude/tool_logs/ClaudeUI/activity.jsonl

# Count tool usage for ClaudeUI
jq -r '.tool_name' ~/.claude/tool_logs/ClaudeUI/activity.jsonl | sort | uniq -c | sort -rn

# Get all errors across all projects
find ~/.claude/tool_logs -name "activity.jsonl" -exec jq 'select(.tool_response | tostring | contains("error"))' {} \;

# Get activity from the last hour for all projects
find ~/.claude/tool_logs -name "activity.jsonl" -exec jq --arg cutoff $(date -u -d '1 hour ago' -Iseconds) 'select(.timestamp > $cutoff)' {} \;
```

### Using PowerShell

```powershell
# Read all entries for ClaudeUI project
$logFile = "$env:USERPROFILE\.claude\tool_logs\ClaudeUI\activity.jsonl"
$entries = Get-Content $logFile | ForEach-Object { $_ | ConvertFrom-Json }

# Count tool usage
$entries | Group-Object tool_name | Sort-Object Count -Descending | Select-Object Name, Count

# Get Read tool calls
$entries | Where-Object { $_.tool_name -eq 'Read' }

# Get entries from the last hour
$cutoff = (Get-Date).AddHours(-1)
$entries | Where-Object { [datetime]$_.timestamp -gt $cutoff }

# Query across all projects
$allEntries = @()
Get-ChildItem "$env:USERPROFILE\.claude\tool_logs" -Directory | ForEach-Object {
    $logFile = Join-Path $_.FullName "activity.jsonl"
    if (Test-Path $logFile) {
        $allEntries += Get-Content $logFile | ForEach-Object { $_ | ConvertFrom-Json }
    }
}
```

## How It Works

1. Claude CLI detects a tool call is about to execute
2. Claude CLI invokes the PreToolUse hook, passing JSON data via stdin:
   ```json
   {
     "tool_name": "Read",
     "tool_input": { "file_path": "/path/to/file.txt" },
     "session_info": { "project_dir": "..." }
   }
   ```
3. `tool_logger.py` receives the JSON, appends a log entry to `tool_activity.jsonl`
4. Tool executes normally
5. Claude CLI invokes the PostToolUse hook with tool response data
6. `tool_logger.py` logs the completion with response data

## Error Handling

The hook script is designed to fail gracefully:
- If the log file cannot be written, it exits with code 1 (non-blocking)
- If JSON parsing fails, it exits with code 1 (non-blocking)
- Errors are logged to stderr but do not interrupt Claude CLI execution

## Maintenance

Log files grow over time. You may want to periodically:

### Archive old logs
```bash
# Archive a specific project's logs
cd ~/.claude/tool_logs/ClaudeUI
mv activity.jsonl activity_$(date +%Y%m%d).jsonl

# Compress archives
gzip activity_*.jsonl
```

### Clean up old logs
```bash
# Delete logs older than 30 days for all projects
find ~/.claude/tool_logs -name "activity_*.jsonl.gz" -mtime +30 -delete

# View disk usage by project
du -sh ~/.claude/tool_logs/*
```

### PowerShell maintenance
```powershell
# Archive ClaudeUI logs
$date = Get-Date -Format "yyyyMMdd"
Move-Item "$env:USERPROFILE\.claude\tool_logs\ClaudeUI\activity.jsonl" `
          "$env:USERPROFILE\.claude\tool_logs\ClaudeUI\activity_$date.jsonl"

# View disk usage by project
Get-ChildItem "$env:USERPROFILE\.claude\tool_logs" -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    [PSCustomObject]@{
        Project = $_.Name
        SizeMB = [math]::Round($size, 2)
    }
}
```

## Privacy Note

Tool activity logs may contain sensitive information including:
- File paths and contents
- Command outputs
- API responses
- Code snippets

The global log directory (`~/.claude/tool_logs/`) is separate from project files and not committed to git. Be careful when sharing or analyzing logs.
