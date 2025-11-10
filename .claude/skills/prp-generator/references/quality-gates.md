# Quality Gates Reference

Complete checklists for PRP quality gate validation.

## Entry Gate: PRP Completeness

**Purpose**: Ensure PRP is comprehensive and actionable before starting implementation.

### Critical Checks (must pass all)

- [ ] Feature summary includes title, description, and business value
- [ ] Current state analysis references actual files (Glob/Grep verified)
- [ ] Functional requirements are enumerated with IDs (FR-1, FR-2, etc.)
- [ ] Non-functional requirements cover security, performance, reliability
- [ ] Technical design specifies exact file paths and namespaces
- [ ] Acceptance criteria are testable and measurable
- [ ] Test requirements include both unit and integration test scenarios
- [ ] Quality gates defined for entry, implementation, and exit phases
- [ ] Agent delegation strategy covers all necessary implementation phases

### Major Checks (should pass 80%)

- [ ] Database changes include indexes and constraints (if applicable)
- [ ] API endpoints follow REST/minimal API conventions
- [ ] Dependencies are documented with version requirements
- [ ] Error scenarios are addressed in acceptance criteria
- [ ] Effort estimation is realistic based on complexity
- [ ] Component dependencies are fully mapped
- [ ] Data migration strategy documented (if schema changes)

### Gate Decision

**PASS if:**
- All critical checks pass
- At least 80% of major checks pass

**FAIL if:**
- Any critical check fails
- Less than 80% of major checks pass

**On failure:**
1. Document specific failures
2. Provide remediation guidance
3. Request additional information from user
4. Re-validate after corrections

---

## Implementation Gate: Code Quality

**Purpose**: Ensure implementation meets enterprise standards and requirements.

### Critical Checks (must pass all)

