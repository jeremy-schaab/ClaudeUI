# Blazor Component Patterns and Best Practices

Comprehensive guide to Blazor component patterns, lifecycle management, and best practices for C# 13 and .NET 9.

## Component Lifecycle

### Lifecycle Methods Execution Order

1. **Constructor** - Component instantiation
2. **SetParametersAsync** - Parameters set
3. **OnInitialized** / **OnInitializedAsync** - Component initialization (once)
4. **OnParametersSet** / **OnParametersSetAsync** - After parameters set (every render)
5. **OnAfterRender** / **OnAfterRenderAsync** - After component rendered

### Lifecycle Method Usage

#### OnInitialized / OnInitializedAsync
**Use for**: One-time initialization, data loading

```csharp
protected override async Task OnInitializedAsync()
{
    // Load data once when component first loads
    Products = await ProductService.GetAllAsync();
}
```

#### OnParametersSet / OnParametersSetAsync
**Use for**: React to parameter changes

```csharp
[Parameter] public int ProductId { get; set; }

protected override async Task OnParametersSetAsync()
{
    // React to parameter changes
    if (ProductId > 0)
    {
        Product = await ProductService.GetByIdAsync(ProductId);
    }
}
```

#### OnAfterRender / OnAfterRenderAsync
**Use for**: JavaScript interop, DOM manipulation

```csharp
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        // Initialize JavaScript components
        await JSRuntime.InvokeVoidAsync("initializeChart", ElementRef);
    }
}
```

### ShouldRender Pattern

**Optimize rendering by controlling re-renders**:

```csharp
private bool _dataLoaded = false;

protected override bool ShouldRender()
{
    // Only render when data is loaded
    return _dataLoaded;
}

protected override async Task OnInitializedAsync()
{
    Products = await ProductService.GetAllAsync();
    _dataLoaded = true;
}
```

---

## State Management Patterns

### Component State (Local)

**Use for**: Component-specific data

```csharp
@code {
    private List<Product> Products = new();
    private bool IsLoading = false;
    private string ErrorMessage = "";

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            Products = await ProductService.GetAllAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

### Cascading Parameters

**Use for**: Passing data down component tree

```razor
<!-- Parent Component -->
<CascadingValue Value="@CurrentUser">
    <ChildComponent />
</CascadingValue>

@code {
    private User CurrentUser = new();
}

<!-- Child Component -->
@code {
    [CascadingParameter] public User CurrentUser { get; set; }
}
```

### AppState (Global State)

**Use for**: Application-wide state

```csharp
// AppState.cs
public class AppState
{
    public User CurrentUser { get; set; }
    public event Action OnChange;

    public void SetUser(User user)
    {
        CurrentUser = user;
        NotifyStateChanged();
    }

    private void NotifyStateChanged() => OnChange?.Invoke();
}

// Program.cs
builder.Services.AddScoped<AppState>();

// Component usage
@inject AppState AppState
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

### Fluxor (Redux Pattern)

**Use for**: Complex state management

```csharp
// State
public record ProductsState
{
    public IEnumerable<Product> Products { get; init; } = Array.Empty<Product>();
    public bool IsLoading { get; init; }
}

// Actions
public record LoadProductsAction;
public record LoadProductsSuccessAction(IEnumerable<Product> Products);

// Reducer
public static class ProductsReducer
{
    [ReducerMethod]
    public static ProductsState ReduceLoadProductsAction(ProductsState state, LoadProductsAction action) =>
        state with { IsLoading = true };

    [ReducerMethod]
    public static ProductsState ReduceLoadProductsSuccessAction(ProductsState state, LoadProductsSuccessAction action) =>
        state with { Products = action.Products, IsLoading = false };
}

// Effects
public class ProductsEffects
{
    private readonly IProductService _productService;

    public ProductsEffects(IProductService productService)
    {
        _productService = productService;
    }

    [EffectMethod]
    public async Task HandleLoadProducts(LoadProductsAction action, IDispatcher dispatcher)
    {
        var products = await _productService.GetAllAsync();
        dispatcher.Dispatch(new LoadProductsSuccessAction(products));
    }
}

// Component usage
@inherits FluxorComponent
@inject IState<ProductsState> ProductsState
@inject IDispatcher Dispatcher

<button @onclick="LoadProducts">Load Products</button>

@code {
    private void LoadProducts()
    {
        Dispatcher.Dispatch(new LoadProductsAction());
    }
}
```

---

## Dependency Injection Patterns

### Service Registration

```csharp
// Program.cs
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddSingleton<IConfiguration>(builder.Configuration);
builder.Services.AddTransient<IEmailService, EmailService>();
```

