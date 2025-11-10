# Complexity Reduction Techniques for C#

Comprehensive guide to reducing cyclomatic complexity and improving code maintainability.

## Table of Contents

1. [Understanding Cyclomatic Complexity](#understanding-cyclomatic-complexity)
2. [Measuring Complexity](#measuring-complexity)
3. [Reduction Techniques](#reduction-techniques)
4. [Real-World Examples](#real-world-examples)

---

## Understanding Cyclomatic Complexity

### What is Cyclomatic Complexity?

Cyclomatic complexity measures the number of linearly independent paths through code. Higher complexity = harder to understand, test, and maintain.

### Formula

```
CC = E - N + 2P

Where:
E = Number of edges (paths)
N = Number of nodes (statements)
P = Number of connected components (usually 1)

Simplified: Count decision points + 1
Decision points: if, else, case, for, foreach, while, do, catch, &&, ||, ??
```

### Thresholds

| Complexity | Rating | Action |
|------------|--------|--------|
| 1-5 | Simple | Low risk, easy to test |
| 6-10 | Moderate | Acceptable, monitor |
| 11-20 | High | Should refactor |
| 21-50 | Very High | Must refactor |
| 50+ | Unmaintainable | Urgent refactoring |

### Calculating Complexity

**Example 1 - Simple Method (CC = 1)**:
```csharp
public int Add(int a, int b)
{
    return a + b; // No decision points, CC = 1
}
```

**Example 2 - With Conditional (CC = 2)**:
```csharp
public int Divide(int a, int b)
{
    if (b == 0)  // +1 decision point
        throw new ArgumentException("Cannot divide by zero");
    return a / b;
}
// CC = 1 (base) + 1 (if) = 2
```

**Example 3 - Multiple Conditionals (CC = 5)**:
```csharp
public string GetGrade(int score)
{
    if (score >= 90)      // +1
        return "A";
    else if (score >= 80) // +1
        return "B";
    else if (score >= 70) // +1
        return "C";
    else if (score >= 60) // +1
        return "D";
    else
        return "F";
}
// CC = 1 (base) + 4 (if conditions) = 5
```

---

## Measuring Complexity

### Manual Calculation

Count decision points in the method:

```csharp
public bool ValidateOrder(Order order)
{
    if (order == null)                          // +1
        return false;

    if (order.Items == null || !order.Items.Any()) // +1 (|| counts as 1)
        return false;

    foreach (var item in order.Items)           // +1
    {
        if (item.Quantity <= 0)                 // +1
            return false;

        if (item.Price < 0)                     // +1
            return false;
    }

    return true;
}
// CC = 1 (base) + 5 (decision points) = 6 (Moderate)
```

### Using Tools

- **Visual Studio**: Built-in Code Metrics
- **Roslyn Analyzers**: StyleCop, Roslynator
- **SonarQube**: Full code quality analysis
- **NDepend**: Advanced metrics

---

## Reduction Techniques

### Technique 1: Guard Clauses (Early Returns)

Replace nested conditionals with early returns.

**Before** (CC = 8):
```csharp
public async Task<OrderResult> ProcessOrderAsync(Order order)
{
    if (order != null)                           // +1
    {
        if (order.Items != null)                 // +1
        {
            if (order.Items.Count > 0)           // +1
            {
                if (order.Customer != null)      // +1
                {
                    if (order.Total > 0)         // +1
                    {
                        var result = await _orderService.SaveAsync(order); // +1 (await)
                        if (result.Success)      // +1
                        {
                            return OrderResult.Success(order.Id);
                        }
                    }
                }
            }
        }
    }
    return OrderResult.Failure("Invalid order");
}
```

**After** (CC = 7, but much more readable):
```csharp
public async Task<OrderResult> ProcessOrderAsync(Order order)
{
    if (order == null)                           // +1
        return OrderResult.Failure("Order is null");

    if (order.Items == null || order.Items.Count == 0) // +1
        return OrderResult.Failure("Order has no items");

    if (order.Customer == null)                  // +1
        return OrderResult.Failure("Customer is required");

    if (order.Total <= 0)                        // +1
        return OrderResult.Failure("Invalid total");

    var result = await _orderService.SaveAsync(order); // +1
    if (!result.Success)                         // +1
        return OrderResult.Failure(result.Error);

    return OrderResult.Success(order.Id);
}
```

**Benefits**:
- ✅ Eliminates deep nesting
- ✅ More readable
- ✅ Similar complexity but better structure
- ✅ Easier to maintain

---

### Technique 2: Extract Method

Break large methods into smaller, focused methods.

**Before** (CC = 15):
```csharp
public async Task<OrderResult> CreateOrderAsync(CreateOrderRequest request)
{
    // Validation (CC +5)
    if (request == null) return OrderResult.Failure("Request is null");
    if (string.IsNullOrEmpty(request.CustomerEmail)) return OrderResult.Failure("Email required");
    if (request.Items == null || !request.Items.Any()) return OrderResult.Failure("Items required");

    // Calculate total (CC +3)
    decimal total = 0;
    foreach (var item in request.Items)
    {
        if (item.Quantity > 0)
        {
            total += item.Price * item.Quantity;
        }
    }

    // Apply discount (CC +4)
    if (request.DiscountCode != null)
    {
        var discount = await _discountService.GetDiscountAsync(request.DiscountCode);
        if (discount != null)
        {
            if (discount.IsValid)
            {
                total -= total * discount.Percentage;
            }
        }
    }

    // Save order (CC +2)
    var order = new Order { /* ... */ };
    var result = await _orderRepo.SaveAsync(order);
    if (!result.Success)
        return OrderResult.Failure(result.Error);

    return OrderResult.Success(order.Id);
}
```

**After** (Each method CC ≤ 5):
```csharp
public async Task<OrderResult> CreateOrderAsync(CreateOrderRequest request)
{
    var validationResult = ValidateRequest(request);      // CC = 3
    if (!validationResult.IsValid)
        return OrderResult.Failure(validationResult.Error);

    var total = CalculateTotal(request.Items);            // CC = 2

    if (request.DiscountCode != null)
        total = await ApplyDiscountAsync(total, request.DiscountCode); // CC = 4

    var order = new Order { Total = total, /* ... */ };
    var result = await _orderRepo.SaveAsync(order);      // CC = 2
    if (!result.Success)
        return OrderResult.Failure(result.Error);

    return OrderResult.Success(order.Id);
}

private ValidationResult ValidateRequest(CreateOrderRequest request)
{
    if (request == null)                                  // +1
        return ValidationResult.Failure("Request is null");

    if (string.IsNullOrEmpty(request.CustomerEmail))     // +1
        return ValidationResult.Failure("Email required");

    if (request.Items == null || !request.Items.Any())   // +1
        return ValidationResult.Failure("Items required");

    return ValidationResult.Success();
}
// CC = 3

private decimal CalculateTotal(IEnumerable<OrderItem> items)
{
    decimal total = 0;
    foreach (var item in items)                          // +1
    {
        if (item.Quantity > 0)                           // +1
            total += item.Price * item.Quantity;
    }
    return total;
}
// CC = 2

private async Task<decimal> ApplyDiscountAsync(decimal total, string discountCode)
{
    var discount = await _discountService.GetDiscountAsync(discountCode);
    if (discount == null)                                // +1
        return total;

    if (!discount.IsValid)                               // +1
        return total;

    return total - (total * discount.Percentage);
}
// CC = 2
```

**Benefits**:
- ✅ Each method has single responsibility
- ✅ Lower complexity per method
- ✅ Easier to test
- ✅ More maintainable

---

### Technique 3: Replace Conditional with Polymorphism

Replace switch/if-else chains with strategy pattern.

**Before** (CC = 6):
```csharp
public decimal CalculateShipping(Order order, ShippingMethod method)
{
    if (method == ShippingMethod.Standard)               // +1
    {
        if (order.Weight > 10)                           // +1
            return 15.00m;
        return 5.00m;
    }
    else if (method == ShippingMethod.Express)           // +1
    {
        if (order.Weight > 10)                           // +1
            return 30.00m;
        return 15.00m;
    }
    else if (method == ShippingMethod.Overnight)         // +1
    {
        if (order.Weight > 10)                           // +1
            return 50.00m;
        return 25.00m;
    }
    return 0;
}
// CC = 6
```

**After** (Each class CC = 2):
```csharp
public interface IShippingCalculator
{
    decimal Calculate(Order order);
}

public class StandardShippingCalculator : IShippingCalculator
{
    public decimal Calculate(Order order)
    {
        return order.Weight > 10 ? 15.00m : 5.00m;       // +1
    }
}
// CC = 2

public class ExpressShippingCalculator : IShippingCalculator
{
    public decimal Calculate(Order order)
    {
        return order.Weight > 10 ? 30.00m : 15.00m;      // +1
    }
}
// CC = 2

public class OvernightShippingCalculator : IShippingCalculator
{
    public decimal Calculate(Order order)
    {
        return order.Weight > 10 ? 50.00m : 25.00m;      // +1
    }
}
// CC = 2

public class ShippingService
{
    private readonly IShippingCalculator _calculator;

    public ShippingService(IShippingCalculator calculator)
    {
        _calculator = calculator;
    }

    public decimal CalculateShipping(Order order)
    {
        return _calculator.Calculate(order);             // CC = 1
    }
}
```

**Benefits**:
- ✅ Complexity distributed across classes
- ✅ Easy to add new shipping methods
- ✅ Each calculator independently testable
- ✅ Follows Open/Closed Principle

---

### Technique 4: Simplify Boolean Expressions

Use boolean algebra to simplify conditionals.

**Before**:
```csharp
public bool CanProcessOrder(Order order)
{
    if (order.Status == OrderStatus.Pending)             // +1
    {
        if (order.PaymentStatus == PaymentStatus.Paid)   // +1
        {
            if (order.InventoryReserved == true)         // +1
            {
                return true;
            }
        }
    }
    return false;
}
// CC = 3
```

**After**:
```csharp
public bool CanProcessOrder(Order order)
{
    return order.Status == OrderStatus.Pending           // +1 (&&)
        && order.PaymentStatus == PaymentStatus.Paid     // +1 (&&)
        && order.InventoryReserved;
}
// CC = 3, but much more concise
```

---

### Technique 5: Use LINQ Instead of Loops

Replace loops with LINQ where appropriate.

**Before** (CC = 4):
```csharp
public List<Product> GetAvailableProducts(List<Product> products)
{
    var available = new List<Product>();
    foreach (var product in products)                    // +1
    {
        if (product.Stock > 0)                           // +1
        {
            if (!product.IsDiscontinued)                 // +1
            {
                available.Add(product);
            }
        }
    }
    return available;
}
// CC = 4
```

**After** (CC = 1):
```csharp
public List<Product> GetAvailableProducts(List<Product> products)
{
    return products
        .Where(p => p.Stock > 0 && !p.IsDiscontinued)
        .ToList();
}
// CC = 1 (LINQ doesn't add complexity)
```

---

### Technique 6: Use Pattern Matching

C# pattern matching can simplify type checks.

**Before** (CC = 5):
```csharp
public string GetDescription(object obj)
{
    if (obj is string)                                   // +1
    {
        var str = (string)obj;
        return $"String: {str}";
    }
    else if (obj is int)                                 // +1
    {
        var num = (int)obj;
        return $"Number: {num}";
    }
    else if (obj is DateTime)                            // +1
    {
        var date = (DateTime)obj;
        return $"Date: {date:yyyy-MM-dd}";
    }
    return "Unknown";
}
// CC = 4
```

**After** (CC = 1):
```csharp
public string GetDescription(object obj)
{
    return obj switch
    {
        string str => $"String: {str}",
        int num => $"Number: {num}",
        DateTime date => $"Date: {date:yyyy-MM-dd}",
        _ => "Unknown"
    };
}
// CC = 1 (switch expression doesn't count as multiple decision points)
```

---

### Technique 7: Introduce Parameter Object

Reduce parameter complexity with objects.

**Before**:
```csharp
public bool ValidateOrder(
    int customerId,
    string email,
    decimal total,
    int itemCount,
    bool isPremium,
    string shippingAddress)
{
    if (customerId <= 0) return false;                   // +1
    if (string.IsNullOrEmpty(email)) return false;       // +1
    if (total <= 0) return false;                        // +1
    if (itemCount <= 0) return false;                    // +1
    if (string.IsNullOrEmpty(shippingAddress)) return false; // +1
    return true;
}
// CC = 5, plus high parameter count
```

**After**:
```csharp
public record OrderValidationParams(
    int CustomerId,
    string Email,
    decimal Total,
    int ItemCount,
    bool IsPremium,
    string ShippingAddress
);

public bool ValidateOrder(OrderValidationParams params)
{
    if (params.CustomerId <= 0) return false;            // +1
    if (string.IsNullOrEmpty(params.Email)) return false;// +1
    if (params.Total <= 0) return false;                 // +1
    if (params.ItemCount <= 0) return false;             // +1
    if (string.IsNullOrEmpty(params.ShippingAddress)) return false; // +1
    return true;
}
// CC = 5, but cleaner interface
```

---

## Real-World Examples

### Example 1: Order Processing

**Before** (CC = 18):
```csharp
public async Task<OrderResult> ProcessOrderAsync(Order order)
{
    if (order == null) return OrderResult.Failure("Null order");
    if (order.Items == null || order.Items.Count == 0) return OrderResult.Failure("No items");

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
                    return OrderResult.Failure("Insufficient stock");
                }
            }
            else
            {
                return OrderResult.Failure("Product not found");
            }
        }
    }

    order.Total = total;
    await _orderRepo.SaveAsync(order);
    return OrderResult.Success(order.Id);
}
```

**After** (Each method CC ≤ 4):
```csharp
public async Task<OrderResult> ProcessOrderAsync(Order order)
{
    if (order == null)
        return OrderResult.Failure("Null order");

    if (order.Items == null || order.Items.Count == 0)
        return OrderResult.Failure("No items");

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

---

## Complexity Reduction Checklist

When refactoring complex methods:

- [ ] Calculate current complexity
- [ ] Identify nesting levels
- [ ] Apply guard clauses (early returns)
- [ ] Extract methods for distinct responsibilities
- [ ] Simplify boolean expressions
- [ ] Replace conditionals with polymorphism
- [ ] Use LINQ instead of loops
- [ ] Use pattern matching
- [ ] Introduce parameter objects
- [ ] Recalculate complexity
- [ ] Test thoroughly

---

## Target Complexity Goals

| Method Type | Target CC |
|-------------|-----------|
| Simple utility | 1-3 |
| Business logic | 4-6 |
| Complex orchestration | 7-10 |
| **Never exceed** | **15** |

---

## Conclusion

Reducing cyclomatic complexity is essential for maintainability. The techniques in this guide help you:

1. **Identify** high-complexity code
2. **Refactor** using proven patterns
3. **Verify** improvements with metrics
4. **Maintain** code quality over time

Remember: Lower complexity = easier testing, better maintainability, fewer bugs.
