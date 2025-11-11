#!/usr/bin/env python3
"""
Tool Activity Logger Hook

Logs all tool usage to a JSONL file for monitoring and debugging.
This hook captures both PreToolUse and PostToolUse events.

Usage:
  python tool_logger.py pre   # Log before tool execution
  python tool_logger.py post  # Log after tool execution
"""

import json
import sys
from pathlib import Path
from datetime import datetime


def get_log_file():
    """Get the tool activity log file path"""
    hooks_dir = Path(__file__).parent
    return hooks_dir / "tool_activity.jsonl"


def log_tool_activity(phase):
    """
    Log tool activity to JSONL file

    Args:
        phase: "pre" or "post" indicating before/after tool execution
    """
    try:
        # Read JSON input from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            # No input, exit silently
            sys.exit(0)

        # Parse tool data
        tool_data = json.loads(input_data)

        # Create log entry
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "phase": phase,
            "tool_name": tool_data.get("tool_name"),
            "tool_input": tool_data.get("tool_input"),
        }

        # Add tool response for post-execution logs
        if phase == "post":
            log_entry["tool_response"] = tool_data.get("tool_response")

        # Add session info if available
        if "session_info" in tool_data:
            log_entry["project_dir"] = tool_data["session_info"].get("project_dir")

        # Append to log file (JSONL format - one JSON object per line)
        log_file = get_log_file()
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')

        # Silent success (exit 0)
        sys.exit(0)

    except json.JSONDecodeError as e:
        # Invalid JSON input - fail silently
        print(f"Tool logger: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        # General error - fail silently (non-blocking)
        print(f"Tool logger error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    # Get phase from command line argument
    phase = sys.argv[1] if len(sys.argv) > 1 else "pre"

    # Validate phase
    if phase not in ["pre", "post"]:
        print(f"Tool logger: Invalid phase '{phase}'. Must be 'pre' or 'post'", file=sys.stderr)
        sys.exit(1)

    log_tool_activity(phase)
