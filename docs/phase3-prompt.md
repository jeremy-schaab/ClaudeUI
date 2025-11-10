# Phase 3: Frontend UI Components Implementation Prompt

## Context

You are implementing Phase 3 of the Project Workspace Management feature for ClaudeUI, a local web-based chat interface for Claude CLI. **Phase 1 (Database & Backend) and Phase 2 (Project Detection) are complete** with all backend infrastructure ready.

## Project Overview

**ClaudeUI** is a three-layer architecture:
1. **Frontend**: React + TypeScript + Vite (port 5173) in `claude-ui/src/`
2. **Backend**: Node.js + Express + Socket.IO (port 3001) in `claude-ui/server/`
3. **Claude CLI**: Spawned as child processes

**Key Frontend Files:**
- `claude-ui/src/App.tsx` - Main React application (2000+ lines)
- `claude-ui/src/App.css` - Main stylesheet
- `claude-ui/src/Admin.tsx` - Admin interface example

## Previous Phases Completion

### Phase 1: Database & Backend ✅
- 3 database tables: `api_configurations`, `projects`, `context_presets`
- 17 RESTful API endpoints implemented
- All CRUD functions working and tested
- See `docs/implementation-phase1-summary.md`

### Phase 2: Project Detection ✅
- Auto-detection for Node.js, .NET, Python, Go, Git projects
- `projectDetector.js` module with full detection logic
- POST /api/project-detections endpoint
- See `docs/phase2-prompt.md` for detection details

### Available REST API Endpoints

**Projects:**
- `GET /api/projects` - List all (query: ?favorite=true&tag=web&limit=20)
- `GET /api/projects/:id` - Get single project with stats
- `POST /api/projects` - Create project (201 Created)
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (204)

**Context Presets:**
- `GET /api/projects/:projectId/presets` - List presets
- `GET /api/projects/:projectId/presets/:id` - Get single preset
- `POST /api/projects/:projectId/presets` - Create preset
- `PATCH /api/projects/:projectId/presets/:id` - Update preset
- `DELETE /api/projects/:projectId/presets/:id` - Delete preset
- `GET /api/projects/:projectId/presets/:id/files` - Resolve files (glob patterns)

**API Configurations:**
- `GET /api/api-configs` - List all configs
- `GET /api/projects/:projectId/api-config` - Get effective config for project

## Your Task: Phase 3 - Frontend UI Components

Build React components for project workspace management with a modern, intuitive UI.

### Architecture Guidelines

**State Management:**
- Use React hooks (useState, useEffect, useRef)
- Lift shared state to App.tsx when needed
- Use refs for values that don't need re-renders

**API Integration:**
- Use fetch() for REST API calls
- Base URL: `http://localhost:3001/api/`
- Handle loading, error, and success states
- Show user feedback (toasts, inline messages)

**Styling:**
- Follow existing App.css patterns
- Use CSS classes with BEM-like naming
- Match existing dark theme aesthetic
- Ensure responsive design

### Components to Build

---

## 1. ProjectBadge Component

**Purpose**: Small visual indicator showing current project

**File**: `claude-ui/src/components/ProjectBadge.tsx`

```typescript
interface ProjectBadgeProps {
  project: {
    id: number;
    name: string;
    color: string;
    path?: string;
  };
  onClick?: () => void;
  showPath?: boolean;
}

function ProjectBadge({ project, onClick, showPath }: ProjectBadgeProps) {
  // Render small badge with project color and name
  // Optional: show truncated path on hover
  // Click handler for quick actions
}
```

**Design**:
```
┌─────────────────────┐
│ ● ClaudeUI          │  ← Colored dot + name
└─────────────────────┘
```

---

## 2. ProjectSwitcher Component

**Purpose**: Dropdown to switch between projects

**File**: `claude-ui/src/components/ProjectSwitcher.tsx`

```typescript
interface Project {
  id: number;
  name: string;
  path: string;
  color: string;
  is_favorite: boolean;
  last_accessed: string;
  tags: string; // JSON array
}

interface ProjectSwitcherProps {
  currentProject: Project | null;
  onProjectChange: (project: Project) => void;
}

function ProjectSwitcher({ currentProject, onProjectChange }: ProjectSwitcherProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const response = await fetch('http://localhost:3001/api/projects');
    const data = await response.json();
    setProjects(data.data);
    setLoading(false);
  }

  // Render dropdown with:
  // - Current project at top
  // - Favorites section (⭐)
  // - Recent projects section
  // - All projects section
  // - "Manage Projects" button at bottom
  // - "New Project" button
}
```

