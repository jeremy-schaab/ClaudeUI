# Project-Aware Conversation Workspace Management

## Executive Summary

This enhancement transforms ClaudeUI from a simple CLI wrapper into a project-aware workspace manager that maintains context, preferences, and conversation history across multiple projects. This creates a compelling reason to use ClaudeUI over the standard CLI or VS Code plugin.

## Problem Statement

**Current Pain Points:**
1. Conversations scatter across unrelated projects without organization
2. Context (selected files) must be manually selected every time
3. No way to maintain project-specific preferences or settings
4. Switching between projects loses all conversation context
5. No visual indication of which project you're working with
6. Model preferences and agents aren't project-specific

**User Impact:**
- Productivity loss from repetitive file selection
- Lost context when switching between projects
- Difficulty finding relevant past conversations
- No institutional memory per project

## Solution Overview

Implement a **Project Workspace** system that:
- Auto-detects projects based on CLI_ROOT path
- Maintains separate conversation histories per project
- Stores project-specific preferences (model, context presets, agents)
- Provides quick project switching without losing context
- Supports project tagging and organization

## Architecture

### Data Model

```
Project
├── id (unique identifier)
├── name (user-friendly name)
├── path (CLI_ROOT - unique)
├── description (optional)
├── color (for UI identification)
├── tags (JSON array)
├── is_favorite (boolean)
├── last_accessed (timestamp)
├── created_at (timestamp)
├── settings (JSON)
│   ├── default_model
│   ├── default_context_preset
│   └── custom_preferences
└── metadata (JSON)
    ├── git_repo_url
    ├── language/framework
    └── project_type

ContextPreset
├── id
├── project_id (FK)
├── name
├── description
├── file_patterns (JSON array of glob patterns)
├── exclude_patterns (JSON array)
├── explicit_files (JSON array of paths)
├── is_default (boolean)
├── created_at
└── updated_at

ConversationProjectLink
├── conversation_id (FK - existing)
└── project_id (FK - new)
```

### Database Schema Changes

**Status**: ✅ **IMPLEMENTED** (Phase 1 Complete - November 10, 2025)

**New Tables:**

```sql
-- Multi-provider API configuration support
CREATE TABLE IF NOT EXISTS api_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL, -- "anthropic", "bedrock", "azure", "custom"
  api_url TEXT NOT NULL,
  api_key_source TEXT NOT NULL, -- "inline", "env", "file"
  api_key_value TEXT, -- AES-256 encrypted if inline
  auth_type TEXT DEFAULT 'bearer', -- "bearer", "aws_sig_v4", "azure_ad"
  region TEXT,
  models TEXT, -- JSON array
  model_refresh_strategy TEXT DEFAULT 'manual',
  connection_timeout INTEGER DEFAULT 30000,
  max_retries INTEGER DEFAULT 3,
  extra_headers TEXT, -- JSON object
  is_active BOOLEAN DEFAULT 1,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  tags TEXT, -- JSON array
  is_favorite BOOLEAN DEFAULT 0,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  api_config_id INTEGER, -- FK to api_configurations (optional per-project override)
  settings TEXT, -- JSON object
  metadata TEXT, -- JSON object
  FOREIGN KEY (api_config_id) REFERENCES api_configurations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS context_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_patterns TEXT, -- JSON array ['src/**/*.ts', 'lib/**/*.js']
  exclude_patterns TEXT, -- JSON array ['**/*.test.ts', 'node_modules/**']
  explicit_files TEXT, -- JSON array ['/src/main.ts', '/config.json']
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, name)
);

-- Add project_id to existing conversations table
ALTER TABLE conversations ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path);
CREATE INDEX IF NOT EXISTS idx_projects_last_accessed ON projects(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_projects_favorite ON projects(is_favorite) WHERE is_favorite = 1;
CREATE INDEX IF NOT EXISTS idx_projects_api_config ON projects(api_config_id);
CREATE INDEX IF NOT EXISTS idx_presets_project ON context_presets(project_id);
CREATE INDEX IF NOT EXISTS idx_presets_default ON context_presets(project_id, is_default) WHERE is_default = 1;
CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_api_configs_default ON api_configurations(is_default) WHERE is_default = 1;
CREATE INDEX IF NOT EXISTS idx_api_configs_active ON api_configurations(is_active) WHERE is_active = 1;
```

