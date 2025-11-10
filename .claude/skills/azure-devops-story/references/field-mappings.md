# Azure DevOps Work Item Field Mappings

This document provides comprehensive field mappings for Azure DevOps User Story work items.

## Organization Configuration

**Organization:** fyisoft
**Project:** suitefyi
**Default Area Path:** SuiteFYI\CloudManager Team
**Default Iteration Path:** SuiteFYI\Saas Framework\Framework 1\Sprint 8

## Required Fields

| Field | JSON Path | Type | Notes |
|-------|-----------|------|-------|
| Title | `/fields/System.Title` | String | Work item title (required) |

## Optional Fields (Recommended)

| Field | JSON Path | Type | Example Value |
|-------|-----------|------|---------------|
| Description | `/fields/System.Description` | String (HTML) | "As a user, I want..." |
| Area Path | `/fields/System.AreaPath` | String | "SuiteFYI\\CloudManager Team" |
| Iteration Path | `/fields/System.IterationPath` | String | "SuiteFYI\\Saas Framework\\Framework 1\\Sprint 8" |
| Priority | `/fields/Microsoft.VSTS.Common.Priority` | Integer | 1 (Critical), 2 (High), 3 (Medium), 4 (Low) |
| Story Points | `/fields/Microsoft.VSTS.Scheduling.StoryPoints` | Integer | 1, 2, 3, 5, 8, 13 |
| Tags | `/fields/System.Tags` | String (semicolon-separated) | "Tag1; Tag2; Tag3" |
| State | `/fields/System.State` | String | "New", "Active", "Resolved", "Closed" |
| Assigned To | `/fields/System.AssignedTo` | String (email) | "user@domain.com" |

## User Story Specific Fields

| Field | JSON Path | Type | Notes |
|-------|-----------|------|-------|
| Acceptance Criteria | `/fields/Microsoft.VSTS.Common.AcceptanceCriteria` | String (HTML) | Detailed acceptance criteria |
| Risk | `/fields/Microsoft.VSTS.Common.Risk` | String | "1 - High", "2 - Medium", "3 - Low" |
| Value Area | `/fields/Microsoft.VSTS.Common.ValueArea` | String | "Business", "Architectural" |

## Common Area Paths

- `SuiteFYI\CloudManager Team`
- `SuiteFYI\Budget Team`
- `SuiteFYI\Connect Team`
- `SuiteFYI\Report Team`

## Common Iteration Paths

- `SuiteFYI\Saas Framework\Framework 1\Sprint 8`
- `SuiteFYI\Saas Framework\Framework 1\Sprint 9`
- `SuiteFYI\Saas Framework\Framework 1\Sprint 10`

## JSON Patch Format

Azure DevOps REST API uses **JSON Patch** format (RFC 6902) for creating and updating work items.

### Basic Structure

```json
[
  {
    "op": "add",
    "path": "/fields/System.Title",
    "value": "Story Title"
  },
  {
    "op": "add",
    "path": "/fields/System.Description",
    "value": "Story description"
  }
]
```

### Operations

- **add**: Add a new field value (used when creating work items)
- **replace**: Update an existing field value
- **remove**: Remove a field value
- **test**: Test if a field has a specific value

## Important Notes

1. **Path Escaping**: Area and Iteration paths use double backslashes: `SuiteFYI\\CloudManager Team`
2. **Tags Format**: Multiple tags are semicolon-separated with spaces: `"Tag1; Tag2; Tag3"`
3. **HTML Fields**: Description and Acceptance Criteria fields support HTML formatting
4. **Priority Values**: Lower numbers = higher priority (1 is highest)
