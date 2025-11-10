# validate-structure.ps1
# Purpose: Check file/directory structure of a skill
# Usage: .\validate-structure.ps1 <skill-path>

param([Parameter(Mandatory=$true)][string]$SkillPath)

$issues = 0

Write-Host "Structure Validation"
Write-Host "===================="

# Check SKILL.md exists
if (Test-Path "$SkillPath\SKILL.md") {
    Write-Host "✅ STRUCT-001: SKILL.md exists" -ForegroundColor Green
} else {
    Write-Host "❌ STRUCT-001: SKILL.md missing (-20 points)" -ForegroundColor Red
    $issues += 20
}

# Check for YAML frontmatter
if ((Test-Path "$SkillPath\SKILL.md") -and ((Get-Content "$SkillPath\SKILL.md" -Raw) -match "^---")) {
    Write-Host "✅ STRUCT-002: YAML frontmatter present" -ForegroundColor Green
} else {
    Write-Host "❌ STRUCT-002: YAML frontmatter missing (-20 points)" -ForegroundColor Red
    $issues += 20
}

# Check directory name matches
$skillName = Split-Path -Leaf $SkillPath
if (Test-Path "$SkillPath\SKILL.md") {
    $content = Get-Content "$SkillPath\SKILL.md" -Raw
    if ($content -match "name:\s+(.+)") {
        $yamlName = $matches[1].Trim()
        if ($yamlName -eq $skillName) {
            Write-Host "✅ STRUCT-003: Directory name matches YAML name" -ForegroundColor Green
        } else {
            Write-Host "❌ STRUCT-003: Directory name mismatch (-5 points)" -ForegroundColor Red
            $issues += 5
        }
    }
}

Write-Host ""
Write-Host "Total Penalty: $issues points"
exit 0
