# Design Patterns for C# 13 and .NET 9

Comprehensive guide to design patterns commonly used in C# enterprise applications, with modern C# 13 implementations.

## Table of Contents

### Creational Patterns
1. [Factory Method](#factory-method-pattern)
2. [Abstract Factory](#abstract-factory-pattern)
3. [Builder](#builder-pattern)
4. [Singleton](#singleton-pattern)

### Structural Patterns
5. [Adapter](#adapter-pattern)
6. [Decorator](#decorator-pattern)
7. [Facade](#facade-pattern)
8. [Repository](#repository-pattern)

### Behavioral Patterns
9. [Strategy](#strategy-pattern)
10. [Observer](#observer-pattern)
11. [Command](#command-pattern)
12. [Template Method](#template-method-pattern)
13. [Chain of Responsibility](#chain-of-responsibility-pattern)

### Modern .NET Patterns
14. [Options Pattern](#options-pattern)
15. [Result Pattern](#result-pattern)

---

## Factory Method Pattern

### Intent
Define an interface for creating an object, but let subclasses decide which class to instantiate.

### When to Use
- Class can't anticipate the type of objects it needs to create
- Class wants its subclasses to specify the objects it creates
- Need to delegate instantiation logic

### C# 13 Implementation

```csharp
// Product interface
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(decimal amount, PaymentInfo paymentInfo);
}

// Concrete products
public class CreditCardProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessAsync(decimal amount, PaymentInfo paymentInfo)
    {
        // Credit card processing logic
        await Task.Delay(100); // Simulate API call
        return new PaymentResult { Success = true, TransactionId = Guid.NewGuid().ToString() };
    }
}

public class PayPalProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessAsync(decimal amount, PaymentInfo paymentInfo)
    {
        // PayPal processing logic
        await Task.Delay(100);
        return new PaymentResult { Success = true, TransactionId = Guid.NewGuid().ToString() };
    }
}

public class BitcoinProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessAsync(decimal amount, PaymentInfo paymentInfo)
    {
        // Bitcoin processing logic
        await Task.Delay(100);
        return new PaymentResult { Success = true, TransactionId = Guid.NewGuid().ToString() };
    }
}

// Factory interface
public interface IPaymentProcessorFactory
{
    IPaymentProcessor CreateProcessor(PaymentMethod method);
}

// Concrete factory
public class PaymentProcessorFactory : IPaymentProcessorFactory
{
    private readonly IServiceProvider _serviceProvider;

    public PaymentProcessorFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public IPaymentProcessor CreateProcessor(PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.CreditCard => _serviceProvider.GetRequiredService<CreditCardProcessor>(),
            PaymentMethod.PayPal => _serviceProvider.GetRequiredService<PayPalProcessor>(),
            PaymentMethod.Bitcoin => _serviceProvider.GetRequiredService<BitcoinProcessor>(),
            _ => throw new ArgumentException($"Unsupported payment method: {method}")
        };
    }
}

// Usage
public class OrderService
{
    private readonly IPaymentProcessorFactory _processorFactory;

    public OrderService(IPaymentProcessorFactory processorFactory)
    {
        _processorFactory = processorFactory;
    }

    public async Task<Result<Order>> ProcessOrderAsync(Order order)
    {
        var processor = _processorFactory.CreateProcessor(order.PaymentMethod);
        var result = await processor.ProcessAsync(order.Total, order.PaymentInfo);

        if (!result.Success)
            return Result<Order>.Failure("Payment failed");

        return Result<Order>.Success(order);
    }
}

// DI Registration (Program.cs)
builder.Services.AddScoped<CreditCardProcessor>();
builder.Services.AddScoped<PayPalProcessor>();
builder.Services.AddScoped<BitcoinProcessor>();
builder.Services.AddScoped<IPaymentProcessorFactory, PaymentProcessorFactory>();
```

### Benefits
- ✅ Eliminates tight coupling
- ✅ Follows Open/Closed Principle
- ✅ Easy to add new product types
- ✅ Centralizes object creation logic

---

## Abstract Factory Pattern

### Intent
Provide an interface for creating families of related objects without specifying their concrete classes.

### When to Use
- System needs to be independent of how its objects are created
- System needs to work with multiple families of related objects
- Family of related objects designed to be used together

### C# 13 Implementation

```csharp
// Abstract products
public interface IButton
{
    void Render();
}

public interface ITextBox
{
    void Render();
}

// Concrete products - Windows family
public class WindowsButton : IButton
{
    public void Render() => Console.WriteLine("Rendering Windows button");
}

public class WindowsTextBox : ITextBox
{
    public void Render() => Console.WriteLine("Rendering Windows textbox");
}

// Concrete products - Mac family
public class MacButton : IButton
{
    public void Render() => Console.WriteLine("Rendering Mac button");
}

public class MacTextBox : ITextBox
{
    public void Render() => Console.WriteLine("Rendering Mac textbox");
}

// Abstract factory
public interface IUIFactory
{
    IButton CreateButton();
    ITextBox CreateTextBox();
}

// Concrete factories
public class WindowsUIFactory : IUIFactory
{
    public IButton CreateButton() => new WindowsButton();
    public ITextBox CreateTextBox() => new WindowsTextBox();
}

public class MacUIFactory : IUIFactory
{
    public IButton CreateButton() => new MacButton();
    public ITextBox CreateTextBox() => new MacTextBox();
}

// Client code
public class Application
{
    private readonly IUIFactory _uiFactory;

    public Application(IUIFactory uiFactory)
    {
        _uiFactory = uiFactory;
    }

    public void CreateUI()
    {
        var button = _uiFactory.CreateButton();
        var textBox = _uiFactory.CreateTextBox();

        button.Render();
        textBox.Render();
    }
}

// DI Registration
builder.Services.AddScoped<IUIFactory>(sp =>
{
    var os = Environment.OSVersion.Platform;
    return os == PlatformID.Win32NT
        ? new WindowsUIFactory()
        : new MacUIFactory();
});
```

### Benefits
- ✅ Ensures related objects used together
- ✅ Isolates concrete classes
- ✅ Easy to exchange product families
- ✅ Promotes consistency among products

---

## Builder Pattern

### Intent
Separate the construction of a complex object from its representation, allowing the same construction process to create different representations.

### When to Use
- Object has many optional parameters
- Object construction involves multiple steps
- Want to create different representations of an object

### C# 13 Implementation

```csharp
// Product
public class EmailMessage
{
    public string To { get; init; }
    public string From { get; init; }
    public string Subject { get; init; }
    public string Body { get; init; }
    public List<string> Cc { get; init; } = [];
    public List<string> Bcc { get; init; } = [];
    public List<Attachment> Attachments { get; init; } = [];
    public bool IsHtml { get; init; }
    public EmailPriority Priority { get; init; }
}

// Builder with fluent interface
public class EmailMessageBuilder
{
    private string _to = string.Empty;
    private string _from = string.Empty;
    private string _subject = string.Empty;
    private string _body = string.Empty;
    private readonly List<string> _cc = [];
    private readonly List<string> _bcc = [];
    private readonly List<Attachment> _attachments = [];
    private bool _isHtml;
    private EmailPriority _priority = EmailPriority.Normal;

    public EmailMessageBuilder To(string to)
    {
        _to = to;
        return this;
    }

    public EmailMessageBuilder From(string from)
    {
        _from = from;
        return this;
    }

    public EmailMessageBuilder Subject(string subject)
    {
        _subject = subject;
        return this;
    }

    public EmailMessageBuilder Body(string body)
    {
        _body = body;
        return this;
    }

    public EmailMessageBuilder AddCc(string cc)
    {
        _cc.Add(cc);
        return this;
    }

    public EmailMessageBuilder AddBcc(string bcc)
    {
        _bcc.Add(bcc);
        return this;
    }

    public EmailMessageBuilder AddAttachment(Attachment attachment)
    {
        _attachments.Add(attachment);
        return this;
    }

    public EmailMessageBuilder AsHtml()
    {
        _isHtml = true;
        return this;
    }

    public EmailMessageBuilder WithPriority(EmailPriority priority)
    {
        _priority = priority;
        return this;
    }

    public EmailMessage Build()
    {
        if (string.IsNullOrEmpty(_to))
            throw new InvalidOperationException("Recipient is required");
        if (string.IsNullOrEmpty(_from))
            throw new InvalidOperationException("Sender is required");

        return new EmailMessage
        {
            To = _to,
            From = _from,
            Subject = _subject,
            Body = _body,
            Cc = _cc,
            Bcc = _bcc,
            Attachments = _attachments,
            IsHtml = _isHtml,
            Priority = _priority
        };
    }
}

// Usage
var email = new EmailMessageBuilder()
    .To("customer@example.com")
    .From("noreply@company.com")
    .Subject("Order Confirmation")
    .Body("<h1>Thank you for your order!</h1>")
    .AddCc("sales@company.com")
    .AddAttachment(receiptPdf)
    .AsHtml()
    .WithPriority(EmailPriority.High)
    .Build();
```

### Benefits
- ✅ Control over construction process
- ✅ Fluent, readable API
- ✅ Can construct different representations
- ✅ Isolates complex construction code

---

## Singleton Pattern

### Intent
Ensure a class has only one instance and provide a global point of access to it.

### When to Use
- Exactly one instance needed
- Instance must be accessible from multiple points
- Instance should be extended by subclassing

### C# 13 Implementation (Thread-Safe)

```csharp
// Lazy<T> implementation (recommended)
public sealed class ConfigurationManager
{
    private static readonly Lazy<ConfigurationManager> _instance =
        new(() => new ConfigurationManager());

    private readonly Dictionary<string, string> _settings = new();

    private ConfigurationManager()
    {
        // Load configuration
        _settings["ApiKey"] = "your-api-key";
        _settings["ApiUrl"] = "https://api.example.com";
    }

    public static ConfigurationManager Instance => _instance.Value;

    public string GetSetting(string key)
        => _settings.TryGetValue(key, out var value) ? value : string.Empty;
}

// Usage
var apiKey = ConfigurationManager.Instance.GetSetting("ApiKey");

// Modern approach with DI (preferred in .NET apps)
public interface IConfigurationService
{
    string GetSetting(string key);
}

public class ConfigurationService : IConfigurationService
{
    private readonly IConfiguration _configuration;

    public ConfigurationService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GetSetting(string key)
        => _configuration[key] ?? string.Empty;
}

// Register as singleton in DI
builder.Services.AddSingleton<IConfigurationService, ConfigurationService>();
```

### Benefits
- ✅ Controlled access to sole instance
- ✅ Reduced namespace pollution
- ✅ Can be subclassed
- ⚠️ **Caution**: Makes testing harder, prefer DI

---

## Strategy Pattern

### Intent
Define a family of algorithms, encapsulate each one, and make them interchangeable.

### When to Use
- Many related classes differ only in behavior
- Need different variants of an algorithm
- Algorithm uses data that clients shouldn't know about
- Class has multiple conditional statements for different behaviors

### C# 13 Implementation

```csharp
// Strategy interface
public interface IDiscountStrategy
{
    decimal CalculateDiscount(Order order);
}

// Concrete strategies
public class NoDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order) => 0;
}

public class PercentageDiscount : IDiscountStrategy
{
    private readonly decimal _percentage;

    public PercentageDiscount(decimal percentage)
    {
        _percentage = percentage;
    }

    public decimal CalculateDiscount(Order order)
        => order.Total * _percentage;
}

public class BulkOrderDiscount : IDiscountStrategy
{
    public decimal CalculateDiscount(Order order)
    {
        return order.Items.Count switch
        {
            >= 10 => order.Total * 0.20m,
            >= 5 => order.Total * 0.10m,
            _ => 0
        };
    }
}

public class LoyaltyDiscount : IDiscountStrategy
{
    private readonly ICustomerRepository _customerRepo;

    public LoyaltyDiscount(ICustomerRepository customerRepo)
    {
        _customerRepo = customerRepo;
    }

    public decimal CalculateDiscount(Order order)
    {
        var customer = _customerRepo.GetByIdAsync(order.CustomerId).Result;
        return customer.YearsAsMember switch
        {
            >= 5 => order.Total * 0.15m,
            >= 2 => order.Total * 0.10m,
            >= 1 => order.Total * 0.05m,
            _ => 0
        };
    }
}

// Context
public class PricingService
{
    private readonly IDiscountStrategy _discountStrategy;

    public PricingService(IDiscountStrategy discountStrategy)
    {
        _discountStrategy = discountStrategy;
    }

    public decimal CalculateTotal(Order order)
    {
        var discount = _discountStrategy.CalculateDiscount(order);
        return order.Total - discount;
    }
}

// Factory to select strategy
public class DiscountStrategyFactory
{
    private readonly IServiceProvider _serviceProvider;

    public DiscountStrategyFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public IDiscountStrategy GetStrategy(CustomerType customerType)
    {
        return customerType switch
        {
            CustomerType.Regular => new NoDiscount(),
            CustomerType.Premium => new PercentageDiscount(0.10m),
            CustomerType.VIP => new PercentageDiscount(0.20m),
            CustomerType.Bulk => _serviceProvider.GetRequiredService<BulkOrderDiscount>(),
            _ => new NoDiscount()
        };
    }
}
```

### Benefits
- ✅ Eliminates conditional statements
- ✅ Easy to add new algorithms
- ✅ Follows Open/Closed Principle
- ✅ Each strategy is independently testable

---

## Repository Pattern

### Intent
Mediate between the domain and data mapping layers, acting like an in-memory collection of domain objects.

### When to Use
- Want to separate data access logic from business logic
- Need to centralize data access logic
- Want to make testing easier by mocking repository

### C# 13 Implementation

```csharp
// Generic repository interface
public interface IRepository<TEntity, TId> where TEntity : class
{
    Task<TEntity?> GetByIdAsync(TId id, CancellationToken ct = default);
    Task<IEnumerable<TEntity>> GetAllAsync(CancellationToken ct = default);
    Task<TEntity> AddAsync(TEntity entity, CancellationToken ct = default);
    Task UpdateAsync(TEntity entity, CancellationToken ct = default);
    Task DeleteAsync(TId id, CancellationToken ct = default);
}

// Specific repository interface with domain queries
public interface IOrderRepository : IRepository<Order, int>
{
    Task<IEnumerable<Order>> GetByCustomerIdAsync(int customerId, CancellationToken ct = default);
    Task<IEnumerable<Order>> GetPendingOrdersAsync(CancellationToken ct = default);
    Task<IEnumerable<Order>> GetOrdersByDateRangeAsync(DateTime start, DateTime end, CancellationToken ct = default);
}

// Entity Framework implementation
public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public OrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Order?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task<IEnumerable<Order>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Orders
            .Include(o => o.Items)
            .ToListAsync(ct);
    }

    public async Task<Order> AddAsync(Order entity, CancellationToken ct = default)
    {
        _context.Orders.Add(entity);
        await _context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Order entity, CancellationToken ct = default)
    {
        _context.Orders.Update(entity);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var order = await GetByIdAsync(id, ct);
        if (order != null)
        {
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task<IEnumerable<Order>> GetByCustomerIdAsync(int customerId, CancellationToken ct = default)
    {
        return await _context.Orders
            .Where(o => o.CustomerId == customerId)
            .Include(o => o.Items)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Order>> GetPendingOrdersAsync(CancellationToken ct = default)
    {
        return await _context.Orders
            .Where(o => o.Status == OrderStatus.Pending)
            .Include(o => o.Items)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Order>> GetOrdersByDateRangeAsync(
        DateTime start,
        DateTime end,
        CancellationToken ct = default)
    {
        return await _context.Orders
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
            .Include(o => o.Items)
            .ToListAsync(ct);
    }
}

// DI Registration
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
```

### Benefits
- ✅ Centralizes data access logic
- ✅ Easy to test (mock repository)
- ✅ Reduces duplication
- ✅ Separates concerns

---

## Decorator Pattern

### Intent
Attach additional responsibilities to an object dynamically. Provides flexible alternative to subclassing for extending functionality.

### When to Use
- Add responsibilities to individual objects dynamically and transparently
- Withdraw responsibilities
- Extension by subclassing is impractical

### C# 13 Implementation

```csharp
// Component interface
public interface INotificationService
{
    Task SendAsync(string message, string recipient);
}

// Concrete component
public class EmailNotificationService : INotificationService
{
    private readonly IEmailService _emailService;

    public EmailNotificationService(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public async Task SendAsync(string message, string recipient)
    {
        await _emailService.SendAsync(recipient, "Notification", message);
    }
}

// Base decorator
public abstract class NotificationDecorator : INotificationService
{
    protected readonly INotificationService _inner;

    protected NotificationDecorator(INotificationService inner)
    {
        _inner = inner;
    }

    public virtual Task SendAsync(string message, string recipient)
        => _inner.SendAsync(message, recipient);
}

// Concrete decorators
public class LoggingNotificationDecorator : NotificationDecorator
{
    private readonly ILogger _logger;

    public LoggingNotificationDecorator(INotificationService inner, ILogger logger)
        : base(inner)
    {
        _logger = logger;
    }

    public override async Task SendAsync(string message, string recipient)
    {
        _logger.LogInformation("Sending notification to {Recipient}", recipient);
        await base.SendAsync(message, recipient);
        _logger.LogInformation("Notification sent to {Recipient}", recipient);
    }
}

public class RetryNotificationDecorator : NotificationDecorator
{
    private readonly int _maxRetries;

    public RetryNotificationDecorator(INotificationService inner, int maxRetries = 3)
        : base(inner)
    {
        _maxRetries = maxRetries;
    }

    public override async Task SendAsync(string message, string recipient)
    {
        for (int i = 0; i < _maxRetries; i++)
        {
            try
            {
                await base.SendAsync(message, recipient);
                return;
            }
            catch (Exception) when (i < _maxRetries - 1)
            {
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, i)));
            }
        }
    }
}

public class RateLimitingNotificationDecorator : NotificationDecorator
{
    private static readonly Lock _lock = new(); // C# 13 Lock
    private static DateTime _lastSendTime = DateTime.MinValue;
    private readonly TimeSpan _minInterval;

    public RateLimitingNotificationDecorator(INotificationService inner, TimeSpan minInterval)
        : base(inner)
    {
        _minInterval = minInterval;
    }

    public override async Task SendAsync(string message, string recipient)
    {
        lock (_lock)
        {
            var elapsed = DateTime.UtcNow - _lastSendTime;
            if (elapsed < _minInterval)
            {
                var delay = _minInterval - elapsed;
                Task.Delay(delay).Wait();
            }
            _lastSendTime = DateTime.UtcNow;
        }

        await base.SendAsync(message, recipient);
    }
}

// Usage - compose decorators
var emailService = new EmailNotificationService(_emailService);
var withLogging = new LoggingNotificationDecorator(emailService, _logger);
var withRetry = new RetryNotificationDecorator(withLogging, maxRetries: 3);
var withRateLimit = new RateLimitingNotificationDecorator(withRetry, TimeSpan.FromSeconds(1));

await withRateLimit.SendAsync("Hello!", "user@example.com");
```

### Benefits
- ✅ More flexible than static inheritance
- ✅ Avoids feature-laden classes high in hierarchy
- ✅ Can mix and match decorators
- ✅ Follows Open/Closed Principle

---

## Options Pattern (.NET)

### Intent
Provide strongly-typed access to groups of related settings using configuration binding.

### When to Use
- Application needs configuration settings
- Want strongly-typed configuration
- Need to validate configuration
- Configuration comes from multiple sources

### C# 13 Implementation

```csharp
// Options class
public class EmailSettings
{
    public const string SectionName = "Email";

    public string SmtpServer { get; set; } = string.Empty;
    public int Port { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool UseSsl { get; set; }
}

// Validation (optional)
public class EmailSettingsValidator : IValidateOptions<EmailSettings>
{
    public ValidateOptionsResult Validate(string? name, EmailSettings options)
    {
        if (string.IsNullOrEmpty(options.SmtpServer))
            return ValidateOptionsResult.Fail("SMTP server is required");

        if (options.Port <= 0)
            return ValidateOptionsResult.Fail("Port must be positive");

        return ValidateOptionsResult.Success;
    }
}

// appsettings.json
/*
{
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "Port": 587,
    "Username": "user@example.com",
    "Password": "password",
    "UseSsl": true
  }
}
*/

// Registration (Program.cs)
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection(EmailSettings.SectionName));

builder.Services.AddSingleton<IValidateOptions<EmailSettings>, EmailSettingsValidator>();

// Usage with IOptions<T>
public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        using var client = new SmtpClient(_settings.SmtpServer, _settings.Port);
        client.EnableSsl = _settings.UseSsl;
        // ... send email
    }
}

// Usage with IOptionsSnapshot<T> (reloads on change)
public class EmailService
{
    private readonly IOptionsSnapshot<EmailSettings> _options;

    public EmailService(IOptionsSnapshot<EmailSettings> options)
    {
        _options = options;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        var settings = _options.Value; // Gets current value
        using var client = new SmtpClient(settings.SmtpServer, settings.Port);
        // ... send email
    }
}
```

### Benefits
- ✅ Strongly-typed configuration
- ✅ Validation support
- ✅ Reloading support
- ✅ Multiple configuration sources

---

## Result Pattern

### Intent
Represent the outcome of an operation that may fail, including success/failure status and error information, without throwing exceptions.

### When to Use
- Operation can fail for expected reasons
- Want to avoid exceptions for control flow
- Need to return both result and error information
- Want to make error handling explicit

### C# 13 Implementation

```csharp
// Result record
public record Result<T>
{
    public bool IsSuccess { get; init; }
    public T? Value { get; init; }
    public string Error { get; init; } = string.Empty;
    public List<string> Errors { get; init; } = [];

    public static Result<T> Success(T value)
        => new() { IsSuccess = true, Value = value };

    public static Result<T> Failure(string error)
        => new() { IsSuccess = false, Error = error, Errors = [error] };

    public static Result<T> Failure(List<string> errors)
        => new() { IsSuccess = false, Errors = errors, Error = string.Join(", ", errors) };

    // Helper methods
    public TResult Match<TResult>(
        Func<T, TResult> onSuccess,
        Func<string, TResult> onFailure)
    {
        return IsSuccess && Value != null
            ? onSuccess(Value)
            : onFailure(Error);
    }

    public async Task<TResult> MatchAsync<TResult>(
        Func<T, Task<TResult>> onSuccess,
        Func<string, Task<TResult>> onFailure)
    {
        return IsSuccess && Value != null
            ? await onSuccess(Value)
            : await onFailure(Error);
    }
}

// Usage in service
public class OrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderValidator _validator;

    public OrderService(IOrderRepository orderRepository, IOrderValidator validator)
    {
        _orderRepository = orderRepository;
        _validator = validator;
    }

    public async Task<Result<Order>> CreateOrderAsync(Order order)
    {
        // Validation
        var validationResult = _validator.Validate(order);
        if (!validationResult.IsValid)
            return Result<Order>.Failure(validationResult.Errors);

        // Business logic
        try
        {
            var createdOrder = await _orderRepository.AddAsync(order);
            return Result<Order>.Success(createdOrder);
        }
        catch (Exception ex)
        {
            return Result<Order>.Failure($"Failed to create order: {ex.Message}");
        }
    }
}

// API Controller usage
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly OrderService _orderService;

    public OrdersController(OrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder(CreateOrderRequest request)
    {
        var order = request.ToOrder();
        var result = await _orderService.CreateOrderAsync(order);

        return result.Match(
            onSuccess: order => Ok(new { orderId = order.Id }),
            onFailure: error => BadRequest(new { error })
        );
    }
}
```

### Benefits
- ✅ Explicit error handling
- ✅ No exception overhead for expected failures
- ✅ Type-safe
- ✅ Composable operations

---

## Pattern Selection Guide

| Scenario | Recommended Pattern |
|----------|---------------------|
| Object creation varies | Factory Method |
| Create families of related objects | Abstract Factory |
| Complex object construction | Builder |
| Single global instance | Singleton (or DI) |
| Vary algorithm at runtime | Strategy |
| Notify multiple objects of changes | Observer |
| Encapsulate requests | Command |
| Add behavior without modifying class | Decorator |
| Simplify complex subsystem | Facade |
| Data access abstraction | Repository |
| Configuration settings | Options Pattern |
| Error handling without exceptions | Result Pattern |

---

## Conclusion

Design patterns provide proven solutions to common problems. When refactoring C# code:

1. **Identify the problem** the code is trying to solve
2. **Select appropriate pattern** from this guide
3. **Implement incrementally** with tests
4. **Review and refine** based on actual usage

Remember: Patterns are tools, not goals. Use them when they simplify code, not to make code more "pattern-ful."
