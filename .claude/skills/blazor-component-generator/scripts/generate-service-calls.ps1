#Requires -Version 7.0
<#
.SYNOPSIS
    Generates service method calls for component integration

.DESCRIPTION
    Creates C# code snippets for calling service methods including:
    - CRUD method calls (Create, Read, Update, Delete)
    - List/Get methods
    - Async/await patterns
    - Error handling patterns
    - Dependency injection initialization

.PARAMETER EntityName
    Name of the entity (e.g., "Product")

.PARAMETER ServiceInterfaceName
    Name of the service interface (default: I{EntityName}Service)

.PARAMETER ProjectPath
    Path to the project containing the service

.PARAMETER OutputFormat
    Format for output: CodeSnippet, JsonObject, CSharpFile

.EXAMPLE
    .\generate-service-calls.ps1 -EntityName "Product" `
        -ServiceInterfaceName "IProductService" -ProjectPath "C:\projects\MyApp"

.OUTPUTS
    Generated code snippets as C# code blocks or JSON containing:
    - GetAll method call
    - GetById method call
    - Create method call
    - Update method call
    - Delete method call
    - Service injection code

.RETURN
    Exit code 0: Service calls generated successfully
    Exit code 1: Error occurred during generation
#>

param(
    [Parameter(Mandatory = $true, HelpMessage = "Name of the entity")]
    [string]$EntityName,

    [string]$ServiceInterfaceName = "I${EntityName}Service",

    [Parameter(Mandatory = $true, HelpMessage = "Path to the project")]
    [ValidateScript({ Test-Path $_ -PathType Container })]
    [string]$ProjectPath,

    [ValidateSet("CodeSnippet", "JsonObject", "CSharpFile")]
    [string]$OutputFormat = "JsonObject",

    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

try {
    Write-Verbose "Generating service calls for $EntityName using $ServiceInterfaceName"

    # ========== Find the service interface ==========
    Write-Verbose "Locating service interface: $ServiceInterfaceName"

    $possiblePaths = @(
        "src/Services"
        "Services"
        "Interfaces"
        "src/Interfaces"
    )

    $serviceInterface = $null
    $serviceInterfacePath = $null

    foreach ($path in $possiblePaths) {
        $fullPath = Join-Path $ProjectPath $path
        if (Test-Path $fullPath) {
            $found = Get-ChildItem -Path $fullPath -Filter "$ServiceInterfaceName.cs" -Recurse -ErrorAction SilentlyContinue
            if ($found) {
                $serviceInterface = $found | Select-Object -First 1
                $serviceInterfacePath = $serviceInterface.FullName
                Write-Verbose "Found service interface: $serviceInterfacePath"
                break
            }
        }
    }

    # If not found, generate generic calls
    if (-not $serviceInterface) {
        Write-Verbose "Service interface not found, generating generic method signatures"
    }

    # ========== Generate dependency injection snippet ==========
    Write-Verbose "Generating dependency injection code..."

    $injectCode = @"
[Inject] private $ServiceInterfaceName ${ServiceInterfaceName.Substring(1)} { get; set; } = null!;
"@

    # ========== Generate CRUD method call snippets ==========
    Write-Verbose "Generating CRUD method snippets..."

    $entityNamePlural = "${EntityName}s"
    $entityNameCamelCase = $EntityName.Substring(0, 1).ToLower() + $EntityName.Substring(1)

    # GetAll pattern
    $getAll = @"
try
{
    var items = await ${ServiceInterfaceName.Substring(1)}.GetAllAsync();
    // Process items
}
catch (Exception ex)
{
    // Handle error
    Console.WriteLine(`$"Error fetching ${entityNamePlural}: {ex.Message}`");
}
"@

    # GetById pattern
    $getById = @"
try
{
    var item = await ${ServiceInterfaceName.Substring(1)}.GetByIdAsync(id);
    if (item == null)
    {
        // Handle not found
    }
}
catch (Exception ex)
{
    Console.WriteLine(`$"Error fetching ${EntityName}: {ex.Message}`");
}
"@

    # Create pattern
    $create = @"
try
{
    var $entityNameCamelCase = new ${EntityName}
    {
        // Set properties
    };

    var created = await ${ServiceInterfaceName.Substring(1)}.CreateAsync($entityNameCamelCase);
    // Handle success
}
catch (Exception ex)
{
    Console.WriteLine(`$"Error creating ${EntityName}: {ex.Message}`");
}
"@

    # Update pattern
    $update = @"
try
{
    var $entityNameCamelCase = new ${EntityName}
    {
        Id = id,
        // Set updated properties
    };

    var success = await ${ServiceInterfaceName.Substring(1)}.UpdateAsync($entityNameCamelCase);
    if (success)
    {
        // Handle success
    }
}
catch (Exception ex)
{
    Console.WriteLine(`$"Error updating ${EntityName}: {ex.Message}`");
}
"@

    # Delete pattern
    $delete = @"
try
{
    var success = await ${ServiceInterfaceName.Substring(1)}.DeleteAsync(id);
    if (success)
    {
        // Handle success
    }
}
catch (Exception ex)
{
    Console.WriteLine(`$"Error deleting ${EntityName}: {ex.Message}`");
}
"@

    # ========== Build output based on format ==========
    Write-Verbose "Building output in $OutputFormat format..."

    $snippets = [PSCustomObject]@{
        EntityName       = $EntityName
        ServiceInterface = $ServiceInterfaceName
        Injection        = $injectCode
        Methods          = [PSCustomObject]@{
            GetAll  = $getAll
            GetById = $getById
            Create  = $create
            Update  = $update
            Delete  = $delete
        }
        Metadata         = [PSCustomObject]@{
            GeneratedDate      = Get-Date -Format "o"
            ServiceInterfaceFound = $null -ne $serviceInterface
            OutputFormat       = $OutputFormat
        }
    }

    switch ($OutputFormat) {
        "CodeSnippet" {
            $output = @"
// ========== Dependency Injection ==========
$injectCode

// ========== GetAll Example ==========
$getAll

// ========== GetById Example ==========
$getById

// ========== Create Example ==========
$create

// ========== Update Example ==========
$update

// ========== Delete Example ==========
$delete
"@
            Write-Output $output
        }
        "JsonObject" {
            $jsonOutput = $snippets | ConvertTo-Json -Depth 3
            Write-Output $jsonOutput
        }
        "CSharpFile" {
            $csharpOutput = @"
#region Service Integration Snippets
// Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
// Entity: $EntityName
// Service: $ServiceInterfaceName

#region Dependency Injection
$injectCode
#endregion

#region GetAll Method
$getAll
#endregion

#region GetById Method
$getById
#endregion

#region Create Method
$create
#endregion

#region Update Method
$update
#endregion

#region Delete Method
$delete
#endregion

#endregion // Service Integration Snippets
"@
            Write-Output $csharpOutput
        }
    }

    exit 0
}
catch {
    Write-Error "Error generating service calls: $_"
    exit 1
}
