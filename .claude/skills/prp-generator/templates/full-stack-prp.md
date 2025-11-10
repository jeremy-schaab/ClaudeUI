# Product Requirement Prompt - Order Management System (Full-Stack)

> **💡 Template Usage**: This is a complete end-to-end example combining database, backend service, API, Blazor UI, and deployment. Demonstrates how all layers integrate for a production-ready feature.

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Feature Name** | 💡 Order Management System |
| **Feature Type** | Full-Stack Feature (Database → API → UI) |
| **Complexity** | High |
| **Estimated Effort** | 120 hours (3 weeks) |
| **Technology Stack** | C# 13, .NET 9, EF Core 9, Blazor Server, Azure SQL, Azure App Service |
| **Primary Users** | Store administrators managing customer orders |
| **Business Value** | Streamlined order processing reducing fulfillment time by 40% |

**Feature Overview**: Complete order management system allowing administrators to view, process, and fulfill customer orders. Includes order list with filtering/sorting, order details view, status updates, and real-time notifications via SignalR.

---

## Current State Analysis

### Existing Components
💡 **Discovered via `Glob **/*.cs` and `Grep "class.*Order"`**:

- **`src/Core/Models/Customer.cs`**: Customer entity with Id, Name, Email
- **`src/Core/Models/Product.cs`**: Product entity with Id, Name, Price, Stock
- **`src/Data/AppDbContext.cs`**: EF Core context
- **`src/Api/Program.cs`**: API configuration and middleware
- **`Components/Layout/MainLayout.razor`**: Application layout

### Dependencies
- **Entity Framework Core 9.0**
- **Syncfusion.Blazor.Grid 27.x** (or MudBlazor DataGrid)
- **Microsoft.AspNetCore.SignalR.Client**
- **FluentValidation.AspNetCore**

### Gaps (Full-Stack Implementation Required)
**Database Layer**:
- Order entity and OrderItem entity
- EF Core migration for Orders and OrderItems tables
- Repository interfaces and implementations

**Backend Layer**:
- OrderService with business logic
- Order validation rules
- Order workflow state machine

**API Layer**:
- Order endpoints (CRUD + status updates)
- DTOs for request/response
- Authorization rules

**UI Layer**:
- OrderList.razor component with grid
- OrderDetails.razor component
- OrderStatusDialog.razor for updates
- Real-time hub for order notifications

**Testing**:
- Unit tests for service layer
- Integration tests for API
- Component tests for UI

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Blazor UI Layer                    │
│  OrderList.razor → OrderDetails.razor → StatusDialog    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/SignalR
┌────────────────────────▼────────────────────────────────┐
│                    API Layer (Minimal APIs)             │
│  GET /api/orders  │  GET /api/orders/{id}               │
│  POST /api/orders │  PUT /api/orders/{id}/status        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Service Layer                         │
│  OrderService → IOrderRepository → OrderValidator       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Data Layer (EF Core)                  │
│  Orders Table │ OrderItems Table │ OrderRepository      │
└─────────────────────────────────────────────────────────┘
```

---

## Database Design

### Order Entity
**Location**: `src/Core/Models/Order.cs`

```csharp
public class Order
{
    public Guid Id { get; init; }
    public required string OrderNumber { get; init; } // ORD-20250128-0001
    public Guid CustomerId { get; init; }
    public required Customer Customer { get; init; }
    public required List<OrderItem> Items { get; init; } = [];
    public decimal TotalAmount { get; private set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }

    public void CalculateTotal()
    {
        TotalAmount = Items.Sum(i => i.Quantity * i.UnitPrice);
    }

    public void UpdateStatus(OrderStatus newStatus)
    {
        // State machine validation
        var validTransitions = Status switch
        {
            OrderStatus.Pending => [OrderStatus.Processing, OrderStatus.Cancelled],
            OrderStatus.Processing => [OrderStatus.Shipped, OrderStatus.Cancelled],
            OrderStatus.Shipped => [OrderStatus.Delivered],
            _ => Array.Empty<OrderStatus>()
        };

        if (!validTransitions.Contains(newStatus))
            throw new InvalidOperationException($"Cannot transition from {Status} to {newStatus}");

        Status = newStatus;
        if (newStatus == OrderStatus.Delivered)
            CompletedAt = DateTime.UtcNow;
    }
}