### API Endpoints

**Status**: ✅ **IMPLEMENTED** (Phase 1 Complete - November 10, 2025)

See `docs/api-specification-rest.md` for full RESTful API specification with request/response examples.

**API Configuration Management:**
- `GET /api/api-configs` - List all configurations (query: `?active=true`)
- `GET /api/api-configs/:id` - Get single configuration
- `POST /api/api-configs` - Create configuration (201 Created)
- `PATCH /api/api-configs/:id` - Update configuration
- `DELETE /api/api-configs/:id` - Delete configuration (204 No Content)
- `GET /api/projects/:projectId/api-config` - Get effective config for project (with fallback)

**Project Management:**
- `GET /api/projects` - List all projects (query: `?favorite=true&tag=web&limit=20&offset=0`)
- `GET /api/projects/:id` - Get project details with stats
- `POST /api/projects` - Create new project (201 Created)
- `PATCH /api/projects/:id` - Update project (partial update)
- `DELETE /api/projects/:id` - Delete project (204 No Content, cascades to presets)

**Context Presets:**
- `GET /api/projects/:projectId/presets` - List presets for project
- `GET /api/projects/:projectId/presets/:id` - Get preset details
- `POST /api/projects/:projectId/presets` - Create preset (201 Created)
- `PATCH /api/projects/:projectId/presets/:id` - Update preset
- `DELETE /api/projects/:projectId/presets/:id` - Delete preset (204 No Content)
- `GET /api/projects/:projectId/presets/:id/files` - Resolve preset files (computed sub-resource using glob)

**Project-Filtered Conversations (Future):**
- `GET /api/conversations?project_id=:id` - Get conversations for project
- Conversations automatically linked to active project on creation

### UI Components

**1. Project Switcher (Sidebar Top)**
```
┌─────────────────────────────┐
│ 🎨 ClaudeUI                 │
│ Current: my-app ▼           │
│ ┌─────────────────────────┐ │
│ │ ⭐ my-app (active)      │ │
│ │ 📁 other-project        │ │
│ │ 📁 client-work          │ │
│ │ ─────────────────────    │ │
│ │ + New Project           │ │
│ │ ⚙️ Manage Projects      │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**2. Project Badge (Always Visible)**
- Color-coded project indicator
- Shows project name
- Click to see project details/switch

**3. Context Preset Selector**
```
┌─────────────────────────────────┐
│ Context Presets ▼               │
│ ┌─────────────────────────────┐ │
│ │ ⭐ Full Stack (default)     │ │
│ │ 🎨 Frontend Only            │ │
│ │ 🗄️ Backend + DB             │ │
│ │ 📝 Docs & Config            │ │
│ │ ─────────────────────       │ │
│ │ + Create New Preset         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**4. Project Management Modal**
- Project list with search/filter
- Edit project details
- Manage context presets
- View project statistics (conversation count, messages, etc.)
- Export/import project settings

