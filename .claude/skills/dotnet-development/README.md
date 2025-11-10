# .NET Development Skill

A comprehensive Claude Code skill for .NET development operations including building, testing, formatting, analysis, and process management with C# 12/13 best practices.

## Quick Start

This skill activates automatically when you need .NET development expertise. Simply ask:

- "Build the solution and fix any errors"
- "Run the tests and fix failures"
- "Format the code with C# 12/13 patterns"
- "Analyze the codebase for security issues"
- "Run the web application and monitor for errors"

## Core Capabilities

### 1. Build Operations ⚙️
Execute builds with comprehensive error resolution:
- Run `dotnet build` with multiple configurations
- Parse errors and warnings with file:line references
- Automatically fix common compilation issues
- Apply C# 12/13 patterns to resolve errors
- Re-build to verify fixes

**Example:**
```
User: "Build the solution"

Skill: Building MySolution.sln...
Build: SUCCESS ✅
Configuration: Debug
Errors: 0
Warnings: 2
Time: 3.45 seconds

Warnings:
- Service.cs(45,10): CS0168: Variable declared but never used
```

### 2. Test Execution 🧪
Run tests with detailed analysis and auto-fixing:
- Execute `dotnet test` with parallel execution
- Parse test results and coverage metrics
- Analyze failing tests with stack traces
- Fix test or implementation issues
- Re-run to verify fixes

**Supported Filters:**
```bash
--filter "FullyQualifiedName~UnitTests"
--filter "Category=Integration"
--filter "Priority=1"
```

**Example:**
```
User: "Run unit tests and fix failures"

Skill: Running tests with filter: Category=Unit...
Tests: 45 Passed, 3 Failed, 0 Skipped ⚠️
Duration: 8.2 seconds
Coverage: 78%

Analyzing failures...
Fixed 3 test failures
Re-running tests: 48/48 Passed ✅
```

### 3. Code Formatting 🎨
Enforce C# 12/13 style guidelines:
- Run `dotnet format` with severity levels
- Scan for C# 12/13 modernization opportunities
- Apply collection expressions, primary constructors
- Convert to pattern matching and modern patterns
- Remove unnecessary DI null checks

**Modernization Patterns:**
- `new[] {1,2,3}` → `[1, 2, 3]` (collection expressions)
- Traditional constructors → Primary constructors
- Switch statements → Switch expressions
- Verbose null handling → Modern patterns

**Example:**
```
User: "Format code and apply C# 13 patterns"

Skill: Formatting and modernizing...
Files Formatted: 42
Changes Applied:
- 15 files converted to collection expressions
- 8 classes converted to primary constructors
- 12 switches converted to switch expressions
- 5 constructors removed DI null checks ✅
```

### 4. Code Analysis 🔍
Comprehensive quality, performance, and security analysis:
- **PARALLEL**: Run build analyzers, security scan, performance analysis
- Identify C# 12/13 modernization opportunities
- Detect security vulnerabilities (SQL injection, XSS, secrets)
- Find performance issues (async anti-patterns, boxing, LINQ)
- Calculate code metrics and technical debt

**Analysis Categories:**
- **CA1000-CA1999**: Design issues
- **CA2000-CA2999**: Usage issues
- **CA3000-CA3999**: Security issues
- **CA5000-CA5999**: More security issues
- **IDE0001-IDE9999**: Style and formatting

**Example:**
```
User: "Analyze the codebase for issues"

Skill: Running comprehensive analysis...

Security Issues (3): 🔒
- SQL Injection in UserRepository.cs:45
- Hardcoded secret in Config.cs:12
- Missing input validation in ApiController.cs:78

Performance Issues (8): ⚡
- String concatenation in loop (Service.cs:120)
- Missing ConfigureAwait(false) (Repository.cs:56)
- Boxing in LINQ query (DataProcessor.cs:89)

C# 12/13 Opportunities (15): ✨
- 8 classes could use primary constructors
- 12 arrays should use collection expressions
```

### 5. Run and Monitor Applications 🚀
Execute and monitor long-running .NET applications:
- Start applications with background execution
- Monitor stdout/stderr in real-time
- Track application lifecycle and state
- Identify ports and URLs for web apps
- Watch for errors, warnings, and performance issues

