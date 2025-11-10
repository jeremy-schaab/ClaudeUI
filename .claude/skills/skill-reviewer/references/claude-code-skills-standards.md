# Claude Code Skills: Official Standards & Requirements

**Source:** https://docs.claude.com/en/docs/claude-code/skills

**Last Updated:** 2025-01-28

---

## File Structure Requirements

### Mandatory Structure

Every skill **must**:
- Be organized as a directory
- Contain a `SKILL.md` file at the root
- Have valid YAML frontmatter in SKILL.md

### Complete File Organization

```
skill-name/
├── SKILL.md          (REQUIRED)
├── reference.md      (optional - detailed documentation)
├── examples.md       (optional - usage examples)
├── scripts/          (optional - executable tools)
├── templates/        (optional - file templates)
└── config/           (optional - configuration files)
```

### Storage Locations by Scope

| Scope | Location | Use Case |
|-------|----------|----------|
| **Personal Skills** | `~/.claude/skills/skill-name/` | User-specific, across all projects |
| **Project Skills** | `.claude/skills/skill-name/` | Project-specific, shared with team |
| **Plugin Skills** | Bundled with plugins | Distributed via marketplace |

**Note:** Project skills in `.claude/skills/` are automatically available to team members via git.

---

## YAML Frontmatter Specifications

### Required Fields

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `name` | string | Lowercase letters, numbers, hyphens only; max 64 characters | ✅ YES |
| `description` | string | Max 1024 characters; must include WHAT and WHEN | ✅ YES |
| `allowed-tools` | string | Comma-separated tool names (optional) | ❌ NO |

### Format Requirements

```yaml
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
allowed-tools: Read, Grep, Glob
---
```

**Critical rules:**
- Opening `---` must be on line 1
- Closing `---` must precede Markdown content
- **NO TABS** - use spaces only
- Fields are case-sensitive
- No additional fields allowed in frontmatter

### Name Requirements

**Valid characters:**
- Lowercase letters (a-z)
- Numbers (0-9)
- Hyphens (-)

**Examples:**
- ✅ `pdf-processing`
- ✅ `data-analyzer-v2`
- ❌ `PDF_Processing` (uppercase, underscore)
- ❌ `data analyzer` (space)
- ❌ `my.skill` (period)

**Best practices:**
- Keep under 30 characters for readability
- Use descriptive names indicating purpose
- Avoid version numbers unless necessary

### Description Requirements

**Length:** Max 1024 characters

**Must include:**
1. **WHAT:** What the skill does (functionality)
2. **WHEN:** When to use it (activation scenarios)
3. **Trigger terms:** Specific keywords users would mention

**Quality examples:**

❌ **Poor:** "For data analysis"
- Too vague
- No trigger terms
- Missing WHEN

✅ **Strong:** "Analyze Excel spreadsheets, create pivot tables, generate charts. Use when working with Excel files or .xlsx format data."
- Specific functionality
- Clear use cases
- Contains trigger terms (Excel, spreadsheets, pivot tables, .xlsx)

❌ **Poor:** "Helps with documents"
- Overly broad
- No specificity
- Weak verb ("helps")

✅ **Strong:** "Extract text from PDFs, fill PDF forms, merge multiple PDFs. Use when manipulating PDF files or converting documents to PDF format."
- Concrete actions
- Specific document type
- Clear activation scenarios

---

## Quality Standards

### Scope and Focus

**Keep skills narrowly focused:**
- ✅ "PDF form filling" (specific capability)
- ❌ "Document processing" (too broad—split into multiple skills)

**When to split skills:**
- Skill handles unrelated tasks
- Description exceeds 1024 characters trying to cover everything
- Activation becomes unpredictable
- Different workflows rarely used together

### Testing Requirements

**Activation testing:**
1. Ask questions matching your description
2. Verify skill activates appropriately
3. Test edge cases and alternative phrasings
4. Have teammates validate activation behavior

**Quality checks:**
- Does it activate when expected?
- Does it avoid false activations?
- Is the description clear to users?
- Are examples helpful and accurate?

### Documentation Standards

**Version tracking:**
- Document changes in SKILL.md content if needed
- Use semantic versioning for major updates
- Note breaking changes prominently

**Examples:**
- Provide clear examples in SKILL.md or examples.md
- Show realistic inputs and expected outputs
- Cover common use cases
- Document edge cases

**File references:**
- Use relative paths: `[reference.md](reference.md)`
- Verify all referenced files exist
- Keep paths consistent across platforms

---

## Skill Activation & Discovery

### Model-Invoked vs User-Invoked

**Skills are MODEL-INVOKED:**
- Claude autonomously decides when to use them
- Based on name, description, and context
- Uses progressive disclosure (reads only when relevant)
- NOT like slash commands (user-invoked)

**Discovery methods:**
- Ask: "What Skills are available?"
- List via filesystem: `ls ~/.claude/skills/` or `.claude/skills/`
- Skills activate automatically when relevant

### Progressive Disclosure

**How it works:**
1. **First:** Claude reads name + description (metadata only)
2. **Then:** If relevant, loads full SKILL.md content
3. **Finally:** Loads supporting files (reference.md, etc.) only as needed

