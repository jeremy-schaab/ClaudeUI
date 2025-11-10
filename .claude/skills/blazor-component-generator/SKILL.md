---
name: blazor-component-generator
description: This skill generates production-ready Blazor Server and Blazor WebAssembly components using Syncfusion, Telerik UI, or MudBlazor frameworks. Use when users need to scaffold CRUD pages, data grids, forms with validation, dialogs, lookup components, or complete component hierarchies following C# 13 and .NET 9 best practices. Activates for component generation, scaffolding requests, Blazor development, or when users mention "scaffold", "generate component", "Blazor grid", "Blazor form", "CRUD page", "Syncfusion", "Telerik", "MudBlazor", or "Blazor UI component".
---

# Blazor Component Generator

## Purpose

The **Blazor Component Generator** is a comprehensive scaffolding skill that automates the creation of production-ready Blazor Server and Blazor WebAssembly components using three major UI frameworks:

- **Syncfusion Blazor** - Enterprise-grade components with extensive features
- **Telerik UI for Blazor** - Professional UI components with modern design
- **MudBlazor** - Open-source Material Design components

This skill provides:
- **Multi-Framework Support**: Generate components for Syncfusion, Telerik, or MudBlazor
- **Automatic Framework Detection**: Detects which UI framework your project uses
- **Entity-Based Scaffolding**: Analyzes entity models to generate appropriate components
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Form Generation**: Smart forms with validation and appropriate editors
- **Data Grids**: Sortable, filterable, pageable data grids with CRUD operations
- **Dialog Components**: Modal dialogs for create/edit operations
- **Lookup Components**: Dropdown/ComboBox components for entity selection
- **Best Practices**: Follows C# 13, .NET 9, and Blazor best practices
- **Generic & Reusable**: Works with any .NET project structure

## When to Use This Skill

Use the Blazor Component Generator skill when you need to:

### Component Scaffolding
- **Generate CRUD pages** with data grid, create/edit dialogs, and delete confirmation
- **Scaffold data grids** for displaying and managing collections of entities
- **Create forms** with automatic editor selection based on property types
- **Build dialog components** for modal create/edit operations
- **Generate lookup components** for entity selection (dropdown, combobox)
- **Create master-detail views** with parent-child relationships

### Blazor Development Acceleration
- **Jumpstart Blazor projects** with standard component patterns
- **Standardize component structure** across your application
- **Reduce boilerplate code** by 70-90% for common scenarios
- **Apply consistent patterns** for data access, validation, and error handling

### Multi-Framework Projects
- **Switch between UI frameworks** easily (Syncfusion, Telerik, MudBlazor)
- **Compare frameworks** by generating same component in different frameworks
- **Migrate between frameworks** using generated code as starting point

### Entity-Based Development
- **Analyze entity models** to determine appropriate components
- **Generate components from entities** with automatic type mapping
- **Handle relationships** (one-to-many, many-to-many) in generated components
- **Apply validation attributes** from entity models

### Multi-Tenant Applications
- **Generate tenant-aware components** with automatic tenant filtering
- **Implement tenant isolation** in data access layer
- **Add tenant context** to all generated operations

### Modernization
- **Upgrade legacy Blazor components** to use modern UI frameworks
- **Apply C# 13 features** (primary constructors, params collections)
- **Implement .NET 9 patterns** (HybridCache, minimal APIs)
- **Use modern async/await** patterns throughout

## Configuration

### Automatic UI Framework Detection

The skill automatically detects which UI framework your project uses by checking:

1. **NuGet Package References** in `.csproj` files:
   - `Syncfusion.Blazor.*` → Syncfusion detected
   - `Telerik.UI.for.Blazor` → Telerik UI detected
   - `MudBlazor` → MudBlazor detected

2. **Using Directives** in `_Imports.razor`:
   - `@using Syncfusion.Blazor.*`
   - `@using Telerik.Blazor.*`
   - `@using MudBlazor`

3. **Manual Override**: User can specify framework explicitly

### Project Structure Adaptation

The skill adapts to your project structure by auto-detecting:

**Component Locations**:
- `Components/` (default .NET 9 structure)
- `Pages/`
- `Shared/`
- `Components/Pages/`
- `Components/Shared/`

**Service Patterns**:
- Repository Pattern: `I{Entity}Repository`
- Manager Pattern: `I{Entity}Manager`
- Service Pattern: `I{Entity}Service`
- Direct DbContext: `{Project}DbContext`

**Naming Conventions**:
- PascalCase components: `ProductGrid.razor`, `CustomerDialog.razor`
- Kebab-case routes: `/products`, `/customers`
- Or project-specific conventions detected from existing files

### Configuration Files

**`assets/ui-framework-config.json`** - UI framework detection and configuration
**`assets/component-patterns.json`** - Component naming and structure
**`assets/field-types.json`** - Property type to UI editor mappings
**`assets/syncfusion-components.json`** - Syncfusion-specific configurations
**`assets/telerik-components.json`** - Telerik-specific configurations
**`assets/mudblazor-components.json`** - MudBlazor-specific configurations

