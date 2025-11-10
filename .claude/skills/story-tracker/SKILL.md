---
name: story-tracker
description: This skill should be used when users need to create and manage implementation tracking files for Azure DevOps user stories. It automates progress tracking, checklist generation, file modification tracking, and status synchronization with Azure DevOps.
---

# Story Tracker

Automated creation and management of implementation tracking files for Azure DevOps user stories.

## Purpose

This skill streamlines the process of tracking story implementation progress by:
- Automatically parsing story markdown files
- Generating implementation tracking documents
- Maintaining progress checklists
- Tracking file modifications
- Syncing with Azure DevOps story status

Based on the proven pattern from Story 1340 implementation tracking.

## Commands

### create-tracking [story-number] [--story-file <path>]

Creates a new implementation tracking file for a story.

**Usage:**
```bash
create-tracking 1340
create-tracking 1340 --story-file docs/stories/devops/1340-As-a-System-Administrator.md
```

**What it does:**
1. Reads the story markdown file
2. Extracts acceptance criteria and features
3. Generates phase-based checklist
4. Creates tracking file with status tracking
5. Adds git integration for file tracking

---

### update-progress [story-number] --complete <task-id>

Updates progress on a specific task in the tracking file.

**Usage:**
```bash
update-progress 1340 --complete "Clone User Feature"
update-progress 1340 --complete "Phase 1"
```

**What it does:**
1. Locates the tracking file
2. Marks specified task as complete
3. Updates timestamps
4. Regenerates progress summary
5. Commits changes to git

---

### add-phase [story-number] --name <phase-name>

Adds a new implementation phase to the tracking file.

**Usage:**
```bash
add-phase 1340 --name "Phase 3: Testing"
```

**What it does:**
1. Adds new phase section to tracking file
2. Creates task checklist for the phase
3. Updates status summary
4. Maintains proper markdown formatting

---

### track-files [story-number]

Updates the "Files Modified" section with actual git changes.

**Usage:**
```bash
track-files 1340
```

**What it does:**
1. Runs git diff to find changed files
2. Categorizes changes (Backend, Frontend, Config, Tests)
3. Updates "Files Modified" section
4. Adds commit hashes and descriptions

---

### generate-summary [story-number]

Generates a comprehensive summary of story implementation.

**Usage:**
```bash
generate-summary 1340
```

**What it does:**
1. Analyzes all completed tasks
2. Counts features implemented
3. Lists files modified
4. Generates "What Was Built" summary
5. Creates "Next Actions" checklist

---

### sync-status [story-number] [--to-azure-devops]

Syncs tracking file status with Azure DevOps.

**Usage:**
```bash
sync-status 1340
sync-status 1340 --to-azure-devops
```

**What it does:**
1. Reads current tracking status
2. Calculates completion percentage
3. Updates story status markers
4. Optionally syncs to Azure DevOps via API

---

## Configuration

Tracking files follow patterns defined in:
- `assets/tracking-template.json` - Tracking file structure
- `assets/story-patterns.json` - Story parsing patterns
- `assets/status-mappings.json` - Status and emoji mappings

## Templates

Located in `templates/` directory:
- `tracking-file.md.template` - Main tracking file structure
- `phase-section.md.template` - Phase section template
- `status-update.md.template` - Status update template

## Scripts

Located in `scripts/` directory:
- `parse-story.sh` - Extracts information from story markdown
- `create-tracking-file.sh` - Generates new tracking file
- `track-git-changes.sh` - Tracks file modifications via git

### Planned Scripts (Future Enhancement)
- `update-checklist.sh` - Updates task completion status
- `generate-summary.sh` - Creates implementation summary

## Workflows

Workflows are planned for future implementation to provide automated story lifecycle management and daily progress updates.

## Examples

### Create tracking for new story
```bash
# Create tracking file
create-tracking 1350 --story-file docs/stories/devops/1350-Export-Users.md

# Generated: docs/stories/devops/1350-implementation-tracking.md
```

### Update progress during implementation
```bash
# Mark task complete
update-progress 1350 --complete "Backend API implementation"

# Track files modified
track-files 1350

# Generate summary
generate-summary 1350
```

### Complete a phase
```bash
# Mark entire phase complete
update-progress 1350 --complete "Phase 1"

# Sync status
sync-status 1350
```

## Tracking File Structure

Generated tracking files follow this structure:

```markdown
# Story {number} - Implementation Tracking

**Story:** {story title}
**Features:** {extracted features}
**Started:** {date}
**Status:** {status with emoji}

---

## Implementation Progress

### Phase 1: {name} {status emoji}
#### ✅ Completed Tasks
- [x] Task 1
- [x] Task 2

#### ⏳ Pending Tasks
- [ ] Task 3

---

## Current Status Update
{date-stamped status updates}

---

## Files Modified
### Backend Changes
- ✅ file/path.cs (commit hash)

### Frontend Components
- ✅ component/path.razor (commit hash)

---

## Implementation Summary
### What Was Built
{auto-generated summary}

### Next Actions
{remaining tasks}
```

## Status Markers

- ✅ Complete
- ⏳ In Progress / Pending
- ❌ Blocked / Failed
- ⚠️ Warning / Attention Needed
- 🔍 Under Review
- 📝 Draft / Planning

## Success Criteria

You have successfully used this skill when:

### Tracking File Created
- ✅ Generated file follows naming convention: `{story-number}-implementation-tracking.md`
- ✅ All required sections present (Progress, Status, Files Modified, Summary)
- ✅ Story metadata extracted correctly (title, features, acceptance criteria)
- ✅ Phase checklists generated based on story complexity

### Progress Tracked
- ✅ Task completion status accurately reflects implementation
- ✅ Timestamps recorded for all status updates
- ✅ Progress percentage calculated correctly

### Files Tracked
- ✅ Git changes detected and categorized (Backend, Frontend, Config, Tests)
- ✅ Commit hashes linked to modifications
- ✅ File paths accurately reflect repository structure

### Status Synchronized
- ✅ Tracking file status matches Azure DevOps work item
- ✅ Completion percentage synced (if --to-azure-devops used)
- ✅ Status markers consistent throughout document

### Summary Generated
- ✅ Implementation summary captures key accomplishments
- ✅ Next actions clearly defined
- ✅ Ready for PR creation and code review

## Best Practices

1. **Create tracking files at story start**: Don't wait until implementation begins
2. **Update frequently**: Mark tasks complete as you finish them
3. **Track files immediately**: Run track-files after each commit
4. **Add notes**: Document decisions and blockers in status updates
5. **Generate summaries**: Create summaries before PR creation

## Integration with Git

The skill integrates with git to:
- Track file modifications automatically
- Record commit hashes
- Generate change logs
- Link commits to tasks
- Detect implementation scope

## Troubleshooting

### Issue: Story file not found
**Problem:** `create-tracking` fails with "Story file not found"

**Solution:**
- Verify story file path is correct
- Check file exists: `ls docs/stories/devops/{story-number}-*.md`
- Use `--story-file` flag to specify custom path

### Issue: Git tracking returns no files
**Problem:** `track-files` shows no modifications

**Solution:**
- Ensure you're in git repository root
- Check git status: `git status`
- Verify files are committed: `git diff --name-status`
- Run from correct directory containing .git folder

### Issue: Azure DevOps sync fails
**Problem:** `sync-status --to-azure-devops` authentication error

**Solution:**
- Verify PAT token configured in `~/.claude/CLAUDE.md`
- Check token permissions (Work Items: Read & Write)
- Test connection: `curl -u :{PAT} https://dev.azure.com/{org}/_apis/projects`

### Issue: Tracking file format corrupted
**Problem:** Manual edits broke markdown structure

**Solution:**
- Compare to template: `.claude/skills/story-tracker/templates/tracking-file.md.template`
- Regenerate file: `create-tracking {story-number} --force`
- Restore from git: `git checkout -- docs/stories/devops/{story-number}-implementation-tracking.md`

### Issue: Script permissions denied
**Problem:** Scripts not executable

**Solution:**
- Make scripts executable: `chmod +x .claude/skills/story-tracker/scripts/*.sh`
- Verify: `ls -la .claude/skills/story-tracker/scripts/`

## Security Considerations

### Azure DevOps Access
- **PAT Token Required:** Personal Access Token with Work Items (Read & Write) scope
- **Token Storage:** Configure in `~/.claude/CLAUDE.md` (gitignored)
- **Token Permissions:** Minimum required: `vso.work_write`
- **Never commit:** Ensure PAT token not in tracking files or git history

### Git Repository Access
- **Read Access:** Required to track file modifications
- **Write Access:** Required for committing tracking file updates
- **Branch Permissions:** Respect repository branch protection rules

### File Permissions
- **Tracking Files:** World-readable OK (no sensitive data)
- **Scripts:** Must be executable (chmod +x)
- **Config Files:** World-readable OK (no secrets)

## Notes

- Tracking files are stored alongside story files in `docs/stories/devops/`
- Files follow naming convention: `{story-number}-implementation-tracking.md`
- All dates are in ISO format (YYYY-MM-DD)
- Status updates are chronologically ordered
- File tracking works with any git branch
