---
name: csharp-refactor-advisor
description: This skill should be used when users need to refactor C# code, identify code smells and anti-patterns, apply SOLID principles, implement design patterns, reduce cyclomatic complexity, or modernize code to C# 13 and .NET 9 patterns. Activates for code analysis, refactoring suggestions, pattern application, code quality improvements, or when users mention "refactor", "code smell", "SOLID", "design pattern", "complexity", "modernize", or "improve code quality".
---

# C# Refactor Advisor

## Purpose

The **C# Refactor Advisor** is a comprehensive code quality and refactoring skill designed to help developers improve C# codebases through systematic analysis and modernization. This skill identifies code smells, applies SOLID principles, implements proven design patterns, reduces cyclomatic complexity, and modernizes code to leverage C# 13 and .NET 9 features.

The skill provides:
- **Code Smell Detection**: Identifies 25+ common code smells in C# codebases
- **SOLID Principle Application**: Detects violations and suggests refactoring strategies
- **Design Pattern Implementation**: Recommends and applies 15+ proven design patterns
- **Complexity Reduction**: Reduces cyclomatic complexity through systematic refactoring
- **Modernization**: Upgrades legacy code to C# 13 and .NET 9 patterns
- **Before/After Examples**: Generates clear comparisons showing improvements
- **Refactoring Safety**: Ensures changes are tested and reversible

## When to Use This Skill

Use the C# Refactor Advisor skill when you need to:

### Code Quality Analysis
- **Identify code smells** in existing C# code
- **Detect anti-patterns** that reduce maintainability
- **Measure code quality metrics** (complexity, duplication, coupling)
- **Generate refactoring reports** with prioritized recommendations

### SOLID Principles
- **Detect SOLID violations** in class designs
- **Apply Single Responsibility Principle** by extracting classes
- **Implement Open/Closed Principle** through abstraction
- **Fix Liskov Substitution violations** in inheritance hierarchies
- **Apply Interface Segregation** to reduce coupling
- **Implement Dependency Inversion** with dependency injection

### Design Patterns
- **Identify where patterns apply** in existing code
- **Implement creational patterns** (Factory, Builder, Singleton)
- **Apply structural patterns** (Adapter, Decorator, Facade)
- **Implement behavioral patterns** (Strategy, Observer, Command)
- **Refactor to pattern** when code structure suggests it

### Code Modernization
- **Upgrade to C# 13 features** (new Lock, params collections, ref struct interfaces)
- **Apply .NET 9 patterns** (HybridCache, OpenAPI, minimal APIs)
- **Replace legacy patterns** with modern equivalents
- **Optimize performance** using new runtime features

### Complexity Management
- **Reduce cyclomatic complexity** in methods and classes
- **Extract methods** to improve readability
- **Simplify conditionals** through pattern matching
- **Break down god classes** into cohesive units

## Workflow Overview

The C# Refactor Advisor provides five primary workflows:

### 1. **Analyze Workflow**
Scan code → Identify issues → Categorize problems → Generate prioritized report

### 2. **Refactor Workflow**
Plan changes → Apply refactoring → Verify correctness → Generate examples

### 3. **Modernize Workflow**
Detect legacy patterns → Apply C# 13/.NET 9 features → Test changes → Document improvements

### 4. **Pattern Application Workflow**
Identify pattern opportunity → Select appropriate pattern → Implement pattern → Provide rationale

### 5. **Complexity Reduction Workflow**
Measure complexity → Identify hotspots → Apply simplification techniques → Verify reduction

## Configuration

### Integration with SchaabCore Framework

The C# Refactor Advisor integrates seamlessly with the JS-AI Agentic SDLC Framework:

**Works with Avery (code-reviewer)**:
- Leverages Avery's code review capabilities for quality analysis
- Uses Avery's security and performance checks
- Coordinates with Avery for final approval after refactoring

**Works with Jordan (backend-developer)**:
- Delegates implementation of refactored code to Jordan
- Ensures refactoring follows C# 13 and .NET 9 best practices
- Coordinates test generation with Jordan

**Works with test-runner (Taylor)**:
- Validates that refactoring doesn't break existing functionality
- Ensures test coverage is maintained or improved
- Runs regression tests after changes

**Works with git-worker**:
- Creates safe refactoring commits with clear messages
- Enables easy rollback if needed
- Follows conventional commit format

### Quality Gates

The skill enforces these quality gates:

✅ **No Broken Tests**: All existing tests must pass after refactoring
✅ **Coverage Maintained**: Code coverage must not decrease
✅ **Complexity Reduced**: Cyclomatic complexity should decrease
✅ **No New Warnings**: Refactoring should not introduce compiler warnings
✅ **SOLID Compliance**: Changes should improve SOLID adherence

## Step-by-Step Implementation

### Workflow 1: Code Analysis

#### Step 1: Scan Codebase for Issues

When user requests code analysis, perform systematic scanning:

**Actions**:
1. Use Grep tool to search for code smell patterns
2. Read identified files for detailed analysis
3. Measure complexity using mental calculation or comments
4. Identify duplication across files
5. Detect SOLID principle violations

