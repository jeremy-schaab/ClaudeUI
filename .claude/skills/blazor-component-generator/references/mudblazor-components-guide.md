# MudBlazor Components Guide

Comprehensive reference for MudBlazor components used in code generation.

## Overview

MudBlazor is an open-source Blazor component library based on Material Design with 60+ components. This guide covers the most commonly used components for CRUD applications.

## Installation

```bash
# Install MudBlazor package
dotnet add package MudBlazor
```

**Add to _Imports.razor**:
```razor
@using MudBlazor
```

**Register in Program.cs**:
```csharp
using MudBlazor.Services;

builder.Services.AddMudServices();
```

**Add to App.razor or MainLayout.razor**:
```razor
<MudThemeProvider />
<MudDialogProvider />
<MudSnackbarProvider />
```

---

## MudDataGrid - Data Grid Component

### Basic Usage

```razor
<MudDataGrid T="Product" Items="@Products"
             Filterable="true"
             SortMode="SortMode.Multiple"
             Pagination="true"
             RowsPerPage="10">
    <Columns>
        <PropertyColumn Property="x => x.ProductId" Title="ID" />
        <PropertyColumn Property="x => x.Name" Title="Product Name" />
        <PropertyColumn Property="x => x.Price" Title="Price" Format="C2" />
    </Columns>
</MudDataGrid>

@code {
    private List<Product> Products = new();
}
```

### CRUD Operations

```razor
<MudDataGrid T="Product" Items="@Products"
             ReadOnly="false"
             EditMode="DataGridEditMode.Form"
             CommittedItemChanges="@CommittedItemChanges"
             EditDialogOptions="new() { CloseButton = true, MaxWidth = MaxWidth.Medium }">
    <ToolBarContent>
        <MudButton OnClick="@AddProduct" StartIcon="@Icons.Material.Filled.Add" Color="Color.Primary">Add Product</MudButton>
    </ToolBarContent>
    <Columns>
        <PropertyColumn Property="x => x.ProductId" Title="ID" IsEditable="false" />
        <PropertyColumn Property="x => x.Name" Title="Name" />
        <PropertyColumn Property="x => x.Price" Title="Price" Format="C2" />
        <TemplateColumn CellClass="d-flex justify-end">
            <CellTemplate>
                <MudIconButton Size="@Size.Small" Icon="@Icons.Material.Outlined.Edit" OnClick="@(() => EditProduct(context.Item))" />
                <MudIconButton Size="@Size.Small" Icon="@Icons.Material.Outlined.Delete" OnClick="@(() => DeleteProduct(context.Item))" />
            </CellTemplate>
        </TemplateColumn>
    </Columns>
</MudDataGrid>

@code {
    private List<Product> Products = new();

    private async Task AddProduct()
    {
        var newProduct = new Product();
        Products.Add(newProduct);
        await InvokeAsync(StateHasChanged);
    }

    private async Task EditProduct(Product product)
    {
        // Edit logic here
    }

    private async Task DeleteProduct(Product product)
    {
        bool? result = await DialogService.ShowMessageBox(
            "Confirm Delete",
            "Are you sure you want to delete this product?",
            yesText: "Delete", cancelText: "Cancel");

        if (result == true)
        {
            await ProductService.DeleteAsync(product.ProductId);
            Products.Remove(product);
            await InvokeAsync(StateHasChanged);
        }
    }

    private async Task CommittedItemChanges(Product item)
    {
        if (item.ProductId == 0)
        {
            await ProductService.CreateAsync(item);
        }
        else
        {
            await ProductService.UpdateAsync(item);
        }
        await LoadDataAsync();
    }
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| Items | IEnumerable<T> | Data to display |
| Filterable | bool | Enable filtering |
| SortMode | SortMode | None, Single, Multiple |
| Pagination | bool | Enable pagination |
| RowsPerPage | int | Rows per page |
| ReadOnly | bool | Enable/disable editing |
| EditMode | DataGridEditMode | Form, Cell, Popup |

---

## MudDialog - Modal Dialog

### Basic Usage

```razor
<MudDialog>
    <DialogContent>
        <EditForm Model="@CurrentProduct" OnValidSubmit="@HandleValidSubmit">
            <DataAnnotationsValidator />
            <ValidationSummary />

            <MudTextField @bind-Value="@CurrentProduct.Name"
                         Label="Product Name"
                         Variant="Variant.Outlined"
                         Required="true" />

            <MudNumericField @bind-Value="@CurrentProduct.Price"
                            Label="Price"
                            Variant="Variant.Outlined"
                            Format="C2"
                            Min="0" />
        </EditForm>
    </DialogContent>
    <DialogActions>
        <MudButton OnClick="Cancel">Cancel</MudButton>
        <MudButton Color="Color.Primary" OnClick="Save">Save</MudButton>
    </DialogActions>
