#!/usr/bin/env python3
"""
Playwright Environment Setup Script
Automatically configures Playwright test environment for .NET Blazor projects
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path
from typing import Optional, List

class PlaywrightSetup:
    def __init__(self, project_path: str, test_project: str, blazor_url: str,
                 headless: bool, browsers: List[str]):
        self.project_path = Path(project_path).resolve()
        self.test_project_name = test_project
        self.blazor_url = blazor_url
        self.headless = headless
        self.browsers = browsers

        # Find solution file
        self.solution_file = self._find_solution()
        if not self.solution_file:
            raise FileNotFoundError(f"No .sln file found in {self.project_path}")

        self.solution_name = self.solution_file.stem

        # Set test project name if not provided
        if not self.test_project_name:
            self.test_project_name = f"{self.solution_name}.PlaywrightTests"

        self.test_project_path = self.project_path / self.test_project_name

    def _find_solution(self) -> Optional[Path]:
        """Find the first .sln file in project directory"""
        sln_files = list(self.project_path.glob("*.sln"))
        return sln_files[0] if sln_files else None

    def check_existing_config(self) -> bool:
        """Check if Playwright is already configured"""
        config_files = [
            self.test_project_path / "playwright.config.ts",
            self.test_project_path / "playwright.config.js",
        ]
        return any(f.exists() for f in config_files)

    def create_test_project(self):
        """Create test project if it doesn't exist"""
        if self.test_project_path.exists():
            print(f"Test project already exists: {self.test_project_path}")
            return

        print(f"Creating test project: {self.test_project_name}")

        # Create xUnit test project
        result = subprocess.run(
            ["dotnet", "new", "xunit", "-n", self.test_project_name, "-o", str(self.test_project_path)],
            cwd=self.project_path,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to create test project: {result.stderr}")

        # Add to solution
        subprocess.run(
            ["dotnet", "sln", str(self.solution_file), "add", str(self.test_project_path)],
            cwd=self.project_path
        )

        print(f"Test project created: {self.test_project_path}")

    def install_playwright_package(self):
        """Install Microsoft.Playwright NuGet package"""
        print("Installing Microsoft.Playwright package...")

        result = subprocess.run(
            ["dotnet", "add", "package", "Microsoft.Playwright", "--version", "1.49.0"],
            cwd=self.test_project_path,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to install Playwright package: {result.stderr}")

        # Also install MSTest.Playwright for better integration
        subprocess.run(
            ["dotnet", "add", "package", "Microsoft.Playwright.MSTest"],
            cwd=self.test_project_path,
            capture_output=True,
            text=True
        )

        print("Playwright packages installed")

    def install_browsers(self):
        """Install Playwright browsers"""
        print(f"Installing Playwright browsers: {', '.join(self.browsers)}")

        # Build the project first to get Playwright CLI
        subprocess.run(
            ["dotnet", "build"],
            cwd=self.test_project_path,
            capture_output=True
        )

        # Find playwright.ps1
        playwright_cli = self.test_project_path / "bin" / "Debug" / "net9.0" / "playwright.ps1"

        if not playwright_cli.exists():
            # Try net8.0
            playwright_cli = self.test_project_path / "bin" / "Debug" / "net8.0" / "playwright.ps1"

        if not playwright_cli.exists():
            raise FileNotFoundError("Playwright CLI not found. Please build the project first.")

        # Install browsers
        result = subprocess.run(
            ["pwsh", str(playwright_cli), "install"] + self.browsers,
            cwd=self.test_project_path,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"Warning: Browser installation had issues: {result.stderr}")
        else:
            print("Browsers installed successfully")

    def create_config_file(self):
        """Create playwright.config.ts file"""
        config_path = self.test_project_path / "playwright.config.ts"

        if config_path.exists():
            print(f"Config file already exists: {config_path}")
            return

        config_content = f"""import {{ defineConfig, devices }} from '@playwright/test';

/**
 * Playwright configuration for {self.test_project_name}
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({{
  testDir: './Tests',

  /* Maximum time one test can run for */
  timeout: 30 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
    ['junit', {{ outputFile: 'test-results/junit.xml' }}]
  ],

  /* Shared settings for all the projects below */
  use: {{
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: '{self.blazor_url}',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Headless mode */
    headless: {str(self.headless).lower()},
  }},

  /* Configure projects for major browsers */
  projects: [
    {{
      name: 'chromium',
      use: {{ ...devices['Desktop Chrome'] }},
    }},
    {{
      name: 'firefox',
      use: {{ ...devices['Desktop Firefox'] }},
    }},
    {{
      name: 'webkit',
      use: {{ ...devices['Desktop Safari'] }},
    }},

    /* Test against mobile viewports */
    // {{
    //   name: 'Mobile Chrome',
    //   use: {{ ...devices['Pixel 5'] }},
    // }},
    // {{
    //   name: 'Mobile Safari',
    //   use: {{ ...devices['iPhone 12'] }},
    // }},
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {{
  //   command: 'dotnet run --project ../YourBlazorApp',
  //   url: '{self.blazor_url}',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // }},
}});
"""

        config_path.write_text(config_content, encoding='utf-8')
        print(f"Created config file: {config_path}")

    def create_base_test_class(self):
        """Create base test class with setup/teardown"""
        base_class_path = self.test_project_path / "PlaywrightTest.cs"

        if base_class_path.exists():
            print(f"Base test class already exists: {base_class_path}")
            return

        base_class_content = f"""using Microsoft.Playwright;
using Microsoft.Playwright.MSTest;
using Xunit;

namespace {self.test_project_name};

/// <summary>
/// Base test class with Playwright setup and teardown
/// </summary>
public class PlaywrightTest : IAsyncLifetime
{{
    protected IPlaywright? Playwright {{ get; private set; }}
    protected IBrowser? Browser {{ get; private set; }}
    protected IBrowserContext? Context {{ get; private set; }}
    protected IPage? Page {{ get; private set; }}

    protected virtual BrowserTypeLaunchOptions LaunchOptions => new()
    {{
        Headless = {str(self.headless).lower()},
        SlowMo = 0 // Increase for debugging (milliseconds)
    }};

    protected virtual BrowserNewContextOptions ContextOptions => new()
    {{
        BaseURL = "{self.blazor_url}",
        ViewportSize = new() {{ Width = 1280, Height = 720 }},
        IgnoreHTTPSErrors = true // Only for dev/test environments
    }};

    public virtual async Task InitializeAsync()
    {{
        // Install playwright if needed
        Program.Main(new[] {{ "install" }});

        Playwright = await Microsoft.Playwright.Playwright.CreateAsync();
        Browser = await Playwright.Chromium.LaunchAsync(LaunchOptions);
        Context = await Browser.NewContextAsync(ContextOptions);
        Page = await Context.NewPageAsync();

        // Optional: Enable console message logging
        Page.Console += (_, msg) => Console.WriteLine($"Browser Console: {{msg.Text}}");
    }}

    public virtual async Task DisposeAsync()
    {{
        if (Page != null) await Page.CloseAsync();
        if (Context != null) await Context.CloseAsync();
        if (Browser != null) await Browser.CloseAsync();
        Playwright?.Dispose();
    }}

    /// <summary>
    /// Navigate to a page and wait for Blazor to finish loading
    /// </summary>
    protected async Task NavigateAndWaitForBlazorAsync(string url)
    {{
        await Page!.GotoAsync(url);
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Optional: Wait for Blazor specific indicator
        // await Page.WaitForSelectorAsync("[data-blazor-loaded='true']");
    }}

    /// <summary>
    /// Wait for Blazor to finish rendering after an interaction
    /// </summary>
    protected async Task WaitForBlazorRenderAsync()
    {{
        await Page!.WaitForLoadStateAsync(LoadState.NetworkIdle);
        await Task.Delay(100); // Small buffer for Blazor rendering
    }}
}}
"""

        base_class_path.write_text(base_class_content, encoding='utf-8')
        print(f"Created base test class: {base_class_path}")

    def create_directory_structure(self):
        """Create test directory structure"""
        directories = [
            self.test_project_path / "Tests",
            self.test_project_path / "PageObjects",
            self.test_project_path / "Fixtures",
            self.test_project_path / "Helpers"
        ]

        for directory in directories:
            directory.mkdir(exist_ok=True)

        print("Created test directory structure")

    def create_global_usings(self):
        """Create GlobalUsings.cs for common imports"""
        global_usings_path = self.test_project_path / "GlobalUsings.cs"

        if global_usings_path.exists():
            return

        content = """global using Xunit;
global using Microsoft.Playwright;
global using System.Threading.Tasks;
"""

        global_usings_path.write_text(content, encoding='utf-8')
        print("Created GlobalUsings.cs")

    def create_sample_test(self):
        """Create a sample test to verify setup"""
        sample_test_path = self.test_project_path / "Tests" / "SampleTest.cs"

        if sample_test_path.exists():
            return

        content = f"""namespace {self.test_project_name}.Tests;

public class SampleTest : PlaywrightTest
{{
    [Fact]
    public async Task HomePage_ShouldLoad_Successfully()
    {{
        // Arrange & Act
        await NavigateAndWaitForBlazorAsync("/");

        // Assert
        Assert.NotNull(Page);
        await Assertions.Expect(Page).ToHaveTitleAsync(new System.Text.RegularExpressions.Regex(".+"));
    }}
}}
"""

        sample_test_path.write_text(content, encoding='utf-8')
        print(f"Created sample test: {sample_test_path}")

    def run(self):
        """Execute full setup workflow"""
        print("=" * 60)
        print(f"Playwright Setup for {self.solution_name}")
        print("=" * 60)

        try:
            # Check existing config
            if self.check_existing_config():
                print("\nPlaywright configuration already exists!")
                response = input("Do you want to continue and potentially overwrite? (y/n): ")
                if response.lower() != 'y':
                    print("Setup cancelled")
                    return

            # Step 1: Create test project
            self.create_test_project()

            # Step 2: Install Playwright package
            self.install_playwright_package()

            # Step 3: Create directory structure
            self.create_directory_structure()

            # Step 4: Create base test class
            self.create_base_test_class()

            # Step 5: Create global usings
            self.create_global_usings()

            # Step 6: Create sample test
            self.create_sample_test()

            # Step 7: Create config file
            self.create_config_file()

            # Step 8: Install browsers
            self.install_browsers()

            print("\n" + "=" * 60)
            print("Setup Complete!")
            print("=" * 60)
            print(f"\nTest project created at: {self.test_project_path}")
            print(f"\nNext steps:")
            print(f"1. cd {self.test_project_path}")
            print(f"2. dotnet test")
            print(f"3. Generate more tests using generate_tests.py")

        except Exception as e:
            print(f"\nError during setup: {e}", file=sys.stderr)
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Setup Playwright test environment for .NET Blazor projects")
    parser.add_argument("--project-path", required=True, help="Path to .NET solution directory")
    parser.add_argument("--test-project", help="Name of test project (default: {SolutionName}.PlaywrightTests)")
    parser.add_argument("--blazor-url", default="https://localhost:5001", help="Base URL for Blazor app")
    parser.add_argument("--headless", type=bool, default=True, help="Run tests in headless mode")
    parser.add_argument("--browsers", default="chromium,firefox,webkit", help="Comma-separated list of browsers")

    args = parser.parse_args()

    browsers = [b.strip() for b in args.browsers.split(',')]

    setup = PlaywrightSetup(
        project_path=args.project_path,
        test_project=args.test_project,
        blazor_url=args.blazor_url,
        headless=args.headless,
        browsers=browsers
    )

    setup.run()

if __name__ == "__main__":
    main()