**Code Smell Patterns to Search For**:
- Long methods (>50 lines)
- Large classes (>300 lines)
- Long parameter lists (>4 parameters)
- Duplicate code blocks
- Deep nesting (>3 levels)
- Magic numbers and strings
- Feature envy (excessive method calls to other classes)
- Data clumps (same group of data passed together)

**Example Search Commands**:
```bash
# Find long methods
rg "^\s*(public|private|protected|internal).*\{" --after-context 50

# Find large classes
rg "^(public|internal) class" --count

# Find magic numbers
rg "\b\d{2,}\b" --type cs
```

**Expected Output**:
```
Code Analysis Results:
- 23 code smells detected across 12 files
- 8 SOLID principle violations identified
- 5 areas of high cyclomatic complexity (>10)
- 3 design pattern opportunities identified
```

#### Step 2: Categorize and Prioritize Issues

Organize findings by severity and impact:

**Priority Levels**:
1. **Critical**: Security issues, major SOLID violations, complexity >20
2. **High**: Code smells affecting maintainability, complexity 10-20
3. **Medium**: Minor violations, modernization opportunities
4. **Low**: Style improvements, optimization opportunities

**Categorization**:
- **Maintainability Issues**: Code smells, duplication, complexity
- **Design Issues**: SOLID violations, missing patterns
- **Modernization**: Legacy patterns, outdated syntax
- **Performance**: Inefficient algorithms, missing caching

#### Step 3: Generate Refactoring Report

Create comprehensive report using `assets/refactoring-report-template.md`:

**Report Sections**:
1. **Executive Summary**: High-level findings and recommendations
2. **Detailed Issues**: Each issue with location, severity, and fix suggestion
3. **Refactoring Roadmap**: Prioritized list of changes
4. **Effort Estimates**: Time estimates for each refactoring task
5. **Risk Assessment**: Potential risks and mitigation strategies

**Example Report Structure**:
```markdown
# Code Refactoring Report
Generated: 2025-10-28

## Executive Summary
- Total Issues: 23
- Critical: 2
- High: 8
- Medium: 10
- Low: 3

Estimated effort: 16-24 hours
Recommended approach: Incremental refactoring over 2 sprints

## Critical Issues

### 1. God Class: OrderProcessingService.cs (lines 1-847)
**Severity**: Critical
**Type**: Single Responsibility Violation
**Description**: Single class handling order validation, payment processing, inventory management, and notifications.

**Recommendation**:
- Extract OrderValidator
- Extract PaymentProcessor
- Extract InventoryManager
- Extract NotificationService

**Effort**: 6-8 hours
**Risk**: High (core business logic)

[... more issues ...]
```

---

### Workflow 2: SOLID Principle Application

#### Step 1: Detect SOLID Violations

Analyze code for violations of each SOLID principle:

**Single Responsibility Principle (SRP)**:
- Search for classes with multiple responsibilities
- Look for classes with many dependencies
- Identify classes that change for multiple reasons

**Detection Pattern**:
```csharp
// VIOLATION: Class doing too much
public class UserManager
{
    public void CreateUser() { }
    public void SendEmail() { }
    public void LogToDatabase() { }
    public void GenerateReport() { }
}
```

**Open/Closed Principle (OCP)**:
- Look for switch statements on type
- Identify conditional logic that requires modification for new features
- Search for hardcoded type checks

**Liskov Substitution Principle (LSP)**:
- Find inheritance hierarchies with broken contracts
- Identify overridden methods that change expected behavior
- Look for empty or exception-throwing implementations

**Interface Segregation Principle (ISP)**:
- Find large interfaces with many methods
- Identify classes implementing interfaces but throwing NotImplementedException
- Look for interfaces forcing unnecessary dependencies

**Dependency Inversion Principle (DIP)**:
- Search for direct instantiation of concrete classes
- Look for tight coupling to implementation details
- Identify missing abstractions

#### Step 2: Plan Refactoring Strategy

For each violation, create a refactoring plan:

**SRP Violation Refactoring**:
1. Identify distinct responsibilities
2. Extract each responsibility into separate class
3. Create interfaces for dependencies
4. Update tests for new structure

**OCP Violation Refactoring**:
1. Identify variation points
2. Create abstraction (interface/abstract class)
3. Implement strategy pattern or polymorphism
4. Remove conditional logic

**LSP Violation Refactoring**:
1. Review inheritance hierarchy
2. Consider composition over inheritance
3. Ensure derived classes honor base class contracts
4. Add interface if needed

**ISP Violation Refactoring**:
1. Analyze interface methods and their usage
2. Group related methods
3. Split into smaller, cohesive interfaces
4. Update implementing classes

**DIP Violation Refactoring**:
1. Identify concrete dependencies
2. Create abstractions (interfaces)
3. Register dependencies in DI container
4. Inject dependencies through constructor

#### Step 3: Apply Refactoring with Examples

Generate before/after code examples using `assets/before-after-template.md`:

**Example: SRP Refactoring**

