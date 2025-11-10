---
name: azure-devops-story
description: This skill should be used when users need to work with Azure DevOps user stories including creating, fetching, updating, syncing, or querying work items via REST API. Use this skill for bidirectional operations between local markdown files and Azure DevOps work items in the fyisoft organization. Activates for story creation, downloading stories, syncing markdown with Azure DevOps, bulk operations, or any Azure DevOps work item management tasks.
---

# Azure DevOps Story Management Skill

## Purpose

This skill provides comprehensive bidirectional capabilities for managing user story work items in Azure DevOps using the REST API. The skill supports complete workflows including:

- **Create**: Upload new stories from markdown to Azure DevOps
- **Fetch**: Download existing stories from Azure DevOps to markdown
- **Update**: Push changes from markdown back to Azure DevOps
- **Sync**: Bidirectional synchronization between local and remote
- **Query**: Bulk operations for multiple work items

The skill automates workflows from story document creation through API operations, work item ID management, and markdown documentation maintenance.

## When to Use This Skill

Use this skill when:
- Users request **creation** of user stories in Azure DevOps
- Users want to **fetch/download** existing stories from Azure DevOps
- Users need to **update** work items from edited markdown files
- Users want to **sync** local markdown with latest Azure DevOps changes
- Users need **bulk operations** (query multiple stories, download sprint stories)
- Work items need to be published to Azure DevOps via REST API
- Markdown story documents need bidirectional sync with Azure DevOps
- Users need guidance on Azure DevOps work item field mappings
- Troubleshooting Azure DevOps API issues (GET, POST, PATCH operations)

## Workflow Overview

### Create Workflow (Local → Azure DevOps)

The complete story creation workflow consists of six steps:

1. **Extract Story Information**: Parse user story content from markdown documents or user input
2. **Create PowerShell Script**: Generate script with proper field mappings and authentication
3. **Execute API Call**: Run script to create work item in Azure DevOps (POST)
4. **Capture Work Item ID**: Extract work item ID and URL from API response
5. **Rename Markdown File**: Update filename with work item ID prefix
6. **Update Documentation**: Add work item metadata to markdown header

### Fetch Workflow (Azure DevOps → Local)

The complete story fetch workflow consists of five steps:

1. **Identify Work Item**: Get work item ID from user or markdown filename
2. **Execute GET Request**: Fetch work item details from Azure DevOps API
3. **Parse Response**: Extract all fields from API response
4. **Generate Markdown**: Create formatted markdown using standard template
5. **Save File**: Write markdown to file with work item ID prefix

### Update Workflow (Local → Azure DevOps)

The complete story update workflow consists of five steps:

1. **Parse Markdown**: Extract Story ID and all fields from markdown
2. **Detect Changes**: Identify which fields have changed
3. **Build PATCH Request**: Create JSON Patch document with only changed fields
4. **Execute API Call**: Update work item in Azure DevOps (PATCH)
5. **Confirm Success**: Verify update and optionally refresh markdown

### Sync Workflow (Bidirectional)

The complete sync workflow consists of six steps:

1. **Read Local Markdown**: Parse existing markdown file with Story ID
2. **Fetch Latest from Azure DevOps**: Get current work item state via API
3. **Compare Fields**: Identify differences between local and remote
4. **Determine Sync Direction**: User chooses which changes to keep
5. **Apply Changes**: Update either local markdown or remote work item
6. **Confirm Sync**: Verify both sources are now consistent

### Query Workflow (Bulk Operations)

The bulk query workflow consists of six steps:

1. **Build WIQL Query**: Create query based on criteria (sprint, area, state, etc.)
2. **Execute Query**: Get list of work item IDs matching criteria
3. **Batch Fetch Details**: Retrieve full details for all matching work items
4. **Generate Markdown Files**: Create markdown for each work item
5. **Save All Files**: Write all markdown files to specified directory
6. **Report Summary**: Provide count and list of downloaded stories

## Azure DevOps Configuration

### Organization Details

- **Organization**: fyisoft
- **Project**: suitefyi
- **Default Area Path**: SuiteFYI\CloudManager Team
- **Default Iteration Path**: SuiteFYI\Saas Framework\Framework 1\Sprint 8

