# Azure DevOps Work Items Query Script
# This script queries multiple User Story work items from Azure DevOps using WIQL

param(
    [Parameter(Mandatory=$true)]
    [string]$PAT,

    [Parameter(Mandatory=$false)]
    [string]$Query,

    [Parameter(Mandatory=$false)]
    [string]$IterationPath,

    [Parameter(Mandatory=$false)]
    [string]$AreaPath,

    [Parameter(Mandatory=$false)]
    [string]$State,

    [Parameter(Mandatory=$false)]
    [string]$AssignedTo,

    [Parameter(Mandatory=$false)]
    [int]$Top = 200,

    [Parameter(Mandatory=$false)]
    [string]$Organization = 'fyisoft',

    [Parameter(Mandatory=$false)]
    [string]$Project = 'suitefyi',

    [Parameter(Mandatory=$false)]
    [string]$OutputPath = '',

    [Parameter(Mandatory=$false)]
    [switch]$IdsOnly
)

# Encode PAT for Basic Authentication
$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$PAT"))

# Request Headers
$headers = @{
    'Authorization' = "Basic $base64"
    'Content-Type' = 'application/json'
}

# Build WIQL query if not provided
if (-not $Query) {
    $wiqlConditions = @("[System.WorkItemType] = 'User Story'")

    if ($IterationPath) {
        $wiqlConditions += "[System.IterationPath] = '$IterationPath'"
    }

    if ($AreaPath) {
        $wiqlConditions += "[System.AreaPath] UNDER '$AreaPath'"
    }

    if ($State) {
        $wiqlConditions += "[System.State] = '$State'"
    }

    if ($AssignedTo) {
        $wiqlConditions += "[System.AssignedTo] = '$AssignedTo'"
    }

    $whereClause = $wiqlConditions -join ' AND '
    $Query = "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE $whereClause ORDER BY [System.Id] DESC"
}

Write-Output "Executing WIQL Query:"
Write-Output $Query
Write-Output ""

# Prepare query request
$queryBody = @{
    query = $Query
} | ConvertTo-Json

# API Endpoint for WIQL query
$queryUri = "https://dev.azure.com/$Organization/$Project/_apis/wit/wiql?api-version=7.0"

try {
    # Execute WIQL query
    $queryResponse = Invoke-RestMethod -Uri $queryUri -Method Post -Headers $headers -Body $queryBody

    $workItemIds = $queryResponse.workItems | Select-Object -ExpandProperty id

    if ($workItemIds.Count -eq 0) {
        Write-Output "✓ Query executed successfully, but no work items found"
        return @{
            success = $true
            count = 0
            workItems = @()
        }
    }

    Write-Output "✓ Found $($workItemIds.Count) work items"
    Write-Output ""

    if ($IdsOnly) {
        Write-Output "Work Item IDs:"
        $workItemIds | ForEach-Object { Write-Output "  - $_" }
        return @{
            success = $true
            count = $workItemIds.Count
            workItemIds = $workItemIds
        }
    }

    # Fetch full details for all work items (batch request)
    $idsString = $workItemIds -join ','
    $batchUri = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems?ids=$idsString&`$expand=all&api-version=7.0"

    $batchResponse = Invoke-RestMethod -Uri $batchUri -Method Get -Headers $headers

    Write-Output "✓ Retrieved full details for all work items"
    Write-Output ""

    $workItems = @()
    $savedFiles = @()

    foreach ($workItem in $batchResponse.value) {
        $fields = $workItem.fields
        $id = $workItem.id
        $title = $fields.'System.Title'
        $description = $fields.'System.Description' -replace '<[^>]+>', '' # Strip HTML
        $acceptanceCriteria = $fields.'Microsoft.VSTS.Common.AcceptanceCriteria' -replace '<[^>]+>', '' # Strip HTML
        $state = $fields.'System.State'
        $storyPoints = $fields.'Microsoft.VSTS.Scheduling.StoryPoints'
        $priority = $fields.'Microsoft.VSTS.Common.Priority'
        $tags = $fields.'System.Tags'
        $areaPath = $fields.'System.AreaPath'
        $iterationPath = $fields.'System.IterationPath'
        $assignedTo = if ($fields.'System.AssignedTo') { $fields.'System.AssignedTo'.displayName } else { 'Unassigned' }
        $valueArea = $fields.'Microsoft.VSTS.Common.ValueArea'
        $risk = $fields.'Microsoft.VSTS.Common.Risk'

        # Generate markdown content
        $markdown = @"
# $title

**Story ID:** $id
**State:** $state
**Azure DevOps:** $($workItem._links.html.href)

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

**Work Item Type:** $($fields.'System.WorkItemType')
"@

        $workItemData = @{
            id = $id
            title = $title
            state = $state
            url = $workItem._links.html.href
            markdown = $markdown
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

        $workItems += $workItemData

        # Save to file if output path specified
        if ($OutputPath) {
            # Create output directory if it doesn't exist
            if (-not (Test-Path $OutputPath)) {
                New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
            }

            $safeTitle = $title -replace '[^\w\s-]', '' -replace '\s+', '-'
            $filename = "$id-$safeTitle.md"
            $fullPath = Join-Path $OutputPath $filename

            $markdown | Out-File -FilePath $fullPath -Encoding UTF8
            $savedFiles += $fullPath

            Write-Output "  ✓ Saved: $filename"
        } else {
            Write-Output "  - [$id] $title ($state)"
        }
    }

    Write-Output ""
    Write-Output "✓ Processed $($workItems.Count) work items"

    if ($OutputPath) {
        Write-Output "✓ Markdown files saved to: $OutputPath"
    }

    return @{
        success = $true
        count = $workItems.Count
        workItems = $workItems
        savedFiles = $savedFiles
    }

} catch {
    Write-Error "✗ Failed to query work items"
    Write-Error "Error: $($_.Exception.Message)"

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Error "Response: $responseBody"
    }

    return @{
        success = $false
        error = $_.Exception.Message
    }
}
