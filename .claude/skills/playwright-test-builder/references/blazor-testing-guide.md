# Blazor Testing Guide with Playwright

## Blazor-Specific Challenges

### 1. Component Rendering and Lifecycle

Blazor components have a lifecycle that differs from traditional HTML rendering:

**Challenge**: Components may not be fully rendered when Playwright thinks the page is ready.

**Solution**:
```csharp
// Wait for network idle
await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

// Wait for specific Blazor indicator
await page.WaitForSelectorAsync("[data-blazor-loaded='true']");

// Custom wait for Blazor rendering
await page.WaitForFunctionAsync("() => !window['Blazor']?.isRendering");
```

### 2. SignalR Connections

**Blazor Server** uses SignalR for real-time communication between client and server.

**Challenge**: Tests may execute before SignalR connection is established.

**Solution**:
```csharp
// Wait for SignalR connection
await page.WaitForFunctionAsync(@"
    () => window['Blazor'] &&
          window['Blazor']._internal &&
          window['Blazor']._internal.navigationManager
");

// Test reconnection scenarios
await page.Route("**/_blazor**", route => route.Abort());
await Task.Delay(5000); // Simulate network interruption
await page.Unroute("**/_blazor**");
await page.WaitForSelectorAsync("[data-reconnection-succeeded]");
```

### 3. Prerendering

**Blazor WebAssembly** and **Blazor Server** can prerender content.

**Challenge**: Components may appear rendered but not be interactive yet.

**Solution**:
```csharp
// For Blazor WebAssembly, wait for WASM to load
await page.WaitForFunctionAsync("() => window['Blazor']?.start !== undefined");

// Wait for interactive mode
await page.WaitForFunctionAsync("() => document.querySelector('[data-enhanced-nav]') !== null");
```

### 4. Client-Side Routing

**Challenge**: Blazor handles routing client-side, which may not trigger full page loads.

**Solution**:
```csharp
// Don't use page.GotoAsync for internal navigation
// Instead, click navigation links
var navLink = page.GetByRole(AriaRole.Link, new() { Name = "Products" });
await navLink.ClickAsync();

// Wait for URL change
await page.WaitForURLAsync(new Regex("/products"));

// Verify component loaded
await page.WaitForSelectorAsync("[data-page='products']");
```

### 5. JavaScript Interop

**Challenge**: Components may call JavaScript functions that affect state.

**Solution**:
```csharp
// Mock JS interop functions
await page.AddInitScriptAsync(@"
    window.customJsFunction = (param) => {
        console.log('Mocked JS function called', param);
        return 'mocked result';
    };
");

// Verify JS interop calls
await page.EvaluateAsync(@"
    window.jsInteropCalls = [];
    window.originalFunction = window.customJsFunction;
    window.customJsFunction = (...args) => {
        window.jsInteropCalls.push(args);
        return window.originalFunction(...args);
    };
");

// Assert JS function was called
var callCount = await page.EvaluateAsync<int>("window.jsInteropCalls.length");
Assert.Equal(1, callCount);
```

## Blazor Server vs WebAssembly Differences

### Blazor Server

**Characteristics**:
- Runs on server, uses SignalR for UI updates
- Faster initial load
- Requires stable connection

**Testing Considerations**:
```csharp
// Test connection resilience
[Fact]
public async Task BlazorServer_ShouldReconnect_AfterNetworkInterruption()
{
    await page.GotoAsync("/");

    // Verify initial connection
    await page.WaitForSelectorAsync("[data-connection-state='connected']");

    // Simulate network interruption
    await page.Route("**/_blazor**", route => route.Abort());

    // Wait for disconnection notice
    await page.WaitForSelectorAsync("[data-connection-state='disconnected']");

    // Restore connection
    await page.Unroute("**/_blazor**");

    // Verify reconnection
    await page.WaitForSelectorAsync("[data-connection-state='connected']", new()
    {
        Timeout = 10000
    });
}

// Test server-side state management
[Fact]
public async Task BlazorServer_ShouldPreserveState_DuringNavigation()
{
    await page.GotoAsync("/counter");

    var incrementButton = page.GetByRole(AriaRole.Button, new() { Name = "Increment" });
    await incrementButton.ClickAsync();
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

    var countText = await page.Locator("[data-testid='current-count']").TextContentAsync();

    // Navigate away
    await page.GetByRole(AriaRole.Link, new() { Name = "Home" }).ClickAsync();

    // Navigate back
    await page.GetByRole(AriaRole.Link, new() { Name = "Counter" }).ClickAsync();

    // State should be preserved (server-side circuit)
    var newCountText = await page.Locator("[data-testid='current-count']").TextContentAsync();
    Assert.Equal(countText, newCountText);
}
```

### Blazor WebAssembly

**Characteristics**:
- Runs in browser via WebAssembly
- Slower initial load (downloading .NET runtime)
- Works offline after initial load