**Design**:
```
┌─────────────────────────────┐
│ Projects ▼                  │
│ ┌─────────────────────────┐ │
│ │ ● ClaudeUI (active) ⭐  │ │ ← Current
│ ├─────────────────────────┤ │
│ │ Favorites               │ │
│ │ ● Other Project ⭐      │ │
│ ├─────────────────────────┤ │
│ │ Recent                  │ │
│ │ ● Client Work           │ │
│ │ ● Demo App              │ │
│ ├─────────────────────────┤ │
│ │ + New Project           │ │
│ │ ⚙️ Manage Projects      │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## 3. ProjectForm Component

**Purpose**: Create/edit project with auto-detection

**File**: `claude-ui/src/components/ProjectForm.tsx`

```typescript
interface ProjectFormProps {
  project?: Project; // If editing existing project
  onSave: (project: Project) => void;
  onCancel: () => void;
}

function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '');
  const [path, setPath] = useState(project?.path || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || '#6366f1');
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(project?.is_favorite || false);
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  // Auto-detect button handler
  async function handleDetect() {
    setDetecting(true);
    const response = await fetch('http://localhost:3001/api/project-detections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const data = await response.json();
    setDetectionResult(data.data);
    // Pre-fill form with detected values
    if (data.data.detected) {
      setName(data.data.name);
      setColor(data.data.suggestedColor);
      setTags(data.data.suggestedTags);
    }
    setDetecting(false);
  }

  async function handleSubmit() {
    const method = project ? 'PATCH' : 'POST';
    const url = project
      ? `http://localhost:3001/api/projects/${project.id}`
      : 'http://localhost:3001/api/projects';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, path, description, color, tags, isFavorite })
    });

    const data = await response.json();
    onSave(data.data);
  }

  // Render form with:
  // - Name input
  // - Path input with "Browse" and "Detect" buttons
  // - Auto-detection results display (if detected)
  // - Description textarea
  // - Color picker
  // - Tags input (chips)
  // - Favorite checkbox
  // - Save/Cancel buttons
}
```

**Design**:
```
┌─────────────────────────────────────┐
│ Create New Project                  │
├─────────────────────────────────────┤
│ Project Name *                      │
│ [ClaudeUI                       ]   │
│                                     │
│ Project Path *                      │
│ [C:\...\ClaudeUI                ]   │
│ [📁 Browse] [🔍 Auto-Detect]       │
│                                     │
│ ✓ Detected: Node.js + React        │
│ ✓ Git: github.com/user/claudeui    │
│                                     │
│ Description                         │
│ [Local web interface for Claude ]   │
│                                     │
│ Color   [🎨 #61dafb ▼]             │
│ Tags    [web] [nodejs] [react]      │
│         [+ Add tag]                 │
│ [ ] Mark as favorite                │
│                                     │
│ [Cancel]              [Save Project]│
└─────────────────────────────────────┘
```

---

## 4. ProjectManagement Component

**Purpose**: Full project CRUD interface

**File**: `claude-ui/src/components/ProjectManagement.tsx`

```typescript
function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState({ favorites: false, tag: '' });

  // Load projects
  useEffect(() => {
    loadProjects();
  }, [filter]);

  // Delete confirmation
  async function handleDelete(projectId: number) {
    if (!confirm('Delete this project? Conversations will be preserved.')) return;
    await fetch(`http://localhost:3001/api/projects/${projectId}`, { method: 'DELETE' });
    loadProjects();
  }

  // Render:
  // - Header with "New Project" button
  // - Filter controls (favorites, tags dropdown)
  // - Project cards grid with:
  //   - Project badge
  //   - Name, path, description
  //   - Stats (conversation count)
  //   - Edit/Delete buttons
  //   - Favorite star toggle
  // - Modal for ProjectForm when creating/editing
}
```

**Design**:
```
┌─────────────────────────────────────────────┐
│ Project Management                          │
│ [+ New Project]    [Favorites ▼] [Tag ▼]   │
├─────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐          │
│ │● ClaudeUI ⭐ │ │● Client App  │          │
│ │C:\...\Clau..│ │/home/client  │          │
│ │Local web UI │ │Client portal │          │
│ │12 convos    │ │5 convos      │          │
│ │[Edit][Delete]│ │[Edit][Delete]│          │
│ └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────┘
```

---

## 5. ContextPresetSelector Component

**Purpose**: Select and apply context presets

**File**: `claude-ui/src/components/ContextPresetSelector.tsx`

```typescript
interface ContextPreset {
  id: number;
  project_id: number;
  name: string;
  description: string;
  file_patterns: string; // JSON array
  is_default: boolean;
}

