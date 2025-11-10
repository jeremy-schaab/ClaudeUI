# Syncfusion Blazor Components Guide

Comprehensive reference for Syncfusion Blazor components used in code generation.

## Overview

Syncfusion Blazor is an enterprise-grade UI component library with 80+ components. This guide covers the most commonly used components for CRUD applications.

## Installation

```bash
# Install Syncfusion Blazor package
dotnet add package Syncfusion.Blazor.Grid
dotnet add package Syncfusion.Blazor.Inputs
dotnet add package Syncfusion.Blazor.Calendars
dotnet add package Syncfusion.Blazor.DropDowns
dotnet add package Syncfusion.Blazor.Buttons
dotnet add package Syncfusion.Blazor.Popups
```

**Add to _Imports.razor**:
```razor
@using Syncfusion.Blazor
@using Syncfusion.Blazor.Grids
@using Syncfusion.Blazor.Inputs
@using Syncfusion.Blazor.Calendars
@using Syncfusion.Blazor.DropDowns
@using Syncfusion.Blazor.Buttons
@using Syncfusion.Blazor.Popups
```

**Register in Program.cs**:
```csharp
builder.Services.AddSyncfusionBlazor();
```

---

## SfGrid - Data Grid Component

### Basic Usage

```razor
<SfGrid DataSource="@Products"
        AllowPaging="true"
        AllowSorting="true"
        AllowFiltering="true">
    <GridColumns>
        <GridColumn Field="@nameof(Product.ProductId)" HeaderText="ID" Width="100" />
        <GridColumn Field="@nameof(Product.Name)" HeaderText="Product Name" Width="200" />
        <GridColumn Field="@nameof(Product.Price)" HeaderText="Price" Format="C2" Width="120" />
    </GridColumns>
</SfGrid>

@code {
    private List<Product> Products = new();
}
```

### CRUD Operations

```razor
<SfGrid @ref="Grid"
        DataSource="@Products"
        Toolbar="@(new List<string>() { "Add", "Edit", "Delete", "Update", "Cancel" })">
    <GridEditSettings AllowAdding="true" AllowEditing="true" AllowDeleting="true" Mode="EditMode.Dialog" />
    <GridEvents OnActionBegin="OnActionBeginHandler" TValue="Product" />
    <GridColumns>
        <GridColumn Field="@nameof(Product.ProductId)" HeaderText="ID" IsPrimaryKey="true" />
        <GridColumn Field="@nameof(Product.Name)" HeaderText="Name" />
        <GridColumn Field="@nameof(Product.Price)" HeaderText="Price" Format="C2" />
    </GridColumns>
</SfGrid>

@code {
    private SfGrid<Product> Grid;
    private List<Product> Products = new();

    private async Task OnActionBeginHandler(ActionEventArgs<Product> args)
    {
        if (args.RequestType == Syncfusion.Blazor.Grids.Action.Save)
        {
            if (args.Action == "Add")
            {
                await ProductService.CreateAsync(args.Data);
            }
            else
            {
                await ProductService.UpdateAsync(args.Data);
            }
        }
        else if (args.RequestType == Syncfusion.Blazor.Grids.Action.Delete)
        {
            await ProductService.DeleteAsync(args.Data.ProductId);
        }
    }
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| DataSource | IEnumerable<T> | Data to display in grid |
| AllowPaging | bool | Enable pagination |
| AllowSorting | bool | Enable column sorting |
| AllowFiltering | bool | Enable filtering |
| Toolbar | List<string> | Toolbar items (Add, Edit, Delete, etc.) |

---

## SfDialog - Modal Dialog

### Basic Usage

```razor
<SfDialog @bind-Visible="@DialogVisible"
          Width="600px"
          IsModal="true"
          ShowCloseIcon="true">
    <DialogTemplates>
        <Header>Edit Product</Header>
        <Content>
            <EditForm Model="@CurrentProduct" OnValidSubmit="@HandleValidSubmit">
                <DataAnnotationsValidator />
                <div class="form-group">
                    <label>Product Name</label>
                    <SfTextBox @bind-Value="@CurrentProduct.Name" />
                    <ValidationMessage For="@(() => CurrentProduct.Name)" />
                </div>
            </EditForm>
        </Content>
    </DialogTemplates>
    <DialogButtons>
        <DialogButton Content="Save" IsPrimary="true" OnClick="@SaveProduct" />
        <DialogButton Content="Cancel" OnClick="@CloseDialog" />
    </DialogButtons>
</SfDialog>

@code {
    private bool DialogVisible = false;
    private Product CurrentProduct = new();

    private async Task SaveProduct()
    {
        await ProductService.UpdateAsync(CurrentProduct);
        DialogVisible = false;
    }

    private void CloseDialog()
    {
        DialogVisible = false;
    }
}
```

---

## SfTextBox - Text Input

```razor
<SfTextBox @bind-Value="@Model.Name"
           Placeholder="Enter product name"
           FloatLabelType="FloatLabelType.Auto" />
```

### Properties
- **Value**: Two-way binding value
- **Placeholder**: Placeholder text
- **FloatLabelType**: Auto, Always, Never
- **Enabled**: Enable/disable input
- **ReadOnly**: Make read-only
- **MaxLength**: Maximum character length

---

## SfNumericTextBox - Numeric Input

```razor
<SfNumericTextBox @bind-Value="@Model.Price"
                  Format="C2"
                  Min="0"
                  Max="999999"
                  FloatLabelType="FloatLabelType.Auto" />