### Authentication

Personal Access Token (PAT) is stored in the user's global CLAUDE.md file:
- **Location**: `~/.claude/CLAUDE.md`
- **Required Permissions**: Work Items (Read & Write), Project and Team (Read)
- **Format**: Plain string token that gets base64 encoded with colon prefix

To retrieve PAT from CLAUDE.md, search for "Azure DevOps Personal Access Token" in the file.

## Step-by-Step Implementation

### Step 1: Extract Story Information

Parse the user story content to identify required fields:

**Required Field:**
- Title: Concise story title

**Recommended Fields:**
- Description: User story statement ("As a... I want... so that...")
- Story Points: Effort estimation (1, 2, 3, 5, 8, 13)
- Priority: Importance (1=Critical, 2=High, 3=Medium, 4=Low)
- Tags: Semicolon-separated keywords
- Area Path: Team or component path
- Iteration Path: Sprint or iteration
- Acceptance Criteria: Testable conditions for story completion

### Step 2: Create PowerShell Script

Use the bundled `scripts/create-work-item.ps1` script as the foundation. The script provides:

**Required Parameters:**
- `-Title`: Story title
- `-Description`: Story description
- `-PAT`: Personal Access Token

**Optional Parameters:**
- `-StoryPoints`: Default 5
- `-Priority`: Default 2 (High)
- `-AreaPath`: Default 'SuiteFYI\CloudManager Team'
- `-IterationPath`: Default 'SuiteFYI\Saas Framework\Framework 1\Sprint 8'
- `-Tags`: Default empty
- `-AcceptanceCriteria`: Default empty
- `-Organization`: Default 'fyisoft'
- `-Project`: Default 'suitefyi'

**Script Usage Pattern:**

```powershell
.\create-work-item.ps1 `
    -Title "Story Title Here" `
    -Description "As a user, I want..." `
    -PAT "YOUR_PAT_TOKEN" `
    -StoryPoints 5 `
    -Priority 1 `
    -Tags "Tag1; Tag2; Tag3" `
    -AcceptanceCriteria "Detailed acceptance criteria"
```

### Step 3: Execute API Call

Execute the PowerShell script using the Bash tool:

```bash
powershell.exe -ExecutionPolicy Bypass -File "path/to/create-work-item.ps1" -Title "..." -Description "..." -PAT "..."
```

The script will:
1. Encode PAT for Basic Authentication
2. Build JSON Patch request body
3. Send POST request to Azure DevOps REST API
4. Return structured response with work item details

**Expected Success Output:**
```
✓ Work Item Created Successfully

Work Item ID: 1473
URL: https://dev.azure.com/Fyisoft/05ab9405-2efb-4c25-a17c-6a69deabc649/_workitems/edit/1473

Next Steps:
  1. Rename markdown file to: 1473-{story-name}.md
  2. Update Story ID in markdown header to: 1473
  3. Add Azure DevOps URL to markdown header
```

### Step 4: Capture Work Item ID

Parse the script output to extract:
- **Work Item ID**: Numeric identifier (e.g., 1473)
- **URL**: Full Azure DevOps work item URL

Store these values for the remaining workflow steps.

### Step 5: Rename Markdown File

Update the markdown filename to include work item ID prefix:

**Pattern:** `{WORK_ITEM_ID}-{Story-Name}.md`

**Example:**
```bash
# Original
docs/stories/EntraId-Guest-User-Management.md

# Renamed
docs/stories/1473-EntraId-Guest-User-Management.md
```

Use the Bash tool with `mv` command to rename the file.

### Step 6: Update Markdown Documentation

Add or update the work item metadata in the markdown file header:

**Required Metadata:**
```markdown
**Story ID:** 1473
**Azure DevOps:** https://dev.azure.com/Fyisoft/05ab9405-2efb-4c25-a17c-6a69deabc649/_workitems/edit/1473
```

**Recommended Metadata:**
```markdown
**Story ID:** 1473
**Epic:** Epic Name
**Azure DevOps:** https://dev.azure.com/Fyisoft/05ab9405-2efb-4c25-a17c-6a69deabc649/_workitems/edit/1473
**Priority:** Must Have (P0)
**Story Points:** 5
```

Use the Edit tool to update the existing markdown file.

## Fetch/Download Implementation

### Step 1: Get Work Item ID

Identify the work item to fetch:
- User provides ID directly: "Fetch story 1473"
- Extract from filename: `1473-Story-Name.md` → ID is 1473
- Extract from markdown header: `**Story ID:** 1473`

### Step 2: Execute GET Request

Use the bundled `scripts/get-work-item.ps1` script:

**Script Usage Pattern:**

```powershell
.\get-work-item.ps1 `
    -WorkItemId 1473 `
    -PAT "YOUR_PAT_TOKEN" `
    -OutputPath "docs/stories"
```