**Before** (SRP Violation):
```csharp
public class OrderService
{
    public async Task ProcessOrder(Order order)
    {
        // Validation
        if (string.IsNullOrEmpty(order.CustomerEmail))
            throw new ArgumentException("Email required");

        // Payment processing
        var payment = await _paymentGateway.ChargeAsync(order.Total);
        if (!payment.Success)
            throw new PaymentException("Payment failed");

        // Inventory update
        foreach (var item in order.Items)
        {
            await _database.ExecuteAsync(
                "UPDATE Inventory SET Quantity = Quantity - @qty WHERE ProductId = @id",
                new { qty = item.Quantity, id = item.ProductId }
            );
        }

        // Send notification
        var emailBody = $"Order {order.Id} confirmed. Total: {order.Total}";
        await _emailService.SendAsync(order.CustomerEmail, "Order Confirmation", emailBody);
    }
}
```

**After** (SRP Applied):
```csharp
// Separate classes for distinct responsibilities

public class OrderValidator
{
    public ValidationResult Validate(Order order)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(order.CustomerEmail))
            errors.Add("Email required");

        if (order.Items.Count == 0)
            errors.Add("Order must contain items");

        return new ValidationResult(errors);
    }
}

public class PaymentProcessor
{
    private readonly IPaymentGateway _paymentGateway;

    public PaymentProcessor(IPaymentGateway paymentGateway)
    {
        _paymentGateway = paymentGateway;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(Order order)
    {
        return await _paymentGateway.ChargeAsync(order.Total);
    }
}

public class InventoryManager
{
    private readonly IInventoryRepository _repository;

    public InventoryManager(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async Task ReserveInventoryAsync(IEnumerable<OrderItem> items)
    {
        foreach (var item in items)
        {
            await _repository.DecrementStockAsync(item.ProductId, item.Quantity);
        }
    }
}

public class OrderNotificationService
{
    private readonly IEmailService _emailService;
    private readonly ITemplateEngine _templateEngine;

    public OrderNotificationService(IEmailService emailService, ITemplateEngine templateEngine)
    {
        _emailService = emailService;
        _templateEngine = templateEngine;
    }

    public async Task SendOrderConfirmationAsync(Order order)
    {
        var emailBody = _templateEngine.Render("OrderConfirmation", order);
        await _emailService.SendAsync(order.CustomerEmail, "Order Confirmation", emailBody);
    }
}

// Orchestrator coordinates the services
public class OrderService
{
    private readonly OrderValidator _validator;
    private readonly PaymentProcessor _paymentProcessor;
    private readonly InventoryManager _inventoryManager;
    private readonly OrderNotificationService _notificationService;

    public OrderService(
        OrderValidator validator,
        PaymentProcessor paymentProcessor,
        InventoryManager inventoryManager,
        OrderNotificationService notificationService)
    {
        _validator = validator;
        _paymentProcessor = paymentProcessor;
        _inventoryManager = inventoryManager;
        _notificationService = notificationService;
    }

    public async Task ProcessOrderAsync(Order order)
    {
        var validationResult = _validator.Validate(order);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var paymentResult = await _paymentProcessor.ProcessPaymentAsync(order);
        if (!paymentResult.Success)
            throw new PaymentException("Payment failed");

        await _inventoryManager.ReserveInventoryAsync(order.Items);
        await _notificationService.SendOrderConfirmationAsync(order);
    }
}
```

**Benefits**:
- ✅ Each class has single responsibility
- ✅ Easier to test (mock dependencies)
- ✅ Easier to maintain (changes isolated)
- ✅ Better reusability
- ✅ Follows dependency injection pattern

---

### Workflow 3: Design Pattern Implementation

#### Step 1: Identify Pattern Opportunities

Analyze code to find situations where design patterns would improve structure:

**Pattern Opportunity Indicators**:

**Factory Pattern**:
- Multiple `new` statements creating related objects
- Complex object creation logic
- Need to create objects based on configuration

**Strategy Pattern**:
- Large switch statements on type
- Multiple algorithms for same operation
- Need to change behavior at runtime

**Repository Pattern**:
- Direct database access throughout codebase
- Duplicate data access logic
- Need to abstract data source

**Builder Pattern**:
- Classes with many constructor parameters
- Complex object construction
- Need for fluent API

**Observer Pattern**:
- Need to notify multiple objects of state changes
- Event-driven architecture
- Pub/sub requirements

#### Step 2: Select Appropriate Pattern

Choose pattern based on problem characteristics:

**Refer to** `references/design-patterns.md` for:
- Pattern description
- When to use
- C# 13 implementation
- Complete example
- Pros and cons

#### Step 3: Implement Pattern

Apply the pattern with full implementation:

**Example: Strategy Pattern Implementation**

**Scenario**: Order discount calculation varies by customer type

**Before** (Switch Statement):
```csharp
public class DiscountCalculator
{
    public decimal Calculate(Order order, CustomerType customerType)
    {
        return customerType switch
        {
            CustomerType.Regular => order.Total * 0.05m,
            CustomerType.Premium => order.Total * 0.10m,
            CustomerType.VIP => order.Total * 0.20m,
            CustomerType.Employee => order.Total * 0.30m,
            _ => 0m
        };
    }
}
```

