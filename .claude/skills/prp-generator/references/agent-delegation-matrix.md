# Agent Delegation Matrix

Guide for selecting and sequencing agents based on PRP type.

## PRP Type Classification

### Service/Backend PRP
**Indicators:**
- API endpoints
- Business logic services
- Data access repositories
- Database schema changes
- Background jobs/workers

### UI/Frontend PRP
**Indicators:**
- User interface components
- Pages/views
- Client-side state management
- User interactions
- Visual design requirements

### Infrastructure/DevOps PRP
**Indicators:**
- CI/CD pipelines
- Deployment automation
- Infrastructure provisioning
- Environment configuration
- Monitoring/logging setup

### Data/Analytics PRP
**Indicators:**
- Data pipelines
- ETL processes
- Reporting dashboards
- Data modeling
- Analytics queries

### Full-Stack Feature PRP
**Indicators:**
- End-to-end feature
- Both API and UI
- Database + backend + frontend
- Complete user journey

---

## Service/Backend PRP Agent Sequence

**Example**: "Add password reset functionality"

### Phase 1: Architecture (Optional for simple features)
**Agent**: `azure-architect`
**Deliverable**: Architecture validation report
**When to include**: Medium-to-high complexity, scalability concerns, new architectural patterns

### Phase 2: Database Design
**Agent**: `database-engineer`
**Deliverable**: EF Core migration scripts and schema documentation
**When to include**: Any database schema changes required

### Phase 3: API Design (Optional)
**Agent**: `api-designer`
**Deliverable**: OpenAPI specification and endpoint design
**When to include**: New API endpoints or significant endpoint changes

### Phase 4: Backend Implementation
**Agent**: `backend-developer`
**Deliverable**: Complete C# implementation with unit tests
**When to include**: Always (core implementation phase)

### Phase 5: Security Review
**Agent**: `security-specialist`
**Deliverable**: Security audit report
**When to include**: Always for production features

### Phase 6: Code Review
**Agent**: `code-reviewer`
**Deliverable**: Code quality review report
**When to include**: Always (quality gate enforcement)

### Phase 7: QA Testing
**Agent**: `qa-engineer`
**Deliverable**: Integration test results and AC validation
**When to include**: Always for production features

### Phase 8: Documentation
**Agent**: `technical-writer`
**Deliverable**: API documentation and usage guides
**When to include**: Always for user-facing features

---

## UI/Frontend PRP Agent Sequence

**Example**: "Create dashboard for user analytics"

### Phase 1: UX Design (Optional)
**Agent**: `ux-expert`
**Deliverable**: Wireframes and interaction patterns
**When to include**: New UI patterns, complex interactions, user research needed

### Phase 2: Frontend Implementation
**Agent**: `frontend-developer`
**Deliverable**: UI components with tests
**When to include**: Always (core implementation phase)

### Phase 3: Code Review
**Agent**: `code-reviewer`
**Deliverable**: Code quality and performance review
**When to include**: Always (quality gate enforcement)

### Phase 4: QA Testing
**Agent**: `qa-engineer`
**Deliverable**: UI/UX testing and cross-browser validation
**When to include**: Always for production features

### Phase 5: Documentation
**Agent**: `technical-writer`
**Deliverable**: Component documentation and user guides
**When to include**: Always for reusable components

---

## Infrastructure/DevOps PRP Agent Sequence

**Example**: "Set up CI/CD pipeline for automated deployments"

### Phase 1: Infrastructure Architecture
**Agent**: `azure-architect`
**Deliverable**: Pipeline architecture and environment strategy
**When to include**: Always for infrastructure changes

### Phase 2: DevOps Implementation
**Agent**: `azure-devops-engineer`
**Deliverable**: Pipeline YAML, IaC scripts, deployment automation
**When to include**: Always (core implementation phase)

### Phase 3: Security Review
**Agent**: `security-specialist`
**Deliverable**: Pipeline security audit and secret management review
**When to include**: Always for production pipelines

### Phase 4: QA Testing
**Agent**: `qa-engineer`
**Deliverable**: Pipeline testing and deployment verification
**When to include**: Always (validate deployments work)

### Phase 5: Documentation
**Agent**: `technical-writer`
**Deliverable**: Runbook and pipeline documentation
**When to include**: Always (operations must understand pipeline)

---

## Full-Stack Feature PRP Agent Sequence

**Example**: "Build order management system with admin UI"

### Phase 1: System Architecture
**Agent**: `azure-architect`
**Deliverable**: End-to-end system architecture
**When to include**: Always for full-stack features

### Phase 2: Database Design
**Agent**: `database-engineer`
**Deliverable**: Complete data model and migrations
**When to include**: Always (data is foundation)

### Phase 3: Backend Implementation
**Agent**: `backend-developer`
**Deliverable**: Services, repositories, API endpoints with tests
**When to include**: Always (API layer)

### Phase 4: Frontend Implementation
**Agent**: `frontend-developer`
**Deliverable**: UI components and pages with tests
**When to include**: Always (UI layer)

