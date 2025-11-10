# Skill Reviewer

Automated quality review and validation for Claude Code skills using static analysis.

## Overview

The skill-reviewer validates skills for:
- ✅ **Structure** - Files, directories, YAML frontmatter
- ✅ **Content** - Required sections, completeness
- ✅ **Quality** - Best practices, formatting
- ✅ **Scoring** - 0-100 with severity-weighted issues

## Quick Start

### Using in Claude Code

```
Review my-skill
```

Or with auto-fix:

```
Review my-skill and fix issues
```

### Manual Script Execution

**Bash:**
```bash
cd .claude/skills/skill-reviewer
./scripts/review-skill.sh my-skill
```

**PowerShell:**
```powershell
cd .claude/skills/skill-reviewer
.\scripts\review-skill.ps1 my-skill
```

With auto-fix:

**Bash:**
```bash
./scripts/review-skill.sh my-skill --auto-fix
```

**PowerShell:**
```powershell
.\scripts\review-skill.ps1 my-skill -AutoFix
```

## Scoring System

- **Perfect Score:** 100 points
- **Pass Threshold:** 70 points
- **Severity Penalties:**
  - Critical: -20 points (structure, YAML)
  - Major: -5 points (missing sections)
  - Minor: -1 point (quality improvements)

**Score Ranges:**
- 90-100: ✅ Excellent, production-ready
- 80-89: ✅ Good, minor improvements
- 70-79: ✅ Acceptable, needs work
- Below 70: ❌ Failing, requires fixes

## Validation Checks

### Critical (Structure & YAML)
- SKILL.md exists
- YAML frontmatter present and valid
- Required fields: `name`, `description`
- Directory name matches YAML name

### Major (Content)
- Purpose section exists
- When to Use section exists
- Implementation/Workflow section exists
- Examples section exists
- Success Criteria section exists
- No TODO/FIXME placeholders

### Minor (Quality)
- Best Practices section present
- Uses imperative form (not "you should...")
- Workflows have numbered steps
- Examples are concrete and complete
- Proper markdown formatting

## Auto-Fix Capabilities

skill-reviewer can automatically fix:
1. **Script permissions** - Make scripts executable (`chmod +x`)
2. **Directory naming** - Rename to match YAML name
3. **Placeholders** - Remove TODO/FIXME markers (with confirmation)

All auto-fixes require user confirmation before applying.

## Directory Structure

```
skill-reviewer/
├── SKILL.md                       # Main skill definition
├── README.md                      # This file
├── scripts/                       # Validation scripts
│   ├── validate-structure.sh/ps1  # Check files/directories
│   ├── review-skill.sh/ps1        # Main orchestrator
│   └── [more validators TBD]
├── assets/                        # Configuration
│   └── review-criteria.json       # Scoring rules and checks
└── templates/                     # Templates
    └── review-report.md.template  # Report template (TBD)

Reports saved to: docs/skills/reviews/ (project root)
```

## Integration with create-skill Workflow

skill-reviewer is part of the complete skill creation pipeline:

```
/create-skill → skill-creator → skill-reviewer (≥70) → skill-tester → ✅ Production
```

**Quality Gate:** Review must score ≥70 before testing proceeds.

## Example Output

```
================================================
Skill Review: my-skill
================================================

[1/4] Structure Validation...
✅ STRUCT-001: SKILL.md exists
✅ STRUCT-002: YAML frontmatter present
✅ STRUCT-003: Directory name matches YAML name
❌ STRUCT-005: 2 scripts not executable (-1 point)

================================================
Final Score: 87/100
Status: ✅ PASSED

Issues Found:
  Critical: 0
  Major: 0
  Minor: 3

Auto-Fix Available:
- Make scripts executable (chmod +x)

Apply fixes? [y/n]
================================================
```

## Configuration

Edit `assets/review-criteria.json` to customize:
- Scoring weights
- Pass threshold
- Validation rules
- Auto-fix options

## Cross-Platform Support

Both Bash (.sh) and PowerShell (.ps1) scripts provided:

| Platform | Recommended Shell | Scripts to Use |
|----------|-------------------|----------------|
| **Windows** | PowerShell or Git Bash | `.ps1` or `.sh` |
| **Linux** | Bash | `.sh` |
| **macOS** | Bash / Zsh | `.sh` |

## Current Status

**Version:** 1.0 (MVP)

**Implemented:**
- ✅ Structure validation
- ✅ Basic scoring system
- ✅ Cross-platform scripts (.sh and .ps1)
- ✅ Integration with /create-skill workflow

**Coming Soon:**
- YAML validation script
- Content validation script
- Quality validation script
- Review report generation
- Full auto-fix implementation

**Note:** Current version provides core structure validation. Additional validators will be added as needed.

## Best Practices

1. **Review Early** - Run after skill creation, before testing
2. **Target 80+** - Aim for 80+ score for production skills
3. **Fix Critical First** - Address critical/major issues before minor
4. **Use Auto-Fix** - Saves time on common issues
5. **Review Reports** - Read detailed reports for improvement ideas

## Troubleshooting

**Issue: Scripts won't execute**
```bash
chmod +x scripts/*.sh
```

**Issue: YAML parse errors**
- Check YAML syntax between `---` markers
- Ensure `name:` and `description:` fields present

**Issue: Score seems wrong**
- Check `assets/review-criteria.json` for weights
- Review which checks failed

## Support

For issues or questions:
1. Check this README
2. Review SKILL.md for detailed workflows
3. Examine assets/review-criteria.json
4. Create issue in repository

---

**Part of SchaabCore - JS-AI Agentic SDLC Framework**