**Problem**: Adding new customer type requires modifying this class (OCP violation)

**After** (Strategy Pattern):
```csharp
// 1. Define strategy interface
public interface IDiscountStrategy
{
    decimal CalculateDiscount(Order order);
}

// 2. Implement concrete strategies
public class RegularCustomerDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order)
        => order.Total * 0.05m;
}

public class PremiumCustomerDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order)
        => order.Total * 0.10m;
}

public class VipCustomerDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order)
        => order.Total * 0.20m;
}

public class EmployeeDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order)
        => order.Total * 0.30m;
}

// 3. Context uses strategy
public class DiscountCalculator
{
    private readonly IDiscountStrategy _strategy;

    public DiscountCalculator(IDiscountStrategy strategy)
    {
        _strategy = strategy;
    }

    public decimal Calculate(Order order)
    {
        return _strategy.CalculateDiscount(order);
    }
}

// 4. Register strategies in DI container (Program.cs)
builder.Services.AddKeyedScoped<IDiscountStrategy, RegularCustomerDiscount>("Regular");
builder.Services.AddKeyedScoped<IDiscountStrategy, PremiumCustomerDiscount>("Premium");
builder.Services.AddKeyedScoped<IDiscountStrategy, VipCustomerDiscount>("VIP");
builder.Services.AddKeyedScoped<IDiscountStrategy, EmployeeDiscount>("Employee");

// 5. Usage with factory
public class DiscountCalculatorFactory
{
    private readonly IServiceProvider _serviceProvider;

    public DiscountCalculatorFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public DiscountCalculator CreateCalculator(CustomerType customerType)
    {
        var strategy = _serviceProvider.GetRequiredKeyedService<IDiscountStrategy>(
            customerType.ToString()
        );
        return new DiscountCalculator(strategy);
    }
}
```

**Benefits**:
- ✅ Open for extension (add new strategies without modifying existing code)
- ✅ Closed for modification (OCP)
- ✅ Each strategy is testable independently
- ✅ Strategy can be changed at runtime
- ✅ Follows SRP and DIP

---

### Workflow 4: C# 13 and .NET 9 Modernization

#### Step 1: Detect Legacy Patterns

Search for code patterns that can be modernized:

**Legacy Pattern Detection**:

**Old Lock Pattern**:
```csharp
// Search for: "private readonly object"
private readonly object _lock = new object();

lock (_lock)
{
    // critical section
}
```

**Old Collection Params**:
```csharp
// Search for: "params object[]"
public void LogMessages(params object[] messages)
```

**Manual Caching**:
```csharp
// Search for: "MemoryCache" or "IDistributedCache" with manual serialization
```

**Legacy Async Patterns**:
```csharp
// Search for: "Task.Run", "Task.Factory.StartNew"
```

**Old String Handling**:
```csharp
// Search for: string concatenation in loops
```

#### Step 2: Apply C# 13 Features

Modernize code using new language features:

**Refer to** `references/csharp13-migration.md` for complete patterns.

**Example 1: New Lock Type**

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
- Better performance (optimized for modern hardware)
- More efficient lock management
- Improved debuggability

**Example 2: params Collections**

**Before**:
```csharp
public void LogMessages(params object[] messages)
{
    foreach (var msg in messages)
    {
        Console.WriteLine(msg);
    }
}
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

// Can now accept any collection type
LogMessages(new List<object> { "msg1", "msg2" });
LogMessages(new[] { "msg1", "msg2" });
LogMessages("msg1", "msg2");
```

#### Step 3: Apply .NET 9 Features

Modernize to .NET 9 APIs and patterns:

**Example 1: HybridCache**

**Before** (Manual Caching):
```csharp
public class ProductService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly IProductRepository _repository;

    public async Task<Product> GetProductAsync(int id)
    {
        // Try memory cache
        if (_memoryCache.TryGetValue($"product:{id}", out Product? product))
            return product!;

        // Try distributed cache
        var cachedBytes = await _distributedCache.GetAsync($"product:{id}");
        if (cachedBytes != null)
        {
            product = JsonSerializer.Deserialize<Product>(cachedBytes);
            _memoryCache.Set($"product:{id}", product, TimeSpan.FromMinutes(5));
            return product!;
        }

        // Fetch from database
        product = await _repository.GetByIdAsync(id);

        // Update caches
        var serialized = JsonSerializer.SerializeToUtf8Bytes(product);
        await _distributedCache.SetAsync($"product:{id}", serialized,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) });
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
}

// Register in Program.cs
builder.Services.AddHybridCache();
```

**Benefits**:
- ✅ Automatic L1 (memory) + L2 (distributed) caching
- ✅ Stampede protection (prevents duplicate fetches)
- ✅ Automatic serialization
- ✅ Simplified API
- ✅ Better performance

**Example 2: Minimal APIs with OpenAPI**

