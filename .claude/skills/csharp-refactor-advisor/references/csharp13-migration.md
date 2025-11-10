# C# 13 and .NET 9 Migration Guide

Complete guide to modernizing C# code to leverage C# 13 language features and .NET 9 runtime improvements.

## Table of Contents

1. [C# 13 New Features](#c-13-new-features)
2. [.NET 9 Improvements](#net-9-improvements)
3. [Migration Patterns](#migration-patterns)
4. [Performance Improvements](#performance-improvements)

---

## C# 13 New Features

### 1. New Lock Type

**What's New**: `System.Threading.Lock` provides better performance and debuggability than `object` locks.

**Before** (Old Pattern):
```csharp
public class Counter
{
    private readonly object _lock = new object();
    private int _count;

    public void Increment()
    {
        lock (_lock)
        {
            _count++;
        }
    }

    public int GetCount()
    {
        lock (_lock)
        {
            return _count;
        }
    }
}
```

**After** (C# 13):
```csharp
using System.Threading;

public class Counter
{
    private readonly Lock _lock = new(); // C# 13 Lock type
    private int _count;

    public void Increment()
    {
        lock (_lock)
        {
            _count++;
        }
    }

    public int GetCount()
    {
        lock (_lock)
        {
            return _count;
        }
    }
}
```

**Benefits**:
- ✅ Better performance on modern hardware
- ✅ Improved debuggability
- ✅ More efficient lock management
- ✅ Same syntax (just different type)

**Migration Search Pattern**:
```bash
# Find all object locks
rg "private readonly object.*_lock" --type cs
```

---

### 2. Escape Sequence \e

**What's New**: New escape sequence `\e` for ESCAPE character (U+001B).

**Before**:
```csharp
public class TerminalFormatter
{
    private const string EscapeChar = "\u001B";

    public string Red(string text)
        => $"{EscapeChar}[31m{text}{EscapeChar}[0m";

    public string Green(string text)
        => $"{EscapeChar}[32m{text}{EscapeChar}[0m";
}
```

**After** (C# 13):
```csharp
public class TerminalFormatter
{
    public string Red(string text)
        => $"\e[31m{text}\e[0m";

    public string Green(string text)
        => $"\e[32m{text}\e[0m";
}
```

**Benefits**:
- ✅ More readable
- ✅ Clearer intent
- ✅ Less verbose

**Migration Search Pattern**:
```bash
# Find Unicode ESCAPE sequences
rg "\\u001B" --type cs
```

---

### 3. params Collections Enhancement

**What's New**: `params` keyword now works with any collection type implementing `IEnumerable<T>`, not just arrays.

**Before**:
```csharp
public void LogMessages(params object[] messages)
{
    foreach (var msg in messages)
    {
        Console.WriteLine(msg);
    }
}

// Can only pass array or individual arguments
LogMessages("msg1", "msg2", "msg3");
```

**After** (C# 13):
```csharp
public void LogMessages(params IEnumerable<object> messages)
{
    foreach (var msg in messages)
    {
        Console.WriteLine(msg);
    }
}

// Can now pass any collection type
LogMessages("msg1", "msg2", "msg3");
LogMessages(new List<object> { "msg1", "msg2" });
LogMessages(new[] { "msg1", "msg2" });
LogMessages(myExistingCollection);
```

**Benefits**:
- ✅ More flexible
- ✅ Can accept existing collections directly
- ✅ Reduced allocations in some scenarios

**Migration Search Pattern**:
```bash
# Find params arrays that could be collections
rg "params.*\[\]" --type cs
```

---

### 4. ref struct Can Implement Interfaces

**What's New**: `ref struct` types can now implement interfaces, allowing for more flexible low-level code.

**Before** (Not possible):
```csharp
// ref struct couldn't implement interfaces
public ref struct SpanProcessor
{
    private Span<byte> _data;

    public void Process()
    {
        // Process data
    }
}
```

**After** (C# 13):
```csharp
public interface IProcessor
{
    void Process();
}

public ref struct SpanProcessor : IProcessor
{
    private Span<byte> _data;

    public SpanProcessor(Span<byte> data)
    {
        _data = data;
    }

    public void Process()
    {
        // Process data without allocations
        for (int i = 0; i < _data.Length; i++)
        {
            _data[i] = (byte)(data[i] * 2);
        }
    }
}

// Can now use polymorphically
public void ProcessData<T>(T processor) where T : IProcessor
{
    processor.Process();
}
```

**Benefits**:
- ✅ Polymorphism with ref structs
- ✅ Zero-allocation patterns
- ✅ More flexible low-level code

---

### 5. Partial Properties

**What's New**: Properties can now be partial, allowing definition and implementation to be split across files.

**Before** (Not possible):
```csharp
// Couldn't split property definition and implementation
public partial class User
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
}
```

**After** (C# 13):
```csharp
// User.cs
public partial class User
{
    public partial string FullName { get; }
}

// User.Generated.cs (generated code)
public partial class User
{
    public partial string FullName => $"{FirstName} {LastName}";
}
```

**Benefits**:
- ✅ Better code generation scenarios
- ✅ Cleaner separation of concerns
- ✅ Easier to work with source generators

---

### 6. Object Initializer ^ Operator

**What's New**: Can use index-from-end operator `^` in object initializers.

**Before**:
```csharp
var array = new int[10];
array[array.Length - 1] = 5; // Last element
```

**After** (C# 13):
```csharp
var array = new int[10]
{
    [^1] = 5  // Last element using ^ operator
};
```

**Benefits**:
- ✅ More concise
- ✅ Consistent with index/range operators

---

## .NET 9 Improvements

### 1. HybridCache

**What's New**: Built-in two-level caching (L1 = memory, L2 = distributed) with stampede protection.

**Before** (Manual two-level caching):
```csharp
public class ProductService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly IProductRepository _repository;

    public async Task<Product> GetProductAsync(int id)
    {
        // Try L1 (memory)
        if (_memoryCache.TryGetValue($"product:{id}", out Product? product))
            return product!;

        // Try L2 (distributed)
        var cachedBytes = await _distributedCache.GetAsync($"product:{id}");
        if (cachedBytes != null)
        {
            product = JsonSerializer.Deserialize<Product>(cachedBytes);
            _memoryCache.Set($"product:{id}", product, TimeSpan.FromMinutes(5));
            return product!;
        }

        // Fetch from database
        product = await _repository.GetByIdAsync(id);

        // Update both caches
        var serialized = JsonSerializer.SerializeToUtf8Bytes(product);
        await _distributedCache.SetAsync($"product:{id}", serialized,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            });
        _memoryCache.Set($"product:{id}", product, TimeSpan.FromMinutes(5));

        return product;
    }
}
```

**After** (.NET 9 HybridCache):
```csharp
public class ProductService
{
    private readonly HybridCache _cache;
    private readonly IProductRepository _repository;

    public ProductService(HybridCache cache, IProductRepository repository)
    {
        _cache = cache;
        _repository = repository;
    }

    public async Task<Product> GetProductAsync(int id, CancellationToken ct = default)
    {
        return await _cache.GetOrCreateAsync(
            $"product:{id}",
            async cancel => await _repository.GetByIdAsync(id, cancel),
            new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromHours(1),
                LocalCacheExpiration = TimeSpan.FromMinutes(5)
            },
            cancellationToken: ct
        );
    }

    // Remove from cache
    public async Task InvalidateProductAsync(int id)
    {
        await _cache.RemoveAsync($"product:{id}");
    }
}

// Register in Program.cs
builder.Services.AddHybridCache(options =>
{
    options.MaximumPayloadBytes = 1024 * 1024; // 1 MB
    options.MaximumKeyLength = 512;
});
```

**Benefits**:
- ✅ Automatic L1 (memory) + L2 (distributed) caching
- ✅ Stampede protection (prevents duplicate fetches)
- ✅ Automatic serialization
- ✅ Simpler API
- ✅ Better performance

**Migration Steps**:
1. Replace `IMemoryCache` and `IDistributedCache` with `HybridCache`
2. Update `GetOrCreateAsync` calls to new API
3. Register `AddHybridCache` in Program.cs
4. Remove manual serialization code

---

### 2. Built-in OpenAPI Support

**What's New**: Automatic OpenAPI document generation without Swashbuckle.

**Before** (.NET 8 with Swashbuckle):
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Swashbuckle

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.Run();
```

**After** (.NET 9 Built-in):
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi(); // .NET 9 built-in

var app = builder.Build();

app.MapOpenApi(); // Serves OpenAPI document at /openapi/v1.json
app.MapScalarApiReference(); // Optional: modern UI for API docs

// Minimal API with OpenAPI
app.MapGet("/api/products/{id}", async (int id, IProductService productService) =>
{
    var product = await productService.GetProductAsync(id);
    return product == null ? Results.NotFound() : Results.Ok(product);
})
.WithName("GetProduct")
.WithOpenApi(op =>
{
    op.Summary = "Get product by ID";
    op.Description = "Returns a single product";
    return op;
});

app.Run();
```

**Benefits**:
- ✅ No external dependencies (Swashbuckle not needed)
- ✅ Better performance
- ✅ Native support
- ✅ Cleaner API

**Migration Steps**:
1. Remove `Swashbuckle.AspNetCore` NuGet package
2. Replace `AddSwaggerGen()` with `AddOpenApi()`
3. Replace `UseSwagger()` / `UseSwaggerUI()` with `MapOpenApi()`
4. Optionally add `MapScalarApiReference()` for UI

---

### 3. Minimal API Improvements

**What's New**: Better support for minimal APIs with improved binding and validation.

**Before** (Controller-based):
```csharp
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Product), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetProduct(int id)
    {
        var product = await _productService.GetProductAsync(id);
        return product == null ? NotFound() : Ok(product);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Product), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var product = await _productService.CreateProductAsync(request);
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }
}
```

**After** (.NET 9 Minimal API):
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();

var app = builder.Build();
app.MapOpenApi();

var products = app.MapGroup("/api/products")
    .WithTags("Products")
    .WithOpenApi();

products.MapGet("/{id}", async (int id, IProductService productService) =>
{
    var product = await productService.GetProductAsync(id);
    return product == null ? Results.NotFound() : Results.Ok(product);
})
.WithName("GetProduct")
.WithSummary("Get product by ID")
.Produces<Product>(200)
.Produces(404);

products.MapPost("/", async (CreateProductRequest request, IProductService productService) =>
{
    var product = await productService.CreateProductAsync(request);
    return Results.CreatedAtRoute("GetProduct", new { id = product.Id }, product);
})
.WithName("CreateProduct")
.WithSummary("Create a new product")
.Produces<Product>(201)
.Produces<ValidationProblemDetails>(400);

app.Run();
```

**Benefits**:
- ✅ Less boilerplate
- ✅ Better performance (no controller overhead)
- ✅ Cleaner code
- ✅ Easier to read and maintain

---

### 4. LINQ Performance Improvements

**What's New**: Optimized LINQ methods, especially `Order()` and `OrderDescending()`.

**Before**:
```csharp
var sorted = items.OrderBy(x => x); // Requires lambda
var reversed = items.OrderByDescending(x => x);
```

**After** (.NET 9):
```csharp
var sorted = items.Order(); // No lambda needed for natural order
var reversed = items.OrderDescending();
```

**Benefits**:
- ✅ Cleaner syntax
- ✅ Better performance
- ✅ Less memory allocation

---

## Migration Patterns

### Pattern 1: Update Lock Objects

**Search and Replace**:
```bash
# Find all lock objects
rg "private readonly object _lock = new" --type cs

# For each occurrence:
# 1. Add using System.Threading;
# 2. Replace:
private readonly object _lock = new object();
# With:
private readonly Lock _lock = new();
```

### Pattern 2: Modernize Async Patterns

**Before**:
```csharp
public Task<Result> GetDataAsync()
{
    return Task.Run(() => {
        // CPU-bound work
        return ComputeResult();
    });
}
```

**After**:
```csharp
public async Task<Result> GetDataAsync()
{
    // Use Task.Run only for CPU-bound work
    return await Task.Run(() => ComputeResult());
}

// Better: Make it truly async if possible
public async Task<Result> GetDataAsync()
{
    return await _httpClient.GetFromJsonAsync<Result>("api/data");
}
```

### Pattern 3: Replace Manual Caching with HybridCache

**Steps**:
1. Identify all `IMemoryCache` and `IDistributedCache` usage
2. Replace with `HybridCache`
3. Update calls to `GetOrCreateAsync`
4. Remove manual serialization

### Pattern 4: Migrate to Minimal APIs

**Steps**:
1. Keep controllers for complex scenarios
2. Migrate simple CRUD endpoints to minimal APIs
3. Use route groups for organization
4. Add OpenAPI metadata with `.WithOpenApi()`

---

## Performance Improvements

### 1. Use C# 13 Lock

**Impact**: 10-30% improvement in lock contention scenarios

### 2. Use HybridCache

**Impact**:
- Reduced latency (L1 cache hits)
- Reduced network traffic (L2 cache hits)
- Stampede protection prevents duplicate fetches

### 3. Use Minimal APIs

**Impact**:
- ~10-15% faster than controllers
- Lower memory allocation
- Smaller binary size

### 4. Use LINQ Improvements

**Impact**:
- Better performance with `Order()` / `OrderDescending()`
- Optimized `Count()`, `Sum()`, `Average()` for arrays

---

## Migration Checklist

- [ ] Update to .NET 9 SDK
- [ ] Replace `object` locks with `Lock`
- [ ] Replace `\u001B` with `\e`
- [ ] Update `params` arrays to collections where beneficial
- [ ] Replace manual caching with `HybridCache`
- [ ] Remove Swashbuckle, use built-in OpenAPI
- [ ] Migrate simple endpoints to minimal APIs
- [ ] Use new LINQ methods (`Order`, `OrderDescending`)
- [ ] Test thoroughly after each change
- [ ] Update documentation

---

## Conclusion

C# 13 and .NET 9 provide significant improvements in performance, usability, and developer experience. Prioritize migrations that provide the most value:

1. **High Value**: HybridCache, OpenAPI, Lock type
2. **Medium Value**: Minimal APIs, LINQ improvements
3. **Low Value**: Escape sequences, params collections (nice-to-have)

Migrate incrementally, test thoroughly, and measure performance improvements.