public class OrderItem
{
    public Guid Id { get; init; }
    public Guid OrderId { get; init; }
    public Guid ProductId { get; init; }
    public required Product Product { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal Subtotal => Quantity * UnitPrice;
}

public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}
```

### EF Core Migration
**Location**: `src/Data/Migrations/{timestamp}_AddOrderTables.cs`

```csharp
public partial class AddOrderTables : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Orders",
            columns: table => new
            {
                Id = table.Column<Guid>(nullable: false),
                OrderNumber = table.Column<string>(maxLength: 50, nullable: false),
                CustomerId = table.Column<Guid>(nullable: false),
                TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                Status = table.Column<int>(nullable: false),
                CreatedAt = table.Column<DateTime>(nullable: false),
                CompletedAt = table.Column<DateTime>(nullable: true),
                Notes = table.Column<string>(maxLength: 1000, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Orders", x => x.Id);
                table.ForeignKey("FK_Orders_Customers", x => x.CustomerId, "Customers", "Id");
            });

        migrationBuilder.CreateTable(
            name: "OrderItems",
            columns: table => new
            {
                Id = table.Column<Guid>(nullable: false),
                OrderId = table.Column<Guid>(nullable: false),
                ProductId = table.Column<Guid>(nullable: false),
                Quantity = table.Column<int>(nullable: false),
                UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OrderItems", x => x.Id);
                table.ForeignKey("FK_OrderItems_Orders", x => x.OrderId, "Orders", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_OrderItems_Products", x => x.ProductId, "Products", "Id");
            });

        migrationBuilder.CreateIndex("IX_Orders_OrderNumber", "Orders", "OrderNumber", unique: true);
        migrationBuilder.CreateIndex("IX_Orders_CustomerId", "Orders", "CustomerId");
        migrationBuilder.CreateIndex("IX_Orders_Status", "Orders", "Status");
        migrationBuilder.CreateIndex("IX_Orders_CreatedAt", "Orders", "CreatedAt");
        migrationBuilder.CreateIndex("IX_OrderItems_OrderId", "OrderItems", "OrderId");
    }
}
```

---

## Service Layer

### OrderService
**Location**: `src/Services/OrderService.cs`

```csharp
public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderRequest request, CancellationToken ct);
    Task<PagedResult<Order>> GetOrdersAsync(int page, int pageSize, OrderStatus? status, CancellationToken ct);
    Task<Order?> GetOrderByIdAsync(Guid id, CancellationToken ct);
    Task<Order> UpdateOrderStatusAsync(Guid id, OrderStatus newStatus, CancellationToken ct);
}

