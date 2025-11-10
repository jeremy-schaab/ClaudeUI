---
name: nuget-validator
description: This skill should be used when users need to interact with NuGet.org to validate packages, retrieve metadata, search for packages, check dependencies, download packages, or compare versions. Use this skill for any NuGet package-related operations including existence validation, version lookups, dependency analysis, and package updates.
---

# NuGet Validator

## Overview

This skill enables comprehensive interaction with NuGet.org through the official NuGet V3 API. It provides tools for package validation, metadata retrieval, dependency analysis, and version management - essential for .NET development workflows.

## Core Capabilities

### 1. Package Validation
Verify that a package exists on NuGet.org and check if specific versions are available.

**Use when:**
- User asks "Does package X exist on NuGet?"
- Validating package names before adding to .csproj files
- Checking if a specific version is published

**Examples:**
- "Check if Microsoft.Extensions.Logging exists"
- "Validate that Newtonsoft.Json version 13.0.3 is available"
- "Does Azure.AI.OpenAI exist on NuGet?"

**Implementation:**
```bash
python scripts/nuget_api.py validate "Microsoft.Extensions.Logging" --version "8.0.0"
```

### 2. Metadata Retrieval
Fetch comprehensive package information including latest version, description, authors, download count, and more.

**Use when:**
- User requests package information or details
- Need to show package metadata
- Documenting package choices

**Examples:**
- "What's the latest version of Newtonsoft.Json?"
- "Get details about Microsoft.SemanticKernel"
- "Who are the authors of Azure.AI.OpenAI?"

**Implementation:**
```bash
python scripts/nuget_api.py metadata "Microsoft.SemanticKernel"
```

**Output includes:**
- Package ID
- Latest version
- Description
- Authors
- Total downloads
- License information
- Project URL
- All available versions

### 3. Package Search
Search NuGet.org for packages by keyword, finding relevant packages for specific needs.

**Use when:**
- User searches for packages (e.g., "Find logging packages")
- Discovering alternatives or related packages
- Exploring ecosystem for specific functionality

**Examples:**
- "Search for semantic kernel packages"
- "Find all OpenAI-related packages"
- "Search NuGet for dependency injection libraries"

**Implementation:**
```bash
python scripts/nuget_api.py search "semantic kernel" --limit 10
```

**Output includes (for each result):**
- Package ID
- Latest version
- Description
- Total downloads
- Authors

### 4. Dependency Analysis
Retrieve the complete dependency tree for a package version, showing what other packages are required.

**Use when:**
- User asks about package dependencies
- Planning package upgrades
- Understanding transitive dependencies
- Troubleshooting dependency conflicts

**Examples:**
- "What are the dependencies for Azure.AI.OpenAI version 2.1.0?"
- "Show me all dependencies of Microsoft.SemanticKernel"
- "What does Newtonsoft.Json require?"

**Implementation:**
```bash
python scripts/nuget_api.py dependencies "Azure.AI.OpenAI" --version "2.1.0"
```

**Output includes:**
- Dependency package IDs
- Version constraints
- Target frameworks
- Transitive dependency chains (if applicable)

### 5. Version Comparison
Compare package versions and check for available updates.

**Use when:**
- User asks "Is there a newer version?"
- Checking for package updates
- Comparing current vs. available versions
- Planning upgrade paths

**Examples:**
- "Is there a newer version of Microsoft.Extensions.Logging than 7.0.0?"
- "Compare Newtonsoft.Json versions 12.0.3 and 13.0.3"
- "Check if Azure.AI.OpenAI has updates"

**Implementation:**
```bash
python scripts/nuget_api.py compare "Microsoft.Extensions.Logging" --current "7.0.0"
```

**Output includes:**
- Current version
- Latest available version
- Update available (yes/no)
- Version difference (major/minor/patch)
- All versions between current and latest

### 6. Package Download Information
Get download URLs and package file information (useful for offline scenarios or tooling integration).

**Use when:**
- Need to download .nupkg files
- Offline package caching
- Custom tooling integration

**Examples:**
- "Get download URL for Newtonsoft.Json 13.0.3"
- "How do I download Microsoft.SemanticKernel?"

**Implementation:**
```bash
python scripts/nuget_api.py download-url "Newtonsoft.Json" --version "13.0.3"
```

## Workflow Decision Tree

```
User mentions NuGet package?
├─ Existence check? → Use: validate
├─ "What's the latest version?" → Use: metadata
├─ "Search for..." → Use: search
├─ "What does X depend on?" → Use: dependencies
├─ "Is there an update?" → Use: compare
└─ "Download" or "get URL" → Use: download-url
```

## Script Usage Reference

All operations use the `scripts/nuget_api.py` script with different commands:

### Validate Package Existence
```bash
python scripts/nuget_api.py validate <package-id> [--version VERSION]
```

### Get Package Metadata
```bash
python scripts/nuget_api.py metadata <package-id>
```

### Search Packages
```bash
python scripts/nuget_api.py search <query> [--limit LIMIT]
```

### Check Dependencies
```bash
python scripts/nuget_api.py dependencies <package-id> [--version VERSION]
```

### Compare Versions
```bash
python scripts/nuget_api.py compare <package-id> --current <current-version>
```

### Get Download URL
```bash
python scripts/nuget_api.py download-url <package-id> --version <version>
```

## Response Format Guidelines

When presenting NuGet information to users:

1. **For validation**: Simple yes/no with version confirmation
2. **For metadata**: Format as structured information (name, version, authors, description)
3. **For search**: Present as numbered list with key details
4. **For dependencies**: Show as hierarchical tree or grouped by framework
5. **For comparisons**: Clearly highlight current vs. latest, indicate update recommendation
6. **For downloads**: Provide direct URL and size information

## Error Handling

Common errors and how to handle them:

- **Package not found**: Suggest similar packages using search
- **Version not found**: Show available versions using metadata
- **API rate limiting**: Inform user and suggest retrying
- **Network errors**: Provide clear error message with suggestion to check connectivity

## Best Practices

1. **Always validate before metadata**: If unsure if a package exists, validate first
2. **Use exact package IDs**: NuGet package IDs are case-insensitive but maintain canonical casing
3. **Specify versions when relevant**: For dependencies and comparisons, specific versions matter
4. **Cache metadata when possible**: The script implements basic caching to avoid redundant API calls
5. **Check dependencies for major upgrades**: Before recommending upgrades, check dependency impacts

## Integration with .NET Development

This skill integrates seamlessly with .NET development workflows:

- When users modify .csproj files: Validate packages before adding
- When updating dependencies: Check for latest versions and breaking changes
- When troubleshooting: Analyze dependency conflicts
- When planning upgrades: Compare versions and review dependencies

## Resources

### scripts/nuget_api.py
Comprehensive Python script that interfaces with the NuGet V3 API. Handles all package operations including validation, metadata retrieval, search, dependency analysis, version comparison, and download information.

**Features:**
- Full NuGet V3 API integration
- JSON response parsing
- Error handling and validation
- Caching for performance
- Formatted output for easy consumption

### references/nuget_api_reference.md
Detailed documentation of the NuGet V3 API including endpoints, response formats, rate limits, and advanced usage patterns.

## Notes

- **API Version**: Uses NuGet V3 API (https://api.nuget.org/v3/index.json)
- **No Authentication Required**: NuGet.org API is publicly accessible
- **Rate Limiting**: NuGet.org may throttle excessive requests
- **Package IDs**: Case-insensitive but canonical casing is preferred
- **Versions**: Support SemVer 2.0 format
