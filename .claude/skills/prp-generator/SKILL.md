---
name: prp-generator
description: This skill should be used when generating Product Requirement Prompts (PRPs) for software features. It provides templates, quality gates, and patterns for creating comprehensive, executable PRPs with acceptance criteria, technical design, and test requirements.
---

# PRP Generator

Generate comprehensive Product Requirement Prompts for software features with built-in quality gates and agent delegation strategies.

## Overview

This skill provides templates and patterns for creating Product Requirement Prompts (PRPs) that serve as executable contracts between intent and implementation. PRPs include:

- Feature summary with business value
- Current state analysis (discovered via codebase)
- Functional and non-functional requirements
- Technical design with components and database changes
- Acceptance criteria (testable)
- Test requirements (unit + integration)
- Quality gates (entry, implementation, exit)
- Agent delegation strategy

## When to Use This Skill

Use this skill when:
- Creating comprehensive requirement documents for features
- Need structured technical specifications with acceptance criteria
- Orchestrating multi-agent SDLC workflows
- Enforcing quality gates throughout development
- Generating implementation plans with test requirements

## PRP Structure Template

A complete PRP contains 8 core sections:

### 1. Feature Summary
```xml
<feature-summary>
  <title>{Feature Name}</title>
  <description>{Detailed description of what will be built}</description>
  <business-value>{Why this feature matters}</business-value>
  <complexity>{low|medium|high|complex}</complexity>
  <estimated-effort>{hours or story points}</estimated-effort>
</feature-summary>
```

### 2. Current State Analysis
```xml
<current-state-analysis>
  <existing-components>
    <component path="{file-path}" purpose="{what it does}"/>
  </existing-components>
  <dependencies>
    <dependency>{existing system or package}</dependency>
  </dependencies>
  <gaps>
    <gap>{what needs to be built}</gap>
  </gaps>
</current-state-analysis>
```

### 3. Requirements
```xml
<requirements>
  <functional>
    <requirement id="FR-1" priority="must-have">
      {User-facing functional requirement}
    </requirement>
  </functional>

  <non-functional>
    <requirement id="NFR-1" category="security|performance|reliability|usability">
      {System requirement}
    </requirement>
  </non-functional>
</requirements>
```

### 4. Technical Design
```xml
<technical-design>
  <components>
    <component name="{ComponentName}" type="model|service|controller|repository">
      <location>{file-path}</location>
      <responsibility>{what it does}</responsibility>
      <dependencies>
        <dependency>{IServiceName}</dependency>
      </dependencies>
    </component>
  </components>

  <database-changes>
    <migration name="{MigrationName}">
      <table name="{TableName}">
        <column>{ColumnName} ({type}, constraints)</column>
      </table>
      <index name="{IndexName}" columns="{columns}"/>
    </migration>
  </database-changes>

  <api-endpoints>
    <endpoint method="GET|POST|PUT|DELETE" path="/api/{path}">
      {Description}
    </endpoint>
  </api-endpoints>
</technical-design>
```

### 5. Acceptance Criteria
```xml
<acceptance-criteria>
  <criterion id="AC-1">
    {Testable success condition}
  </criterion>
</acceptance-criteria>
```

### 6. Test Requirements
```xml
<test-requirements>
  <unit-tests>
    <test>{Test scenario}</test>
  </unit-tests>

  <integration-tests>
    <test>{Integration test scenario}</test>
  </integration-tests>

  <coverage-target>{percentage}% minimum</coverage-target>
</test-requirements>
```

### 7. Quality Gates
```xml
<quality-gates>
  <entry-gate>
    <check>{PRP completeness check}</check>
  </entry-gate>

  <implementation-gate>
    <check>{Code quality check}</check>
  </implementation-gate>

  <exit-gate>
    <check>{Deployment readiness check}</check>
  </exit-gate>
</quality-gates>
```

