# Entity Model Analysis Guide

Comprehensive guide for analyzing .NET entity models to generate appropriate Blazor components with Syncfusion, Telerik UI, or MudBlazor.

## Overview

Entity analysis is the process of examining a C# entity class to determine:
1. **Property Types** - What data types are used
2. **Validation Attributes** - What validation rules apply
3. **Relationships** - Navigation properties and foreign keys
4. **Display Requirements** - How properties should be displayed
5. **Component Selection** - Which UI components to use

---

## Step 1: Locate Entity Class

### Search Patterns

```bash
# Find entity by name
rg "public class Product" --type cs

# Common locations
Models/
Entities/
Domain/
Data/Models/
Core/Entities/
```

### Entity Class Identification

**Entity characteristics**:
- Public class
- Properties with getters/setters
- May have [Table] attribute
- May inherit from base entity
- Located in Models, Entities, or Domain namespace

**Example entity**:
```csharp
[Table("Products")]
public class Product
{
    public int ProductId { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; }
}
```

---

## Step 2: Extract Properties

### Property Categories

#### Scalar Properties
Properties with primitive or value types that require editors:

```csharp
// String properties
public string Name { get; set; }
public string Description { get; set; }

// Numeric properties
public int Quantity { get; set; }
public decimal Price { get; set; }
public double Weight { get; set; }

// Date/Time properties
public DateTime CreatedDate { get; set; }
public DateTimeOffset LastModified { get; set; }

// Boolean properties
public bool IsActive { get; set; }
public bool IsDeleted { get; set; }

// Enum properties
public ProductStatus Status { get; set; }
```

#### Navigation Properties
Properties representing relationships:

```csharp
// One-to-Many (belongs to)
public Category Category { get; set; }
public Supplier Supplier { get; set; }

// One-to-Many (has many)
public ICollection<OrderItem> OrderItems { get; set; }
public List<ProductReview> Reviews { get; set; }

// Many-to-Many
public ICollection<Tag> Tags { get; set; }
```

#### Foreign Key Properties
Properties that reference other entities:

```csharp
public int CategoryId { get; set; }
public int SupplierId { get; set; }
public Guid TenantId { get; set; }
```

### Property Analysis Pattern

```csharp
public class PropertyInfo
{
    public string Name { get; set; }
    public string TypeName { get; set; }
    public bool IsNullable { get; set; }
    public bool IsCollection { get; set; }
    public bool IsNavigation { get; set; }
    public bool IsForeignKey { get; set; }
    public List<ValidationAttribute> Validations { get; set; }
}
```

---

## Step 3: Analyze Validation Attributes

### Common Validation Attributes

#### Required
```csharp
[Required(ErrorMessage = "Name is required")]
public string Name { get; set; }

// Component implication: Mark as required in UI
```

#### StringLength
```csharp
[StringLength(100, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 100 characters")]
public string Name { get; set; }

// Component implication: Set MaxLength property
```

#### Range
```csharp
[Range(0, 999999, ErrorMessage = "Price must be between 0 and 999999")]
public decimal Price { get; set; }

// Component implication: Set Min/Max on numeric input
```

#### RegularExpression
```csharp
[RegularExpression(@"^\d{5}$", ErrorMessage = "Zip code must be 5 digits")]
public string ZipCode { get; set; }

// Component implication: Add pattern validation
```

#### EmailAddress
```csharp
[EmailAddress(ErrorMessage = "Invalid email address")]
public string Email { get; set; }

// Component implication: Use email input type
```

#### Phone
```csharp
[Phone(ErrorMessage = "Invalid phone number")]
public string PhoneNumber { get; set; }

// Component implication: Use tel input type
```

#### Url
```csharp
[Url(ErrorMessage = "Invalid URL")]
public string Website { get; set; }

// Component implication: Use url input type
```

#### Compare
```csharp
[Compare("Password", ErrorMessage = "Passwords do not match")]
public string ConfirmPassword { get; set; }

// Component implication: Add comparison validation
```