interface ContextPresetSelectorProps {
  projectId: number;
  onPresetSelected: (files: string[]) => void;
}

function ContextPresetSelector({ projectId, onPresetSelected }: ContextPresetSelectorProps) {
  const [presets, setPresets] = useState<ContextPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ContextPreset | null>(null);
  const [resolvedFiles, setResolvedFiles] = useState<string[]>([]);

  useEffect(() => {
    loadPresets();
  }, [projectId]);

  async function loadPresets() {
    const response = await fetch(`http://localhost:3001/api/projects/${projectId}/presets`);
    const data = await response.json();
    setPresets(data.data);
    // Auto-select default preset
    const defaultPreset = data.data.find((p: any) => p.is_default);
    if (defaultPreset) handleSelectPreset(defaultPreset);
  }

  async function handleSelectPreset(preset: ContextPreset) {
    setSelectedPreset(preset);
    // Resolve files
    const response = await fetch(
      `http://localhost:3001/api/projects/${projectId}/presets/${preset.id}/files`
    );
    const data = await response.json();
    setResolvedFiles(data.data.files);
  }

  function handleApply() {
    onPresetSelected(resolvedFiles);
  }

  // Render:
  // - Dropdown with presets
  // - Preview of resolved files (count, list)
  // - Apply button
  // - "Manage Presets" link
}
```

**Design**:
```
┌─────────────────────────────────┐
│ Context Preset                  │
│ [Full Stack (default)      ▼]  │
│                                 │
│ Preview (12 files):             │
│ - src/App.tsx                   │
│ - src/components/...            │
│ - server/index.js               │
│ ...                             │
│                                 │
│ [Apply Preset] [Manage Presets] │
└─────────────────────────────────┘
```

---

## 6. ContextPresetForm Component

**Purpose**: Create/edit context presets

**File**: `claude-ui/src/components/ContextPresetForm.tsx`

```typescript
interface ContextPresetFormProps {
  projectId: number;
  preset?: ContextPreset;
  onSave: (preset: ContextPreset) => void;
  onCancel: () => void;
}

function ContextPresetForm({ projectId, preset, onSave, onCancel }: ContextPresetFormProps) {
  const [name, setName] = useState(preset?.name || '');
  const [description, setDescription] = useState(preset?.description || '');
  const [filePatterns, setFilePatterns] = useState<string[]>(
    preset?.file_patterns ? JSON.parse(preset.file_patterns) : []
  );
  const [excludePatterns, setExcludePatterns] = useState<string[]>(
    preset?.exclude_patterns ? JSON.parse(preset.exclude_patterns) : ['**/node_modules/**']
  );
  const [isDefault, setIsDefault] = useState(preset?.is_default || false);

  // Pattern input helpers
  function addFilePattern() {
    setFilePatterns([...filePatterns, '']);
  }

  function updateFilePattern(index: number, value: string) {
    const updated = [...filePatterns];
    updated[index] = value;
    setFilePatterns(updated);
  }

  async function handleSubmit() {
    const method = preset ? 'PATCH' : 'POST';
    const url = preset
      ? `http://localhost:3001/api/projects/${projectId}/presets/${preset.id}`
      : `http://localhost:3001/api/projects/${projectId}/presets`;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, filePatterns, excludePatterns, isDefault })
    });

    const data = await response.json();
    onSave(data.data);
  }

  // Render:
  // - Name input
  // - Description textarea
  // - File patterns list (add/remove inputs)
  // - Exclude patterns list
  // - Glob pattern examples/hints
  // - Set as default checkbox
  // - Test/Preview button (resolves patterns)
  // - Save/Cancel buttons
}
```

**Design**:
```
┌─────────────────────────────────────┐
│ Create Context Preset               │
├─────────────────────────────────────┤
│ Name *                              │
│ [Full Stack                     ]   │
│                                     │
│ Description                         │
│ [Frontend and backend files     ]   │
│                                     │
│ Include Patterns                    │
│ [src/**/*.{ts,tsx}              ]   │
│ [server/**/*.js                 ]   │
│ [+ Add pattern]                     │
│                                     │
│ Exclude Patterns                    │
│ [**/node_modules/**             ]   │
│ [**/*.test.ts                   ]   │
│                                     │
│ [?] Use glob patterns like:         │
│     **/*.js (all .js files)         │
│     src/*.tsx (direct children)     │
│                                     │
│ [✓] Set as default preset           │
│                                     │
│ [Preview Files]                     │
│ [Cancel]              [Save Preset] │
└─────────────────────────────────────┘
```

---

## Integration with App.tsx

Modify `claude-ui/src/App.tsx` to:

1. **Add Project State**:
```typescript
const [currentProject, setCurrentProject] = useState<Project | null>(null);
const [projects, setProjects] = useState<Project[]>([]);
```

2. **Load Initial Project on Mount**:
```typescript
useEffect(() => {
  async function loadInitialProject() {
    const response = await fetch('http://localhost:3001/api/projects');
    const data = await response.json();
    if (data.data.length > 0) {
      setCurrentProject(data.data[0]); // Load most recent
    }
  }
  loadInitialProject();
}, []);
```

3. **Add Components to UI**:
```tsx
<div className="app-header">
  <ProjectBadge
    project={currentProject}
    onClick={() => setShowProjectSwitcher(true)}
  />
  <ProjectSwitcher
    currentProject={currentProject}
    onProjectChange={handleProjectChange}
  />
</div>

<div className="sidebar">
  {currentProject && (
    <ContextPresetSelector
      projectId={currentProject.id}
      onPresetSelected={handlePresetApplied}
    />
  )}
  {/* Existing conversation list */}