### 8. Agent Delegation Strategy
```xml
<agent-delegation-strategy>
  <phase name="{PhaseName}">
    <agent>{agent-name}</agent>
    <responsibility>{What agent will do}</responsibility>
    <deliverable>{Expected output}</deliverable>
  </phase>
</agent-delegation-strategy>
```

---

## Template File Formats

> **Note on XML vs Markdown**: The XML examples above illustrate PRP section structure for educational purposes. The actual template files in the `templates/` directory are provided in **Markdown format with concrete examples** for practical use.

### Why Markdown Templates with Examples?

**Format Decision**:
- **Easier to Edit**: Markdown is more familiar to developers and has better tooling than XML
- **Immediate Learning Value**: Concrete examples demonstrate best practices by showing, not just describing structure
- **Faster Customization**: Modify a working example rather than filling 50+ abstract placeholders
- **Better Tooling**: VS Code, GitHub, and other tools render and edit Markdown beautifully
- **Industry Standard**: Most technical documentation and templates use Markdown

**Template Approach**:
- **Concrete Examples**: Each template shows a complete, realistic scenario (e.g., User Authentication Service)
- **C# 13/.NET 9 Specific**: Examples follow current best practices and standards
- **Customization Markers**: Sections marked with 💡 indicate where to customize for your needs
- **Learning Tool**: Templates teach by example, showing proper structure AND content

### How to Use Templates

1. **Choose the appropriate template** matching your PRP type:
   - `templates/service-prp.md` - Backend services and APIs
   - `templates/ui-prp.md` - User interfaces (Blazor, React)
   - `templates/infrastructure-prp.md` - DevOps, CI/CD, deployment
   - `templates/full-stack-prp.md` - Complete end-to-end features

2. **Review the concrete example** to understand:
   - Required sections and their purpose
   - Best practices for C# 13/.NET 9
   - How to structure requirements, tests, and acceptance criteria
   - Agent delegation patterns

3. **Customize sections marked with 💡** to match your specific requirements:
   - Replace example names (e.g., "User Authentication Service" → your service name)
   - Modify functional requirements
   - Update technical design file paths
   - Adjust quality gates and thresholds

4. **Reference pattern libraries** for reusable components:
   - `references/requirement-patterns.md` - 10 common requirement patterns (CRUD, Auth, Validation, Caching, etc.)
   - `references/test-patterns.md` - 10 testing scenario patterns (Unit tests, Integration tests, Performance tests, etc.)

5. **Validate your PRP** passes Entry Gate quality checks before implementation:
   - All sections complete
   - Requirements testable and measurable
   - Technical design specific (file paths, namespaces)
   - Agent delegation strategy defined

### Template vs XML Structure

The XML shown in sections above serves as a **conceptual reference** showing what information belongs in each PRP section. The Markdown templates provide the same structure but with:
- Real-world examples instead of `{placeholders}`
- Complete code snippets (not just structure)
- Concrete acceptance criteria (not abstract templates)
- Actual C# 13/.NET 9 implementations

**Example Comparison**:

**XML (Conceptual)**:
```xml
<feature-summary>
  <title>{Feature Name}</title>
  <description>{Detailed description}</description>
  <business-value>{Why this feature matters}</business-value>
</feature-summary>
```

**Markdown Template (Concrete)**:
```markdown
## Executive Summary

| Field | Value |
|-------|-------|
| **Service Name** | User Authentication Service |
| **Service Type** | Backend REST API Service |
| **Business Value** | Enables secure user access control across all client applications |

**Service Overview**: Provides JWT-based authentication with email/password login, token refresh capabilities, and secure password reset functionality...
```

The Markdown version teaches through a complete, working example that you can customize for your needs.

---

## PRP Generation Workflow

### Step 1: Codebase Discovery

Use Glob and Grep to discover existing components:

```bash
# Find models
**/Models/{FeatureArea}*.cs

# Find services
**/Services/*{FeatureArea}*.cs

# Find controllers
**/Controllers/*{FeatureArea}*.cs

# Search for interfaces
grep -r "interface I{FeatureArea}"

# Search for dependencies
grep -r "I{ServiceName}"
```