#### Custom Validation
```csharp
[CustomValidation(typeof(ProductValidator), "ValidatePrice")]
public decimal Price { get; set; }

// Component implication: Add custom validation logic
```

---

## Step 4: Identify Relationships

### Foreign Key Detection

**Pattern 1: Convention-based**
```csharp
// Foreign key property named {EntityName}Id
public int CategoryId { get; set; }
public Category Category { get; set; }
```

**Pattern 2: [ForeignKey] attribute**
```csharp
[ForeignKey("Category")]
public int CategoryKey { get; set; }
public Category Category { get; set; }
```

**Pattern 3: Explicit in navigation property**
```csharp
public int CategoryId { get; set; }

[ForeignKey("CategoryId")]
public Category Category { get; set; }
```

### Relationship Types

#### One-to-Many (Belongs To)
```csharp
public class Product
{
    public int CategoryId { get; set; }  // Foreign key
    public Category Category { get; set; }  // Navigation property
}

// UI implication: Need ComboBox/Select for category selection
```

#### One-to-Many (Has Many)
```csharp
public class Category
{
    public ICollection<Product> Products { get; set; }
}

// UI implication: Display as grid or list (not in form)
```

#### Many-to-Many
```csharp
public class Product
{
    public ICollection<ProductTag> ProductTags { get; set; }
}

public class ProductTag
{
    public int ProductId { get; set; }
    public Product Product { get; set; }
    public int TagId { get; set; }
    public Tag Tag { get; set; }
}

// UI implication: Multi-select control or tag picker
```

---

## Step 5: Property Type to Component Mapping

### Syncfusion Mapping

| C# Type | Component | Configuration |
|---------|-----------|---------------|
| string | SfTextBox | FloatLabelType="Auto" |
| string (multiline) | SfTextBox | Multiline="true" |
| int | SfNumericTextBox<int> | Format="N0" |
| decimal | SfNumericTextBox<decimal> | Format="C2", Min="0" |
| double | SfNumericTextBox<double> | Format="N2" |
| DateTime | SfDatePicker<DateTime> | Format="yyyy-MM-dd" |
| DateTimeOffset | SfDatePicker<DateTimeOffset> | Format="yyyy-MM-dd" |
| bool | SfCheckBox | - |
| enum | SfDropDownList<TEnum> | DataSource=Enum.GetValues |
| FK (int) | SfComboBox<int, TEntity> | AllowFiltering=true |

### Telerik Mapping

| C# Type | Component | Configuration |
|---------|-----------|---------------|
| string | TelerikTextBox | Placeholder |
| string (multiline) | TelerikTextArea | Rows="5" |
| int | TelerikNumericTextBox<int> | Format="N0" |
| decimal | TelerikNumericTextBox<decimal> | Format="C2", Min="0" |
| double | TelerikNumericTextBox<double> | Format="N2" |
| DateTime | TelerikDatePicker<DateTime> | Format="yyyy-MM-dd" |
| DateTimeOffset | TelerikDatePicker<DateTimeOffset> | Format="yyyy-MM-dd" |
| bool | TelerikCheckBox | - |
| enum | TelerikDropDownList<TEnum> | Data=Enum.GetValues |
| FK (int) | TelerikComboBox<int, TEntity> | Filterable=true |

### MudBlazor Mapping

| C# Type | Component | Configuration |
|---------|-----------|---------------|
| string | MudTextField | Variant="Outlined" |
| string (multiline) | MudTextField | Lines="5" |
| int | MudNumericField<int> | Format="N0" |
| decimal | MudNumericField<decimal> | Format="C2", Min="0" |
| double | MudNumericField<double> | Format="N2" |
| DateTime | MudDatePicker | DateFormat="yyyy-MM-dd" |
| DateTimeOffset | MudDatePicker | DateFormat="yyyy-MM-dd" |
| bool | MudCheckBox | Color="Primary" |
| enum | MudSelect<TEnum> | - |
| FK (int) | MudAutocomplete<TEntity> | SearchFunc |

---

