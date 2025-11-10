# Project Workspace Management - RESTful API Specification

**Version:** 2.0.0
**Base URL:** `http://localhost:3001/api`

---

## REST Principles Applied

✅ **Resource-oriented URLs** - Resources are nouns, not verbs
✅ **Standard HTTP methods** - GET, POST, PUT, PATCH, DELETE used correctly
✅ **Proper status codes** - 200, 201, 204, 400, 404, 409, 500
✅ **Consistent nesting** - Sub-resources follow predictable patterns
✅ **Idempotency** - PUT and DELETE are idempotent
✅ **Filtering via query params** - Not mixing actions with resources

---

## Table of Contents

1. [Projects](#1-projects)
2. [Project Detections](#2-project-detections)
3. [Context Presets](#3-context-presets)
4. [Preset Files (Resolved)](#4-preset-files-resolved)
5. [Conversations](#5-conversations)
6. [Error Responses](#error-responses)

---

## 1. Projects

### 1.1 List All Projects

**`GET /api/projects`**

Retrieve all projects with optional filtering and sorting.

**Query Parameters:**
- `favorite` (boolean, optional) - Filter by favorite status
  - Example: `/api/projects?favorite=true`
- `tag` (string, optional, repeatable) - Filter by tags
  - Example: `/api/projects?tag=web&tag=typescript`
- `sort` (string, optional) - Sort field
  - Values: `name`, `created_at`, `last_accessed`
  - Default: `last_accessed`
- `order` (string, optional) - Sort order
  - Values: `asc`, `desc`
  - Default: `desc`

**Response: `200 OK`**
```json
{
  "data": [
    {
      "id": 1,
      "name": "ClaudeUI",
      "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
      "description": "Local web-based chat interface for Claude CLI",
      "color": "#ec4899",
      "tags": ["web", "typescript", "react", "node"],
      "is_favorite": true,
      "last_accessed": "2025-11-10T15:30:00.000Z",
      "created_at": "2025-11-01T10:00:00.000Z",
      "updated_at": "2025-11-10T15:30:00.000Z",
      "settings": {
        "default_model": "claude-sonnet-4-5-20250929"
      },
      "metadata": {
        "git_repo_url": "https://github.com/user/ClaudeUI",
        "language": "TypeScript",
        "framework": "React+Vite"
      },
      "_links": {
        "self": "/api/projects/1",
        "presets": "/api/projects/1/presets",
        "conversations": "/api/conversations?project_id=1"
      },
      "_counts": {
        "conversations": 15,
        "presets": 3
      }
    }
  ],
  "meta": {
    "total": 1,
    "count": 1
  }
}
```

---

### 1.2 Get Single Project

**`GET /api/projects/:id`**

Retrieve a specific project by ID.

**Path Parameters:**
- `id` (integer, required) - Project ID

**Response: `200 OK`**
```json
{
  "data": {
    "id": 1,
    "name": "ClaudeUI",
    "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
    "description": "Local web-based chat interface for Claude CLI",
    "color": "#ec4899",
    "tags": ["web", "typescript", "react"],
    "is_favorite": true,
    "last_accessed": "2025-11-10T15:30:00.000Z",
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-10T15:30:00.000Z",
    "settings": {
      "default_model": "claude-sonnet-4-5-20250929"
    },
    "metadata": {
      "git_repo_url": "https://github.com/user/ClaudeUI",
      "language": "TypeScript"
    },
    "_links": {
      "self": "/api/projects/1",
      "presets": "/api/projects/1/presets",
      "conversations": "/api/conversations?project_id=1"
    },
    "_counts": {
      "conversations": 15,
      "presets": 3
    }
  }
}
```

**Error Responses:**
- `404 Not Found` - Project does not exist

---

### 1.3 Create Project

**`POST /api/projects`**

Create a new project.

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
- `name` (string, 1-200 chars) - Project name
- `path` (string) - Absolute path to project directory (must be unique)

**Optional Fields:**
- `description` (string, max 1000 chars)
- `color` (string) - Hex color code (e.g., `#6366f1`)
- `tags` (array of strings)
- `is_favorite` (boolean) - Default: `false`
- `settings` (object) - Project-specific settings
- `metadata` (object) - Auto-detected or custom metadata

**Response: `201 Created`**
```json
{
  "data": {
    "id": 2,
    "name": "My New Project",
    "path": "C:\\Users\\jschaab\\projects\\my-new-project",
    "description": "A cool new project",
    "color": "#10b981",
    "tags": ["python", "ml"],
    "is_favorite": false,
    "last_accessed": "2025-11-10T15:35:00.000Z",
    "created_at": "2025-11-10T15:35:00.000Z",
    "updated_at": "2025-11-10T15:35:00.000Z",
    "settings": {
      "default_model": "claude-opus-4-20250514"
    },
    "metadata": {
      "language": "Python",
      "framework": "FastAPI"
    },
    "_links": {
      "self": "/api/projects/2",
      "presets": "/api/projects/2/presets",
      "conversations": "/api/conversations?project_id=2"
    }
  }
}
```

**Headers:**
```
Location: /api/projects/2
```

**Error Responses:**
- `400 Bad Request` - Validation error (missing required fields, invalid format)
- `409 Conflict` - Project with this path already exists

**Validation Rules:**
- `name` must not be empty
- `path` must be absolute
- `path` must be unique across all projects
- `color` must match `/^#[0-9A-Fa-f]{6}$/` if provided
- `tags` array items must be non-empty strings

---

### 1.4 Replace Project (Full Update)

**`PUT /api/projects/:id`**

Replace an entire project resource. All fields except `id`, `path`, `created_at` must be provided.

**Path Parameters:**
- `id` (integer, required) - Project ID

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
  "description": "Updated description",
  "color": "#f59e0b",
  "tags": ["updated", "tags"],
  "is_favorite": true,
  "settings": {
    "default_model": "claude-haiku-4-20250514"
  },
  "metadata": {
    "language": "TypeScript"
  }
}
```

**Note:** `path` cannot be changed (must match existing path). Included for idempotency.

**Response: `200 OK`**
```json
{
  "data": {
    "id": 1,
    "name": "Updated Project Name",
    "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
    "description": "Updated description",
    "color": "#f59e0b",
    "tags": ["updated", "tags"],
    "is_favorite": true,
    "last_accessed": "2025-11-10T15:40:00.000Z",
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-10T15:40:00.000Z",
    "settings": {
      "default_model": "claude-haiku-4-20250514"
    },
    "metadata": {
      "language": "TypeScript"
    },
    "_links": {
      "self": "/api/projects/1",
      "presets": "/api/projects/1/presets",
      "conversations": "/api/conversations?project_id=1"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error or path mismatch
- `404 Not Found` - Project does not exist

---

### 1.5 Update Project (Partial Update)

**`PATCH /api/projects/:id`**

Update specific fields of a project. Only include fields you want to change.

**Path Parameters:**
- `id` (integer, required) - Project ID

**Request Body (example - any subset of fields):**
```json
{
  "name": "New Name",
  "is_favorite": true,
  "last_accessed": "2025-11-10T16:00:00.000Z"
}
```

**Common Use Cases:**
- Update favorite status: `{"is_favorite": true}`
- Touch last_accessed: `{"last_accessed": "2025-11-10T16:00:00.000Z"}`
- Add tag: `{"tags": ["existing", "tag", "new-tag"]}`
- Update settings: `{"settings": {"default_model": "claude-opus-4-20250514"}}`

**Response: `200 OK`**
```json
{
  "data": {
    "id": 1,
    "name": "New Name",
    "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
    "description": "Updated description",
    "color": "#f59e0b",
    "tags": ["updated", "tags"],
    "is_favorite": true,
    "last_accessed": "2025-11-10T16:00:00.000Z",
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-10T16:00:00.000Z",
    "settings": {},
    "metadata": {},
    "_links": {
      "self": "/api/projects/1",
      "presets": "/api/projects/1/presets",
      "conversations": "/api/conversations?project_id=1"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid field values
- `404 Not Found` - Project does not exist

**Note:** `path` cannot be updated via PATCH. Attempting to change it returns `400 Bad Request`.

---

### 1.6 Delete Project

**`DELETE /api/projects/:id`**

Delete a project and optionally its conversations.

**Path Parameters:**
- `id` (integer, required) - Project ID

**Query Parameters:**
- `cascade` (string, optional) - What to delete
  - `none` (default) - Keep conversations, set their `project_id` to NULL
  - `conversations` - Delete conversations and messages

**Examples:**
- `DELETE /api/projects/1` - Delete project, keep conversations
- `DELETE /api/projects/1?cascade=conversations` - Delete project and all conversations

**Response: `200 OK`**
```json
{
  "data": {
    "deleted": true,
    "project_id": 1,
    "cascade": "none",
    "affected": {
      "conversations_orphaned": 12,
      "presets_deleted": 3
    }
  }
}
```

**Alternative Success Response: `204 No Content`**
(No body, just success status)

**Error Responses:**
- `404 Not Found` - Project does not exist
- `400 Bad Request` - Invalid cascade parameter

**Behavior:**
- Context presets are always CASCADE deleted (via foreign key)
- Conversations behavior depends on `cascade` parameter
- Operation is idempotent (deleting non-existent project returns 404 once, then subsequent deletes return 404)

---

## 2. Project Detections

**Resource:** Project detection results (ephemeral, not persisted)

### 2.1 Detect Project Metadata

**`POST /api/project-detections`**

Analyze a filesystem directory and automatically detect project type, language, framework, and metadata. Returns suggestions for project creation without actually creating the project.

**Request Body:**
```json
{
  "path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI\\claude-ui"
}
```

**Required Fields:**
- `path` (string) - Absolute path to project directory

**Response: `201 Created`**
```json
{
  "data": {
    "detected": true,
    "name": "claude-ui",
    "projectType": "nodejs",
    "language": "TypeScript",
    "framework": "React",
    "metadata": {
      "hasGit": false,
      "gitRemote": null,
      "packageManager": "npm",
      "mainLanguages": ["JavaScript", "TypeScript"],
      "frameworks": ["React"]
    },
    "suggestedColor": "#61dafb",
    "suggestedTags": ["nodejs", "react", "javascript", "typescript", "web", "frontend"]
  }
}
```

**Response Fields:**
- `detected` (boolean) - Whether detection succeeded
- `name` (string) - Detected project name (from package.json, .git, folder name)
- `projectType` (string) - Project type: `nodejs`, `dotnet`, `python`, `go`, `git`, `unknown`
- `language` (string) - Primary language detected
- `framework` (string, nullable) - Primary framework if detected
- `metadata` (object):
  - `hasGit` (boolean) - Git repository detected
  - `gitRemote` (string, nullable) - Git remote URL if available
  - `packageManager` (string, nullable) - npm, yarn, pnpm, pip, poetry, pipenv, nuget, go mod
  - `mainLanguages` (array) - All languages detected, sorted by prevalence
  - `frameworks` (array) - All frameworks detected
- `suggestedColor` (string) - Hex color based on framework/type
- `suggestedTags` (array) - Auto-generated tags for categorization

**Error Responses:**

`400 Bad Request` - Missing or invalid path
```json
{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "Path is required",
    "details": {
      "path": "Path parameter is required"
    },
    "timestamp": "2025-11-10T15:13:36.003Z"
  }
}
```

`404 Not Found` - Path does not exist
```json
{
  "error": {
    "status": 404,
    "code": "PATH_NOT_FOUND",
    "message": "Project path does not exist",
    "timestamp": "2025-11-10T15:13:36.003Z"
  }
}
```

`400 Bad Request` - Path is not a directory
```json
{
  "error": {
    "status": 400,
    "code": "INVALID_PATH",
    "message": "Path must be a directory",
    "timestamp": "2025-11-10T15:13:52.421Z"
  }
}
```

**Detection Algorithm (Priority Order):**

1. **Git Detection**
   - Check for `.git` directory
   - Extract remote URL via `git config --get remote.origin.url`
   - Parse project name from remote URL

2. **Node.js Detection**
   - Check for `package.json`
   - Extract name, version, description
   - Detect package manager: `package-lock.json` (npm), `yarn.lock` (yarn), `pnpm-lock.yaml` (pnpm)
   - Detect frameworks: React, Vue, Angular, Next.js, Express, NestJS, Svelte
   - Detect TypeScript from dependencies

3. **.NET Detection**
   - Check for `*.csproj` or `*.sln` files
   - Parse XML for target framework
   - Detect ASP.NET Core, Blazor, Console App, Windows App

4. **Python Detection**
   - Check for `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile`
   - Detect package manager: poetry, pipenv, pip
   - Detect frameworks: Django, Flask, FastAPI

5. **Go Detection**
   - Check for `go.mod`
   - Extract module name from first line

6. **Language Detection** (fallback)
   - Count files by extension (max depth 2)
   - Map extensions to languages (.ts → TypeScript, .py → Python, etc.)
   - Return sorted by prevalence

7. **Color & Tag Generation**
   - Assign color based on framework (React → `#61dafb`) or project type (Node.js → `#68a063`)
   - Generate tags from project type, frameworks, languages, categories

**Example Use Case:**

1. User browses to project directory in UI
2. Frontend calls `POST /api/project-detections` with path
3. Backend analyzes directory and returns suggestions
4. Frontend pre-fills project creation form with detected values
5. User reviews, modifies if needed, and creates project

**Supported Project Types:**
- **Node.js**: React, Vue, Angular, Next.js, Express, NestJS, Svelte
- **.NET**: ASP.NET Core, Blazor, Console Apps, WPF
- **Python**: Django, Flask, FastAPI
- **Go**: Standard Go projects with go.mod
- **Git**: Any Git repository

See `docs/implementation-phase2-summary.md` for complete detection algorithm details.

---

## 3. Context Presets

### 3.1 List Presets for Project

**`GET /api/projects/:projectId/presets`**

Retrieve all context presets for a specific project.

**Path Parameters:**
- `projectId` (integer, required) - Project ID

**Query Parameters:**
- `default` (boolean, optional) - Filter by default status
  - Example: `/api/projects/1/presets?default=true`

**Response: `200 OK`**
```json
{
  "data": [
    {
      "id": 1,
      "project_id": 1,
      "name": "Full Stack",
      "description": "Includes both frontend and backend code",
      "file_patterns": [
        "claude-ui/src/**/*.tsx",
        "claude-ui/server/**/*.js"
      ],
      "exclude_patterns": [
        "**/*.test.ts",
        "node_modules/**"
      ],
      "explicit_files": [
        "claude-ui/package.json"
      ],
      "is_default": true,
      "created_at": "2025-11-01T10:00:00.000Z",
      "updated_at": "2025-11-05T14:00:00.000Z",
      "_links": {
        "self": "/api/projects/1/presets/1",
        "project": "/api/projects/1",
        "files": "/api/projects/1/presets/1/files"
      }
    }
  ],
  "meta": {
    "project_id": 1,
    "total": 3,
    "count": 1
  }
}
```

**Error Responses:**
- `404 Not Found` - Project does not exist

---

### 3.2 Get Single Preset

**`GET /api/projects/:projectId/presets/:id`**

Retrieve a specific context preset.

**Path Parameters:**
- `projectId` (integer, required) - Project ID
- `id` (integer, required) - Preset ID

**Response: `200 OK`**
```json
{
  "data": {
    "id": 1,
    "project_id": 1,
    "name": "Full Stack",
    "description": "Includes both frontend and backend code",
    "file_patterns": [
      "claude-ui/src/**/*.tsx",
      "claude-ui/server/**/*.js"
    ],
    "exclude_patterns": [
      "**/*.test.ts",
      "node_modules/**"
    ],
    "explicit_files": [
      "claude-ui/package.json"
    ],
    "is_default": true,
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-05T14:00:00.000Z",
    "_links": {
      "self": "/api/projects/1/presets/1",
      "project": "/api/projects/1",
      "files": "/api/projects/1/presets/1/files"
    }
  }
}
```

**Error Responses:**
- `404 Not Found` - Project or preset does not exist
- `400 Bad Request` - Preset belongs to different project

---

### 3.3 Create Context Preset

**`POST /api/projects/:projectId/presets`**

Create a new context preset for a project.

**Path Parameters:**
- `projectId` (integer, required) - Project ID

**Request Body:**
```json
{
  "name": "Frontend Only",
  "description": "React components and styles",
  "file_patterns": [
    "src/**/*.tsx",
    "src/**/*.css"
  ],
  "exclude_patterns": [
    "**/*.test.tsx"
  ],
  "explicit_files": [
    "package.json",
    "vite.config.ts"
  ],
  "is_default": false
}
```

**Required Fields:**
- `name` (string, 1-100 chars) - Preset name (unique within project)

**Optional Fields:**
- `description` (string, max 500 chars)
- `file_patterns` (array of strings) - Glob patterns for inclusion
- `exclude_patterns` (array of strings) - Glob patterns for exclusion
- `explicit_files` (array of strings) - Specific relative file paths
- `is_default` (boolean) - If true, unsets other presets' default flag

**Response: `201 Created`**
```json
{
  "data": {
    "id": 2,
    "project_id": 1,
    "name": "Frontend Only",
    "description": "React components and styles",
    "file_patterns": [
      "src/**/*.tsx",
      "src/**/*.css"
    ],
    "exclude_patterns": [
      "**/*.test.tsx"
    ],
    "explicit_files": [
      "package.json",
      "vite.config.ts"
    ],
    "is_default": false,
    "created_at": "2025-11-10T16:00:00.000Z",
    "updated_at": "2025-11-10T16:00:00.000Z",
    "_links": {
      "self": "/api/projects/1/presets/2",
      "project": "/api/projects/1",
      "files": "/api/projects/1/presets/2/files"
    }
  }
}
```

**Headers:**
```
Location: /api/projects/1/presets/2
```

**Error Responses:**
- `400 Bad Request` - Validation error or invalid glob patterns
- `404 Not Found` - Project does not exist
- `409 Conflict` - Preset name already exists in this project

**Validation Rules:**
- `name` must be unique within the project
- Glob patterns validated for syntax (no ReDoS patterns)
- If `is_default: true`, automatically unset previous default

---

### 3.4 Update Preset (Partial)

**`PATCH /api/projects/:projectId/presets/:id`**

Update specific fields of a context preset.

**Path Parameters:**
- `projectId` (integer, required) - Project ID
- `id` (integer, required) - Preset ID

**Request Body (any subset):**
```json
{
  "name": "Updated Name",
  "is_default": true
}
```

**Response: `200 OK`**
```json
{
  "data": {
    "id": 1,
    "project_id": 1,
    "name": "Updated Name",
    "description": "Includes both frontend and backend code",
    "file_patterns": [
      "claude-ui/src/**/*.tsx",
      "claude-ui/server/**/*.js"
    ],
    "exclude_patterns": [],
    "explicit_files": [],
    "is_default": true,
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-10T16:05:00.000Z",
    "_links": {
      "self": "/api/projects/1/presets/1",
      "project": "/api/projects/1",
      "files": "/api/projects/1/presets/1/files"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Project or preset does not exist

---

### 3.5 Delete Preset

**`DELETE /api/projects/:projectId/presets/:id`**

Delete a context preset.

**Path Parameters:**
- `projectId` (integer, required) - Project ID
- `id` (integer, required) - Preset ID

**Response: `204 No Content`**
(No body)

**Alternative: `200 OK`**
```json
{
  "data": {
    "deleted": true,
    "preset_id": 1,
    "project_id": 1
  }
}
```

**Error Responses:**
- `404 Not Found` - Project or preset does not exist

---

## 4. Preset Files (Resolved)

**Resource:** Computed file list from preset patterns (ephemeral, not stored)

### 4.1 Get Resolved Files for Preset

**`GET /api/projects/:projectId/presets/:id/files`**

Get the list of actual files that match the preset's patterns. This is a computed resource.

**Path Parameters:**
- `projectId` (integer, required) - Project ID
- `id` (integer, required) - Preset ID

**Query Parameters:**
- `relative` (boolean, optional) - Return relative paths instead of absolute
  - Default: `true`
- `limit` (integer, optional) - Maximum files to return (1-1000)
  - Default: `1000`

**Response: `200 OK`**
```json
{
  "data": {
    "preset_id": 1,
    "preset_name": "Full Stack",
    "project_path": "C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI",
    "files": [
      "claude-ui/src/App.tsx",
      "claude-ui/src/main.tsx",
      "claude-ui/src/Admin.tsx",
      "claude-ui/server/index.js",
      "claude-ui/server/database.js",
      "claude-ui/package.json"
    ],
    "patterns_applied": {
      "included": [
        "claude-ui/src/**/*.tsx",
        "claude-ui/server/**/*.js"
      ],
      "excluded": [
        "**/*.test.ts",
        "node_modules/**"
      ],
      "explicit": [
        "claude-ui/package.json"
      ]
    },
    "_meta": {
      "total_matched": 6,
      "truncated": false,
      "limit": 1000,
      "execution_time_ms": 45
    }
  }
}
```

**Error Responses:**
- `404 Not Found` - Project or preset does not exist
- `400 Bad Request` - Invalid patterns or project path doesn't exist
- `408 Request Timeout` - Pattern matching exceeded 5 second timeout
- `422 Unprocessable Entity` - Too many files matched (> 10,000)

**Performance Notes:**
- Results are computed on-demand (not cached)
- Maximum execution time: 5 seconds
- Returns error if > 10,000 files match
- Consider pagination for very large projects

---

## 5. Conversations

### 5.1 List Conversations

**`GET /api/conversations`**

Retrieve conversations with optional filtering.

**Query Parameters:**
- `project_id` (integer, optional) - Filter by project
- `hidden` (boolean, optional) - Include hidden conversations
  - Default: `false` (only visible)
- `limit` (integer, optional) - Number of results (1-100)
  - Default: `20`
- `offset` (integer, optional) - Pagination offset
  - Default: `0`

**Examples:**
- `/api/conversations` - All visible conversations (no project filter)
- `/api/conversations?project_id=1` - Conversations in project 1
- `/api/conversations?project_id=1&hidden=true` - Include hidden

**Response: `200 OK`**
```json
{
  "data": [
    {
      "id": 1,
      "title": "How to implement auth",
      "project_id": 1,
      "selected_files": ["/path/to/file.ts"],
      "model": "claude-sonnet-4-5-20250929",
      "hidden": false,
      "created_at": "2025-11-01T10:00:00.000Z",
      "updated_at": "2025-11-01T11:30:00.000Z",
      "_links": {
        "self": "/api/conversations/1",
        "messages": "/api/conversations/1/messages",
        "project": "/api/projects/1"
      },
      "_embedded": {
        "project": {
          "id": 1,
          "name": "ClaudeUI",
          "color": "#ec4899"
        }
      }
    }
  ],
  "meta": {
    "total": 50,
    "count": 1,
    "limit": 20,
    "offset": 0
  },
  "_links": {
    "self": "/api/conversations?project_id=1",
    "next": "/api/conversations?project_id=1&offset=20"
  }
}
```

---

### 5.2 Get Single Conversation

**`GET /api/conversations/:id`**

Retrieve a specific conversation.

**Path Parameters:**
- `id` (integer, required) - Conversation ID

**Response: `200 OK`**
```json
{
  "data": {
    "id": 1,
    "title": "How to implement auth",
    "project_id": 1,
    "selected_files": ["/path/to/file.ts"],
    "model": "claude-sonnet-4-5-20250929",
    "cli_session_id": "abc123",
    "hidden": false,
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-01T11:30:00.000Z",
    "_links": {
      "self": "/api/conversations/1",
      "messages": "/api/conversations/1/messages",
      "project": "/api/projects/1"
    }
  }
}
```

**Error Responses:**
- `404 Not Found` - Conversation does not exist

---

### 5.3 Create Conversation

**`POST /api/conversations`**

Create a new conversation.

**Request Body:**
```json
{
  "title": "New conversation",
  "project_id": 1,
  "selected_files": ["/src/auth.ts", "/src/user.ts"],
  "model": "claude-sonnet-4-5-20250929"
}
```

**Required Fields:**
- `title` (string, 1-200 chars)

**Optional Fields:**
- `project_id` (integer) - Link to project
- `selected_files` (array of strings) - File paths in context
- `model` (string) - Claude model ID

**Response: `201 Created`**
```json
{
  "data": {
    "id": 15,
    "title": "New conversation",
    "project_id": 1,
    "selected_files": ["/src/auth.ts", "/src/user.ts"],
    "model": "claude-sonnet-4-5-20250929",
    "hidden": false,
    "created_at": "2025-11-10T16:10:00.000Z",
    "updated_at": "2025-11-10T16:10:00.000Z",
    "_links": {
      "self": "/api/conversations/15",
      "messages": "/api/conversations/15/messages",
      "project": "/api/projects/1"
    }
  }
}
```

**Headers:**
```
Location: /api/conversations/15
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Referenced project_id does not exist

---

### 5.4 Update Conversation

**`PATCH /api/conversations/:id`**

Update specific fields of a conversation (including changing project).

**Path Parameters:**
- `id` (integer, required) - Conversation ID

**Request Body (any subset):**
```json
{
  "title": "Updated title",
  "project_id": 2,
  "hidden": true
}
```

**Common Use Cases:**
- Change title: `{"title": "New title"}`
- Move to different project: `{"project_id": 2}`
- Remove project link: `{"project_id": null}`
- Hide conversation: `{"hidden": true}`

**Response: `200 OK`**
```json
{
  "data": {
    "id": 1,
    "title": "Updated title",
    "project_id": 2,
    "selected_files": ["/path/to/file.ts"],
    "model": "claude-sonnet-4-5-20250929",
    "hidden": true,
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-10T16:15:00.000Z",
    "_links": {
      "self": "/api/conversations/1",
      "messages": "/api/conversations/1/messages",
      "project": "/api/projects/2"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Conversation or referenced project does not exist

---

### 5.5 Delete Conversation

**`DELETE /api/conversations/:id`**

Soft delete (hide) a conversation by default. Use query parameter for hard delete.

**Path Parameters:**
- `id` (integer, required) - Conversation ID

**Query Parameters:**
- `permanent` (boolean, optional) - Permanently delete (not just hide)
  - Default: `false`

**Examples:**
- `DELETE /api/conversations/1` - Soft delete (hide)
- `DELETE /api/conversations/1?permanent=true` - Hard delete

**Response: `204 No Content`**
(No body)

**Alternative: `200 OK`**
```json
{
  "data": {
    "deleted": true,
    "conversation_id": 1,
    "permanent": false,
    "messages_affected": 25
  }
}
```

**Error Responses:**
- `404 Not Found` - Conversation does not exist

**Behavior:**
- Soft delete: Sets `hidden = 1`
- Hard delete: Deletes conversation and all messages (CASCADE)

---

## Error Responses

All error responses follow this consistent format:

```json
{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for one or more fields",
    "details": {
      "name": "Name is required and must not be empty",
      "path": "Path must be an absolute path"
    },
    "timestamp": "2025-11-10T16:20:00.000Z",
    "request_id": "req_abc123"
  }
}
```

### Standard Error Codes

| HTTP Status | Code | Description |
|------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `INVALID_PATTERN` | Invalid glob pattern |
| 400 | `PATH_MISMATCH` | Provided path doesn't match existing |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists (duplicate) |
| 408 | `TIMEOUT` | Request processing timeout |
| 422 | `UNPROCESSABLE_ENTITY` | Valid request but cannot process |
| 500 | `INTERNAL_ERROR` | Server error |

### HTTP Status Codes Summary

- **200 OK** - Successful GET, PUT, PATCH
- **201 Created** - Successful POST (resource created)
- **204 No Content** - Successful DELETE (no body returned)
- **400 Bad Request** - Validation error, malformed request
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Duplicate resource (e.g., path already exists)
- **408 Request Timeout** - Operation took too long
- **422 Unprocessable Entity** - Valid syntax but semantically incorrect
- **500 Internal Server Error** - Server-side error

---

## HATEOAS & Hypermedia

This API follows HATEOAS (Hypermedia as the Engine of Application State) principles:

- All resources include `_links` with related resource URLs
- Some resources include `_embedded` for related data
- Actions are suggested via `_actions` (e.g., project detection)
- Clients can navigate the API by following links

---

## Versioning

**Current Version:** 2.0.0

**Version Header (future):**
```
Accept: application/vnd.claudeui.v2+json
```

For now, version is embedded in base URL: `/api/v2/projects` (optional)

---

## Rate Limiting (Future)

Response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699999999
```

---

## Changes from v1.0

❌ **Removed Non-RESTful Endpoints:**
- `POST /api/projects/detect` → `POST /api/project-detections`
- `PUT /api/projects/:id/access` → `PATCH /api/projects/:id`
- `PUT /api/conversations/:id/project` → `PATCH /api/conversations/:id`
- `POST /api/presets/:id/apply` → `GET /api/projects/:projectId/presets/:id/files`

✅ **Improved:**
- Consistent nested resource structure
- Proper use of PATCH vs PUT
- Query parameters for filtering (not endpoints)
- Hypermedia links (_links, _embedded)
- Proper status codes (201, 204)
- Location headers on resource creation

---

**Last Updated:** 2025-11-10
**Maintained By:** ClaudeUI Project
