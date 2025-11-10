# Quick Start Guide - CloudManager Skills

## 🚀 Getting Started in 5 Minutes

### Prerequisites

Install required tools:
```bash
# Install jq for JSON parsing
sudo apt-get update && sudo apt-get install -y jq

# Install reportgenerator for test coverage (optional)
dotnet tool install -g dotnet-reportgenerator-globaltool
```

---

## 📝 Skill 1: story-tracker

### Create tracking file for your current story

```bash
# Navigate to skill directory
cd /home/user/CloudManager/.claude/skills/story-tracker

# Create tracking file (auto-detects story file)
./scripts/create-tracking-file.sh 1350

# Or specify story file explicitly
./scripts/create-tracking-file.sh 1350 docs/stories/devops/1350-Export-Users.md
```

**Output:** Creates `docs/stories/devops/1350-implementation-tracking.md`

### Update progress as you work

```bash
# After making changes, track git files
./scripts/track-git-changes.sh 1350
```

**What it does:** Automatically updates the "Files Modified" section with categorized git changes

---

## 🧪 Skill 2: test-suite-builder

### Analyze your code

```bash
# Navigate to skill directory
cd /home/user/CloudManager/.claude/skills/test-suite-builder

# Analyze a service file
./scripts/analyze-code.sh src/Fyi.Cloud.Manager.Services/Services/TenantService.cs
```

**Output:** JSON report with class info, dependencies, methods, and test recommendations

### Generate unit tests

```bash
# Generate tests for a service
./scripts/generate-tests.sh src/Fyi.Cloud.Manager.Services/Services/TenantService.cs unit

# Run the generated tests
./scripts/run-tests.sh --project tests/Fyi.Cloud.Manager.Services.Tests
```

**Output:** Creates `tests/Fyi.Cloud.Manager.Services.Tests/TenantServiceTests.cs`

### Run tests with coverage

```bash
# Generate coverage report
./scripts/run-tests.sh --coverage

# View report
open TestResults/CoverageReport/index.html
```

---

## 🎨 Skill 3: blazor-telerik-scaffold

### Generate a complete CRUD page

```bash
# Navigate to skill directory
cd /home/user/CloudManager/.claude/skills/blazor-telerik-scaffold

# Generate CRUD page for an entity
./scripts/generate-component.sh crud-page Product

# With multi-tenant support
./scripts/generate-component.sh crud-page Tenant --multi-tenant
```

**Output:** Creates complete CRUD page with Grid, Dialog, and Form

### Generate individual components

```bash
# Grid only
./scripts/generate-component.sh grid User

# Dialog only
./scripts/generate-component.sh dialog User

# Form only
./scripts/generate-component.sh form User
```

---

## 🔥 Real-World Workflow Example

### Scenario: Implementing Story 1350 (Export Users Feature)

```bash
# 1. Create story tracking file
cd /home/user/CloudManager/.claude/skills/story-tracker
./scripts/create-tracking-file.sh 1350

# 2. Generate the service tests first (TDD approach)
cd /home/user/CloudManager/.claude/skills/test-suite-builder
./scripts/generate-tests.sh src/Fyi.Cloud.Manager.Services/Services/UserExportService.cs unit

# 3. Implement the service
# ... write your service code ...

# 4. Run tests to verify
./scripts/run-tests.sh --project tests/Fyi.Cloud.Manager.Services.Tests --filter "UserExportService"

# 5. Generate the UI components
cd /home/user/CloudManager/.claude/skills/blazor-telerik-scaffold
./scripts/generate-component.sh crud-page UserExport --multi-tenant

# 6. Track your progress
cd /home/user/CloudManager/.claude/skills/story-tracker
./scripts/track-git-changes.sh 1350

# 7. Generate final coverage report
cd /home/user/CloudManager/.claude/skills/test-suite-builder
./scripts/run-tests.sh --coverage
```

---

## 📚 Common Commands Reference

### story-tracker
| Command | Description |
|---------|-------------|
| `./scripts/create-tracking-file.sh <story-number>` | Create tracking file |
| `./scripts/track-git-changes.sh <story-number>` | Update file tracking |
| `./scripts/parse-story.sh <story-file>` | Extract story info |

### test-suite-builder
| Command | Description |
|---------|-------------|
| `./scripts/analyze-code.sh <file>` | Analyze source file |
| `./scripts/generate-tests.sh <file> unit` | Generate unit tests |
| `./scripts/generate-tests.sh <file> integration` | Generate integration tests |
| `./scripts/run-tests.sh --coverage` | Run with coverage |
| `./scripts/run-tests.sh --watch` | Run in watch mode |

### blazor-telerik-scaffold
| Command | Description |
|---------|-------------|
| `./scripts/generate-component.sh crud-page <entity>` | Full CRUD page |
| `./scripts/generate-component.sh grid <entity>` | Grid component |
| `./scripts/generate-component.sh dialog <entity>` | Dialog component |
| `./scripts/generate-component.sh form <entity>` | Form component |

---

## 🎯 Pro Tips

### Tip 1: Use with Claude Code
Claude Code can automatically invoke these skills when you ask:
```
"Generate unit tests for TenantService"
"Create tracking file for story 1350"
"Create a CRUD page for managing products"
```

### Tip 2: Chain Commands
Create aliases for common workflows:
```bash
# Add to ~/.bashrc
alias track-story='cd /home/user/CloudManager/.claude/skills/story-tracker && ./scripts/track-git-changes.sh'
alias gen-tests='cd /home/user/CloudManager/.claude/skills/test-suite-builder && ./scripts/generate-tests.sh'
alias scaffold-ui='cd /home/user/CloudManager/.claude/skills/blazor-telerik-scaffold && ./scripts/generate-component.sh'
```

Then use:
```bash
track-story 1350
gen-tests src/Fyi.Cloud.Manager.Services/Services/MyService.cs unit
scaffold-ui crud-page MyEntity --multi-tenant
```

### Tip 3: Review Before Using
Always review generated code before using in production:
- Unit tests may need specific assertions
- Tracking files may need custom phases
- UI components may need styling tweaks

### Tip 4: Customize Configs
Edit config files to match your specific needs:
```bash
# Edit test patterns
nano /home/user/CloudManager/.claude/skills/test-suite-builder/config/test-patterns.json

# Edit tracking template
nano /home/user/CloudManager/.claude/skills/story-tracker/config/tracking-template.json

# Edit component patterns
nano /home/user/CloudManager/.claude/skills/blazor-telerik-scaffold/config/component-patterns.json
```

---

## 🆘 Troubleshooting

### Scripts not executable
```bash
cd /home/user/CloudManager/.claude/skills
chmod +x */scripts/*.sh
```

### jq command not found
```bash
sudo apt-get update && sudo apt-get install -y jq
```

### Tests fail to generate
1. Check that source file exists
2. Verify test project exists in solution
3. Check namespace in source file
4. Review script output for errors

### UI component fails to generate
1. Verify entity name is PascalCase
2. Check that output directory exists
3. Ensure namespace matches CloudManager structure

---

## 📖 Full Documentation

- [Complete README](.claude/skills/README.md)
- [test-suite-builder docs](.claude/skills/test-suite-builder/skill.md)
- [story-tracker docs](.claude/skills/story-tracker/skill.md)
- [blazor-telerik-scaffold docs](.claude/skills/blazor-telerik-scaffold/skill.md)

---

**Ready to accelerate your development? Pick a skill and try it now! 🚀**