**Before** (.NET 6/7):
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
}
```

**After** (.NET 9 Minimal API):
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi(); // .NET 9 built-in OpenAPI

var app = builder.Build();

app.MapOpenApi(); // Automatic OpenAPI document generation

app.MapGet("/api/products/{id}", async (int id, IProductService productService) =>
{
    var product = await productService.GetProductAsync(id);
    return product == null ? Results.NotFound() : Results.Ok(product);
})
.WithName("GetProduct")
.WithOpenApi(); // Automatic OpenAPI metadata

app.Run();
```

**Benefits**:
- ✅ Less boilerplate code
- ✅ Automatic OpenAPI generation (no Swashbuckle needed)
- ✅ Better performance (no controller overhead)
- ✅ Cleaner, more maintainable code

---

### Workflow 5: Complexity Reduction

#### Step 1: Measure Complexity

Calculate cyclomatic complexity for methods and classes:

**Cyclomatic Complexity Formula**:
```
CC = E - N + 2P

Where:
E = Number of edges (paths)
N = Number of nodes (statements)
P = Number of connected components (usually 1)

Simplified: Count decision points + 1
Decision points: if, else, case, for, foreach, while, do, catch, &&, ||, ??
```

**Complexity Thresholds**:
- **1-5**: Simple, low risk
- **6-10**: Moderate complexity, acceptable
- **11-20**: High complexity, should refactor
- **21+**: Very high complexity, must refactor

**Search for High Complexity**:
```bash
# Find methods with many decision points
rg "(if|else|case|for|foreach|while|catch|\?\?|\&\&|\|\|)" --count-matches
```

#### Step 2: Identify Complexity Hotspots

Find specific areas needing simplification:

**Complexity Indicators**:
- Methods >50 lines
- Nested conditionals >3 levels deep
- Large switch statements
- Multiple return points
- Long boolean expressions

**Example High Complexity Code**:
```csharp
public async Task<OrderResult> ProcessOrderAsync(Order order)
{
    if (order != null)
    {
        if (order.Items != null && order.Items.Count > 0)
        {
            decimal total = 0;
            foreach (var item in order.Items)
            {
                if (item.Quantity > 0)
                {
                    var product = await _productRepo.GetByIdAsync(item.ProductId);
                    if (product != null)
                    {
                        if (product.Stock >= item.Quantity)
                        {
                            total += product.Price * item.Quantity;
                            if (product.OnSale)
                            {
                                if (order.Customer.IsPremium)
                                {
                                    total -= total * 0.20m;
                                }
                                else
                                {
                                    total -= total * 0.10m;
                                }
                            }
                        }
                        else
                        {
                            return new OrderResult { Success = false, Error = "Insufficient stock" };
                        }
                    }
                    else
                    {
                        return new OrderResult { Success = false, Error = "Product not found" };
                    }
                }
            }
            order.Total = total;
            await _orderRepo.SaveAsync(order);
            return new OrderResult { Success = true, OrderId = order.Id };
        }
        else
        {
            return new OrderResult { Success = false, Error = "Order has no items" };
        }
    }
    else
    {
        return new OrderResult { Success = false, Error = "Order is null" };
    }
}
```

**Complexity**: ~15 (High - needs refactoring)

#### Step 3: Apply Simplification Techniques

Refer to `references/complexity-reduction.md` for detailed techniques:

**Technique 1: Early Returns (Guard Clauses)**
**Technique 2: Extract Methods**
**Technique 3: Replace Conditionals with Polymorphism**
**Technique 4: Simplify Boolean Expressions**
**Technique 5: Use Pattern Matching**

**After** (Refactored):
```csharp
public async Task<OrderResult> ProcessOrderAsync(Order order)
{
    // Guard clauses reduce nesting
    if (order == null)
        return OrderResult.Failure("Order is null");

    if (order.Items == null || order.Items.Count == 0)
        return OrderResult.Failure("Order has no items");

    var totalResult = await CalculateOrderTotalAsync(order);
    if (!totalResult.Success)
        return totalResult;

    order.Total = totalResult.Total;
    await _orderRepo.SaveAsync(order);

    return OrderResult.Success(order.Id);
}

private async Task<OrderTotalResult> CalculateOrderTotalAsync(Order order)
{
    decimal total = 0;

    foreach (var item in order.Items)
    {
        var itemResult = await ProcessOrderItemAsync(item, order.Customer);
        if (!itemResult.Success)
            return OrderTotalResult.Failure(itemResult.Error);

        total += itemResult.Amount;
    }

    return OrderTotalResult.Success(total);
}

private async Task<OrderItemResult> ProcessOrderItemAsync(OrderItem item, Customer customer)
{
    if (item.Quantity <= 0)
        return OrderItemResult.Success(0);

    var product = await _productRepo.GetByIdAsync(item.ProductId);
    if (product == null)
        return OrderItemResult.Failure("Product not found");

    if (product.Stock < item.Quantity)
        return OrderItemResult.Failure("Insufficient stock");

    var itemTotal = product.Price * item.Quantity;
    var discount = CalculateDiscount(product, customer);

    return OrderItemResult.Success(itemTotal - discount);
}

private decimal CalculateDiscount(Product product, Customer customer)
{
    if (!product.OnSale)
        return 0;

    var discountRate = customer.IsPremium ? 0.20m : 0.10m;
    return product.Price * discountRate;
}
```