**Lifetimes**:
- **Singleton**: Created once, shared across all requests
- **Scoped**: Created per circuit (Blazor Server) or per user (WebAssembly)
- **Transient**: Created every time it's requested

### Constructor Injection

```csharp
public class ProductService : IProductService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProductService> _logger;

    public ProductService(HttpClient httpClient, ILogger<ProductService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }
}
```

### Component Injection

```razor
@inject IProductService ProductService
@inject NavigationManager NavigationManager
@inject ILogger<ProductList> Logger

@code {
    // Use injected services
}
```

### Service Factory Pattern

**Use for**: Creating services with runtime parameters

```csharp
// Factory interface
public interface IProductServiceFactory
{
    IProductService CreateService(string tenantId);
}

// Factory implementation
public class ProductServiceFactory : IProductServiceFactory
{
    private readonly IHttpClientFactory _httpClientFactory;

    public ProductServiceFactory(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public IProductService CreateService(string tenantId)
    {
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Add("TenantId", tenantId);
        return new ProductService(httpClient);
    }
}

// Registration
builder.Services.AddSingleton<IProductServiceFactory, ProductServiceFactory>();
```

---

## Form Patterns

### EditForm with DataAnnotationsValidator

```razor
<EditForm Model="@Model" OnValidSubmit="@HandleValidSubmit" OnInvalidSubmit="@HandleInvalidSubmit">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <!-- Form fields here -->

    <button type="submit">Save</button>
</EditForm>

@code {
    private ProductModel Model = new();

    private async Task HandleValidSubmit()
    {
        await ProductService.CreateAsync(Model);
    }

    private void HandleInvalidSubmit()
    {
        // Handle invalid submission
    }
}
```

### Model with Validation Attributes

```csharp
public class ProductModel
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; }

    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Price must be between 0.01 and 999999.99")]
    public decimal Price { get; set; }

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string ContactEmail { get; set; }

    [Url(ErrorMessage = "Invalid URL")]
    public string Website { get; set; }
}
```

### Custom Validation

```csharp
public class ProductModel : IValidatableObject
{
    public string Name { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DiscountPrice.HasValue && DiscountPrice >= Price)
        {
            yield return new ValidationResult(
                "Discount price must be less than regular price",
                new[] { nameof(DiscountPrice) });
        }
    }
}
```

### Fluent Validation

```csharp
// Install FluentValidation.DependencyInjectionExtensions
// Model validator
public class ProductModelValidator : AbstractValidator<ProductModel>
{
    public ProductModelValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0")
            .LessThanOrEqualTo(999999.99m).WithMessage("Price cannot exceed 999999.99");

        RuleFor(x => x.DiscountPrice)
            .LessThan(x => x.Price).When(x => x.DiscountPrice.HasValue)
            .WithMessage("Discount price must be less than regular price");
    }
}

// Registration
builder.Services.AddValidatorsFromAssemblyContaining<ProductModelValidator>();

// Component usage
<FluentValidationValidator />
```

---

## Error Handling Patterns

### Try-Catch in Component

```csharp
@code {
    private string ErrorMessage = "";

    private async Task LoadDataAsync()
    {
        try
        {
            Products = await ProductService.GetAllAsync();
        }
        catch (HttpRequestException ex)
        {
            ErrorMessage = "Network error. Please check your connection.";
            Logger.LogError(ex, "Failed to load products");
        }
        catch (Exception ex)
        {
            ErrorMessage = "An unexpected error occurred.";
            Logger.LogError(ex, "Unexpected error loading products");
        }
    }
}
```

### Error Boundary

```razor
<!-- App.razor -->
<ErrorBoundary>
    <ChildContent>
        <Router AppAssembly="@typeof(App).Assembly">
            <!-- Router content -->
        </Router>
    </ChildContent>
    <ErrorContent Context="exception">
        <div class="error-boundary">
            <h1>Something went wrong</h1>
            <p>@exception.Message</p>
        </div>
    </ErrorContent>
</ErrorBoundary>
```

### Global Exception Handler

```csharp
// GlobalExceptionHandler.cs
public class GlobalExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async Task<T> ExecuteAsync<T>(Func<Task<T>> action, string operationName)
    {
        try
        {
            return await action();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {OperationName}", operationName);
            throw;
        }
    }
}

// Usage in component
@inject GlobalExceptionHandler ExceptionHandler

@code {
    private async Task LoadDataAsync()
    {
        Products = await ExceptionHandler.ExecuteAsync(
            async () => await ProductService.GetAllAsync(),
            "LoadProducts");
    }
}
```

---

## Event Handling Patterns

### EventCallback