```

### Properties
- **Value**: Numeric value
- **Format**: Number format (N2, C2, P2, etc.)
- **Min**: Minimum value
- **Max**: Maximum value
- **Step**: Increment/decrement step
- **Decimals**: Decimal places

---

## SfDatePicker - Date Selection

```razor
<SfDatePicker @bind-Value="@Model.CreatedDate"
              Format="yyyy-MM-dd"
              FloatLabelType="FloatLabelType.Auto" />
```

### Properties
- **Value**: DateTime value
- **Format**: Date format string
- **Min**: Minimum date
- **Max**: Maximum date
- **ShowClearButton**: Show clear button

---

## SfComboBox - Dropdown with Search

```razor
<SfComboBox @bind-Value="@Model.CategoryId"
            DataSource="@Categories"
            TValue="int"
            TItem="Category"
            Placeholder="Select category"
            AllowFiltering="true"
            FloatLabelType="FloatLabelType.Auto">
    <ComboBoxFieldSettings Value="CategoryId" Text="Name" />
</SfComboBox>

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
- **DataSource**: Data for dropdown
- **TValue**: Type of value
- **TItem**: Type of data item
- **AllowFiltering**: Enable type-ahead search
- **ComboBoxFieldSettings**: Map value and text properties

---

## SfCheckBox - Checkbox

```razor
<SfCheckBox @bind-Checked="@Model.IsActive" Label="Active" />
```

---

## SfSwitch - Toggle Switch

```razor
<SfSwitch @bind-Checked="@Model.IsEnabled" />
```

---

## C# Type to Syncfusion Component Mapping

| C# Type | Syncfusion Component | Configuration |
|---------|---------------------|---------------|
| string | SfTextBox | FloatLabelType="Auto" |
| int | SfNumericTextBox<int> | Format="N0" |
| decimal | SfNumericTextBox<decimal> | Format="C2" |
| double | SfNumericTextBox<double> | Format="N2" |
| DateTime | SfDatePicker<DateTime> | Format="yyyy-MM-dd" |
| DateTimeOffset | SfDatePicker<DateTimeOffset> | Format="yyyy-MM-dd" |
| bool | SfCheckBox | DisplayAsCheckBox |
| enum | SfDropDownList | DataSource=Enum.GetValues |
| FK (int) | SfComboBox | AllowFiltering=true |

---

## Best Practices

### 1. Use FloatLabelType for Better UX
```razor
<SfTextBox @bind-Value="@Model.Name"
           Placeholder="Product Name"
           FloatLabelType="FloatLabelType.Auto" />
```

### 2. Enable Filtering on ComboBox
```razor
<SfComboBox AllowFiltering="true" FilterType="FilterType.Contains" />
```

### 3. Use Grid Events for CRUD
```razor
<GridEvents OnActionBegin="OnActionBeginHandler"
            OnActionComplete="OnActionCompleteHandler"
            TValue="Product" />
```

### 4. Format Numbers and Dates
```razor
<GridColumn Format="C2" /> <!-- Currency -->
<GridColumn Format="N2" /> <!-- Number with 2 decimals -->
<GridColumn Format="yyyy-MM-dd" /> <!-- Date -->
```

### 5. Set Primary Keys
```razor
<GridColumn Field="@nameof(Product.ProductId)" IsPrimaryKey="true" />
```

---

## Common Patterns

### Master-Detail Grid

```razor
<SfGrid DataSource="@Orders">
    <GridTemplates>
        <DetailTemplate>
            <SfGrid DataSource="@((context as Order).OrderItems)">
                <GridColumns>
                    <GridColumn Field="ProductName" />
                    <GridColumn Field="Quantity" />
                    <GridColumn Field="Price" Format="C2" />
                </GridColumns>
            </SfGrid>
        </DetailTemplate>
    </GridTemplates>
    <GridColumns>
        <GridColumn Field="OrderId" />
        <GridColumn Field="CustomerName" />
        <GridColumn Field="OrderDate" Format="yyyy-MM-dd" />
    </GridColumns>
</SfGrid>
```

### Confirmation Dialog

```razor
<SfDialog @bind-Visible="@ConfirmVisible" Width="400px" IsModal="true">
    <DialogTemplates>
        <Header>Confirm Delete</Header>
        <Content>Are you sure you want to delete this item?</Content>
    </DialogTemplates>
    <DialogButtons>
        <DialogButton Content="Delete" IsPrimary="true" OnClick="@ConfirmDelete" />
        <DialogButton Content="Cancel" OnClick="@(() => ConfirmVisible = false)" />
    </DialogButtons>
</SfDialog>
```

---

## Documentation Links

- **Official Docs**: https://blazor.syncfusion.com/documentation/introduction
- **Grid Demos**: https://blazor.syncfusion.com/demos/datagrid/overview
- **Component API**: https://help.syncfusion.com/cr/blazor

---

## License

Syncfusion Blazor is a **commercial** product. Requires license for production use.
- Free community license available for companies with <$1M revenue
- 30-day free trial
