# Telerik UI for Blazor Components Guide

Comprehensive reference for Telerik UI for Blazor components used in code generation.

## Overview

Telerik UI for Blazor is a professional UI component library with 100+ components featuring modern design and comprehensive functionality.

## Installation

```bash
# Install Telerik UI for Blazor
dotnet add package Telerik.UI.for.Blazor
```

**Add to _Imports.razor**:
```razor
@using Telerik.Blazor
@using Telerik.Blazor.Components
@using Telerik.SvgIcons
```

**Register in Program.cs**:
```csharp
builder.Services.AddTelerikBlazor();
```

---

## TelerikGrid - Data Grid Component

### Basic Usage

```razor
<TelerikGrid Data="@Products"
             Pageable="true"
             Sortable="true"
             FilterMode="@GridFilterMode.FilterRow">
    <GridColumns>
        <GridColumn Field="@nameof(Product.ProductId)" Title="ID" Width="100px" />
        <GridColumn Field="@nameof(Product.Name)" Title="Product Name" Width="200px" />
        <GridColumn Field="@nameof(Product.Price)" Title="Price" DisplayFormat="{0:C2}" Width="120px" />
    </GridColumns>
</TelerikGrid>

@code {
    private List<Product> Products = new();
}
```

### CRUD Operations

```razor
<TelerikGrid Data="@Products"
             OnUpdate="@UpdateHandler"
             OnDelete="@DeleteHandler"
             OnCreate="@CreateHandler"
             Pageable="true"
             EditMode="@GridEditMode.Popup">
    <GridToolBarTemplate>
        <GridCommandButton Command="Add" Icon="@SvgIcon.Plus">Add Product</GridCommandButton>
    </GridToolBarTemplate>
    <GridColumns>
        <GridColumn Field="@nameof(Product.ProductId)" Title="ID" Editable="false" />
        <GridColumn Field="@nameof(Product.Name)" Title="Name" />
        <GridColumn Field="@nameof(Product.Price)" Title="Price" DisplayFormat="{0:C2}" />
        <GridCommandColumn Width="180px">
            <GridCommandButton Command="Edit" Icon="@SvgIcon.Pencil">Edit</GridCommandButton>
            <GridCommandButton Command="Delete" Icon="@SvgIcon.Trash">Delete</GridCommandButton>
        </GridCommandColumn>
    </GridColumns>
</TelerikGrid>

@code {
    private List<Product> Products = new();

    private async Task CreateHandler(GridCommandEventArgs args)
    {
        var product = (Product)args.Item;
        await ProductService.CreateAsync(product);
        await LoadDataAsync();
    }

    private async Task UpdateHandler(GridCommandEventArgs args)
    {
        var product = (Product)args.Item;
        await ProductService.UpdateAsync(product);
        await LoadDataAsync();
    }

    private async Task DeleteHandler(GridCommandEventArgs args)
    {
        var product = (Product)args.Item;
        await ProductService.DeleteAsync(product.ProductId);
        await LoadDataAsync();
    }
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| Data | IEnumerable<T> | Data to display |
| Pageable | bool | Enable pagination |
| Sortable | bool | Enable sorting |
| FilterMode | GridFilterMode | FilterRow, FilterMenu, None |
| EditMode | GridEditMode | Inline, Popup, Incell |
| OnUpdate | EventCallback | Update event handler |
| OnDelete | EventCallback | Delete event handler |
| OnCreate | EventCallback | Create event handler |

---

## TelerikDialog - Modal Dialog

### Basic Usage

```razor
<TelerikDialog @bind-Visible="@DialogVisible"
               Width="600px"
               Title="@DialogTitle">
    <DialogContent>
        <EditForm Model="@CurrentProduct" OnValidSubmit="@HandleValidSubmit">
            <DataAnnotationsValidator />
            <ValidationSummary />

            <div class="k-form-field">
                <label class="k-label k-form-label">Product Name</label>
                <TelerikTextBox @bind-Value="@CurrentProduct.Name" />
                <ValidationMessage For="@(() => CurrentProduct.Name)" />
            </div>

            <div class="k-form-field">
                <label class="k-label k-form-label">Price</label>
                <TelerikNumericTextBox @bind-Value="@CurrentProduct.Price" Format="C2" />
                <ValidationMessage For="@(() => CurrentProduct.Price)" />
            </div>
        </EditForm>
    </DialogContent>
    <DialogButtons>
        <TelerikButton OnClick="@SaveProduct" ThemeColor="@ThemeColor.Primary">Save</TelerikButton>
        <TelerikButton OnClick="@CloseDialog">Cancel</TelerikButton>
    </DialogButtons>
