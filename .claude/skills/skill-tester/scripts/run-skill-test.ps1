# run-skill-test.ps1
# Purpose: Orchestrate complete skill test execution with hybrid validation
# Usage: .\run-skill-test.ps1 <skill-name> <test-case-id> [workspace-path]
# Outputs: Complete test execution with report generation

param(
    [Parameter(Mandatory=$true)]
    [string]$SkillName,

    [Parameter(Mandatory=$true)]
    [string]$TestCaseId,

    [Parameter(Mandatory=$false)]
    [string]$WorkspacePath = ".\.skill-tester-workspace"
)

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillTesterDir = Split-Path -Parent $scriptDir
$testCasesDir = Join-Path $skillTesterDir "test-cases"
$reportsDir = Join-Path $skillTesterDir "reports"
$configFile = Join-Path $skillTesterDir "config\test-config.json"

# Ensure directories exist
New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $WorkspacePath -Force | Out-Null

# Locate test case file
$testCaseFile = Join-Path $testCasesDir "$SkillName.yaml"

if (-not (Test-Path $testCaseFile)) {
    Write-Host "❌ Test case file not found: $testCaseFile" -ForegroundColor Red
    exit 1
}

# Extract test case details from YAML
$yamlContent = Get-Content $testCaseFile -Raw
$testCaseName = "Unknown"
if ($yamlContent -match "id:\s+$TestCaseId[\r\n]+\s+name:\s+(.+)") {
    $testCaseName = $matches[1].Trim()
}

# Parse validation flags from test case
$testCaseSection = ($yamlContent -split "id:\s+$TestCaseId")[1]
if ($testCaseSection) {
    $outputCheck = if ($testCaseSection -match "output_check:\s+(true|false)") { $matches[1] -eq "true" } else { $true }
    $syntaxCheck = if ($testCaseSection -match "syntax_check:\s+(true|false)") { $matches[1] -eq "true" } else { $true }
    $buildCheck = if ($testCaseSection -match "build_check:\s+(true|false)") { $matches[1] -eq "true" } else { $false }
    $testCheck = if ($testCaseSection -match "test_check:\s+(true|false)") { $matches[1] -eq "true" } else { $false }
}

# Initialize test tracking
$overallStatus = "PASSED"
$validationFailures = 0

Write-Host "================================================"
Write-Host "Skill Tester - Test Orchestrator"
Write-Host "================================================"
Write-Host "Skill: $SkillName" -ForegroundColor Cyan
Write-Host "Test Case: $TestCaseId - $testCaseName" -ForegroundColor Cyan
Write-Host "Workspace: $WorkspacePath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Validation Plan:"
Write-Host "  Output Check: $(if ($outputCheck) { '✓' } else { '○' })"
Write-Host "  Syntax Check: $(if ($syntaxCheck) { '✓' } else { '○' })"
Write-Host "  Build Check: $(if ($buildCheck) { '✓' } else { '○' })"
Write-Host "  Test Check: $(if ($testCheck) { '✓' } else { '○' })"
Write-Host "================================================"
Write-Host ""

# Record start time
$startTime = Get-Date

# ==================================================
# Phase 1: Output Validation (Always enabled)
# ==================================================

if ($outputCheck) {
    Write-Host "[1/4] Running Output Validation..." -ForegroundColor Blue
    Write-Host ""

    $validateScript = Join-Path $scriptDir "validate-output.ps1"
    & $validateScript $testCaseFile $WorkspacePath

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Output validation passed" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Output validation failed" -ForegroundColor Red
        $overallStatus = "FAILED"
        $validationFailures++
    }

    Write-Host ""
}

# ==================================================
# Phase 2: Syntax Validation (For C# skills)
# ==================================================