---

## Step-by-Step Implementation

This section provides detailed, executable workflows that Claude can follow to generate components.

### Workflow 1: Generate Complete CRUD Page

#### Step 1: Receive User Request

**User Input Examples**:
- "Generate a CRUD page for Product entity using Syncfusion"
- "Scaffold a complete CRUD interface for Customer"
- "Create CRUD operations for Order using MudBlazor"

**Extract Parameters**:
- Entity name (e.g., "Product", "Customer", "Order")
- UI framework (explicit or auto-detect)
- Options (multi-tenant, read-only, etc.)

#### Step 2: Detect UI Framework

**If user specified framework**:
- Use specified framework (Syncfusion, Telerik, or MudBlazor)

**If not specified, auto-detect**:

**Actions**:
```bash
# Search for csproj files and check package references
rg "Syncfusion.Blazor" --glob "*.csproj"
# If found → Framework = Syncfusion

rg "Telerik.UI.for.Blazor" --glob "*.csproj"
# If found → Framework = Telerik

rg "MudBlazor" --glob "*.csproj"
# If found → MudBlazor
```

**Expected Output**:
```
✓ UI Framework detected: Syncfusion Blazor
  Version: 27.1.48
```

#### Step 3: Locate Entity Model

**Actions**:
```bash
# Find entity class
rg "public class {EntityName}" --type cs

# Common locations
rg "public class Product" Models/ --type cs
rg "public class Product" Entities/ --type cs
```

**Read entity file** and extract:
- Properties and their types
- Validation attributes
- Navigation properties (relationships)

#### Step 4: Generate Component Code

Load appropriate template based on detected framework and generate component file with proper placeholders replaced.

Refer to `references/entity-analysis.md` for detailed property analysis techniques.

#### Step 5: Report Completion

Output summary of generated component with next steps for user.

---

## Bundled Resources

### Configuration Files

**`assets/ui-framework-config.json`** ✓ Complete
- Framework detection logic
- Package name patterns
- Using directive patterns

**`assets/component-patterns.json`** ✓ Updated (generic)
- Component naming conventions
- Service interface detection

**`assets/field-types.json`** ✓ Updated (multi-framework)
- C# type to UI editor mappings for all 3 frameworks
- Validation attribute handling

**`assets/syncfusion-components.json`** ✓ New
**`assets/telerik-components.json`** ✓ Updated
**`assets/mudblazor-components.json`** ✓ New

### Reference Documentation

**`references/syncfusion-components-guide.md`** - Comprehensive Syncfusion reference
**`references/telerik-components-guide.md`** - Comprehensive Telerik reference
**`references/mudblazor-components-guide.md`** - Comprehensive MudBlazor reference
**`references/blazor-patterns.md`** - Blazor component patterns and best practices
**`references/entity-analysis.md`** - Entity model analysis techniques
**`references/troubleshooting.md`** - Common errors and solutions

### Templates

#### Syncfusion Templates ✓ New
- `templates/syncfusion/grid-component.razor.template`
- `templates/syncfusion/dialog-component.razor.template`
- `templates/syncfusion/form-component.razor.template`
- `templates/syncfusion/crud-page.razor.template`
- `templates/syncfusion/lookup-component.razor.template`

#### Telerik Templates ✓ Updated (generic)
- `templates/telerik/grid-component.razor.template`
- `templates/telerik/dialog-component.razor.template`
- `templates/telerik/form-component.razor.template`
- `templates/telerik/crud-page.razor.template`
- `templates/telerik/lookup-component.razor.template`

#### MudBlazor Templates ✓ New
- `templates/mudblazor/table-component.razor.template`
- `templates/mudblazor/dialog-component.razor.template`
- `templates/mudblazor/form-component.razor.template`
- `templates/mudblazor/crud-page.razor.template`
- `templates/mudblazor/select-component.razor.template`

### Scripts

**`scripts/detect-ui-framework.ps1`** - Detects UI framework from project
**`scripts/analyze-entity.ps1`** - Analyzes entity model
**`scripts/generate-component.ps1`** - Generates component from template
**`scripts/generate-service-calls.ps1`** - Generates service method calls
**`scripts/add-to-navigation.ps1`** - Adds page to navigation menu

### Workflows

**`workflows/full-crud-generation.yml`** - Complete CRUD workflow
**`workflows/component-enhancement.yml`** - Add features to existing components
**`workflows/ui-framework-detection.yml`** - Framework detection workflow

---

## Examples

### Example 1: Generate Syncfusion CRUD Page

**User Request**:
> "Generate a complete CRUD page for the Product entity using Syncfusion"

**Result**: Complete CRUD page with SfGrid, SfDialog, and form components

### Example 2: Generate MudBlazor Data Table

**User Request**:
> "Create a data table for Orders using MudBlazor"