### Step 2: Analyze User Intent

Extract from user request:
- Core functionality needed
- Feature area (authentication, reporting, etc.)
- Constraints (must integrate with X, use existing Y)
- Business context (why is this needed)

### Step 3: Document Current State

Based on discovered files:
- List existing components with file paths
- Identify dependencies (packages, services, database)
- Document gaps (what doesn't exist yet)

### Step 4: Define Requirements

**Functional Requirements (FR-#):**
- User-facing capabilities
- System behavior
- Data operations
- Priority: must-have, should-have, nice-to-have

**Non-Functional Requirements (NFR-#):**
- Security (authentication, authorization, encryption)
- Performance (response time, throughput)
- Reliability (error handling, resilience)
- Usability (UX, accessibility)

### Step 5: Design Components

For each gap identified:
- Specify component name and type
- Define file location and namespace
- List dependencies
- Document responsibility

### Step 6: Define Acceptance Criteria

Make criteria testable and measurable:
- ✅ Good: "User submits email and receives 200 OK response"
- ❌ Bad: "Email functionality works"

### Step 7: Specify Tests

**Unit Tests:**
- Test each public method
- Test edge cases (null, empty, invalid input)
- Test error scenarios

**Integration Tests:**
- Test complete workflows
- Test API endpoints end-to-end
- Test database operations

### Step 8: Define Quality Gates

See `references/quality-gates.md` for complete checklists.

### Step 9: Plan Agent Delegation

Map PRP type to appropriate agents (see `references/agent-delegation-matrix.md`).

## PRP Types and Patterns

### Service/Backend PRP

**Agent Sequence:**
1. azure-architect - Architecture validation
2. database-engineer - Schema design
3. backend-developer - Implementation
4. security-specialist - Security audit
5. code-reviewer - Code quality
6. qa-engineer - Testing
7. technical-writer - Documentation

**Key Sections:**
- Database changes (migrations, indexes)
- API endpoints (REST/minimal API)
- Service layer (business logic)
- Repository layer (data access)

### UI/Frontend PRP

**Agent Sequence:**
1. frontend-developer - Component implementation
2. code-reviewer - Code quality
3. qa-engineer - UI/UX testing
4. technical-writer - Component documentation

**Key Sections:**
- Component structure
- State management
- API integration points
- Responsive design requirements

### Infrastructure/DevOps PRP

**Agent Sequence:**
1. azure-architect - Infrastructure design
2. azure-devops-engineer - Pipeline implementation
3. security-specialist - Security audit
4. qa-engineer - Pipeline testing
5. technical-writer - Runbook documentation

**Key Sections:**
- CI/CD pipeline configuration
- Environment strategy
- Infrastructure as code
- Deployment procedures

### Full-Stack Feature PRP

**Agent Sequence:**
1. azure-architect - System architecture
2. database-engineer - Data modeling
3. backend-developer - API layer
4. frontend-developer - UI layer
5. security-specialist - End-to-end security
6. code-reviewer - Full-stack review
7. qa-engineer - Integration testing
8. technical-writer - System documentation

**Key Sections:**
- All of the above (comprehensive)

## Quality Gates Reference

### Entry Gate: PRP Completeness

**Critical (must pass):**
- ✅ Feature summary includes title, description, business value
- ✅ Current state analysis references actual discovered files
- ✅ Functional requirements enumerated with IDs (FR-1, FR-2, etc.)
- ✅ Non-functional requirements cover security, performance, reliability
- ✅ Technical design specifies exact file paths and namespaces
- ✅ Acceptance criteria are testable (not vague)
- ✅ Test requirements include unit and integration scenarios
- ✅ Quality gates defined for entry, implementation, exit
- ✅ Agent delegation strategy covers all necessary phases

**Decision:**
- All critical checks must pass
- Document failures and request corrections if failed

### Implementation Gate: Code Quality

**Critical (must pass):**
- ✅ All components from technical design implemented
- ✅ Unit test coverage >= 85%
- ✅ No critical security vulnerabilities
- ✅ No blocking synchronous calls in async methods
- ✅ All public APIs have XML documentation
- ✅ Dependency injection properly configured
- ✅ Input validation at API boundary

**Major (should pass 85%):**
- ✅ SOLID principles followed
- ✅ C# 13/.NET 9 conventions used
- ✅ Structured logging with proper context
- ✅ Custom exceptions for domain errors
- ✅ No code duplication (DRY)
- ✅ Cyclomatic complexity <= 10 per method
- ✅ Integration tests cover acceptance criteria

### Exit Gate: Deployment Readiness

**Critical (must pass):**
- ✅ All acceptance criteria met and verified
- ✅ All tests passing (unit + integration)
- ✅ Database migrations tested (up and down)
- ✅ API documentation generated (OpenAPI/Swagger)
- ✅ No pending TODOs or workarounds
- ✅ Configuration externalized
- ✅ Deployment checklist completed

**Major (should pass 90%):**
- ✅ Feature documentation with usage examples
- ✅ Performance testing completed
- ✅ Security audit passed
- ✅ Accessibility requirements met (if UI)
- ✅ Error logging verified
- ✅ Rollback plan documented

## Examples

### Example 1: Generate Service PRP

**User Request:**
"Generate a PRP for user authentication service with JWT tokens"

**Skill Execution:**
1. Discovers existing components via Glob/Grep:
   - Found: `IUserRepository` in `src/Data/Repositories/`
   - Found: JWT library in `packages/` (Microsoft.IdentityModel.Tokens)
   - Missing: Authentication service, token generator
2. Selects template: `templates/service-prp.md`
3. Populates with authentication-specific content:
   - 8 functional requirements (login, logout, refresh, reset password, email verification, account lockout, MFA, session management)
   - 4 NFRs (security with bcrypt, performance <200ms, reliability with retry, usability)
   - Database schema: Users table with PasswordHash, Salt, EmailVerified, LockedUntil columns
   - 7-phase agent delegation: Phoenix → Riley → Jordan → Alex → Avery → Parker → Sage
4. Generates complete PRP with all 8 core sections

**Output:** `docs/PRPs/services/user-authentication-prp.md`
- 480+ lines of comprehensive requirements
- Ready for execution by prp-pro agent
- Entry gate validation passed

**Expected Result:**
```markdown
# Product Requirement Prompt - User Authentication Service

## Executive Summary
| Service Name | User Authentication Service |
| Business Value | Enables secure user access control across all client applications |
| Complexity | Medium |
| Estimated Effort | 32 hours (4 days) |

## Functional Requirements
- FR-1: User login with email/password (JWT response)
- FR-2: Token refresh with refresh token
- FR-3: Password reset via email
... (full PRP content)
```

---

### Example 2: Generate UI PRP

**User Request:**
"Create a dashboard component in Blazor with real-time updates and accessibility"

**Skill Execution:**
1. Discovers existing components:
   - Found: `MainLayout.razor`, SignalR hub infrastructure
   - Found: MudBlazor library installed
   - Missing: Dashboard.razor, MetricCard component
2. Selects template: `templates/ui-prp.md`
3. Populates with dashboard-specific content:
   - 3 functional requirements (metric cards, activity feed, chart)
   - 4 NFRs (performance <2s load, WCAG AA accessibility, responsive design, browser support)
   - Component structure: Dashboard → MetricCard → ActivityFeed → Chart
   - SignalR integration for real-time updates
   - 4-phase agent delegation: Taylor → Avery → Parker → Sage
4. Includes accessibility requirements (ARIA labels, keyboard navigation, screen reader support)

**Output:** `docs/PRPs/ui/dashboard-prp.md`
- Component hierarchy defined
- State management strategy (DashboardState.cs)
- bUnit test scenarios
- Responsive breakpoints specified

---

### Example 3: Generate Full-Stack PRP

**User Request:**
"Build order management system with database, API, and UI"

**Skill Execution:**
1. Discovers existing architecture:
   - Found: EF Core DbContext, existing Product and Customer entities
   - Found: Blazor app structure, API controllers pattern
   - Missing: Order entity, OrderRepository, API endpoints, UI components
2. Selects template: `templates/full-stack-prp.md`
3. Populates with comprehensive content:
   - Database: Orders + OrderItems tables with state machine (Pending → Processing → Shipped → Delivered)
   - Repository: OrderRepository with Unit of Work pattern
   - API: Minimal API endpoints for CRUD + search
   - UI: Blazor components with MudDataGrid
   - 9-phase agent delegation: Phoenix → Dakota → Riley → Jordan → Taylor → Alex → Avery → Parker → Sage
4. Includes all layers: Database → Repository → Service → API → UI
5. Defines E2E test scenarios with Playwright

**Output:** `docs/PRPs/features/order-management-prp.md`
- 600+ lines of comprehensive requirements
- Complete stack coverage
- Integration test scenarios
- Deployment checklist

---

## Best Practices

### Always Discover, Never Assume

Use Glob/Grep to find actual files, don't guess file locations or assume architecture.

### Make Criteria Testable

Every acceptance criterion should be verifiable through automated tests.

### Be Specific in Technical Design

Specify exact file paths, namespaces, method signatures - not "create a service".

### Include Non-Functional Requirements

Don't forget security, performance, reliability, and usability requirements.

### Plan for Testing

Define unit and integration test scenarios upfront, not after implementation.

### Map to Real Agents

Agent delegation strategy should reference actual available agents, not hypothetical ones.

## Templates Directory

- `templates/service-prp.md` - Backend service PRP template
- `templates/ui-prp.md` - Frontend UI PRP template
- `templates/infrastructure-prp.md` - DevOps/infrastructure PRP template
- `templates/full-stack-prp.md` - Complete full-stack feature PRP template

## References Directory

- `references/quality-gates.md` - Complete quality gate checklists
- `references/agent-delegation-matrix.md` - Agent selection guide
- `references/requirement-patterns.md` - Common requirement templates
- `references/test-patterns.md` - Test scenario templates

## Success Criteria

A PRP generation is successful when all of the following criteria are met:

### Structure Completeness
- ✅ All 8 core sections present:
  1. Feature Summary (title, description, business value, complexity, effort estimate)
  2. Current State Analysis (existing components, dependencies, gaps)
  3. Requirements (functional with IDs, non-functional with categories)
  4. Technical Design (components, database changes, API endpoints)
  5. Acceptance Criteria (testable conditions)
  6. Test Requirements (unit tests, integration tests, coverage target)
  7. Quality Gates (entry, implementation, exit)
  8. Agent Delegation Strategy (phases with agents, responsibilities, deliverables)
- ✅ Feature summary includes complexity rating (low/medium/high/complex)
- ✅ Current state analysis references actual discovered files (not assumptions)
- ✅ All sections follow template structure for PRP type

### Requirement Quality
- ✅ Functional requirements enumerated with sequential IDs (FR-1, FR-2, FR-3, ...)
- ✅ Each functional requirement has priority (must-have, should-have, nice-to-have)
- ✅ Non-functional requirements cover all 4 categories:
  - Security (authentication, authorization, encryption, input validation)
  - Performance (response time, throughput, concurrency)
  - Reliability (error handling, retry logic, circuit breakers)
  - Usability (UX, accessibility, internationalization)
- ✅ Each requirement is testable and measurable (not vague)
- ✅ Requirements map to acceptance criteria

### Technical Design Specificity
- ✅ Component names, types, and exact file paths specified (e.g., `src/Services/AuthService.cs`)
- ✅ Namespaces defined (e.g., `SchaabCore.Services.Authentication`)
- ✅ Database schema includes:
  - Table names
  - Column names with data types and constraints
  - Indexes with column specifications
  - Migration naming convention
- ✅ API endpoints specify:
  - HTTP method (GET, POST, PUT, DELETE, PATCH)
  - Full path (e.g., `/api/v1/auth/login`)
  - Request/response models
- ✅ Dependencies explicitly listed:
  - Interfaces (e.g., `IUserRepository`, `IJwtTokenGenerator`)
  - NuGet packages (e.g., `Microsoft.AspNetCore.Authentication.JwtBearer`)
  - External services (e.g., Azure Key Vault, SendGrid)

### Testing Adequacy
- ✅ Unit test scenarios defined for each public method
- ✅ Integration test scenarios cover end-to-end workflows
- ✅ Test scenarios include:
  - Happy path (success cases)
  - Edge cases (boundary values, empty inputs)
  - Error scenarios (invalid input, exceptions)
- ✅ Code coverage target specified (≥80% for services, ≥85% for critical paths)
- ✅ Test patterns match technology stack:
  - C# Backend: xUnit, Moq, FluentAssertions
  - Blazor UI: bUnit, Playwright (E2E)
  - API: WebApplicationFactory, integration tests

### Quality Gates Definition
- ✅ Entry gate checks PRP completeness before implementation starts:
  - All 8 sections complete
  - Requirements testable
  - Technical design specific
  - Agent delegation defined
- ✅ Implementation gate validates code quality during development:
  - Components implemented
  - Test coverage ≥ target
  - No critical security vulnerabilities
  - Code follows C# 13/.NET 9 conventions
- ✅ Exit gate confirms deployment readiness:
  - All acceptance criteria met
  - All tests passing
  - Documentation complete
  - Deployment checklist ready
- ✅ Pass criteria defined for each gate (critical vs major distinctions)

### Agent Delegation Correctness
- ✅ Agent sequence matches PRP type:
  - **Service/Backend**: Phoenix → Riley → Jordan → Alex → Avery → Parker → Sage (7 phases)
  - **UI/Frontend**: Taylor → Avery → Parker → Sage (4 phases)
  - **Infrastructure**: Phoenix → Morgan → Alex → Parker → Sage (5 phases)
  - **Full-Stack**: Phoenix → Dakota → Riley → Jordan → Taylor → Alex → Avery → Parker → Sage (9 phases)
- ✅ Each phase has:
  - Assigned agent from actual available agents (not hypothetical)
  - Clear responsibility (what agent will do)
  - Expected deliverable (output artifact)
- ✅ Agent names use actual personas (Jordan, Taylor, Phoenix, etc.)

### Output Quality
- ✅ PRP saved to appropriate directory:
  - Services: `docs/PRPs/services/`
  - UI: `docs/PRPs/ui/`
  - Infrastructure: `docs/PRPs/infrastructure/`
  - Full-Stack: `docs/PRPs/features/`
- ✅ Filename follows convention: `{feature-name}-prp.md`
- ✅ Markdown formatting valid and consistent:
  - Proper heading hierarchy (H1 → H2 → H3)
  - Code blocks properly fenced with language tags
  - Tables well-formatted
  - Lists properly structured
- ✅ No placeholders or TODO markers left in output
- ✅ File references use actual project paths (discovered via Glob/Grep)
- ✅ PRP passes Entry Gate validation before being marked complete

### Validation Checks
- ✅ No critical quality gate failures
- ✅ All referenced template files exist
- ✅ All referenced pattern libraries exist
- ✅ Agent delegation agents are all available (verified against `js-ai/agents/`)
- ✅ PRP ready for execution by prp-pro agent

---

## Notes

- PRPs are contracts between intent and implementation
- Quality gates are non-negotiable checkpoints
- Always validate PRP completeness before starting implementation
- Use discovered context, not assumptions
- PRPs work with prp-pro agent for SDLC orchestration