**Parameters:**
- `-WorkItemId`: Required - Work item ID to fetch
- `-PAT`: Required - Personal Access Token
- `-OutputPath`: Optional - Directory or full file path for markdown output
- `-JsonOutput`: Optional - Return raw JSON instead of markdown
- `-Organization`: Optional - Default 'fyisoft'
- `-Project`: Optional - Default 'suitefyi'

### Step 3: Parse Response and Generate Markdown

The script automatically:
1. Fetches all work item fields from Azure DevOps
2. Strips HTML from Description and Acceptance Criteria
3. Formats data using standard markdown template
4. Returns markdown content and metadata

### Step 4: Save Markdown File

If OutputPath specified:
- Creates file with naming pattern: `{WorkItemId}-{SafeTitle}.md`
- Preserves all work item metadata in structured format
- Includes link back to Azure DevOps work item

**Expected Output:**
```
✓ Work Item Retrieved Successfully

Work Item ID: 1473
Title: Entra ID Guest User Management Screen
State: Active
URL: https://dev.azure.com/Fyisoft/05ab9405-2efb-4c25-a17c-6a69deabc649/_workitems/edit/1473

✓ Markdown saved to: docs/stories/1473-Entra-ID-Guest-User-Management.md
```

## Update/Sync Implementation

### Step 1: Parse Markdown for Changes

Read the markdown file and extract:
- Story ID (required for update)
- All metadata fields from table
- Description from User Story section
- Acceptance Criteria section

### Step 2: Detect Changed Fields

Compare markdown values with current Azure DevOps state:
- Fetch current work item using GET request
- Compare each field
- Build list of changed fields only

### Step 3: Build PATCH Request

Use the bundled `scripts/update-work-item.ps1` script:

**Script Usage Pattern:**

```powershell
.\update-work-item.ps1 `
    -WorkItemId 1473 `
    -PAT "YOUR_PAT_TOKEN" `
    -Description "Updated description" `
    -StoryPoints 8 `
    -State "Active"
```

**Only include parameters for fields that changed.** The script uses JSON Patch `replace` operations for efficiency.

### Step 4: Execute Update

The script will:
1. Build JSON Patch document with only changed fields
2. Send PATCH request to Azure DevOps REST API
3. Return updated work item details
4. Report which fields were updated

**Expected Output:**
```
✓ Work Item Updated Successfully

Work Item ID: 1473
Title: Entra ID Guest User Management Screen
State: Active
URL: https://dev.azure.com/Fyisoft/05ab9405-2efb-4c25-a17c-6a69deabc649/_workitems/edit/1473

Fields Updated: 3
  - System.Description
  - Microsoft.VSTS.Scheduling.StoryPoints
  - System.State
```

### Step 5: Refresh Local Markdown (Optional)

After successful update, optionally fetch latest state and update local markdown to ensure consistency.

## Bulk Query Implementation

### Step 1: Build WIQL Query

Use the bundled `scripts/query-work-items.ps1` script to query multiple stories:

**Script Usage Pattern:**

```powershell
# Query by iteration (Sprint)
.\query-work-items.ps1 `
    -PAT "YOUR_PAT_TOKEN" `
    -IterationPath "SuiteFYI\Saas Framework\Framework 1\Sprint 8" `
    -OutputPath "docs/stories/sprint8"

# Query by area path (Team)
.\query-work-items.ps1 `
    -PAT "YOUR_PAT_TOKEN" `
    -AreaPath "SuiteFYI\CloudManager Team" `
    -State "Active" `
    -OutputPath "docs/stories/active"

# Custom WIQL query
.\query-work-items.ps1 `
    -PAT "YOUR_PAT_TOKEN" `
    -Query "SELECT [System.Id] FROM WorkItems WHERE [System.Tags] CONTAINS 'EntraID' AND [System.State] = 'New'" `
    -OutputPath "docs/stories/entraid"
