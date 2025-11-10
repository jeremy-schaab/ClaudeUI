# Azure DevOps API Troubleshooting Guide

Common errors and solutions when creating work items via Azure DevOps REST API.

## Authentication Errors

### 401 Unauthorized

**Symptoms:**
- API returns 401 status code
- Error message: "TF400813: The user is not authorized to access this resource"

**Causes:**
- Invalid or expired PAT token
- PAT not properly encoded
- PAT lacks required permissions

**Solutions:**
1. Verify PAT is current and not expired in Azure DevOps settings
2. Check PAT has "Work Items: Read & Write" permission
3. Ensure PAT is properly base64 encoded with colon prefix: `:{PAT}`
4. Test PAT encoding:
   ```powershell
   $pat = 'YOUR_PAT'
   $base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
   Write-Output $base64
   ```

## Request Format Errors

### Invalid Patch Document

**Symptoms:**
- API returns 400 status code
- Error message: "The request body must be a valid JSON Patch document"

**Causes:**
- Malformed JSON in request body
- Incorrect JSON Patch format
- Invalid field paths
- Wrong data types

**Solutions:**
1. Verify JSON syntax is valid (proper quotes, commas, brackets)
2. Ensure all paths start with `/fields/`
3. Check data types match field requirements:
   - String fields: Use quoted strings
   - Integer fields: Use unquoted numbers
   - Boolean fields: Use `true` or `false` (unquoted)
4. Validate JSON structure:
   ```powershell
   $body | ConvertFrom-Json | ConvertTo-Json
   ```

### Area Path or Iteration Path Not Found

**Symptoms:**
- API returns 400 status code
- Error message: "Area path does not exist" or "Iteration path does not exist"

**Causes:**
- Path doesn't exist in Azure DevOps project
- Incorrect path format
- Missing double backslashes

