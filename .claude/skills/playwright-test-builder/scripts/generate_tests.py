#!/usr/bin/env python3
"""
Test Case Generator
Generates xUnit test cases from page objects and scenario definitions
"""

import os
import json
import argparse
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass

@dataclass
class TestScenario:
    """Test scenario definition"""
    name: str
    description: str
    steps: List[str]
    expected_result: str
    category: str = "functional"
    priority: str = "medium"

class TestGenerator:
    def __init__(self, test_project_name: str):
        self.test_project_name = test_project_name

    def generate_auth_tests(self, page_name: str) -> str:
        """Generate authentication tests"""
        return f"""using {self.test_project_name}.PageObjects;

namespace {self.test_project_name}.Tests;

public class {page_name}AuthTests : PlaywrightTest
{{
    [Fact]
    public async Task Login_WithValidCredentials_ShouldSucceed()
    {{
        // Arrange
        var loginPage = new {page_name}Page(Page!);
        await loginPage.NavigateAsync();

        // Act
        await loginPage.FillEmailInputAsync("test@example.com");
        await loginPage.FillPasswordInputAsync("Password123!");
        await loginPage.ClickLoginButtonAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        await Assertions.Expect(Page!).ToHaveURLAsync(new System.Text.RegularExpressions.Regex("/"));
    }}

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldShowError()
    {{
        // Arrange
        var loginPage = new {page_name}Page(Page!);
        await loginPage.NavigateAsync();

        // Act
        await loginPage.FillEmailInputAsync("invalid@example.com");
        await loginPage.FillPasswordInputAsync("wrongpassword");
        await loginPage.ClickLoginButtonAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        var errorMessage = Page!.GetByTestId("error-message");
        await Assertions.Expect(errorMessage).ToBeVisibleAsync();
    }}

    [Fact]
    public async Task Login_WithEmptyFields_ShouldShowValidationErrors()
    {{
        // Arrange
        var loginPage = new {page_name}Page(Page!);
        await loginPage.NavigateAsync();

        // Act
        await loginPage.ClickLoginButtonAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        var validationErrors = Page!.Locator(".validation-message");
        await Assertions.Expect(validationErrors).Not.ToHaveCountAsync(0);
    }}
}}
"""

    def generate_navigation_tests(self, page_name: str, route: str) -> str:
        """Generate navigation tests"""
        return f"""using {self.test_project_name}.PageObjects;

namespace {self.test_project_name}.Tests;

public class {page_name}NavigationTests : PlaywrightTest
{{
    [Fact]
    public async Task {page_name}_ShouldLoad_Successfully()
    {{
        // Arrange
        var page = new {page_name}Page(Page!);

        // Act
        await page.NavigateAsync();

        // Assert
        await page.AssertPageLoadedAsync();
    }}

    [Fact]
    public async Task {page_name}_ShouldHaveCorrectTitle()
    {{
        // Arrange
        var page = new {page_name}Page(Page!);

        // Act
        await page.NavigateAsync();

        // Assert
        await Assertions.Expect(Page!).ToHaveTitleAsync(new System.Text.RegularExpressions.Regex(".+"));
    }}

    [Fact]
    public async Task NavigateTo{page_name}_FromHomePage_ShouldSucceed()
    {{
        // Arrange
        await NavigateAndWaitForBlazorAsync("/");

        // Act
        var link = Page!.GetByRole(AriaRole.Link, new() {{ Name = "{page_name}" }});
        await link.ClickAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        await Assertions.Expect(Page!).ToHaveURLAsync(new System.Text.RegularExpressions.Regex("{route}"));
    }}
}}
"""

    def generate_form_tests(self, page_name: str) -> str:
        """Generate form validation tests"""
        return f"""using {self.test_project_name}.PageObjects;

namespace {self.test_project_name}.Tests;

public class {page_name}FormTests : PlaywrightTest
{{
    [Fact]
    public async Task SubmitForm_WithValidData_ShouldSucceed()
    {{
        // Arrange
        var page = new {page_name}Page(Page!);
        await page.NavigateAsync();

        // Act
        // TODO: Fill form fields with valid data
        // await page.FillFieldAsync("valid-value");
        // await page.ClickSubmitButtonAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        // TODO: Verify success message or redirect
        // await Assertions.Expect(Page!.GetByTestId("success-message")).ToBeVisibleAsync();
    }}

    [Fact]
    public async Task SubmitForm_WithInvalidData_ShouldShowValidationErrors()
    {{
        // Arrange
        var page = new {page_name}Page(Page!);
        await page.NavigateAsync();

        // Act
        // TODO: Submit form with invalid data
        // await page.ClickSubmitButtonAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        var validationErrors = Page!.Locator(".validation-message");
        await Assertions.Expect(validationErrors).Not.ToHaveCountAsync(0);
    }}

    [Theory]
    [InlineData("", "Field is required")]
    [InlineData("invalid", "Field must be valid")]
    public async Task FormField_WithInvalidInput_ShouldShowSpecificError(string input, string expectedError)
    {{
        // Arrange
        var page = new {page_name}Page(Page!);
        await page.NavigateAsync();

        // Act
        // TODO: Fill field with test data
        // await page.FillFieldAsync(input);
        // await page.ClickSubmitButtonAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        var errorMessage = Page!.GetByText(expectedError);
        await Assertions.Expect(errorMessage).ToBeVisibleAsync();
    }}
}}
"""

    def generate_crud_tests(self, page_name: str, entity_name: str) -> str:
        """Generate CRUD operation tests"""
        return f"""using {self.test_project_name}.PageObjects;

namespace {self.test_project_name}.Tests;

public class {page_name}CrudTests : PlaywrightTest
{{
    [Fact]
    public async Task Create{entity_name}_WithValidData_ShouldSucceed()
    {{
        // Arrange
        var page = new {page_name}Page(Page!);
        await page.NavigateAsync();

        // Act
        await page.ClickCreateButtonAsync();
        await WaitForBlazorRenderAsync();

        // TODO: Fill form with valid data
        await page.ClickSaveButtonAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        var successMessage = Page!.GetByTestId("success-message");
        await Assertions.Expect(successMessage).ToBeVisibleAsync();
    }}

    [Fact]
    public async Task Read{entity_name}List_ShouldDisplayItems()
    {{
        // Arrange
        var page = new {page_name}Page(Page!);

        // Act
        await page.NavigateAsync();

        // Assert
        var grid = Page!.GetByTestId("data-grid");
        await Assertions.Expect(grid).ToBeVisibleAsync();

        var rows = Page!.Locator("tr[data-row]");
        await Assertions.Expect(rows).Not.ToHaveCountAsync(0);
    }}

    [Fact]
    public async Task Update{entity_name}_WithValidData_ShouldSucceed()
    {{
        // Arrange
        var page = new {page_name}Page(Page!);
        await page.NavigateAsync();

        // Act
        var editButton = Page!.GetByTestId("edit-button").First;
        await editButton.ClickAsync();
        await WaitForBlazorRenderAsync();

        // TODO: Update form fields
        await page.ClickSaveButtonAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        var successMessage = Page!.GetByTestId("success-message");
        await Assertions.Expect(successMessage).ToBeVisibleAsync();
    }}

    [Fact]
    public async Task Delete{entity_name}_WithConfirmation_ShouldSucceed()
    {{
        // Arrange
        var page = new {page_name}Page(Page!);
        await page.NavigateAsync();

        var initialRowCount = await Page!.Locator("tr[data-row]").CountAsync();

        // Act
        var deleteButton = Page!.GetByTestId("delete-button").First;
        await deleteButton.ClickAsync();
        await WaitForBlazorRenderAsync();

        var confirmButton = Page!.GetByRole(AriaRole.Button, new() {{ Name = "Confirm" }});
        await confirmButton.ClickAsync();
        await WaitForBlazorRenderAsync();

        // Assert
        var newRowCount = await Page!.Locator("tr[data-row]").CountAsync();
        Assert.True(newRowCount < initialRowCount, "Row count should decrease after deletion");
    }}
}}
"""

    def generate_scenario_tests(self, page_name: str, scenarios: List[TestScenario]) -> str:
        """Generate tests from scenario definitions"""
        tests = []

        for scenario in scenarios:
            test_method = f"""    [Fact]
    public async Task {self._to_test_method_name(scenario.name)}()
    {{
        // Scenario: {scenario.description}

        // Arrange
        var page = new {page_name}Page(Page!);
        await page.NavigateAsync();

        // Act
"""

            for step in scenario.steps:
                tests.append(f"        // Step: {step}")
                tests.append(f"        // TODO: Implement step\n")

            test_method += "\n".join(tests)
            test_method += f"""
        // Assert
        // Expected: {scenario.expected_result}
        // TODO: Add assertions
    }}

"""
            tests.append(test_method)

        return f"""using {self.test_project_name}.PageObjects;

namespace {self.test_project_name}.Tests;

/// <summary>
/// Scenario-based tests for {page_name}
/// </summary>
public class {page_name}ScenarioTests : PlaywrightTest
{{
{"".join(tests)}
}}
"""

    def _to_test_method_name(self, scenario_name: str) -> str:
        """Convert scenario name to valid C# method name"""
        # Remove special characters and convert to PascalCase
        import re
        words = re.sub(r'[^a-zA-Z0-9]', ' ', scenario_name).split()
        return ''.join(word.capitalize() for word in words)

