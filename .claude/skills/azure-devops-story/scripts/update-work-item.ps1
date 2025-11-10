# Azure DevOps Work Item Update Script
# This script updates existing User Story work items in Azure DevOps using the REST API

param(
    [Parameter(Mandatory=$true)]
    [int]$WorkItemId,

    [Parameter(Mandatory=$true)]
    [string]$PAT,

    [Parameter(Mandatory=$false)]
    [string]$Title,

    [Parameter(Mandatory=$false)]
    [string]$Description,

    [Parameter(Mandatory=$false)]
    [int]$StoryPoints,

    [Parameter(Mandatory=$false)]
    [int]$Priority,

    [Parameter(Mandatory=$false)]
    [string]$State,

    [Parameter(Mandatory=$false)]
    [string]$AreaPath,

    [Parameter(Mandatory=$false)]
    [string]$IterationPath,

    [Parameter(Mandatory=$false)]
    [string]$Tags,

    [Parameter(Mandatory=$false)]
    [string]$AcceptanceCriteria,

    [Parameter(Mandatory=$false)]
    [string]$AssignedTo,

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

# Build work item fields array - only include fields that were provided
$fields = @()

if ($Title) {
    $fields += @{op='replace'; path='/fields/System.Title'; value=$Title}
}

if ($Description) {
    $fields += @{op='replace'; path='/fields/System.Description'; value=$Description}
}

if ($PSBoundParameters.ContainsKey('StoryPoints')) {
    $fields += @{op='replace'; path='/fields/Microsoft.VSTS.Scheduling.StoryPoints'; value=$StoryPoints}
}

if ($PSBoundParameters.ContainsKey('Priority')) {
    $fields += @{op='replace'; path='/fields/Microsoft.VSTS.Common.Priority'; value=$Priority}
}

if ($State) {
    $fields += @{op='replace'; path='/fields/System.State'; value=$State}
}

if ($AreaPath) {
    $fields += @{op='replace'; path='/fields/System.AreaPath'; value=$AreaPath}
}

if ($IterationPath) {
    $fields += @{op='replace'; path='/fields/System.IterationPath'; value=$IterationPath}
}

if ($Tags) {
    $fields += @{op='replace'; path='/fields/System.Tags'; value=$Tags}
}

if ($AcceptanceCriteria) {
    $fields += @{op='replace'; path='/fields/Microsoft.VSTS.Common.AcceptanceCriteria'; value=$AcceptanceCriteria}
}

if ($AssignedTo) {
    $fields += @{op='replace'; path='/fields/System.AssignedTo'; value=$AssignedTo}
}

# Check if any fields were provided
if ($fields.Count -eq 0) {
    Write-Error "✗ No fields provided to update. Please specify at least one field to update."
    return @{
        success = $false
        error = "No fields provided for update"
    }
}

$body = $fields | ConvertTo-Json

# API Endpoint
$uri = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems/${WorkItemId}?api-version=7.0"

# Execute API Call
try {
    $response = Invoke-RestMethod -Uri $uri -Method Patch -Headers $headers -Body $body

    Write-Output "✓ Work Item Updated Successfully"
    Write-Output ""
    Write-Output "Work Item ID: $($response.id)"
    Write-Output "Title: $($response.fields.'System.Title')"
    Write-Output "State: $($response.fields.'System.State')"
    Write-Output "URL: $($response._links.html.href)"
    Write-Output ""
    Write-Output "Fields Updated: $($fields.Count)"
    foreach ($field in $fields) {
        $fieldName = $field.path -replace '/fields/', ''
        Write-Output "  - $fieldName"
    }
    Write-Output ""

    # Return structured data for programmatic use
    return @{
        id = $response.id
        title = $response.fields.'System.Title'
        state = $response.fields.'System.State'
        url = $response._links.html.href
        fieldsUpdated = $fields.Count
        success = $true
    }

} catch {
    Write-Error "✗ Failed to update work item"
    Write-Error "Error: $($_.Exception.Message)"

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Error "Status Code: $statusCode"

        if ($statusCode -eq 404) {
            Write-Error "Work item $WorkItemId not found in project $Project"
        } elseif ($statusCode -eq 400) {
            Write-Error "Invalid field values or patch document format"
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
