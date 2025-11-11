# Claude CLI Tool Activity Logger

This directory contains a hook system for logging all tool usage when Claude CLI executes commands. This provides visibility into Claude's tool calls for monitoring, debugging, and auditing purposes.

## Overview

The tool activity logger captures two events for every tool call:
- **PreToolUse**: Logged before the tool executes (captures tool name and input parameters)
- **PostToolUse**: Logged after the tool completes (captures tool response and output)

All activity is logged to `tool_activity.jsonl` in JSON Lines format (one JSON object per line).

## Files

- **tool_logger.py**: Python script that receives hook events from Claude CLI and writes log entries
- **tool_activity.jsonl**: Log file containing all tool activity (gitignored)
- **README.md**: This documentation file

## Configuration

The hooks are configured in `.claude/settings.json` at the project root:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI\\.claude\\hooks\\tool_logger.py pre",
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
            "command": "python C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI\\.claude\\hooks\\tool_logger.py post",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

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

# Read all log entries
with open('.claude/hooks/tool_activity.jsonl', 'r', encoding='utf-8') as f:
    entries = [json.loads(line) for line in f]

# Filter by tool name
read_calls = [e for e in entries if e['tool_name'] == 'Read']

# Get only pre-execution entries
pre_entries = [e for e in entries if e['phase'] == 'pre']

# Count tool usage
from collections import Counter
tool_counts = Counter(e['tool_name'] for e in entries)
print(tool_counts.most_common(10))
```

### Using jq (if available)

```bash
# Get all Read tool calls
jq 'select(.tool_name == "Read")' .claude/hooks/tool_activity.jsonl

# Count tool usage
jq -r '.tool_name' .claude/hooks/tool_activity.jsonl | sort | uniq -c | sort -rn

# Get all errors (entries with tool_response containing "error")
jq 'select(.tool_response | contains("error"))' .claude/hooks/tool_activity.jsonl

# Get activity from the last hour
jq --arg cutoff $(date -u -d '1 hour ago' -Iseconds) 'select(.timestamp > $cutoff)' .claude/hooks/tool_activity.jsonl
```

### Using PowerShell

```powershell
# Read all entries
$entries = Get-Content .claude\hooks\tool_activity.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

# Count tool usage
$entries | Group-Object tool_name | Sort-Object Count -Descending | Select-Object Name, Count

# Get Read tool calls
$entries | Where-Object { $_.tool_name -eq 'Read' }

# Get entries from the last hour
$cutoff = (Get-Date).AddHours(-1)
$entries | Where-Object { [datetime]$_.timestamp -gt $cutoff }
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

The `tool_activity.jsonl` file grows over time. You may want to periodically:
- Archive old logs: `mv tool_activity.jsonl tool_activity_$(date +%Y%m%d).jsonl`
- Compress archives: `gzip tool_activity_*.jsonl`
- Delete old archives after analysis

## Privacy Note

Tool activity logs may contain sensitive information including:
- File paths and contents
- Command outputs
- API responses
- Code snippets

The log file is gitignored by default. Be careful when sharing or analyzing logs.