def main():
    parser = argparse.ArgumentParser(description="Generate test cases from page objects")
    parser.add_argument("--pages", required=True, help="Comma-separated page names")
    parser.add_argument("--scenarios", help="Path to scenarios JSON file")
    parser.add_argument("--output", required=True, help="Output directory for tests")
    parser.add_argument("--test-project", default="PlaywrightTests", help="Test project name")
    parser.add_argument("--types", default="navigation,auth,form", help="Test types to generate")

    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    page_names = [p.strip() for p in args.pages.split(',')]
    test_types = [t.strip() for t in args.types.split(',')]

    generator = TestGenerator(args.test_project)

    scenarios = []
    if args.scenarios:
        scenarios_path = Path(args.scenarios)
        if scenarios_path.exists():
            with open(scenarios_path, 'r') as f:
                scenarios_data = json.load(f)
                scenarios = [TestScenario(**s) for s in scenarios_data]

    for page_name in page_names:
        print(f"Generating tests for {page_name}...")

        if "navigation" in test_types:
            nav_tests = generator.generate_navigation_tests(page_name, f"/{page_name.lower()}")
            nav_file = output_dir / f"{page_name}NavigationTests.cs"
            nav_file.write_text(nav_tests, encoding='utf-8')
            print(f"  Created: {nav_file}")

        if "auth" in test_types and "login" in page_name.lower():
            auth_tests = generator.generate_auth_tests(page_name)
            auth_file = output_dir / f"{page_name}AuthTests.cs"
            auth_file.write_text(auth_tests, encoding='utf-8')
            print(f"  Created: {auth_file}")

        if "form" in test_types:
            form_tests = generator.generate_form_tests(page_name)
            form_file = output_dir / f"{page_name}FormTests.cs"
            form_file.write_text(form_tests, encoding='utf-8')
            print(f"  Created: {form_file}")

        if "crud" in test_types:
            entity_name = page_name.replace("List", "").replace("Page", "")
            crud_tests = generator.generate_crud_tests(page_name, entity_name)
            crud_file = output_dir / f"{page_name}CrudTests.cs"
            crud_file.write_text(crud_tests, encoding='utf-8')
            print(f"  Created: {crud_file}")

        if scenarios:
            page_scenarios = [s for s in scenarios if page_name.lower() in s.name.lower()]
            if page_scenarios:
                scenario_tests = generator.generate_scenario_tests(page_name, page_scenarios)
                scenario_file = output_dir / f"{page_name}ScenarioTests.cs"
                scenario_file.write_text(scenario_tests, encoding='utf-8')
                print(f"  Created: {scenario_file}")

    print("\nTest generation complete!")

if __name__ == "__main__":
    main()
