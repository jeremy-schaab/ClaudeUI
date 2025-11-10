---
name: playwright-test-builder
description: This skill should be used when users need to setup Playwright test environments and generate automated UI tests for Blazor web applications. Use for end-to-end test creation, test environment configuration, analyzing existing documentation to inform test strategies, or when users mention "Playwright", "UI tests", "E2E tests", "automated tests", "test Blazor app", or "browser automation".
---

# Playwright Test Builder

## Purpose

This skill provides comprehensive guidance for setting up Playwright test environments and generating automated UI tests for Blazor web applications. It analyzes existing application documentation and structure to create intelligent, maintainable test suites that follow best practices for end-to-end browser automation.

## When to Use

Activate this skill when:
- Setting up a new Playwright test environment for a project
- Generating automated UI tests for Blazor Server or Blazor WebAssembly applications
- Analyzing web application structure to determine test coverage needs
- Creating test suites for specific pages, components, or user workflows
- Migrating from other testing frameworks to Playwright
- Troubleshooting existing Playwright test configurations
- Implementing CI/CD integration for Playwright tests

## Core Capabilities

### 1. Environment Setup
- Detect existing Playwright configuration or initialize new setup
- Install Playwright dependencies and browsers
- Configure test project structure following .NET conventions
- Set up test discovery and execution patterns
- Configure environment-specific settings (dev, staging, prod)

### 2. Test Generation
- Analyze Blazor application structure (pages, components, routing)
- Generate page object models for maintainability
- Create test fixtures with proper setup/teardown
- Implement authentication and authorization test patterns
- Generate tests for forms, navigation, and data interactions
- Handle Blazor-specific scenarios (SignalR, component lifecycle)

### 3. Documentation Analysis
- Parse existing documentation (README, guides, API docs)
- Extract test scenarios from user stories or requirements
- Identify critical user workflows requiring coverage
- Map application features to test cases
- Discover authentication flows and data dependencies

## Workflow

### Initial Assessment

1. **Detect Project Type**
   - Check for existing Playwright configuration (`playwright.config.ts`, `playwright.config.js`)
   - Identify .NET solution structure and test project location
   - Determine Blazor hosting model (Server, WebAssembly, or Hybrid)
   - Locate application entry points and routing configuration

2. **Gather Context**
   - Search for documentation files: `docs/**/*.md`, `README.md`, `TESTING.md`
   - Analyze Blazor pages: `Pages/**/*.razor`, `Components/**/*.razor`
   - Review routing: `App.razor`, route attributes
   - Check authentication setup: `Program.cs`, identity configuration
   - Identify data models and API endpoints

3. **Analyze Requirements**
   - Read provided documentation to understand application purpose
   - Extract test scenarios from guides and specifications
   - Identify critical paths (authentication, CRUD operations, navigation)
   - Determine data setup requirements (seeding, mocking, test databases)

### Environment Setup

Execute the setup script to configure Playwright:

```bash
python scripts/setup_playwright.py --project-path <path-to-solution> --test-project <test-project-name>
```

The script will:
1. Check for existing Playwright configuration
2. Install `Microsoft.Playwright` NuGet package if needed
3. Install Playwright browsers (`pwsh bin/Debug/net9.0/playwright.ps1 install`)
4. Create initial test project structure if needed
5. Generate `playwright.config.ts` with .NET-friendly defaults
6. Set up test discovery patterns

**Configuration Options:**
- `--project-path`: Path to .NET solution directory
- `--test-project`: Name of test project (default: `{SolutionName}.PlaywrightTests`)
- `--blazor-url`: Base URL for Blazor application (default: `https://localhost:5001`)
- `--headless`: Run tests in headless mode (default: `true`)
- `--browsers`: Browsers to install (default: `chromium,firefox,webkit`)

### Test Generation

#### Page Object Models

Generate page objects for maintainability and reusability:

```bash
python scripts/generate_page_objects.py --pages <page-paths> --output <output-directory>
```

Example:
```bash
python scripts/generate_page_objects.py --pages "Pages/Login.razor,Pages/Dashboard.razor" --output "Tests/PageObjects"
```

Page objects encapsulate:
- Locator strategies (prefer `data-testid`, then `role`, then CSS)
- Navigation methods
- Interaction methods (fill forms, click buttons, etc.)
- Assertion helpers
- Blazor-specific waits (component rendering, SignalR updates)

#### Test Case Generation

Generate test cases from page analysis:

```bash
python scripts/generate_tests.py --pages <page-paths> --scenarios <scenario-file> --output <output-directory>
```