</div>
```

4. **Link Conversations to Project**:
```typescript
async function createNewConversation() {
  const response = await fetch('http://localhost:3001/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'New Chat',
      project_id: currentProject?.id // Link to active project
    })
  });
  // ...
}
```

5. **Filter Conversations by Project**:
```typescript
const filteredConversations = conversations.filter(conv =>
  showAllProjects || conv.project_id === currentProject?.id
);
```

---

## Implementation Checklist

Use TodoWrite to track progress:

- [ ] Create `src/components/` directory if not exists
- [ ] Build ProjectBadge component with styling
- [ ] Build ProjectSwitcher dropdown component
- [ ] Build ProjectForm with auto-detection integration
- [ ] Build ProjectManagement page component
- [ ] Build ContextPresetSelector component
- [ ] Build ContextPresetForm component
- [ ] Add project state to App.tsx
- [ ] Integrate ProjectBadge in header
- [ ] Integrate ProjectSwitcher in sidebar
- [ ] Add "Manage Projects" menu item/modal
- [ ] Integrate ContextPresetSelector above conversation list
- [ ] Link new conversations to active project
- [ ] Filter conversations by project
- [ ] Add project badge to conversation cards
- [ ] Style all components consistently
- [ ] Test project switching workflow
- [ ] Test preset application workflow
- [ ] Test responsive layout
- [ ] Add loading states and error handling

---

## Styling Guidelines

Follow existing App.css patterns:

```css
/* Project Badge */
.project-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

/* Project Switcher */
.project-switcher {
  position: relative;
  width: 100%;
}

.project-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.project-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.project-item:hover {
  background: #2a2a2a;
}

/* Form Styles */
.project-form {
  background: #1a1a1a;
  padding: 24px;
  border-radius: 8px;
  max-width: 600px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #e0e0e0;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e0e0e0;
}

/* Buttons */
.btn-primary {
  background: #6366f1;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #5558e3;
}
```

---

## Success Criteria

✅ All 6 components built and functional
✅ Project switching works smoothly
✅ Context presets apply correctly to chat
✅ Auto-detection populates form fields
✅ Conversations filtered by active project
✅ UI is responsive and matches design mockups
✅ No console errors or warnings
✅ Loading and error states handled gracefully
✅ Dark theme consistent throughout

---

## Reference Documentation

- **Phase 1 Summary**: `docs/implementation-phase1-summary.md`
- **Phase 2 Prompt**: `docs/phase2-prompt.md`
- **API Specification**: `docs/api-specification-rest.md`
- **Design Document**: `docs/project-workspace-management.md`

---

## Start Here

1. Read `claude-ui/src/App.tsx` to understand current structure
2. Read `claude-ui/src/App.css` to understand styling patterns
3. Create `claude-ui/src/components/` directory
4. Start with ProjectBadge (simplest component)
5. Then ProjectSwitcher (requires API integration)
6. Then ProjectForm (most complex, uses detection API)
7. Build remaining components
8. Integrate into App.tsx step by step
9. Test complete workflow

Good luck! Build beautiful, functional components that make project management delightful.