```razor
<!-- Child Component -->
<button @onclick="HandleClick">Click Me</button>

@code {
    [Parameter] public EventCallback<string> OnItemSelected { get; set; }

    private async Task HandleClick()
    {
        await OnItemSelected.InvokeAsync("Item clicked");
    }
}

<!-- Parent Component -->
<ChildComponent OnItemSelected="@HandleItemSelected" />

@code {
    private void HandleItemSelected(string message)
    {
        // Handle event
    }
}
```

### Event Aggregator Pattern

```csharp
// EventAggregator.cs
public class EventAggregator
{
    private readonly Dictionary<Type, List<object>> _subscribers = new();

    public void Subscribe<TEvent>(Action<TEvent> handler)
    {
        if (!_subscribers.ContainsKey(typeof(TEvent)))
            _subscribers[typeof(TEvent)] = new List<object>();

        _subscribers[typeof(TEvent)].Add(handler);
    }

    public void Publish<TEvent>(TEvent eventData)
    {
        if (_subscribers.TryGetValue(typeof(TEvent), out var handlers))
        {
            foreach (var handler in handlers.Cast<Action<TEvent>>())
            {
                handler(eventData);
            }
        }
    }
}

// Event definition
public record ProductCreatedEvent(Product Product);

// Publisher
@inject EventAggregator EventAggregator

private async Task CreateProduct()
{
    var product = await ProductService.CreateAsync(Model);
    EventAggregator.Publish(new ProductCreatedEvent(product));
}

// Subscriber
@inject EventAggregator EventAggregator
@implements IDisposable

protected override void OnInitialized()
{
    EventAggregator.Subscribe<ProductCreatedEvent>(HandleProductCreated);
}

private void HandleProductCreated(ProductCreatedEvent e)
{
    // Handle event
    Products.Add(e.Product);
    StateHasChanged();
}
```

---

## Data Binding Patterns

### One-Way Binding

```razor
<p>Product Name: @Product.Name</p>
```

### Two-Way Binding

```razor
<input @bind="@Model.Name" />
<input @bind="@Model.Price" @bind:format="C2" />
```

### Binding with Events

```razor
<input value="@Model.Name"
       @oninput="@((e) => Model.Name = e.Value.ToString())" />
```

### Debounced Input

```razor
@inject IJSRuntime JSRuntime

<input @bind="@SearchTerm" @bind:event="oninput" @bind:after="PerformSearch" />

@code {
    private string SearchTerm = "";
    private System.Timers.Timer _debounceTimer;

    protected override void OnInitialized()
    {
        _debounceTimer = new System.Timers.Timer(300);
        _debounceTimer.Elapsed += async (sender, e) =>
        {
            _debounceTimer.Stop();
            await InvokeAsync(async () =>
            {
                await PerformSearch();
                StateHasChanged();
            });
        };
    }

    private void PerformSearch()
    {
        _debounceTimer.Stop();
        _debounceTimer.Start();
    }

    private async Task PerformSearchAsync()
    {
        SearchResults = await ProductService.SearchAsync(SearchTerm);
    }

    public void Dispose()
    {
        _debounceTimer?.Dispose();
    }
}
```

---

## Navigation Patterns

### Programmatic Navigation

```csharp
@inject NavigationManager NavigationManager

private void NavigateToProduct(int productId)
{
    NavigationManager.NavigateTo($"/products/{productId}");
}

private void NavigateWithForceLoad()
{
    NavigationManager.NavigateTo("/products", forceLoad: true);
}
```

### Query String Parameters

```csharp
@inject NavigationManager NavigationManager

protected override void OnInitialized()
{
    var uri = new Uri(NavigationManager.Uri);
    var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
    var productId = query["id"];
}

// Navigate with query string
NavigationManager.NavigateTo($"/products?id={productId}&category={categoryId}");
```

### Route Parameters

```razor
@page "/products/{ProductId:int}"

@code {
    [Parameter] public int ProductId { get; set; }

    protected override async Task OnParametersSetAsync()
    {
        Product = await ProductService.GetByIdAsync(ProductId);
    }
}
```

### Navigation Interception

```csharp
@inject NavigationManager NavigationManager
@implements IDisposable

protected override void OnInitialized()
{
    NavigationManager.LocationChanged += HandleLocationChanged;
}

private void HandleLocationChanged(object sender, LocationChangedEventArgs e)
{
    // React to navigation
}

public void Dispose()
{
    NavigationManager.LocationChanged -= HandleLocationChanged;
}
```

---

## Authorization Patterns

### AuthorizeView