## Step 6: Determine Component Generation Strategy

### Grid Generation

**Include in grid**:
- ✅ Scalar properties (string, int, decimal, DateTime, etc.)
- ✅ Foreign key display (via navigation property)
- ✅ Enum values (as text)
- ✅ Boolean (as checkbox or icon)
- ❌ Collections (too complex for grid)
- ❌ Large text fields (use in detail view)

**Grid column configuration**:
```csharp
// Example analysis result
GridColumns = new[]
{
    new { Field = "ProductId", Title = "ID", Width = "100px", IsPrimaryKey = true },
    new { Field = "Name", Title = "Product Name", Width = "200px" },
    new { Field = "Price", Title = "Price", Format = "C2", Width = "120px" },
    new { Field = "Category.Name", Title = "Category", Width = "150px" },
    new { Field = "IsActive", Title = "Active", Width = "100px", DisplayAsCheckBox = true }
};
```

### Form Generation

**Include in form**:
- ✅ All scalar properties
- ✅ Foreign key properties (as lookup)
- ✅ Enum properties (as dropdown)
- ✅ Boolean properties (as checkbox/switch)
- ❌ Primary key (usually auto-generated)
- ❌ Collections (handle separately)
- ❌ Computed properties (read-only)

**Form field order**:
1. Most important fields first
2. Group related fields
3. Required fields before optional
4. Logical flow (e.g., Name → Description → Price)

---

## Step 7: Detect Special Patterns

### Multi-Tenant Pattern

```csharp
public class Product
{
    public int ProductId { get; set; }
    public Guid TenantId { get; set; }  // Multi-tenant indicator
    public string Name { get; set; }
}

// Component implication: Filter by TenantId automatically
```

### Soft Delete Pattern

```csharp
public class Product
{
    public int ProductId { get; set; }
    public bool IsDeleted { get; set; }  // Soft delete indicator
    public DateTime? DeletedAt { get; set; }
}

// Component implication: Filter out deleted items
```

### Audit Fields

```csharp
public class Product
{
    public int ProductId { get; set; }
    public DateTime CreatedDate { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string ModifiedBy { get; set; }
}

// Component implication: Display as read-only in form
```

### Versioning/Concurrency

```csharp
public class Product
{
    public int ProductId { get; set; }
    [Timestamp]
    public byte[] RowVersion { get; set; }
}

// Component implication: Include in update for concurrency check
```

---

## Step 8: Generate Service Interface Detection

### Service Naming Patterns

```csharp
// Pattern 1: Repository
IProductRepository
ProductRepository

// Pattern 2: Service
IProductService
ProductService

// Pattern 3: Manager
IProductManager
ProductManager
```

### Service Method Detection

```bash
# Search for service interface
rg "interface IProductService" --type cs

# Common methods to expect
Task<Product> GetByIdAsync(int id);
Task<List<Product>> GetAllAsync();
Task<Product> CreateAsync(Product product);
Task UpdateAsync(Product product);
Task DeleteAsync(int id);
```

---

## Complete Entity Analysis Example

### Input Entity

```csharp
namespace MyApp.Models
{
    [Table("Products")]
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Name is required")]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        [Range(0.01, 999999.99)]
        public decimal Price { get; set; }

        public decimal? DiscountPrice { get; set; }

        [Range(0, 10000)]
        public int StockQuantity { get; set; }

        [Required]
        public int CategoryId { get; set; }
        public Category Category { get; set; }

        public int? SupplierId { get; set; }
        public Supplier Supplier { get; set; }

        public ProductStatus Status { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedBy { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; }
    }

    public enum ProductStatus
    {
        Draft,
        Active,
        Discontinued
    }
}
```

### Analysis Results

