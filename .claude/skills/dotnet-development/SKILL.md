---
name: dotnet-development
description: This skill should be used when users need .NET development expertise including building projects, running tests, formatting code, managing processes, and monitoring applications. Use this skill for comprehensive .NET CLI operations, build failure resolution, test execution, code quality enforcement, and long-running process management. Activates for dotnet build, dotnet test, dotnet format, dotnet run, dotnet watch, build errors, test failures, code analysis, and .NET process monitoring.
---

# .NET Development Skill

## Purpose

This skill provides comprehensive .NET development capabilities through direct dotnet CLI operations and development workflows. The skill supports complete .NET development lifecycle including:

- **Build Operations** - Execute builds with error parsing and automatic resolution
- **Test Execution** - Run tests with detailed analysis, coverage reporting, and auto-fixing
- **Code Formatting** - Enforce C# 12/13 style guidelines and modern patterns
- **Code Analysis** - Comprehensive quality, performance, and security analysis
- **Process Management** - Monitor and manage long-running .NET applications
- **Output Monitoring** - Real-time output analysis and pattern detection
- **C# Modernization** - Apply C# 12/13 features (collection expressions, primary constructors, pattern matching)
- **Performance Optimization** - Identify and fix performance hotspots
- **Security Scanning** - Detect vulnerabilities and security issues

The skill automates workflows from code analysis through build, test, format, and deployment, following C# 12/13 best practices.

## When to Use This Skill

Use this skill when:
- Users request **.NET build operations** or build failure resolution
- Users want to **run tests** with detailed analysis and auto-fixing
- Users need **code formatting** with C# 12/13 style enforcement
- Users request **code analysis** for quality, performance, or security
- Users need to **run .NET applications** with monitoring
- Users want **watch mode** for auto-rebuild on file changes
- Working with **dotnet CLI** commands and workflows
- Modernizing code to **C# 12/13** patterns
- Diagnosing **build errors** or **test failures**
- Monitoring **long-running .NET processes**

## Core Principles

Follow these development principles throughout all workflows:

1. **Parallel Execution First** - Execute independent operations simultaneously for maximum efficiency
2. **Modern C# Patterns** - Always apply C# 12/13 features (collection expressions, primary constructors)
3. **Comprehensive Error Context** - Provide file paths, line numbers, and actionable fixes
4. **Self-Healing Builds** - Automatically resolve common build and test failures
5. **Quality Over Speed** - Enforce code quality, security, and performance standards
6. **Actionable Feedback** - Always provide specific, implementable recommendations
7. **Process Cleanliness** - Manage processes reliably with proper cleanup
8. **Real-Time Monitoring** - Track application state and performance continuously

## Default Directory Structure

All .NET operations work within standard .NET project structures:

```
[project-root]/
├── src/                           # Source projects
│   ├── MyApp/
│   │   ├── MyApp.csproj
│   │   └── ...
│   └── MyApp.Core/
│       ├── MyApp.Core.csproj
│       └── ...
├── tests/                         # Test projects
│   ├── MyApp.Tests/
│   │   ├── MyApp.Tests.csproj
│   │   └── ...
│   └── MyApp.Integration.Tests/
│       └── ...
├── MyApp.sln                      # Solution file
├── global.json                    # SDK version
├── Directory.Build.props          # Common MSBuild properties
└── .editorconfig                  # Code style rules
```

## Core Workflows

### Build Workflow

The complete build workflow consists of six phases:

1. **Execute Build**: Run `dotnet build` with specified configuration
2. **Parse Output**: Extract errors, warnings, and build metrics
3. **Analyze Errors**: Read affected files and understand context
4. **Apply Fixes**: Implement C# 12/13 best practices to resolve issues
5. **Re-build**: Verify fixes work correctly
6. **Report Results**: Provide detailed build summary with metrics

### Test Workflow

The test execution workflow consists of six phases:

1. **Execute Tests**: Run `dotnet test` with filters and parallel execution
2. **Parse Results**: Extract passed/failed/skipped counts and coverage
3. **Analyze Failures**: Identify failing tests with stack traces
4. **Fix Issues**: Resolve test or implementation issues
5. **Re-test**: Verify fixes resolve failures
6. **Report Results**: Provide test summary with coverage metrics

### Format Workflow

The code formatting workflow consists of five phases:

1. **Execute Format**: Run `dotnet format` with severity levels
2. **Scan for Patterns**: Identify C# 12/13 modernization opportunities
3. **Apply Modernization**: Convert to collection expressions, primary constructors, etc.
4. **Verify Changes**: Ensure formatting maintains functionality
5. **Report Results**: List formatted files and patterns applied

### Analysis Workflow

The comprehensive analysis workflow consists of six phases:

1. **Parallel Analysis**: Run build analyzers, security scan, performance analysis simultaneously
2. **C# Modernization Check**: Identify opportunities for C# 12/13 features
3. **Security Scan**: Check for SQL injection, XSS, hardcoded secrets, etc.
4. **Performance Analysis**: Find async anti-patterns, boxing, LINQ issues
5. **Apply Fixes**: Implement fixes if requested
6. **Generate Report**: Provide detailed analysis with severity levels

### Process Management Workflow

The process management workflow consists of four phases:

1. **Start Process**: Launch application with background execution
2. **Monitor Output**: Track stdout/stderr in real-time
3. **Analyze Patterns**: Watch for errors, warnings, performance metrics
4. **Manage Lifecycle**: Handle graceful shutdown and cleanup

## Step-by-Step Implementation

### Step 1: Build Operations

