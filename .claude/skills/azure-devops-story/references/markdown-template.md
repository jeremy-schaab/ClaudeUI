# Azure DevOps Story Markdown Template

This document defines the standard markdown format for Azure DevOps User Story documents, used for both creating new stories and downloading existing ones.

## Template Structure

### Header Section
```markdown
# {Story Title}

**Story ID:** {WorkItemId}
**State:** {State}
**Azure DevOps:** {WorkItemUrl}
```

### Metadata Table
```markdown
## Metadata

| Field | Value |
|-------|-------|
| **Priority** | {Priority} |
| **Story Points** | {StoryPoints} |
| **Area Path** | {AreaPath} |
| **Iteration Path** | {IterationPath} |
| **Assigned To** | {AssignedTo} |
| **Value Area** | {ValueArea} |
| **Risk** | {Risk} |
| **Tags** | {Tags} |
```

### User Story Section
```markdown
## User Story

{Description}
```

### Acceptance Criteria Section
```markdown
## Acceptance Criteria

{AcceptanceCriteria}
```

### Footer Section
```markdown
---

**Created:** {CreatedDate} by {CreatedBy}
**Last Modified:** {ModifiedDate}
**Work Item Type:** {WorkItemType}
```

## Complete Example

```markdown
# Entra ID Guest User Management Screen

**Story ID:** 1473
**State:** Active
**Azure DevOps:** https://dev.azure.com/Fyisoft/05ab9405-2efb-4c25-a17c-6a69deabc649/_workitems/edit/1473

## Metadata

| Field | Value |
|-------|-------|
| **Priority** | 1 |
| **Story Points** | 5 |
| **Area Path** | SuiteFYI\CloudManager Team |
| **Iteration Path** | SuiteFYI\Saas Framework\Framework 1\Sprint 8 |
| **Assigned To** | John Smith |
| **Value Area** | Business |
| **Risk** | 2 - Medium |
| **Tags** | EntraID; GuestUser; UserManagement |

## User Story

As a Cloud Manager Administrator, I want a dedicated screen to view and manage Entra ID guest users who have been invited, so that I can monitor guest user invitation status, resend invitations when needed, and manually add new guest users to the tenant.

## Acceptance Criteria

- Given I am an administrator, when I navigate to the Guest Users screen, then I see a list of all guest users with their invitation status
- Given a guest user has not accepted their invitation, when I select the user, then I can resend the invitation email
- Given I want to add a new guest user, when I click "Add Guest User", then I can enter their email and send an invitation
- Given the guest user list is large, when I use the search functionality, then I can filter users by email or display name
- Given I select a guest user, when I view their details, then I see their profile information, invitation date, and acceptance status

---

**Created:** 2025-01-15T10:30:00Z by Jane Doe
**Last Modified:** 2025-01-16T14:22:00Z
**Work Item Type:** User Story
```

## Field Descriptions

### Header Fields

| Field | Description | Source |
|-------|-------------|--------|
| Story Title | Concise title of the user story | `System.Title` |
| Story ID | Unique work item identifier | `System.Id` |
| State | Current work item state | `System.State` |
| Azure DevOps | Direct link to work item | `_links.html.href` |

### Metadata Fields

| Field | Description | Source | Type |
|-------|-------------|--------|------|
| Priority | Importance level (1-4) | `Microsoft.VSTS.Common.Priority` | Integer |
| Story Points | Effort estimation | `Microsoft.VSTS.Scheduling.StoryPoints` | Integer |
| Area Path | Team or component | `System.AreaPath` | String |
| Iteration Path | Sprint or iteration | `System.IterationPath` | String |
| Assigned To | Person responsible | `System.AssignedTo.displayName` | String |
| Value Area | Business or Architectural | `Microsoft.VSTS.Common.ValueArea` | String |
| Risk | Risk level (1-3) | `Microsoft.VSTS.Common.Risk` | String |
| Tags | Semicolon-separated keywords | `System.Tags` | String |

### Content Fields

| Field | Description | Source | Format |
|-------|-------------|--------|--------|
| Description | User story statement | `System.Description` | HTML (converted to markdown) |
| Acceptance Criteria | Testable conditions | `Microsoft.VSTS.Common.AcceptanceCriteria` | HTML (converted to markdown) |

