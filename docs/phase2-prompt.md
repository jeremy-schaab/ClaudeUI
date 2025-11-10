# Phase 2: Project Auto-Detection Implementation Prompt

## Context

You are implementing Phase 2 of the Project Workspace Management feature for ClaudeUI, a local web-based chat interface for Claude CLI. **Phase 1 (Database & Backend Foundation) is complete** with all database tables, CRUD functions, and REST API endpoints implemented and tested.

## Project Overview

**ClaudeUI** is a three-layer architecture:
1. **Frontend**: React + TypeScript + Vite (port 5173)
2. **Backend**: Node.js + Express + Socket.IO (port 3001)
3. **Claude CLI**: Spawned as child processes

**Key Files:**
- `claude-ui/server/index.js` - Express server with REST API endpoints
- `claude-ui/server/database.js` - SQLite database with better-sqlite3
- `claude-ui/src/App.tsx` - Main React application

## Phase 1 Completion Summary

### Database Schema (Already Implemented)
```sql
-- Three tables created and indexed:
CREATE TABLE api_configurations (...)  -- Multi-provider API configs
CREATE TABLE projects (...)            -- Project workspaces
CREATE TABLE context_presets (...)     -- Reusable file selection patterns
ALTER TABLE conversations ADD COLUMN project_id INTEGER;
```

### REST API Endpoints (Already Implemented)
- **17 endpoints** for projects, presets, and API configs
- All follow REST best practices (GET/POST/PATCH/DELETE)
- See `docs/api-specification-rest.md` for full specification

### Current Database State
- Default project created: "Default Project" (ID: 1)
- Default API config: "Anthropic Direct (Default)" (ID: 1)
- 23 existing conversations linked to default project

## Your Task: Phase 2 - Project Auto-Detection

Implement a **project detection system** that automatically identifies project types and extracts metadata from filesystem paths.

### Requirements

#### 1. Create Project Detector Module
**File**: `claude-ui/server/projectDetector.js`

**Core Function**:
```javascript
/**
 * Detects project type and metadata from a filesystem path
 * @param {string} projectPath - Absolute path to project directory
 * @returns {Object} Detection result
 */
function detectProject(projectPath) {
  return {
    detected: true,
    name: "My Awesome App",           // Extracted from package.json, .git, or folder name
    projectType: "nodejs",             // nodejs, dotnet, python, go, git, unknown
    language: "JavaScript",            // Primary language detected
    framework: "React",                // Framework if detected
    metadata: {
      hasGit: true,
      gitRemote: "https://github.com/user/repo.git",
      packageManager: "npm",           // npm, yarn, pnpm, pip, nuget, go mod
      mainLanguages: ["JavaScript", "TypeScript"],
      frameworks: ["React", "Express"]
    },
    suggestedColor: "#61dafb",         // Color based on project type
    suggestedTags: ["web", "nodejs", "react"]
  };
}
```

#### 2. Detection Strategies

Implement detection for these project types (in priority order):

**A. Git Repository Detection**
- Check for `.git` directory
- Extract remote URL: `git config --get remote.origin.url`
- Extract project name from remote URL or last folder name

**B. Node.js Project Detection**
- Check for `package.json`
- Extract name from package.json: `JSON.parse(fs.readFileSync('package.json')).name`
- Detect framework from dependencies: React, Vue, Angular, Express, Next.js
- Detect package manager from lockfile: `package-lock.json` (npm), `yarn.lock` (yarn), `pnpm-lock.yaml` (pnpm)

**C. .NET Project Detection**
- Check for `*.csproj` or `*.sln` files
- Parse XML to extract project name and target framework
- Detect if it's ASP.NET, Blazor, WPF, Console App

**D. Python Project Detection**
- Check for `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile`
- Extract name from pyproject.toml or folder name
- Detect framework: Django, Flask, FastAPI

**E. Go Project Detection**
- Check for `go.mod`
- Extract module name from first line
- Detect if it's a CLI or web project

**F. General Language Detection**
- Count files by extension in project root (max depth 2)
- Determine primary language: `.ts/.tsx` = TypeScript, `.js/.jsx` = JavaScript, `.py` = Python, `.cs` = C#, `.go` = Go

#### 3. Color Suggestions

Assign colors based on detected project type:
```javascript
const PROJECT_TYPE_COLORS = {
  nodejs: '#68a063',      // Node.js green
  react: '#61dafb',       // React blue
  vue: '#42b883',         // Vue green
  angular: '#dd0031',     // Angular red
  dotnet: '#512bd4',      // .NET purple
  python: '#3776ab',      // Python blue
  go: '#00add8',          // Go cyan
  git: '#f05032',         // Git orange
  unknown: '#6366f1'      // Default indigo
};
```