**Solutions:**
1. Verify path exists in Azure DevOps Project Settings → Boards → Project Configuration
2. Use double backslashes: `SuiteFYI\\CloudManager Team` (not single `\`)
3. Check spelling and capitalization exactly match Azure DevOps
4. List available paths via API:
   ```powershell
   # List area paths
   GET https://dev.azure.com/{org}/{project}/_apis/wit/classificationnodes/areas?$depth=10&api-version=7.0

   # List iteration paths
   GET https://dev.azure.com/{org}/{project}/_apis/wit/classificationnodes/iterations?$depth=10&api-version=7.0
   ```

### Work Item Type Not Found

**Symptoms:**
- API returns 404 status code
- Error message: "Work item type does not exist"

**Causes:**
- Incorrect work item type in URL
- Space not properly handled in URL

**Solutions:**
1. Ensure URL uses `$User Story` (with space and $ prefix)
2. Use proper URL encoding: `$User%20Story`
3. PowerShell handles encoding automatically with backtick: `` `$User Story ``
4. Valid work item types:
   - `$User Story`
   - `$Task`
   - `$Bug`
   - `$Epic`
   - `$Feature`

## Field Value Errors

### Invalid Field Value

**Symptoms:**
- API returns 400 status code
- Error message: "The value is not valid for this field"

**Causes:**
- Wrong data type for field
- Value exceeds field constraints
- Invalid enum value

**Solutions:**
1. **Priority**: Must be integer 1-4
2. **Story Points**: Must be positive integer or decimal
3. **State**: Must match valid state values: "New", "Active", "Resolved", "Closed"
4. **Tags**: Must be semicolon-separated string
5. **Assigned To**: Must be valid user email or display name

### Required Field Missing

**Symptoms:**
- API returns 400 status code
- Error message: "Required field is missing"

**Causes:**
- System.Title field not provided
- Custom required fields not populated

**Solutions:**
1. Always include System.Title field
2. Check project settings for custom required fields
3. Verify process template requirements (Agile, Scrum, CMMI)

## Network and Connection Errors

### Connection Timeout

**Symptoms:**
- Request takes too long
- Timeout error after 30+ seconds

**Causes:**
- Network connectivity issues
- Azure DevOps service degradation
- Proxy configuration issues

**Solutions:**
1. Check network connectivity to dev.azure.com
2. Verify Azure DevOps service status: https://status.dev.azure.com
3. Check corporate proxy settings
4. Increase timeout in PowerShell:
   ```powershell
   Invoke-RestMethod -Uri $uri -TimeoutSec 120
   ```

### SSL/TLS Errors

**Symptoms:**
- SSL certificate validation errors
- TLS handshake failures

**Causes:**
- Corporate SSL inspection
- Outdated TLS version
- Certificate trust issues

**Solutions:**
1. Ensure TLS 1.2 is enabled:
   ```powershell
   [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
   ```
2. Check corporate proxy/SSL inspection settings
3. For development only (NOT production):
   ```powershell
   # INSECURE - Development only
   [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
   ```

## Best Practices for Error Prevention

1. **Validate inputs before API call**: Check required fields, data types, and formats
2. **Use try-catch blocks**: Capture detailed error information
3. **Log requests and responses**: Store API calls for debugging
4. **Test with minimal fields first**: Start with Title only, then add fields incrementally
5. **Use consistent templates**: Create PowerShell script templates for different work item types
6. **Check Azure DevOps status**: Verify service health before troubleshooting
7. **Read error response body**: Contains detailed validation error messages

## Debugging PowerShell API Calls

```powershell
# Enable verbose output
$VerbosePreference = 'Continue'

# Capture full error details
try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
} catch {
    Write-Error "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Error "Status Description: $($_.Exception.Response.StatusDescription)"

    # Read response body
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Error "Response Body: $responseBody"
}
```

## GET Request Errors (Fetch Operations)

### 404 Not Found

**Symptoms:**
- API returns 404 status code
- Error message: "Work item does not exist"

**Causes:**
- Work item ID doesn't exist
- Work item deleted
- Work item in different project

**Solutions:**
1. Verify work item ID is correct
2. Check work item exists in Azure DevOps web UI
3. Confirm using correct project parameter
4. Verify work item wasn't deleted
5. Check permissions to access work item

### 403 Forbidden

**Symptoms:**
- API returns 403 status code
- Error message: "Access denied"

**Causes:**
- PAT lacks read permissions
- User doesn't have access to project/area
- Work item restricted by area path permissions

**Solutions:**
1. Verify PAT has "Work Items: Read" permission
2. Check user has project access in Azure DevOps
3. Verify area path permissions
4. Contact project administrator for access

### Empty or Missing Fields

**Symptoms:**
- Work item retrieved but fields are null or empty
- Description or Acceptance Criteria missing

**Causes:**
- Fields not populated in Azure DevOps
- Field permissions restrict visibility
- Work item template doesn't include field

**Solutions:**
1. Check field values in Azure DevOps web UI
2. Use `$expand=all` in GET request
3. Verify field permissions
4. Handle null/empty values gracefully in markdown generation

## PATCH Request Errors (Update Operations)

### 400 Bad Request - Invalid Operation

**Symptoms:**
- API returns 400 status code
- Error message: "The operation is not valid for the current state"

**Causes:**
- State transition not allowed
- Field not editable in current state
- Invalid field value for current context

**Solutions:**
1. Check allowed state transitions in work item process template
2. Valid transitions:
   - New → Active, New → Removed
   - Active → Resolved, Active → Removed
   - Resolved → Closed, Resolved → Active
3. Update State field last after other changes
4. Verify field is editable in current state

### 400 Bad Request - Field Validation Error

**Symptoms:**
- API returns 400 status code
- Error message: "Field validation error"

**Causes:**
- Field value exceeds max length
- Invalid data type
- Required field set to empty
- Field value doesn't match allowed values

**Solutions:**
1. **Title**: Max 255 characters
2. **Description/Acceptance Criteria**: Max 32000 characters (HTML included)
3. **Priority**: Must be 1-4
4. **Story Points**: Must be positive number
5. **State**: Must be valid state value
6. Check field validation rules in process template

### 409 Conflict - Concurrent Update

**Symptoms:**
- API returns 409 status code
- Error message: "The work item has been modified by another user"

**Causes:**
- Work item updated by another user since last fetch
- Revision mismatch

**Solutions:**
1. Fetch latest work item version
2. Re-apply changes to latest version
3. Use optimistic concurrency with revision numbers
4. Implement retry logic with exponential backoff

### 422 Unprocessable Entity - Business Rule Violation

**Symptoms:**
- API returns 422 status code
- Error message: "Business rule violation"

**Causes:**
- Custom business rules in process template
- Required related work items missing
- Field dependencies not satisfied

**Solutions:**
1. Review process template business rules
2. Check required field dependencies
3. Verify parent/child work item relationships
4. Consult with Azure DevOps administrator

## Query/WIQL Errors

### 400 Bad Request - Invalid WIQL Syntax

**Symptoms:**
- WIQL query returns 400 status code
- Error message: "Invalid query syntax"

**Causes:**
- Malformed WIQL query
- Invalid field names
- Incorrect operator usage
- Missing closing brackets

**Solutions:**
1. Validate WIQL syntax:
   ```sql
   SELECT [System.Id], [System.Title]
   FROM WorkItems
   WHERE [System.WorkItemType] = 'User Story'
   AND [System.State] = 'Active'
   ORDER BY [System.Id] DESC
   ```
2. Field names must be in brackets: `[System.Title]`
3. String values in single quotes: `'User Story'`
4. Use valid operators: `=`, `<>`, `>`, `<`, `CONTAINS`, `IN`, `UNDER`
5. Test query in Azure DevOps web UI query editor first

### 400 Bad Request - Invalid Field Reference

**Symptoms:**
- Query returns error about field not found
- Error message: "Field does not exist"

**Causes:**
- Field name misspelled
- Field doesn't exist in project
- Custom field not available

**Solutions:**
1. Verify field name spelling
2. Check field exists in process template
3. Use correct field reference name (not display name)
4. Common field references:
   - `System.Id`, `System.Title`, `System.State`
   - `System.AreaPath`, `System.IterationPath`
   - `Microsoft.VSTS.Scheduling.StoryPoints`
   - `Microsoft.VSTS.Common.Priority`

### Query Timeout

**Symptoms:**
- Query takes too long
- Timeout error after 30+ seconds

**Causes:**
- Query returns too many work items
- Complex query conditions
- Large project with many work items

**Solutions:**
1. Add `TOP N` clause to limit results:
   ```sql
   SELECT TOP 100 [System.Id] FROM WorkItems WHERE ...
   ```
2. Use more specific filtering criteria
3. Query by recent changes only:
   ```sql
   WHERE [System.ChangedDate] > @Today - 30
   ```
4. Break into smaller queries (e.g., by sprint)

## Bidirectional Sync Errors

### Conflicting Changes

**Symptoms:**
- Local markdown and Azure DevOps both modified
- Can't determine which changes to keep

**Causes:**
- Concurrent edits in both locations
- Sync hasn't run in a while
- Multiple users editing

**Solutions:**
1. Fetch latest from Azure DevOps
2. Show user both versions
3. Let user choose:
   - Keep local changes (push to Azure DevOps)
   - Keep remote changes (update local markdown)
   - Merge manually
4. Always backup before sync operations

### Markdown Parsing Errors

**Symptoms:**
- Can't extract fields from markdown
- Metadata table malformed
- Story ID missing

**Causes:**
- Markdown format doesn't match template
- Table syntax incorrect
- Required sections missing

**Solutions:**
1. Validate markdown against template structure
2. Check metadata table format:
   ```markdown
   | Field | Value |
   |-------|-------|
   | **Priority** | 2 |
   ```
3. Ensure Story ID present: `**Story ID:** 1473`
4. Load `references/markdown-template.md` for correct format

### HTML Conversion Issues

**Symptoms:**
- Description or Acceptance Criteria formatting lost
- Special characters corrupted
- Line breaks missing

**Causes:**
- HTML to markdown conversion issues
- Markdown to HTML conversion issues
- Special character encoding

**Solutions:**
1. Use proper HTML escaping for special characters:
   - `<` → `&lt;`
   - `>` → `&gt;`
   - `&` → `&amp;`
2. Convert markdown to HTML when uploading:
   - `**bold**` → `<strong>bold</strong>`
   - `*italic*` → `<em>italic</em>`
   - `\n\n` → `<br/><br/>`
3. Strip HTML tags when downloading:
   - Use regex: `-replace '<[^>]+>', ''`
4. Test with simple content first

## Performance Issues

### Slow Bulk Operations

**Symptoms:**
- Downloading many stories takes very long
- Query returns slowly

**Causes:**
- Fetching work items one by one
- Not using batch API
- Large descriptions/acceptance criteria

**Solutions:**
1. Use batch work items API:
   ```
   GET https://dev.azure.com/{org}/{project}/_apis/wit/workitems?ids=1,2,3,4,5&$expand=all
   ```
2. Query only needed fields instead of `$expand=all`
3. Process in parallel where possible
4. Show progress indicator for large operations

### Rate Limiting

**Symptoms:**
- API returns 429 status code
- Error message: "Too many requests"

**Causes:**
- Exceeding Azure DevOps API rate limits
- Too many requests in short time period

**Solutions:**
1. Implement exponential backoff
2. Add delays between requests
3. Use batch operations instead of individual calls
4. Cache results where appropriate
5. Azure DevOps rate limits:
   - 200 requests per minute per user
   - 2000 requests per hour per user

## API Reference

**Azure DevOps REST API Documentation:**
- Create: https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/create
- Get: https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/get-work-item
- Update: https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/update
- Query: https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/wiql/query-by-wiql

**JSON Patch Specification (RFC 6902):**
https://tools.ietf.org/html/rfc6902

**WIQL Syntax Reference:**
https://learn.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax
