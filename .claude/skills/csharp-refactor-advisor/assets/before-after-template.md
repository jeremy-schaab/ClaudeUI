# Code Refactoring: Before & After Comparison

**File**: [path/to/file.cs]
**Date**: [YYYY-MM-DD]
**Refactoring Type**: [SRP / OCP / Complexity Reduction / Design Pattern / etc.]

---

## Summary

**Issue**: [One sentence describing the problem]

**Solution**: [One sentence describing the refactoring applied]

**Impact**: [Brief impact statement]

---

## Metrics Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines of Code | [number] | [number] | [+/-X%] |
| Cyclomatic Complexity | [number] | [number] | [⬇️ X%] |
| Number of Methods | [number] | [number] | [+/-X] |
| Number of Classes | [number] | [number] | [+X] |
| Test Coverage | [%] | [%] | [⬆️ X%] |
| Dependencies | [number] | [number] | [⬇️ X] |
| Code Duplication | [%] | [%] | [⬇️ X%] |

---

## Code Changes

### Before (Original Code)

**Issues**:
- ❌ [Issue 1]
- ❌ [Issue 2]
- ❌ [Issue 3]

**Metrics**:
- Cyclomatic Complexity: [number]
- Lines of Code: [number]
- Dependencies: [number]

```csharp
// Original implementation
public class OrderService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IEmailService _emailService;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger _logger;

    // 847 lines of code...

    public async Task<OrderResult> ProcessOrderAsync(Order order)
    {
        // Validation (20 lines)
        if (order == null) throw new ArgumentNullException(nameof(order));
        if (order.Items == null || !order.Items.Any())
            throw new ArgumentException("No items");
        // ... more validation ...

        // Calculate total (30 lines)
        decimal total = 0;
        foreach (var item in order.Items)
        {
            var product = await _productRepo.GetByIdAsync(item.ProductId);
            if (product == null) throw new InvalidOperationException("Product not found");
            if (product.Stock < item.Quantity)
                throw new InvalidOperationException("Insufficient stock");
            total += product.Price * item.Quantity;
        }

        // Apply discounts (25 lines)
        if (order.Customer.IsPremium)
        {
            if (total > 100)
                total -= total * 0.20m;
            else
                total -= total * 0.10m;
        }

        // Process payment (20 lines)
        var paymentResult = await _paymentGateway.ProcessAsync(total, order.PaymentInfo);
        if (!paymentResult.Success)
            throw new PaymentException("Payment failed");

        // Update inventory (15 lines)
        foreach (var item in order.Items)
        {
            await _inventoryService.DecrementStockAsync(item.ProductId, item.Quantity);
        }

        // Send notification (10 lines)
        var emailBody = $"Order {order.Id} confirmed. Total: {total:C}";
        await _emailService.SendAsync(order.CustomerEmail, "Order Confirmation", emailBody);

        // Save order (5 lines)
        order.Total = total;
        order.Status = OrderStatus.Confirmed;
        await _orderRepo.SaveAsync(order);

        _logger.LogInformation("Order {OrderId} processed successfully", order.Id);

        return new OrderResult { Success = true, OrderId = order.Id };
    }
}
```

---

### After (Refactored Code)

**Improvements**:
- ✅ [Improvement 1]
- ✅ [Improvement 2]
- ✅ [Improvement 3]

**Metrics**:
- Cyclomatic Complexity: [number] (reduced by [X%])
- Lines of Code: [number] per class (distributed)
- Dependencies: [number] per class (reduced coupling)