```

### Step 2: Execute Query

The script will:
1. Execute WIQL query to get matching work item IDs
2. Batch fetch full details for all work items
3. Generate markdown for each story
4. Save all files to output directory

### Step 3: Report Results

**Expected Output:**
```
Executing WIQL Query:
SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' AND [System.IterationPath] = 'SuiteFYI\Saas Framework\Framework 1\Sprint 8' ORDER BY [System.Id] DESC

✓ Found 12 work items

✓ Retrieved full details for all work items

  ✓ Saved: 1473-Entra-ID-Guest-User-Management.md
  ✓ Saved: 1474-API-Integration-Azure-Service-Bus.md
  ✓ Saved: 1475-Login-Page-Redesign.md
  ... (9 more)

✓ Processed 12 work items
✓ Markdown files saved to: docs/stories/sprint8
```

## Bundled Resources

### Scripts

**`scripts/create-work-item.ps1`** - Create new work items (POST)
- PowerShell script for creating work items via Azure DevOps REST API
- Handles authentication, request formatting, and error handling
- Returns structured response with work item ID and URL
- Use this script directly or as a template for custom workflows

**`scripts/get-work-item.ps1`** - Fetch existing work items (GET)
- Retrieves single work item by ID from Azure DevOps
- Generates formatted markdown using standard template
- Supports JSON output for programmatic use
- Handles HTML-to-markdown conversion automatically

**`scripts/update-work-item.ps1`** - Update existing work items (PATCH)
- Updates work items using JSON Patch format
- Only sends changed fields for efficiency
- Validates field values before sending
- Returns summary of updated fields

**`scripts/query-work-items.ps1`** - Bulk query operations (WIQL)
- Executes WIQL queries to find multiple work items
- Supports common filters (iteration, area, state, assigned to)
- Batch fetches full details for all matching items
- Generates markdown files for all results

### References

**`references/field-mappings.md`** - Field reference guide
- Comprehensive field mappings for Azure DevOps work items
- JSON Patch format examples and syntax
- Common area paths and iteration paths
- Data type specifications for all fields
- Load this reference when users need detailed field information

**`references/troubleshooting.md`** - Error resolution guide
- Common API errors and solutions for GET, POST, and PATCH operations
- Authentication troubleshooting steps
- Request format validation guidance
- Network and connectivity issue resolution
- Load this reference when API calls fail or users encounter errors

**`references/markdown-template.md`** - Template specification
- Standard markdown format for Azure DevOps stories
- Complete template structure with all sections
- Field descriptions and JSON path mappings
- Parsing guidelines for bidirectional sync
- HTML conversion rules and best practices
- Load this reference when generating or parsing markdown files

### Assets

**`assets/story-template.md`** - Blank story template
- Ready-to-use markdown template for new stories
- Pre-formatted with standard sections
- Default values for common fields
- Given-When-Then format for acceptance criteria
- Use this template when creating new story documents from scratch

## Field Mapping Quick Reference

For detailed field mappings, load `references/field-mappings.md` using the Read tool.

**Most Common Fields:**

| Field | JSON Path | Type | Example |
|-------|-----------|------|---------|
| Title | `/fields/System.Title` | String | "User Story Title" |
| Description | `/fields/System.Description` | String (HTML) | "As a user..." |
| Story Points | `/fields/Microsoft.VSTS.Scheduling.StoryPoints` | Integer | 5 |
| Priority | `/fields/Microsoft.VSTS.Common.Priority` | Integer | 1 |
| Tags | `/fields/System.Tags` | String | "Tag1; Tag2" |
| Area Path | `/fields/System.AreaPath` | String | "SuiteFYI\\Team" |
| Iteration Path | `/fields/System.IterationPath` | String | "SuiteFYI\\Sprint 8" |
| Acceptance Criteria | `/fields/Microsoft.VSTS.Common.AcceptanceCriteria` | String (HTML) | "Given... When... Then..." |

## Error Handling

When API calls fail, follow this diagnostic sequence:

1. **Check Authentication**: Verify PAT is valid and not expired
2. **Validate Request Format**: Ensure JSON Patch format is correct
3. **Verify Field Values**: Check data types and required fields
4. **Load Troubleshooting Guide**: Read `references/troubleshooting.md` for detailed solutions
5. **Examine Error Response**: Parse Azure DevOps error messages for specific issues

Common error patterns and solutions are documented in `references/troubleshooting.md`.

## Best Practices

1. **Validate Input First**: Check all required fields before creating script
2. **Test with Minimal Fields**: Start with Title only, then add optional fields
3. **Capture Output Immediately**: Save work item ID before continuing
4. **Update Documentation Atomically**: Complete all file updates before moving on
5. **Commit Together**: Add both script and markdown file in the same commit
6. **Never Commit PAT**: Ensure PAT is never added to version control
7. **Use Consistent Naming**: Always prefix filenames with work item ID
8. **Handle Errors Gracefully**: Provide clear error messages and suggested fixes

## Integration with Other Workflows

### Story Creation Workflow

When users have markdown story documents ready:
1. Read the existing markdown file
2. Extract story information
3. Execute this skill's workflow
4. Update the markdown file with work item metadata

### Bulk Story Creation

For creating multiple stories:
1. Parse all story documents
2. Create individual PowerShell scripts for each
3. Execute scripts sequentially
4. Track created work item IDs
5. Update all markdown files
6. Report summary of created items

### Story Template Processing

When using story templates (from analyst or scrum-master agents):
1. Generate story content from template
2. Validate required fields are present
3. Execute Azure DevOps creation workflow
4. Return work item ID to calling workflow

## Security Considerations

1. **PAT Storage**: Never store PAT in files that will be committed to version control
2. **PAT Rotation**: Recommend 90-day expiration for PATs
3. **Least Privilege**: PAT should have only required permissions (Work Items: Read & Write)
4. **Environment Variables**: Consider using environment variables for PAT storage
5. **Audit Logging**: All API calls are logged in Azure DevOps audit logs

## API Reference

**Azure DevOps REST API Documentation:**
https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/create

**Endpoint Format:**
```
POST https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/${workItemType}?api-version=7.0
```

**Authentication:**
- Method: Basic Authentication
- Header: `Authorization: Basic {base64EncodedPat}`
- PAT Format: `:{PAT}` (colon prefix, then base64 encode)

**Content Type:**
- `application/json-patch+json`

**Response:**
- Success: 200 OK with work item JSON
- Error: 4xx/5xx with error details

## Examples

### Example 1: Simple Story Creation

User request: "Create a story for the login page redesign"

Workflow:
1. Extract information:
   - Title: "Login Page Redesign"
   - Description: "As a user, I want an updated login page so that I have a better user experience"
   - Story Points: 5 (default)
   - Priority: 2 (default)

2. Execute script:
   ```bash
   powershell.exe -ExecutionPolicy Bypass -File ".claude/skills/azure-devops-story/scripts/create-work-item.ps1" -Title "Login Page Redesign" -Description "As a user, I want an updated login page so that I have a better user experience" -PAT "..."
   ```

3. Capture work item ID: 1480

4. Rename file:
   ```bash
   mv docs/stories/login-redesign.md docs/stories/1480-Login-Page-Redesign.md
   ```

5. Update markdown header with work item metadata

### Example 2: Detailed Story with Custom Fields

User provides complete story document with:
- Title: "Entra ID Guest User Management Screen"
- Description: Full user story statement
- Acceptance Criteria: Detailed acceptance criteria
- Story Points: 8
- Priority: 1 (Critical)
- Tags: "EntraID; GuestUser; UserManagement"
- Area Path: "SuiteFYI\CloudManager Team"

Execute script with all parameters specified, following the same six-step workflow.

### Example 3: Fetch Single Story

User request: "Download story 1473 from Azure DevOps"

Workflow:
1. Execute fetch script:
   ```bash
   powershell.exe -ExecutionPolicy Bypass -File ".claude/skills/azure-devops-story/scripts/get-work-item.ps1" -WorkItemId 1473 -PAT "..." -OutputPath "docs/stories"
   ```

2. Script fetches work item and generates markdown

3. File saved as: `docs/stories/1473-Entra-ID-Guest-User-Management.md`

4. Confirm success and show user the file location

### Example 4: Bulk Download Sprint Stories

User request: "Download all stories from Sprint 8"

Workflow:
1. Execute query script:
   ```bash
   powershell.exe -ExecutionPolicy Bypass -File ".claude/skills/azure-devops-story/scripts/query-work-items.ps1" -PAT "..." -IterationPath "SuiteFYI\Saas Framework\Framework 1\Sprint 8" -OutputPath "docs/stories/sprint8"
   ```

2. Script queries Azure DevOps for all matching stories

3. Generates markdown file for each story

4. Report: "✓ Downloaded 12 stories to docs/stories/sprint8"

### Example 5: Update Story from Edited Markdown

User edits `docs/stories/1473-Entra-ID-Guest-User-Management.md` and changes:
- Story Points: 5 → 8
- State: New → Active
- Description: Updated with additional details

Workflow:
1. Parse markdown to detect changes

2. Execute update script:
   ```bash
   powershell.exe -ExecutionPolicy Bypass -File ".claude/skills/azure-devops-story/scripts/update-work-item.ps1" -WorkItemId 1473 -PAT "..." -StoryPoints 8 -State "Active" -Description "Updated description..."
   ```

3. Script updates only the 3 changed fields

4. Confirm: "✓ Updated 3 fields in work item 1473"

### Example 6: Sync Local Markdown with Azure DevOps Changes

Story 1473 was updated in Azure DevOps by another team member:
- Assigned To: Changed to "Jane Doe"
- Acceptance Criteria: Additional criteria added

User request: "Sync docs/stories/1473-Entra-ID-Guest-User-Management.md with Azure DevOps"

Workflow:
1. Extract Story ID from filename: 1473

2. Fetch latest from Azure DevOps:
   ```bash
   powershell.exe -ExecutionPolicy Bypass -File ".claude/skills/azure-devops-story/scripts/get-work-item.ps1" -WorkItemId 1473 -PAT "..."
   ```

3. Compare with local markdown

4. Ask user: "Azure DevOps has 2 changed fields. Update local markdown?"

5. If yes, update local file with latest values

6. Confirm: "✓ Synced markdown with Azure DevOps changes"

### Example 7: Error Recovery

API call fails with 401 Unauthorized error.

Recovery workflow:
1. Load `references/troubleshooting.md`
2. Identify authentication error section
3. Verify PAT from CLAUDE.md
4. Check PAT expiration in Azure DevOps
5. Generate new PAT if expired
6. Retry API call with updated PAT

## Success Criteria

### Create Operation Success
- ✅ Work item created in Azure DevOps with correct fields
- ✅ Work item ID captured from API response
- ✅ Markdown file renamed with work item ID prefix
- ✅ Markdown header updated with Story ID and Azure DevOps URL
- ✅ All changes committed to version control (excluding PAT)
- ✅ User receives confirmation with work item URL

### Fetch Operation Success
- ✅ Work item retrieved from Azure DevOps
- ✅ Markdown generated with standard template format
- ✅ All fields properly formatted
- ✅ HTML converted to markdown
- ✅ File saved with correct naming convention
- ✅ User receives confirmation with file location

### Update Operation Success
- ✅ Changed fields identified correctly
- ✅ PATCH request contains only modified fields
- ✅ Work item updated in Azure DevOps
- ✅ Update confirmation received
- ✅ Optional: Local markdown refreshed with latest state
- ✅ User receives field update summary

### Sync Operation Success
- ✅ Differences detected between local and remote
- ✅ User informed of conflicts/changes
- ✅ Correct sync direction applied
- ✅ Both local and remote now consistent
- ✅ No data loss during sync
- ✅ User receives sync confirmation

### Query Operation Success
- ✅ WIQL query executed successfully
- ✅ All matching work items found
- ✅ Markdown generated for each story
- ✅ All files saved to output directory
- ✅ Summary report provided to user
- ✅ No duplicate files created
