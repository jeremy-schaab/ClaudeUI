#Requires -Version 7.0
<#
.SYNOPSIS
    Generates a Blazor component from template based on UI framework

.DESCRIPTION
    Creates a new Blazor component file by:
    - Loading the appropriate template based on UI framework
    - Replacing placeholders with actual values
    - Optionally generating component code for CRUD operations
    - Writing the component file to the output path

.PARAMETER EntityName
    Name of the entity (e.g., "Product")

.PARAMETER Framework
    UI framework to use: Syncfusion, Telerik, MudBlazor, Bootstrap

.PARAMETER ComponentType
    Type of component: DataGrid, Form, Create, Edit, Delete, List

.PARAMETER OutputPath
    Path where the component file should be created

.PARAMETER TemplateDirectory
    Directory containing component templates (default: ./templates)

.PARAMETER ServiceInterfaceName
    Name of the service interface for data operations

.EXAMPLE
    .\generate-component.ps1 -EntityName "Product" -Framework "MudBlazor" `
        -ComponentType "DataGrid" -OutputPath "C:\projects\MyApp\Pages\Products.razor"

.OUTPUTS
    PSCustomObject with:
    - Success: Boolean indicating success
    - ComponentPath: Full path to created component
    - LineCount: Number of lines in generated component
    - Message: Human-readable status message
    - Errors: Array of error messages if any

.RETURN
    Exit code 0: Component generated successfully
    Exit code 1: Error occurred during generation
#>

param(
    [Parameter(Mandatory = $true, HelpMessage = "Name of the entity")]
    [string]$EntityName,

    [Parameter(Mandatory = $true, HelpMessage = "UI framework")]
    [ValidateSet("Syncfusion", "Telerik", "MudBlazor", "Bootstrap")]
    [string]$Framework,

    [Parameter(Mandatory = $true, HelpMessage = "Type of component")]
    [ValidateSet("DataGrid", "Form", "Create", "Edit", "Delete", "List")]
    [string]$ComponentType,

    [Parameter(Mandatory = $true, HelpMessage = "Output path for component")]
    [string]$OutputPath,

    [string]$TemplateDirectory = "./templates",

    [string]$ServiceInterfaceName = "I${EntityName}Service",

    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

try {
    Write-Verbose "Generating $ComponentType component for $EntityName using $Framework"

    # ========== Validate output path ==========
    $outputDir = Split-Path -Path $OutputPath -Parent
    if (-not (Test-Path $outputDir)) {
        Write-Verbose "Creating output directory: $outputDir"
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }

    # ========== Load template ==========
    Write-Verbose "Loading template for $Framework - $ComponentType"

    $templateFileName = "${Framework}_${ComponentType}.razor.template"
    $templatePath = Join-Path $TemplateDirectory $templateFileName

    if (-not (Test-Path $templatePath)) {
        # Fallback to generic template
        $templatePath = Join-Path $TemplateDirectory "Generic_${ComponentType}.razor.template"
        if (-not (Test-Path $templatePath)) {
            throw "Template not found: $templateFileName and Generic template"
        }
        Write-Verbose "Using generic template fallback"
    }

    $templateContent = Get-Content -Path $templatePath -Raw
    Write-Verbose "Loaded template from: $templatePath"

    # ========== Prepare replacement values ==========
    Write-Verbose "Preparing placeholder replacements..."

    $entityNamePlural = "${EntityName}s"
    $entityNameCamelCase = $EntityName.Substring(0, 1).ToLower() + $EntityName.Substring(1)
    $dateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $replacements = @{
        "{{ENTITY_NAME}}"             = $EntityName
        "{{ENTITY_NAME_PLURAL}}"      = $entityNamePlural
        "{{ENTITY_NAME_CAMELCASE}}"   = $entityNameCamelCase
        "{{SERVICE_INTERFACE}}"       = $ServiceInterfaceName
        "{{COMPONENT_TYPE}}"          = $ComponentType
        "{{FRAMEWORK}}"               = $Framework
        "{{GENERATED_DATE}}"          = $dateTime
    }

    # ========== Apply replacements ==========
    Write-Verbose "Applying placeholder replacements..."

    $componentContent = $templateContent
    foreach ($placeholder in $replacements.GetEnumerator()) {
        $componentContent = $componentContent -replace [regex]::Escape($placeholder.Key), $placeholder.Value
    }

    # ========== Add framework-specific using directives ==========
    $usingDirectives = @()
    switch ($Framework) {
        "Syncfusion" {
            $usingDirectives = @(
                "@using Syncfusion.Blazor",
                "@using Syncfusion.Blazor.Grids"
            )
        }
        "Telerik" {
            $usingDirectives = @(
                "@using Telerik.Blazor",
                "@using Telerik.Blazor.Components"
            )
        }
        "MudBlazor" {
            $usingDirectives = @(
                "@using MudBlazor"
            )
        }
        "Bootstrap" {
            $usingDirectives = @()
        }
    }

    if ($usingDirectives.Count -gt 0 -and $componentContent -notmatch "@using") {
        Write-Verbose "Adding framework-specific using directives"
        $directives = ($usingDirectives | ForEach-Object { $_ }) -join "`r`n"
        $componentContent = "$directives`r`n`r`n$componentContent"
    }

    # ========== Write component file ==========
    Write-Verbose "Writing component to: $OutputPath"

    Set-Content -Path $OutputPath -Value $componentContent -Encoding UTF8
    Write-Verbose "Component file written successfully"

    # ========== Build output ==========
    $lineCount = @($componentContent -split "`n").Count

    $output = [PSCustomObject]@{
        Success               = $true
        ComponentPath         = Resolve-Path -Path $OutputPath
        ComponentName         = Split-Path -Path $OutputPath -Leaf
        Framework             = $Framework
        ComponentType         = $ComponentType
        EntityName            = $EntityName
        LineCount             = $lineCount
        FileSize              = (Get-Item -Path $OutputPath).Length
        Message               = "Component generated successfully: $ComponentType for $EntityName"
        Errors                = @()
        GeneratedTime         = Get-Date -Format "o"
    }

    Write-Output ($output | ConvertTo-Json -Depth 2)
    exit 0
}
catch {
    Write-Error "Error generating component: $_"

    $output = [PSCustomObject]@{
        Success          = $false
        ComponentPath    = $OutputPath
        Framework        = $Framework
        ComponentType    = $ComponentType
        EntityName       = $EntityName
        Message          = "Failed to generate component"
        Errors           = @($_)
        GeneratedTime    = Get-Date -Format "o"
    }

    Write-Output ($output | ConvertTo-Json -Depth 2)
    exit 1
}
