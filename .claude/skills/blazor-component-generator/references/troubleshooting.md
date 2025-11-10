# Blazor Component Generator Troubleshooting Guide

Comprehensive troubleshooting guide for common issues when generating and using Blazor components with Syncfusion, Telerik UI, and MudBlazor.

## Table of Contents
- [Framework Detection Issues](#framework-detection-issues)
- [Compilation Errors](#compilation-errors)
- [Runtime Errors](#runtime-errors)
- [Data Loading Issues](#data-loading-issues)
- [Styling and Layout Issues](#styling-and-layout-issues)
- [Performance Issues](#performance-issues)
- [Debugging Techniques](#debugging-techniques)

---

## Framework Detection Issues

### Issue: Framework Not Detected

**Symptoms**:
- Skill doesn't detect UI framework
- Wrong framework detected

**Causes**:
1. Package not installed
2. Using directives not in `_Imports.razor`
3. Multiple frameworks installed

**Solution 1: Verify Package Installation**
```bash
# Check .csproj file
rg "Syncfusion.Blazor" --glob "*.csproj"
rg "Telerik.UI.for.Blazor" --glob "*.csproj"
rg "MudBlazor" --glob "*.csproj"

# Install missing package
dotnet add package Syncfusion.Blazor.Grid
dotnet add package Telerik.UI.for.Blazor
dotnet add package MudBlazor
```

**Solution 2: Add Using Directives**
```razor
<!-- _Imports.razor -->

<!-- For Syncfusion -->
@using Syncfusion.Blazor
@using Syncfusion.Blazor.Grids

<!-- For Telerik -->
@using Telerik.Blazor
@using Telerik.Blazor.Components

<!-- For MudBlazor -->
@using MudBlazor
```

**Solution 3: Manual Framework Override**
Explicitly specify framework when invoking skill:
```
"Generate CRUD page for Product using MudBlazor"
```

---

## Compilation Errors

### Error: Type or namespace name 'SfGrid' could not be found

**Framework**: Syncfusion

**Cause**: Syncfusion.Blazor.Grid package not installed

**Solution**:
```bash
dotnet add package Syncfusion.Blazor.Grid
```

**Verify registration in Program.cs**:
```csharp
builder.Services.AddSyncfusionBlazor();
```

---

### Error: Type or namespace name 'TelerikGrid' could not be found

**Framework**: Telerik UI

**Cause**: Telerik.UI.for.Blazor package not installed

**Solution**:
```bash
dotnet add package Telerik.UI.for.Blazor
```

**Verify registration in Program.cs**:
```csharp
builder.Services.AddTelerikBlazor();
```

---

### Error: Type or namespace name 'MudDataGrid' could not be found

**Framework**: MudBlazor

**Cause**: MudBlazor package not installed

**Solution**:
```bash
dotnet add package MudBlazor
```

**Verify registration in Program.cs**:
```csharp
using MudBlazor.Services;

builder.Services.AddMudServices();
```

**Verify providers in App.razor or MainLayout.razor**:
```razor
<MudThemeProvider />
<MudDialogProvider />
<MudSnackbarProvider />
```

---

### Error: Service 'IProductService' not registered

**Cause**: Service not added to DI container

**Solution**:
```csharp
// Program.cs
builder.Services.AddScoped<IProductService, ProductService>();
```

**For multiple services**:
```csharp
// Register all services from assembly
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IOrderService, OrderService>();
```

---

### Error: Cannot convert from 'string' to 'int'

**Cause**: Type mismatch in component binding

**Solution**:
```razor
<!-- Wrong -->
<TelerikNumericTextBox @bind-Value="@Model.ProductId" />

<!-- Correct -->
<TelerikNumericTextBox @bind-Value="@Model.ProductId" TValue="int" />
```

---

### Error: Object reference not set to an instance of an object (NullReferenceException)

**Cause 1**: Model not initialized

**Solution**:
```csharp
// Wrong
private Product Model;

// Correct
private Product Model = new();
```

**Cause 2**: Service not injected

**Solution**:
```razor
@inject IProductService ProductService
```

**Cause 3**: Data not loaded

**Solution**:
```csharp
protected override async Task OnInitializedAsync()
{
    // Initialize data
    Products = await ProductService.GetAllAsync() ?? new List<Product>();
}
```

---

## Runtime Errors

### Issue: Grid Not Loading Data

**Symptoms**:
- Grid shows empty
- No error messages
- Data service returns data

**Cause 1**: Async operation not awaited

**Solution**:
```csharp
// Wrong
protected override void OnInitialized()
{
    Products = ProductService.GetAllAsync().Result; // Deadlock!
}

// Correct
protected override async Task OnInitializedAsync()
{
    Products = await ProductService.GetAllAsync();
}
```

**Cause 2**: StateHasChanged not called after async operation

**Solution**:
```csharp
private async Task LoadDataAsync()
{
    Products = await ProductService.GetAllAsync();
    await InvokeAsync(StateHasChanged);
}
```

**Cause 3**: Grid bound to null

**Solution**:
```csharp
// Initialize to empty collection
private List<Product> Products = new();

// Or check for null in markup
@if (Products != null && Products.Any())
{
    <MudDataGrid Items="@Products" />
}
```

---

### Issue: Dialog Not Showing

**Symptoms**:
- Dialog service invoked but dialog doesn't appear
- No error messages

**Syncfusion Solution**:
```csharp
// Ensure SfDialog is registered
// No special registration needed, component works standalone
```

**Telerik Solution**:
```razor
<!-- Ensure TelerikRootComponent is in App.razor or MainLayout.razor -->
<TelerikRootComponent>
    @Body
</TelerikRootComponent>
```

**MudBlazor Solution**:
```razor
<!-- Ensure MudDialogProvider is in App.razor or MainLayout.razor -->
<MudDialogProvider />
```

**Verify service injection**:
```razor
@inject IDialogService DialogService
```

---

### Issue: Form Validation Not Working

**Cause 1**: DataAnnotationsValidator missing

**Solution**:
```razor
<EditForm Model="@Model" OnValidSubmit="@HandleValidSubmit">
    <DataAnnotationsValidator />  <!-- Add this -->
    <ValidationSummary />

    <!-- Form fields -->
</EditForm>
```

**Cause 2**: Validation attributes missing on model

**Solution**:
```csharp
public class ProductModel
{
    [Required(ErrorMessage = "Name is required")]
    public string Name { get; set; }

    [Range(0, 999999, ErrorMessage = "Invalid price")]
    public decimal Price { get; set; }
}
```

**Cause 3**: Using wrong submit handler

**Solution**:
```razor
<!-- Wrong: OnSubmit fires regardless of validation -->
<EditForm Model="@Model" OnSubmit="@HandleSubmit">

<!-- Correct: OnValidSubmit fires only when valid -->
<EditForm Model="@Model" OnValidSubmit="@HandleValidSubmit">
```

---

### Issue: Update/Delete Operations Not Working

**Cause 1**: Service method not implemented

**Solution**:
Verify service has proper CRUD methods:
```csharp
public interface IProductService
{
    Task<Product> GetByIdAsync(int id);
    Task<List<Product>> GetAllAsync();
    Task<Product> CreateAsync(Product product);
    Task UpdateAsync(Product product);
    Task DeleteAsync(int id);
}
```

**Cause 2**: Event handlers not wired correctly

**Syncfusion Solution**:
```razor
<GridEvents OnActionBegin="OnActionBeginHandler" TValue="Product" />
```

**Telerik Solution**:
```razor
<TelerikGrid OnUpdate="@UpdateHandler"
             OnDelete="@DeleteHandler"
             OnCreate="@CreateHandler">
```

**MudBlazor Solution**:
```razor
<MudDataGrid CommittedItemChanges="@CommittedItemChanges">
```

**Cause 3**: StateHasChanged not called after operation

**Solution**:
```csharp
private async Task DeleteProduct(int id)
{
    await ProductService.DeleteAsync(id);
    await LoadDataAsync();
    await InvokeAsync(StateHasChanged);
}
```

---

## Data Loading Issues

### Issue: Slow Data Loading

**Cause**: Loading too much data

**Solution 1: Implement Paging**

**Syncfusion**:
```razor
<SfGrid DataSource="@Products" AllowPaging="true">
    <GridPageSettings PageSize="10" />
</SfGrid>
```

**Telerik**:
```razor
<TelerikGrid Data="@Products" Pageable="true" PageSize="10">
```

**MudBlazor**:
```razor
<MudDataGrid Items="@Products" Pagination="true" RowsPerPage="10">
```

**Solution 2: Server-Side Data**

**MudBlazor Example**:
```csharp
<MudDataGrid T="Product" ServerData="@LoadServerData">
</MudDataGrid>

@code {
    private async Task<GridData<Product>> LoadServerData(GridState<Product> state)
    {
        var result = await ProductService.GetPagedAsync(
            page: state.Page,
            pageSize: state.PageSize);

        return new GridData<Product>
        {
            Items = result.Items,
            TotalItems = result.TotalCount
        };
    }
}
```

---

### Issue: Foreign Key Data Not Showing

**Cause**: Navigation property not loaded

**Solution 1: Eager Loading in Service**
```csharp
public async Task<List<Product>> GetAllAsync()
{
    return await _context.Products
        .Include(p => p.Category)  // Eager load
        .Include(p => p.Supplier)
        .ToListAsync();
}
```

**Solution 2: Display Foreign Key Property in Grid**
```razor
<!-- Syncfusion -->
<GridColumn Field="Category.Name" HeaderText="Category" />

<!-- Telerik -->
<GridColumn Field="@nameof(Product.Category.Name)" Title="Category" />

<!-- MudBlazor -->
<PropertyColumn Property="x => x.Category.Name" Title="Category" />
```

---

## Styling and Layout Issues

### Issue: Components Not Styled Correctly

**Syncfusion**:
```html
<!-- Add theme CSS to index.html or _Layout.cshtml -->
<link href="_content/Syncfusion.Blazor.Themes/bootstrap5.css" rel="stylesheet" />
```

**Telerik**:
```html
<!-- Add theme CSS -->
<link href="https://unpkg.com/@progress/kendo-theme-default@latest/dist/all.css" rel="stylesheet" />
<!-- OR -->
<link href="_content/Telerik.UI.for.Blazor/css/kendo-theme-default/all.css" rel="stylesheet" />
```

**MudBlazor**:
```html
<!-- Add MudBlazor CSS and fonts -->
<link href="_content/MudBlazor/MudBlazor.min.css" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
<link href="_content/MudBlazor/MudBlazor.min.css" rel="stylesheet" />
```

---

### Issue: Grid Column Widths Not Working

**Solution**:

**Syncfusion**:
```razor
<GridColumn Field="Name" HeaderText="Name" Width="200" />
```

**Telerik**:
```razor
<GridColumn Field="@nameof(Product.Name)" Title="Name" Width="200px" />
```

**MudBlazor**:
```razor
<PropertyColumn Property="x => x.Name" Title="Name">
    <CellStyle>width: 200px;</CellStyle>
</PropertyColumn>
```

---

### Issue: Icons Not Displaying

**Syncfusion**:
No built-in icon support in community edition. Use custom icons or CSS.

**Telerik**:
```razor
<!-- Wrong -->
<GridCommandButton Icon="edit">Edit</GridCommandButton>

<!-- Correct -->
@using Telerik.SvgIcons
<GridCommandButton Icon="@SvgIcon.Pencil">Edit</GridCommandButton>
```

**MudBlazor**:
```razor
<!-- Ensure Material Icons font is loaded in index.html -->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

<!-- Use Icons class -->
<MudIconButton Icon="@Icons.Material.Filled.Edit" />
```

---

## Performance Issues

### Issue: Slow Rendering with Large Datasets

**Solution 1: Virtualization**

**MudBlazor**:
```razor
<Virtualize Items="@Products" Context="product">
    <div>@product.Name</div>
</Virtualize>
```

**Solution 2: Grid Virtualization**

**Syncfusion**:
```razor
<SfGrid DataSource="@Products" EnableVirtualization="true" Height="400">
```

**Telerik**:
```razor
<TelerikGrid Data="@Products" ScrollMode="@GridScrollMode.Virtual" Height="400px">
```

**Solution 3: Optimize ShouldRender**
```csharp
protected override bool ShouldRender()
{
    // Only render when necessary
    return _shouldRender;
}
```

---

### Issue: Memory Leaks

**Cause**: Event handlers not unsubscribed

**Solution**:
```csharp
@implements IDisposable

@code {
    protected override void OnInitialized()
    {
        AppState.OnChange += StateHasChanged;
    }

    public void Dispose()
    {
        AppState.OnChange -= StateHasChanged;
    }
}
```

---

## Debugging Techniques

### Enable Detailed Errors

**Blazor Server (appsettings.Development.json)**:
```json
{
  "DetailedErrors": true,
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

---

### Add Logging

```csharp
@inject ILogger<ProductList> Logger

@code {
    private async Task LoadDataAsync()
    {
        Logger.LogInformation("Loading products...");
        try
        {
            Products = await ProductService.GetAllAsync();
            Logger.LogInformation("Loaded {Count} products", Products.Count);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error loading products");
            throw;
        }
    }
}
```

---

### Use Browser Developer Tools

**Check Console for JavaScript Errors**:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for errors (red messages)

**Check Network Tab**:
1. Open Developer Tools (F12)
2. Go to Network tab
3. Reload page
4. Look for failed requests (red)

**Check SignalR Connection (Blazor Server)**:
1. Open Developer Tools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Look for "_blazor" connection

---

### Inspect Component State

```razor
<div class="debug-info" style="background: #f0f0f0; padding: 10px; margin: 10px;">
    <h4>Debug Info</h4>
    <p>Products Count: @Products.Count</p>
    <p>IsLoading: @IsLoading</p>
    <p>ErrorMessage: @ErrorMessage</p>
</div>
```

---

## Common Error Messages Reference

| Error | Framework | Cause | Solution |
|-------|-----------|-------|----------|
| Type 'SfGrid' not found | Syncfusion | Package not installed | Install Syncfusion.Blazor.Grid |
| Type 'TelerikGrid' not found | Telerik | Package not installed | Install Telerik.UI.for.Blazor |
| Type 'MudDataGrid' not found | MudBlazor | Package not installed | Install MudBlazor |
| Service not registered | All | DI registration missing | Add service to Program.cs |
| Object reference not set | All | Null reference | Initialize objects |
| Cannot implicitly convert | All | Type mismatch | Use correct TValue parameter |
| Circuit terminated | Blazor Server | SignalR disconnected | Check server connection |

---

## Framework-Specific Issues

### Syncfusion

**Issue: License popup appearing**

**Cause**: Using community edition without license key or trial expired

**Solution**:
```csharp
// Program.cs
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense("YOUR-LICENSE-KEY");
```

---

### Telerik

**Issue: TelerikRootComponent not found**

**Cause**: Missing root component in layout

**Solution**:
```razor
<!-- MainLayout.razor -->
<TelerikRootComponent>
    <div class="page">
        @Body
    </div>
</TelerikRootComponent>
```

---

### MudBlazor

**Issue: Dark mode not working**

**Cause**: IsDarkMode binding not configured

**Solution**:
```razor
<MudThemeProvider @bind-IsDarkMode="@_isDarkMode" />

@code {
    private bool _isDarkMode = false;
}
```

---

## Getting Help

### Syncfusion
- Documentation: https://blazor.syncfusion.com/documentation/introduction
- Forum: https://www.syncfusion.com/forums/blazor
- GitHub: https://github.com/syncfusion/blazor-samples

### Telerik
- Documentation: https://docs.telerik.com/blazor-ui/introduction
- Forum: https://www.telerik.com/forums/blazor
- Support: https://www.telerik.com/account/support-tickets

### MudBlazor
- Documentation: https://mudblazor.com/
- GitHub Issues: https://github.com/MudBlazor/MudBlazor/issues
- Discord: https://discord.gg/mudblazor

---

## Prevention Best Practices

### Before Generation
- ✅ Verify UI framework installed
- ✅ Verify entity class exists
- ✅ Verify service interface exists
- ✅ Check for naming conflicts

### After Generation
- ✅ Build project (`dotnet build`)
- ✅ Check for compilation errors
- ✅ Run application
- ✅ Test CRUD operations
- ✅ Check browser console for errors

### Development
- ✅ Use proper async/await patterns
- ✅ Initialize all objects
- ✅ Handle null cases
- ✅ Log errors with context
- ✅ Test with realistic data
- ✅ Use error boundaries
- ✅ Implement proper dispose pattern

---

## Quick Diagnostic Checklist

When components aren't working, check:

- [ ] Framework package installed
- [ ] Using directives in _Imports.razor
- [ ] Service registered in Program.cs
- [ ] Framework services registered (AddSyncfusionBlazor, AddTelerikBlazor, AddMudServices)
- [ ] Theme CSS loaded
- [ ] Model properties match entity properties
- [ ] Async methods properly awaited
- [ ] Service injected in component
- [ ] Data initialized (not null)
- [ ] Event handlers wired correctly
- [ ] StateHasChanged called when needed
- [ ] Browser console shows no errors
- [ ] Network tab shows no failed requests
- [ ] SignalR connection active (Blazor Server)