**Test Categories:**
1. **Navigation Tests**: Verify routing and page transitions
2. **Authentication Tests**: Login, logout, authorization checks
3. **Form Tests**: Input validation, submission, error handling
4. **Data Tests**: CRUD operations, filtering, sorting, pagination
5. **Component Tests**: Interactive component behavior
6. **Integration Tests**: End-to-end user workflows

**Blazor-Specific Patterns:**
- Wait for Blazor to finish rendering: `await page.WaitForLoadStateAsync(LoadState.NetworkIdle)`
- Handle component updates: `await page.WaitForSelectorAsync("[data-blazor-loaded]")`
- Test SignalR reconnection: Simulate network interruption and verify reconnect
- Validate client-side routing: Check URL and component state after navigation

### Documentation-Driven Test Creation

When user provides documentation or guides:

1. **Analyze Documentation**
   - Manually review markdown documentation
   - Extract user stories, acceptance criteria, and examples
   - Identify test scenarios and expected behaviors

2. **Generate Tests from Analysis**
   - Use insights to inform `generate_tests.py` parameters
   - Map scenarios to page objects and test cases
   - Include scenario descriptions in test names and comments

### Running Tests

Execute tests using standard Playwright commands:

```bash
# Run all tests
dotnet test

# Run specific test file
dotnet test --filter "FullyQualifiedName~LoginTests"

# Run with headed browser for debugging
dotnet test -- Playwright.LaunchOptions.Headless=false

# Run with specific browser
dotnet test -- Playwright.BrowserType=firefox

# Generate HTML report
dotnet test -- Playwright.Reporter=html
```

### CI/CD Integration

For CI/CD integration, configure your pipeline to:
- Install .NET SDK and Python
- Run `python scripts/setup_playwright.py` to install Playwright and browsers
- Execute `dotnet test` in the test project directory
- Upload test reports and screenshots as artifacts
- Implement retry logic for flaky tests (use `--retry` flag)
- Configure parallel execution using `--parallel` flag or test runners

## Bundled Resources

### Scripts

#### `scripts/setup_playwright.py`
Automated Playwright environment setup for .NET projects. Detects existing configuration, installs dependencies, and creates initial test project structure.

**Usage:**
```bash
python scripts/setup_playwright.py --project-path <path> --test-project <name>
```

#### `scripts/generate_page_objects.py`
Analyzes Blazor Razor files and generates strongly-typed page object models with locators and interaction methods.

**Usage:**
```bash
python scripts/generate_page_objects.py --pages <page-paths> --output <output-dir>
```

#### `scripts/generate_tests.py`
Generates test cases based on page objects and optional scenario definitions. Creates tests following AAA pattern with proper setup/teardown.

**Usage:**
```bash
python scripts/generate_tests.py --pages <page-paths> --types <test-types> --output <output-dir>
```

### References

#### `references/blazor-testing-guide.md`
Blazor-specific testing patterns:
- Component lifecycle and rendering waits
- SignalR connection testing and reconnection scenarios
- Client-side routing validation
- Prerendering considerations
- JavaScript interop testing
- Blazor WebAssembly vs Server differences in testing

Load this reference when encountering Blazor-specific challenges or optimizing test reliability.

## Best Practices

### Test Structure
- Follow AAA pattern (Arrange, Act, Assert) consistently
- Use descriptive test names: `[Feature]_[Scenario]_[ExpectedResult]`
- Keep tests independent: each test should set up and tear down its own state
- Use page objects to separate locators from test logic
- Group related tests in classes with shared fixtures

### Locator Strategy Priority
1. **Accessibility attributes**: `role`, `aria-label`, `alt`
2. **Data test IDs**: `data-testid` attributes added to Blazor components
3. **Semantic HTML**: Use semantic tags when available
4. **CSS selectors**: Last resort, prefer stable class names

### Waiting Strategies
- Prefer explicit waits: `WaitForSelectorAsync`, `WaitForLoadStateAsync`
- Avoid fixed timeouts: `Task.Delay` indicates flaky test design
- Use Playwright's auto-waiting for most interactions
- Handle Blazor rendering: Wait for `NetworkIdle` or custom indicators

### Test Data Management
- Use test fixtures for complex setup
- Implement database seeding for integration tests
- Reset state between tests (database cleanup, cache clearing)
- Use factory patterns for creating test data

### CI/CD Optimization
- Run tests in parallel when possible
- Use browser-specific jobs for matrix builds
- Capture artifacts (screenshots, videos) only on failure
- Implement smart test selection (run affected tests first)
- Use Docker containers for consistent environments

## Troubleshooting

### Common Issues

**Playwright browsers not installed:**
```bash
pwsh bin/Debug/net9.0/playwright.ps1 install
```

