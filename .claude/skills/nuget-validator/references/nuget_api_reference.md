# NuGet V3 API Reference

## Overview

This document provides detailed information about the NuGet V3 API used by the nuget-validator skill. The V3 API is the current standard for programmatic interaction with NuGet.org.

## Base Endpoints

### Service Index
```
https://api.nuget.org/v3/index.json
```

The service index is the entry point for the NuGet V3 API. It returns a JSON document describing all available API resources and their endpoints.

**Key Resource Types:**
- `SearchQueryService` - Package search
- `RegistrationsBaseUrl/3.6.0` - Package metadata and registration
- `PackageBaseAddress/3.0.0` - Package download URLs
- `SearchAutocompleteService` - Autocomplete for package IDs
- `PackagePublish/2.0.0` - Package publishing (requires authentication)

## API Resources

### 1. Package Registration (Metadata)

Registration endpoints provide comprehensive package information including versions, dependencies, and metadata.

**Base Pattern:**
```
{registrationBase}/{lowercase-package-id}/index.json
```

**Example:**
```
https://api.nuget.org/v3/registration5-gz-semver2/newtonsoft.json/index.json
```

**Response Structure:**
```json
{
  "@id": "https://api.nuget.org/v3/registration5-gz-semver2/newtonsoft.json/index.json",
  "@type": "catalog:CatalogRoot",
  "count": 1,
  "items": [
    {
      "@id": "https://api.nuget.org/v3/registration5-gz-semver2/newtonsoft.json/index.json#page/1.0.0/13.0.3",
      "count": 78,
      "items": [
        {
          "@id": "https://api.nuget.org/v3/registration5-gz-semver2/newtonsoft.json/13.0.3.json",
          "catalogEntry": {
            "@id": "https://api.nuget.org/v3/catalog0/data/2023.02.20.16.29.55/newtonsoft.json.13.0.3.json",
            "id": "Newtonsoft.Json",
            "version": "13.0.3",
            "description": "Json.NET is a popular high-performance JSON framework for .NET",
            "authors": "James Newton-King",
            "licenseUrl": "https://licenses.nuget.org/MIT",
            "projectUrl": "https://www.newtonsoft.com/json",
            "tags": ["json", "serialization"],
            "dependencyGroups": []
          }
        }
      ]
    }
  ]
}
```

**Specific Version URL:**
```
{registrationBase}/{lowercase-package-id}/{lowercase-version}.json
```

**Example:**
```
https://api.nuget.org/v3/registration5-gz-semver2/newtonsoft.json/13.0.3.json
```

### 2. Package Search

Search for packages by keyword or query.

**Endpoint Pattern:**
```
{searchQueryService}?q={query}&skip={skip}&take={take}&prerelease={true|false}
```

**Parameters:**
- `q` - Search query (required)
- `skip` - Number of results to skip (pagination)
- `take` - Number of results to return (default: 20, max: 100)
- `prerelease` - Include prerelease packages (default: true)

**Example:**
```
https://api-v2v3search-0.nuget.org/query?q=semantic+kernel&take=10
```

**Response Structure:**
```json
{
  "@context": {
    "@vocab": "http://schema.nuget.org/schema#"
  },
  "totalHits": 145,
  "data": [
    {
      "@id": "https://api.nuget.org/v3/registration5-gz-semver2/microsoft.semantickernel/index.json",
      "@type": "Package",
      "id": "Microsoft.SemanticKernel",
      "version": "1.65.0",
      "description": "Semantic Kernel is an SDK that integrates...",
      "authors": ["Microsoft"],
      "totalDownloads": 15000000,
      "verified": true,
      "tags": ["ai", "semantic-kernel"],
      "versions": [
        {
          "version": "1.65.0",
          "downloads": 50000,
          "@id": "https://api.nuget.org/v3/registration5-gz-semver2/microsoft.semantickernel/1.65.0.json"
        }
      ]
    }
  ]
}
```

### 3. Package Download

Get direct download URLs for .nupkg files.

**Pattern:**
```
{packageBaseAddress}/{lowercase-package-id}/{lowercase-version}/{lowercase-package-id}.{lowercase-version}.nupkg
```

**Example:**
```
https://api.nuget.org/v3-flatcontainer/newtonsoft.json/13.0.3/newtonsoft.json.13.0.3.nupkg
```

**Package Manifest (nuspec):**
```
{packageBaseAddress}/{lowercase-package-id}/{lowercase-version}/{lowercase-package-id}.nuspec
```

**List All Versions:**
```
{packageBaseAddress}/{lowercase-package-id}/index.json
```

### 4. Autocomplete

Autocomplete package IDs or versions.

**Package ID Autocomplete:**
```
{searchAutocompleteService}?q={query}&take={limit}
```

**Version Autocomplete:**
```
{searchAutocompleteService}?id={package-id}&prerelease={true|false}
```

**Example:**
```
https://api-v2v3search-0.nuget.org/autocomplete?q=microsoft.extensions&take=10
```

## Dependency Groups

Packages can have different dependencies for different target frameworks. This is represented in the `dependencyGroups` array.

**Structure:**
```json
{
  "dependencyGroups": [
    {
      "targetFramework": ".NETFramework4.6.2",
      "dependencies": [
        {
          "id": "System.Runtime",
          "range": "[4.3.0, )"
        }
      ]
    },
    {
      "targetFramework": ".NETStandard2.0",
      "dependencies": []
    }
  ]
}
```

**Common Target Framework Monikers (TFMs):**
- `.NETFramework4.6.2` - .NET Framework 4.6.2
- `.NETStandard2.0` - .NET Standard 2.0
- `.NETStandard2.1` - .NET Standard 2.1
- `net6.0` - .NET 6
- `net7.0` - .NET 7
- `net8.0` - .NET 8
- `net9.0` - .NET 9

**Version Range Syntax:**
- `[1.0.0]` - Exactly version 1.0.0
- `[1.0.0, )` - Version 1.0.0 or higher
- `[1.0.0, 2.0.0]` - Between 1.0.0 and 2.0.0 (inclusive)
- `(1.0.0, 2.0.0)` - Between 1.0.0 and 2.0.0 (exclusive)
- `[1.0.0, 2.0.0)` - 1.0.0 or higher, but less than 2.0.0

## Semantic Versioning (SemVer 2.0)

NuGet supports SemVer 2.0 versioning:

**Format:**
```
{major}.{minor}.{patch}[-{prerelease}][+{build}]
```

**Examples:**
- `1.0.0` - Release version
- `1.0.0-beta` - Pre-release version
- `1.0.0-beta.1` - Pre-release with iteration
- `1.0.0+20130313144700` - With build metadata

**Version Precedence:**
1. `1.0.0-alpha` < `1.0.0-beta` < `1.0.0-rc` < `1.0.0`
2. `1.0.0` < `1.0.1` < `1.1.0` < `2.0.0`

## Rate Limiting

NuGet.org implements rate limiting to prevent abuse:

**Limits:**
- Public API: ~300 requests per minute per IP
- Burst allowance: ~500 requests in short bursts
- No authentication required for read operations

**Best Practices:**
- Implement caching for repeated queries
- Use bulk operations when possible
- Respect 429 (Too Many Requests) responses
- Add reasonable delays between batch operations

**Rate Limit Headers:**
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 250
X-RateLimit-Reset: 1234567890
```

## Error Handling

**HTTP Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Package or version not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Temporary service issue

**Error Response Example:**
```json
{
  "error": {
    "code": "NotFound",
    "message": "Package 'NonExistentPackage' not found"
  }
}
```

## Advanced Usage Patterns

### Bulk Package Validation
When validating multiple packages:
1. Use registration index endpoints (fewer requests)
2. Cache results for repeated checks
3. Implement exponential backoff for errors

### Dependency Resolution
To resolve full dependency tree:
1. Get package dependencies from registration
2. Recursively fetch dependencies of dependencies
3. Detect circular dependencies
4. Consider target framework compatibility

### Version Range Matching
To find compatible versions:
1. Get all versions from registration index
2. Parse version range constraints
3. Filter versions using SemVer comparison
4. Sort by precedence rules

### Package Popularity Metrics
Combine multiple signals:
- Total downloads (from search API)
- Recent download trends
- GitHub stars (if project URL available)
- Last update date
- Number of versions (activity indicator)

## Caching Strategies

**Recommended Cache Durations:**
- Package existence: 1 hour
- Latest version: 5-15 minutes
- All versions list: 1 hour
- Package metadata: 1 hour
- Search results: 5-15 minutes
- Specific version data: Indefinite (immutable)

**Cache Invalidation:**
- New versions published: Invalidate latest version cache
- Package unlisted: Rare, but invalidate all caches

## Security Considerations

### Package Verification
- Check `verified` flag in search results (Microsoft/trusted publishers)
- Validate package signatures (not exposed in V3 API)
- Review authors and project URLs
- Check license information

### Dependency Security
- Analyze transitive dependencies for vulnerabilities
- Use GitHub Advisory Database integration
- Check deprecation warnings
- Monitor for package hijacking (sudden author changes)

## API Evolution

**Version History:**
- V1 - Legacy OData API (deprecated)
- V2 - OData-based API (still supported, limited features)
- V3 - Current JSON-based API (recommended)

**V3 Compatibility:**
- Registration endpoints: V3.0, V3.4, V3.6 (use 3.6 for best compatibility)
- SemVer 2.0 support: Use endpoints with `semver2` in URL

## Related Resources

- **Official Documentation**: https://learn.microsoft.com/en-us/nuget/api/overview
- **NuGet Gallery Source**: https://github.com/NuGet/NuGetGallery
- **Protocol Documentation**: https://learn.microsoft.com/en-us/nuget/api/registration-base-url-resource
- **Client Libraries**: https://www.nuget.org/packages/NuGet.Protocol/

## Example Workflows

### Find Latest .NET 9 Compatible Package
```bash
1. Search for package: GET /query?q=package-name
2. Get registration: GET /registration/{id}/index.json
3. Check dependency groups for net9.0 TFM
4. Identify latest version supporting .NET 9
```

### Upgrade Path Analysis
```bash
1. Get current package metadata
2. Get all versions between current and latest
3. For each intermediate version:
   - Check breaking changes (major version bumps)
   - Review dependencies changes
   - Check for deprecation warnings
4. Recommend safest upgrade path
```

### Dependency Conflict Detection
```bash
1. Get dependencies for package A version X
2. Get dependencies for package B version Y
3. Compare shared dependencies
4. Identify version range conflicts
5. Suggest compatible version combinations
```