**Benefits:**
- Efficient context usage
- Scales to unlimited skill complexity
- Avoids loading unnecessary content
- Faster activation decisions

---

## Tool Access Restrictions

### allowed-tools Field

**Purpose:** Restrict which tools Claude can use within the skill

**Format:**
```yaml
allowed-tools: Read, Grep, Glob
```

**Use cases:**
- **Read-only skills:** `Read, Grep, Glob`
- **Limited-scope workflows:** Specific tool subsets
- **Security-sensitive contexts:** Restrict to safe operations

**Without this field:**
- Claude follows standard permission prompting
- Can request any tool as needed
- User approves on case-by-case basis

**Available tools:**
- Read, Write, Edit
- Bash, Grep, Glob
- WebFetch, WebSearch
- Task (for agents)
- And more...

---

## Common Issues & Solutions

### Issue: Skill Doesn't Activate

**Symptoms:**
- Skill never loads despite relevant queries
- Claude doesn't recognize when to use it

**Solutions:**
- Make description more specific
- Add concrete trigger terms users would mention
- Test with exact phrases from user queries
- Ensure name is descriptive

**Example fix:**
- Before: "Data processing skill"
- After: "Analyze CSV files, filter rows, calculate statistics. Use when working with spreadsheet data or .csv files."

### Issue: YAML Won't Load

**Symptoms:**
- Error loading skill
- SKILL.md not recognized

**Solutions:**
- Validate YAML syntax:
  - Opening `---` on line 1
  - Closing `---` before Markdown content
  - No tabs (use spaces)
  - Proper field names (case-sensitive)
- Use online YAML validator
- Check for special characters in values

### Issue: Path Not Found

**Symptoms:**
- Skill files not loading
- References broken

**Solutions:**
- Verify correct location:
  - Personal: `~/.claude/skills/`
  - Project: `.claude/skills/`
- Check directory name matches YAML name
- Use forward slashes in paths (even on Windows)
- Verify all referenced files exist

### Issue: Script Execution Fails

**Symptoms:**
- Scripts don't run
- Permission denied errors

**Solutions:**
- Set execute permissions: `chmod +x script.sh`
- Use forward slashes in paths
- Test scripts independently first
- Verify shebang line: `#!/bin/bash`
- Check for Windows line endings (use LF, not CRLF)

---

## Sharing & Version Control

### Project Skills (Git-Based)

**Automatic distribution:**
- Place skills in `.claude/skills/skill-name/`
- Commit to repository
- Team members get skills automatically when pulling

**Best practices:**
- Include README.md explaining skill purpose
- Document dependencies
- Version skills semantically
- Note breaking changes in commits

### Plugin Distribution

**For broader sharing:**
- Bundle skills into plugins
- Distribute via marketplace
- Include version history in documentation
- Provide installation instructions

**Plugin structure:**
```
my-plugin/
├── skills/
│   └── skill-name/
│       └── SKILL.md
└── plugin.json
```

---

## Validation Checklist

### Structure ✅
- [ ] Skill is a directory
- [ ] SKILL.md exists at root
- [ ] All referenced files exist
- [ ] Directory name matches YAML name field

### YAML Frontmatter ✅
- [ ] Opening `---` on line 1
- [ ] Closing `---` before Markdown
- [ ] `name` field present and valid
- [ ] `description` field present and valid
- [ ] No tabs in YAML
- [ ] Proper spacing around colons

### Name Quality ✅
- [ ] Lowercase letters, numbers, hyphens only
- [ ] Max 64 characters
- [ ] Descriptive and clear
- [ ] Matches directory name

### Description Quality ✅
- [ ] Max 1024 characters
- [ ] Includes WHAT skill does
- [ ] Includes WHEN to use it
- [ ] Contains specific trigger terms
- [ ] Avoids vague language
- [ ] Focused, not overly broad

### Documentation ✅
- [ ] Clear examples provided
- [ ] Realistic use cases
- [ ] Supporting files documented
- [ ] Version history (if applicable)

### Testing ✅
- [ ] Tested activation with queries
- [ ] Validated with teammates
- [ ] Edge cases covered
- [ ] False activations minimal

### Tools & Permissions ✅
- [ ] `allowed-tools` appropriate (if used)
- [ ] Scripts executable
- [ ] Paths are relative
- [ ] No security issues

---

## References

- **Primary Source:** Claude Code Skills Documentation
- **URL:** https://docs.claude.com/en/docs/claude-code/skills
- **Last Fetched:** 2025-01-28

---

**Notes for skill-reviewer:**

**Critical validations** (must pass):
- SKILL.md exists
- YAML frontmatter valid
- name and description fields present
- Name format follows rules (lowercase, hyphens, no special chars)
- Description under 1024 characters

**Major validations** (should pass):
- Description includes WHAT and WHEN
- Specific trigger terms present
- Scope appropriately focused
- All referenced files exist
- Scripts have execute permissions

**Minor validations** (nice to have):
- Examples provided
- Documentation complete
- Version history tracked
- Security considerations noted