**Complexity After**:
- `ProcessOrderAsync`: 3 (Low)
- `CalculateOrderTotalAsync`: 3 (Low)
- `ProcessOrderItemAsync`: 5 (Low)
- `CalculateDiscount`: 2 (Low)

**Benefits**:
- ✅ Complexity reduced from 15 to 2-5 per method
- ✅ Each method has single responsibility
- ✅ Easier to test (can test each method independently)
- ✅ Easier to read and understand
- ✅ Easier to maintain and modify

---

## Bundled Resources

### Reference Documentation

The skill includes six comprehensive reference documents:

#### 1. `references/code-smells-catalog.md`
Complete catalog of 25+ C# code smells with:
- Detection patterns
- Impact on maintainability
- Refactoring strategies
- Before/after examples

**Includes**: Long Method, Large Class, Long Parameter List, Duplicate Code, Feature Envy, Data Clumps, Primitive Obsession, Switch Statements, Lazy Class, Speculative Generality, and more.

#### 2. `references/solid-principles.md`
Comprehensive guide to SOLID principles with:
- Detailed explanation of each principle
- Violation detection patterns
- Refactoring strategies
- C# 13 implementations
- Real-world examples

**Covers**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion

#### 3. `references/design-patterns.md`
15+ proven design patterns for C# 13 with:
- Pattern descriptions
- When to use
- Implementation details
- Complete code examples
- Pros and cons

**Includes**:
- **Creational**: Factory Method, Abstract Factory, Builder, Singleton, Prototype
- **Structural**: Adapter, Decorator, Facade, Composite, Proxy
- **Behavioral**: Strategy, Observer, Command, Template Method, Chain of Responsibility

#### 4. `references/csharp13-migration.md`
C# 13 modernization guide with:
- New language features
- Migration patterns
- Performance improvements
- Breaking changes
- Before/after examples

**Features**: New Lock type, escape sequence `\e`, params collections, ref struct enhancements, partial properties, object initializer improvements

#### 5. `references/complexity-reduction.md`
Systematic complexity reduction techniques:
- Measuring cyclomatic complexity
- Identifying hotspots
- Simplification strategies
- Pattern matching optimizations
- Method extraction patterns

**Techniques**: Guard clauses, extract method, replace conditionals, simplify boolean expressions, use LINQ, apply pattern matching

#### 6. `references/refactoring-safety.md`
Safe refactoring practices:
- Test-driven refactoring
- Incremental changes
- Version control strategies
- Rollback procedures
- Continuous integration

### Asset Templates

#### 1. `assets/refactoring-report-template.md`
Standardized template for refactoring reports including:
- Executive summary
- Detailed issue breakdown
- Prioritized refactoring roadmap
- Effort estimates
- Risk assessment

#### 2. `assets/before-after-template.md`
Template for documenting code transformations:
- Before code with issues highlighted
- After code with improvements
- Benefits list
- Metrics comparison
- Testing notes

---

## Examples

### Example 1: Refactor God Class

**User Request**: "The UserService.cs class is getting too large. Can you refactor it?"

**Workflow**:

1. **Analysis**:
   ```
   Read file: src/Services/UserService.cs

   Analysis Results:
   - File size: 847 lines
   - Responsibilities identified: 6
     1. User CRUD operations
     2. Authentication
     3. Authorization
     4. Email notifications
     5. Password management
     6. Profile picture handling
   - SOLID violations: SRP (multiple responsibilities)
   - Complexity: High (multiple concerns in one class)
   ```

2. **Refactoring Plan**:
   ```
   Extract Classes:
   1. UserRepository (data access)
   2. AuthenticationService (login/logout)
   3. AuthorizationService (permissions)
   4. UserNotificationService (emails)
   5. PasswordManager (password operations)
   6. ProfilePictureService (image handling)

   Keep in UserService:
   - Orchestration only
   - Dependency injection of extracted services
   ```

3. **Implementation**: Delegate to Jordan (backend-developer) to create extracted classes

4. **Verification**: Run tests with Taylor (test-runner)

5. **Report**: Generate before/after comparison showing reduced complexity

### Example 2: Apply Strategy Pattern

**User Request**: "We need to support multiple shipping calculators based on carrier. Current code has a big switch statement."

**Workflow**:

1. **Identify Pattern Opportunity**: Switch on carrier type → Strategy Pattern

2. **Consult Reference**: Read `references/design-patterns.md` → Strategy section

3. **Implementation**:
   - Create `IShippingCalculator` interface
   - Implement strategies: `FedExCalculator`, `UpsCalculator`, `UspsCalculator`
   - Create `ShippingCalculatorFactory`
   - Register strategies in DI container
   - Replace switch statement with strategy selection