**Tests timing out:**
- Increase timeout in `playwright.config.ts`
- Check for missing waits after navigation or interactions
- Verify application is running and accessible

**Flaky tests:**
- Review waiting strategies (avoid `Task.Delay`)
- Use more stable locators (data-testid, role)
- Check for race conditions in component lifecycle
- Enable trace capture to debug: `--trace on`

**Blazor-specific issues:**
- SignalR connection delays: Wait for `NetworkIdle` or connection indicator
- Prerendering: Ensure interactive mode before interactions
- Component updates: Wait for re-render after state changes

### Debugging

**View trace for failed test:**
```bash
pwsh bin/Debug/net9.0/playwright.ps1 show-trace <trace-file.zip>
```

**Run test with headed browser:**
```bash
dotnet test -- Playwright.LaunchOptions.Headless=false
```

**Enable slow motion:**
```bash
dotnet test -- Playwright.LaunchOptions.SlowMo=100
```

## Example Workflow

User request: "Setup Playwright for my Blazor app and create tests for the login page"

1. **Setup Playwright**
   ```bash
   python scripts/setup_playwright.py --project-path ./MyBlazorApp --test-project MyBlazorApp.Tests
   ```

2. **Analyze documentation**
   - Search for `docs/authentication.md`, `README.md`
   - Review authentication flows and test scenarios
   - Identify test cases needed

3. **Generate page object for login page**
   ```bash
   python scripts/generate_page_objects.py --pages "Pages/Login.razor" --output "MyBlazorApp.Tests/PageObjects"
   ```

4. **Generate tests**
   ```bash
   python scripts/generate_tests.py --pages "Login" --types "auth,navigation" --output "MyBlazorApp.Tests/Tests"
   ```

5. **Review and customize generated tests**
   - Verify locators are correct
   - Add application-specific assertions
   - Adjust waits if needed

6. **Run tests**
   ```bash
   cd MyBlazorApp.Tests
   dotnet test
   ```

7. **Review results and iterate**
   - Check HTML report: `playwright-report/index.html`
   - Fix any failing tests
   - Add additional test scenarios as needed

## Success Criteria

Skill execution is successful when:

✅ **Environment Setup**
- Playwright test project created with proper structure
- Microsoft.Playwright NuGet package installed
- Playwright browsers installed (chromium, firefox, webkit)
- Base test class created with setup/teardown methods
- `playwright.config.ts` generated with appropriate settings

✅ **Page Object Generation**
- Page objects generated for all specified Blazor pages
- Locators use proper strategies (data-testid, role, placeholder)
- Action methods created for interactive elements
- Navigation and assertion helpers included
- Blazor-specific waits implemented

✅ **Test Generation**
- Test files created following AAA pattern
- Tests organized by category (navigation, auth, form, CRUD)
- Test names are descriptive and follow convention
- Proper assertions included
- Tests compile without errors

✅ **Test Execution**
- All generated tests run successfully
- No compilation errors in test project
- Tests pass on first run (or fail for expected reasons)
- Test reports generated correctly
- Screenshots/videos captured on failure

✅ **Documentation Quality**
- Generated code includes helpful comments
- Page objects are well-documented
- Test purposes are clear from names and descriptions
- README or usage guide provided

## Security Considerations

When using this skill, be aware of the following security aspects:

**Script Execution:**
- Python scripts execute on the host system with user permissions
- Scripts install NuGet packages and Playwright browsers
- Review script contents before execution in sensitive environments
- Scripts do not transmit data externally

**Test Environment Isolation:**
- Configure tests to run against test/staging environments, not production
- Use test databases and test user accounts
- Implement data cleanup after test execution
- Avoid storing credentials in test code (use environment variables)

**Dependency Installation:**
- Playwright browsers are downloaded from Microsoft CDN
- NuGet packages are downloaded from configured package sources
- Verify package sources are trusted before installation
- Consider using private package feeds in corporate environments

**Test Data:**
- Generated tests may include placeholder credentials
- Replace placeholders with secure test credentials
- Never commit real credentials to version control
- Use secrets management for CI/CD credentials

## Integration with JS-AI Framework

When used within the JS-AI Agentic SDLC Framework:
- **coordinate with Taylor (test-runner)**: For executing generated tests and analyzing results
- **coordinate with Jordan (backend-developer)**: For understanding API endpoints and data models
- **coordinate with Avery (code-reviewer)**: For reviewing generated test code quality
- **coordinate with Parker (qa-engineer)**: For test strategy and coverage planning

This skill focuses on test generation and environment setup; delegate test execution and analysis to Taylor, and test strategy to Parker.