### Phase 5: Security Review
**Agent**: `security-specialist`
**Deliverable**: End-to-end security audit
**When to include**: Always for production features

### Phase 6: Code Review
**Agent**: `code-reviewer`
**Deliverable**: Full-stack code review
**When to include**: Always (quality gate enforcement)

### Phase 7: QA Testing
**Agent**: `qa-engineer`
**Deliverable**: Integration and E2E testing
**When to include**: Always (validate complete workflows)

### Phase 8: Documentation
**Agent**: `technical-writer`
**Deliverable**: System docs, API docs, user guides
**When to include**: Always for user-facing systems

---

## Agent Selection Decision Tree

### Question 1: Does this PRP involve database changes?
- **YES** → Include `database-engineer` in Phase 2
- **NO** → Skip to implementation phase

### Question 2: Does this PRP involve UI components?
- **YES** → Include `frontend-developer`
- **NO** → Backend-only workflow

### Question 3: Is this a new architectural pattern?
- **YES** → Include `azure-architect` in Phase 1
- **NO** → Start with design/implementation

### Question 4: Does this PRP involve infrastructure/deployment changes?
- **YES** → Include `azure-devops-engineer`
- **NO** → Standard application workflow

### Question 5: Is this a production feature?
- **YES** → Always include: security-specialist, code-reviewer, qa-engineer
- **NO** → Can skip security/QA for POCs

### Question 6: Is this user-facing?
- **YES** → Always include `technical-writer` for documentation
- **NO** → Internal documentation may be sufficient

---

## Specialized Agent Use Cases

### API-Focused Features
- `api-designer` - REST API design, OpenAPI specs
- `backend-developer` - Minimal API or controller implementation
- `technical-writer` - API documentation

### Data Pipeline Features
- `data-architect` - Data modeling and pipeline architecture
- `database-engineer` - Schema design and optimization
- `backend-developer` - ETL implementation

### Authentication/Authorization Features
- `security-specialist` - Security design (required in Phase 1)
- `backend-developer` - Auth implementation
- `code-reviewer` - Security-focused review

### Performance-Critical Features
- `azure-architect` - Scalability and caching strategy
- `backend-developer` - Optimized implementation
- `qa-engineer` - Load testing

### Compliance Features
- `security-specialist` - Compliance audit (GDPR, SOC 2, etc.)
- `technical-writer` - Compliance documentation

---

## Parallel vs Sequential Agent Delegation

### Parallel Delegation (Faster)

Can run in parallel when agents work on independent deliverables:

```
Phase 2 (Parallel):
├── database-engineer → Schema design
└── api-designer → API specification

Phase 4 (Parallel):
├── backend-developer → API implementation
└── frontend-developer → UI implementation
```

### Sequential Delegation (Dependencies)

Must run sequentially when deliverables depend on each other:

```
Phase 1: azure-architect
  ↓ (architecture informs database design)
Phase 2: database-engineer
  ↓ (schema needed for backend)
Phase 3: backend-developer
  ↓ (API needed for frontend)
Phase 4: frontend-developer
```

---

## Agent Delegation Best Practices

### 1. Provide Complete Context

Each agent needs:
- Full PRP document
- Relevant section of technical design
- Outputs from previous phases
- Quality gate criteria

### 2. Set Clear Expectations

Define deliverables explicitly:
- ✅ Good: "EF Core migration file with indexes for password reset tokens table"
- ❌ Bad: "Database changes"

### 3. Monitor Execution

Track agent progress:
- Start time
- Estimated duration
- Current status
- Blockers/issues

### 4. Validate Deliverables

Check agent outputs against requirements:
- Did they deliver what was requested?
- Does it meet quality standards?
- Is it ready for next phase?

### 5. Handle Failures Gracefully

If agent fails:
1. Identify failure reason
2. Determine if blocking
3. Retry with alternative agent if available
4. Escalate to user if unrecoverable

---

## Custom Delegation Strategies

For unique PRP types, create custom strategies:

1. Identify required expertise areas
2. Map to available agents
3. Determine dependencies
4. Create phase sequence
5. Define deliverables per phase
6. Set quality gates between phases

Example custom strategy for "Mobile App Backend":
1. `azure-architect` - Mobile-specific architecture (push notifications, offline sync)
2. `database-engineer` - Mobile-optimized schema
3. `api-designer` - Mobile API conventions (versioning, payload size)
4. `backend-developer` - Implementation
5. `security-specialist` - Mobile security audit
6. `technical-writer` - Mobile API docs

---

## Minimum Viable Agent Set

For rapid prototyping or POCs, minimum agent set:

1. `backend-developer` OR `frontend-developer` (implementation)
2. `code-reviewer` (basic quality check)

This skip security, QA, and architecture review should only be used for non-production code.

For production features, always include at minimum:
1. Implementation agent (backend/frontend)
2. `security-specialist` (security review)
3. `code-reviewer` (quality review)
4. `qa-engineer` (testing)
5. `technical-writer` (documentation)