#### 4. API Endpoint Integration

Add new endpoint to `claude-ui/server/index.js`:

```javascript
// POST /api/project-detections
// Body: { path: "/path/to/project" }
// Response: { data: { detected: true, name: "...", projectType: "...", ... } }
app.post('/api/project-detections', (req, res) => {
  try {
    const { path: projectPath } = req.body;

    if (!projectPath) {
      return res.status(400).json({
        error: {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Path is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Security: validate path exists and is accessible
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({
        error: {
          status: 404,
          code: 'PATH_NOT_FOUND',
          message: 'Project path does not exist',
          timestamp: new Date().toISOString()
        }
      });
    }

    const detection = detectProject(projectPath);

    res.status(201).json({ data: detection });
  } catch (err) {
    console.error('Error detecting project:', err);
    res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to detect project',
        timestamp: new Date().toISOString()
      }
    });
  }
});
```

#### 5. Testing Requirements

Create test scenarios for:
- Node.js project with package.json (ClaudeUI itself)
- Git repository without package.json
- Python project with requirements.txt
- .NET project with .csproj
- Unknown project type (just folders)

Test the endpoint:
```bash
curl -X POST http://localhost:3001/api/project-detections \
  -H "Content-Type: application/json" \
  -d '{"path":"C:\\Users\\jschaab\\source\\repos\\GitHub\\ClaudeUI"}' \
  | python -m json.tool
```

### Implementation Checklist

Use the TodoWrite tool to track your progress:

- [ ] Create `claude-ui/server/projectDetector.js` module
- [ ] Implement `detectProject(path)` core function
- [ ] Implement Git repository detection
- [ ] Implement Node.js project detection (package.json parsing)
- [ ] Implement .NET project detection (*.csproj/*.sln parsing)
- [ ] Implement Python project detection
- [ ] Implement Go project detection
- [ ] Implement language detection by file extensions
- [ ] Implement project type color mapping
- [ ] Implement suggested tags generation
- [ ] Add POST /api/project-detections endpoint
- [ ] Add error handling and validation
- [ ] Test with ClaudeUI project (should detect Node.js + React)
- [ ] Test with other project types
- [ ] Document detection algorithm in comments

### Success Criteria

✅ Detection works for all 5 project types (Node.js, .NET, Python, Go, Git)
✅ Correctly extracts project name from various sources
✅ Provides accurate metadata (languages, frameworks)
✅ Suggests appropriate colors and tags
✅ API endpoint returns 201 with proper response format
✅ All tests pass with real project directories
✅ Error handling for invalid paths and edge cases

## Reference Documentation

- **Phase 1 Summary**: `docs/implementation-phase1-summary.md` (complete backend)
- **API Specification**: `docs/api-specification-rest.md` (REST endpoints)
- **Design Document**: `docs/project-workspace-management.md` (overall design)
- **Database Migration**: `docs/database-migration.sql` (schema reference)

## Important Notes

1. **Security**: Always validate paths to prevent directory traversal attacks
2. **Performance**: Cache detection results if called multiple times for same path
3. **Error Handling**: Gracefully handle missing files, permission errors
4. **Encoding**: Handle Windows paths (backslashes) correctly
5. **Git Commands**: Use child_process.spawn() for git commands, handle errors
6. **JSON Parsing**: Wrap all JSON.parse() calls in try-catch

## Example Detection Output

For the ClaudeUI project itself:
```json
{
  "data": {
    "detected": true,
    "name": "ClaudeUI",
    "projectType": "nodejs",
    "language": "JavaScript",
    "framework": "React",
    "metadata": {
      "hasGit": true,
      "gitRemote": "https://github.com/user/ClaudeUI.git",
      "packageManager": "npm",
      "mainLanguages": ["JavaScript", "TypeScript"],
      "frameworks": ["React", "Express"]
    },
    "suggestedColor": "#61dafb",
    "suggestedTags": ["web", "nodejs", "react", "express"]
  }
}
```

## Start Here

1. Read `claude-ui/server/database.js` to understand the database structure
2. Read `claude-ui/server/index.js` to see existing API endpoint patterns
3. Create `claude-ui/server/projectDetector.js` with the detection logic
4. Add the POST /api/project-detections endpoint
5. Test with real project directories
6. Update documentation with detection algorithm details

Good luck! When done, test the endpoint and show detection results for the ClaudeUI project.