if ($syntaxCheck) {
    Write-Host "[2/4] Running Syntax Validation..." -ForegroundColor Blue
    Write-Host ""

    # Look for C# files in workspace
    $csharpFiles = Get-ChildItem -Path $WorkspacePath -Filter "*.cs" -Recurse

    if ($csharpFiles.Count -gt 0) {
        Write-Host "Found C# files to validate:"
        $csharpFiles | ForEach-Object { Write-Host $_.FullName }
        Write-Host ""

        # Basic syntax check
        $syntaxErrors = 0
        foreach ($csFile in $csharpFiles) {
            $content = Get-Content $csFile.FullName -Raw
            if ($content -match "(class|interface|namespace)") {
                Write-Host "  ✅ $($csFile.Name) - Valid C# structure" -ForegroundColor Green
            }
            else {
                Write-Host "  ⚠️  $($csFile.Name) - No class/interface/namespace found" -ForegroundColor Yellow
            }
        }

        if ($syntaxErrors -eq 0) {
            Write-Host "✅ Syntax validation passed" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Syntax validation failed with $syntaxErrors errors" -ForegroundColor Red
            $overallStatus = "FAILED"
            $validationFailures++
        }
    }
    else {
        Write-Host "⚠️  No C# files found in workspace, skipping syntax check" -ForegroundColor Yellow
    }

    Write-Host ""
}

# ==================================================
# Phase 3: Build Validation (If enabled)
# ==================================================

if ($buildCheck) {
    Write-Host "[3/4] Running Build Validation..." -ForegroundColor Blue
    Write-Host ""

    # Look for .csproj or .sln in workspace
    $projectFile = Get-ChildItem -Path $WorkspacePath -Include "*.csproj","*.sln" -Recurse | Select-Object -First 1

    if ($projectFile) {
        $buildScript = Join-Path $scriptDir "run-build-test.ps1"
        & $buildScript $projectFile.FullName

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build validation passed" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Build validation failed" -ForegroundColor Red
            $overallStatus = "FAILED"
            $validationFailures++
        }
    }
    else {
        Write-Host "⚠️  No project file found in workspace" -ForegroundColor Yellow
        Write-Host "Workspace contents:"
        Get-ChildItem -Path $WorkspacePath | Format-Table Name, Length
        Write-Host ""
        Write-Host "Build validation skipped (no project to build)"
        $overallStatus = "WARNING"
    }

    Write-Host ""
}

# ==================================================
# Phase 4: Test Validation (If enabled)
# ==================================================

if ($testCheck) {
    Write-Host "[4/4] Running Test Validation..." -ForegroundColor Blue
    Write-Host ""

    # Look for test projects
    $testProject = Get-ChildItem -Path $WorkspacePath -Filter "*Tests.csproj" -Recurse | Select-Object -First 1

    if ($testProject) {
        $testScript = Join-Path $scriptDir "run-unit-tests.ps1"
        & $testScript $testProject.FullName -Coverage

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Test validation passed" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Test validation failed" -ForegroundColor Red
            $overallStatus = "FAILED"
            $validationFailures++
        }
    }
    else {
        Write-Host "⚠️  No test project found in workspace" -ForegroundColor Yellow
        Write-Host "Test validation skipped (no tests to run)"
        if ($overallStatus -eq "PASSED") {
            $overallStatus = "WARNING"
        }
    }

    Write-Host ""
}

# Record end time
$endTime = Get-Date
$totalDuration = [math]::Round(($endTime - $startTime).TotalSeconds)

# ==================================================
# Phase 5: Generate Report
# ==================================================

Write-Host "Generating Test Report..." -ForegroundColor Blue
Write-Host ""

$reportTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = Join-Path $reportsDir "$SkillName-$TestCaseId-$reportTimestamp.md"

$reportScript = Join-Path $scriptDir "generate-test-report.ps1"
& $reportScript $SkillName $TestCaseId $reportFile $overallStatus

# ==================================================
# Display Final Results
# ==================================================

Write-Host ""
Write-Host "================================================"
Write-Host "Test Execution Complete"
Write-Host "================================================"
Write-Host ""

switch ($overallStatus) {
    "PASSED" {
        Write-Host "✅ TEST PASSED" -ForegroundColor Green
    }
    "FAILED" {
        Write-Host "❌ TEST FAILED" -ForegroundColor Red
        Write-Host "Validation failures: $validationFailures" -ForegroundColor Red
    }
    "WARNING" {
        Write-Host "⚠️  TEST PASSED WITH WARNINGS" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Test Details:"
Write-Host "  Skill: $SkillName"
Write-Host "  Test Case: $TestCaseId"
Write-Host "  Duration: ${totalDuration}s"
Write-Host "  Report: $reportFile"
Write-Host ""
Write-Host "================================================"

# Exit with appropriate code
if ($overallStatus -eq "PASSED" -or $overallStatus -eq "WARNING") {
    exit 0
}
else {
    exit 1
}
