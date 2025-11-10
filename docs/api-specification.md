# Project Workspace Management - API Specification

## Base URL
`http://localhost:3001/api`

---

## Projects API

### 1. List All Projects
**GET** `/projects`

Returns all projects ordered by last accessed date.

**Response:**
```json
[
  {
    "id": 1,
    "name": "ClaudeUI",
    "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
    "description": "Local web-based chat interface for Claude CLI",
    "color": "#ec4899",
    "tags": ["web", "typescript", "react", "node"],
    "is_favorite": 1,
    "last_accessed": "2025-11-10T15:30:00.000Z",
    "created_at": "2025-11-01T10:00:00.000Z",
    "settings": {
      "default_model": "claude-sonnet-4-5-20250929"
    },
    "metadata": {
      "git_repo_url": "https://github.com/user/ClaudeUI",
      "language": "TypeScript",
      "framework": "React+Vite"
    },
    "conversation_count": 15,
    "preset_count": 3
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

---

### 2. Get Project by ID
**GET** `/projects/:id`

Returns a single project with full details.

**Parameters:**
- `id` (path, integer) - Project ID

**Response:**
```json
{
  "id": 1,
  "name": "ClaudeUI",
  "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
  "description": "Local web-based chat interface for Claude CLI",
  "color": "#ec4899",
  "tags": ["web", "typescript", "react"],
  "is_favorite": 1,
  "last_accessed": "2025-11-10T15:30:00.000Z",
  "created_at": "2025-11-01T10:00:00.000Z",
  "settings": {
    "default_model": "claude-sonnet-4-5-20250929"
  },
  "metadata": {
    "git_repo_url": "https://github.com/user/ClaudeUI",
    "language": "TypeScript"
  },
  "conversation_count": 15,
  "preset_count": 3
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Database error

---

### 3. Create New Project
**POST** `/projects`

Creates a new project.

**Request Body:**
```json
{
  "name": "My New Project",
  "path": "C:\\Users\\jschaab\\projects\\my-new-project",
  "description": "A cool new project",
  "color": "#10b981",
  "tags": ["python", "ml"],
  "is_favorite": false,
  "settings": {
    "default_model": "claude-opus-4-20250514"
  },
  "metadata": {
    "language": "Python",
    "framework": "FastAPI"
  }
}
```

**Required Fields:**
- `name` (string) - Project name
- `path` (string) - Absolute path to project directory

**Optional Fields:**
- `description` (string)
- `color` (string, hex color) - Default: `#6366f1`
- `tags` (array of strings)
- `is_favorite` (boolean) - Default: `false`
- `settings` (object) - Default: `{}`
- `metadata` (object) - Default: `{}`

**Response:**
```json
{
  "id": 2,
  "name": "My New Project",
  "path": "C:\\Users\\jschaab\\projects\\my-new-project",
  "description": "A cool new project",
  "color": "#10b981",
  "tags": ["python", "ml"],
  "is_favorite": 0,
  "last_accessed": "2025-11-10T15:35:00.000Z",
  "created_at": "2025-11-10T15:35:00.000Z",
  "settings": {
    "default_model": "claude-opus-4-20250514"
  },
  "metadata": {
    "language": "Python",
    "framework": "FastAPI"
  }
}
```

**Status Codes:**
- `201 Created` - Project created successfully
- `400 Bad Request` - Missing required fields or validation error
- `409 Conflict` - Project with this path already exists
- `500 Internal Server Error` - Database error

**Validation:**
- `name` must not be empty
- `path` must be absolute path
- `path` must be unique (no duplicates)
- `color` must be valid hex color (if provided)

---

### 4. Update Project
**PUT** `/projects/:id`

Updates an existing project.

**Parameters:**
- `id` (path, integer) - Project ID

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "color": "#f59e0b",
  "tags": ["updated", "tags"],
  "is_favorite": true,
  "settings": {
    "default_model": "claude-haiku-4-20250514"
  }
}
```

**Note:** Path cannot be updated to prevent breaking conversation links. To move a project, create a new one.

**Response:**
```json
{
  "id": 1,
  "name": "Updated Project Name",
  "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
  "description": "Updated description",
  "color": "#f59e0b",
  "tags": ["updated", "tags"],
  "is_favorite": 1,
  "last_accessed": "2025-11-10T15:40:00.000Z",
  "created_at": "2025-11-01T10:00:00.000Z",
  "settings": {
    "default_model": "claude-haiku-4-20250514"
  },
  "metadata": {
    "git_repo_url": "https://github.com/user/ClaudeUI"
  }
}
```

**Status Codes:**
- `200 OK` - Updated successfully
- `404 Not Found` - Project not found
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - Database error

---

### 5. Delete Project
**DELETE** `/projects/:id`

Deletes a project. Conversations linked to this project will have their `project_id` set to NULL (not deleted by default).

**Parameters:**
- `id` (path, integer) - Project ID

**Query Parameters:**
- `deleteConversations` (boolean, optional) - If `true`, also delete all conversations linked to this project. Default: `false`

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully",
  "conversationsAffected": 12
}
```