</TelerikDialog>

@code {
    private bool DialogVisible = false;
    private Product CurrentProduct = new();
    private string DialogTitle => CurrentProduct.ProductId == 0 ? "Create Product" : "Edit Product";

    private async Task SaveProduct()
    {
        if (CurrentProduct.ProductId == 0)
        {
            await ProductService.CreateAsync(CurrentProduct);
        }
        else
        {
            await ProductService.UpdateAsync(CurrentProduct);
        }
        DialogVisible = false;
        await LoadDataAsync();
    }

    private void CloseDialog()
    {
        DialogVisible = false;
    }
}
```

---

## TelerikTextBox - Text Input

```razor
<TelerikTextBox @bind-Value="@Model.Name"
                Placeholder="Enter product name" />
```

### Properties
- **Value**: Two-way binding
- **Placeholder**: Placeholder text
- **Enabled**: Enable/disable
- **ReadOnly**: Make read-only
- **MaxLength**: Max character length
- **Width**: Component width

---

## TelerikNumericTextBox - Numeric Input

```razor
<TelerikNumericTextBox @bind-Value="@Model.Price"
                       Format="C2"
                       Min="0"
                       Max="999999"
                       Decimals="2" />
```

### Properties
- **Value**: Numeric value
- **Format**: Number format (C2, N2, P2)
- **Min**: Minimum value
- **Max**: Maximum value
- **Step**: Increment step
- **Decimals**: Decimal places

---

## TelerikDatePicker - Date Selection

```razor
<TelerikDatePicker @bind-Value="@Model.CreatedDate"
                   Format="yyyy-MM-dd"
                   Min="@DateTime.Today.AddYears(-10)"
                   Max="@DateTime.Today" />
```

### Properties
- **Value**: DateTime value
- **Format**: Date format
- **Min**: Minimum date
- **Max**: Maximum date
- **ShowClearButton**: Show clear button

---

## TelerikComboBox - Dropdown with Search

```razor
<TelerikComboBox Data="@Categories"
                 @bind-Value="@Model.CategoryId"
                 ValueField="CategoryId"
                 TextField="Name"
                 Filterable="true"
                 Placeholder="Select category">
</TelerikComboBox>

