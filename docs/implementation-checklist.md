# Project Workspace Management - Implementation Checklist

**Status**: 🟡 In Progress
**Start Date**: 2025-11-10
**Target Completion**: TBD

---

## Phase 1: Database & Backend Foundation

### Database Schema
- [ ] Create migration script for `projects` table
  - [ ] Add all required columns (id, name, path, description, color, tags, is_favorite, last_accessed, created_at, settings, metadata)
  - [ ] Add unique constraint on `path`
  - [ ] Add indexes for performance
- [ ] Create migration script for `context_presets` table
  - [ ] Add all required columns
  - [ ] Add foreign key to projects with CASCADE delete
  - [ ] Add unique constraint on (project_id, name)
- [ ] Add `project_id` column to `conversations` table
  - [ ] Add foreign key reference
  - [ ] Add index on project_id
  - [ ] Ensure nullable (for backward compatibility)

### Database Functions (database.js)
- [ ] `createProject(name, path, description, color, tags, settings, metadata)`
- [ ] `updateProject(id, updates)`
- [ ] `getProject(id)`
- [ ] `getProjectByPath(path)`
- [ ] `getAllProjects()`
- [ ] `getFavoriteProjects()`
- [ ] `deleteProject(id, deleteConversations = false)`
- [ ] `updateProjectLastAccessed(id)`
- [ ] `createContextPreset(projectId, name, description, filePatterns, excludePatterns, explicitFiles, isDefault)`
- [ ] `updateContextPreset(id, updates)`
- [ ] `getContextPreset(id)`
- [ ] `getProjectPresets(projectId)`
- [ ] `deleteContextPreset(id)`
- [ ] `applyContextPreset(presetId, rootPath)` - resolve glob patterns to actual files
- [ ] `linkConversationToProject(conversationId, projectId)`
- [ ] `getProjectConversations(projectId)`
- [ ] Initialize default project migration for existing users

### API Endpoints (server/index.js)

**Project Endpoints:**
- [ ] `GET /api/projects` - List all projects
  - [ ] Sort by last_accessed DESC
  - [ ] Include conversation count
  - [ ] Return proper JSON
- [ ] `GET /api/projects/:id` - Get project details
  - [ ] Include context presets count
  - [ ] Include conversation count
  - [ ] Handle not found (404)
- [ ] `POST /api/projects` - Create new project
  - [ ] Validate required fields (name, path)
  - [ ] Check for duplicate paths
  - [ ] Sanitize inputs
  - [ ] Return created project with ID
- [ ] `PUT /api/projects/:id` - Update project
  - [ ] Validate fields
  - [ ] Update last_accessed
  - [ ] Return updated project
- [ ] `DELETE /api/projects/:id` - Delete project
  - [ ] Support query param `?deleteConversations=true/false`
  - [ ] Return success message