**Testing Considerations**:
```csharp
// Wait for WASM to load
[Fact]
public async Task BlazorWasm_ShouldLoad_WasmRuntime()
{
    await page.GotoAsync("/");

    // Wait for Blazor WASM to start
    await page.WaitForFunctionAsync(@"
        () => window['Blazor'] &&
              typeof window['Blazor'].start === 'function'
    ", new() { Timeout = 30000 }); // WASM can take time

    // Wait for app to render
    await page.WaitForSelectorAsync("[data-app-loaded]");
}

// Test offline functionality
[Fact]
public async Task BlazorWasm_ShouldWork_Offline()
{
    await page.GotoAsync("/");
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

    // Go offline
    await page.Context.SetOfflineAsync(true);

    // Navigate using client-side routing
    await page.GetByRole(AriaRole.Link, new() { Name = "Counter" }).ClickAsync();

    // Should still work
    var counter = page.Locator("[data-testid='current-count']");
    await Assertions.Expect(counter).ToBeVisibleAsync();

    // Restore online
    await page.Context.SetOfflineAsync(false);
}

// Test lazy loading
[Fact]
public async Task BlazorWasm_ShouldLazyLoad_AssembliesOnDemand()
{
    await page.GotoAsync("/");

    var initialAssemblies = await page.EvaluateAsync<int>(@"
        Object.keys(window['Blazor']._internal.loadedAssemblies || {}).length
    ");

    // Navigate to page that requires additional assembly
    await page.GetByRole(AriaRole.Link, new() { Name = "Advanced Feature" }).ClickAsync();
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

    var newAssemblies = await page.EvaluateAsync<int>(@"
        Object.keys(window['Blazor']._internal.loadedAssemblies || {}).length
    ");

    Assert.True(newAssemblies > initialAssemblies, "Additional assemblies should be loaded");
}
```

## Component Testing Patterns

### Testing Telerik Components

```csharp
// Grid testing
[Fact]
public async Task TelerikGrid_ShouldFilter_WhenFilterApplied()
{
    await page.GotoAsync("/products");

    // Open filter menu
    var filterButton = page.Locator(".k-grid-header .k-filterable").First;
    await filterButton.ClickAsync();

    // Enter filter value
    var filterInput = page.Locator(".k-filter-menu input").First;
    await filterInput.FillAsync("Test Product");

    // Apply filter
    var filterApplyButton = page.GetByRole(AriaRole.Button, new() { Name = "Filter" });
    await filterApplyButton.ClickAsync();
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

    // Verify filtered results
    var rows = page.Locator(".k-grid tbody tr[data-row]");
    var count = await rows.CountAsync();
    Assert.True(count > 0, "Filtered results should be displayed");
}

// DatePicker testing
[Fact]
public async Task TelerikDatePicker_ShouldSelect_Date()
{
    await page.GotoAsync("/booking");

    var datePicker = page.GetByTestId("booking-date");
    await datePicker.ClickAsync();

    // Calendar should open
    var calendar = page.Locator(".k-calendar");
    await Assertions.Expect(calendar).ToBeVisibleAsync();

    // Select specific date
    var dateCell = page.Locator(".k-calendar td[data-date='2025-12-25']");
    await dateCell.ClickAsync();

    // Verify selected date
    var selectedValue = await datePicker.InputValueAsync();
    Assert.Contains("12/25/2025", selectedValue);
}

// ComboBox testing
[Fact]
public async Task TelerikComboBox_ShouldFilter_Options()
{
    await page.GotoAsync("/order-form");

    var comboBox = page.GetByTestId("product-selector");
    await comboBox.ClickAsync();

    // Type to filter
    await comboBox.FillAsync("Widget");
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

    // Verify filtered options
    var options = page.Locator(".k-list-item");
    var count = await options.CountAsync();
    Assert.True(count > 0 && count < 10, "Options should be filtered");

    // Select first option
    await options.First.ClickAsync();

    // Verify selection
    var selectedText = await comboBox.InputValueAsync();
    Assert.Contains("Widget", selectedText);
}
```

### Testing Form Validation

```csharp
[Fact]
public async Task EditForm_WithInvalidData_ShouldShowValidationMessages()
{
    await page.GotoAsync("/user-form");

    // Submit empty form
    var submitButton = page.GetByRole(AriaRole.Button, new() { Name = "Submit" });
    await submitButton.ClickAsync();
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

    // Verify validation messages
    var validationMessages = page.Locator(".validation-message");
    await Assertions.Expect(validationMessages).Not.ToHaveCountAsync(0);

    // Check specific field validation
    var emailValidation = page.Locator("[data-field='email'] + .validation-message");
    await Assertions.Expect(emailValidation).ToContainTextAsync("Email is required");
}

[Fact]
public async Task EditForm_WithValidData_ShouldSubmitSuccessfully()
{
    await page.GotoAsync("/user-form");

    // Fill form
    await page.GetByLabel("First Name").FillAsync("John");
    await page.GetByLabel("Last Name").FillAsync("Doe");
    await page.GetByLabel("Email").FillAsync("john.doe@example.com");
    await page.GetByLabel("Phone").FillAsync("555-1234");

    // Submit
    var submitButton = page.GetByRole(AriaRole.Button, new() { Name = "Submit" });
    await submitButton.ClickAsync();
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

    // Verify success
    var successMessage = page.GetByTestId("success-message");
    await Assertions.Expect(successMessage).ToBeVisibleAsync();
    await Assertions.Expect(successMessage).ToContainTextAsync("User created successfully");
}
```