@code {
    private List<Category> Categories = new();

    protected override async Task OnInitializedAsync()
    {
        Categories = await CategoryService.GetAllAsync();
    }
}
```

### Properties
- **Data**: Data source
- **Value**: Selected value
- **ValueField**: Property for value
- **TextField**: Property for display text
- **Filterable**: Enable type-ahead
- **Placeholder**: Placeholder text

---

## TelerikCheckBox - Checkbox

```razor
<TelerikCheckBox @bind-Value="@Model.IsActive" />
<label>Active</label>
```

---

## TelerikSwitch - Toggle Switch

```razor
<TelerikSwitch @bind-Value="@Model.IsEnabled" />
```

---

## C# Type to Telerik Component Mapping

| C# Type | Telerik Component | Configuration |
|---------|-------------------|---------------|
| string | TelerikTextBox | Placeholder |
| int | TelerikNumericTextBox<int> | Format="N0" |
| decimal | TelerikNumericTextBox<decimal> | Format="C2" |
| double | TelerikNumericTextBox<double> | Format="N2" |
| DateTime | TelerikDatePicker | Format="yyyy-MM-dd" |
| DateTimeOffset | TelerikDatePicker | Format="yyyy-MM-dd" |
| bool | TelerikCheckBox | - |
| enum | TelerikDropDownList | Data=Enum.GetValues |
| FK (int) | TelerikComboBox | Filterable=true |

---

## Best Practices

### 1. Use SvgIcon for Icons
```razor
<GridCommandButton Command="Edit" Icon="@SvgIcon.Pencil">Edit</GridCommandButton>
<GridCommandButton Command="Delete" Icon="@SvgIcon.Trash">Delete</GridCommandButton>
```

Common icons:
- `SvgIcon.Plus` - Add
- `SvgIcon.Pencil` - Edit
- `SvgIcon.Trash` - Delete
- `SvgIcon.Save` - Save
- `SvgIcon.X` - Cancel/Close

### 2. Use ThemeColor for Buttons
```razor
<TelerikButton ThemeColor="@ThemeColor.Primary">Save</TelerikButton>
<TelerikButton ThemeColor="@ThemeColor.Secondary">Cancel</TelerikButton>
```

### 3. Enable Filtering on ComboBox
```razor
<TelerikComboBox Filterable="true" FilterOperator="@StringFilterOperator.Contains" />
```

### 4. Format Grid Columns
```razor
<GridColumn DisplayFormat="{0:C2}" /> <!-- Currency -->
<GridColumn DisplayFormat="{0:N2}" /> <!-- Number with 2 decimals -->
<GridColumn DisplayFormat="{0:yyyy-MM-dd}" /> <!-- Date -->
```

### 5. Use EditMode for Better UX
```razor
<TelerikGrid EditMode="@GridEditMode.Popup"> <!-- Popup dialog for editing -->
<TelerikGrid EditMode="@GridEditMode.Inline"> <!-- Inline editing -->
```

---

## Common Patterns

### Master-Detail Grid

```razor
<TelerikGrid Data="@Orders">
    <DetailTemplate>
        @{
            var order = context as Order;
            <TelerikGrid Data="@order.OrderItems">
                <GridColumns>
                    <GridColumn Field="@nameof(OrderItem.ProductName)" Title="Product" />
                    <GridColumn Field="@nameof(OrderItem.Quantity)" Title="Quantity" />
                    <GridColumn Field="@nameof(OrderItem.Price)" Title="Price" DisplayFormat="{0:C2}" />
                </GridColumns>
            </TelerikGrid>
        }
    </DetailTemplate>
    <GridColumns>
        <GridColumn Field="@nameof(Order.OrderId)" Title="Order ID" />
        <GridColumn Field="@nameof(Order.CustomerName)" Title="Customer" />
        <GridColumn Field="@nameof(Order.OrderDate)" Title="Date" DisplayFormat="{0:yyyy-MM-dd}" />
    </GridColumns>
</TelerikGrid>
```

### Confirmation Dialog

```razor
<TelerikDialog @bind-Visible="@ConfirmVisible" Width="400px">
    <DialogContent>
        <p>Are you sure you want to delete this item?</p>
    </DialogContent>
    <DialogButtons>
        <TelerikButton OnClick="@ConfirmDelete" ThemeColor="@ThemeColor.Primary">Delete</TelerikButton>
        <TelerikButton OnClick="@(() => ConfirmVisible = false)">Cancel</TelerikButton>
    </DialogButtons>
</TelerikDialog>
```

### Loading Indicator

```razor
<TelerikLoader Visible="@IsLoading" />

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

---

## Documentation Links

- **Official Docs**: https://docs.telerik.com/blazor-ui/introduction
- **Grid Demos**: https://demos.telerik.com/blazor-ui/grid/overview
- **Component API**: https://docs.telerik.com/blazor-ui/api/

---

## License

Telerik UI for Blazor is a **commercial** product. Requires license for production use.
- Free trial available
- DevCraft bundle includes all Telerik products