- [ ] `POST /api/projects/detect` - Auto-detect project from path
  - [ ] Accept `{ path: string }`
  - [ ] Detect git repo
  - [ ] Detect package.json, .csproj, requirements.txt, etc.
  - [ ] Extract project name, language, metadata
  - [ ] Return detected info (don't create yet)
- [ ] `PUT /api/projects/:id/access` - Update last_accessed
  - [ ] Touch timestamp only
  - [ ] Return success
- [ ] `GET /api/projects/favorites` - Get favorite projects only

**Context Preset Endpoints:**
- [ ] `GET /api/projects/:id/presets` - List presets for project
  - [ ] Sort by name
  - [ ] Include is_default indicator
- [ ] `GET /api/presets/:id` - Get preset details
  - [ ] Handle not found
- [ ] `POST /api/projects/:id/presets` - Create preset
  - [ ] Validate patterns (glob syntax)
  - [ ] Prevent duplicate names within project
  - [ ] If isDefault=true, unset other defaults
- [ ] `PUT /api/presets/:id` - Update preset
  - [ ] Validate patterns
  - [ ] Handle default toggling
- [ ] `DELETE /api/presets/:id` - Delete preset
- [ ] `POST /api/presets/:id/apply` - Resolve preset to file list
  - [ ] Accept `{ rootPath: string }`
  - [ ] Use glob to match file_patterns
  - [ ] Apply exclude_patterns
  - [ ] Add explicit_files
  - [ ] Return array of resolved file paths
  - [ ] Handle errors (invalid patterns, etc.)

**Modified Conversation Endpoints:**
- [ ] Update `POST /api/conversations` to accept `project_id`
- [ ] Update `GET /api/conversations` to support `?project_id=X` filter
- [ ] Add `PUT /api/conversations/:id/project` to link/update project

### Testing
- [ ] Test all database CRUD operations for projects
- [ ] Test all database CRUD operations for context presets
- [ ] Test cascade deletion (project → presets)
- [ ] Test conversation linking to projects
- [ ] Test API endpoints with curl/Postman
- [ ] Test error handling (404, 400, 500 cases)
- [ ] Test validation (duplicate paths, invalid globs, etc.)

---

## Phase 2: Project Detection & Management

### Auto-Detection Logic
- [ ] Create `projectDetector.js` utility module
- [ ] Implement `detectGitRepo(path)` - check for .git folder
  - [ ] Extract repo name from path or git config
  - [ ] Get git remote URL if available
- [ ] Implement `detectNodeJs(path)` - check for package.json
  - [ ] Parse package.json for name, description
  - [ ] Detect TypeScript (tsconfig.json)
  - [ ] Detect framework (React, Vue, Angular, etc.)
- [ ] Implement `detectDotNet(path)` - check for .csproj/.sln
  - [ ] Parse project name from .csproj
  - [ ] Detect Blazor, ASP.NET, etc.
- [ ] Implement `detectPython(path)` - check for requirements.txt, setup.py, pyproject.toml
  - [ ] Detect Django, Flask, FastAPI
- [ ] Implement `detectGo(path)` - check for go.mod
  - [ ] Parse module name
- [ ] Implement `detectJava(path)` - check for pom.xml, build.gradle
- [ ] Implement `generateProjectColor()` - generate random pleasant color
- [ ] Implement `detectProjectType(path)` - main orchestrator
  - [ ] Return object with: name, path, description, language, framework, git_url, suggested_color

### Default Project Creation
- [ ] On server startup, check if any projects exist
- [ ] If none exist, create "Default Project" from current CLI_ROOT
- [ ] Run detection and populate metadata
- [ ] Link all existing conversations to default project

### Testing
- [ ] Test detection with real Node.js project
- [ ] Test detection with real .NET project
- [ ] Test detection with real Python project
- [ ] Test detection with non-git folder
- [ ] Test detection with empty folder
- [ ] Test default project creation on fresh install
- [ ] Test migration of existing conversations to default project

---

## Phase 3: UI Components

### Components to Create

**ProjectSwitcher.tsx**
- [ ] Create component file
- [ ] Fetch list of projects from API
- [ ] Display dropdown with project list
- [ ] Show active project with indicator
- [ ] Display project color badge
- [ ] Show favorites at top
- [ ] Include "New Project" and "Manage Projects" actions
- [ ] Handle project selection → update active project
- [ ] Add keyboard navigation (arrow keys, enter)
- [ ] Style component (CSS)
- [ ] Add loading state
- [ ] Add error handling

**ProjectBadge.tsx**
- [ ] Create component file
- [ ] Display current project name and color
- [ ] Show as colored pill/badge
- [ ] Clickable to open ProjectSwitcher
- [ ] Truncate long project names
- [ ] Add tooltip with full name
- [ ] Style component

**ProjectManagement.tsx**
- [ ] Create full page/modal component
- [ ] Show list of all projects
- [ ] Search/filter projects by name, tags
- [ ] Sort projects (name, date, favorites)
- [ ] Display project cards with:
  - [ ] Name, description, path
  - [ ] Color badge
  - [ ] Tags
  - [ ] Favorite star
  - [ ] Last accessed date
  - [ ] Conversation count
  - [ ] Preset count
- [ ] "Edit" button → open ProjectForm
- [ ] "Delete" button with confirmation
- [ ] "New Project" button
- [ ] Style with grid/list layout
- [ ] Responsive design

**ProjectForm.tsx**
- [ ] Create modal/form component
- [ ] Form fields:
  - [ ] Project name (required)
  - [ ] Path (required, with browse button)
  - [ ] Description (textarea)
  - [ ] Color picker
  - [ ] Tags input (comma-separated or chips)
  - [ ] Default model selector
  - [ ] Favorite checkbox
- [ ] "Detect Project" button
  - [ ] Call detection API
  - [ ] Auto-fill form with detected values
  - [ ] Show detection results
- [ ] Validation
  - [ ] Required fields
  - [ ] Unique path validation
  - [ ] Valid path format
- [ ] Submit handling (create or update)
- [ ] Error display
- [ ] Loading states
- [ ] Style form

**ContextPresetSelector.tsx**
- [ ] Create dropdown component
- [ ] Fetch presets for active project
- [ ] Display preset list
- [ ] Show default preset indicator
- [ ] Apply selected preset → update file context
- [ ] "Create New Preset" action
- [ ] Show file count preview for each preset
- [ ] Handle empty state (no presets)
- [ ] Style component

**ContextPresetForm.tsx**
- [ ] Create modal/form component
- [ ] Form fields:
  - [ ] Preset name (required)
  - [ ] Description
  - [ ] File patterns (multi-line textarea or chips)
  - [ ] Exclude patterns (multi-line textarea or chips)
  - [ ] Is default checkbox
- [ ] Pattern syntax help/examples
- [ ] Preview matched files (call apply API)
- [ ] File count indicator
- [ ] Validation (name, valid glob patterns)
- [ ] Submit handling (create or update)
- [ ] Style form

### Integration into App.tsx
- [ ] Add ProjectSwitcher to sidebar header
- [ ] Add ProjectBadge to main header/top bar
- [ ] Add route for ProjectManagement page
- [ ] Add ContextPresetSelector to input area
- [ ] Manage active project state
  - [ ] Store in React state
  - [ ] Persist to localStorage
  - [ ] Sync with server on change
- [ ] Update conversation creation to include project_id
- [ ] Filter conversations by active project (or show all)
- [ ] Update Settings to use active project's default model

### Styling
- [ ] Create ProjectSwitcher.css
- [ ] Create ProjectBadge.css
- [ ] Create ProjectManagement.css
- [ ] Create ProjectForm.css
- [ ] Create ContextPresetSelector.css
- [ ] Create ContextPresetForm.css
- [ ] Ensure consistent color scheme
- [ ] Responsive breakpoints
- [ ] Dark mode support (if applicable)
- [ ] Accessibility (ARIA labels, keyboard nav)

### Testing
- [ ] Test ProjectSwitcher interaction
- [ ] Test project switching updates conversations
- [ ] Test ProjectManagement CRUD operations
- [ ] Test ProjectForm validation
- [ ] Test auto-detection in ProjectForm
- [ ] Test ContextPresetSelector application
- [ ] Test ContextPresetForm pattern matching
- [ ] Test responsive design on mobile
- [ ] Test keyboard navigation
- [ ] Test error states (network failure, etc.)

---

## Phase 4: Context Preset System

### Glob Pattern Matching
- [ ] Install `glob` or `fast-glob` npm package
- [ ] Create `applyContextPreset` function in database.js
  - [ ] Accept preset ID and root path
  - [ ] Retrieve preset from database
  - [ ] Parse file_patterns JSON
  - [ ] Parse exclude_patterns JSON
  - [ ] Use glob library to match patterns against root path
  - [ ] Apply exclusions
  - [ ] Add explicit files
  - [ ] Return array of resolved file paths
  - [ ] Handle errors gracefully

### Preset Creation UI Flow
- [ ] User clicks "Create New Preset" in ContextPresetSelector
- [ ] ProjectPresetForm modal opens
- [ ] User enters patterns (e.g., `src/**/*.ts`, `lib/**/*.js`)
- [ ] User enters exclude patterns (e.g., `**/*.test.ts`)
- [ ] Click "Preview" to see matched files
- [ ] System calls `POST /api/presets/:id/apply` with current CLI_ROOT
- [ ] Display matched file list and count
- [ ] User saves preset
- [ ] Preset appears in ContextPresetSelector dropdown

### Preset Application
- [ ] User selects preset from ContextPresetSelector
- [ ] System calls apply API to resolve files
- [ ] Update selectedContext state with resolved files
- [ ] Expand file tree to show selected files
- [ ] Visual feedback (checkboxes checked, highlighted)

### Default Preset
- [ ] When conversation starts, check if project has default preset
- [ ] Auto-apply default preset if exists
- [ ] User can override by selecting different preset or manual files

### Error Handling
- [ ] Invalid glob pattern → show error message with example
- [ ] No files matched → warn user
- [ ] Too many files (>100) → warn about token usage
- [ ] Pattern timeout → cancel and notify user

### Testing
- [ ] Test glob matching with various patterns
- [ ] Test exclusion patterns work correctly
- [ ] Test explicit files override globs
- [ ] Test preview shows accurate file list
- [ ] Test preset application updates UI
- [ ] Test default preset auto-applies
- [ ] Test error handling for all cases
- [ ] Test performance with large projects (1000+ files)

---

## Phase 5: Project-Filtered Views

### Conversation Filtering
- [ ] Update `GET /api/conversations` API to support `?project_id=X`
- [ ] In App.tsx, add project filter dropdown
  - [ ] Options: "All Projects", "Current Project", specific projects
  - [ ] Default to "Current Project"
- [ ] Filter conversations in React state based on selection
- [ ] Update conversation list to show project badge on each conversation
  - [ ] Use project color
  - [ ] Truncate project name if long

### Conversation-Project Linking
- [ ] When creating new conversation, automatically link to active project
- [ ] Store project_id in conversation record
- [ ] Update conversation title to include project context (optional)

### Statistics
- [ ] Show conversation count per project in ProjectManagement
- [ ] Show message count per project
- [ ] Show last activity date per project

### "All Conversations" View
- [ ] Add toggle for "Show all conversations" vs. "Current project only"
- [ ] Persist preference to localStorage
- [ ] Handle conversations without project_id (legacy conversations)
  - [ ] Show in "All" view
  - [ ] Optionally prompt to assign to project

### Testing
- [ ] Test filtering shows only project conversations
- [ ] Test "All Projects" shows everything
- [ ] Test new conversations linked to active project
- [ ] Test switching projects updates conversation list
- [ ] Test conversations without project still appear in All view
- [ ] Test statistics are accurate

---

## Phase 6: Project Tags & Organization

### Tagging System
- [ ] Implement tag input in ProjectForm
  - [ ] Use chip/pill input component
  - [ ] Support comma-separated input
  - [ ] Allow removing tags
- [ ] Store tags as JSON array in projects.tags column
- [ ] Create tag autocomplete
  - [ ] Get all unique tags from all projects
  - [ ] Suggest tags as user types

### Tag Filtering
- [ ] In ProjectManagement, add tag filter
  - [ ] Show all tags as clickable pills
  - [ ] Filter projects by selected tags (AND or OR logic)
- [ ] Show tag count per tag

### Favorites System
- [ ] Add favorite toggle button in ProjectManagement cards
- [ ] Update `is_favorite` via API
- [ ] In ProjectSwitcher, show favorites at top
  - [ ] Visual separator between favorites and others
  - [ ] Star icon indicator

### Recent Projects
- [ ] Update `last_accessed` when project is selected
- [ ] In ProjectSwitcher, show "Recent" section (top 5)
- [ ] Sort by last_accessed DESC

### Sorting
- [ ] In ProjectManagement, add sort dropdown
  - [ ] Options: Name (A-Z), Name (Z-A), Last Accessed, Created Date, Favorites First
- [ ] Persist sort preference to localStorage

### Testing
- [ ] Test tag input and autocomplete
- [ ] Test tag filtering (single and multiple tags)
- [ ] Test favorite toggle updates immediately
- [ ] Test favorites appear at top of switcher
- [ ] Test recent projects update on selection
- [ ] Test sorting options work correctly
- [ ] Test persistence of preferences

---

## Phase 7: Integration & Polish

### Auto-Create Project on CLI_ROOT Change
- [ ] In settings save, detect if CLI_ROOT changed
- [ ] Check if project exists for new path
- [ ] If not, prompt user:
  - [ ] "New project detected. Would you like to create a project for this path?"
  - [ ] Pre-fill ProjectForm with detected info
  - [ ] Option to dismiss (continue without project)
- [ ] On project creation, switch to new project

### Project Prompt on First Launch
- [ ] Detect if user has no projects
- [ ] Show onboarding modal:
  - [ ] Explain project feature
  - [ ] Offer to create first project
  - [ ] Run detection on current CLI_ROOT
  - [ ] Create project with one click

### Window Title/Header
- [ ] Update browser tab title to include project name
  - [ ] Format: "ClaudeUI - {projectName}"
- [ ] Show project name in main header
  - [ ] With color badge

### Keyboard Shortcuts
- [ ] Implement Ctrl+P / Cmd+P to open ProjectSwitcher
- [ ] Implement Ctrl+K / Cmd+K for quick actions menu (future)
- [ ] Add keyboard hint tooltips

### Export/Import
- [ ] Create export functionality
  - [ ] Export single project settings as JSON
  - [ ] Include context presets
  - [ ] Exclude conversations (too large)
- [ ] Create import functionality
  - [ ] Upload JSON file
  - [ ] Validate structure
  - [ ] Create project with presets
  - [ ] Handle duplicates

### Documentation
- [ ] Update README.md with project feature overview
- [ ] Create user guide in docs/user-guide.md
  - [ ] How to create projects
  - [ ] How to use context presets
  - [ ] How to organize conversations
  - [ ] Screenshots/GIFs
- [ ] Create migration guide for existing users
  - [ ] Explain automatic default project creation
  - [ ] How to organize existing conversations

### Testing
- [ ] Test auto-create on CLI_ROOT change
- [ ] Test first-launch onboarding
- [ ] Test window title updates
- [ ] Test keyboard shortcuts
- [ ] Test export/import round-trip
- [ ] Review documentation for clarity

---

## Phase 8: End-to-End Testing

### Complete User Workflows
- [ ] **Workflow 1: New User Setup**
  - [ ] Fresh install
  - [ ] Launch app
  - [ ] See onboarding modal
  - [ ] Create first project
  - [ ] Start conversation
  - [ ] Verify conversation linked to project
- [ ] **Workflow 2: Multi-Project User**
  - [ ] Create 3 projects with different paths
  - [ ] Create context presets for each
  - [ ] Switch between projects
  - [ ] Start conversations in each
  - [ ] Verify filtering works
- [ ] **Workflow 3: Context Preset Power User**
  - [ ] Create preset with complex glob patterns
  - [ ] Preview matched files
  - [ ] Apply preset
  - [ ] Verify correct files selected
  - [ ] Use in conversation
- [ ] **Workflow 4: Project Organization**
  - [ ] Create 10+ projects
  - [ ] Add tags to projects
  - [ ] Mark favorites
  - [ ] Filter by tags
  - [ ] Sort projects
  - [ ] Verify performance is smooth

### Edge Cases
- [ ] Test with no projects (should work with legacy mode)
- [ ] Test with conversation without project_id
- [ ] Test deleting active project (should switch to another)
- [ ] Test deleting last project (should allow, but warn)
- [ ] Test duplicate project paths (should prevent)
- [ ] Test invalid glob patterns (should error gracefully)
- [ ] Test very long project names (should truncate)
- [ ] Test projects with special characters in path
- [ ] Test preset with 0 matched files (should warn)
- [ ] Test preset with 200+ matched files (should warn about tokens)

### Performance Testing
- [ ] Test with 50 projects (should load quickly)
- [ ] Test with 100 conversations per project
- [ ] Test project switcher dropdown with 50+ projects (should have search/virtual scroll)
- [ ] Test file tree rendering with preset applied (1000+ files)
- [ ] Test conversation filtering performance

### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test in Safari (if Mac available)

### Responsive Testing
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)

