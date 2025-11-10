# Azure DevOps Work Item Creation Script
# This script creates User Story work items in Azure DevOps using the REST API

param(
    [Parameter(Mandatory=$true)]
    [string]$Title,

    [Parameter(Mandatory=$true)]
    [string]$Description,

    [Parameter(Mandatory=$false)]
    [int]$StoryPoints = 5,

    [Parameter(Mandatory=$false)]
    [int]$Priority = 2,

    [Parameter(Mandatory=$false)]
    [string]$AreaPath = 'SuiteFYI\CloudManager Team',

    [Parameter(Mandatory=$false)]
    [string]$IterationPath = 'SuiteFYI\Saas Framework\Framework 1\Sprint 8',

    [Parameter(Mandatory=$false)]
    [string]$Tags = '',

    [Parameter(Mandatory=$false)]
    [string]$AcceptanceCriteria = '',

    [Parameter(Mandatory=$true)]
    [string]$PAT,

    [Parameter(Mandatory=$false)]
    [string]$Organization = 'fyisoft',

    [Parameter(Mandatory=$false)]
    [string]$Project = 'suitefyi'
)

# Encode PAT for Basic Authentication
$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$PAT"))

# Request Headers
$headers = @{
    'Authorization' = "Basic $base64"
    'Content-Type' = 'application/json-patch+json'
}

# Build work item fields array
$fields = @(
    @{op='add'; path='/fields/System.Title'; value=$Title}
    @{op='add'; path='/fields/System.Description'; value=$Description}
    @{op='add'; path='/fields/System.AreaPath'; value=$AreaPath}
    @{op='add'; path='/fields/System.IterationPath'; value=$IterationPath}
    @{op='add'; path='/fields/Microsoft.VSTS.Common.Priority'; value=$Priority}
    @{op='add'; path='/fields/Microsoft.VSTS.Scheduling.StoryPoints'; value=$StoryPoints}
)

if ($Tags) {
    $fields += @{op='add'; path='/fields/System.Tags'; value=$Tags}
}

if ($AcceptanceCriteria) {
    $fields += @{op='add'; path='/fields/Microsoft.VSTS.Common.AcceptanceCriteria'; value=$AcceptanceCriteria}
}

$body = $fields | ConvertTo-Json

# API Endpoint
$uri = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems/`$User Story?api-version=7.0"

# Execute API Call
try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body

    Write-Output "✓ Work Item Created Successfully"
    Write-Output ""
    Write-Output "Work Item ID: $($response.id)"
    Write-Output "URL: $($response._links.html.href)"
    Write-Output ""
    Write-Output "Next Steps:"
    Write-Output "  1. Rename markdown file to: $($response.id)-{story-name}.md"
    Write-Output "  2. Update Story ID in markdown header to: $($response.id)"
    Write-Output "  3. Add Azure DevOps URL to markdown header"
    Write-Output ""

    # Return structured data for programmatic use
    return @{
        id = $response.id
        url = $response._links.html.href
        success = $true
    }
} catch {
    Write-Error "✗ Failed to create work item"
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