**Launch Profiles:**
```bash
--launch-profile https      # Use HTTPS configuration
--launch-profile Production # Production settings
```

**Example:**
```
User: "Run the web app and monitor for errors"

Skill: Starting MyApp.csproj...
Application Status:
State: Running ✅
PID: 12345
Listening: https://localhost:5001
Uptime: 2m 15s

Recent Activity:
- [14:32:45] Application started
- [14:33:10] HTTP GET /api/users (200 OK)
- [14:33:15] HTTP POST /api/orders (201 Created)
```

### 6. Watch Mode 👀
Auto-rebuild on file changes:
- `dotnet watch run` - Auto-restart application
- `dotnet watch test` - Auto-run tests
- `dotnet watch build` - Auto-build on save
- Track rebuild triggers and changes
- Support hot reload for compatible changes

**Example:**
```
User: "Run the app in watch mode"

Skill: Starting watch mode...
Command: dotnet watch run
Status: Running ✅
Hot Reload: Enabled

[File changed: Service.cs]
Rebuilding... ✅
Application restarted
```

## Directory Structure

All .NET operations work within standard project structures:

```
[project-root]/
├── src/                           # Source projects
│   ├── MyApp/
│   │   ├── MyApp.csproj
│   │   └── ...
│   └── MyApp.Core/
├── tests/                         # Test projects
│   ├── MyApp.Tests/
│   └── MyApp.Integration.Tests/
├── MyApp.sln                      # Solution file
├── global.json                    # SDK version
├── Directory.Build.props          # Common properties
└── .editorconfig                  # Code style rules
```

## Bundled Resources

### References (Load as needed)
- **csharp-12-13-primer.md** (73KB) - Complete C# 12/13 feature guide
  - Primary constructors, collection expressions, inline arrays
  - New Lock type, escape sequences, params collections
  - Naming conventions and style guidelines
  - Async/await best practices with ValueTask
  - Performance optimizations (Span<T>, Memory<T>)