### Accessibility Testing
- [ ] Test keyboard navigation throughout
- [ ] Test screen reader (NVDA/JAWS)
- [ ] Check color contrast ratios
- [ ] Verify ARIA labels

### User Acceptance Testing
- [ ] Have 2-3 beta testers use the feature
- [ ] Collect feedback on:
  - [ ] Intuitiveness of project creation
  - [ ] Usefulness of context presets
  - [ ] Clarity of project organization
  - [ ] Any confusion or pain points
- [ ] Iterate based on feedback

---

## Definition of Done

- [ ] All checklist items completed and tested
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Code reviewed (self-review or peer review)
- [ ] Performance acceptable (< 1s for project switching)
- [ ] User feedback positive
- [ ] Migration path tested with real user data
- [ ] Feature demo recorded
- [ ] Ready for production deployment

---

## Notes & Decisions Log

### 2025-11-10
- **Decision**: Project paths must be unique (no duplicate paths)
  - Rationale: Simplifies logic, prevents confusion
- **Decision**: Use glob patterns instead of regex for context presets
  - Rationale: More user-friendly, standard in dev tools
- **Decision**: Conversations without project_id remain in system
  - Rationale: Backward compatibility, no data loss
- **Decision**: Project deletion does NOT delete conversations by default
  - Rationale: Preserve user data, allow reassignment
  - Note: Provide option to cascade delete if user wants

---

## Resources & References

- Glob Pattern Syntax: https://github.com/isaacs/node-glob#glob-primer
- fast-glob Library: https://github.com/mrmlnc/fast-glob
- Color Picker Component: (TBD - find React component)
- Tag Input Component: (TBD - find React component)

---

**Last Updated**: 2025-11-10
**Next Review**: After Phase 1 completion