4. **Benefits Documentation**:
   - Open/Closed principle applied
   - Easy to add new carriers
   - Each calculator independently testable

### Example 3: Modernize to C# 13

**User Request**: "Update our locking code to use the new C# 13 Lock type"

**Workflow**:

1. **Search for Legacy Locks**:
   ```bash
   rg "private readonly object _lock" --type cs
   ```

2. **Consult Migration Guide**: Read `references/csharp13-migration.md`

3. **Apply Pattern**:
   - Replace `object _lock = new object()` with `Lock _lock = new()`
   - Add `using System.Threading;`
   - Keep lock statements unchanged (syntax compatible)

4. **Verify**: Build and run tests

5. **Document**: Generate before/after example showing modernization

### Example 4: Reduce Complexity

**User Request**: "The ProcessOrderAsync method is really hard to understand. Can you simplify it?"

**Workflow**:

1. **Measure Complexity**:
   ```
   Current complexity: 18 (Very High)
   Issues:
   - Deep nesting (5 levels)
   - Multiple return points (7)
   - Mixed concerns (validation, calculation, persistence)
   ```

2. **Consult Reduction Guide**: Read `references/complexity-reduction.md`

3. **Apply Techniques**:
   - Add guard clauses (early returns)
   - Extract methods (`ValidateOrder`, `CalculateTotal`, `ApplyDiscounts`)
   - Use pattern matching for type checks
   - Simplify boolean expressions

4. **Verify Reduction**:
   ```
   New complexity: 3-5 per method (Low)
   Benefits:
   - Each method has single purpose
   - Easier to test
   - Easier to understand
   - Better maintainability
   ```

### Example 5: SOLID Violation Fix

**User Request**: "Code review flagged SOLID violations in PaymentProcessor.cs"

**Workflow**:

1. **Analyze File**: Read PaymentProcessor.cs

2. **Identify Violations**:
   ```
   Found:
   - SRP violation: Class handles payment AND logging AND retry logic
   - DIP violation: Directly instantiates HttpClient
   - OCP violation: Hard-coded payment gateways
   ```

3. **Consult SOLID Guide**: Read `references/solid-principles.md`

4. **Apply Refactoring**:
   - Extract `IPaymentLogger` interface
   - Extract `IRetryPolicy` interface
   - Inject `IHttpClientFactory`
   - Create `IPaymentGateway` abstraction
   - Implement gateway strategies

5. **Verification**: Delegate to Avery (code-reviewer) for final review

---

## Best Practices

### 1. Incremental Refactoring

**Never refactor everything at once**:
- ✅ Refactor one class/method at a time
- ✅ Commit after each successful refactoring
- ✅ Run tests after every change
- ❌ Don't refactor multiple concerns simultaneously
- ❌ Don't skip testing

### 2. Test-Driven Refactoring

**Always maintain test coverage**:
- ✅ Run all tests before refactoring
- ✅ Ensure tests pass after refactoring
- ✅ Add tests if coverage gaps found
- ✅ Use test-runner (Taylor) to validate changes
- ❌ Don't refactor without tests

### 3. Use Version Control

**Commit frequently with clear messages**:
- ✅ Commit before starting refactoring
- ✅ Commit after each successful refactoring
- ✅ Use descriptive commit messages
- ✅ Create feature branch for large refactorings
- ❌ Don't mix refactoring with feature changes

**Example commit messages**:
```
refactor: extract OrderValidator from OrderService (SRP)
refactor: apply strategy pattern to discount calculation
refactor: modernize to C# 13 Lock type
refactor: reduce ProcessOrder complexity from 15 to 4
```

### 4. Review Changes

**Always get code review**:
- ✅ Use Avery (code-reviewer) for automated review
- ✅ Request human review for major refactorings
- ✅ Document rationale for changes
- ✅ Provide before/after metrics
- ❌ Don't merge without review

### 5. Measure Impact

**Track refactoring benefits**:
- ✅ Document complexity reduction
- ✅ Show improved test coverage
- ✅ Measure performance improvements
- ✅ Track maintainability metrics
- ❌ Don't refactor without justification

### 6. Prioritize High-Impact Areas

**Focus on code that matters**:
- ✅ Refactor frequently changed code first
- ✅ Refactor complex, bug-prone areas
- ✅ Refactor code blocking new features
- ❌ Don't refactor code that rarely changes
- ❌ Don't refactor code that works well

### 7. Know When NOT to Refactor

**Avoid unnecessary refactoring**:
- ❌ Code that will be deleted soon
- ❌ Code that's not causing problems
- ❌ Code in third-party libraries
- ❌ Code under active development by others
- ❌ Legacy code without tests (add tests first)

---

## Security Considerations

### Code Review for Security

When refactoring, always check for security implications:

**SQL Injection**:
- Ensure parameterized queries maintained after refactoring
- Don't introduce string concatenation in SQL

**Input Validation**:
- Preserve validation logic during extraction
- Don't lose validation when splitting classes

**Authentication/Authorization**:
- Maintain security checks when refactoring
- Don't accidentally remove authorization attributes