public class OrderService(
    IOrderRepository orderRepo,
    IProductRepository productRepo,
    IOrderHubNotifier hubNotifier,
    IValidator<CreateOrderRequest> validator,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Order> CreateOrderAsync(CreateOrderRequest request, CancellationToken ct)
    {
        // Validate request
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        // Verify products exist and have sufficient stock
        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await productRepo.GetByIdsAsync(productIds, ct);

        foreach (var item in request.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            if (product == null)
                throw new NotFoundException($"Product {item.ProductId} not found");

            if (product.Stock < item.Quantity)
                throw new InsufficientStockException($"Product {product.Name} has insufficient stock");
        }

        // Create order
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = await GenerateOrderNumberAsync(ct),
            CustomerId = request.CustomerId,
            Items = request.Items.Select(i => new OrderItem
            {
                Id = Guid.NewGuid(),
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitPrice = products.First(p => p.Id == i.ProductId).Price,
                Product = products.First(p => p.Id == i.ProductId)
            }).ToList(),
            Notes = request.Notes
        };

        order.CalculateTotal();

        // Reduce product stock
        foreach (var item in order.Items)
        {
            var product = products.First(p => p.Id == item.ProductId);
            product.Stock -= item.Quantity;
            await productRepo.UpdateAsync(product, ct);
        }

        await orderRepo.AddAsync(order, ct);
        logger.LogInformation("Order {OrderNumber} created for customer {CustomerId}", order.OrderNumber, order.CustomerId);

        // Notify connected clients
        await hubNotifier.NotifyOrderCreatedAsync(order);

        return order;
    }

    public async Task<Order> UpdateOrderStatusAsync(Guid id, OrderStatus newStatus, CancellationToken ct)
    {
        var order = await orderRepo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Order {id} not found");

        order.UpdateStatus(newStatus); // Validates state transition
        await orderRepo.UpdateAsync(order, ct);

        logger.LogInformation("Order {OrderNumber} status updated to {Status}", order.OrderNumber, newStatus);
        await hubNotifier.NotifyOrderStatusChangedAsync(order);

        return order;
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken ct)
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var count = await orderRepo.GetCountForDateAsync(DateTime.UtcNow.Date, ct);
        return $"ORD-{today}-{count + 1:D4}";
    }
}
```

---

## API Layer (Minimal APIs)

**Location**: `src/Api/Endpoints/OrderEndpoints.cs`

```csharp
public static class OrderEndpoints
{
    public static RouteGroupBuilder MapOrderEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetOrdersAsync)
            .WithName("GetOrders")
            .Produces<PagedResult<OrderDto>>();

        group.MapGet("/{id:guid}", GetOrderByIdAsync)
            .WithName("GetOrderById")
            .Produces<OrderDto>()
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateOrderAsync)
            .WithName("CreateOrder")
            .Produces<OrderDto>(StatusCodes.Status201Created)
            .Produces<ValidationErrorResponse>(StatusCodes.Status400BadRequest);

        group.MapPut("/{id:guid}/status", UpdateOrderStatusAsync)
            .WithName("UpdateOrderStatus")
            .Produces<OrderDto>()
            .Produces(StatusCodes.Status404NotFound);

        return group;
    }

    private static async Task<IResult> GetOrdersAsync(
        [AsParameters] OrderQueryParameters query,
        IOrderService orderService,
        CancellationToken ct)
    {
        var result = await orderService.GetOrdersAsync(query.Page, query.PageSize, query.Status, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetOrderByIdAsync(
        Guid id,
        IOrderService orderService,
        CancellationToken ct)
    {
        var order = await orderService.GetOrderByIdAsync(id, ct);
        return order != null ? Results.Ok(order.ToDto()) : Results.NotFound();
    }

    private static async Task<IResult> CreateOrderAsync(
        CreateOrderRequest request,
        IOrderService orderService,
        CancellationToken ct)
    {
        var order = await orderService.CreateOrderAsync(request, ct);
        return Results.Created($"/api/orders/{order.Id}", order.ToDto());
    }

    private static async Task<IResult> UpdateOrderStatusAsync(
        Guid id,
        UpdateStatusRequest request,
        IOrderService orderService,
        CancellationToken ct)
    {
        var order = await orderService.UpdateOrderStatusAsync(id, request.NewStatus, ct);
        return Results.Ok(order.ToDto());
    }
}

public record OrderQueryParameters(int Page = 1, int PageSize = 20, OrderStatus? Status = null);
public record CreateOrderRequest(Guid CustomerId, List<OrderItemRequest> Items, string? Notes);
public record OrderItemRequest(Guid ProductId, int Quantity);
public record UpdateStatusRequest(OrderStatus NewStatus);
```

---

## UI Layer (Blazor)

### OrderList.razor
**Location**: `Components/Pages/Orders/OrderList.razor`

```razor
@page "/orders"
@attribute [Authorize(Roles = "Admin")]
@inject IOrderService OrderService
@inject NavigationManager Navigation

<PageTitle>Orders</PageTitle>

<MudContainer MaxWidth="MaxWidth.ExtraExtraLarge" Class="mt-4">
    <MudText Typo="Typo.h4" GutterBottom>Orders</MudText>

    <MudDataGrid T="Order"
                 Items="@_orders"
                 Loading="@_isLoading"
                 Filterable
                 SortMode="SortMode.Multiple"
                 Pagination>
        <Columns>
            <PropertyColumn Property="x => x.OrderNumber" Title="Order #" />
            <PropertyColumn Property="x => x.Customer.Name" Title="Customer" />
            <PropertyColumn Property="x => x.TotalAmount" Title="Total" Format="C2" />
            <TemplateColumn Title="Status">
                <CellTemplate>
                    <MudChip Color="@GetStatusColor(context.Item.Status)">
                        @context.Item.Status
                    </MudChip>
                </CellTemplate>
            </TemplateColumn>
            <PropertyColumn Property="x => x.CreatedAt" Title="Created" Format="g" />
            <TemplateColumn Title="Actions">
                <CellTemplate>
                    <MudIconButton Icon="@Icons.Material.Filled.Visibility"
                                   OnClick="@(() => ViewOrder(context.Item.Id))" />
                </CellTemplate>
            </TemplateColumn>
        </Columns>
    </MudDataGrid>
</MudContainer>

@code {
    private List<Order> _orders = new();
    private bool _isLoading = true;

    protected override async Task OnInitializedAsync()
    {
        await LoadOrdersAsync();
    }

    private async Task LoadOrdersAsync()
    {
        _isLoading = true;
        var result = await OrderService.GetOrdersAsync(1, 100, null, CancellationToken.None);
        _orders = result.Items.ToList();
        _isLoading = false;
    }

    private void ViewOrder(Guid orderId) => Navigation.NavigateTo($"/orders/{orderId}");

    private Color GetStatusColor(OrderStatus status) => status switch
    {
        OrderStatus.Pending => Color.Warning,
        OrderStatus.Processing => Color.Info,
        OrderStatus.Shipped => Color.Primary,
        OrderStatus.Delivered => Color.Success,
        OrderStatus.Cancelled => Color.Error,
        _ => Color.Default
    };
}
```

---

## Test Requirements

### Unit Tests (Service Layer)
```csharp
public class OrderServiceTests
{
    [Fact]
    public async Task CreateOrderAsync_WithValidRequest_CreatesOrder()
    {
        // Arrange
        var mockOrderRepo = new Mock<IOrderRepository>();
        var mockProductRepo = new Mock<IProductRepository>();
        var mockValidator = new Mock<IValidator<CreateOrderRequest>>();

        var product = new Product { Id = Guid.NewGuid(), Name = "Laptop", Price = 999.99m, Stock = 10 };
        mockProductRepo.Setup(r => r.GetByIdsAsync(It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([product]);
        mockValidator.Setup(v => v.ValidateAsync(It.IsAny<CreateOrderRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());

        var service = new OrderService(mockOrderRepo.Object, mockProductRepo.Object,
            Mock.Of<IOrderHubNotifier>(), mockValidator.Object, Mock.Of<ILogger<OrderService>>());

        var request = new CreateOrderRequest(
            Guid.NewGuid(),
            [new OrderItemRequest(product.Id, 2)],
            null);

        // Act
        var order = await service.CreateOrderAsync(request, CancellationToken.None);

        // Assert
        order.Should().NotBeNull();
        order.Items.Should().HaveCount(1);
        order.TotalAmount.Should().Be(1999.98m);
        mockOrderRepo.Verify(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateOrderStatusAsync_WithInvalidTransition_ThrowsException()
    {
        // Test invalid state transitions...
    }
}
```

### Integration Tests (API)
```csharp
public class OrderEndpointsTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task POST_Orders_WithValidRequest_Returns201()
    {
        // Arrange
        var client = factory.CreateClient();
        var request = new CreateOrderRequest(
            Guid.NewGuid(),
            [new OrderItemRequest(Guid.NewGuid(), 2)],
            null);

        // Act
        var response = await client.PostAsJsonAsync("/api/orders", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
```

---

## Quality Gates

### Entry Gate ✅
- [x] All layers designed (database, service, API, UI)
- [x] Dependencies identified
- [x] State machine validated

### Implementation Gate
- [ ] Database migrations tested (up/down)
- [ ] Service layer unit tests ≥90% coverage
- [ ] API integration tests pass
- [ ] UI component tests pass
- [ ] State transitions validated
- [ ] Real-time notifications working

### Exit Gate
- [ ] End-to-end workflow tested (create → process → deliver)
- [ ] Performance: Order list loads <1s for 1000 orders
- [ ] Security: Authorization enforced on all endpoints
- [ ] All acceptance criteria met

---

## Agent Delegation Strategy

### Phase 1: Database Design
**Agent**: `database-engineer` (Riley)
**Deliverable**: EF Core entities and migration

### Phase 2: Backend Implementation
**Agent**: `backend-developer` (Jordan)
**Deliverable**: OrderService with business logic and tests

### Phase 3: API Implementation
**Agent**: `api-developer` (Skyler)
**Deliverable**: Order endpoints with DTOs

### Phase 4: UI Implementation
**Agent**: `frontend-developer` (Taylor)
**Deliverable**: Blazor components with SignalR

### Phase 5: Integration Testing
**Agent**: `qa-engineer` (Parker)
**Deliverable**: End-to-end test results

### Phase 6: Security Review
**Agent**: `security-specialist` (Alex)
**Deliverable**: Security audit report

### Phase 7: Code Review
**Agent**: `code-reviewer` (Avery)
**Deliverable**: Code quality report

---

## 💡 Customization Checklist

- [ ] Replace "Order" with your domain entity
- [ ] Modify OrderStatus enum for your workflow
- [ ] Update business rules and validations
- [ ] Customize UI components (grid columns, filters)
- [ ] Adjust authorization roles
- [ ] Configure SignalR hub endpoints
- [ ] Update file paths to match your project structure

---

*This full-stack template demonstrates complete integration of database, backend, API, and UI layers following C# 13/.NET 9 best practices.*
