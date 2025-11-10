# validate-output.ps1
# Purpose: Validate skill output files and content patterns
# Usage: .\validate-output.ps1 <test-case-yaml> <workspace-path>
# Outputs: Validation results with ✅/❌ indicators

param(
    [Parameter(Mandatory=$true)]
    [string]$TestCaseYaml,

    [Parameter(Mandatory=$true)]
    [string]$WorkspacePath
)

# Validate inputs
if (-not (Test-Path $TestCaseYaml)) {
    Write-Host "❌ Test case file not found: $TestCaseYaml" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $WorkspacePath)) {
    Write-Host "⚠️  Workspace path does not exist: $WorkspacePath" -ForegroundColor Yellow
    Write-Host "Creating workspace directory..."
    New-Item -ItemType Directory -Path $WorkspacePath -Force | Out-Null
}

# Parse test case ID from YAML (simple regex-based parsing)
$yamlContent = Get-Content $TestCaseYaml -Raw
$testCaseId = "UNKNOWN"
if ($yamlContent -match 'id:\s+(.+)') {
    $testCaseId = $matches[1].Trim()
}

Write-Host "================================================"
Write-Host "Output Validation"
Write-Host "================================================"
Write-Host "Test Case: $testCaseId"
Write-Host "Workspace: $WorkspacePath"
Write-Host ""

# Counters
$totalFiles = 0
$filesFound = 0
$filesMissing = 0
$totalPatterns = 0
$patternsFound = 0
$patternsMissing = 0

# Parse expected outputs from YAML
$lines = Get-Content $TestCaseYaml
$inExpectedOutputs = $false
$currentFile = ""

foreach ($line in $lines) {
    # Detect expected_outputs section
    if ($line -match '^\s*expected_outputs:\s*$') {
        $inExpectedOutputs = $true
        continue
    }

    # Exit expected_outputs section when we hit validation or another top-level key
    if ($inExpectedOutputs -and $line -match '^\s{2}[a-z_]+:\s*$') {
        $inExpectedOutputs = $false
        break
    }

    # Parse file path
    if ($inExpectedOutputs -and $line -match '^\s*-\s*file:\s*(.+)$') {
        $currentFile = $matches[1].Trim().Trim('"').Trim("'")
        $totalFiles++

        # Check if file exists
        $filePath = Join-Path $WorkspacePath $currentFile

        if (Test-Path $filePath) {
            Write-Host "✅ File exists: $currentFile" -ForegroundColor Green
            $filesFound++

            # Get file size
            $fileSize = (Get-Content $filePath).Count
            Write-Host "   Lines: $fileSize"
        }
        else {
            Write-Host "❌ File missing: $currentFile" -ForegroundColor Red
            $filesMissing++
            $currentFile = ""
            continue
        }
    }

    # Parse patterns (only if current file exists)
    if ($currentFile -and $inExpectedOutputs -and $line -match '^\s{10}-\s*"?(.+?)"?\s*$') {
        $pattern = $matches[1].Trim().Trim('"').Trim("'")
        $totalPatterns++

        $filePath = Join-Path $WorkspacePath $currentFile

        # Search for pattern in file
        $content = Get-Content $filePath -Raw
        if ($content -match [regex]::Escape($pattern)) {
            Write-Host "   ✅ Pattern found: `"$pattern`"" -ForegroundColor Green
            $patternsFound++
        }
        else {
            Write-Host "   ❌ Pattern missing: `"$pattern`"" -ForegroundColor Red
            $patternsMissing++
        }
    }
}

Write-Host ""
Write-Host "================================================"
Write-Host "Validation Summary"
Write-Host "================================================"
Write-Host "Files:"
Write-Host "  Total expected: $totalFiles"
Write-Host "  Found: $filesFound" -ForegroundColor Green
Write-Host "  Missing: $filesMissing" -ForegroundColor Red
Write-Host ""
Write-Host "Patterns:"
Write-Host "  Total expected: $totalPatterns"
Write-Host "  Found: $patternsFound" -ForegroundColor Green
Write-Host "  Missing: $patternsMissing" -ForegroundColor Red
Write-Host ""

# Determine overall result
if ($filesMissing -eq 0 -and $patternsMissing -eq 0) {
    Write-Host "✅ OUTPUT VALIDATION PASSED" -ForegroundColor Green
    exit 0
}
elseif ($filesMissing -gt 0) {
    Write-Host "❌ OUTPUT VALIDATION FAILED: Missing files" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "❌ OUTPUT VALIDATION FAILED: Missing patterns" -ForegroundColor Red
    exit 1
}