**Secrets Management**:
- Keep secrets in configuration, not code
- Don't hardcode credentials during refactoring

**Exception Handling**:
- Don't expose sensitive information in exceptions
- Maintain proper error handling

### Consult Security Specialist

For security-critical refactoring:
- ✅ Delegate to Alex (security-specialist) for review
- ✅ Run security audit after major refactoring
- ✅ Test authentication/authorization thoroughly

---

## Success Criteria

After using the C# Refactor Advisor skill, you should have:

✅ **Reduced Complexity**: Cyclomatic complexity decreased to acceptable levels (≤10)
✅ **Improved Maintainability**: Code smells identified and eliminated
✅ **SOLID Compliance**: Principles applied consistently
✅ **Design Patterns**: Appropriate patterns implemented
✅ **Modernized Code**: C# 13 and .NET 9 features applied
✅ **Test Coverage**: Maintained or improved (≥80%)
✅ **No Broken Tests**: All tests passing
✅ **Clear Documentation**: Before/after examples and rationale documented
✅ **Version Control**: Changes committed with clear messages
✅ **Code Review**: Approved by Avery or team reviewer

---

## Integration with SDLC Framework

The C# Refactor Advisor coordinates with other SchaabCore agents:

**Workflow Integration**:
```
User Request
    ↓
C# Refactor Advisor (analyze & plan)
    ↓
Jordan (backend-developer) → Implement refactoring
    ↓
Taylor (test-runner) → Run tests
    ↓
Avery (code-reviewer) → Review changes
    ↓
git-worker → Commit changes
    ↓
Complete
```

**Use with /code-review**:
```bash
/code-review @src/Services/UserService.cs
# Avery identifies issues → Refactor Advisor provides fixes
```

**Use with /develop-backend**:
```bash
/develop-backend "refactor UserService to follow SRP"
# Jordan implements → Refactor Advisor provides guidance
```

---

## Getting Started

To use the C# Refactor Advisor skill:

1. **Invoke the skill** when you need refactoring assistance:
   ```
   "Refactor OrderService.cs to follow SOLID principles"
   "Identify code smells in the Services folder"
   "Apply strategy pattern to discount calculation"
   "Modernize locking code to C# 13"
   "Reduce complexity in ProcessOrderAsync method"
   ```

2. **The skill will**:
   - Analyze your code
   - Identify issues
   - Recommend patterns
   - Generate before/after examples
   - Coordinate with other agents (Jordan, Avery, Taylor)

3. **Review the results**:
   - Check the refactoring report
   - Review before/after code
   - Run tests
   - Commit changes

4. **Iterate if needed**:
   - Apply additional refactorings
   - Address new issues discovered
   - Continue until quality gates met

---

## Tips and Tricks

### Quick Analysis
For quick code smell detection:
```
"Scan src/Services/ for code smells"
```

### Targeted Refactoring
For specific issues:
```
"Apply SRP to UserService"
"Replace switch statement with strategy pattern in DiscountCalculator"
```

### Bulk Modernization
For codebase-wide updates:
```
"Modernize all lock statements to C# 13"
"Replace all manual caching with HybridCache"
```

### Complexity Reduction
For simplifying complex code:
```
"Reduce complexity in ProcessOrderAsync"
"Simplify all methods with complexity > 10"
```

### Pattern Application
For implementing patterns:
```
"Apply repository pattern to data access"
"Implement factory pattern for report generation"
```

---

## Troubleshooting

### "I don't see any issues but code is hard to maintain"

**Possible causes**:
- Subtle code smells not detected automatically
- Lack of design patterns
- Insufficient abstraction

**Solution**: Request comprehensive analysis focusing on maintainability metrics

### "Refactoring broke tests"

**Possible causes**:
- Changed behavior during refactoring
- Test dependencies not updated
- Improper mocking

**Solution**:
- Revert changes
- Run tests before and after each small change
- Update test doubles to match new structure

### "Not sure which pattern to apply"

**Possible causes**:
- Multiple patterns could work
- Unclear requirements

**Solution**: Consult `references/design-patterns.md` for guidance on pattern selection

### "Complexity didn't decrease much"

**Possible causes**:
- Only superficial refactoring applied
- Underlying algorithm is inherently complex

**Solution**:
- Extract more methods
- Apply domain-driven design
- Consider redesigning algorithm

---

## Conclusion

The **C# Refactor Advisor** skill provides comprehensive support for improving C# codebase quality through systematic refactoring, SOLID principle application, design pattern implementation, and modernization to C# 13 and .NET 9.

Use this skill whenever you need to:
- Improve code quality and maintainability
- Apply proven design principles and patterns
- Reduce technical debt
- Modernize legacy code
- Prepare code for new features

The skill integrates seamlessly with the SchaabCore JS-AI Agentic SDLC Framework, coordinating with Jordan, Avery, Taylor, and other agents to deliver high-quality, well-tested, maintainable code.

**Remember**: Good code is not just code that works—it's code that's easy to understand, easy to maintain, and easy to change.
