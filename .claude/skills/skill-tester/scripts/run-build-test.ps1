# run-build-test.ps1
# Purpose: Execute dotnet build and report results
# Usage: .\run-build-test.ps1 <project-path> [configuration]
# Outputs: Build status, error count, warning count

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,

    [Parameter(Mandatory=$false)]
    [string]$Configuration = "Debug"
)

# Validate project path
if (-not (Test-Path $ProjectPath)) {
    Write-Host "❌ Project path not found: $ProjectPath" -ForegroundColor Red
    exit 1
}

# Determine if it's a solution or project file
$buildTarget = ""
if (Test-Path $ProjectPath -PathType Container) {
    # It's a directory, find .csproj or .sln
    $sln = Get-ChildItem -Path $ProjectPath -Filter "*.sln" | Select-Object -First 1
    $csproj = Get-ChildItem -Path $ProjectPath -Filter "*.csproj" | Select-Object -First 1

    if ($sln) {
        $buildTarget = $sln.FullName
    }
    elseif ($csproj) {
        $buildTarget = $csproj.FullName
    }
    else {
        Write-Host "❌ No solution or project file found in: $ProjectPath" -ForegroundColor Red
        exit 1
    }
}
else {
    $buildTarget = $ProjectPath
}

Write-Host "================================================"
Write-Host "Build Validation"
Write-Host "================================================"
Write-Host "Target: $buildTarget"
Write-Host "Configuration: $Configuration"
Write-Host ""

# Check if dotnet CLI is available
try {
    $dotnetVersion = dotnet --version
    Write-Host "dotnet version: $dotnetVersion"
    Write-Host ""
}
catch {
    Write-Host "❌ dotnet CLI not found in PATH" -ForegroundColor Red
    Write-Host "Please install .NET SDK from https://dotnet.microsoft.com/download"
    exit 1
}

# Run dotnet restore first
Write-Host "Restoring packages..."
$restoreOutput = dotnet restore $buildTarget --verbosity quiet 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Package restore succeeded" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Package restore had warnings (continuing)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Building project..."
Write-Host ""

# Run dotnet build
$startTime = Get-Date
$buildOutput = dotnet build $buildTarget --configuration $Configuration --no-restore --verbosity normal 2>&1
$buildSuccess = $LASTEXITCODE -eq 0
$endTime = Get-Date
$buildDuration = [math]::Round(($endTime - $startTime).TotalSeconds)

# Parse build output for errors and warnings
$buildOutputText = $buildOutput | Out-String
$errorCount = ([regex]::Matches($buildOutputText, "error CS")).Count
$warningCount = ([regex]::Matches($buildOutputText, "warning CS")).Count

# Extract error details
$errorDetails = $buildOutput | Where-Object { $_ -match "error CS" }

Write-Host ""
Write-Host "================================================"
Write-Host "Build Results"
Write-Host "================================================"
Write-Host "Duration: ${buildDuration}s"
Write-Host ""

if ($buildSuccess) {
    Write-Host "✅ BUILD SUCCEEDED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Errors: 0"
    if ($warningCount -gt 0) {
        Write-Host "Warnings: $warningCount" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Warnings found:"
        $buildOutput | Where-Object { $_ -match "warning CS" } | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "Warnings: 0"
    }
    exit 0
}
else {
    Write-Host "❌ BUILD FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Errors: $errorCount" -ForegroundColor Red
    Write-Host "Warnings: $warningCount" -ForegroundColor Yellow
    Write-Host ""

    if ($errorCount -gt 0) {
        Write-Host "Build Errors:"
        Write-Host "----------------------------------------"
        $errorDetails | ForEach-Object { Write-Host $_ }
        Write-Host "----------------------------------------"
    }

    Write-Host ""
    Write-Host "Full build output:"
    Write-Host "----------------------------------------"
    $buildOutput | ForEach-Object { Write-Host $_ }
    Write-Host "----------------------------------------"
    exit 1
}
