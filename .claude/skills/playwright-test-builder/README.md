# Playwright Test Builder Skill

Automated Playwright test environment setup and test generation for Blazor web applications.

## Quick Start

### 1. Setup Playwright Environment

```bash
python scripts/setup_playwright.py --project-path ./MyBlazorApp --test-project MyBlazorApp.Tests --blazor-url https://localhost:5001
```

### 2. Generate Page Objects

```bash
python scripts/generate_page_objects.py --pages "Pages/Login.razor,Pages/Dashboard.razor" --output "MyBlazorApp.Tests/PageObjects"
```

### 3. Generate Tests

```bash
python scripts/generate_tests.py --pages "Login,Dashboard" --types "navigation,auth,form" --output "MyBlazorApp.Tests/Tests"
```

### 4. Run Tests

```bash
cd MyBlazorApp.Tests
dotnet test
```

## What This Skill Does

- **Environment Setup**: Automatically configures Playwright for .NET projects
- **Page Object Generation**: Analyzes Blazor Razor files and creates strongly-typed page objects
- **Test Generation**: Generates xUnit tests for navigation, authentication, forms, CRUD operations
- **Documentation Analysis**: Extracts test scenarios from existing documentation
- **Blazor-Specific Support**: Handles SignalR, component lifecycle, client-side routing

## Files Structure

```
playwright-test-builder/
├── SKILL.md                          # Main skill instructions
├── README.md                         # This file
├── scripts/
│   ├── setup_playwright.py           # Environment setup script
│   ├── generate_page_objects.py      # Page object generator
│   ├── generate_tests.py             # Test case generator
│   ├── extract_scenarios.py          # Documentation parser
│   └── analyze_blazor_app.py         # Application analyzer
├── references/
│   ├── blazor-testing-guide.md       # Blazor-specific testing patterns
│   ├── playwright-patterns.md        # General Playwright patterns
│   ├── best-practices.md             # Testing best practices
│   └── ci-cd-configs.md              # CI/CD integration templates
└── assets/
    ├── test-project-template/        # Project structure template
    ├── playwright.config.ts          # Default configuration
    └── test-templates/               # Test file templates
```

## Requirements

- Python 3.8+
- .NET 8 or .NET 9
- PowerShell (for browser installation)
- Blazor Server or Blazor WebAssembly project

## Examples

### Example 1: Setup and Test Login Page

```bash
# Setup
python scripts/setup_playwright.py --project-path ./MyApp

# Generate page object
python scripts/generate_page_objects.py --pages "Pages/Login.razor" --output "./MyApp.Tests/PageObjects"

# Generate tests
python scripts/generate_tests.py --pages "Login" --types "auth" --output "./MyApp.Tests/Tests"

# Run
cd MyApp.Tests && dotnet test
```

### Example 2: Full Application Test Suite

```bash
# Analyze application structure
python scripts/analyze_blazor_app.py --project-path ./MyApp --output analysis.json

# Extract scenarios from docs
python scripts/extract_scenarios.py --docs ./docs --output scenarios.json

# Generate page objects for all pages
python scripts/generate_page_objects.py --pages "Pages/*.razor" --output "./MyApp.Tests/PageObjects"

# Generate comprehensive tests
python scripts/generate_tests.py --pages "Login,Dashboard,Products,Orders" --scenarios scenarios.json --types "navigation,auth,form,crud" --output "./MyApp.Tests/Tests"
```

## Integration with JS-AI Framework

When using within the JS-AI Agentic SDLC Framework:
- Coordinates with **Taylor (test-runner)** for test execution
- Coordinates with **Jordan (backend-developer)** for API understanding
- Coordinates with **Avery (code-reviewer)** for test code review
- Coordinates with **Parker (qa-engineer)** for test strategy

## License

Part of SchaabCore JS-AI Framework