**Status Codes:**
- `200 OK` - Deleted successfully
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Database error

**Behavior:**
- Context presets are CASCADE deleted automatically (via foreign key)
- Conversations are preserved by default (project_id set to NULL)
- If `deleteConversations=true`, conversations and their messages are deleted

---

### 6. Auto-Detect Project
**POST** `/projects/detect`

Analyzes a directory path and returns suggested project metadata without creating a project.

**Request Body:**
```json
{
  "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI"
}
```

**Response:**
```json
{
  "suggested_name": "ClaudeUI",
  "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
  "description": "Auto-generated description",
  "suggested_color": "#6366f1",
  "detected_metadata": {
    "is_git_repo": true,
    "git_repo_url": "https://github.com/user/ClaudeUI.git",
    "language": "TypeScript",
    "framework": "React+Vite",
    "project_type": "web",
    "package_manager": "npm",
    "has_package_json": true,
    "has_tsconfig": true
  },
  "suggested_tags": ["web", "typescript", "react", "node"]
}
```

**Status Codes:**
- `200 OK` - Detection successful
- `400 Bad Request` - Invalid path
- `404 Not Found` - Path does not exist
- `500 Internal Server Error` - Detection error

**Detection Logic:**
- Check for `.git` folder → `is_git_repo`
- Parse `package.json` → detect Node.js, get name, dependencies
- Check for `tsconfig.json` → detect TypeScript
- Check for `.csproj`/`.sln` → detect C#/.NET
- Check for `requirements.txt`/`pyproject.toml` → detect Python
- Check for `go.mod` → detect Go
- Generate color hash from project name

---

### 7. Update Last Accessed
**PUT** `/projects/:id/access`

Updates the `last_accessed` timestamp for a project (used for "Recent Projects").

**Parameters:**
- `id` (path, integer) - Project ID

