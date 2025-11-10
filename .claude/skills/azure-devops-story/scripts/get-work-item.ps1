# Azure DevOps Work Item Retrieval Script
# This script fetches User Story work items from Azure DevOps using the REST API

param(
    [Parameter(Mandatory=$true)]
    [int]$WorkItemId,

    [Parameter(Mandatory=$true)]
    [string]$PAT,

    [Parameter(Mandatory=$false)]
    [string]$Organization = 'fyisoft',

    [Parameter(Mandatory=$false)]
    [string]$Project = 'suitefyi',

    [Parameter(Mandatory=$false)]
    [string]$OutputPath = '',

    [Parameter(Mandatory=$false)]
    [switch]$JsonOutput
)

# Encode PAT for Basic Authentication
$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$PAT"))

# Request Headers
$headers = @{
    'Authorization' = "Basic $base64"
    'Content-Type' = 'application/json'
}

# API Endpoint - Get work item with all fields
$uri = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems/${WorkItemId}?`$expand=all&api-version=7.0"

# Execute API Call
try {
    $response = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers

    if ($JsonOutput) {
        # Return raw JSON for programmatic use
        return $response | ConvertTo-Json -Depth 10
    }

    # Extract fields
    $fields = $response.fields
    $title = $fields.'System.Title'
    $description = $fields.'System.Description' -replace '<[^>]+>', '' # Strip HTML
    $acceptanceCriteria = $fields.'Microsoft.VSTS.Common.AcceptanceCriteria' -replace '<[^>]+>', '' # Strip HTML
    $state = $fields.'System.State'
    $storyPoints = $fields.'Microsoft.VSTS.Scheduling.StoryPoints'
    $priority = $fields.'Microsoft.VSTS.Common.Priority'
    $tags = $fields.'System.Tags'
    $areaPath = $fields.'System.AreaPath'
    $iterationPath = $fields.'System.IterationPath'
    $assignedTo = $fields.'System.AssignedTo'.displayName
    $createdDate = $fields.'System.CreatedDate'
    $modifiedDate = $fields.'System.ChangedDate'
    $createdBy = $fields.'System.CreatedBy'.displayName
    $valueArea = $fields.'Microsoft.VSTS.Common.ValueArea'
    $risk = $fields.'Microsoft.VSTS.Common.Risk'

    # Generate markdown content
    $markdown = @"
# $title

**Story ID:** $WorkItemId
**State:** $state
**Azure DevOps:** $($response._links.html.href)

## Metadata

| Field | Value |
|-------|-------|
| **Priority** | $priority |
| **Story Points** | $storyPoints |
| **Area Path** | $areaPath |
| **Iteration Path** | $iterationPath |
| **Assigned To** | $assignedTo |
| **Value Area** | $valueArea |
| **Risk** | $risk |
| **Tags** | $tags |

## User Story

$description

## Acceptance Criteria

$acceptanceCriteria

---

**Created:** $createdDate by $createdBy
**Last Modified:** $modifiedDate
**Work Item Type:** $($fields.'System.WorkItemType')
"@

    # Output results
    Write-Output "✓ Work Item Retrieved Successfully"
    Write-Output ""
    Write-Output "Work Item ID: $WorkItemId"
    Write-Output "Title: $title"
    Write-Output "State: $state"
    Write-Output "URL: $($response._links.html.href)"
    Write-Output ""

    # Save to file if output path specified
    if ($OutputPath) {
        # Generate filename from title if directory provided
        if (Test-Path $OutputPath -PathType Container) {
            $safeTitle = $title -replace '[^\w\s-]', '' -replace '\s+', '-'
            $filename = "$WorkItemId-$safeTitle.md"
            $fullPath = Join-Path $OutputPath $filename
        } else {
            $fullPath = $OutputPath
        }

        $markdown | Out-File -FilePath $fullPath -Encoding UTF8
        Write-Output "✓ Markdown saved to: $fullPath"
        Write-Output ""
    } else {
        Write-Output "--- Markdown Content ---"
        Write-Output $markdown
        Write-Output "--- End Markdown ---"
        Write-Output ""
    }

    # Return structured data for programmatic use
    return @{
        id = $WorkItemId
        title = $title
        state = $state
        url = $response._links.html.href
        markdown = $markdown
        outputPath = if ($OutputPath) { $fullPath } else { $null }
        success = $true
        fields = @{
            description = $description
            acceptanceCriteria = $acceptanceCriteria
            storyPoints = $storyPoints
            priority = $priority
            tags = $tags
            areaPath = $areaPath
            iterationPath = $iterationPath
            assignedTo = $assignedTo
            valueArea = $valueArea
            risk = $risk
        }
    }

} catch {
    Write-Error "✗ Failed to retrieve work item"
    Write-Error "Error: $($_.Exception.Message)"

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Error "Status Code: $statusCode"

        if ($statusCode -eq 404) {
            Write-Error "Work item $WorkItemId not found in project $Project"
        }

        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Error "Response: $responseBody"
    }

    return @{
        success = $false
        error = $_.Exception.Message
    }
}
