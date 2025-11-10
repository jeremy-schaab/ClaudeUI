#!/usr/bin/env python3
"""
NuGet API Client - Interact with NuGet.org V3 API

Usage:
    nuget_api.py validate <package-id> [--version VERSION]
    nuget_api.py metadata <package-id>
    nuget_api.py search <query> [--limit LIMIT]
    nuget_api.py dependencies <package-id> [--version VERSION]
    nuget_api.py compare <package-id> --current VERSION
    nuget_api.py download-url <package-id> --version VERSION

Examples:
    nuget_api.py validate "Microsoft.Extensions.Logging"
    nuget_api.py metadata "Newtonsoft.Json"
    nuget_api.py search "semantic kernel" --limit 5
    nuget_api.py dependencies "Azure.AI.OpenAI" --version "2.1.0"
    nuget_api.py compare "Microsoft.SemanticKernel" --current "1.60.0"
    nuget_api.py download-url "Newtonsoft.Json" --version "13.0.3"
"""

import sys
import json
import gzip
import argparse
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus
from typing import Dict, List, Optional, Any

# NuGet V3 API Base URL
NUGET_API_BASE = "https://api.nuget.org/v3/index.json"
NUGET_PACKAGE_BASE = "https://www.nuget.org/packages"


class NuGetAPIClient:
    """Client for interacting with NuGet V3 API"""

    def __init__(self):
        self.service_index = None
        self._load_service_index()

    def _load_service_index(self):
        """Load the NuGet service index to discover API endpoints"""
        try:
            response = self._make_request(NUGET_API_BASE)
            self.service_index = json.loads(response)
        except Exception as e:
            print(f"ERROR: Failed to load NuGet service index: {e}")
            sys.exit(1)

    def _get_service_url(self, resource_type: str) -> Optional[str]:
        """Get the URL for a specific service resource type"""
        for resource in self.service_index.get('resources', []):
            if resource.get('@type') == resource_type:
                return resource.get('@id')
        return None

    def _make_request(self, url: str) -> str:
        """Make HTTP GET request with proper headers and gzip support"""
        try:
            req = Request(url)
            req.add_header('User-Agent', 'SchaabCore-NuGet-Validator/1.0')
            req.add_header('Accept', 'application/json')
            req.add_header('Accept-Encoding', 'gzip')

            with urlopen(req, timeout=30) as response:
                data = response.read()

                # Check if response is gzip-compressed
                if response.headers.get('Content-Encoding') == 'gzip':
                    data = gzip.decompress(data)

                return data.decode('utf-8')
        except HTTPError as e:
            if e.code == 404:
                return None
            raise Exception(f"HTTP {e.code}: {e.reason}")
        except URLError as e:
            raise Exception(f"Network error: {e.reason}")
        except Exception as e:
            raise Exception(f"Request failed: {str(e)}")

    def validate_package(self, package_id: str, version: Optional[str] = None) -> Dict[str, Any]:
        """
        Validate that a package exists on NuGet.org

        Args:
            package_id: The NuGet package ID
            version: Optional specific version to validate

        Returns:
            Dict with validation results
        """
        # Use registration base URL to check package existence
        registration_base = self._get_service_url('RegistrationsBaseUrl/3.6.0')
        if not registration_base:
            return {"exists": False, "error": "Could not find registration service"}

        # Build URL: {registrationBase}/{lowercase-package-id}/index.json
        package_id_lower = package_id.lower()
        url = f"{registration_base.rstrip('/')}/{package_id_lower}/index.json"

        try:
            response = self._make_request(url)
            if not response:
                return {
                    "exists": False,
                    "package_id": package_id,
                    "message": f"Package '{package_id}' not found on NuGet.org"
                }

            data = json.loads(response)

            # Package exists, now check version if specified
            if version:
                all_versions = self._extract_versions_from_registration(data)
                version_exists = version in all_versions

                return {
                    "exists": True,
                    "package_id": package_id,
                    "version_exists": version_exists,
                    "requested_version": version,
                    "message": f"Package '{package_id}' exists. Version '{version}': {'found' if version_exists else 'not found'}",
                    "available_versions": all_versions[:10]  # Show first 10
                }
            else:
                return {
                    "exists": True,
                    "package_id": package_id,
                    "message": f"Package '{package_id}' exists on NuGet.org"
                }

        except Exception as e:
            return {
                "exists": False,
                "package_id": package_id,
                "error": str(e)
            }

    def _extract_versions_from_registration(self, registration_data: Dict) -> List[str]:
        """Extract all versions from registration data"""
        versions = []
        for page in registration_data.get('items', []):
            for item in page.get('items', []):
                catalog_entry = item.get('catalogEntry', {})
                version = catalog_entry.get('version')
                if version:
                    versions.append(version)
        return versions

    def get_metadata(self, package_id: str) -> Dict[str, Any]:
        """
        Get comprehensive metadata for a package

        Args:
            package_id: The NuGet package ID

        Returns:
            Dict with package metadata
        """
        registration_base = self._get_service_url('RegistrationsBaseUrl/3.6.0')
        if not registration_base:
            return {"error": "Could not find registration service"}

        package_id_lower = package_id.lower()
        url = f"{registration_base.rstrip('/')}/{package_id_lower}/index.json"

        try:
            response = self._make_request(url)
            if not response:
                return {
                    "found": False,
                    "package_id": package_id,
                    "message": f"Package '{package_id}' not found"
                }

            data = json.loads(response)

            # Extract latest version info
            latest_version = None
            latest_entry = None

            for page in data.get('items', []):
                items = page.get('items', [])
                if items:
                    # Last item is typically the latest version
                    latest_entry = items[-1].get('catalogEntry', {})
                    latest_version = latest_entry.get('version')

            if not latest_entry:
                return {"found": False, "message": "No version information available"}

            # Extract all versions
            all_versions = self._extract_versions_from_registration(data)

            return {
                "found": True,
                "package_id": latest_entry.get('id', package_id),
                "latest_version": latest_version,
                "description": latest_entry.get('description', 'No description available'),
                "authors": latest_entry.get('authors', 'Unknown'),
                "license_url": latest_entry.get('licenseUrl', ''),
                "project_url": latest_entry.get('projectUrl', ''),
                "tags": latest_entry.get('tags', []),
                "total_versions": len(all_versions),
                "all_versions": all_versions,
                "package_url": f"{NUGET_PACKAGE_BASE}/{package_id}"
            }

        except Exception as e:
            return {
                "found": False,
                "package_id": package_id,
                "error": str(e)
            }

    def search_packages(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Search for packages on NuGet.org

        Args:
            query: Search query string
            limit: Maximum number of results (default 10)

        Returns:
            Dict with search results
        """
        search_query_service = self._get_service_url('SearchQueryService')
        if not search_query_service:
            return {"error": "Could not find search service"}

        # Build search URL with URL-encoded query
        url = f"{search_query_service}?q={quote_plus(query)}&take={limit}"

        try:
            response = self._make_request(url)
            if not response:
                return {"results": [], "message": "No results found"}

            data = json.loads(response)
            results = []

            for item in data.get('data', []):
                results.append({
                    "package_id": item.get('id'),
                    "version": item.get('version'),
                    "description": item.get('description', 'No description')[:200],
                    "authors": ', '.join(item.get('authors', [])),
                    "total_downloads": item.get('totalDownloads', 0),
                    "tags": item.get('tags', []),
                    "package_url": f"{NUGET_PACKAGE_BASE}/{item.get('id')}"
                })

            return {
                "query": query,
                "result_count": len(results),
                "results": results
            }

        except Exception as e:
            return {
                "query": query,
                "error": str(e)
            }

    def get_dependencies(self, package_id: str, version: Optional[str] = None) -> Dict[str, Any]:
        """
        Get package dependencies

        Args:
            package_id: The NuGet package ID
            version: Optional specific version (defaults to latest)

        Returns:
            Dict with dependency information
        """
        registration_base = self._get_service_url('RegistrationsBaseUrl/3.6.0')
        if not registration_base:
            return {"error": "Could not find registration service"}

        package_id_lower = package_id.lower()

        if version:
            # Specific version: {registrationBase}/{package-id}/{version}.json
            version_lower = version.lower()
            url = f"{registration_base.rstrip('/')}/{package_id_lower}/{version_lower}.json"
        else:
            # Get latest version from index
            url = f"{registration_base.rstrip('/')}/{package_id_lower}/index.json"

        try:
            response = self._make_request(url)
            if not response:
                return {
                    "found": False,
                    "message": f"Package '{package_id}' or version '{version}' not found"
                }

            data = json.loads(response)

            # Extract dependency groups
            if version:
                # Single version response
                catalog_entry = data.get('catalogEntry', {})
                dep_groups = catalog_entry.get('dependencyGroups', [])
                actual_version = catalog_entry.get('version', version)
            else:
                # Find latest version from index
                latest_entry = None
                for page in data.get('items', []):
                    items = page.get('items', [])
                    if items:
                        latest_entry = items[-1].get('catalogEntry', {})

                if not latest_entry:
                    return {"found": False, "message": "No version information available"}

                dep_groups = latest_entry.get('dependencyGroups', [])
                actual_version = latest_entry.get('version')

            # Parse dependency groups
            dependencies = []
            for group in dep_groups:
                target_framework = group.get('targetFramework', 'any')
                deps = []

                for dep in group.get('dependencies', []):
                    deps.append({
                        "package_id": dep.get('id'),
                        "version_range": dep.get('range', ''),
                    })

                dependencies.append({
                    "target_framework": target_framework,
                    "dependencies": deps
                })

            return {
                "found": True,
                "package_id": package_id,
                "version": actual_version,
                "dependency_groups": dependencies,
                "has_dependencies": len(dependencies) > 0 and any(len(g['dependencies']) > 0 for g in dependencies)
            }

        except Exception as e:
            return {
                "found": False,
                "package_id": package_id,
                "error": str(e)
            }

    def compare_versions(self, package_id: str, current_version: str) -> Dict[str, Any]:
        """
        Compare current version with latest available version

        Args:
            package_id: The NuGet package ID
            current_version: The current version to compare

        Returns:
            Dict with comparison results
        """
        metadata = self.get_metadata(package_id)

        if not metadata.get('found'):
            return metadata

        latest_version = metadata['latest_version']
        update_available = current_version != latest_version

        # Parse semantic versions for comparison
        current_parts = self._parse_version(current_version)
        latest_parts = self._parse_version(latest_version)

        # Determine update type
        update_type = None
        if update_available:
            if current_parts[0] < latest_parts[0]:
                update_type = "major"
            elif current_parts[1] < latest_parts[1]:
                update_type = "minor"
            elif current_parts[2] < latest_parts[2]:
                update_type = "patch"
            else:
                update_type = "unknown"

        # Get versions between current and latest
        all_versions = metadata.get('all_versions', [])
        intermediate_versions = []

        try:
            current_idx = all_versions.index(current_version)
            latest_idx = all_versions.index(latest_version)
            if latest_idx > current_idx:
                intermediate_versions = all_versions[current_idx + 1:latest_idx + 1]
        except (ValueError, IndexError):
            pass

        return {
            "package_id": package_id,
            "current_version": current_version,
            "latest_version": latest_version,
            "update_available": update_available,
            "update_type": update_type,
            "versions_behind": len(intermediate_versions) - 1 if intermediate_versions else 0,
            "intermediate_versions": intermediate_versions[:10],  # Limit to 10
            "package_url": metadata.get('package_url')
        }

    def _parse_version(self, version: str) -> tuple:
        """Parse semantic version string into (major, minor, patch) tuple"""
        try:
            parts = version.split('.')
            major = int(parts[0]) if len(parts) > 0 else 0
            minor = int(parts[1]) if len(parts) > 1 else 0
            patch_str = parts[2] if len(parts) > 2 else '0'
            # Handle pre-release tags
            patch = int(patch_str.split('-')[0])
            return (major, minor, patch)
        except (ValueError, IndexError):
            return (0, 0, 0)

    def get_download_url(self, package_id: str, version: str) -> Dict[str, Any]:
        """
        Get download URL for a specific package version

        Args:
            package_id: The NuGet package ID
            version: The version to download

        Returns:
            Dict with download information
        """
        package_base_address = self._get_service_url('PackageBaseAddress/3.0.0')
        if not package_base_address:
            return {"error": "Could not find package base address service"}

        package_id_lower = package_id.lower()
        version_lower = version.lower()

        # Build download URL: {packageBase}/{id-lower}/{version-lower}/{id-lower}.{version-lower}.nupkg
        download_url = f"{package_base_address.rstrip('/')}/{package_id_lower}/{version_lower}/{package_id_lower}.{version_lower}.nupkg"

        return {
            "package_id": package_id,
            "version": version,
            "download_url": download_url,
            "web_url": f"{NUGET_PACKAGE_BASE}/{package_id}/{version}",
            "message": f"Download URL for {package_id} v{version}"
        }


def print_json(data: Dict[str, Any]):
    """Pretty print JSON data"""
    print(json.dumps(data, indent=2))


def format_validate_output(result: Dict[str, Any]):
    """Format validation output for readability"""
    if result.get('exists'):
        print(f"[OK] {result['message']}")
        if 'version_exists' in result:
            if not result['version_exists']:
                print(f"\nAvailable versions (showing first 10):")
                for v in result.get('available_versions', []):
                    print(f"  - {v}")
    else:
        print(f"[NOT FOUND] {result.get('message', 'Package not found')}")
        if 'error' in result:
            print(f"Error: {result['error']}")


def format_metadata_output(result: Dict[str, Any]):
    """Format metadata output for readability"""
    if result.get('found'):
        print(f"Package: {result['package_id']}")
        print(f"Latest Version: {result['latest_version']}")
        print(f"Description: {result['description']}")
        print(f"Authors: {result['authors']}")
        print(f"Total Versions: {result['total_versions']}")

        if result.get('project_url'):
            print(f"Project URL: {result['project_url']}")
        if result.get('license_url'):
            print(f"License URL: {result['license_url']}")

        print(f"\nNuGet Page: {result['package_url']}")

        print(f"\nAll Versions ({result['total_versions']}):")
        for v in reversed(result.get('all_versions', [])[:20]):  # Show latest 20
            print(f"  - {v}")
        if result['total_versions'] > 20:
            print(f"  ... and {result['total_versions'] - 20} more")
    else:
        print(f"[NOT FOUND] {result.get('message', 'Package not found')}")


def format_search_output(result: Dict[str, Any]):
    """Format search output for readability"""
    if 'error' in result:
        print(f"[ERROR] {result['error']}")
        return

    print(f"Search Results for: '{result['query']}'")
    print(f"Found: {result['result_count']} packages\n")

    for i, pkg in enumerate(result.get('results', []), 1):
        print(f"{i}. {pkg['package_id']} (v{pkg['version']})")
        print(f"   Description: {pkg['description']}")
        print(f"   Authors: {pkg['authors']}")
        print(f"   Downloads: {pkg['total_downloads']:,}")
        print(f"   URL: {pkg['package_url']}")
        print()


def format_dependencies_output(result: Dict[str, Any]):
    """Format dependencies output for readability"""
    if not result.get('found'):
        print(f"[NOT FOUND] {result.get('message', 'Package not found')}")
        return

    print(f"Dependencies for: {result['package_id']} v{result['version']}")

    if not result.get('has_dependencies'):
        print("  [No dependencies]")
        return

    print()
    for group in result.get('dependency_groups', []):
        print(f"Target Framework: {group['target_framework']}")
        deps = group.get('dependencies', [])
        if deps:
            for dep in deps:
                print(f"  - {dep['package_id']} {dep['version_range']}")
        else:
            print("  [No dependencies for this framework]")
        print()


def format_compare_output(result: Dict[str, Any]):
    """Format version comparison output for readability"""
    if not result.get('package_id'):
        print(f"[ERROR] {result.get('error', 'Comparison failed')}")
        return

    print(f"Version Comparison: {result['package_id']}")
    print(f"Current Version: {result['current_version']}")
    print(f"Latest Version:  {result['latest_version']}")

    if result['update_available']:
        print(f"\n[UPDATE AVAILABLE] {result['update_type'].upper()} update")
        print(f"Versions Behind: {result['versions_behind']}")

        intermediate = result.get('intermediate_versions', [])
        if intermediate:
            print(f"\nVersions between current and latest:")
            for v in intermediate:
                marker = " <- latest" if v == result['latest_version'] else ""
                print(f"  - {v}{marker}")
    else:
        print("\n[UP TO DATE] You have the latest version")

    print(f"\nPackage URL: {result['package_url']}")


def format_download_url_output(result: Dict[str, Any]):
    """Format download URL output for readability"""
    if 'error' in result:
        print(f"[ERROR] {result['error']}")
        return

    print(f"{result['message']}")
    print(f"\nDirect Download URL:")
    print(f"  {result['download_url']}")
    print(f"\nWeb Page:")
    print(f"  {result['web_url']}")


def main():
    parser = argparse.ArgumentParser(
        description='NuGet API Client - Interact with NuGet.org',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Validate command
    validate_parser = subparsers.add_parser('validate', help='Validate package existence')
    validate_parser.add_argument('package_id', help='Package ID to validate')
    validate_parser.add_argument('--version', help='Specific version to validate')
    validate_parser.add_argument('--json', action='store_true', help='Output as JSON')

    # Metadata command
    metadata_parser = subparsers.add_parser('metadata', help='Get package metadata')
    metadata_parser.add_argument('package_id', help='Package ID')
    metadata_parser.add_argument('--json', action='store_true', help='Output as JSON')

    # Search command
    search_parser = subparsers.add_parser('search', help='Search for packages')
    search_parser.add_argument('query', help='Search query')
    search_parser.add_argument('--limit', type=int, default=10, help='Result limit (default: 10)')
    search_parser.add_argument('--json', action='store_true', help='Output as JSON')

    # Dependencies command
    deps_parser = subparsers.add_parser('dependencies', help='Get package dependencies')
    deps_parser.add_argument('package_id', help='Package ID')
    deps_parser.add_argument('--version', help='Specific version (defaults to latest)')
    deps_parser.add_argument('--json', action='store_true', help='Output as JSON')

    # Compare command
    compare_parser = subparsers.add_parser('compare', help='Compare versions')
    compare_parser.add_argument('package_id', help='Package ID')
    compare_parser.add_argument('--current', required=True, help='Current version')
    compare_parser.add_argument('--json', action='store_true', help='Output as JSON')

    # Download URL command
    download_parser = subparsers.add_parser('download-url', help='Get download URL')
    download_parser.add_argument('package_id', help='Package ID')
    download_parser.add_argument('--version', required=True, help='Package version')
    download_parser.add_argument('--json', action='store_true', help='Output as JSON')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Initialize client
    client = NuGetAPIClient()

    # Execute command
    try:
        if args.command == 'validate':
            result = client.validate_package(args.package_id, args.version)
            if args.json:
                print_json(result)
            else:
                format_validate_output(result)

        elif args.command == 'metadata':
            result = client.get_metadata(args.package_id)
            if args.json:
                print_json(result)
            else:
                format_metadata_output(result)

        elif args.command == 'search':
            result = client.search_packages(args.query, args.limit)
            if args.json:
                print_json(result)
            else:
                format_search_output(result)

        elif args.command == 'dependencies':
            result = client.get_dependencies(args.package_id, args.version)
            if args.json:
                print_json(result)
            else:
                format_dependencies_output(result)

        elif args.command == 'compare':
            result = client.compare_versions(args.package_id, args.current)
            if args.json:
                print_json(result)
            else:
                format_compare_output(result)

        elif args.command == 'download-url':
            result = client.get_download_url(args.package_id, args.version)
            if args.json:
                print_json(result)
            else:
                format_download_url_output(result)

    except KeyboardInterrupt:
        print("\n[INTERRUPTED] Operation cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