### Footer Fields

| Field | Description | Source |
|-------|-------------|--------|
| Created | Creation timestamp and author | `System.CreatedDate`, `System.CreatedBy.displayName` |
| Last Modified | Last update timestamp | `System.ChangedDate` |
| Work Item Type | Type of work item | `System.WorkItemType` |

## Parsing Guidelines

When parsing markdown files to extract work item information:

1. **Extract Story ID**:
   - Pattern: `**Story ID:** {number}`
   - Use this ID for API operations

2. **Extract Metadata**:
   - Parse metadata table using markdown table format
   - Map table rows to Azure DevOps field paths

3. **Extract Content**:
   - User Story section: Everything between `## User Story` and next `##` heading
   - Acceptance Criteria: Everything between `## Acceptance Criteria` and `---` separator

4. **Handle HTML Conversion**:
   - Description and Acceptance Criteria may contain HTML
   - Convert markdown to HTML when uploading: `**bold**` → `<strong>bold</strong>`
   - Strip HTML when downloading: `<strong>bold</strong>` → `**bold**`

## Bidirectional Sync Rules

### Uploading (Local → Azure DevOps)

When creating or updating work items from markdown:

1. **Required Fields**:
   - Title (from `# {Title}` heading)
   - Description (from `## User Story` section)

2. **Optional Fields**:
   - All metadata table fields
   - Acceptance Criteria
   - Tags

3. **Field Mapping**:
   - Convert markdown metadata table to JSON Patch operations
   - Use `add` for creation, `replace` for updates

### Downloading (Azure DevOps → Local)

When fetching work items and generating markdown:

1. **Always Include**:
   - Story ID
   - Title
   - State
   - Azure DevOps URL
   - Description

2. **Include if Present**:
   - All metadata fields (use "N/A" or empty if not set)
   - Acceptance Criteria
   - Tags

3. **Format Considerations**:
   - Strip HTML tags from Description and Acceptance Criteria
   - Convert line breaks appropriately
   - Handle special characters in titles for filenames

## File Naming Convention

When saving markdown files:

**Pattern:** `{WorkItemId}-{SafeTitle}.md`

**Rules:**
- WorkItemId: Numeric work item ID
- SafeTitle: Title with special characters removed, spaces replaced with hyphens
- Max length: Keep total filename under 255 characters

**Examples:**
- `1473-Entra-ID-Guest-User-Management.md`
- `1480-Login-Page-Redesign.md`
- `1525-API-Integration-Azure-Service-Bus.md`

## Validation Rules

### Required Sections
- ✅ Header with Story ID
- ✅ Metadata table
- ✅ User Story section with description
- ⚠️  Acceptance Criteria (recommended)

### Optional Sections
- Footer with timestamps
- Additional custom sections after Acceptance Criteria

### Quality Checks

When validating markdown before upload:

1. **Story ID present**: Required for updates, omitted for new stories
2. **Title not empty**: Required field
3. **Description not empty**: Required field
4. **Story Points valid**: Must be positive integer
5. **Priority valid**: Must be 1-4
6. **Paths exist**: AreaPath and IterationPath must exist in Azure DevOps
7. **State valid**: Must match allowed states ("New", "Active", "Resolved", "Closed")

## Error Handling

### Common Issues

**Missing Story ID:**
- Cannot update work item without ID
- Create new work item instead

**Invalid Field Values:**
- Validate against field constraints before upload
- Provide clear error messages with expected format

**HTML Conversion Errors:**
- Preserve original markdown formatting
- Test HTML conversion before upload

**File Name Conflicts:**
- Check if file already exists
- Prompt user before overwriting

## Best Practices

1. **Consistent Format**: Always use this template structure
2. **Complete Metadata**: Fill all metadata fields when available
3. **Clear Descriptions**: Write clear user story statements
4. **Testable Criteria**: Use Given-When-Then format for acceptance criteria
5. **Meaningful Tags**: Use consistent tagging strategy
6. **Version Control**: Commit markdown files to git
7. **Sync Regularly**: Keep local and Azure DevOps in sync
8. **Audit Trail**: Preserve Created/Modified footer information
