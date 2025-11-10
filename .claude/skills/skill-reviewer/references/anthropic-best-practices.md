# Anthropic Best Practices for Agent Skills

**Source:** https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

**Last Updated:** 2025-01-28

---

## Core Design Principles

### 1. Progressive Disclosure Architecture

Skills should organize information across three disclosure levels:

1. **Metadata Level** - Skill name and description only
   - Preloaded into system prompt
   - Enables Claude to decide activation without loading full content
   - Must be clear and specific

2. **Core Level** - Full SKILL.md content
   - Loaded only when skill is deemed relevant
   - Contains main instructions and workflows
   - Should be comprehensive but concise

3. **Extended Level** - Bundled files (reference.md, forms.md, etc.)
   - Loaded only as needed
   - Keeps context efficient
   - Enables unbounded skill complexity

**Key Insight:** This approach keeps context efficient while enabling unbounded skill complexity through separate, referenced files.

---

## Structural Requirements

### Mandatory Components

A skill **must** be a directory containing:
- **SKILL.md file** with YAML frontmatter
- YAML must specify: `name` and `description`
- These fields enable Claude to decide activation appropriately

### File Organization

```
skill-name/
├── SKILL.md (required - core instructions)
├── reference.md (optional - detailed documentation)
├── forms.md (optional - templates/examples)
└── scripts/ (optional - executable tools)
```

---

## Development Best Practices

### Start with Evaluation

**Principle:** Identify capability gaps through representative task testing before building.

**Process:**
1. Test current capabilities with representative tasks
2. Identify shortcomings and failure patterns
3. Build skills incrementally to address specific gaps
4. Iterate based on real-world usage

**Why:** Ensures skills solve actual problems, not theoretical ones.

---

### Structure for Scale

**When to split content:**
- SKILL.md becomes unwieldy (>2000 lines)
- Content is mutually exclusive (different workflows)
- Contexts are rarely used together

**Splitting strategy:**
- Move detailed reference material to `reference.md`
- Keep frequently-used content in SKILL.md
- Create separate files for specialized workflows
- Reduce token consumption by keeping contexts separate

**Code considerations:**
- Code can serve as both executable tools AND documentation
- Be clear about whether Claude should execute or reference scripts
- Document script behavior in SKILL.md

---

### Think from Claude's Perspective

**Critical fields:**
- Pay special attention to `name` and `description`
- Claude relies on these for activation decisions
- Monitor real-world usage patterns
- Iterate based on actual activation behaviors

**Observation strategies:**
- Track when skills activate appropriately
- Note false positives (wrong activations)
- Identify missed activations (false negatives)
- Refine descriptions based on patterns

---

### Iterate with Claude

**Collaboration approach:**
- Capture successful approaches into reusable context
- Document common mistakes and how to avoid them
- Work with Claude to refine workflows
- Build institutional knowledge into skills

**Continuous improvement:**
- Update skills based on real usage
- Add examples from actual successful executions
- Document edge cases and solutions
- Refine based on feedback

---

## Security Considerations

### Trust and Safety

**Installation guidelines:**
- Install skills ONLY from trusted sources
- Audit less-trusted skills before use
- Review all bundled files carefully

**Audit checklist:**
- Check for code dependencies
- Inspect embedded resources
- Review instructions for external network connections
- Verify no untrusted data sources
- Examine script behavior

**Risk factors:**
- Instructions directing Claude to untrusted URLs
- Code execution without validation
- Access to sensitive data
- Network requests to unknown endpoints

---

## Quality Standards (Anthropic)

### Name Quality
- Lowercase letters, numbers, hyphens only
- Descriptive and specific
- Max 64 characters
- Clear purpose indication

### Description Quality
- Max 1024 characters
- Includes WHAT the skill does
- Includes WHEN to use it
- Contains specific trigger terms
- Avoids vague language

### Content Quality
- Clear, step-by-step instructions
- Concrete examples with inputs/outputs
- Proper progressive disclosure
- Referenced files for extended content
- Security considerations documented

### Structural Quality
- SKILL.md exists and is well-formed
- YAML frontmatter valid
- Referenced files exist
- Scripts have proper permissions
- Directory structure logical

---

## Common Pitfalls

1. **Overly broad descriptions** → Leads to false activations
2. **Missing activation triggers** → Skill never activates
3. **Monolithic SKILL.md** → Excessive token consumption
4. **Unclear code purpose** → Claude unsure whether to execute or reference
5. **Poor security practices** → Untrusted code execution
6. **No evaluation strategy** → Building without validating need
7. **Ignoring usage patterns** → Not iterating based on real behavior

---

## Validation Checklist

Use this checklist when reviewing skills:

**Structure:**
- [ ] SKILL.md file exists
- [ ] YAML frontmatter present and valid
- [ ] name and description fields specified
- [ ] Directory structure logical
- [ ] Referenced files exist

**Progressive Disclosure:**
- [ ] Core content in SKILL.md
- [ ] Extended content in separate files
- [ ] Clear references between files
- [ ] Token-efficient organization

**Quality:**
- [ ] Description is specific and clear
- [ ] Activation triggers identifiable
- [ ] Examples are concrete
- [ ] Instructions are actionable
- [ ] Security considerations addressed

**Development Process:**
- [ ] Built to address identified gaps
- [ ] Tested with representative tasks
- [ ] Iterated based on usage
- [ ] Captures successful approaches

---

## References

- **Primary Source:** Anthropic Engineering Blog - "Equipping agents for the real world with agent skills"
- **URL:** https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- **Last Fetched:** 2025-01-28

---

**Notes for skill-reviewer:**

When validating skills, prioritize:
1. YAML frontmatter correctness (critical)
2. Description specificity and clarity (critical)
3. Progressive disclosure implementation (major)
4. Security considerations (major)
5. Structural organization (major)
6. Documentation quality (minor)