- [ ] All components from technical design are implemented
- [ ] Unit test coverage >= 85%
- [ ] No critical security vulnerabilities (SQL injection, XSS, secrets in code)
- [ ] No blocking synchronous calls in async methods (proper await usage)
- [ ] All public APIs have XML documentation comments
- [ ] Dependency injection properly configured in Program.cs
- [ ] Input validation implemented at API boundary
- [ ] All functional requirements (FR-#) implemented

### Major Checks (should pass 85%)

- [ ] Code follows SOLID principles (SRP, OCP, LSP, ISP, DIP)
- [ ] C# 13/.NET 9 conventions used (file-scoped namespaces, nullable reference types)
- [ ] Structured logging with proper context throughout
- [ ] Error handling uses custom exceptions with proper HTTP status codes
- [ ] No code duplication (DRY principle followed)
- [ ] Cyclomatic complexity <= 10 per method
- [ ] Integration tests cover all acceptance criteria
- [ ] Repository pattern properly implemented (if data access)
- [ ] Async/await used correctly throughout
- [ ] No hardcoded values (configuration externalized)

### Automated Checks

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Code coverage >= 85% measured
- [ ] Static analysis (Roslyn analyzers) passing
- [ ] No compiler warnings
- [ ] Build succeeds on clean checkout

### Manual Reviews Required

- [ ] Security review by security-specialist agent
- [ ] Code review by code-reviewer agent
- [ ] Performance review (no N+1 queries, proper caching)
- [ ] Database review (migrations tested up and down)

### Gate Decision

**PASS if:**
- All critical checks pass
- At least 85% of major checks pass
- All automated checks pass
- All manual reviews approved

**FAIL if:**
- Any critical check fails
- Less than 85% of major checks pass
- Any automated check fails
- Any manual review reports critical issues

**On failure:**
1. Generate detailed failure report with specific issues
2. Categorize issues by severity (critical, major, minor)
3. Block merge/deployment
4. Delegate fixes to appropriate agent
5. Re-run all checks after fixes
6. Maximum 3 remediation attempts

---

## Exit Gate: Deployment Readiness

**Purpose**: Ensure feature is production-ready and fully documented.

### Critical Checks (must pass all)

- [ ] All acceptance criteria met and verified through tests
- [ ] All tests passing (unit + integration + E2E if applicable)
- [ ] Database migrations tested both up and down
- [ ] API documentation generated (Swagger/OpenAPI)
- [ ] No pending TODOs or FIXMEs in production code
- [ ] All configuration externalized (no hardcoded values)
- [ ] Deployment checklist completed
- [ ] Feature can be deployed independently
- [ ] Rollback procedure documented and tested

### Major Checks (should pass 90%)

- [ ] Feature documentation written with usage examples
- [ ] API documentation includes request/response examples
- [ ] Performance testing completed (no regression)
- [ ] Security audit passed with no major findings
- [ ] Accessibility requirements met (WCAG 2.1 Level AA if UI)
- [ ] Error logging verified in all non-happy-path scenarios
- [ ] Monitoring/alerting configured for key metrics
- [ ] Load testing completed (if high-traffic feature)
- [ ] Browser compatibility tested (if UI feature)
- [ ] Mobile responsiveness verified (if applicable)

### Documentation Requirements

- [ ] README/feature documentation exists
- [ ] Usage examples provided
- [ ] Configuration guide documented
- [ ] Known limitations documented
- [ ] Deployment procedure documented
- [ ] Troubleshooting guide included

### Deployment Checklist

- [ ] Database migrations scripted and tested
- [ ] Configuration changes documented
- [ ] Environment variables configured
- [ ] Secrets management verified
- [ ] Monitoring dashboards created
- [ ] Alerts configured for errors/performance
- [ ] Smoke test procedure defined
- [ ] Rollback procedure validated

### Gate Decision

**PASS if:**
- All critical checks pass
- At least 90% of major checks pass
- Documentation complete
- Deployment checklist complete

**FAIL if:**
- Any critical check fails
- Less than 90% of major checks pass
- Documentation incomplete
- Deployment procedure unclear

**On failure:**
1. Block deployment
2. Document missing items
3. Assign remediation to appropriate agents
4. Re-validate after completion
5. Final approval required from prp-pro or coordinator

---

## Quality Gate Validation Process

### 1. Entry Gate Validation

**When**: After PRP generation, before SDLC workflow starts
**Who**: prp-pro agent
**How**:
- Review PRP sections for completeness
- Verify discovered files exist (Glob/Grep validation)
- Check requirements are testable
- Validate agent delegation strategy

### 2. Implementation Gate Validation

**When**: After implementation complete, before merging
**Who**: prp-pro orchestrates multiple agents
**How**:
- Run automated checks (tests, coverage, build)
- Delegate to security-specialist for security audit
- Delegate to code-reviewer for quality review
- Aggregate results and make gate decision

### 3. Exit Gate Validation

**When**: After QA complete, before production deployment
**Who**: prp-pro with technical-writer support
**How**:
- Verify all acceptance criteria met
- Review documentation completeness
- Validate deployment checklist
- Final approval sign-off

---

## Gate Failure Response

### Critical Failure

**Actions:**
1. Stop workflow immediately
2. Generate detailed failure report
3. Notify user with severity: CRITICAL
4. Document root cause
5. Assign remediation to appropriate agent
6. Re-validate after fixes (max 3 attempts)

### Major Failure

**Actions:**
1. Continue with caution flag
2. Document all major issues
3. Notify user with severity: MAJOR
4. Recommend fixes but allow user decision
5. Log risk acceptance if user proceeds

### Minor Failure

**Actions:**
1. Document for improvement
2. Continue workflow
3. Include in final summary as "Technical Debt"
4. Create backlog item for future fix

---

## Quality Metrics

Track these metrics per PRP:
- Entry gate: Pass/Fail ratio
- Implementation gate: Attempts until pass
- Exit gate: Days from start to deployment-ready
- Total remediation cycles
- Test coverage percentage
- Security findings count
- Code review iterations

Use metrics to improve PRP quality and workflow efficiency.
