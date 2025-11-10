---
name: test-suite-builder
description: This skill should be used when users need to generate comprehensive test suites for C# and .NET projects. It automates unit test, integration test, saga test, and Blazor component test generation using xUnit, Moq, FluentAssertions, and bUnit.
---

# Test Suite Builder

Comprehensive test generation for C# and .NET projects using xUnit, FluentAssertions, Moq, and bUnit.

## Overview

This skill automates the creation of comprehensive test suites for .NET applications, including:
- Unit tests for services and repositories
- Integration tests for ASP.NET Core API controllers
- Saga state machine tests for MassTransit workflows
- Blazor component tests using bUnit
- TDD workflow automation

## Commands

### analyze-for-tests [file-path]

Analyzes a source file and recommends test types needed.

**Usage:**
```bash
analyze-for-tests src/MyApp.Services/Services/UserService.cs
```

**What it does:**
1. Parses the source file to identify class type (Service, Repository, Controller, etc.)
2. Extracts dependencies from constructor
3. Identifies public methods that need testing
4. Detects async patterns, repository patterns, saga patterns
5. Outputs JSON report with test recommendations

---

### generate-unit-tests [source-file] [--test-project <project>]

Generates comprehensive unit tests for a service or repository.

**Usage:**
```bash
generate-unit-tests src/MyApp.Services/Services/UserService.cs
```

**Options:**
- `--test-project`: Specify target test project (default: auto-detect)
- `--mock-strategy`: `moq` (default) or `nsubstitute`
- `--include-edge-cases`: Generate additional edge case tests

**Workflow:**
1. Run analyze-for-tests to understand class structure
2. Generate test class with proper naming (`UserServiceTests`)
3. Create mock setups for all constructor dependencies
4. Generate test methods for each public method
5. Add FluentAssertions assertions
6. Add async test patterns for async methods
7. Create test data builders if needed

---

### generate-integration-tests [controller-file]

Generates integration tests for ASP.NET Core API controllers with WebApplicationFactory.

**Usage:**
```bash
generate-integration-tests src/MyApp.WebApi/Controllers/UserController.cs
```

**Workflow:**
1. Create test class inheriting from `IClassFixture<WebApplicationFactory<Program>>`
2. Generate tests for each HTTP endpoint
3. Add authorization tests
4. Create request/response model validation tests
5. Setup test database fixtures

---

### generate-saga-tests [saga-file]

Generates state machine tests for MassTransit sagas.

**Usage:**
```bash
generate-saga-tests src/MyApp.Sagas/OrderProcessingSaga.cs
```

**Workflow:**
1. Extract saga states and events
2. Create test fixture with in-memory saga test harness
3. Generate happy path test (Initial → Completed)
4. Generate failure path tests
5. Generate compensation/rollback tests
6. Add state transition validation tests

---

### generate-component-tests [component-file]

Generates bUnit tests for Blazor components.

**Usage:**
```bash
generate-component-tests src/MyApp.Web/Components/UserDialog.razor
```

**Workflow:**
1. Create bUnit test context
2. Mock injected services
3. Generate render tests
4. Generate interaction tests (button clicks, form input)
5. Add parameter validation tests

---

### tdd-cycle [feature-name]

Runs complete TDD cycle: Red → Green → Refactor.

**Usage:**
```bash
tdd-cycle "Add user deactivation"
```

**Workflow:**
1. Create failing test stub
2. Run tests to verify failure (Red)
3. Prompt user to implement feature
4. Run tests again to verify success (Green)
5. Suggest refactoring opportunities
6. Run tests again to verify refactor

---

### run-test-suite [--project <project>] [--coverage]

Executes test suite with optional coverage reporting.

**Usage:**
```bash
run-test-suite --project MyApp.Services.Tests --coverage
```

**Options:**
- `--project`: Specific test project to run (default: all)
- `--coverage`: Generate code coverage report using Coverlet
- `--watch`: Run tests in watch mode
- `--filter`: Filter tests by name pattern