**Result**: MudDataGrid component with sorting and filtering

### Example 3: Generate Telerik Lookup Component

**User Request**:
> "Generate a category lookup dropdown using Telerik"

**Result**: TelerikComboBox component for category selection

---

## Best Practices

### 1. Analyze Entity Before Generating
- ✅ Read entity class thoroughly
- ✅ Identify relationships
- ✅ Check validation attributes
- ❌ Don't blindly generate

### 2. Choose Appropriate UI Framework
- **Syncfusion**: Enterprise applications
- **Telerik UI**: Professional UI
- **MudBlazor**: Open-source, cost-effective

### 3. Test Generated Components Immediately
- ✅ Run `dotnet build`
- ✅ Navigate to generated page
- ✅ Test CRUD operations
- ❌ Don't generate multiple before testing

### 4. Customize After Generation
- ✅ Review for business logic
- ✅ Add custom validation
- ✅ Implement authorization
- ❌ Don't treat as final

### 5. Follow Blazor Best Practices
- ✅ Use proper lifecycle methods
- ✅ Implement IDisposable when needed
- ✅ Use async/await patterns
- ❌ Don't block async calls

### 6. Implement Proper Error Handling
- ✅ Wrap service calls in try-catch
- ✅ Log errors with context
- ✅ Display user-friendly messages
- ❌ Don't expose raw exceptions

### 7. Performance Considerations
- ✅ Use server-side paging
- ✅ Implement debouncing
- ✅ Use virtualization for large lists
- ❌ Don't load thousands of records client-side

### 8. Security Best Practices
- ✅ Implement authorization
- ✅ Validate all input
- ✅ Use [Authorize] attributes
- ❌ Don't trust client-side validation alone

### 9. Use Version Control
- ✅ Review before committing
- ✅ Write clear commit messages
- ✅ Create feature branches
- ❌ Don't commit untested code

---

## Error Handling

### Compilation Errors

#### "Type or namespace name 'SfGrid' could not be found"
**Cause**: Syncfusion package not installed
**Solution**: Install Syncfusion.Blazor.Grid package

#### "Service not registered"
**Cause**: Service not in DI container
**Solution**: Add service registration to Program.cs

### Runtime Errors

#### "Grid not loading data"
**Possible causes**:
- Service returns null
- Async operation not awaited
- Exception in service layer

Refer to `references/troubleshooting.md` for comprehensive solutions.

---

## Success Criteria

After using the Blazor Component Generator:

✅ **Component Generated**: File created in correct location
✅ **Compilation Successful**: No build errors
✅ **Service Integration**: Interface detected and injected
✅ **Entity Mapping**: Properties mapped to appropriate editors
✅ **Validation Applied**: Data annotations translated
✅ **CRUD Operations**: Create, Read, Update, Delete working
✅ **Error Handling**: Try-catch blocks in place
✅ **Responsive UI**: Works on different screen sizes
✅ **Framework Consistency**: Uses detected framework correctly
✅ **Best Practices**: Follows C# 13, .NET 9, Blazor conventions

---

## UI Framework Comparison

| Feature | Syncfusion | Telerik UI | MudBlazor |
|---------|-----------|-----------|-----------|
| **License** | Commercial | Commercial | MIT (Free) |
| **Components** | 80+ | 100+ | 60+ |
| **Data Grid** | SfGrid | TelerikGrid | MudDataGrid |
| **Dialog** | SfDialog | TelerikDialog | MudDialog |
| **Form** | SfTextBox | TelerikTextBox | MudTextField |
| **Themes** | Material, Bootstrap, Fluent | Material, Bootstrap, Default | Material Design |
| **Documentation** | Excellent | Excellent | Good |
| **Performance** | Excellent | Excellent | Good |
| **Learning Curve** | Medium | Medium | Easy |
| **Best For** | Enterprise | Professional UI | Open-source projects |

---

## Integration with SDLC Framework

The Blazor Component Generator coordinates with SchaabCore agents:

```
User Request
    ↓
Blazor Component Generator (analyze & generate)
    ↓
Jordan (backend-developer) → Implement services if needed
    ↓
Taylor (test-runner) → Run tests
    ↓
Avery (code-reviewer) → Review code
    ↓
git-worker → Commit changes
    ↓
Complete
```

---

## Getting Started

1. **Ensure UI framework installed** (Syncfusion, Telerik, or MudBlazor)
2. **Invoke the skill** with entity name:
   - "Generate CRUD page for Product using Syncfusion"
   - "Scaffold Order table with MudBlazor"
3. **Review generated component**
4. **Test immediately**
5. **Commit changes**

---

## Conclusion

The **Blazor Component Generator** accelerates Blazor development by automating creation of production-ready components using Syncfusion, Telerik UI, or MudBlazor. It follows C# 13 and .NET 9 best practices, integrates with your service layer, and generates maintainable, testable code.

Use this skill to quickly scaffold Blazor components, standardize patterns, and jumpstart features with CRUD functionality.
