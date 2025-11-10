#!/usr/bin/env python3
"""
Page Object Generator for Blazor Components
Analyzes Razor files and generates strongly-typed page object models
"""

import os
import re
import argparse
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class PageElement:
    """Represents an interactive element on a Blazor page"""
    name: str
    element_type: str  # button, input, select, etc.
    locator_strategy: str  # data-testid, role, css
    locator_value: str
    description: str = ""

@dataclass
class PageInfo:
    """Information about a Blazor page"""
    page_name: str
    route: str
    namespace: str
    elements: List[PageElement]
    requires_auth: bool = False

class BlazorPageAnalyzer:
    def __init__(self, razor_file_path: Path):
        self.file_path = razor_file_path
        self.content = razor_file_path.read_text(encoding='utf-8')

    def extract_route(self) -> str:
        """Extract @page directive route"""
        match = re.search(r'@page\s+"([^"]+)"', self.content)
        return match.group(1) if match else "/"

    def extract_page_name(self) -> str:
        """Get page name from file name"""
        return self.file_path.stem

    def check_requires_auth(self) -> bool:
        """Check if page requires authentication"""
        return '@attribute [Authorize]' in self.content or '<AuthorizeView' in self.content

    def extract_elements(self) -> List[PageElement]:
        """Extract interactive elements from Razor markup"""
        elements = []

        # Pattern: data-testid
        testid_pattern = r'<(\w+)[^>]*data-testid="([^"]+)"[^>]*>(?:([^<]+)<)?'
        for match in re.finditer(testid_pattern, self.content):
            tag, testid, text = match.groups()
            elements.append(PageElement(
                name=self._to_pascal_case(testid),
                element_type=tag.lower(),
                locator_strategy="data-testid",
                locator_value=testid,
                description=text.strip() if text else ""
            ))

        # Pattern: buttons with text
        button_pattern = r'<button[^>]*>([\w\s]+)</button>'
        for match in re.finditer(button_pattern, self.content):
            button_text = match.group(1).strip()
            if not any(e.description == button_text for e in elements):
                elements.append(PageElement(
                    name=self._to_pascal_case(button_text) + "Button",
                    element_type="button",
                    locator_strategy="role",
                    locator_value=button_text,
                    description=button_text
                ))

        # Pattern: input fields with labels or placeholders
        input_pattern = r'<input[^>]*(?:placeholder="([^"]+)"|id="([^"]+)")[^>]*>'
        for match in re.finditer(input_pattern, self.content):
            placeholder, input_id = match.groups()
            identifier = placeholder or input_id
            if identifier and not any(e.name.lower() == identifier.lower() for e in elements):
                elements.append(PageElement(
                    name=self._to_pascal_case(identifier) + "Input",
                    element_type="input",
                    locator_strategy="placeholder" if placeholder else "css",
                    locator_value=identifier,
                    description=f"Input field: {identifier}"
                ))

        # Pattern: Telerik components
        telerik_pattern = r'<Telerik(\w+)[^>]*(?:data-testid="([^"]+)"|Id="([^"]+)")[^>]*>'
        for match in re.finditer(telerik_pattern, self.content):
            component, testid, component_id = match.groups()
            identifier = testid or component_id
            if identifier:
                elements.append(PageElement(
                    name=self._to_pascal_case(identifier),
                    element_type=f"telerik-{component.lower()}",
                    locator_strategy="data-testid" if testid else "css",
                    locator_value=testid or f"#{component_id}",
                    description=f"Telerik {component} component"
                ))

        return elements

    def _to_pascal_case(self, text: str) -> str:
        """Convert text to PascalCase"""
        # Remove special characters and split
        words = re.sub(r'[^a-zA-Z0-9]', ' ', text).split()
        return ''.join(word.capitalize() for word in words)

    def analyze(self) -> PageInfo:
        """Perform full page analysis"""
        return PageInfo(
            page_name=self.extract_page_name(),
            route=self.extract_route(),
            namespace="PageObjects",
            elements=self.extract_elements(),
            requires_auth=self.check_requires_auth()
        )