</MudDialog>

@code {
    [CascadingParameter] MudDialogInstance MudDialog { get; set; }
    [Parameter] public Product CurrentProduct { get; set; } = new();

    private void Cancel() => MudDialog.Cancel();

    private async Task Save()
    {
        await ProductService.UpdateAsync(CurrentProduct);
        MudDialog.Close(DialogResult.Ok(CurrentProduct));
    }

    private async Task HandleValidSubmit()
    {
        await Save();
    }
}
```

### Dialog Service Usage

```razor
@inject IDialogService DialogService

<MudButton OnClick="@OpenDialog" Color="Color.Primary">Open Dialog</MudButton>

@code {
    private async Task OpenDialog()
    {
        var parameters = new DialogParameters
        {
            ["CurrentProduct"] = new Product()
        };

        var options = new DialogOptions
        {
            CloseButton = true,
            MaxWidth = MaxWidth.Medium,
            FullWidth = true
        };

        var dialog = await DialogService.ShowAsync<ProductDialog>("Edit Product", parameters, options);
        var result = await dialog.Result;

        if (!result.Canceled)
        {
            // Handle result
            var product = result.Data as Product;
        }
    }
}
```

---

## MudTextField - Text Input

```razor
<MudTextField @bind-Value="@Model.Name"
              Label="Product Name"
              Variant="Variant.Outlined"
              Required="true"
              RequiredError="Name is required"
              MaxLength="100" />
```

### Properties
- **Value**: Two-way binding
- **Label**: Label text
- **Variant**: Filled, Outlined, Text
- **Required**: Mark as required
- **RequiredError**: Error message
- **MaxLength**: Max character length
- **HelperText**: Help text below input
- **Adornment**: Icon or text inside input

---

## MudNumericField - Numeric Input

```razor
<MudNumericField @bind-Value="@Model.Price"
                 Label="Price"
                 Variant="Variant.Outlined"
                 Format="C2"
                 Min="0"
                 Max="999999" />
```

### Properties
- **Value**: Numeric value
- **Format**: Number format (C2, N2, P2, etc.)
- **Min**: Minimum value
- **Max**: Maximum value
- **Step**: Increment/decrement step
- **HideSpinButtons**: Hide up/down arrows

---

## MudDatePicker - Date Selection

```razor
<MudDatePicker @bind-Date="@Model.CreatedDate"
               Label="Created Date"
               Variant="Variant.Outlined"
               DateFormat="yyyy-MM-dd"
               MinDate="@DateTime.Today.AddYears(-10)"
               MaxDate="@DateTime.Today" />
```

### Properties
- **Date**: DateTime? value
- **DateFormat**: Date format string
- **MinDate**: Minimum date
- **MaxDate**: Maximum date
- **FirstDayOfWeek**: Start day of week
- **PickerVariant**: Static, Inline, Dialog

---

## MudSelect - Dropdown Selection

```razor
<MudSelect T="int" @bind-Value="@Model.CategoryId"
           Label="Category"
           Variant="Variant.Outlined"
           AnchorOrigin="Origin.BottomCenter">
    @foreach (var category in Categories)
    {
        <MudSelectItem T="int" Value="@category.CategoryId">@category.Name</MudSelectItem>
    }