**Response:**
```json
{
  "success": true,
  "last_accessed": "2025-11-10T15:45:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Updated successfully
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Database error

---

### 8. Get Favorite Projects
**GET** `/projects/favorites`

Returns only favorite projects.

**Response:**
```json
[
  {
    "id": 1,
    "name": "ClaudeUI",
    "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
    "color": "#ec4899",
    "is_favorite": 1,
    "last_accessed": "2025-11-10T15:30:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

---

## Context Presets API

### 9. List Presets for Project
**GET** `/projects/:id/presets`

Returns all context presets for a specific project.

**Parameters:**
- `id` (path, integer) - Project ID

**Response:**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "name": "Full Stack",
    "description": "Includes both frontend and backend code",
    "file_patterns": ["claude-ui/src/**/*.tsx", "claude-ui/server/**/*.js"],
    "exclude_patterns": ["**/*.test.ts", "node_modules/**"],
    "explicit_files": ["claude-ui/package.json"],
    "is_default": 1,
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-05T14:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Database error

---

### 10. Get Preset by ID
**GET** `/presets/:id`

Returns a single context preset.

**Parameters:**
- `id` (path, integer) - Preset ID

**Response:**
```json
{
  "id": 1,
  "project_id": 1,
  "name": "Full Stack",
  "description": "Includes both frontend and backend code",
  "file_patterns": ["claude-ui/src/**/*.tsx", "claude-ui/server/**/*.js"],
  "exclude_patterns": ["**/*.test.ts", "node_modules/**"],
  "explicit_files": ["claude-ui/package.json"],
  "is_default": 1,
  "created_at": "2025-11-01T10:00:00.000Z",
  "updated_at": "2025-11-05T14:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Preset not found
- `500 Internal Server Error` - Database error

---

### 11. Create Context Preset
**POST** `/projects/:id/presets`

Creates a new context preset for a project.

**Parameters:**
- `id` (path, integer) - Project ID

**Request Body:**
```json
{
  "name": "Frontend Only",
  "description": "React components and styles",
  "file_patterns": ["src/**/*.tsx", "src/**/*.css"],
  "exclude_patterns": ["**/*.test.tsx"],
  "explicit_files": ["package.json", "vite.config.ts"],
  "is_default": false
}
```

**Required Fields:**
- `name` (string) - Preset name (must be unique within project)

**Optional Fields:**
- `description` (string)
- `file_patterns` (array of strings) - Glob patterns
- `exclude_patterns` (array of strings) - Exclusion globs
- `explicit_files` (array of strings) - Specific file paths
- `is_default` (boolean) - Default: `false`

**Response:**
```json
{
  "id": 2,
  "project_id": 1,
  "name": "Frontend Only",
  "description": "React components and styles",
  "file_patterns": ["src/**/*.tsx", "src/**/*.css"],
  "exclude_patterns": ["**/*.test.tsx"],
  "explicit_files": ["package.json", "vite.config.ts"],
  "is_default": 0,
  "created_at": "2025-11-10T16:00:00.000Z",
  "updated_at": "2025-11-10T16:00:00.000Z"
}
```

**Status Codes:**
- `201 Created` - Preset created successfully
- `400 Bad Request` - Missing name or invalid patterns
- `409 Conflict` - Preset name already exists in this project
- `500 Internal Server Error` - Database error

**Behavior:**
- If `is_default: true`, automatically unsets other presets' `is_default` flag

---

### 12. Update Context Preset
**PUT** `/presets/:id`

Updates an existing context preset.

**Parameters:**
- `id` (path, integer) - Preset ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "file_patterns": ["src/**/*.tsx"],
  "is_default": true
}
```

**Response:**
```json
{
  "id": 1,
  "project_id": 1,
  "name": "Updated Name",
  "description": "Updated description",
  "file_patterns": ["src/**/*.tsx"],
  "exclude_patterns": [],
  "explicit_files": [],
  "is_default": 1,
  "created_at": "2025-11-01T10:00:00.000Z",
  "updated_at": "2025-11-10T16:05:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Updated successfully
- `404 Not Found` - Preset not found
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - Database error

---

### 13. Delete Context Preset
**DELETE** `/presets/:id`

Deletes a context preset.

**Parameters:**
- `id` (path, integer) - Preset ID

**Response:**
```json
{
  "success": true,
  "message": "Preset deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Deleted successfully
- `404 Not Found` - Preset not found
- `500 Internal Server Error` - Database error

---

### 14. Apply Context Preset (Resolve Files)
**POST** `/presets/:id/apply`

Resolves glob patterns in a preset to actual file paths based on the root directory.

**Parameters:**
- `id` (path, integer) - Preset ID

**Request Body:**
```json
{
  "rootPath": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI"
}
```

**Response:**
```json
{
  "preset_id": 1,
  "preset_name": "Full Stack",
  "matched_files": [
    "claude-ui/src/App.tsx",
    "claude-ui/src/main.tsx",
    "claude-ui/src/Admin.tsx",
    "claude-ui/server/index.js",
    "claude-ui/server/database.js",
    "claude-ui/package.json"
  ],
  "file_count": 6,
  "patterns_used": {
    "file_patterns": ["claude-ui/src/**/*.tsx", "claude-ui/server/**/*.js"],
    "exclude_patterns": ["**/*.test.ts", "node_modules/**"],
    "explicit_files": ["claude-ui/package.json"]
  }
}
```

**Status Codes:**
- `200 OK` - Patterns resolved successfully
- `404 Not Found` - Preset not found
- `400 Bad Request` - Invalid rootPath or glob patterns
- `500 Internal Server Error` - Glob matching error

**Behavior:**
1. Apply `file_patterns` to find matching files
2. Exclude files matching `exclude_patterns`
3. Add `explicit_files` (absolute paths)
4. Return deduplicated list of file paths

**Performance:**
- Limit to 1000 files maximum (configurable)
- Timeout after 5 seconds (configurable)

---

## Modified Conversation Endpoints

### 15. List Conversations (with Project Filter)
**GET** `/conversations`

**Query Parameters:**
- `project_id` (integer, optional) - Filter conversations by project

**Examples:**
- `/api/conversations` - All conversations
- `/api/conversations?project_id=1` - Only conversations in project 1

**Response:**
```json
[
  {
    "id": 1,
    "title": "How to implement auth",
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-01T11:30:00.000Z",
    "project_id": 1,
    "project_name": "ClaudeUI",
    "project_color": "#ec4899",
    "hidden": 0
  }
]
```

---

### 16. Create Conversation (with Project Link)
**POST** `/conversations`

**Request Body:**
```json
{
  "title": "New conversation title",
  "project_id": 1,
  "selectedFiles": ["/path/to/file1.ts"],
  "model": "claude-sonnet-4-5-20250929"
}
```

**New Field:**
- `project_id` (integer, optional) - Link conversation to project

---

### 17. Update Conversation Project
**PUT** `/conversations/:id/project`

Assigns or changes the project for a conversation.

**Parameters:**
- `id` (path, integer) - Conversation ID

**Request Body:**
```json
{
  "project_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "conversation_id": 1,
  "project_id": 2
}
```

**Status Codes:**
- `200 OK` - Updated successfully
- `404 Not Found` - Conversation or project not found
- `500 Internal Server Error` - Database error

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong",
  "details": "Optional additional details or validation errors"
}
```

**Common Error Messages:**
- `"Project not found"` (404)
- `"Missing required field: name"` (400)
- `"Project with this path already exists"` (409)
- `"Invalid glob pattern: {pattern}"` (400)
- `"Database error"` (500)

---

## Notes

- All JSON fields with arrays (`tags`, `file_patterns`, etc.) are stored as JSON strings in SQLite
- All timestamps are in ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Paths use Windows-style backslashes (`\\`) when on Windows
- Colors must be valid hex colors in format `#RRGGBB`
- Glob patterns follow Node.js glob syntax (https://github.com/isaacs/node-glob)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-10