class PageObjectGenerator:
    def __init__(self, page_info: PageInfo, test_project_name: str):
        self.page_info = page_info
        self.test_project_name = test_project_name

    def generate(self) -> str:
        """Generate C# page object class"""
        class_name = f"{self.page_info.page_name}Page"

        # Header
        code = f"""using Microsoft.Playwright;

namespace {self.test_project_name}.{self.page_info.namespace};

/// <summary>
/// Page Object for {self.page_info.page_name}
/// Route: {self.page_info.route}
/// Requires Auth: {self.page_info.requires_auth}
/// </summary>
public class {class_name}
{{
    private readonly IPage _page;
    private const string PageRoute = "{self.page_info.route}";

    public {class_name}(IPage page)
    {{
        _page = page;
    }}

    #region Locators

"""

        # Generate locators
        for element in self.page_info.elements:
            code += self._generate_locator(element)

        code += """    #endregion

    #region Navigation

    /// <summary>
    /// Navigate to this page and wait for Blazor to load
    /// </summary>
    public async Task NavigateAsync()
    {
        await _page.GotoAsync(PageRoute);
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }

    /// <summary>
    /// Check if currently on this page
    /// </summary>
    public async Task<bool> IsOnPageAsync()
    {
        var url = _page.Url;
        return url.Contains(PageRoute);
    }

    #endregion

    #region Actions

"""

        # Generate action methods
        for element in self.page_info.elements:
            code += self._generate_action_method(element)

        code += """    #endregion

    #region Assertions

    /// <summary>
    /// Assert that the page is loaded
    /// </summary>
    public async Task AssertPageLoadedAsync()
    {
        await Assertions.Expect(_page).ToHaveURLAsync(new System.Text.RegularExpressions.Regex(PageRoute));
    }

    #endregion
}
"""

        return code

    def _generate_locator(self, element: PageElement) -> str:
        """Generate locator property for element"""
        locator_code = self._get_locator_code(element)

        return f"""    /// <summary>
    /// {element.description or f'{element.element_type} element'}
    /// </summary>
    public ILocator {element.name} => {locator_code};

"""

    def _get_locator_code(self, element: PageElement) -> str:
        """Generate Playwright locator code"""
        if element.locator_strategy == "data-testid":
            return f'_page.GetByTestId("{element.locator_value}")'
        elif element.locator_strategy == "role":
            return f'_page.GetByRole(AriaRole.Button, new() {{ Name = "{element.locator_value}" }})'
        elif element.locator_strategy == "placeholder":
            return f'_page.GetByPlaceholder("{element.locator_value}")'
        elif element.locator_strategy == "css":
            return f'_page.Locator("{element.locator_value}")'
        else:
            return f'_page.Locator("[data-testid=\'{element.locator_value}\']")'

    def _generate_action_method(self, element: PageElement) -> str:
        """Generate action methods based on element type"""
        if element.element_type == "button":
            return f"""    /// <summary>
    /// Click {element.name}
    /// </summary>
    public async Task Click{element.name}Async()
    {{
        await {element.name}.ClickAsync();
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }}

"""
        elif element.element_type == "input":
            return f"""    /// <summary>
    /// Fill {element.name}
    /// </summary>
    public async Task Fill{element.name}Async(string value)
    {{
        await {element.name}.FillAsync(value);
    }}

    /// <summary>
    /// Get value of {element.name}
    /// </summary>
    public async Task<string> Get{element.name}ValueAsync()
    {{
        return await {element.name}.InputValueAsync();
    }}

"""
        elif "telerik" in element.element_type:
            return f"""    /// <summary>
    /// Interact with {element.name}
    /// </summary>
    public async Task Interact{element.name}Async()
    {{
        await {element.name}.ClickAsync();
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }}

"""
        else:
            return f"""    /// <summary>
    /// Click {element.name}
    /// </summary>
    public async Task Click{element.name}Async()
    {{
        await {element.name}.ClickAsync();
    }}

"""

def main():
    parser = argparse.ArgumentParser(description="Generate page objects from Blazor Razor files")
    parser.add_argument("--pages", required=True, help="Comma-separated paths to Razor files")
    parser.add_argument("--output", required=True, help="Output directory for page objects")
    parser.add_argument("--test-project", default="PlaywrightTests", help="Test project name")

    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    page_paths = [Path(p.strip()) for p in args.pages.split(',')]

    for page_path in page_paths:
        if not page_path.exists():
            print(f"Warning: {page_path} does not exist, skipping...")
            continue

        print(f"Analyzing {page_path.name}...")

        analyzer = BlazorPageAnalyzer(page_path)
        page_info = analyzer.analyze()

        print(f"  Route: {page_info.route}")
        print(f"  Elements found: {len(page_info.elements)}")
        print(f"  Requires auth: {page_info.requires_auth}")

        generator = PageObjectGenerator(page_info, args.test_project)
        code = generator.generate()

        output_file = output_dir / f"{page_info.page_name}Page.cs"
        output_file.write_text(code, encoding='utf-8')

        print(f"  Generated: {output_file}")

    print("\nPage object generation complete!")

if __name__ == "__main__":
    main()
