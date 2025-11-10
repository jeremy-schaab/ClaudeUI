---
name: skill-reviewer
description: This skill should be used when reviewing Claude Code skills for quality, structure, and best practices compliance. Use when validating newly created skills, ensuring documentation completeness, checking for placeholders or errors, or scoring skill quality before testing. Activates for skill review, quality check, skill validation, skill audit, or when users mention "review my skill", "check skill quality", "validate skill", or "audit skill documentation".
---

# Skill Reviewer

## Purpose

Review and validate Claude Code skills for quality, structure, and best practices compliance using automated static analysis. This skill provides comprehensive quality assurance before functional testing, ensuring skills are well-documented, properly structured, and ready for production use.

The skill-reviewer performs:
- **Structure validation** - Files, directories, permissions, references
- **YAML frontmatter validation** - Syntax, required fields, activation patterns
- **Content completeness** - Required sections, examples, success criteria
- **Quality assessment** - Best practices, clarity, consistency
- **Scoring** - 0-100 score with severity-weighted issues
- **Auto-fix suggestions** - Optional automated fixes with confirmation

---

## When to Use This Skill

Use this skill when:

- **After skill creation** - Validate newly generated skills before testing
- **Before committing** - Ensure skill quality meets standards
- **Quality audits** - Periodically review existing skills
- **Documentation review** - Check completeness and clarity
- **Pre-release validation** - Verify skills are production-ready
- **Identifying issues** - Find missing sections, placeholders, or errors
- **Comparing to standards** - Ensure consistency with best practices

Specific activation scenarios:
- "Review the skill I just created"
- "Check quality of my-skill"
- "Validate skill-tester documentation"
- "Audit all skills for completeness"
- "Score my skill before I commit it"

---

## Step-by-Step Implementation

### Workflow 1: Review Single Skill

**Purpose:** Validate a specific skill's quality and structure

**Steps:**

1. **Locate Skill Directory**
   - Find skill in `.claude/skills/[skill-name]/`
   - Verify directory exists
   - Check for SKILL.md file (required)

2. **Phase 1: Structure Validation** (Critical)
   - Check SKILL.md exists
   - Verify YAML frontmatter present
   - Validate directory name matches skill name
   - Check all referenced files exist (scripts, templates, configs)
   - Verify script permissions (if scripts present)
   - Check for README.md (recommended for complex skills)
   - **Score Impact:** -20 points per critical issue

3. **Phase 2: YAML Frontmatter Validation** (Critical)
   - Parse YAML syntax
   - Verify required fields: `name`, `description`
   - Check name matches directory name
   - Validate description format: "This skill should be used when..."
   - Check for activation keywords: "Activates for..."
   - **Score Impact:** -20 points per critical issue, -5 for major

4. **Phase 3: Content Completeness** (Major)
   - Check for required sections:
     - ✅ Purpose (critical)
     - ✅ When to Use (major)
     - ✅ Step-by-Step Implementation (major)
     - ✅ Examples (major)
     - ✅ Success Criteria (major)
     - ⚠️ Best Practices (minor)
     - ⚠️ Troubleshooting (minor)
   - Scan for placeholders: TODO, FIXME, XXX, {{PLACEHOLDER}}
   - Validate examples have expected outputs
   - **Score Impact:** -20 for missing Purpose, -5 for other major sections

5. **Phase 4: Quality Assessment** (Minor)
   - Check for imperative form (not "you should...")
   - Verify workflows have numbered steps
   - Validate examples are concrete (not abstract)
   - Check code examples for syntax validity
   - Compare to other skills for consistency
   - Verify markdown formatting
   - **Score Impact:** -1 point per minor issue

6. **Calculate Score**
   - Start with 100 points
   - Subtract points based on severity:
     - Critical: -20 each
     - Major: -5 each
     - Minor: -1 each
   - Pass threshold: 70+
   - Report final score

7. **Identify Auto-Fix Opportunities**
   - Script permissions: `chmod +x`
   - Directory renaming: match YAML name
   - Placeholder removal: delete TODO markers
   - Ask for confirmation before applying