</MudSelect>

@code {
    private List<Category> Categories = new();

    protected override async Task OnInitializedAsync()
    {
        Categories = await CategoryService.GetAllAsync();
    }
}
```

### Properties
- **Value**: Selected value
- **T**: Type of value
- **MultiSelection**: Enable multi-select
- **Dense**: Compact display
- **Clearable**: Show clear button
- **Required**: Mark as required

---

## MudAutocomplete - Autocomplete/Search

```razor
<MudAutocomplete T="Category"
                 @bind-Value="@SelectedCategory"
                 SearchFunc="@SearchCategories"
                 Label="Category"
                 Variant="Variant.Outlined"
                 ToStringFunc="@(e => e?.Name)"
                 ResetValueOnEmptyText="true"
                 CoerceText="true" />

@code {
    private Category SelectedCategory;

    private async Task<IEnumerable<Category>> SearchCategories(string value)
    {
        if (string.IsNullOrEmpty(value))
            return await CategoryService.GetAllAsync();

        return await CategoryService.SearchAsync(value);
    }
}
```

---

## MudCheckBox - Checkbox

```razor
<MudCheckBox @bind-Checked="@Model.IsActive" Label="Active" Color="Color.Primary" />
```

---

## MudSwitch - Toggle Switch

```razor
<MudSwitch @bind-Checked="@Model.IsEnabled" Label="Enabled" Color="Color.Primary" />
```

---

## C# Type to MudBlazor Component Mapping

| C# Type | MudBlazor Component | Configuration |
|---------|-------------------|---------------|
| string | MudTextField | Variant="Outlined" |
| int | MudNumericField<int> | Format="N0" |
| decimal | MudNumericField<decimal> | Format="C2" |
| double | MudNumericField<double> | Format="N2" |
| DateTime | MudDatePicker | DateFormat="yyyy-MM-dd" |
| DateTimeOffset | MudDatePicker | DateFormat="yyyy-MM-dd" |
| bool | MudCheckBox | Color="Primary" |
| enum | MudSelect<T> | Items from Enum.GetValues |
| FK (int) | MudAutocomplete<T> | SearchFunc for lookup |

---

## Best Practices

### 1. Use Variant for Consistent Styling
```razor
<MudTextField Variant="Variant.Outlined" />
<MudSelect Variant="Variant.Outlined" />
<MudDatePicker Variant="Variant.Outlined" />
```

**Variants**:
- **Filled**: Material Design filled style (default)
- **Outlined**: Material Design outlined style
- **Text**: Simple text style

### 2. Use Material Icons
```razor
<MudIconButton Icon="@Icons.Material.Filled.Edit" />
<MudIconButton Icon="@Icons.Material.Filled.Delete" Color="Color.Error" />
<MudIconButton Icon="@Icons.Material.Filled.Add" Color="Color.Primary" />
```

Common icons:
- `Icons.Material.Filled.Add` - Add
- `Icons.Material.Filled.Edit` - Edit
- `Icons.Material.Filled.Delete` - Delete
- `Icons.Material.Filled.Save` - Save
- `Icons.Material.Filled.Close` - Close

### 3. Use Color System
```razor
<MudButton Color="Color.Primary">Save</MudButton>
<MudButton Color="Color.Secondary">Cancel</MudButton>
<MudButton Color="Color.Error">Delete</MudButton>
```

**Colors**: Default, Primary, Secondary, Tertiary, Info, Success, Warning, Error, Dark, Transparent, Inherit

### 4. Enable Filtering and Sorting
```razor
<MudDataGrid Filterable="true" SortMode="SortMode.Multiple" />
```

### 5. Format Data Appropriately
```razor
<PropertyColumn Property="x => x.Price" Format="C2" /> <!-- Currency -->
<PropertyColumn Property="x => x.Quantity" Format="N0" /> <!-- Number -->
<PropertyColumn Property="x => x.CreatedDate" Format="yyyy-MM-dd" /> <!-- Date -->
```

### 6. Use HelperText for Guidance
```razor
<MudTextField Label="Email"
              HelperText="We'll never share your email"
              Required="true" />
