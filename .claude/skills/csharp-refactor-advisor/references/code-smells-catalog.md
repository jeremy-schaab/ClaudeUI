# Code Smells Catalog for C#

A comprehensive catalog of code smells commonly found in C# codebases, with detection patterns, impact analysis, and refactoring strategies.

## Table of Contents

1. [Long Method](#long-method)
2. [Large Class (God Class)](#large-class-god-class)
3. [Long Parameter List](#long-parameter-list)
4. [Duplicate Code](#duplicate-code)
5. [Feature Envy](#feature-envy)
6. [Data Clumps](#data-clumps)
7. [Primitive Obsession](#primitive-obsession)
8. [Switch Statements](#switch-statements)
9. [Lazy Class](#lazy-class)
10. [Speculative Generality](#speculative-generality)
11. [Temporary Field](#temporary-field)
12. [Message Chains](#message-chains)
13. [Middle Man](#middle-man)
14. [Inappropriate Intimacy](#inappropriate-intimacy)
15. [Divergent Change](#divergent-change)
16. [Shotgun Surgery](#shotgun-surgery)
17. [Parallel Inheritance Hierarchies](#parallel-inheritance-hierarchies)
18. [Comments](#comments-as-smell)
19. [Dead Code](#dead-code)
20. [Magic Numbers/Strings](#magic-numbers-and-strings)
21. [Deep Nesting](#deep-nesting)
22. [Inconsistent Naming](#inconsistent-naming)
23. [Missing Abstraction](#missing-abstraction)
24. [Refused Bequest](#refused-bequest)
25. [Async/Await Misuse](#asyncawait-misuse)

---

## Long Method

### Description
A method that has grown too long, making it difficult to understand, maintain, and test.

### Threshold
- **>50 lines**: Consider refactoring
- **>100 lines**: Definitely refactor

### Detection Pattern
```bash
# Search for long methods
rg "^\s*(public|private|protected|internal).*\{" --after-context 50 --type cs
```

### Example

**Before** (Smells):
```csharp
public async Task<OrderResult> ProcessOrderAsync(Order order)
{
    // Validation (20 lines)
    if (order == null) throw new ArgumentNullException(nameof(order));
    if (order.Items == null || !order.Items.Any()) throw new ArgumentException("No items");
    // ... more validation ...

    // Calculate total (30 lines)
    decimal total = 0;
    foreach (var item in order.Items)
    {
        var product = await _productRepo.GetByIdAsync(item.ProductId);
        // ... complex calculation ...
    }

    // Apply discounts (25 lines)
    if (order.Customer.IsPremium)
    {
        // ... discount logic ...
    }

    // Process payment (20 lines)
    var payment = await _paymentGateway.ProcessAsync(total);
    // ... payment logic ...

    // Update inventory (15 lines)
    foreach (var item in order.Items)
    {
        // ... inventory logic ...
    }

    // Send notifications (10 lines)
    await _emailService.SendOrderConfirmationAsync(order);
    // ... notification logic ...

    return new OrderResult { Success = true };
}
```

**After** (Refactored):
```csharp
public async Task<OrderResult> ProcessOrderAsync(Order order)
{
    ValidateOrder(order);

    var total = await CalculateOrderTotalAsync(order);
    var discountedTotal = ApplyDiscounts(total, order.Customer);
    var payment = await ProcessPaymentAsync(discountedTotal);

    if (!payment.Success)
        return OrderResult.Failure(payment.Error);

    await UpdateInventoryAsync(order.Items);
    await SendOrderConfirmationAsync(order);

    return OrderResult.Success(order.Id);
}

private void ValidateOrder(Order order)
{
    if (order == null) throw new ArgumentNullException(nameof(order));
    if (order.Items == null || !order.Items.Any())
        throw new ArgumentException("No items", nameof(order));
}

private async Task<decimal> CalculateOrderTotalAsync(Order order)
{
    decimal total = 0;
    foreach (var item in order.Items)
    {
        var product = await _productRepo.GetByIdAsync(item.ProductId);
        total += product.Price * item.Quantity;
    }
    return total;
}

// ... other extracted methods ...
```

### Refactoring Strategy
1. **Extract Method**: Break into smaller, focused methods
2. **Replace Temp with Query**: Remove temporary variables by extracting calculations
3. **Introduce Parameter Object**: If many parameters, group into object

---

## Large Class (God Class)

### Description
A class that tries to do too much, violating the Single Responsibility Principle.

### Threshold
- **>300 lines**: Consider refactoring
- **>500 lines**: Definitely refactor
- **>10 dependencies**: Too many responsibilities

### Detection Pattern
```bash
# Find large classes
rg "^(public|internal) class" --count-matches --type cs | sort -t: -k2 -nr
```

### Example

**Before** (Smells):
```csharp
public class UserService
{
    // Dependencies (8 injected services - too many!)
    private readonly IUserRepository _userRepo;
    private readonly IEmailService _emailService;
    private readonly IAuthenticationService _authService;
    private readonly IAuthorizationService _authzService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IBlobStorage _blobStorage;
    private readonly ILogger<UserService> _logger;
    private readonly INotificationService _notifications;

    // User CRUD (50 lines)
    public async Task<User> CreateUserAsync(CreateUserRequest request) { }
    public async Task<User> GetUserByIdAsync(int id) { }
    public async Task UpdateUserAsync(UpdateUserRequest request) { }
    public async Task DeleteUserAsync(int id) { }

    // Authentication (100 lines)
    public async Task<AuthResult> LoginAsync(string email, string password) { }
    public async Task<AuthResult> RefreshTokenAsync(string refreshToken) { }
    public async Task LogoutAsync(int userId) { }

    // Authorization (80 lines)
    public async Task<bool> HasPermissionAsync(int userId, string permission) { }
    public async Task GrantRoleAsync(int userId, string role) { }
    public async Task RevokeRoleAsync(int userId, string role) { }

    // Password management (60 lines)
    public async Task ChangePasswordAsync(int userId, string oldPassword, string newPassword) { }
    public async Task ResetPasswordAsync(string email) { }
    public async Task ValidatePasswordStrengthAsync(string password) { }

    // Profile pictures (50 lines)
    public async Task UploadProfilePictureAsync(int userId, Stream imageStream) { }
    public async Task DeleteProfilePictureAsync(int userId) { }

    // Email notifications (40 lines)
    public async Task SendWelcomeEmailAsync(User user) { }
    public async Task SendPasswordResetEmailAsync(User user, string resetToken) { }
}
```

**After** (Refactored):
```csharp
// Separate classes for distinct responsibilities

public class UserService
{
    private readonly IUserRepository _userRepo;
    private readonly ILogger<UserService> _logger;

    public async Task<User> CreateUserAsync(CreateUserRequest request)
        => await _userRepo.CreateAsync(request.ToUser());

    public async Task<User> GetUserByIdAsync(int id)
        => await _userRepo.GetByIdAsync(id);

    public async Task UpdateUserAsync(UpdateUserRequest request)
        => await _userRepo.UpdateAsync(request.ToUser());

    public async Task DeleteUserAsync(int id)
        => await _userRepo.DeleteAsync(id);
}

public class AuthenticationService
{
    private readonly IUserRepository _userRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public async Task<AuthResult> LoginAsync(string email, string password) { }
    public async Task<AuthResult> RefreshTokenAsync(string refreshToken) { }
    public async Task LogoutAsync(int userId) { }
}

public class AuthorizationService
{
    private readonly IUserRepository _userRepo;
    private readonly IRoleRepository _roleRepo;

    public async Task<bool> HasPermissionAsync(int userId, string permission) { }
    public async Task GrantRoleAsync(int userId, string role) { }
    public async Task RevokeRoleAsync(int userId, string role) { }
}

public class PasswordManager
{
    private readonly IUserRepository _userRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IPasswordValidator _validator;

    public async Task ChangePasswordAsync(int userId, string oldPassword, string newPassword) { }
    public async Task ResetPasswordAsync(string email) { }
    public async Task<ValidationResult> ValidatePasswordStrengthAsync(string password) { }
}

public class ProfilePictureService
{
    private readonly IBlobStorage _blobStorage;
    private readonly IUserRepository _userRepo;

    public async Task UploadProfilePictureAsync(int userId, Stream imageStream) { }
    public async Task DeleteProfilePictureAsync(int userId) { }
}

public class UserNotificationService
{
    private readonly IEmailService _emailService;
    private readonly ITemplateEngine _templateEngine;

    public async Task SendWelcomeEmailAsync(User user) { }
    public async Task SendPasswordResetEmailAsync(User user, string resetToken) { }
}
```

### Refactoring Strategy
1. **Extract Class**: Identify distinct responsibilities and extract into separate classes
2. **Move Method**: Move methods to more appropriate classes
3. **Extract Interface**: Define contracts for new services

---

## Long Parameter List

### Description
Methods with too many parameters, making them hard to call and understand.

### Threshold
- **>3-4 parameters**: Consider refactoring
- **>6 parameters**: Definitely refactor

### Detection Pattern
```bash
# Find methods with many parameters
rg "\([^)]{100,}\)" --type cs
```

### Example

**Before** (Smells):
```csharp
public async Task<Order> CreateOrderAsync(
    int customerId,
    string customerEmail,
    string shippingAddress,
    string shippingCity,
    string shippingState,
    string shippingZip,
    string billingAddress,
    string billingCity,
    string billingState,
    string billingZip,
    string paymentMethod,
    string cardNumber,
    string cardExpiry,
    string cvv,
    List<OrderItem> items)
{
    // Implementation
}
```

**After** (Refactored):
```csharp
public record CreateOrderRequest(
    int CustomerId,
    string CustomerEmail,
    Address ShippingAddress,
    Address BillingAddress,
    PaymentInfo PaymentInfo,
    List<OrderItem> Items
);

public record Address(
    string Street,
    string City,
    string State,
    string ZipCode
);

public record PaymentInfo(
    string Method,
    string CardNumber,
    string CardExpiry,
    string Cvv
);

public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
{
    // Implementation - much cleaner!
}
```

### Refactoring Strategy
1. **Introduce Parameter Object**: Group related parameters into cohesive objects
2. **Preserve Whole Object**: Pass entire object instead of individual fields
3. **Builder Pattern**: For complex object construction

---

## Duplicate Code

### Description
Identical or very similar code appearing in multiple locations.

### Detection Pattern
```bash
# Find potential duplicates (manual inspection needed)
rg "for \(var i = 0" --count-matches --type cs
rg "if \(.*== null\)" --count-matches --type cs
```

### Example

**Before** (Smells):
```csharp
public class OrderService
{
    public async Task<Order> GetOrderAsync(int orderId)
    {
        var order = await _orderRepo.GetByIdAsync(orderId);
        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found", orderId);
            throw new NotFoundException($"Order {orderId} not found");
        }
        return order;
    }
}

public class ProductService
{
    public async Task<Product> GetProductAsync(int productId)
    {
        var product = await _productRepo.GetByIdAsync(productId);
        if (product == null)
        {
            _logger.LogWarning("Product {ProductId} not found", productId);
            throw new NotFoundException($"Product {productId} not found");
        }
        return product;
    }
}

public class CustomerService
{
    public async Task<Customer> GetCustomerAsync(int customerId)
    {
        var customer = await _customerRepo.GetByIdAsync(customerId);
        if (customer == null)
        {
            _logger.LogWarning("Customer {CustomerId} not found", customerId);
            throw new NotFoundException($"Customer {customerId} not found");
        }
        return customer;
    }
}
```

**After** (Refactored):
```csharp
// Extract common pattern into base class or helper
public abstract class BaseService<TEntity, TId> where TEntity : class
{
    protected readonly IRepository<TEntity, TId> _repository;
    protected readonly ILogger _logger;

    protected BaseService(IRepository<TEntity, TId> repository, ILogger logger)
    {
        _repository = repository;
        _logger = logger;
    }

    protected async Task<TEntity> GetOrThrowAsync(TId id, string entityName)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            _logger.LogWarning("{EntityName} {Id} not found", entityName, id);
            throw new NotFoundException($"{entityName} {id} not found");
        }
        return entity;
    }
}

public class OrderService : BaseService<Order, int>
{
    public OrderService(IOrderRepository repository, ILogger<OrderService> logger)
        : base(repository, logger) { }

    public async Task<Order> GetOrderAsync(int orderId)
        => await GetOrThrowAsync(orderId, "Order");
}

public class ProductService : BaseService<Product, int>
{
    public ProductService(IProductRepository repository, ILogger<ProductService> logger)
        : base(repository, logger) { }

    public async Task<Product> GetProductAsync(int productId)
        => await GetOrThrowAsync(productId, "Product");
}
```

### Refactoring Strategy
1. **Extract Method**: Pull duplicate code into shared method
2. **Pull Up Method**: Move to base class if in related classes
3. **Template Method**: Define algorithm skeleton in base class

---

## Feature Envy

### Description
A method that accesses data from another object more than its own.

### Example

**Before** (Smells):
```csharp
public class OrderService
{
    public decimal CalculateShipping(Order order)
    {
        // Accessing customer properties extensively
        var baseRate = order.Customer.ShippingAddress.State == "CA" ? 10 : 15;
        var discount = order.Customer.IsPremium ? 0.20m : 0;
        var weight = order.Customer.PreferredShippingMethod == "Express" ? 1.5m : 1.0m;

        return baseRate * weight * (1 - discount);
    }
}
```

**After** (Refactored):
```csharp
public class Customer
{
    public Address ShippingAddress { get; set; }
    public bool IsPremium { get; set; }
    public string PreferredShippingMethod { get; set; }

    public decimal CalculateShippingRate(decimal baseRate)
    {
        var stateRate = ShippingAddress.State == "CA" ? baseRate : baseRate * 1.5m;
        var discount = IsPremium ? 0.20m : 0;
        var weight = PreferredShippingMethod == "Express" ? 1.5m : 1.0m;

        return stateRate * weight * (1 - discount);
    }
}

public class OrderService
{
    public decimal CalculateShipping(Order order)
    {
        return order.Customer.CalculateShippingRate(10);
    }
}
```

### Refactoring Strategy
1. **Move Method**: Move method to the class it accesses most
2. **Extract Method**: Extract envious part and move it

---

## Data Clumps

### Description
Groups of data that appear together frequently (e.g., address fields).

### Example

**Before** (Smells):
```csharp
public class Customer
{
    public string ShippingStreet { get; set; }
    public string ShippingCity { get; set; }
    public string ShippingState { get; set; }
    public string ShippingZip { get; set; }

    public string BillingStreet { get; set; }
    public string BillingCity { get; set; }
    public string BillingState { get; set; }
    public string BillingZip { get; set; }
}

public void ValidateShippingAddress(string street, string city, string state, string zip) { }
public void ValidateBillingAddress(string street, string city, string state, string zip) { }
```

**After** (Refactored):
```csharp
public record Address(
    string Street,
    string City,
    string State,
    string ZipCode)
{
    public bool IsValid()
        => !string.IsNullOrEmpty(Street)
        && !string.IsNullOrEmpty(City)
        && !string.IsNullOrEmpty(State)
        && !string.IsNullOrEmpty(ZipCode);
}

public class Customer
{
    public Address ShippingAddress { get; set; }
    public Address BillingAddress { get; set; }
}

public void ValidateAddress(Address address)
{
    if (!address.IsValid())
        throw new ValidationException("Invalid address");
}
```

### Refactoring Strategy
1. **Extract Class**: Create class to hold related data
2. **Introduce Parameter Object**: Pass object instead of individual values

---

## Primitive Obsession

### Description
Using primitive types instead of small objects for simple tasks (e.g., string for email, int for money).

### Example

**Before** (Smells):
```csharp
public class Order
{
    public string CustomerEmail { get; set; } // No validation
    public decimal Total { get; set; } // No currency info
    public string Status { get; set; } // Magic strings
}

public void SendEmail(string email)
{
    // No validation if email is valid
    _emailService.Send(email, "...");
}

public void ProcessPayment(decimal amount)
{
    // No currency handling
}
```

**After** (Refactored):
```csharp
public record Email
{
    public string Value { get; }

    public Email(string value)
    {
        if (!IsValid(value))
            throw new ArgumentException("Invalid email", nameof(value));
        Value = value;
    }

    private static bool IsValid(string email)
        => !string.IsNullOrEmpty(email) && email.Contains('@');

    public override string ToString() => Value;
}

public record Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency = "USD")
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative", nameof(amount));
        Amount = amount;
        Currency = currency;
    }

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Cannot add different currencies");
        return new Money(Amount + other.Amount, Currency);
    }
}

public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}

public class Order
{
    public Email CustomerEmail { get; set; }
    public Money Total { get; set; }
    public OrderStatus Status { get; set; }
}

public void SendEmail(Email email)
{
    // Email is already validated
    _emailService.Send(email.Value, "...");
}

public void ProcessPayment(Money amount)
{
    // Currency is handled
}
```

### Refactoring Strategy
1. **Replace Data Value with Object**: Create value objects
2. **Replace Type Code with Enum**: Use enums for fixed sets of values
3. **Introduce Value Object**: Encapsulate primitive with validation

---

## Switch Statements

### Description
Large switch/case statements or if-else chains that switch on type.

### Example

**Before** (Smells):
```csharp
public decimal CalculateDiscount(Order order, CustomerType customerType)
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
```

**After** (Strategy Pattern):
```csharp
public interface IDiscountStrategy
{
    decimal CalculateDiscount(Order order);
}

public class RegularDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order) => order.Total * 0.05m;
}

public class PremiumDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order) => order.Total * 0.10m;
}

public class VipDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order) => order.Total * 0.20m;
}

public class DiscountCalculator
{
    private readonly IDiscountStrategy _strategy;

    public DiscountCalculator(IDiscountStrategy strategy)
    {
        _strategy = strategy;
    }

    public decimal Calculate(Order order) => _strategy.CalculateDiscount(order);
}
```

### Refactoring Strategy
1. **Replace Conditional with Polymorphism**: Use strategy pattern
2. **Replace Type Code with State/Strategy**: Encapsulate behavior

---

## Magic Numbers and Strings

### Description
Unexplained numeric or string literals in code.

### Example

**Before** (Smells):
```csharp
public bool ValidatePassword(string password)
{
    return password.Length >= 8 && password.Length <= 50;
}

public decimal CalculateTax(decimal amount)
{
    return amount * 0.08m; // What is 0.08?
}

public void ProcessOrder(Order order)
{
    if (order.Status == "pending") // Magic string
    {
        // ...
    }
}
```

**After** (Refactored):
```csharp
public class PasswordValidator
{
    private const int MinPasswordLength = 8;
    private const int MaxPasswordLength = 50;

    public bool IsValid(string password)
    {
        return password.Length >= MinPasswordLength
            && password.Length <= MaxPasswordLength;
    }
}

public class TaxCalculator
{
    private const decimal StateTaxRate = 0.08m;

    public decimal Calculate(decimal amount)
    {
        return amount * StateTaxRate;
    }
}

public enum OrderStatus
{
    Pending,
    Processing,
    Shipped
}

public void ProcessOrder(Order order)
{
    if (order.Status == OrderStatus.Pending)
    {
        // ...
    }
}
```

### Refactoring Strategy
1. **Replace Magic Number with Constant**: Extract to named constant
2. **Replace Magic String with Enum**: Use enums for fixed values

---

## Deep Nesting

### Description
Code with excessive nesting levels (if within if within if...).

### Threshold
- **>3 levels**: Consider refactoring
- **>5 levels**: Definitely refactor

### Example

**Before** (Smells):
```csharp
public async Task ProcessAsync(Order order)
{
    if (order != null)
    {
        if (order.Items != null)
        {
            if (order.Items.Count > 0)
            {
                foreach (var item in order.Items)
                {
                    if (item.Quantity > 0)
                    {
                        var product = await _productRepo.GetByIdAsync(item.ProductId);
                        if (product != null)
                        {
                            if (product.Stock >= item.Quantity)
                            {
                                // Finally do something!
                            }
                        }
                    }
                }
            }
        }
    }
}
```

**After** (Guard Clauses):
```csharp
public async Task ProcessAsync(Order order)
{
    if (order == null) return;
    if (order.Items == null || order.Items.Count == 0) return;

    foreach (var item in order.Items)
    {
        await ProcessItemAsync(item);
    }
}

private async Task ProcessItemAsync(OrderItem item)
{
    if (item.Quantity <= 0) return;

    var product = await _productRepo.GetByIdAsync(item.ProductId);
    if (product == null) return;
    if (product.Stock < item.Quantity) return;

    // Do something
}
```

### Refactoring Strategy
1. **Use Guard Clauses**: Early returns reduce nesting
2. **Extract Method**: Break nested logic into methods
3. **Replace Nested Conditional with Guard Clauses**

---

## Async/Await Misuse

### Description
Common mistakes in async code that reduce performance or cause deadlocks.

### Example

**Before** (Smells):
```csharp
// 1. Async void (bad - use async Task)
public async void ProcessOrderAsync(Order order)
{
    await _orderService.SaveAsync(order);
}

// 2. Blocking on async (causes deadlocks)
public Order GetOrder(int id)
{
    return _orderService.GetOrderAsync(id).Result;
}

// 3. Unnecessary async/await
public async Task<Order> GetOrderAsync(int id)
{
    return await _orderRepo.GetByIdAsync(id);
}

// 4. Not using ConfigureAwait in libraries
public async Task<Order> GetOrderAsync(int id)
{
    return await _orderRepo.GetByIdAsync(id);
}
```

**After** (Refactored):
```csharp
// 1. Use async Task
public async Task ProcessOrderAsync(Order order)
{
    await _orderService.SaveAsync(order);
}

// 2. Make caller async
public async Task<Order> GetOrderAsync(int id)
{
    return await _orderService.GetOrderAsync(id);
}

// 3. Remove unnecessary async/await
public Task<Order> GetOrderAsync(int id)
{
    return _orderRepo.GetByIdAsync(id);
}

// 4. Use ConfigureAwait(false) in libraries
public async Task<Order> GetOrderAsync(int id)
{
    return await _orderRepo.GetByIdAsync(id).ConfigureAwait(false);
}
```

### Refactoring Strategy
1. **Never use async void** (except event handlers)
2. **Never block on async code** (.Result, .Wait())
3. **Remove unnecessary async/await**
4. **Use ConfigureAwait(false)** in library code

---

## Summary Table

| Code Smell | Threshold | Primary Refactoring |
|-------------|-----------|---------------------|
| Long Method | >50 lines | Extract Method |
| Large Class | >300 lines | Extract Class |
| Long Parameter List | >4 params | Introduce Parameter Object |
| Duplicate Code | Any duplication | Extract Method/Class |
| Feature Envy | High external access | Move Method |
| Data Clumps | Repeated groups | Extract Class |
| Primitive Obsession | Primitive for domain concept | Introduce Value Object |
| Switch Statements | Type switching | Replace with Polymorphism |
| Magic Numbers | Unexplained literals | Replace with Constant |
| Deep Nesting | >3 levels | Guard Clauses + Extract Method |
| Async/Await Misuse | Any violation | Fix async pattern |

---

## Detection Checklist

Use this checklist during code review:

- [ ] Are there methods >50 lines?
- [ ] Are there classes >300 lines?
- [ ] Are there methods with >4 parameters?
- [ ] Is there duplicate code?
- [ ] Are methods accessing other classes' data extensively?
- [ ] Are the same parameters passed together frequently?
- [ ] Are primitives used for domain concepts?
- [ ] Are there large switch/if-else statements?
- [ ] Are there magic numbers or strings?
- [ ] Is there deep nesting (>3 levels)?
- [ ] Are there async/await anti-patterns?

---

## Conclusion

Code smells are indicators of deeper problems in code design. While not bugs, they make code harder to understand, maintain, and extend. Regular refactoring to eliminate code smells improves code quality, reduces technical debt, and makes future development easier.

Use this catalog as a reference when analyzing C# code for quality improvements.