8. **Generate Review Report**
   - Use template: `templates/review-report.md.template`
   - Include:
     - Overall score and status (PASS/FAIL)
     - Critical, major, minor issues
     - Strengths and positive aspects
     - Recommendations for improvement
     - Auto-fix suggestions
     - Comparison to best practices
   - Save to: `docs/skills/reviews/[skill-name]-review-[timestamp].md`

9. **Display Results**
   - Show score and status
   - List issues by severity
   - Highlight auto-fix options
   - Provide path to detailed report

**Success Criteria:**
- ✅ All validation phases completed
- ✅ Score calculated correctly
- ✅ Issues categorized by severity
- ✅ Review report generated
- ✅ Auto-fix suggestions provided (if applicable)
- ✅ Clear pass/fail determination

---

### Workflow 2: Review Multiple Skills

**Purpose:** Batch review of multiple skills for quality auditing

**Steps:**

1. **Discover Skills**
   - Scan `.claude/skills/` directory
   - Find all subdirectories with SKILL.md
   - Filter by pattern if specified (e.g., "review all *-generator skills")
   - Sort alphabetically

2. **Review Each Skill**
   - For each skill:
     - Display: "Reviewing skill X of N: [skill-name]"
     - Execute Workflow 1 (Review Single Skill)
     - Collect score and issue count
     - Continue to next skill (don't stop on failures)

3. **Aggregate Results**
   - Calculate statistics:
     - Total skills reviewed
     - Average score
     - Skills passing (≥70)
     - Skills failing (<70)
     - Total issues by severity
   - Identify skills needing attention

4. **Generate Comparison Report**
   - List all skills with scores
   - Highlight lowest-scoring skills
   - Show common issues across skills
   - Recommend priority fixes
   - Save to: `docs/skills/reviews/audit-[timestamp].md`

5. **Display Summary**
   ```
   ================================================
   Skill Audit Results
   ================================================
   Total Skills: 12
   Passed: 10 ✅ (83%)
   Failed: 2 ❌ (17%)
   Average Score: 84.5/100

   Skills Needing Attention:
   - old-skill: 62/100 (missing sections)
   - draft-skill: 45/100 (placeholders present)

   Report: docs/skills/reviews/audit-20250128.md
   ================================================
   ```

**Success Criteria:**
- ✅ All skills discovered and reviewed
- ✅ Statistics calculated correctly
- ✅ Comparison report generated
- ✅ Priority fixes identified

---

### Workflow 3: Review with Auto-Fix

**Purpose:** Review skill and apply automated fixes with confirmation

**Steps:**

1. **Initial Review**
   - Execute Workflow 1 (Review Single Skill)
   - Identify all issues
   - Calculate initial score

2. **Identify Fixable Issues**
   - Check each issue against `auto_fix.fixable_issues` in config
   - Categorize fixes:
     - **chmod**: Make scripts executable
     - **rename**: Fix directory/file names
     - **remove**: Delete placeholder text
   - Present fixes to user

3. **Request Confirmation**
   - Display each proposed fix:
     ```
     Auto-Fix Suggestions:

     1. Make scripts executable
        - scripts/validate-structure.sh
        - scripts/review-skill.sh

     2. Remove TODO placeholders
        - Line 45: "TODO: Add examples"
        - Line 102: "FIXME: Complete section"

     Apply these fixes? (y/n)
     ```

4. **Apply Approved Fixes**
   - If user confirms (y):
     - Execute each fix
     - Log changes made
     - Report success/failure per fix
   - If user declines (n):
     - Skip fixes
     - Note in review report

5. **Re-Review After Fixes**
   - Execute Workflow 1 again
   - Calculate new score
   - Show improvement:
     ```
     Score Improvement:
     Before: 68/100 ❌
     After: 82/100 ✅
     Improvement: +14 points
     ```

6. **Generate Final Report**
   - Include before/after scores
   - List fixes applied
   - Show remaining issues
   - Provide next steps

**Success Criteria:**
- ✅ Fixable issues identified
- ✅ User confirmation obtained
- ✅ Fixes applied successfully
- ✅ Score improvement calculated
- ✅ Final report includes changes

---

## Configuration

### Review Criteria File

**Location:** `assets/review-criteria.json`

**Purpose:** Define scoring rules, validation checks, and auto-fix options

**Key Settings:**

```json
{
  "scoring": {
    "perfect_score": 100,
    "pass_threshold": 70,
    "severity_weights": {
      "critical": -20,
      "major": -5,
      "minor": -1
    }
  },
  "validation_phases": {
    "structure": { "enabled": true, "severity": "critical" },
    "yaml": { "enabled": true, "severity": "critical" },
    "content": { "enabled": true, "severity": "major" },
    "quality": { "enabled": true, "severity": "minor" }
  },
  "auto_fix": {
    "enabled": true,
    "require_confirmation": true
  }
}
```

### Validation Checks

**Structure Checks (Critical):**
- STRUCT-001: SKILL.md exists
- STRUCT-002: SKILL.md has YAML frontmatter
- STRUCT-003: Directory name matches skill name
- STRUCT-004: All referenced files exist

**YAML Checks (Critical/Major):**
- YAML-001: Valid YAML syntax
- YAML-002: Required field: name
- YAML-003: Required field: description
- YAML-004: Name matches directory name
- YAML-005: Description follows activation pattern

**Content Checks (Major):**
- CONTENT-001: Purpose section exists
- CONTENT-002: When to Use section exists
- CONTENT-003: Implementation section exists
- CONTENT-004: Examples section exists
- CONTENT-005: Success Criteria section exists
- CONTENT-008: No TODO/FIXME placeholders

**Quality Checks (Minor):**
- QUALITY-001: Uses imperative form
- QUALITY-002: Workflows have numbered steps
- QUALITY-003: Examples are concrete
- QUALITY-004: Code examples valid

---

## Examples

### Example 1: Review New Skill

**User Request:**
```
Review the my-generator skill I just created
```

**Execution:**

1. Locate: `.claude/skills/my-generator/`
2. Validate structure: ✅ SKILL.md exists, all files present
3. Validate YAML: ✅ Valid syntax, all required fields
4. Check content: ⚠️ Missing "Best Practices" section
5. Check quality: ✅ Good examples, imperative form
6. Calculate score: 87/100
7. Generate report

**Output:**
```
================================================
Skill Review: my-generator
================================================
Overall Score: 87/100 ✅ PASSED

Issues Found:
  Critical: 0
  Major: 0
  Minor: 3

Minor Issues:
⚠️ CONTENT-006: Missing "Best Practices" section
⚠️ QUALITY-001: Line 45 uses "you should" (prefer imperative)
⚠️ QUALITY-006: Line 102 has inconsistent heading level

Strengths:
✨ Excellent YAML frontmatter with clear activation triggers
✨ Comprehensive examples with expected outputs
✨ All referenced files exist
✨ Well-structured workflows with numbered steps

Recommendations:
1. Add "Best Practices" section for higher score
2. Replace "you should" with imperative form
3. Fix heading hierarchy (H2 after H1, not H3)

Report: docs/skills/reviews/my-generator-review-20250128-143022.md
================================================
```

---

### Example 2: Review with Auto-Fix

**User Request:**
```
Review draft-skill and fix any issues you can
```

**Execution:**

1. Initial review: Score 65/100 ❌ FAILED
2. Issues found:
   - Scripts not executable (-1 minor)
   - TODO placeholders present (-5 major)
   - Missing examples (-5 major)
3. Identify auto-fixes:
   - Make scripts executable ✅
   - Remove TODO placeholders ✅
4. Request confirmation
5. Apply fixes after user confirms
6. Re-review: Score 76/100 ✅ PASSED

**Output:**
```
================================================
Auto-Fix Results
================================================
Initial Score: 65/100 ❌ FAILED

Auto-Fix Suggestions:
1. ✅ Make scripts executable (chmod +x)
   - scripts/run-draft.sh
2. ✅ Remove TODO placeholders
   - Line 34: "TODO: Add example"
   - Line 67: "FIXME: Complete this"

Apply fixes? [y/n]: y

Applying fixes...
✅ Made 1 script executable
✅ Removed 2 TODO placeholders

Re-reviewing skill...

Final Score: 76/100 ✅ PASSED
Improvement: +11 points

Remaining Issues:
⚠️ CONTENT-004: Examples section is incomplete

Next Steps:
- Add complete examples with inputs/outputs
- Re-review to achieve 80+ score

Report: docs/skills/reviews/draft-skill-review-20250128-145500.md
================================================
```

---

### Example 3: Audit Multiple Skills

**User Request:**
```
Audit all generator skills
```

**Execution:**

1. Discover: 3 skills matching "*-generator"
   - blazor-component-generator
   - test-suite-builder
   - vector-icon-generator
2. Review each skill
3. Aggregate results
4. Generate comparison report

**Output:**
```
================================================
Skill Audit: *-generator
================================================
Skills Reviewed: 3
Average Score: 81.7/100

Individual Results:
✅ blazor-component-generator: 92/100
✅ test-suite-builder: 85/100
⚠️ vector-icon-generator: 68/100

Skills Needing Attention:
⚠️ vector-icon-generator: 68/100
   Issues: Missing "When to Use" section, incomplete examples

Common Issues:
- 2 skills missing "Troubleshooting" sections
- 1 skill has TODO placeholders

Recommendations:
1. Fix vector-icon-generator first (below threshold)
2. Add troubleshooting sections for completeness
3. Remove remaining TODO placeholders

Report: docs/skills/reviews/audit-generator-skills-20250128.md
================================================
```

---

## Best Practices

### For Skill Reviewers (You)

1. **Review Before Testing**
   - Always review structure/docs before functional tests
   - Catch documentation issues early
   - Save time on test debugging

2. **Use Auto-Fix Wisely**
   - Only apply fixes you understand
   - Always request confirmation
   - Test after auto-fix to verify no breakage

3. **Prioritize by Severity**
   - Fix critical issues first (structure, YAML)
   - Address major issues next (content)
   - Minor issues can wait

4. **Compare to Standards**
   - Use skill-creator and skill-tester as examples
   - Ensure consistency across skills
   - Follow established patterns

5. **Document Review Decisions**
   - Save review reports for history
   - Track score trends over time
   - Learn from common issues

### For Skill Creators (Others)

1. **Review Early and Often**
   - Review after creation, before testing
   - Re-review after significant changes
   - Target 80+ score for production

2. **Fix Critical Issues First**
   - Structure and YAML problems block everything
   - Content completeness comes next
   - Polish quality last

3. **Use Score as Guide**
   - ≥90: Excellent, production-ready
   - 80-89: Good, minor improvements
   - 70-79: Acceptable, needs work
   - <70: Failing, requires fixes

4. **Learn from Feedback**
   - Read review reports carefully
   - Understand why issues matter
   - Apply lessons to future skills

---

## Success Criteria

### For Single Skill Review
- ✅ All validation phases completed without errors
- ✅ Score calculated correctly (0-100)
- ✅ Issues categorized by severity (critical/major/minor)
- ✅ Auto-fix suggestions identified (if applicable)
- ✅ Review report generated and saved
- ✅ Clear pass/fail determination (≥70 = pass)
- ✅ Actionable recommendations provided

### For Multiple Skill Audit
- ✅ All matching skills discovered
- ✅ Each skill reviewed successfully
- ✅ Statistics calculated (average, pass rate)
- ✅ Comparison report generated
- ✅ Priority skills identified

### For Auto-Fix Workflow
- ✅ Fixable issues identified correctly
- ✅ User confirmation obtained
- ✅ Fixes applied successfully
- ✅ Score improvement calculated
- ✅ No regressions introduced

---

## Troubleshooting

### Common Issues

**Issue: YAML parse errors**
- Check for proper YAML syntax (colons, quotes, indentation)
- Use online YAML validator
- Ensure frontmatter is between `---` markers

**Issue: False positives for section detection**
- Patterns match variations (e.g., "## Purpose" or "## Skill Purpose")
- Check review report for actual section names
- Adjust patterns in config if needed

**Issue: Auto-fix fails**
- Check file permissions
- Verify skill directory is writable
- Review error messages in report

**Issue: Score seems wrong**
- Review assets/review-criteria.json for scoring weights
- Check that severity is correctly assigned
- Verify all phases executed successfully

**Issue: Scripts not executable**
- Run: `chmod +x scripts/*.sh`
- Or use auto-fix with confirmation

### Debugging Tips

1. **Run validation phases individually**
   ```bash
   ./scripts/validate-structure.sh .claude/skills/my-skill
   ./scripts/validate-yaml.sh .claude/skills/my-skill
   ```

2. **Check review report for details**
   - Full report in `docs/skills/reviews/` directory
   - Contains detailed diagnostics

3. **Compare to working skills**
   - skill-creator is a good reference
   - skill-tester follows same patterns

---

## Integration with Other Skills

This skill complements:

- **skill-creator** - Review newly created skills automatically
- **skill-tester** - Validate quality before functional testing
- **create-skill workflow** - Part of the creation pipeline

**Typical Workflow:**
```
skill-creator → skill-reviewer (≥70) → skill-tester (pass) → ✅ Production
```

---

## Scripts Reference

### validate-structure.sh/ps1
**Purpose:** Check file/directory structure
**Usage:** `./scripts/validate-structure.sh <skill-path>`
**Checks:** SKILL.md, directories, file existence, permissions

### validate-yaml.sh/ps1
**Purpose:** Parse and validate YAML frontmatter
**Usage:** `./scripts/validate-yaml.sh <skill-path>`
**Checks:** Syntax, required fields, name matching, patterns

### validate-content.sh/ps1
**Purpose:** Check content completeness
**Usage:** `./scripts/validate-content.sh <skill-path>`
**Checks:** Required sections, placeholders, examples

### validate-quality.sh/ps1
**Purpose:** Assess quality and best practices
**Usage:** `./scripts/validate-quality.sh <skill-path>`
**Checks:** Imperative form, formatting, consistency

### generate-review-report.sh/ps1
**Purpose:** Create markdown review report
**Usage:** `./scripts/generate-review-report.sh <skill-name> <score> <issues-json> <output-path>`
**Outputs:** Formatted markdown report with recommendations

### review-skill.sh/ps1
**Purpose:** Main orchestrator for complete review
**Usage:** `./scripts/review-skill.sh <skill-name> [--auto-fix]`
**Outputs:** Score, issues, report, auto-fix suggestions

---

## Anthropic Best Practices Standards

skill-reviewer validates against official Anthropic and Claude Code standards:

### Reference Documentation

Located in `references/`:
- **anthropic-best-practices.md** - Anthropic's engineering blog standards
- **claude-code-skills-standards.md** - Official Claude Code documentation

### Key Anthropic Standards Validated

**Progressive Disclosure (Major):**
- Core content in SKILL.md
- Extended content in separate files (reference.md, examples.md)
- Token-efficient organization

**Name Requirements (Critical):**
- Lowercase letters, numbers, hyphens only
- Max 64 characters
- Must match directory name

**Description Requirements (Critical/Major):**
- Max 1024 characters
- Must include WHAT (functionality) and WHEN (use cases)
- Specific trigger terms for activation
- Focused scope (not overly broad)

**YAML Requirements (Critical):**
- Opening `---` on line 1
- Spaces only (no tabs)
- Valid YAML syntax
- Required fields: name, description

**Quality Standards (Minor):**
- Security considerations documented (for code execution/network access)
- Script purpose clear (execute vs reference)
- SKILL.md size reasonable (<3000 lines)
- Appropriate file organization

### Validation Phases

skill-reviewer implements 5 validation phases:

1. **Structure** - Files, directories, permissions (Critical)
2. **YAML** - Frontmatter syntax and requirements (Critical)
3. **Content** - Required sections and completeness (Major)
4. **Anthropic** - Best practices compliance (Major)
5. **Quality** - Formatting and consistency (Minor)

Each phase contributes to the final score (0-100) based on severity:
- Critical issues: -20 points each
- Major issues: -5 points each
- Minor issues: -1 point each

**Pass threshold:** 70+ points

---

## Additional Resources

- **Review Criteria:** `assets/review-criteria.json` (with Anthropic standards)
- **Report Template:** `templates/review-report.md.template`
- **Example Skills:** skill-creator, skill-tester (reference implementations)
- **Anthropic Standards:** `references/anthropic-best-practices.md`
- **Claude Code Standards:** `references/claude-code-skills-standards.md`

For questions or issues with this skill, review the skill-creator documentation or create a new issue in the repository.