**Execute Build**:
1. Run `dotnet build` with configuration (Debug/Release)
2. Capture full output including errors and warnings
3. Parse MSBuild output for error codes (CS####, MSB####)
4. Extract file paths, line numbers, and error messages

**Resolve Build Failures**:
1. **PARALLEL**: Read all affected files simultaneously
2. Analyze error context with surrounding code
3. Apply C# 12/13 fixes:
   - Use collection expressions `[1, 2, 3]`
   - Convert to primary constructors
   - Apply proper nullable annotations
   - Fix using statements and namespaces
4. **PARALLEL**: Apply fixes to multiple files concurrently
5. Re-run build to verify resolution

**Report Build Results**:
```
Build: [SUCCESS/FAILED]
Configuration: Debug/Release
Errors: X
Warnings: Y
Time: XX.XX seconds

Errors:
- File.cs(10,5): CS0103: The name 'variable' does not exist

Warnings:
- File.cs(20,10): CS0168: Variable declared but never used
```

**Common Build Errors**:
- **CS0246**: Type or namespace not found → Check references and usings
- **CS0103**: Name does not exist → Check variable declarations
- **CS1061**: Type does not contain definition → Check method/property exists
- **MSB3073**: Command exited with code → Check pre/post-build events
- **NU1101**: Package not found → Run `dotnet restore`

### Step 2: Test Execution

**Execute Tests**:
1. Run `dotnet test` with optional filters:
   - `--filter "FullyQualifiedName~UnitTests"`
   - `--filter "Category=Integration"`
   - `--filter "Priority=1"`
2. Use `--parallel` flag for faster execution
3. Collect code coverage with `--collect:"XPlat Code Coverage"`
4. Capture test output with `--logger "console;verbosity=detailed"`

**Analyze Test Failures**:
1. Parse test output for failed test names
2. Extract stack traces and error messages
3. **PARALLEL**: Locate all test source files simultaneously
4. Compare expected vs actual results
5. Identify root cause (test issue vs implementation issue)

**Fix Test Failures**:
1. Update test assertions if expectations are wrong
2. Fix implementation if behavior is incorrect
3. Apply C# 12/13 patterns:
   - Use collection expressions for test data `[1, 2, 3]`
   - Use primary constructors for test fixtures
   - Apply pattern matching in assertions
4. **PARALLEL**: Fix multiple test files concurrently
5. Re-run failed tests to verify fixes

**Report Test Results**:
```
Tests: XX Passed, YY Failed, ZZ Skipped
Duration: XX.XX seconds
Coverage: XX%

Failed Tests:
- TestName1: Expected X but got Y
- TestName2: NullReferenceException at line 50
```

**Common Test Failures**:
- **Assert.Equal() Failure**: Compare expected vs actual values
- **NullReferenceException**: Check for null checks in code
- **Timeout**: Increase timeout or optimize test
- **Setup/Teardown**: Verify test initialization
- **Flaky tests**: Check for race conditions or external dependencies

### Step 3: Code Formatting

**Execute Format**:
1. Run `dotnet format` with options:
   - Default: Apply all formatting rules
   - `--verify-no-changes`: Check without modifying
   - `--severity`: info, warning, or error level
2. Capture list of files to be formatted
3. Apply formatting changes

**Modernize to C# 12/13**:
1. **PARALLEL**: Scan all files for modernization opportunities:
   - Convert `new[] {1,2,3}` → `[1, 2, 3]`
   - Convert to primary constructors where beneficial
   - Use file-scoped namespaces
   - NEVER Apply target-typed new: `new List<int>()` X `new()`
   - Convert to pattern matching
   - Add required members where appropriate
2. **PARALLEL**: Apply patterns to multiple files concurrently
3. Verify compilation after changes

**Report Format Results**:
```
Files Formatted: 42
Files Changed: 15

Changes Applied:
- 12 files converted to collection expressions
- 5 files converted to primary constructors
- 8 files converted to file-scoped namespaces

Style Violations Fixed: 27
```

**Formatting Categories**:
- **IDE0001-IDE9999**: Style and formatting rules
- **Collection expressions**: Simplified initialization
- **Primary constructors**: Reduced boilerplate
- **Pattern matching**: Improved readability
- **Nullable annotations**: Proper null handling

### Step 4: Code Analysis

**Execute Analysis**:
1. **PARALLEL ANALYSIS** - Run simultaneously:
   - `dotnet build /p:RunAnalyzers=true /p:AnalysisMode=All`
   - Security analysis scan
   - Performance analysis
   - Code metrics calculation
   - Dead code detection
   - Dependency analysis

**C# 12/13 Modernization Check**:
1. Scan for opportunities:
   - Classes that could use primary constructors
   - Arrays/Lists that should be collection expressions
   - Verbose null handling that could use modern patterns
   - Old-style switch statements → switch expressions
   - Classes missing required members
   - Opportunities for ValueTask usage
   - Span<T>/Memory<T> optimization candidates

**Security Analysis**:
1. Check for vulnerabilities:
   - SQL injection vulnerabilities
   - XSS vulnerabilities
   - Hardcoded secrets/credentials
   - Insecure deserialization
   - Missing input validation
   - HTTPS enforcement

**Performance Analysis**:
1. Identify issues:
   - Async/await anti-patterns
   - Boxing/unboxing issues
   - String concatenation in loops
   - LINQ performance issues
   - Missing disposal patterns
   - Collection allocation hotspots

**Generate Report**:
```
Code Analysis Results
=====================
Total Issues: 45
- Critical: 2
- Warning: 15
- Info: 28

Security Issues (3):
- SQL Injection in UserRepository.cs:45
- Hardcoded secret in Config.cs:12
- Missing input validation in ApiController.cs:78

Performance Issues (8):
- String concatenation in loop (Service.cs:120)
- Missing ConfigureAwait(false) (Repository.cs:56)
- Boxing in LINQ query (DataProcessor.cs:89)

C# 12/13 Opportunities (15):
- 8 classes could use primary constructors
- 12 arrays should use collection expressions
- 5 switches should be switch expressions
```

**Analysis Categories**:
- **CA1000-CA1999**: Design issues
- **CA2000-CA2999**: Usage issues
- **CA3000-CA3999**: Security issues
- **CA5000-CA5999**: More security issues
- **IDE0001-IDE9999**: Style and formatting

### Step 5: Run and Monitor Applications

**Start Application**:
1. Execute `dotnet run` with options:
   - Use `run_in_background: true` for long-running apps
   - Capture process ID for management
   - Monitor both stdout and stderr
   - Use `--launch-profile` for specific configuration

**For Web Applications**:
1. Identify listening ports and URLs from output
2. Monitor for startup completion ("Now listening on...")
3. Track HTTP request patterns
4. Watch for unhandled exceptions

**For Console Applications**:
1. Monitor console output in real-time
2. Capture user prompts if interactive
3. Track execution progress

**Monitor Application**:
1. Use BashOutput tool to check output periodically
2. Filter for specific patterns (errors, warnings)
3. Track performance metrics if logged
4. Monitor resource usage (CPU/Memory)

**Provide Status Updates**:
```
Application Status
==================
State: Running
PID: 12345
Uptime: 5m 23s
Recent Activity:
- [14:32:45] Application started
- [14:33:10] HTTP request: GET /api/users
- [14:33:15] Warning: High memory usage (85%)
```

### Step 6: Watch Mode

**Start Watch**:
1. Run `dotnet watch` with command:
   - `dotnet watch run` - Auto-restart on code changes
   - `dotnet watch test` - Auto-test on code changes
   - `dotnet watch build` - Auto-build on code changes
2. Use background execution for monitoring

**Monitor Changes**:
1. **PARALLEL MONITORING** - Track simultaneously:
   - File system changes
   - Rebuild triggers
   - Application output
   - Compilation errors
   - Test results (if watch test)

**Handle Rebuild Cycles**:
1. Capture what files triggered rebuild
2. Monitor build/test output
3. Track success/failure
4. Report any new errors or warnings

**Hot Reload Support**:
1. Track successful hot reloads
2. Identify hot reload blockers
3. Monitor Razor page updates
4. Track CSS/JS changes

**Report Watch Status**:
```
Watch Mode Active
=================
Command: dotnet watch run
Rebuild Count: 3
Last Rebuild: 14:35:42 (File changed: Service.cs)
Status: ✅ Build successful, application restarted
Hot Reload: Enabled
```

## Bundled Resources

### References

**`references/csharp-12-13-primer.md`** - C# 12/13 features and best practices
- Complete guide to C# 12 features (primary constructors, collection expressions, inline arrays)
- Complete guide to C# 13 features (params collections, new Lock type, escape sequences)
- Naming conventions and style guidelines
- Pattern matching and null handling patterns
- Async/await best practices with ValueTask
- Performance considerations (Span<T>, Memory<T>, ArrayPool)
- Testing considerations and dependency injection patterns
- Load this reference when modernizing code or explaining C# patterns

**`references/dotnet-error-codes.md`** - Common error codes and resolutions
- Compiler errors (CS####) with fixes
- MSBuild errors (MSB####) with resolutions
- NuGet errors (NU####) with troubleshooting
- Runtime errors with debugging strategies
- Load this reference when encountering build or runtime errors

### Assets

**`assets/analyzer-config.json`** - .NET analyzer configuration
- Severity levels for analyzer rules
- Disabled rules with justifications
- Custom rule configurations
- Code quality standards
- Use this configuration when running code analysis

**`assets/editorconfig-template.txt`** - Standard .editorconfig template
- C# 12/13 style rules
- Naming conventions
- Formatting preferences
- IDE analyzer rules
- Use this template when setting up new projects

## Parallel Execution Strategy

**CRITICAL**: Always execute independent operations in parallel for maximum efficiency:

### Parallel Build Operations
```bash
# Build multiple projects simultaneously
dotnet build Project1.csproj & \
dotnet build Project2.csproj & \
dotnet build Project3.csproj & \
wait
```

### Parallel File Operations
- **PARALLEL**: Read all affected files simultaneously before analysis
- **PARALLEL**: Apply fixes to multiple files concurrently
- **PARALLEL**: Analyze multiple projects at once

### Parallel Test Execution
```bash
# Run tests with parallel execution
dotnet test --parallel
```

### Parallel Analysis
- Run build analyzers, security scan, and performance analysis simultaneously
- Analyze multiple files for modernization opportunities concurrently
- Check multiple projects for code quality in parallel

## C# 12/13 Modernization Priorities

Apply these patterns in order of priority:

1. **Collection Expressions** - `[1, 2, 3]` instead of `new[]` or `new List`
2. **Primary Constructors** - Reduce boilerplate in simple classes
3. **Pattern Matching** - Switch expressions and property patterns
4. **Required Members** - Ensure data integrity at construction
5. **File-Scoped Namespaces** - Reduce indentation
6. **Remove Constructor Null-Checks for DI** - Trust the container

**Examples**:

```csharp
// ❌ OLD: Array initialization
int[] numbers = new int[] { 1, 2, 3, 4, 5 };
List<string> names = new List<string> { "Alice", "Bob" };

// ✅ NEW: Collection expressions
int[] numbers = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob"];

// ❌ OLD: Traditional class with constructor
public class Person
{
    private readonly string _name;
    private readonly int _age;

    public Person(string name, int age)
    {
        _name = name;
        _age = age;
    }
}

// ✅ NEW: Primary constructor
public class Person(string name, int age)
{
    public string Name { get; } = name;
    public int Age { get; } = age;
}

// ❌ OLD: DI with null checks (NEVER DO THIS)
public class Service
{
    private readonly ILogger _logger;

    public Service(ILogger logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
}

// ✅ NEW: Trust the DI container
public class Service(ILogger logger)
{
    private readonly ILogger _logger = logger;
}
```

## Performance Focus Areas

Optimize these patterns for hot paths:

1. **ValueTask** - Use instead of Task for frequently synchronous operations
2. **Span<T>** - Use for array operations without allocation
3. **ArrayPool** - Rent temporary buffers instead of allocating
4. **StringComparison** - Always specify for string operations
5. **StringBuilder** - Use for string concatenation in loops
6. **ConfigureAwait(false)** - Use in library code to avoid context capture

## Troubleshooting

### Build Issues

**Issue: CS0246 - Type or namespace not found**
- Check using statements are correct
- Verify project references are added
- Run `dotnet restore` to restore NuGet packages
- Check target framework compatibility

**Issue: MSB3073 - Pre/post-build event failed**
- Check build event commands in .csproj
- Verify paths in build events are correct
- Ensure scripts have execute permissions
- Check for platform-specific path separators

**Issue: NU1101 - Package not found**
- Verify package name and version
- Check NuGet.config for package sources
- Run `dotnet restore --force`
- Clear NuGet cache: `dotnet nuget locals all --clear`

### Test Issues

**Issue: Flaky tests failing intermittently**
- Check for race conditions in async code
- Verify proper test isolation (no shared state)
- Look for external dependencies (databases, APIs)
- Add retry logic for integration tests
- Increase timeouts if necessary

**Issue: Tests pass locally but fail in CI**
- Check for environment-specific dependencies
- Verify file paths are cross-platform
- Look for timing issues (tests too fast/slow)
- Check for missing configuration in CI

### Process Management Issues

**Issue: Application won't start**
- Check port availability (another process using port)
- Verify appsettings.json configuration
- Check for missing environment variables
- Review application startup logs

**Issue: Process won't stop**
- Use KillBash tool with process ID
- Check for processes holding file locks
- Force kill if graceful shutdown fails
- Clean up background processes on exit

### Format Issues

**Issue: Format changes break compilation**
- Run build before format to ensure clean state
- Review format changes carefully
- Test after formatting
- Use `--verify-no-changes` to preview

**Issue: Format and analyzer conflicts**
- Check .editorconfig settings
- Review analyzer rule configurations
- Suppress specific rules if needed
- Update formatting rules to match analyzers

## Best Practices

1. **Always Use Parallel Execution** - Run independent operations simultaneously
2. **Capture Full Output** - Never lose error details or warnings
3. **Parse Output Systematically** - Extract errors, warnings, metrics
4. **Apply Modern Patterns** - Use C# 12/13 features everywhere
5. **Clean Before Rebuild** - Resolve strange errors with clean builds
6. **Run Targeted Tests** - Save time with specific test filters
7. **Format After Changes** - Maintain code consistency
8. **Track Process IDs** - Ensure reliable cleanup
9. **Monitor Continuously** - Watch application state in real-time
10. **Provide Actionable Feedback** - Always include specific fixes

## Integration with Other Workflows

### With Developer Agent
- Provide build/test feedback during implementation
- Apply formatting automatically during development
- Monitor application during feature development
- Run tests after code changes

### With DevOps Agent
- Integrate with CI/CD pipelines
- Run analysis in build pipelines
- Generate coverage reports
- Perform security scans

### With Architect Agent
- Validate architectural decisions with analysis
- Check performance of implementations
- Ensure security standards are met
- Verify dependency management

## Quality Standards

Ensure all operations:
- Follow C# 12/13 best practices from bundled primer
- Apply parallel execution for efficiency
- Provide comprehensive error context with file:line references
- Include actionable fixes for all issues
- Maintain clean process management
- Monitor applications effectively
- Enforce code quality standards
- Generate detailed, structured reports

## Success Criteria

### Build Success
- ✅ Build completes without errors
- ✅ All warnings addressed or documented
- ✅ Build time reported accurately
- ✅ All project references resolved
- ✅ NuGet packages restored successfully
- ✅ Output binaries generated correctly

### Test Success
- ✅ All tests pass or failures explained
- ✅ Code coverage meets threshold (if specified)
- ✅ Test execution time acceptable
- ✅ No flaky tests detected
- ✅ Integration tests run successfully
- ✅ Test results clearly reported

### Format Success
- ✅ All files formatted consistently
- ✅ C# 12/13 patterns applied where appropriate
- ✅ No compilation errors after formatting
- ✅ Style rules enforced uniformly
- ✅ Changes documented clearly

### Analysis Success
- ✅ All analyzer rules executed
- ✅ Security issues identified and prioritized
- ✅ Performance issues documented
- ✅ C# modernization opportunities listed
- ✅ Code metrics calculated
- ✅ Comprehensive report generated

### Process Management Success
- ✅ Application starts successfully
- ✅ Output monitored in real-time
- ✅ Errors and warnings captured
- ✅ Graceful shutdown on stop
- ✅ No orphaned processes left behind

## Examples

### Example 1: Build and Fix Errors

**User Request:** "Build the solution and fix any errors"

**Workflow**:
1. Execute: `dotnet build MySolution.sln`
2. Parse output, find 3 errors:
   - CS0246: Type 'DataContext' not found in Service.cs:15
   - CS0103: Name 'logger' does not exist in Controller.cs:28
   - CS1061: 'string' does not contain 'ToTitleCase' in Helper.cs:42
3. **PARALLEL**: Read all 3 affected files simultaneously
4. Analyze and fix:
   - Service.cs: Add `using MyApp.Data;`
   - Controller.cs: Add parameter `ILogger logger` to constructor
   - Helper.cs: Use `CultureInfo.CurrentCulture.TextInfo.ToTitleCase()`
5. **PARALLEL**: Apply all 3 fixes concurrently
6. Re-build: Success! ✅
7. Report: "Build successful. Fixed 3 errors in 3 files."

### Example 2: Run Tests with Auto-Fix

**User Request:** "Run the unit tests and fix any failures"

**Workflow**:
1. Execute: `dotnet test --filter "Category=Unit" --parallel`
2. Parse results: 45 passed, 3 failed, 0 skipped
3. Analyze failures:
   - UserServiceTests.CreateUser_ShouldReturnUser: Assert.Equal failed
   - AuthTests.Login_WithValidCredentials_ShouldSucceed: NullReferenceException
   - ValidationTests.Email_ShouldBeValid: Expected True but got False
4. **PARALLEL**: Read all 3 test files and implementation files
5. Fix issues:
   - CreateUser: Fix expected user ID in assertion
   - Login: Add null check for user lookup result
   - Email: Update regex pattern to allow plus signs
6. **PARALLEL**: Apply fixes to test and implementation files
7. Re-run failed tests: All pass! ✅
8. Report: "48/48 tests passed. Fixed 3 test failures."

### Example 3: Format and Modernize Code

**User Request:** "Format the code and apply C# 12/13 patterns"

**Workflow**:
1. Execute: `dotnet format`
2. **PARALLEL**: Scan all files for modernization opportunities
3. Found opportunities:
   - 15 arrays should use collection expressions
   - 8 classes could use primary constructors
   - 12 switches should be switch expressions
   - 5 constructors have unnecessary DI null checks
4. **PARALLEL**: Apply all modernizations simultaneously:
   - Convert `new[] {1, 2, 3}` → `[1, 2, 3]` in 15 files
   - Convert 8 classes to primary constructors
   - Convert 12 switches to switch expressions
   - Remove null checks from 5 constructors
5. Verify compilation: Success! ✅
6. Report: "Formatted 42 files. Applied C# 12/13 patterns to 40 locations."

### Example 4: Comprehensive Code Analysis

**User Request:** "Analyze the codebase for quality and security issues"

**Workflow**:
1. **PARALLEL ANALYSIS** - Run simultaneously:
   - `dotnet build /p:RunAnalyzers=true`
   - Security scan
   - Performance analysis
   - Code metrics
2. Results:
   - **Security**: 2 SQL injection risks, 1 hardcoded secret
   - **Performance**: 5 async anti-patterns, 3 boxing issues
   - **Quality**: 15 style violations, 8 design issues
   - **C# Modernization**: 25 opportunities
3. Generate detailed report with line numbers and fixes
4. If `--fix` specified, **PARALLEL**: Apply all fixes concurrently
5. Report comprehensive analysis with priorities

### Example 5: Run and Monitor Web Application

**User Request:** "Run the web app and monitor for errors"

**Workflow**:
1. Execute: `dotnet run --project MyApp.csproj --launch-profile https` (background)
2. Capture process ID: 12345
3. Monitor startup:
   - "Now listening on: https://localhost:5001" ✅
   - "Application started in 2.3s" ✅
4. Use BashOutput to monitor continuously
5. Detect patterns:
   - HTTP requests logged
   - Warning: "High memory usage (85%)"
   - Error: "Database connection timeout"
6. Provide real-time updates with context
7. On user request to stop: KillBash(12345) and verify cleanup

## Implementation Notes

### Critical Requirements
1. **ALWAYS use parallel execution** for independent operations
2. **NEVER skip error context** - Always provide file:line references
3. **MAINTAIN clean process management** - Track and cleanup all processes
4. **APPLY C# 12/13 patterns** consistently from the primer
5. **PROVIDE actionable fixes** for all issues
6. **MONITOR continuously** for long-running applications
7. **REPORT comprehensively** with structured output

### Performance Considerations
- Use parallel execution for build, test, and analysis operations
- Apply fixes to multiple files concurrently
- Monitor background processes efficiently with BashOutput
- Filter output streams for relevant patterns
- Cache analysis results when appropriate

### Quality Assurance
- Verify compilation after all fixes and formatting
- Run tests after implementation changes
- Check for orphaned processes after operations
- Validate output parsing for accuracy
- Ensure error messages are actionable

## Educational Approach

This skill teaches .NET development best practices through:

**Build Operations**:
- Understanding MSBuild process and error codes
- Recognizing common compilation issues
- Applying C# language features correctly

**Test Execution**:
- Writing effective unit and integration tests
- Using test filters for targeted execution
- Understanding test isolation and dependencies

**Code Quality**:
- Following C# 12/13 modern patterns
- Applying performance optimizations
- Ensuring security best practices

**Process Management**:
- Managing application lifecycle effectively
- Monitoring for issues proactively
- Handling graceful shutdown and cleanup

Every operation includes context and rationale, ensuring users understand not just *what* to do, but *why* it works for .NET development.