**5. Project Creation/Detection Flow**
```
┌──────────────────────────────────────┐
│ Create New Project                   │
├──────────────────────────────────────┤
│ Project Name: [My Awesome App    ]   │
│ Path: [/Users/you/projects/app   ]   │
│       [📁 Browse]  [🔍 Use Current]  │
│                                      │
│ Auto-detected:                       │
│ ✓ Git repository found              │
│ ✓ package.json (Node.js project)    │
│ ✓ Language: TypeScript, JavaScript  │
│                                      │
│ Description (optional):              │
│ [A web application for...        ]   │
│                                      │
│ Color: [🎨 #6366f1 ▼]               │
│ Tags: [web, typescript, react     ]  │
│                                      │
│ Default Model: [Sonnet 4.5 ▼]       │
│                                      │
│ [Cancel]              [Create Project]│
└──────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Database & Backend Foundation ✅ **COMPLETE** (November 10, 2025)
**Checklist:**
- [x] Add api_configurations table migration (multi-provider support)
- [x] Add projects table migration
- [x] Add context_presets table migration
- [x] Add project_id column to conversations
- [x] Add 9 performance indexes
- [x] Create encryption/decryption functions for API keys (AES-256)
- [x] Create database functions for API configurations CRUD
- [x] Create database functions for projects CRUD
- [x] Create database functions for context presets CRUD
- [x] Add 17 RESTful API endpoints (projects, presets, API configs)
- [x] Add glob pattern file resolution for presets
- [x] Test all database operations (successful)
- [x] Test all API endpoints with curl (all passing)
- [x] Install glob package dependency
- [x] Create comprehensive documentation (7 docs in ./docs/)

**Deliverables:**
- `claude-ui/server/database.js` (+847 lines)
- `claude-ui/server/index.js` (+694 lines)
- See `docs/implementation-phase1-summary.md` for detailed summary

### Phase 2: Project Detection & Management ✅ **COMPLETE** (November 10, 2025)
**Checklist:**
- [x] Implement auto-detection for git repositories
- [x] Detect package.json (Node.js)
- [x] Detect .csproj/.sln (C#/.NET)
- [x] Detect requirements.txt/pyproject.toml (Python)
- [x] Detect go.mod (Go)
- [x] Extract project metadata (name, language, etc.)
- [x] Add project color generation based on framework/type
- [x] Add automatic tag generation
- [x] Add POST /api/project-detections endpoint
- [x] Test detection across different project types

**Deliverables:**
- `claude-ui/server/projectDetector.js` (733 lines)
- `POST /api/project-detections` endpoint (82 lines in index.js)
- See `docs/implementation-phase2-summary.md` for detailed summary

### Phase 3: UI Components (Tasks 4, 7)
✅ **Checklist:**
- [ ] Create ProjectSwitcher component
- [ ] Create ProjectBadge component
- [ ] Create ProjectManagement modal/page
- [ ] Create ContextPresetSelector component
- [ ] Create ProjectForm component (create/edit)
- [ ] Add project switcher to sidebar
- [ ] Add project badge to header
- [ ] Style all new components
- [ ] Test component interactions
- [ ] Ensure responsive design

### Phase 4: Context Preset System (Task 8)
✅ **Checklist:**
- [ ] Create ContextPresetForm component
- [ ] Implement glob pattern matching for file selection
- [ ] Add preset creation UI
- [ ] Add preset editing UI
- [ ] Implement "Apply Preset" functionality
- [ ] Show file count preview when selecting preset
- [ ] Add default preset selection
- [ ] Test preset with various glob patterns
- [ ] Handle preset errors gracefully

### Phase 5: Project-Filtered Views (Task 6)
✅ **Checklist:**
- [ ] Filter conversations by active project
- [ ] Update conversation list to show project badge
- [ ] Add "All Projects" view option
- [ ] Update conversation creation to link to active project
- [ ] Add project filter dropdown in conversation list
- [ ] Show conversation count per project
- [ ] Test filtering with multiple projects
- [ ] Ensure conversations without projects still appear

### Phase 6: Project Tags & Organization (Task 9)
✅ **Checklist:**
- [ ] Add tag input component
- [ ] Implement tag search/filter
- [ ] Add favorite/star functionality
- [ ] Create "Recent Projects" section
- [ ] Create "Favorite Projects" section
- [ ] Add project sorting options (name, date, favorites)
- [ ] Implement tag autocomplete from existing tags
- [ ] Test tag filtering

### Phase 7: Integration & Polish
✅ **Checklist:**
- [ ] Auto-create project when CLI_ROOT changes
- [ ] Prompt user to name project when auto-created
- [ ] Show project in window title/header
- [ ] Add keyboard shortcuts for project switching (Ctrl+P?)
- [ ] Add project export/import functionality
- [ ] Add project settings sync across devices (future)
- [ ] Update documentation
- [ ] Add migration guide for existing users
- [ ] Create demo video/screenshots

### Phase 8: End-to-End Testing (Task 10)
✅ **Checklist:**
- [ ] Test complete workflow: create project → add presets → start conversation
- [ ] Test project switching mid-conversation
- [ ] Test context preset application
- [ ] Test conversation filtering by project
- [ ] Test project deletion (ensure conversations handled)
- [ ] Test with no projects (new user experience)
- [ ] Test with 10+ projects (performance)
- [ ] Test auto-detection across project types
- [ ] Test edge cases (duplicate paths, invalid presets)
- [ ] User acceptance testing

## Success Metrics

**Quantitative:**
- Time to select context reduced by 70% (via presets)
- Conversation organization improved (95%+ conversations linked to projects)
- Project switching takes < 1 second
- Support for 50+ projects without performance degradation

**Qualitative:**
- Users report ClaudeUI as "essential" vs. standard CLI
- Positive feedback on project organization
- Increased conversation reusability
- Reduced context repetition

## Future Enhancements

Once core project management is stable:

1. **Project Templates**: Create new projects from templates with pre-configured presets
2. **Shared Projects**: Team collaboration on shared project configurations
3. **Project Analytics**: Insights per project (tokens used, conversations, files modified)
4. **Git Integration**: Auto-detect branches, show git status in project badge
5. **Project Workspaces**: Multiple projects open simultaneously in tabs
6. **Smart Context**: AI-suggested context presets based on conversation content
7. **Project Export/Import**: Share project configs between team members

## Migration Strategy

**For Existing Users:**

1. **Automatic Migration**:
   - On first launch after update, detect current CLI_ROOT
   - Create "Default Project" with current path
   - Link all existing conversations to Default Project
   - Prompt user to rename project

2. **Guided Setup**:
   - Show onboarding modal explaining new features
   - Walk through creating first custom preset
   - Highlight project switcher location

3. **Backward Compatibility**:
   - Conversations without project_id still appear in "All Conversations" view
   - CLI_ROOT setting still works independently
   - No breaking changes to existing API

## Technical Considerations

**Performance:**
- Index project_id on conversations table
- Cache active project in memory
- Lazy load project metadata
- Use virtual scrolling for project list if > 50 projects

**Security:**
- Validate paths to prevent directory traversal
- Sanitize project names and descriptions
- Validate glob patterns to prevent ReDoS attacks

**Data Integrity:**
- Cascade delete context presets when project deleted
- Set conversations.project_id to NULL when project deleted (preserve conversations)
- Validate unique project paths

## Open Questions

1. Should we allow multiple projects with same path but different names? (e.g., different branches)
   - **Recommendation**: No, enforce unique paths for simplicity
2. How to handle project path changes? (e.g., folder moved)
   - **Recommendation**: Add "Update Path" button in project settings
3. Should context presets support regex in addition to glob?
   - **Recommendation**: Start with glob only, add regex if requested
4. Maximum number of files in a preset?
   - **Recommendation**: Warn at 50, block at 100 to prevent token overflow

## Conclusion

This enhancement positions ClaudeUI as a **professional workspace manager** for AI-assisted development, not just a chat interface. The project-aware system solves real productivity pain points and creates a moat that the standard CLI and VS Code plugin cannot easily replicate.

**Next Steps:**
1. Review and approve this design document
2. Begin Phase 1 implementation
3. Create working prototype for user testing
4. Iterate based on feedback