```

### 7. Implement Validation
```razor
<EditForm Model="@Model" OnValidSubmit="@HandleSubmit">
    <DataAnnotationsValidator />
    <MudTextField @bind-Value="@Model.Name"
                 Label="Name"
                 Required="true"
                 RequiredError="Name is required" />
    <ValidationSummary />
</EditForm>
```

---

## Common Patterns

### Master-Detail Grid

```razor
<MudDataGrid T="Order" Items="@Orders">
    <Columns>
        <PropertyColumn Property="x => x.OrderId" />
        <PropertyColumn Property="x => x.CustomerName" />
        <PropertyColumn Property="x => x.OrderDate" Format="yyyy-MM-dd" />
    </Columns>
    <ChildRowContent>
        <MudDataGrid T="OrderItem" Items="@context.Item.OrderItems" Elevation="0">
            <Columns>
                <PropertyColumn Property="x => x.ProductName" />
                <PropertyColumn Property="x => x.Quantity" />
                <PropertyColumn Property="x => x.Price" Format="C2" />
            </Columns>
        </MudDataGrid>
    </ChildRowContent>
</MudDataGrid>
```

### Confirmation Dialog

```razor
@inject IDialogService DialogService

<MudButton OnClick="@ConfirmDelete" Color="Color.Error">Delete</MudButton>

@code {
    private async Task ConfirmDelete()
    {
        bool? result = await DialogService.ShowMessageBox(
            "Confirm Delete",
            "Are you sure you want to delete this item?",
            yesText: "Delete",
            cancelText: "Cancel");

        if (result == true)
        {
            // Perform delete
            await ProductService.DeleteAsync(productId);
        }
    }
}
```

### Loading Indicator

```razor
<MudOverlay Visible="@IsLoading" DarkBackground="true" Absolute="true">
    <MudProgressCircular Color="Color.Primary" Indeterminate="true" />
</MudOverlay>