---

## Configuration

Tests are generated based on patterns defined in:
- `assets/test-patterns.json` - Test structure patterns and .NET conventions
- `assets/naming-conventions.json` - Naming rules for tests, mocks, and fixtures

## Templates

Located in `templates/` directory:
- `unit-test.cs.template` - Unit test structure with Moq and FluentAssertions
- `integration-test.cs.template` - Integration test structure with WebApplicationFactory
- `saga-test.cs.template` - Saga test structure with MassTransit test harness
- `component-test.razor.template` - Blazor component test structure with bUnit
- `test-method.cs.template` - Individual test method template

## Scripts

Located in `scripts/` directory:
- `analyze-code.sh` - Analyzes source files and extracts metadata
- `generate-tests.sh` - Generates test files from templates
- `run-tests.sh` - Executes test suite with options

## Workflows

Located in `workflows/` directory:
- `full-test-suite.yml` - Complete test generation workflow

## Examples

### Generate unit tests for a service
```bash
# Analyze first
analyze-for-tests src/MyApp.Services/Services/UserService.cs

# Generate tests
generate-unit-tests src/MyApp.Services/Services/UserService.cs

# Run tests
run-test-suite --project MyApp.Services.Tests
```

### TDD workflow
```bash
# Start TDD cycle
tdd-cycle "Add user deactivation feature"

# Follow prompts:
# 1. Review failing test (RED)
# 2. Implement feature (GREEN)
# 3. Refactor if needed
# 4. Tests pass!
```

### Generate full test suite with coverage
```bash
# Generate all applicable tests
generate-unit-tests src/MyApp.Services/Services/UserService.cs
generate-integration-tests src/MyApp.WebApi/Controllers/UserController.cs

# Run with coverage
run-test-suite --coverage
```

## Common Testing Patterns

This skill automatically detects common patterns and generates appropriate tests:

### Repository Pattern Tests
- CRUD operation tests (Create, Read, Update, Delete)
- Entity not found tests
- Duplicate entity tests
- Query filter tests

### Service Layer Tests
- Business logic validation tests
- Exception handling tests
- Dependency interaction tests
- Transaction/unit-of-work tests

### ASP.NET Core Controller Tests
- HTTP status code tests
- Model validation tests
- Authorization tests
- Content negotiation tests

### MassTransit Saga Tests
- State transition tests
- Event correlation tests
- Compensation/rollback tests
- Timeout handling tests

### Blazor Component Tests
- Render tests
- User interaction tests
- Parameter binding tests
- Event callback tests

## Test Framework Support

The skill is designed for C# 13 and .NET 9 projects using:

- **xUnit** - Testing framework with [Fact] and [Theory] attributes
- **Moq** - Mocking library for dependencies
- **FluentAssertions** - Expressive assertion syntax
- **bUnit** - Blazor component testing library
- **MassTransit.Testing** - Saga test harness
- **WebApplicationFactory** - ASP.NET Core integration testing
- **Coverlet** - Code coverage reporting

## Best Practices

1. **Test Naming**: Uses pattern `{MethodName}_{Scenario}_{ExpectedResult}`
   - Example: `GetUserAsync_ValidUserId_ReturnsUser`
2. **AAA Pattern**: All tests follow Arrange-Act-Assert structure
3. **FluentAssertions**: Readable, expressive assertions
4. **Async Patterns**: Proper async/await test patterns
5. **Test Isolation**: Each test is independent with proper setup/teardown
6. **Edge Cases**: Generates tests for null inputs, boundary conditions, exceptions
7. **Mock Naming**: Convention `_mock{InterfaceName}` (e.g., `_mockUserRepository`)
8. **One Assertion Per Test**: Focus on single concern per test method

## Notes

- Test projects are auto-detected based on source namespace
- Generated tests follow standard .NET testing conventions
- Scripts are executable and can be run independently
- Templates use placeholders for easy customization
- Works with any .NET project structure (layered, clean architecture, vertical slices, etc.)
