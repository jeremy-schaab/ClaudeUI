# Implementation Plan: Topics Feature

## Overview
Add a new organizational layer called "Topics" that groups related conversations within a project.

## Hierarchy Structure
```
Project (workspace)
  └─ Topic (group of conversations)
      └─ Conversation (message thread)
          └─ Message (individual exchanges)
```

---

## Phase 1: Database Schema Changes

### 1.1 Create Topics Table
```sql
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_topics_project ON topics(project_id);
CREATE INDEX idx_topics_favorite ON topics(is_favorite) WHERE is_favorite = 1;
```

### 1.2 Update Conversations Table
```sql
ALTER TABLE conversations ADD COLUMN topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL;
CREATE INDEX idx_conversations_topic ON conversations(topic_id);
```

**Note:** Conversations can exist without a topic (topic_id = NULL) for backward compatibility.

### 1.3 Database Functions to Add
- `createTopic(projectId, name, description, color)`
- `updateTopic(id, name, description, color, isFavorite)`
- `getTopicsByProject(projectId)`
- `getTopic(id)`
- `deleteTopic(id)` - sets conversations.topic_id = NULL (soft unlink)
- `getConversationsByTopic(topicId)`
- `updateConversationTopic(conversationId, topicId)` - move conversation to topic

---

## Phase 2: Backend API Endpoints

### 2.1 Topics Management
```
POST   /api/projects/:projectId/topics          - Create new topic
GET    /api/projects/:projectId/topics          - Get all topics for project
GET    /api/topics/:id                          - Get topic by ID
PUT    /api/topics/:id                          - Update topic
PATCH  /api/topics/:id                          - Partial update (e.g., favorite)
DELETE /api/topics/:id                          - Delete topic (unlinks conversations)
```

### 2.2 Topic-Conversation Association
```
GET    /api/topics/:id/conversations            - Get conversations in topic
PATCH  /api/conversations/:id/topic             - Move conversation to different topic
POST   /api/conversations                       - Add topic_id field (optional)
```

---

## Phase 3: Frontend Components

### 3.1 Remove Empty "Projects" Menu Item
- Update navigation in App.tsx
- Remove "Projects" from the Chats/Projects/Files menu
- Keep "Chats" and "Files" only

### 3.2 Create New Components

**TopicsList.tsx** (replaces/enhances sidebar conversation list)
- Shows topics for current project
- Expandable/collapsible topics showing conversations within
- Favorite topics pinned to top
- Color-coded topic badges

**TopicManager.tsx** (modal)
- Create/edit/delete topics
- Move conversations between topics
- Set topic color and icon
- Mark favorites

**TopicSelector.tsx** (dropdown in message input area)
- Select which topic new conversation should belong to
- Option: "No Topic" (ungrouped)

### 3.3 UI Changes to Existing Components

**Sidebar Updates:**
```
Current:
  Recent Chats
    - Conversation 1
    - Conversation 2

New:
  Recent Topics
    📁 Authentication (3)           ← expandable
      - Login flow conversation
      - Password reset conversation
      - 2FA implementation
    ⭐ Database Design (5)          ← favorite topic
      - Schema planning
      - Migration strategy
      ...
    Ungrouped (2)                   ← conversations without topic
      - Quick question
      - Another chat
```

**Navigation:**
```
Before: [Chats] [Projects] [Files]
After:  [Topics] [Files]
```

---

## Phase 4: Implementation Steps

### Step 1: Database Layer (database.js)
1. Add migration for topics table
2. Add topic_id column to conversations
3. Implement topic CRUD functions
4. Implement conversation-topic association functions
5. Update conversation queries to include topic info
6. Export new functions

### Step 2: Backend API (index.js)
1. Import new database functions
2. Implement topic CRUD endpoints
3. Update conversation creation to accept topic_id
4. Add endpoint to move conversations between topics
5. Update conversation queries to include topic_id

### Step 3: Frontend Components
1. Create TopicsList.tsx
2. Create TopicManager.tsx
3. Create TopicSelector.tsx
4. Update App.tsx navigation (remove "Projects")
5. Update sidebar to use TopicsList
6. Add topic management button

### Step 4: Frontend Integration (App.tsx)
1. Add topic state management
2. Load topics when project selected
3. Pass topic_id when creating conversations
4. Update conversation loading to group by topics
5. Handle topic selection/expansion

### Step 5: Styling (App.css)
1. Topic list styles
2. Expandable/collapsible topic sections
3. Topic badges with custom colors
4. Topic manager modal styles

---

## Phase 5: Migration Strategy

### Existing Conversations
- All existing conversations will have `topic_id = NULL`
- Displayed in "Ungrouped" section in sidebar
- Users can manually organize into topics
- Option: Auto-suggest topics based on conversation titles

### Default Topic Creation
- When first topic is created for a project, offer to move existing conversations
- Provide bulk actions: "Move all to this topic" or "Keep ungrouped"

---

## Phase 6: UX Enhancements (Future)

### Smart Features
1. **Auto-suggest topics** - Analyze conversation content to suggest topic
2. **Topic templates** - Pre-defined topics for common use cases
3. **Cross-project topics** - Advanced: topics that span multiple projects
4. **Topic analytics** - Show conversation count, last updated, etc.
5. **Topic search** - Filter topics and conversations
6. **Drag-and-drop** - Move conversations between topics via drag

### UI Improvements
1. Topic color picker with presets
2. Icon selector for topics
3. Topic description shown on hover
4. Breadcrumb navigation: Project > Topic > Conversation
5. Quick-create topic from conversation sidebar

---

## Database Schema Summary

### New Table
```
topics
  - id
  - project_id (FK)
  - name
  - description
  - color
  - icon
  - is_favorite
  - created_at
  - updated_at
```

### Updated Table
```
conversations
  - ... existing fields ...
  - project_id (existing)
  - topic_id (NEW, nullable)
```

---

## Key Design Decisions

1. **Topics are project-specific** - Each topic belongs to one project
2. **Conversations can be ungrouped** - topic_id can be NULL
3. **Deleting a topic doesn't delete conversations** - Just unlinks them
4. **Topics are optional** - Users can continue using just conversations
5. **Backward compatible** - Existing conversations work without topics

---

## Testing Checklist

- [ ] Create topic within project
- [ ] Create conversation within topic
- [ ] Create conversation without topic (ungrouped)
- [ ] Move conversation between topics
- [ ] Switch projects → see different topics
- [ ] Delete topic → conversations become ungrouped
- [ ] Favorite topic appears at top
- [ ] Expand/collapse topics in sidebar
- [ ] Existing conversations still accessible (ungrouped)