```json
{
  "EntityName": "Product",
  "PrimaryKey": "ProductId",
  "Properties": [
    {
      "Name": "Name",
      "Type": "string",
      "Required": true,
      "MaxLength": 100,
      "Component": "TextBox",
      "IncludeInGrid": true,
      "IncludeInForm": true
    },
    {
      "Name": "Description",
      "Type": "string",
      "Required": false,
      "MaxLength": 500,
      "Component": "TextArea",
      "IncludeInGrid": false,
      "IncludeInForm": true
    },
    {
      "Name": "Price",
      "Type": "decimal",
      "Required": true,
      "Min": 0.01,
      "Max": 999999.99,
      "Format": "C2",
      "Component": "NumericTextBox",
      "IncludeInGrid": true,
      "IncludeInForm": true
    },
    {
      "Name": "DiscountPrice",
      "Type": "decimal?",
      "Required": false,
      "Format": "C2",
      "Component": "NumericTextBox",
      "IncludeInGrid": false,
      "IncludeInForm": true
    },
    {
      "Name": "StockQuantity",
      "Type": "int",
      "Required": false,
      "Min": 0,
      "Max": 10000,
      "Format": "N0",
      "Component": "NumericTextBox",
      "IncludeInGrid": true,
      "IncludeInForm": true
    },
    {
      "Name": "CategoryId",
      "Type": "int",
      "Required": true,
      "IsForeignKey": true,
      "NavigationProperty": "Category",
      "Component": "ComboBox",
      "LookupEntity": "Category",
      "IncludeInGrid": false,
      "IncludeInForm": true
    },
    {
      "Name": "Category.Name",
      "Type": "string",
      "DisplayOnly": true,
      "IncludeInGrid": true,
      "IncludeInForm": false
    },
    {
      "Name": "SupplierId",
      "Type": "int?",
      "Required": false,
      "IsForeignKey": true,
      "NavigationProperty": "Supplier",
      "Component": "ComboBox",
      "LookupEntity": "Supplier",
      "IncludeInGrid": false,
      "IncludeInForm": true
    },
    {
      "Name": "Status",
      "Type": "ProductStatus",
      "Required": false,
      "IsEnum": true,
      "Component": "DropDownList",
      "IncludeInGrid": true,
      "IncludeInForm": true
    },
    {
      "Name": "IsActive",
      "Type": "bool",
      "Component": "CheckBox",
      "IncludeInGrid": true,
      "IncludeInForm": true
    }
  ],
  "AuditFields": ["CreatedDate", "CreatedBy", "ModifiedDate", "ModifiedBy"],
  "Collections": ["OrderItems"],
  "ServiceInterface": "IProductService",
  "HasMultiTenant": false,
  "HasSoftDelete": false
}
```

---

## Entity Analysis Checklist

When analyzing an entity, verify:

- [ ] Entity class located
- [ ] Primary key identified
- [ ] All scalar properties extracted
- [ ] Validation attributes parsed
- [ ] Foreign keys identified
- [ ] Navigation properties identified
- [ ] Collections identified
- [ ] Enum types identified
- [ ] Audit fields detected
- [ ] Multi-tenant pattern detected (if applicable)
- [ ] Soft delete pattern detected (if applicable)
- [ ] Service interface name determined
- [ ] Component mappings determined
- [ ] Grid columns configured
- [ ] Form fields configured

---

## Best Practices

### Property Analysis
- ✅ Read entire entity class
- ✅ Include base class properties
- ✅ Check for [NotMapped] properties (exclude from DB)
- ✅ Identify computed properties (read-only)
- ❌ Don't include navigation collections in forms

### Component Selection
- ✅ Match C# type to appropriate UI component
- ✅ Consider validation attributes
- ✅ Use lookup components for foreign keys
- ✅ Format numeric/date values appropriately
- ❌ Don't use text input for large text (use textarea)

### Service Detection
- ✅ Search for I{EntityName}Repository
- ✅ Search for I{EntityName}Service
- ✅ Check for async methods
- ✅ Verify CRUD operations exist
- ❌ Don't assume service exists (verify first)

### Error Handling
- ✅ Handle missing entity class gracefully
- ✅ Handle missing service interface gracefully
- ✅ Warn about unsupported types
- ✅ Validate entity structure before generation
- ❌ Don't fail silently (report issues to user)