```csharp
// 1. OrderValidator - Single Responsibility: Validation
public class OrderValidator
{
    public ValidationResult Validate(Order order)
    {
        var errors = new List<string>();

        if (order == null)
            errors.Add("Order is null");
        else
        {
            if (order.Items == null || !order.Items.Any())
                errors.Add("Order has no items");

            if (string.IsNullOrEmpty(order.CustomerEmail))
                errors.Add("Customer email is required");
        }

        return new ValidationResult(errors);
    }
}

// 2. OrderCalculator - Single Responsibility: Calculation
public class OrderCalculator
{
    private readonly IProductRepository _productRepo;

    public OrderCalculator(IProductRepository productRepo)
    {
        _productRepo = productRepo;
    }

    public async Task<CalculationResult> CalculateTotalAsync(IEnumerable<OrderItem> items)
    {
        decimal total = 0;

        foreach (var item in items)
        {
            var product = await _productRepo.GetByIdAsync(item.ProductId);
            if (product == null)
                return CalculationResult.Failure($"Product {item.ProductId} not found");

            if (product.Stock < item.Quantity)
                return CalculationResult.Failure($"Insufficient stock for {product.Name}");

            total += product.Price * item.Quantity;
        }

        return CalculationResult.Success(total);
    }
}

// 3. DiscountService - Single Responsibility: Discounts
public class DiscountService
{
    public decimal ApplyDiscount(decimal total, Customer customer)
    {
        if (!customer.IsPremium)
            return total;

        var discountRate = total > 100 ? 0.20m : 0.10m;
        return total - (total * discountRate);
    }
}

// 4. PaymentProcessor - Single Responsibility: Payment Processing
public class PaymentProcessor
{
    private readonly IPaymentGateway _paymentGateway;

    public PaymentProcessor(IPaymentGateway paymentGateway)
    {
        _paymentGateway = paymentGateway;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(decimal amount, PaymentInfo paymentInfo)
    {
        return await _paymentGateway.ProcessAsync(amount, paymentInfo);
    }
}

// 5. InventoryManager - Single Responsibility: Inventory Management
public class InventoryManager
{
    private readonly IInventoryService _inventoryService;

    public InventoryManager(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    public async Task ReserveInventoryAsync(IEnumerable<OrderItem> items)
    {
        foreach (var item in items)
        {
            await _inventoryService.DecrementStockAsync(item.ProductId, item.Quantity);
        }
    }
}

// 6. OrderNotificationService - Single Responsibility: Notifications
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
        var emailBody = _templateEngine.Render("OrderConfirmation", new
        {
            OrderId = order.Id,
            Total = order.Total
        });

        await _emailService.SendAsync(order.CustomerEmail, "Order Confirmation", emailBody);
    }
}

// 7. OrderService - Orchestrates the workflow (Single Responsibility: Orchestration)
public class OrderService
{
    private readonly OrderValidator _validator;
    private readonly OrderCalculator _calculator;
    private readonly DiscountService _discountService;
    private readonly PaymentProcessor _paymentProcessor;
    private readonly InventoryManager _inventoryManager;
    private readonly OrderNotificationService _notificationService;
    private readonly IOrderRepository _orderRepo;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        OrderValidator validator,
        OrderCalculator calculator,
        DiscountService discountService,
        PaymentProcessor paymentProcessor,
        InventoryManager inventoryManager,
        OrderNotificationService notificationService,
        IOrderRepository orderRepo,
        ILogger<OrderService> logger)
    {
        _validator = validator;
        _calculator = calculator;
        _discountService = discountService;
        _paymentProcessor = paymentProcessor;
        _inventoryManager = inventoryManager;
        _notificationService = notificationService;
        _orderRepo = orderRepo;
        _logger = logger;
    }

    public async Task<OrderResult> ProcessOrderAsync(Order order)
    {
        // 1. Validate
        var validationResult = _validator.Validate(order);
        if (!validationResult.IsValid)
            return OrderResult.Failure(validationResult.Errors);

        // 2. Calculate total
        var calculationResult = await _calculator.CalculateTotalAsync(order.Items);
        if (!calculationResult.Success)
            return OrderResult.Failure(calculationResult.Error);

        // 3. Apply discounts
        var total = _discountService.ApplyDiscount(calculationResult.Total, order.Customer);

        // 4. Process payment
        var paymentResult = await _paymentProcessor.ProcessPaymentAsync(total, order.PaymentInfo);
        if (!paymentResult.Success)
            return OrderResult.Failure("Payment failed");

        // 5. Reserve inventory
        await _inventoryManager.ReserveInventoryAsync(order.Items);

        // 6. Save order
        order.Total = total;
        order.Status = OrderStatus.Confirmed;
        await _orderRepo.SaveAsync(order);

        // 7. Send notification
        await _notificationService.SendOrderConfirmationAsync(order);

        _logger.LogInformation("Order {OrderId} processed successfully", order.Id);

        return OrderResult.Success(order.Id);
    }
}
```

---

## Benefits Analysis

### 1. Single Responsibility Principle Applied

**Before**: OrderService had 6 distinct responsibilities
**After**: 7 classes, each with single responsibility