## Authentication Testing

```csharp
public class AuthenticationTests : PlaywrightTest
{
    [Fact]
    public async Task Login_WithValidCredentials_ShouldRedirectToDashboard()
    {
        await page.GotoAsync("/login");

        await page.GetByLabel("Email").FillAsync("admin@example.com");
        await page.GetByLabel("Password").FillAsync("Admin123!");

        var loginButton = page.GetByRole(AriaRole.Button, new() { Name = "Login" });
        await loginButton.ClickAsync();
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Verify redirect
        await Assertions.Expect(page).ToHaveURLAsync(new Regex("/dashboard"));

        // Verify user menu visible
        var userMenu = page.GetByTestId("user-menu");
        await Assertions.Expect(userMenu).ToBeVisibleAsync();
    }

    [Fact]
    public async Task ProtectedPage_WithoutAuth_ShouldRedirectToLogin()
    {
        await page.GotoAsync("/admin");

        // Should redirect to login
        await page.WaitForURLAsync(new Regex("/login"));

        // Verify return URL preserved
        var currentUrl = page.Url;
        Assert.Contains("returnUrl=%2Fadmin", currentUrl);
    }

    [Fact]
    public async Task Logout_ShouldClearSessionAndRedirect()
    {
        // Login first
        await LoginAsAdmin();

        // Navigate to protected page
        await page.GotoAsync("/dashboard");
        await Assertions.Expect(page).ToHaveURLAsync(new Regex("/dashboard"));

        // Logout
        var userMenu = page.GetByTestId("user-menu");
        await userMenu.ClickAsync();

        var logoutButton = page.GetByRole(AriaRole.Button, new() { Name = "Logout" });
        await logoutButton.ClickAsync();
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Verify redirect to home or login
        await Assertions.Expect(page).ToHaveURLAsync(new Regex("/(login|$)"));

        // Try accessing protected page
        await page.GotoAsync("/dashboard");
        await page.WaitForURLAsync(new Regex("/login"));
    }

    private async Task LoginAsAdmin()
    {
        await page.GotoAsync("/login");
        await page.GetByLabel("Email").FillAsync("admin@example.com");
        await page.GetByLabel("Password").FillAsync("Admin123!");
        await page.GetByRole(AriaRole.Button, new() { Name = "Login" }).ClickAsync();
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }
}
```

## Best Practices

### 1. Always Wait for Blazor Rendering

```csharp
protected async Task WaitForBlazorRenderAsync()
{
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    await Task.Delay(100); // Small buffer for Blazor rendering
}
```

### 2. Use Data Attributes for Stable Locators

```razor
<button data-testid="submit-button" @onclick="HandleSubmit">
    Submit
</button>
```

```csharp
var submitButton = page.GetByTestId("submit-button");
await submitButton.ClickAsync();
```

### 3. Handle SignalR Reconnection in Blazor Server

```csharp
[Fact]
public async Task App_ShouldHandleReconnection_Gracefully()
{
    await page.GotoAsync("/");

    // Block SignalR temporarily
    await page.RouteAsync("**/_blazor**", route => route.Abort());

    // Wait for reconnection UI
    var reconnectingOverlay = page.GetByTestId("reconnecting-overlay");
    await Assertions.Expect(reconnectingOverlay).ToBeVisibleAsync();

    // Unblock SignalR
    await page.UnrouteAsync("**/_blazor**");

    // Wait for reconnection
    await Assertions.Expect(reconnectingOverlay).Not.ToBeVisibleAsync();
}
```

### 4. Test Component State Persistence

```csharp
[Fact]
public async Task Component_ShouldPreserveState_AfterRerender()
{
    await page.GotoAsync("/counter");

    // Increment counter
    var button = page.GetByRole(AriaRole.Button, new() { Name = "Increment" });
    await button.ClickAsync();
    await button.ClickAsync();
    await button.ClickAsync();

    var counter = page.GetByTestId("current-count");
    await Assertions.Expect(counter).ToHaveTextAsync("3");

    // Force re-render by triggering parent component update
    await page.GetByTestId("trigger-rerender").ClickAsync();
    await WaitForBlazorRenderAsync();

    // State should be preserved
    await Assertions.Expect(counter).ToHaveTextAsync("3");
}
```

### 5. Mock External Dependencies

```csharp
[Fact]
public async Task WeatherForecast_ShouldLoadData_FromMockedApi()
{
    // Mock API response
    await page.RouteAsync("**/api/weather/**", async route =>
    {
        await route.FulfillAsync(new()
        {
            Status = 200,
            ContentType = "application/json",
            Body = "[{\"date\":\"2025-01-01\",\"temperatureC\":25,\"summary\":\"Sunny\"}]"
        });
    });

    await page.GotoAsync("/weather");
    await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

    // Verify mocked data rendered
    var summary = page.GetByText("Sunny");
    await Assertions.Expect(summary).ToBeVisibleAsync();
}
```