```razor
<AuthorizeView>
    <Authorized>
        <p>Welcome, @context.User.Identity.Name!</p>
        <button @onclick="DeleteProduct">Delete</button>
    </Authorized>
    <NotAuthorized>
        <p>You are not authorized.</p>
    </NotAuthorized>
</AuthorizeView>
```

### Role-Based Authorization

```razor
<AuthorizeView Roles="Admin, Manager">
    <Authorized>
        <button @onclick="DeleteAllProducts">Delete All</button>
    </Authorized>
</AuthorizeView>
```

### Policy-Based Authorization

```csharp
// Program.cs
builder.Services.AddAuthorizationCore(options =>
{
    options.AddPolicy("CanEditProducts", policy =>
        policy.RequireClaim("Permission", "EditProducts"));
});

// Component
<AuthorizeView Policy="CanEditProducts">
    <Authorized>
        <button @onclick="EditProduct">Edit</button>
    </Authorized>
</AuthorizeView>
```

### Component-Level Authorization

```razor
@attribute [Authorize(Roles = "Admin")]

<h3>Admin Dashboard</h3>
```

---

## Performance Patterns

### Virtualization

```razor
@using Microsoft.AspNetCore.Components.Web.Virtualization

<Virtualize Items="@Products" Context="product">
    <div class="product-item">
        <h3>@product.Name</h3>
        <p>@product.Price.ToString("C")</p>
    </div>
</Virtualize>
```

### Lazy Loading

```razor
@if (ShowDetails)
{
    <LazyComponent />
}

@code {
    private bool ShowDetails = false;

    [Inject] private Lazy<LazyComponent> LazyComponent { get; set; }
}
```

### Memoization

```csharp
private List<Product> _allProducts;
private Dictionary<int, Product> _productCache = new();

private Product GetProductById(int id)
{
    if (!_productCache.TryGetValue(id, out var product))
    {
        product = _allProducts.FirstOrDefault(p => p.ProductId == id);
        if (product != null)
            _productCache[id] = product;
    }
    return product;
}
```

### Prerendering

```csharp
// Enable prerendering in App.razor
<Router AppAssembly="@typeof(App).Assembly" PreferExactMatches="@true">
    <!-- Router content -->
</Router>
```

---

## Testing Patterns

### bUnit Testing

```csharp
public class ProductListTests : TestContext
{
    [Fact]
    public void ProductList_RendersProducts()
    {
        // Arrange
        var mockService = new Mock<IProductService>();
        mockService.Setup(s => s.GetAllAsync())
            .ReturnsAsync(new List<Product>
            {
                new Product { ProductId = 1, Name = "Product 1", Price = 10.00m },
                new Product { ProductId = 2, Name = "Product 2", Price = 20.00m }
            });

        Services.AddSingleton(mockService.Object);

        // Act
        var cut = RenderComponent<ProductList>();

        // Assert
        cut.MarkupMatches(@"
            <div>
                <h3>Products</h3>
                <div>Product 1</div>
                <div>Product 2</div>
            </div>
        ");
    }
}
```

### Component Interaction Testing

```csharp
[Fact]
public async Task DeleteButton_WhenClicked_DeletesProduct()
{
    // Arrange
    var mockService = new Mock<IProductService>();
    Services.AddSingleton(mockService.Object);

    var cut = RenderComponent<ProductList>();
    var deleteButton = cut.Find("button.delete-button");

    // Act
    await deleteButton.ClickAsync(new MouseEventArgs());

    // Assert
    mockService.Verify(s => s.DeleteAsync(It.IsAny<int>()), Times.Once);
}
```

---

## Best Practices Summary

### Component Design
- ✅ Keep components small and focused (Single Responsibility)
- ✅ Use parameters for input, EventCallback for output
- ✅ Prefer composition over inheritance
- ✅ Use RenderFragment for flexible content

### Performance
- ✅ Use @key for list rendering
- ✅ Implement ShouldRender for complex components
- ✅ Use Virtualize for large lists
- ✅ Avoid unnecessary StateHasChanged() calls

### State Management
- ✅ Use local state for component-specific data
- ✅ Use cascading parameters for hierarchical data
- ✅ Use AppState/Fluxor for global state
- ✅ Always unsubscribe from events (IDisposable)

### Error Handling
- ✅ Use ErrorBoundary for component errors
- ✅ Log exceptions with context
- ✅ Display user-friendly error messages
- ✅ Implement retry logic for transient failures

### Security
- ✅ Use [Authorize] attributes
- ✅ Validate all input
- ✅ Use HTTPS
- ✅ Implement CSRF protection

### Testing
- ✅ Write unit tests for business logic
- ✅ Use bUnit for component testing
- ✅ Mock external dependencies
- ✅ Test edge cases and error conditions