**Benefits**:
- ✅ Easier to understand (each class does one thing)
- ✅ Easier to test (mock only what's needed)
- ✅ Easier to maintain (changes isolated)
- ✅ Easier to reuse (components usable elsewhere)

---

### 2. Reduced Complexity

**Before**:
- OrderService.ProcessOrderAsync: CC = 18
- Total lines in one class: 847

**After**:
- OrderService.ProcessOrderAsync: CC = 3 (orchestration only)
- Each service class: CC ≤ 3
- Average lines per class: ~50

**Benefits**:
- ✅ Lower cognitive load
- ✅ Easier to reason about
- ✅ Fewer bugs
- ✅ Faster feature development

---

### 3. Improved Testability

**Before**: Testing required mocking 5+ dependencies

```csharp
// Complex test setup
[Fact]
public async Task ProcessOrder_ValidOrder_Success()
{
    var mockOrderRepo = new Mock<IOrderRepository>();
    var mockEmailService = new Mock<IEmailService>();
    var mockPaymentGateway = new Mock<IPaymentGateway>();
    var mockInventoryService = new Mock<IInventoryService>();
    var mockLogger = new Mock<ILogger>();
    var mockProductRepo = new Mock<IProductRepository>();

    // Setup all mocks...

    var service = new OrderService(
        mockOrderRepo.Object,
        mockEmailService.Object,
        mockPaymentGateway.Object,
        mockInventoryService.Object,
        mockLogger.Object);

    // Test...
}
```

**After**: Each service tested independently

```csharp
// Simple, focused test
[Fact]
public void Validate_NullOrder_ReturnsInvalid()
{
    var validator = new OrderValidator();

    var result = validator.Validate(null);

    Assert.False(result.IsValid);
    Assert.Contains("Order is null", result.Errors);
}

[Fact]
public async Task CalculateTotal_ValidItems_ReturnsCorrectTotal()
{
    var mockProductRepo = new Mock<IProductRepository>();
    mockProductRepo.Setup(r => r.GetByIdAsync(1, default))
        .ReturnsAsync(new Product { Id = 1, Price = 10m, Stock = 100 });

    var calculator = new OrderCalculator(mockProductRepo.Object);
    var items = new[] { new OrderItem { ProductId = 1, Quantity = 5 } };

    var result = await calculator.CalculateTotalAsync(items);

    Assert.True(result.Success);
    Assert.Equal(50m, result.Total);
}
```

**Benefits**:
- ✅ Faster test execution (fewer mocks)
- ✅ Clearer test intent
- ✅ Better test coverage
- ✅ Easier to debug failures

---

### 4. Better Reusability

**Before**: Couldn't reuse validation or calculation logic

**After**: Each service can be used independently

```csharp
// Reuse OrderValidator in API controller
public class OrdersController : ControllerBase
{
    private readonly OrderValidator _validator;

    [HttpPost("validate")]
    public IActionResult ValidateOrder([FromBody] Order order)
    {
        var result = _validator.Validate(order);
        return result.IsValid ? Ok() : BadRequest(result.Errors);
    }
}

// Reuse DiscountService in pricing calculator
public class PricingCalculator
{
    private readonly DiscountService _discountService;

    public decimal GetFinalPrice(decimal basePrice, Customer customer)
    {
        return _discountService.ApplyDiscount(basePrice, customer);
    }
}
```

**Benefits**:
- ✅ Components reusable across features
- ✅ Reduces code duplication
- ✅ Consistent behavior
- ✅ Faster feature development

---

### 5. Easier Maintenance

**Before**: Changes to any logic require touching large OrderService class

**After**: Changes isolated to specific service

**Example - Change discount logic**:

**Before**: Modify ProcessOrderAsync (847 lines) → High risk
**After**: Modify DiscountService (20 lines) → Low risk

**Benefits**:
- ✅ Lower risk of introducing bugs
- ✅ Faster to make changes
- ✅ Easier code reviews
- ✅ Better team collaboration (less merge conflicts)

---

### 6. Improved Dependency Management

**Before**: OrderService depends on 5+ services directly

**After**: Each service has 1-2 dependencies

**Dependency Graph**:

```
Before:
OrderService → [5+ dependencies]

After:
OrderService → [6 service dependencies]
  OrderValidator → [0 dependencies]
  OrderCalculator → [IProductRepository]
  DiscountService → [0 dependencies]
  PaymentProcessor → [IPaymentGateway]
  InventoryManager → [IInventoryService]
  OrderNotificationService → [IEmailService, ITemplateEngine]
```

**Benefits**:
- ✅ Loose coupling
- ✅ Easier to mock in tests
- ✅ Easier to replace implementations
- ✅ Follows Dependency Inversion Principle

---

## Testing Notes

### Tests Updated

- [X] All existing tests passing
- [X] Added tests for OrderValidator (5 tests)
- [X] Added tests for OrderCalculator (7 tests)
- [X] Added tests for DiscountService (4 tests)
- [X] Added tests for PaymentProcessor (3 tests)
- [X] Added tests for InventoryManager (3 tests)
- [X] Added tests for OrderNotificationService (2 tests)
- [X] Updated integration tests (3 tests)

### Test Coverage

**Before**: 65%
**After**: 87%
**Improvement**: +22%

---

## Performance Impact

### Execution Time

| Scenario | Before | After | Change |
|----------|--------|-------|--------|
| Process Order | 245ms | 238ms | -3% (faster) |
| Validate Order | N/A | 2ms | New capability |
| Calculate Total | N/A | 15ms | New capability |

**Analysis**: Slight performance improvement due to better code organization and reduced overhead.

---

## Migration Notes

### Breaking Changes

- ❌ None - Same public API

### Deployment Steps

1. Deploy new code
2. Run database migrations (if any)
3. Run smoke tests
4. Monitor for errors

### Rollback Plan

- Git revert to previous commit
- Redeploy previous version
- No database changes needed

---

## Lessons Learned

### What Went Well

- ✅ [Lesson 1]
- ✅ [Lesson 2]

### Challenges

- ⚠️ [Challenge 1]
- ⚠️ [Challenge 2]

### Improvements for Next Time

- 💡 [Improvement idea 1]
- 💡 [Improvement idea 2]

---

## Related Refactorings

- [ ] [Related refactoring 1]
- [ ] [Related refactoring 2]

---

## References

- [SOLID Principles Guide](../references/solid-principles.md)
- [Code Smells Catalog](../references/code-smells-catalog.md)
- [Design Patterns Reference](../references/design-patterns.md)

---

**Approved By**: [Name]
**Date**: [YYYY-MM-DD]