@code {
    private bool IsLoading = false;

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            Products = await ProductService.GetAllAsync();
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

### Toast Notifications (Snackbar)

```razor
@inject ISnackbar Snackbar

<MudButton OnClick="@SaveProduct" Color="Color.Primary">Save</MudButton>

@code {
    private async Task SaveProduct()
    {
        try
        {
            await ProductService.UpdateAsync(CurrentProduct);
            Snackbar.Add("Product saved successfully", Severity.Success);
        }
        catch (Exception ex)
        {
            Snackbar.Add($"Error: {ex.Message}", Severity.Error);
        }
    }
}
```

### Form with Validation

```razor
<EditForm Model="@Model" OnValidSubmit="@HandleValidSubmit">
    <DataAnnotationsValidator />

    <MudCard>
        <MudCardContent>
            <MudTextField @bind-Value="@Model.Name"
                         Label="Product Name"
                         Variant="Variant.Outlined"
                         Required="true"
                         RequiredError="Name is required" />

            <MudNumericField @bind-Value="@Model.Price"
                            Label="Price"
                            Variant="Variant.Outlined"
                            Format="C2"
                            Min="0"
                            Required="true" />

            <MudDatePicker @bind-Date="@Model.CreatedDate"
                          Label="Created Date"
                          Variant="Variant.Outlined"
                          Required="true" />

            <MudCheckBox @bind-Checked="@Model.IsActive"
                        Label="Active"
                        Color="Color.Primary" />
        </MudCardContent>
        <MudCardActions>
            <MudButton ButtonType="ButtonType.Submit"
                      Variant="Variant.Filled"
                      Color="Color.Primary">Save</MudButton>
            <MudButton OnClick="@Cancel"
                      Variant="Variant.Filled">Cancel</MudButton>
        </MudCardActions>
    </MudCard>

    <ValidationSummary />
</EditForm>

@code {
    private ProductModel Model = new();

    private async Task HandleValidSubmit()
    {
        await ProductService.CreateAsync(Model);
        Snackbar.Add("Product created successfully", Severity.Success);
    }

    private void Cancel()
    {
        NavigationManager.NavigateTo("/products");
    }
}
```

---

## Advanced Features

### Server-Side Pagination

```razor
<MudDataGrid T="Product"
             ServerData="@LoadServerData"
             Pagination="true"
             RowsPerPage="10">
    <Columns>
        <PropertyColumn Property="x => x.ProductId" />
        <PropertyColumn Property="x => x.Name" />
        <PropertyColumn Property="x => x.Price" Format="C2" />
    </Columns>
</MudDataGrid>

@code {
    private async Task<GridData<Product>> LoadServerData(GridState<Product> state)
    {
        var data = await ProductService.GetPagedAsync(
            page: state.Page,
            pageSize: state.PageSize,
            sortBy: state.SortLabel,
            sortDescending: state.SortDirection == SortDirection.Descending);

        return new GridData<Product>
        {
            Items = data.Items,
            TotalItems = data.TotalCount
        };
    }
}
```

### Custom Cell Templates

```razor
<MudDataGrid T="Product" Items="@Products">
    <Columns>
        <TemplateColumn Title="Status">
            <CellTemplate>
                @if (context.Item.IsActive)
                {
                    <MudChip Color="Color.Success" Size="Size.Small">Active</MudChip>
                }
                else
                {
                    <MudChip Color="Color.Default" Size="Size.Small">Inactive</MudChip>
                }
            </CellTemplate>
        </TemplateColumn>
    </Columns>
</MudDataGrid>
```

### Filtering

```razor
<MudDataGrid T="Product" Items="@Products" Filterable="true" FilterMode="DataGridFilterMode.Simple">
    <Columns>
        <PropertyColumn Property="x => x.Name" Title="Product Name" />
        <PropertyColumn Property="x => x.Price" Title="Price" Format="C2" />
        <PropertyColumn Property="x => x.Category" Title="Category" />
    </Columns>
</MudDataGrid>
```

---

## Theming

### Custom Theme

```csharp
// Program.cs
builder.Services.AddMudServices(config =>
{
    config.SnackbarConfiguration.PositionClass = Defaults.Classes.Position.BottomRight;
});

// App.razor or MainLayout.razor
<MudThemeProvider Theme="@CustomTheme" />

@code {
    private MudTheme CustomTheme = new()
    {
        Palette = new PaletteLight
        {
            Primary = Colors.Blue.Default,
            Secondary = Colors.Green.Default,
            AppbarBackground = Colors.Blue.Default
        },
        PaletteDark = new PaletteDark
        {
            Primary = Colors.Blue.Lighten1
        }
    };
}
```

### Dark Mode Toggle

```razor
<MudSwitch @bind-Checked="@IsDarkMode" Label="Dark Mode" Color="Color.Primary" />

<MudThemeProvider @bind-IsDarkMode="@IsDarkMode" />

@code {
    private bool IsDarkMode = false;
}
```

---

## Documentation Links

- **Official Docs**: https://mudblazor.com/
- **Component Gallery**: https://mudblazor.com/components/
- **API Reference**: https://mudblazor.com/api/
- **GitHub**: https://github.com/MudBlazor/MudBlazor

---

## License

MudBlazor is **open-source** under the MIT License.
- Free for commercial and personal use
- Active community support
- No licensing costs
