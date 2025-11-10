# run-unit-tests.ps1
# Purpose: Execute dotnet test and collect results
# Usage: .\run-unit-tests.ps1 <project-path> [-Coverage]
# Outputs: Test counts (passed/failed/skipped), coverage metrics

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,

    [Parameter(Mandatory=$false)]
    [switch]$Coverage
)

# Validate project path
if (-not (Test-Path $ProjectPath)) {
    Write-Host "❌ Project path not found: $ProjectPath" -ForegroundColor Red
    exit 1
}

# Determine if it's a directory, solution, or project file
$testTarget = ""
if (Test-Path $ProjectPath -PathType Container) {
    # It's a directory, find test projects
    $sln = Get-ChildItem -Path $ProjectPath -Filter "*.sln" | Select-Object -First 1
    $testProj = Get-ChildItem -Path $ProjectPath -Filter "*Tests.csproj" -Recurse | Select-Object -First 1

    if ($sln) {
        $testTarget = $sln.FullName
    }
    elseif ($testProj) {
        $testTarget = $testProj.FullName
    }
    else {
        Write-Host "❌ No test project found in: $ProjectPath" -ForegroundColor Red
        exit 1
    }
}
else {
    $testTarget = $ProjectPath
}

Write-Host "================================================"
Write-Host "Test Validation"
Write-Host "================================================"
Write-Host "Target: $testTarget"
Write-Host "Coverage: $(if ($Coverage) { 'Enabled' } else { 'Disabled' })"
Write-Host ""

# Check if dotnet CLI is available
try {
    $null = dotnet --version
}
catch {
    Write-Host "❌ dotnet CLI not found in PATH" -ForegroundColor Red
    exit 1
}

# Prepare test results directory
$testResultsDir = ".\TestResults"
if (Test-Path $testResultsDir) {
    Remove-Item -Path $testResultsDir -Recurse -Force
}
New-Item -ItemType Directory -Path $testResultsDir -Force | Out-Null

Write-Host "Running tests..."
Write-Host ""

# Build test command
$testArgs = @(
    "test",
    "`"$testTarget`"",
    "--no-build",
    "--verbosity", "normal",
    "--results-directory", "`"$testResultsDir`"",
    "--logger", "console;verbosity=detailed"
)

if ($Coverage) {
    $testArgs += "--collect:`"XPlat Code Coverage`""
}

# Run tests
$startTime = Get-Date
$testOutput = & dotnet $testArgs 2>&1
$testSuccess = $LASTEXITCODE -eq 0
$endTime = Get-Date
$testDuration = [math]::Round(($endTime - $startTime).TotalSeconds)

# Parse test results
$testOutputText = $testOutput | Out-String
$totalTests = 0
$passedTests = 0
$failedTests = 0
$skippedTests = 0

if ($testOutputText -match 'Total tests:\s*(\d+)') {
    $totalTests = [int]$matches[1]
}
if ($testOutputText -match 'Passed:\s*(\d+)') {
    $passedTests = [int]$matches[1]
}
if ($testOutputText -match 'Failed:\s*(\d+)') {
    $failedTests = [int]$matches[1]
}
if ($testOutputText -match 'Skipped:\s*(\d+)') {
    $skippedTests = [int]$matches[1]
}

# Alternative parsing if first attempt fails
if ($totalTests -eq 0 -and $testOutputText -match 'Total:\s*(\d+)') {
    $totalTests = [int]$matches[1]
}
if ($passedTests -eq 0 -and $testOutputText -match 'Passed!\s*-\s*Failed:\s*0,\s*Passed:\s*(\d+)') {
    $passedTests = [int]$matches[1]
}

# Parse coverage if enabled
$coveragePercent = "N/A"
if ($Coverage) {
    # Look for coverage files
    $coverageFile = Get-ChildItem -Path $testResultsDir -Filter "coverage.cobertura.xml" -Recurse | Select-Object -First 1

    if ($coverageFile) {
        # Try to extract line coverage from cobertura XML
        [xml]$coverageXml = Get-Content $coverageFile.FullName
        $lineRate = $coverageXml.coverage.'line-rate'
        if ($lineRate) {
            $coveragePercent = [math]::Round([double]$lineRate * 100, 1)
        }

        Write-Host "ℹ️  Coverage file generated: $($coverageFile.FullName)" -ForegroundColor Blue
        Write-Host ""
    }
}

# Display results
Write-Host ""
Write-Host "================================================"
Write-Host "Test Results"
Write-Host "================================================"
Write-Host "Duration: ${testDuration}s"
Write-Host ""

if ($testSuccess) {
    Write-Host "✅ ALL TESTS PASSED" -ForegroundColor Green
}
else {
    Write-Host "❌ TESTS FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test Summary:"
Write-Host "  Total: $totalTests"
Write-Host "  Passed: $passedTests" -ForegroundColor Green

if ($failedTests -gt 0) {
    Write-Host "  Failed: $failedTests" -ForegroundColor Red
}
else {
    Write-Host "  Failed: 0"
}

if ($skippedTests -gt 0) {
    Write-Host "  Skipped: $skippedTests" -ForegroundColor Yellow
}

if ($Coverage) {
    Write-Host ""
    Write-Host "Coverage:"
    if ($coveragePercent -ne "N/A") {
        Write-Host "  Line Coverage: ${coveragePercent}%" -ForegroundColor Green
    }
    else {
        Write-Host "  Coverage data not available" -ForegroundColor Yellow
    }
}

# Show failed test details if any
if ($failedTests -gt 0) {
    Write-Host ""
    Write-Host "Failed Tests:"
    Write-Host "----------------------------------------"
    $testOutput | Where-Object { $_ -match "Failed" } | Select-Object -First 10 | ForEach-Object { Write-Host $_ }
    Write-Host "----------------------------------------"
}

Write-Host ""
Write-Host "Full test output:"
Write-Host "----------------------------------------"
$testOutput | ForEach-Object { Write-Host $_ }
Write-Host "----------------------------------------"

# Exit with appropriate code
if ($testSuccess -and $failedTests -eq 0) {
    exit 0
}
else {
    exit 1
}
