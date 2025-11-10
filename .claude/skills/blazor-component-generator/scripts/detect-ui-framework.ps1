#Requires -Version 7.0
<#
.SYNOPSIS
    Detects which UI framework is installed in the Blazor project
    (Syncfusion, Telerik, MudBlazor)

.DESCRIPTION
    This script analyzes the project to detect which UI framework is installed
    by checking .csproj files for package references, _Imports.razor for using
    directives, and Program.cs for service registration.

.PARAMETER ProjectPath
    The path to the Blazor project root directory

.PARAMETER Verbose
    Enable verbose output for debugging

.EXAMPLE
    .\detect-ui-framework.ps1 -ProjectPath "C:\projects\MyBlazorApp"

.OUTPUTS
    PSCustomObject with properties:
    - Framework: Detected framework name (Syncfusion, Telerik, MudBlazor, Custom, Unknown)
    - Version: Detected version string
    - Confidence: Confidence score (0-100)
    - Evidence: Array of detection evidence items
    - Details: Additional details about detection

.RETURN
    Exit code 0: Framework detected successfully
    Exit code 1: Error occurred during detection
#>

param(
    [Parameter(Mandatory = $true, HelpMessage = "Path to the Blazor project")]
    [ValidateScript({ Test-Path $_ -PathType Container })]
    [string]$ProjectPath,

    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

try {
    Write-Verbose "Starting UI framework detection for: $ProjectPath"

    # Initialize detection results
    $detectionResults = @{
        Syncfusion = @{ confidence = 0; evidence = @() }
        Telerik    = @{ confidence = 0; evidence = @() }
        MudBlazor  = @{ confidence = 0; evidence = @() }
    }

    # ========== Check .csproj files for package references ==========
    Write-Verbose "Scanning .csproj files for package references..."

    $csprojFiles = Get-ChildItem -Path $ProjectPath -Filter "*.csproj" -Recurse

    foreach ($csproj in $csprojFiles) {
        Write-Verbose "Analyzing: $($csproj.Name)"

        $content = Get-Content -Path $csproj.FullName -Raw

        # Check for Syncfusion packages
        if ($content -match 'Syncfusion\.[A-Za-z]+\.Blazor') {
            $matches | ForEach-Object {
                if ($_ -match 'Version="([\d\.]+)"') {
                    $version = $matches[1]
                    $detectionResults.Syncfusion.evidence += "Found Syncfusion NuGet package v$version in $($csproj.Name)"
                    $detectionResults.Syncfusion.confidence += 40
                }
            }
        }

        # Check for Telerik packages
        if ($content -match 'Telerik\.UI\.for\.Blazor') {
            if ($content -match 'Version="([\d\.]+)"') {
                $version = $matches[1]
                $detectionResults.Telerik.evidence += "Found Telerik NuGet package v$version in $($csproj.Name)"
                $detectionResults.Telerik.confidence += 40
            }
        }

        # Check for MudBlazor packages
        if ($content -match 'MudBlazor') {
            if ($content -match 'Version="([\d\.]+)"') {
                $version = $matches[1]
                $detectionResults.MudBlazor.evidence += "Found MudBlazor NuGet package v$version in $($csproj.Name)"
                $detectionResults.MudBlazor.confidence += 40
            }
        }
    }

    # ========== Check _Imports.razor for using directives ==========
    Write-Verbose "Scanning _Imports.razor files for using directives..."

    $importsFiles = Get-ChildItem -Path $ProjectPath -Filter "_Imports.razor" -Recurse

    foreach ($imports in $importsFiles) {
        Write-Verbose "Analyzing: $($imports.FullName)"

        $content = Get-Content -Path $imports.FullName

        # Check for Syncfusion using directives
        if ($content -match '@using\s+Syncfusion\.Blazor') {
            $detectionResults.Syncfusion.evidence += "Found Syncfusion using directive in _Imports.razor"
            $detectionResults.Syncfusion.confidence += 30
        }

        # Check for Telerik using directives
        if ($content -match '@using\s+Telerik\.Blazor') {
            $detectionResults.Telerik.evidence += "Found Telerik using directive in _Imports.razor"
            $detectionResults.Telerik.confidence += 30
        }

        # Check for MudBlazor using directives
        if ($content -match '@using\s+MudBlazor') {
            $detectionResults.MudBlazor.evidence += "Found MudBlazor using directive in _Imports.razor"
            $detectionResults.MudBlazor.confidence += 30
        }
    }

    # ========== Check Program.cs for service registration ==========
    Write-Verbose "Scanning Program.cs for service registration..."

    $programFiles = Get-ChildItem -Path $ProjectPath -Filter "Program.cs" -Recurse

    foreach ($program in $programFiles) {
        Write-Verbose "Analyzing: $($program.FullName)"

        $content = Get-Content -Path $program.FullName -Raw

        # Check for Syncfusion service registration
        if ($content -match 'AddSyncfusionBlazor|services\.AddSyncfusion') {
            $detectionResults.Syncfusion.evidence += "Found Syncfusion service registration in Program.cs"
            $detectionResults.Syncfusion.confidence += 30
        }

        # Check for Telerik service registration
        if ($content -match 'AddTelerikBlazor|services\.AddTelerik') {
            $detectionResults.Telerik.evidence += "Found Telerik service registration in Program.cs"
            $detectionResults.Telerik.confidence += 30
        }

        # Check for MudBlazor service registration
        if ($content -match 'AddMudBlazorDialog|services\.AddMudBlazor') {
            $detectionResults.MudBlazor.evidence += "Found MudBlazor service registration in Program.cs"
            $detectionResults.MudBlazor.confidence += 30
        }
    }

    # ========== Determine final result ==========
    Write-Verbose "Calculating final detection results..."

    # Normalize confidence scores to 0-100 range
    $detectionResults.Keys | ForEach-Object {
        $detectionResults[$_].confidence = [Math]::Min(100, $detectionResults[$_].confidence)
    }

    # Find the framework with highest confidence
    $topFramework = $detectionResults.GetEnumerator() |
                    Sort-Object -Property { $_.Value.confidence } -Descending |
                    Select-Object -First 1

    $frameworkName = if ($topFramework.Value.confidence -ge 50) {
        $topFramework.Key
    } else {
        "Unknown"
    }

    # Build output object
    $output = [PSCustomObject]@{
        Framework     = $frameworkName
        Version       = ""
        Confidence    = $topFramework.Value.confidence
        Evidence      = $topFramework.Value.evidence
        AllDetections = $detectionResults | ConvertTo-Json -Depth 2
        Details       = @{
            ProjectPath    = $ProjectPath
            CsprojCount    = $csprojFiles.Count
            ImportsCount   = $importsFiles.Count
            ProgramCount   = $programFiles.Count
            DetectionTime  = Get-Date -Format "o"
        }
    }

    Write-Output $output
    exit 0
}
catch {
    Write-Error "Error detecting UI framework: $_"
    exit 1
}
