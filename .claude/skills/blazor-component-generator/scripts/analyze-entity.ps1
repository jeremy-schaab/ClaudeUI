#Requires -Version 7.0
<#
.SYNOPSIS
    Analyzes a C# entity class and extracts properties

.DESCRIPTION
    Extracts property information from an entity class including:
    - Property names and types
    - Validation attributes
    - Foreign keys and navigation properties
    - Required/Optional indicators
    - Database column mappings

.PARAMETER EntityName
    Name of the entity class to analyze (without .cs extension)

.PARAMETER ProjectPath
    Path to the project containing the entity

.PARAMETER SearchPath
    Additional path to search for the entity file (default: src/Models or Models)

.EXAMPLE
    .\analyze-entity.ps1 -EntityName "Product" -ProjectPath "C:\projects\MyApp"

.OUTPUTS
    JSON object containing:
    - EntityName: The class name
    - Namespace: The namespace
    - Properties: Array of property objects
    - ForeignKeys: Array of foreign key relationships
    - NavigationProperties: Array of navigation properties
    - Analysis: Metadata about the analysis

.RETURN
    Exit code 0: Entity analysis completed successfully
    Exit code 1: Error occurred during analysis
#>

param(
    [Parameter(Mandatory = $true, HelpMessage = "Name of the entity class")]
    [string]$EntityName,

    [Parameter(Mandatory = $true, HelpMessage = "Path to the project")]
    [ValidateScript({ Test-Path $_ -PathType Container })]
    [string]$ProjectPath,

    [string]$SearchPath = "Models",

    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

try {
    Write-Verbose "Starting entity analysis for: $EntityName"

    # ========== Find the entity file ==========
    Write-Verbose "Searching for entity file: $EntityName.cs"

    $possiblePaths = @(
        (Join-Path $ProjectPath $SearchPath)
        (Join-Path $ProjectPath "src/Models")
        (Join-Path $ProjectPath "Models")
        (Join-Path $ProjectPath "Entities")
        (Join-Path $ProjectPath "src/Entities")
    )

    $entityFile = $null
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $found = Get-ChildItem -Path $path -Filter "$EntityName.cs" -Recurse -ErrorAction SilentlyContinue
            if ($found) {
                $entityFile = $found | Select-Object -First 1
                Write-Verbose "Found entity file: $($entityFile.FullName)"
                break
            }
        }
    }

    if (-not $entityFile) {
        throw "Entity file '$EntityName.cs' not found in project"
    }

    # ========== Parse the entity file ==========
    Write-Verbose "Parsing entity file..."

    $content = Get-Content -Path $entityFile.FullName -Raw

    # Extract namespace
    $namespace = ""
    if ($content -match 'namespace\s+([\w\.]+)\s*[{;]') {
        $namespace = $matches[1]
        Write-Verbose "Found namespace: $namespace"
    }

    # Extract class declaration
    if ($content -notmatch "class\s+$EntityName") {
        throw "Entity class '$EntityName' not found in file"
    }

    # ========== Extract properties ==========
    Write-Verbose "Extracting properties..."

    $properties = @()
    $propertyPattern = '(?:(?<attributes>\[[\w\.\(\),\s=\-"]+\])\s*)*public\s+(?<type>[\w\[\],<>.?]+)\s+(?<name>\w+)\s*{\s*get;\s*set;\s*}'

    $regex = [regex]$propertyPattern
    $matches = $regex.Matches($content)

    foreach ($match in $matches) {
        $propName = $match.Groups['name'].Value
        $propType = $match.Groups['type'].Value.Trim()
        $attributes = $match.Groups['attributes'].Value

        Write-Verbose "Found property: $propName of type $propType"

        # Extract validation attributes
        $validationAttrs = @()
        if ($attributes) {
            $attrPattern = '\[(\w+)(?:\((.*?)\))?\]'
            $attrMatches = [regex]::Matches($attributes, $attrPattern)
            foreach ($attrMatch in $attrMatches) {
                $attrName = $attrMatch.Groups[1].Value
                $attrParams = $attrMatch.Groups[2].Value
                $validationAttrs += @{
                    Name   = $attrName
                    Params = $attrParams
                }
            }
        }

        # Determine if property is required
        $isRequired = $attributes -match '\[Required\]' -or $propType -notmatch '\?'

        # Detect navigation properties (references to other entities)
        $isNavigation = $propType -match '^(ICollection|List|IEnumerable)<' -or ($propType -notmatch '(string|int|bool|decimal|double|float|byte|long|short|DateTime|Guid)' -and $propType -notmatch '\?$' -and $propType -notmatch '\[\]')

        $properties += [PSCustomObject]@{
            Name               = $propName
            Type               = $propType
            IsRequired         = $isRequired
            IsNullable         = $propType -match '\?$' -or $propType -match 'Nullable'
            IsNavigation       = $isNavigation
            ValidationRules    = $validationAttrs
            RawAttributes      = $attributes
        }
    }

    # ========== Extract foreign keys ==========
    Write-Verbose "Extracting foreign keys..."

    $foreignKeys = @()
    $fkPattern = '\[ForeignKey\("?(\w+)"?\)\]\s*public\s+(?<type>[\w\[\],<>.?]+)\s+(?<prop>\w+)'
    $fkMatches = [regex]::Matches($content, $fkPattern)

    foreach ($match in $fkMatches) {
        $foreignKeys += [PSCustomObject]@{
            Property        = $match.Groups['prop'].Value
            ReferencedTable = $match.Groups[1].Value
            Type            = $match.Groups['type'].Value
        }
    }

    # ========== Build analysis output ==========
    Write-Verbose "Building analysis output..."

    $analysis = [PSCustomObject]@{
        EntityName            = $EntityName
        Namespace             = $namespace
        FilePath              = $entityFile.FullName
        Properties            = $properties
        ForeignKeys           = $foreignKeys
        NavigationProperties  = @($properties | Where-Object { $_.IsNavigation })
        PropertyCount         = $properties.Count
        RequiredPropertyCount = @($properties | Where-Object { $_.IsRequired }).Count
        Analysis              = @{
            AnalysisTime  = Get-Date -Format "o"
            FileSize      = $entityFile.Length
            LineCount     = @(Get-Content -Path $entityFile.FullName).Count
        }
    }

    # Output as JSON
    $jsonOutput = $analysis | ConvertTo-Json -Depth 4
    Write-Output $jsonOutput

    exit 0
}
catch {
    Write-Error "Error analyzing entity: $_"
    exit 1
}