- **dotnet-error-codes.md** - Common error code reference
  - Compiler errors (CS####) with fixes
  - MSBuild errors (MSB####) with resolutions
  - NuGet errors (NU####) with troubleshooting
  - Runtime errors with debugging strategies

### Assets
- **analyzer-config.json** - .NET analyzer configuration
  - Severity levels for rules
  - Disabled rules with justifications
  - Code quality standards

- **editorconfig-template.txt** - Standard .editorconfig
  - C# 12/13 style rules
  - Naming conventions
  - Formatting preferences

## Core Principles

1. **Parallel Execution First** - Run independent operations simultaneously
2. **Modern C# Patterns** - Always apply C# 12/13 features
3. **Comprehensive Error Context** - Provide file:line references
4. **Self-Healing Builds** - Automatically resolve common issues
5. **Quality Over Speed** - Enforce standards
6. **Actionable Feedback** - Specific, implementable fixes
7. **Process Cleanliness** - Reliable cleanup
8. **Real-Time Monitoring** - Continuous state tracking

## C# 12/13 Best Practices

### Collection Expressions (C# 12)
```csharp
// ❌ OLD
int[] numbers = new int[] { 1, 2, 3, 4, 5 };
List<string> names = new List<string> { "Alice", "Bob" };

// ✅ NEW
int[] numbers = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob"];
```

### Primary Constructors (C# 12)
```csharp
// ❌ OLD
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

// ✅ NEW
public class Person(string name, int age)
{
    public string Name { get; } = name;
    public int Age { get; } = age;
}
```

### New Lock Type (C# 13)
```csharp
// ❌ OLD
private readonly object _lock = new();

// ✅ NEW
private readonly Lock _lock = new();

public void ThreadSafeMethod()
{
    lock (_lock)
    {
        // Critical section
    }
}
```

### params Collections (C# 13)
```csharp
// ❌ OLD: Only arrays
public void ProcessItems(params string[] items) { }

// ✅ NEW: Any collection
public void ProcessItems(params List<string> items) { }
public void ProcessNumbers(params ReadOnlySpan<int> numbers) { }
```

### NO DI Null Checks ⚠️
```csharp
// ❌ WRONG: Never null-check DI parameters
public class Service
{
    private readonly ILogger _logger;

    public Service(ILogger logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
}

// ✅ CORRECT: Trust the DI container
public class Service(ILogger logger)
{
    private readonly ILogger _logger = logger;
}
```

## Parallel Execution Strategy

**ALWAYS** run independent operations in parallel:

### Parallel Builds
```bash
# Build multiple projects simultaneously
dotnet build Project1.csproj & \
dotnet build Project2.csproj & \
dotnet build Project3.csproj & \
wait
```

### Parallel Tests
```bash
# Run tests with parallel execution
dotnet test --parallel
```

### Parallel File Operations
- Read all affected files simultaneously
- Apply fixes to multiple files concurrently
- Analyze multiple projects at once

### Parallel Analysis
- Run build analyzers, security scan, performance analysis together
- Scan all files for modernization opportunities concurrently
- Check multiple projects for quality in parallel

## Common Use Cases

### Use Case 1: Fix Build Errors
```
"The build is failing, fix the errors"

Skill will:
1. Execute dotnet build
2. Parse all errors with file:line locations
3. PARALLEL: Read all affected files
4. Apply C# 12/13 fixes
5. PARALLEL: Fix all files concurrently
6. Re-build to verify
7. Report success with details
```

### Use Case 2: Improve Code Quality
```
"Analyze and improve code quality"

Skill will:
1. PARALLEL: Run analyzers, security scan, performance check
2. Identify issues by severity
3. Find C# 12/13 modernization opportunities
4. Apply fixes if requested
5. Generate comprehensive report
```

### Use Case 3: Modernize Codebase
```
"Apply C# 12/13 patterns throughout"

Skill will:
1. PARALLEL: Scan all files for opportunities
2. Convert to collection expressions
3. Apply primary constructors
4. Remove DI null checks
5. Convert to pattern matching
6. Verify compilation
```

### Use Case 4: Debug Running Application
```
"Run the app and monitor for issues"

Skill will:
1. Start app in background
2. Monitor output in real-time
3. Identify ports and startup
4. Watch for errors and warnings
5. Provide continuous status updates
```

## Troubleshooting

### Build Failures
- **CS0246**: Type not found → Check usings and references
- **MSB3073**: Build event failed → Check scripts and paths
- **NU1101**: Package not found → Run `dotnet restore`

### Test Failures
- **Flaky tests** → Check for race conditions and shared state
- **CI failures** → Verify environment-specific dependencies
- **Timeouts** → Increase timeout or optimize test

### Format Issues
- **Breaks compilation** → Run build first, test after
- **Analyzer conflicts** → Check .editorconfig settings

### Process Issues
- **Won't start** → Check port availability and configuration
- **Won't stop** → Force kill with KillBash tool

## When to Use

Use this skill when users need:
- .NET build operations or error resolution
- Test execution with analysis and fixes
- Code formatting with C# 12/13 enforcement
- Comprehensive code analysis (quality/security/performance)
- Running .NET applications with monitoring
- Watch mode for auto-rebuild
- C# codebase modernization
- Build or test failure debugging
- Long-running process management

## Technology Focus

- .NET 9 / .NET 8
- C# 13 / C# 12
- dotnet CLI ecosystem
- MSBuild and project system
- xUnit / NUnit / MSTest frameworks
- Code analyzers and formatters
- Parallel execution patterns
- Modern C# language features

## Quality Standards

All operations:
- ✅ Follow C# 12/13 best practices
- ✅ Use parallel execution for efficiency
- ✅ Provide file:line error context
- ✅ Include actionable fixes
- ✅ Maintain clean process management
- ✅ Generate structured reports
- ✅ Enforce code quality standards

## Skill Version

**Version**: 1.0
**Created**: 2025-10-28
**Last Updated**: 2025-10-28

---

**Note**: This skill is fully self-contained with direct dotnet CLI operations and comprehensive .NET development workflows. It does NOT orchestrate external commands or agents.
