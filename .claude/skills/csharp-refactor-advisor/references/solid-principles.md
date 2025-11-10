# SOLID Principles for C#

A comprehensive guide to SOLID principles with C# 13 and .NET 9 examples, violation detection patterns, and refactoring strategies.

## Table of Contents

1. [Introduction to SOLID](#introduction-to-solid)
2. [Single Responsibility Principle (SRP)](#single-responsibility-principle-srp)
3. [Open/Closed Principle (OCP)](#openclosed-principle-ocp)
4. [Liskov Substitution Principle (LSP)](#liskov-substitution-principle-lsp)
5. [Interface Segregation Principle (ISP)](#interface-segregation-principle-isp)
6. [Dependency Inversion Principle (DIP)](#dependency-inversion-principle-dip)
7. [SOLID in Practice](#solid-in-practice)

---

## Introduction to SOLID

SOLID is an acronym for five design principles that make software designs more understandable, flexible, and maintainable.

**Benefits**:
- ✅ Easier to understand and maintain
- ✅ More flexible to change
- ✅ Easier to test
- ✅ Reduces coupling
- ✅ Improves code reusability

**The Five Principles**:
1. **S**ingle Responsibility Principle
2. **O**pen/Closed Principle
3. **L**iskov Substitution Principle
4. **I**nterface Segregation Principle
5. **D**ependency Inversion Principle

---

## Single Responsibility Principle (SRP)

> **"A class should have one, and only one, reason to change."**

### Definition

A class should have only one responsibility, only one reason to change. If a class has multiple responsibilities, changes to one responsibility may affect or break code related to the other responsibility.

### How to Identify Violations

**Red Flags**:
- Class name contains "And", "Or", "Manager", "Utility"
- Class has many dependencies (>5 injected services)
- Class has methods that operate on completely different data
- Changes for different features affect the same class
- Class is hard to describe in one sentence

**Detection Questions**:
1. Does this class have more than one reason to change?
2. Can I describe the class responsibility in one sentence without using "and"?
3. Does this class depend on too many other classes?

### Violation Example

**Before** (Violates SRP):
```csharp
public class UserService
{
    private readonly IDbConnection _db;
    private readonly IEmailService _emailService;
    private readonly ILogger _logger;

    // Responsibility 1: User CRUD operations
    public async Task<User> CreateUserAsync(User user)
    {
        var sql = "INSERT INTO Users (Name, Email) VALUES (@Name, @Email)";
        await _db.ExecuteAsync(sql, user);
        _logger.LogInformation("User {UserId} created", user.Id);
        return user;
    }

    // Responsibility 2: Email notifications
    public async Task SendWelcomeEmailAsync(User user)
    {
        var subject = "Welcome!";
        var body = $"Hello {user.Name}, welcome to our service!";
        await _emailService.SendAsync(user.Email, subject, body);
        _logger.LogInformation("Welcome email sent to {Email}", user.Email);
    }

    // Responsibility 3: Report generation
    public async Task<byte[]> GenerateUserReportAsync()
    {
        var users = await _db.QueryAsync<User>("SELECT * FROM Users");
        var report = new StringBuilder();
        report.AppendLine("User Report");
        foreach (var user in users)
        {
            report.AppendLine($"{user.Name} - {user.Email}");
        }
        return Encoding.UTF8.GetBytes(report.ToString());
    }

    // Responsibility 4: Validation
    public bool ValidateUser(User user)
    {
        if (string.IsNullOrEmpty(user.Name)) return false;
        if (string.IsNullOrEmpty(user.Email)) return false;
        if (!user.Email.Contains('@')) return false;
        return true;
    }
}
```

**Problems**:
- Changes to email logic require modifying UserService
- Changes to report format require modifying UserService
- Changes to validation rules require modifying UserService
- Hard to test (needs to mock database, email, logger)
- High coupling to multiple concerns

### Refactored Example

**After** (Follows SRP):
```csharp
// Responsibility 1: User data access
public class UserRepository
{
    private readonly IDbConnection _db;

    public UserRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<User> CreateAsync(User user)
    {
        var sql = "INSERT INTO Users (Name, Email) VALUES (@Name, @Email)";
        await _db.ExecuteAsync(sql, user);
        return user;
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _db.QueryAsync<User>("SELECT * FROM Users");
    }
}

// Responsibility 2: User validation
public class UserValidator
{
    public ValidationResult Validate(User user)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(user.Name))
            errors.Add("Name is required");

        if (string.IsNullOrEmpty(user.Email))
            errors.Add("Email is required");
        else if (!user.Email.Contains('@'))
            errors.Add("Email must be valid");

        return new ValidationResult(errors);
    }
}

// Responsibility 3: User notifications
public class UserNotificationService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<UserNotificationService> _logger;

    public UserNotificationService(IEmailService emailService, ILogger<UserNotificationService> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task SendWelcomeEmailAsync(User user)
    {
        var subject = "Welcome!";
        var body = $"Hello {user.Name}, welcome to our service!";
        await _emailService.SendAsync(user.Email, subject, body);
        _logger.LogInformation("Welcome email sent to {Email}", user.Email);
    }
}

// Responsibility 4: Report generation
public class UserReportGenerator
{
    private readonly UserRepository _userRepository;

    public UserReportGenerator(UserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<byte[]> GenerateReportAsync()
    {
        var users = await _userRepository.GetAllAsync();
        var report = new StringBuilder();
        report.AppendLine("User Report");
        foreach (var user in users)
        {
            report.AppendLine($"{user.Name} - {user.Email}");
        }
        return Encoding.UTF8.GetBytes(report.ToString());
    }
}

// Orchestrator (single responsibility: coordination)
public class UserService
{
    private readonly UserRepository _repository;
    private readonly UserValidator _validator;
    private readonly UserNotificationService _notificationService;
    private readonly ILogger<UserService> _logger;

    public UserService(
        UserRepository repository,
        UserValidator validator,
        UserNotificationService notificationService,
        ILogger<UserService> logger)
    {
        _repository = repository;
        _validator = validator;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<User>> CreateUserAsync(User user)
    {
        var validationResult = _validator.Validate(user);
        if (!validationResult.IsValid)
            return Result<User>.Failure(validationResult.Errors);

        var createdUser = await _repository.CreateAsync(user);
        _logger.LogInformation("User {UserId} created", createdUser.Id);

        await _notificationService.SendWelcomeEmailAsync(createdUser);

        return Result<User>.Success(createdUser);
    }
}
```

**Benefits**:
- ✅ Each class has single, well-defined responsibility
- ✅ Easier to test (mock only what's needed)
- ✅ Easier to maintain (changes isolated to specific classes)
- ✅ Easier to reuse (e.g., UserValidator can be used elsewhere)
- ✅ Lower coupling

### SRP Refactoring Strategy

1. **Identify Responsibilities**: List everything the class does
2. **Extract Classes**: Create separate class for each responsibility
3. **Define Interfaces**: Create abstractions for dependencies
4. **Coordinate**: Keep orchestration in original class or extract facade
5. **Test**: Verify each extracted class independently

---

## Open/Closed Principle (OCP)

> **"Software entities should be open for extension but closed for modification."**

### Definition

You should be able to extend a class's behavior without modifying its source code. Achieve this through abstraction, inheritance, or composition.

### How to Identify Violations

**Red Flags**:
- Switch/case statements on type
- If-else chains checking object type
- Adding new features requires modifying existing classes
- Hard to add new behaviors without touching existing code

### Violation Example

**Before** (Violates OCP):
```csharp
public class DiscountCalculator
{
    public decimal CalculateDiscount(Order order, CustomerType customerType)
    {
        // Every new customer type requires modifying this method
        return customerType switch
        {
            CustomerType.Regular => order.Total * 0.05m,
            CustomerType.Premium => order.Total * 0.10m,
            CustomerType.VIP => order.Total * 0.20m,
            // Adding new type requires modifying this class
            CustomerType.Employee => order.Total * 0.30m,
            _ => 0m
        };
    }
}

public class ShippingCalculator
{
    public decimal CalculateShipping(Order order, ShippingMethod method)
    {
        // Every new shipping method requires modifying this method
        return method switch
        {
            ShippingMethod.Standard => 5.00m,
            ShippingMethod.Express => 15.00m,
            ShippingMethod.Overnight => 25.00m,
            // Adding new method requires modifying this class
            ShippingMethod.International => 50.00m,
            _ => 0m
        };
    }
}
```

**Problems**:
- Adding new customer type requires modifying DiscountCalculator
- Adding new shipping method requires modifying ShippingCalculator
- Violates OCP (not closed for modification)
- High risk of introducing bugs when adding features
- Hard to test new behaviors independently

### Refactored Example

**After** (Follows OCP using Strategy Pattern):
```csharp
// Abstraction allows extension
public interface IDiscountStrategy
{
    decimal CalculateDiscount(Order order);
}

// Concrete strategies (open for extension)
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

// Adding new discount doesn't modify existing classes
public class EmployeeDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order)
        => order.Total * 0.30m;
}

// Context uses abstraction (closed for modification)
public class DiscountCalculator
{
    private readonly IDiscountStrategy _strategy;

    public DiscountCalculator(IDiscountStrategy strategy)
    {
        _strategy = strategy;
    }

    public decimal Calculate(Order order)
        => _strategy.CalculateDiscount(order);
}

// Factory to select strategy
public class DiscountStrategyFactory
{
    private readonly IServiceProvider _serviceProvider;

    public DiscountStrategyFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public IDiscountStrategy Create(CustomerType customerType)
    {
        return customerType switch
        {
            CustomerType.Regular => _serviceProvider.GetRequiredService<RegularCustomerDiscount>(),
            CustomerType.Premium => _serviceProvider.GetRequiredService<PremiumCustomerDiscount>(),
            CustomerType.VIP => _serviceProvider.GetRequiredService<VipCustomerDiscount>(),
            CustomerType.Employee => _serviceProvider.GetRequiredService<EmployeeDiscount>(),
            _ => throw new ArgumentException($"Unknown customer type: {customerType}")
        };
    }
}

// Register in DI container (Program.cs)
builder.Services.AddScoped<RegularCustomerDiscount>();
builder.Services.AddScoped<PremiumCustomerDiscount>();
builder.Services.AddScoped<VipCustomerDiscount>();
builder.Services.AddScoped<EmployeeDiscount>();
builder.Services.AddScoped<DiscountStrategyFactory>();
```

**Benefits**:
- ✅ Adding new discount doesn't modify existing classes
- ✅ Each discount strategy independently testable
- ✅ Follows OCP (closed for modification, open for extension)
- ✅ Lower risk of breaking existing functionality
- ✅ Easier to maintain

### OCP Refactoring Strategy

1. **Identify Variation Points**: Find switch/if-else on type
2. **Create Abstraction**: Define interface for behavior
3. **Implement Strategies**: Create concrete implementations
4. **Use Composition**: Inject strategy into context
5. **Factory Pattern**: Create factory to select strategy if needed

---

## Liskov Substitution Principle (LSP)

> **"Derived classes must be substitutable for their base classes."**

### Definition

Objects of a superclass should be replaceable with objects of its subclasses without breaking the application. Derived classes should extend base class behavior, not replace or remove it.

### How to Identify Violations

**Red Flags**:
- Derived class throws NotImplementedException
- Derived class overrides method with empty implementation
- Derived class changes expected behavior
- Client code checks type before calling methods
- Derived class has stricter preconditions or weaker postconditions

### Violation Example

**Before** (Violates LSP):
```csharp
public class Bird
{
    public virtual void Fly()
    {
        Console.WriteLine("Flying...");
    }
}

public class Sparrow : Bird
{
    public override void Fly()
    {
        Console.WriteLine("Sparrow flying...");
    }
}

public class Penguin : Bird
{
    public override void Fly()
    {
        // Penguins can't fly! Violates LSP
        throw new NotImplementedException("Penguins can't fly");
    }
}

// Client code breaks when using Penguin
public void MakeBirdFly(Bird bird)
{
    bird.Fly(); // Throws exception if bird is Penguin!
}
```

**Another Violation** (Unexpected behavior change):
```csharp
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }

    public int CalculateArea() => Width * Height;
}

public class Square : Rectangle
{
    public override int Width
    {
        get => base.Width;
        set
        {
            base.Width = value;
            base.Height = value; // Unexpected side effect!
        }
    }

    public override int Height
    {
        get => base.Height;
        set
        {
            base.Width = value; // Unexpected side effect!
            base.Height = value;
        }
    }
}

// Client code breaks
public void ResizeRectangle(Rectangle rect)
{
    rect.Width = 5;
    rect.Height = 10;
    // For Rectangle: Area = 50
    // For Square: Area = 100 (unexpected!)
}
```

### Refactored Example

**After** (Follows LSP):
```csharp
// Solution 1: Redesign hierarchy
public abstract class Bird
{
    public abstract void Move();
}

public interface IFlyable
{
    void Fly();
}

public class Sparrow : Bird, IFlyable
{
    public override void Move() => Fly();

    public void Fly()
    {
        Console.WriteLine("Sparrow flying...");
    }
}

public class Penguin : Bird
{
    public override void Move() => Swim();

    public void Swim()
    {
        Console.WriteLine("Penguin swimming...");
    }
}

// Client code works correctly
public void MakeBirdMove(Bird bird)
{
    bird.Move(); // Works for all birds
}

public void MakeFlyableFly(IFlyable flyable)
{
    flyable.Fly(); // Only accepts birds that can fly
}
```

**Rectangle/Square Solution**:
```csharp
// Solution: Use interfaces instead of inheritance
public interface IShape
{
    int CalculateArea();
}

public class Rectangle : IShape
{
    public int Width { get; set; }
    public int Height { get; set; }

    public int CalculateArea() => Width * Height;
}

public class Square : IShape
{
    public int SideLength { get; set; }

    public int CalculateArea() => SideLength * SideLength;
}

// Or use composition
public class Square
{
    private readonly Rectangle _rectangle;

    public Square(int sideLength)
    {
        _rectangle = new Rectangle { Width = sideLength, Height = sideLength };
    }

    public int SideLength
    {
        get => _rectangle.Width;
        set
        {
            _rectangle.Width = value;
            _rectangle.Height = value;
        }
    }

    public int CalculateArea() => _rectangle.CalculateArea();
}
```

**Benefits**:
- ✅ Substitution works correctly
- ✅ No unexpected behavior changes
- ✅ No exceptions thrown by derived classes
- ✅ Client code works with any implementation

### LSP Refactoring Strategy

1. **Identify Broken Contracts**: Find derived classes that change behavior
2. **Redesign Hierarchy**: Use composition over inheritance
3. **Create Interfaces**: Define contracts for specific capabilities
4. **Remove Inheritance**: If substitution doesn't make sense, don't inherit

---

## Interface Segregation Principle (ISP)

> **"No client should be forced to depend on methods it does not use."**

### Definition

Keep interfaces small and focused. Don't force clients to implement methods they don't need. Many specific interfaces are better than one general-purpose interface.

### How to Identify Violations

**Red Flags**:
- Interface has many methods (>5-7)
- Classes implement interface but throw NotImplementedException
- Classes implement interface with empty methods
- Interface name ends with "Manager" or "Service"

### Violation Example

**Before** (Violates ISP):
```csharp
public interface IOrderService
{
    // Order management
    Task<Order> CreateOrderAsync(Order order);
    Task<Order> GetOrderAsync(int id);
    Task UpdateOrderAsync(Order order);
    Task DeleteOrderAsync(int id);

    // Payment processing
    Task<PaymentResult> ProcessPaymentAsync(Order order);
    Task<RefundResult> RefundOrderAsync(int orderId);

    // Shipping
    Task<ShippingResult> ShipOrderAsync(int orderId);
    Task<TrackingInfo> TrackShipmentAsync(string trackingNumber);

    // Reporting
    Task<OrderReport> GenerateOrderReportAsync(DateTime start, DateTime end);
    Task<byte[]> ExportOrdersToCsvAsync();
}

// Client only needs to create orders but must implement ALL methods
public class OrderCreationService : IOrderService
{
    public async Task<Order> CreateOrderAsync(Order order)
    {
        // Implementation
    }

    // Forced to implement methods it doesn't use
    public Task<Order> GetOrderAsync(int id) => throw new NotImplementedException();
    public Task UpdateOrderAsync(Order order) => throw new NotImplementedException();
    public Task DeleteOrderAsync(int id) => throw new NotImplementedException();
    public Task<PaymentResult> ProcessPaymentAsync(Order order) => throw new NotImplementedException();
    public Task<RefundResult> RefundOrderAsync(int orderId) => throw new NotImplementedException();
    public Task<ShippingResult> ShipOrderAsync(int orderId) => throw new NotImplementedException();
    public Task<TrackingInfo> TrackShipmentAsync(string trackingNumber) => throw new NotImplementedException();
    public Task<OrderReport> GenerateOrderReportAsync(DateTime start, DateTime end) => throw new NotImplementedException();
    public Task<byte[]> ExportOrdersToCsvAsync() => throw new NotImplementedException();
}
```

### Refactored Example

**After** (Follows ISP):
```csharp
// Split into focused interfaces
public interface IOrderRepository
{
    Task<Order> CreateAsync(Order order);
    Task<Order> GetByIdAsync(int id);
    Task UpdateAsync(Order order);
    Task DeleteAsync(int id);
}

public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessPaymentAsync(Order order);
    Task<RefundResult> RefundAsync(int orderId);
}

public interface IShippingService
{
    Task<ShippingResult> ShipAsync(int orderId);
    Task<TrackingInfo> TrackAsync(string trackingNumber);
}

public interface IOrderReportGenerator
{
    Task<OrderReport> GenerateReportAsync(DateTime start, DateTime end);
    Task<byte[]> ExportToCsvAsync();
}

// Clients implement only what they need
public class OrderRepository : IOrderRepository
{
    public async Task<Order> CreateAsync(Order order)
    {
        // Implementation
    }

    public async Task<Order> GetByIdAsync(int id)
    {
        // Implementation
    }

    public async Task UpdateAsync(Order order)
    {
        // Implementation
    }

    public async Task DeleteAsync(int id)
    {
        // Implementation
    }
}

public class PaymentProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessPaymentAsync(Order order)
    {
        // Implementation
    }

    public async Task<RefundResult> RefundAsync(int orderId)
    {
        // Implementation
    }
}

// Services depend only on interfaces they need
public class OrderCreationService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IPaymentProcessor _paymentProcessor;

    public OrderCreationService(
        IOrderRepository orderRepository,
        IPaymentProcessor paymentProcessor)
    {
        _orderRepository = orderRepository;
        _paymentProcessor = paymentProcessor;
    }

    public async Task<Result<Order>> CreateOrderAsync(Order order)
    {
        var createdOrder = await _orderRepository.CreateAsync(order);
        var paymentResult = await _paymentProcessor.ProcessPaymentAsync(createdOrder);

        if (!paymentResult.Success)
            return Result<Order>.Failure("Payment failed");

        return Result<Order>.Success(createdOrder);
    }
}
```

**Benefits**:
- ✅ Clients depend only on methods they use
- ✅ No NotImplementedException
- ✅ Easier to mock in tests
- ✅ Lower coupling
- ✅ More flexible and maintainable

### ISP Refactoring Strategy

1. **Identify Large Interfaces**: Find interfaces with many methods
2. **Group by Responsibility**: Organize methods by cohesion
3. **Split Interfaces**: Create focused interfaces for each responsibility
4. **Update Clients**: Have clients depend on specific interfaces
5. **Use Interface Composition**: Combine interfaces when needed

---

## Dependency Inversion Principle (DIP)

> **"Depend on abstractions, not on concretions."**

### Definition

High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.

### How to Identify Violations

**Red Flags**:
- Direct instantiation of concrete classes (new SomeClass())
- Tight coupling to implementation details
- Hard to unit test (can't mock dependencies)
- High-level logic mixed with low-level details

### Violation Example

**Before** (Violates DIP):
```csharp
public class OrderService
{
    // Directly instantiates concrete classes
    private readonly SqlServerOrderRepository _orderRepository;
    private readonly SmtpEmailService _emailService;
    private readonly FileLogger _logger;

    public OrderService()
    {
        // Direct instantiation - tight coupling!
        _orderRepository = new SqlServerOrderRepository("connection-string");
        _emailService = new SmtpEmailService("smtp.gmail.com", 587);
        _logger = new FileLogger("C:\\logs\\orders.log");
    }

    public async Task<Order> CreateOrderAsync(Order order)
    {
        // High-level logic coupled to low-level details
        _logger.Log($"Creating order for customer {order.CustomerId}");

        var createdOrder = await _orderRepository.SaveAsync(order);

        var emailBody = $"Order {createdOrder.Id} confirmed";
        await _emailService.SendAsync(order.CustomerEmail, "Order Confirmation", emailBody);

        return createdOrder;
    }
}

// Concrete implementations (low-level modules)
public class SqlServerOrderRepository
{
    private readonly string _connectionString;

    public SqlServerOrderRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<Order> SaveAsync(Order order)
    {
        // SQL Server specific implementation
        using var connection = new SqlConnection(_connectionString);
        // ...
    }
}

public class SmtpEmailService
{
    private readonly string _host;
    private readonly int _port;

    public SmtpEmailService(string host, int port)
    {
        _host = host;
        _port = port;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        // SMTP specific implementation
        using var client = new SmtpClient(_host, _port);
        // ...
    }
}
```

**Problems**:
- OrderService tightly coupled to concrete implementations
- Can't switch to PostgreSQL without modifying OrderService
- Can't switch to SendGrid without modifying OrderService
- Hard to unit test (can't mock dependencies)
- Can't reuse OrderService with different implementations

### Refactored Example

**After** (Follows DIP):
```csharp
// Abstractions (interfaces) - high-level contracts
public interface IOrderRepository
{
    Task<Order> SaveAsync(Order order);
    Task<Order> GetByIdAsync(int id);
}

public interface IEmailService
{
    Task SendAsync(string to, string subject, string body);
}

public interface ILogger
{
    void Log(string message);
}

// High-level module depends on abstractions
public class OrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger _logger;

    // Dependency injection - loose coupling!
    public OrderService(
        IOrderRepository orderRepository,
        IEmailService emailService,
        ILogger logger)
    {
        _orderRepository = orderRepository;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Order> CreateOrderAsync(Order order)
    {
        _logger.Log($"Creating order for customer {order.CustomerId}");

        var createdOrder = await _orderRepository.SaveAsync(order);

        var emailBody = $"Order {createdOrder.Id} confirmed";
        await _emailService.SendAsync(order.CustomerEmail, "Order Confirmation", emailBody);

        return createdOrder;
    }
}

// Concrete implementations (low-level modules) depend on abstractions
public class SqlServerOrderRepository : IOrderRepository
{
    private readonly string _connectionString;

    public SqlServerOrderRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<Order> SaveAsync(Order order)
    {
        // SQL Server specific implementation
        using var connection = new SqlConnection(_connectionString);
        // ...
    }

    public async Task<Order> GetByIdAsync(int id)
    {
        // Implementation
    }
}

// Can easily add PostgreSQL without touching OrderService
public class PostgreSqlOrderRepository : IOrderRepository
{
    private readonly string _connectionString;

    public PostgreSqlOrderRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<Order> SaveAsync(Order order)
    {
        // PostgreSQL specific implementation
        using var connection = new NpgsqlConnection(_connectionString);
        // ...
    }

    public async Task<Order> GetByIdAsync(int id)
    {
        // Implementation
    }
}

public class SmtpEmailService : IEmailService
{
    private readonly string _host;
    private readonly int _port;

    public SmtpEmailService(string host, int port)
    {
        _host = host;
        _port = port;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        using var client = new SmtpClient(_host, _port);
        // ...
    }
}

// Can easily add SendGrid without touching OrderService
public class SendGridEmailService : IEmailService
{
    private readonly string _apiKey;

    public SendGridEmailService(string apiKey)
    {
        _apiKey = apiKey;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        // SendGrid implementation
        var client = new SendGridClient(_apiKey);
        // ...
    }
}

// Register dependencies in DI container (Program.cs)
builder.Services.AddScoped<IOrderRepository, SqlServerOrderRepository>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddSingleton<ILogger, FileLogger>();
builder.Services.AddScoped<OrderService>();
```

**Benefits**:
- ✅ Loose coupling (easy to change implementations)
- ✅ Easier to test (can mock dependencies)
- ✅ Flexible (can swap implementations without code changes)
- ✅ Follows Open/Closed Principle
- ✅ Better separation of concerns

### DIP Refactoring Strategy

1. **Identify Concrete Dependencies**: Find direct instantiation
2. **Create Abstractions**: Define interfaces for dependencies
3. **Inject Dependencies**: Use constructor injection
4. **Register in DI Container**: Configure dependencies in Program.cs
5. **Implement Concrete Classes**: Create implementations of interfaces

---

## SOLID in Practice

### Applying SOLID Together

SOLID principles work together to create maintainable, flexible code:

**Example: E-commerce Order Processing**

```csharp
// SRP: Each class has single responsibility
// ISP: Small, focused interfaces
// DIP: Depend on abstractions

public interface IOrderValidator
{
    ValidationResult Validate(Order order);
}

public interface IInventoryChecker
{
    Task<bool> IsAvailableAsync(int productId, int quantity);
}

public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(decimal amount, PaymentInfo paymentInfo);
}

public interface IOrderRepository
{
    Task<Order> SaveAsync(Order order);
}

public interface INotificationService
{
    Task NotifyOrderCreatedAsync(Order order);
}

// OCP: Can extend by adding new validators, processors, etc.
public class OrderValidator : IOrderValidator
{
    public ValidationResult Validate(Order order)
    {
        // Validation logic
    }
}

public class InventoryChecker : IInventoryChecker
{
    private readonly IProductRepository _productRepo;

    public InventoryChecker(IProductRepository productRepo)
    {
        _productRepo = productRepo;
    }

    public async Task<bool> IsAvailableAsync(int productId, int quantity)
    {
        var product = await _productRepo.GetByIdAsync(productId);
        return product.Stock >= quantity;
    }
}

// LSP: All payment processors can be substituted
public class CreditCardPaymentProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessAsync(decimal amount, PaymentInfo paymentInfo)
    {
        // Credit card processing
    }
}

public class PayPalPaymentProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessAsync(decimal amount, PaymentInfo paymentInfo)
    {
        // PayPal processing
    }
}

// Orchestrator follows SRP and DIP
public class OrderService
{
    private readonly IOrderValidator _validator;
    private readonly IInventoryChecker _inventoryChecker;
    private readonly IPaymentProcessor _paymentProcessor;
    private readonly IOrderRepository _orderRepository;
    private readonly INotificationService _notificationService;

    public OrderService(
        IOrderValidator validator,
        IInventoryChecker inventoryChecker,
        IPaymentProcessor paymentProcessor,
        IOrderRepository orderRepository,
        INotificationService notificationService)
    {
        _validator = validator;
        _inventoryChecker = inventoryChecker;
        _paymentProcessor = paymentProcessor;
        _orderRepository = orderRepository;
        _notificationService = notificationService;
    }

    public async Task<Result<Order>> CreateOrderAsync(Order order)
    {
        // Validation
        var validationResult = _validator.Validate(order);
        if (!validationResult.IsValid)
            return Result<Order>.Failure(validationResult.Errors);

        // Check inventory
        foreach (var item in order.Items)
        {
            if (!await _inventoryChecker.IsAvailableAsync(item.ProductId, item.Quantity))
                return Result<Order>.Failure($"Insufficient stock for product {item.ProductId}");
        }

        // Process payment
        var paymentResult = await _paymentProcessor.ProcessAsync(order.Total, order.PaymentInfo);
        if (!paymentResult.Success)
            return Result<Order>.Failure("Payment failed");

        // Save order
        var savedOrder = await _orderRepository.SaveAsync(order);

        // Notify
        await _notificationService.NotifyOrderCreatedAsync(savedOrder);

        return Result<Order>.Success(savedOrder);
    }
}
```

### SOLID Checklist

When writing or reviewing code, ask:

**SRP**:
- [ ] Does this class have only one reason to change?
- [ ] Can I describe the class responsibility in one sentence?
- [ ] Are there too many dependencies?

**OCP**:
- [ ] Can I add new behavior without modifying existing code?
- [ ] Are there switch/case statements on type?
- [ ] Am I using abstractions effectively?

**LSP**:
- [ ] Can derived classes substitute for base classes?
- [ ] Are contracts honored by derived classes?
- [ ] Are there unexpected behavior changes?

**ISP**:
- [ ] Are interfaces small and focused?
- [ ] Do clients implement all interface methods?
- [ ] Are there NotImplementedException in implementations?

**DIP**:
- [ ] Do I depend on abstractions, not concretions?
- [ ] Am I using dependency injection?
- [ ] Can I easily swap implementations?

---

## Conclusion

SOLID principles are fundamental to creating maintainable, flexible, and testable C# applications. While they may seem complex initially, applying them consistently leads to:

- **Better Code Quality**: Easier to understand and maintain
- **Lower Coupling**: Changes in one area don't break others
- **Higher Cohesion**: Related functionality grouped together
- **Easier Testing**: Dependencies can be mocked
- **Greater Flexibility**: Easy to extend and modify

Use this guide as a reference when refactoring C# code to follow SOLID principles. Remember: SOLID is a means to an end (better code), not an end in itself. Apply pragmatically based on your project's needs.
