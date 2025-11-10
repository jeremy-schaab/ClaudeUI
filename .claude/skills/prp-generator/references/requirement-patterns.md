# Requirement Patterns for PRPs

This reference provides reusable requirement patterns for common software development scenarios. Each pattern includes a template and concrete C# 13/.NET 9 example you can adapt for your PRPs.

---

## Pattern 1: CRUD Operations

**When to Use**: Any entity requiring Create, Read, Update, Delete operations

**Template Structure**:
```
### FR-X: {Entity} CRUD Operations
**Priority**: Must-have
**Description**: Users can perform full lifecycle management of {entity} records

**Acceptance Criteria**:
- [ ] Create: User submits {entity} data to POST /api/{resource}, receives 201 Created with {entity} ID
- [ ] Read: User retrieves {entity} by ID via GET /api/{resource}/{id}, receives 200 OK with {entity} data
- [ ] Read All: User retrieves paginated {entity} list via GET /api/{resource}?page={n}&pageSize={size}
- [ ] Update: User modifies {entity} via PUT /api/{resource}/{id}, receives 200 OK with updated {entity}
- [ ] Delete: User removes {entity} via DELETE /api/{resource}/{id}, receives 204 No Content
- [ ] Validation: {validation rules applied}

**Business Rules**:
- {Specific business constraints}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### FR-1: Product CRUD Operations
**Priority**: Must-have
**Description**: Users can create, retrieve, update, and delete product records in the catalog

**Acceptance Criteria**:
- [ ] Create: POST /api/products with JSON body, returns 201 Created with product ID and Location header
- [ ] Read: GET /api/products/{id} returns 200 OK with product details (Id, Name, Price, CategoryId, Stock)
- [ ] Read All: GET /api/products?page=1&pageSize=20 returns paginated list with total count
- [ ] Update: PUT /api/products/{id} with full product data, returns 200 OK with updated product
- [ ] Partial Update: PATCH /api/products/{id} with partial data using JSON Patch format
- [ ] Delete: DELETE /api/products/{id} returns 204 No Content, soft-deletes record (sets IsDeleted=true)
- [ ] Validation: Name required (3-100 chars), Price > 0, CategoryId must exist in Categories table

**Business Rules**:
- Cannot delete products with active orders
- Price changes logged to PriceHistory table
- Stock updates trigger inventory alerts if below reorder point
- Soft delete preserves data for audit trail
```

---

## Pattern 2: Authentication & Authorization

**When to Use**: APIs requiring user identity verification and access control

**Template Structure**:
```
### NFR-SEC-X: Authentication & Authorization
**Description**: Secure user authentication and role-based access control

**Requirements**:
- [ ] Authentication: Users authenticate via {method} (JWT, OAuth2, API Key)
- [ ] Token Management: Tokens expire after {duration}, refresh mechanism available
- [ ] Authorization: Endpoints enforce {RBAC/ABAC/Policy-based} access control
- [ ] Audit: Authentication events logged with {details}
- [ ] Security: {Specific security measures}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### NFR-SEC-1: API Security Requirements
**Description**: JWT bearer token authentication with role-based authorization

**Requirements**:
- [ ] JWT bearer token authentication required for all endpoints except /api/auth/login and /api/auth/register
- [ ] Tokens signed with HMACSHA256 using 256-bit secret from Azure Key Vault
- [ ] Access tokens expire after 15 minutes, refresh tokens after 7 days
- [ ] Role-based authorization via [Authorize(Roles = "Admin")] or policy-based [Authorize(Policy = "CanEditProducts")]
- [ ] Failed authentication attempts logged: UserId, IP address (hashed), timestamp, reason
- [ ] Rate limiting: 5 login attempts per email per 15 minutes
- [ ] CORS configured to allow only https://app.yourcompany.com and https://admin.yourcompany.com
- [ ] HTTPS enforced via UseHttpsRedirection middleware
- [ ] Passwords hashed using PasswordHasher<User> (PBKDF2, 10,000+ iterations)

**Business Rules**:
- Admin role can access all endpoints
- User role can access own resources only
- Guest role (unauthenticated) can browse public products
- Account locked after 5 failed login attempts for 15 minutes
```

---

## Pattern 3: Data Validation & Input Sanitization

**When to Use**: All APIs accepting user input

**Template Structure**:
```
### NFR-VAL-X: Input Validation
**Description**: Comprehensive validation of all user inputs

**Requirements**:
- [ ] Required Fields: {list required fields}
- [ ] Format Validation: {email, phone, date formats, etc.}
- [ ] Range Validation: {min/max values, string lengths}
- [ ] Business Logic Validation: {custom rules}
- [ ] Error Responses: {validation error format}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### NFR-VAL-1: User Registration Input Validation
**Description**: Validate all user registration inputs at API boundary

**Requirements**:
- [ ] Email: Required, valid format (RFC 5322), max 254 chars, unique in database
- [ ] Password: Required, 8-128 chars, must contain uppercase, lowercase, number, special char
- [ ] Display Name: Required, 2-50 chars, alphanumeric and spaces only
- [ ] Phone Number: Optional, E.164 format (+1234567890), validated using libphonenumber library
- [ ] Date of Birth: Required, valid date, user must be 13+ years old (COPPA compliance)
- [ ] Terms Accepted: Required, must be true

**Implementation**:
- Use FluentValidation library for validation rules
- Return 400 Bad Request with JSON: {"errors": {"Email": ["Email is already registered"], "Password": ["Password must contain at least one uppercase letter"]}}
- Validate on DTO using IValidator<RegisterRequest>
- Additional async validation for database uniqueness checks

**Example Validator**:
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator(IUserRepository userRepo)
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email format is invalid")
            .MaximumLength(254)
            .MustAsync(async (email, ct) => !await userRepo.EmailExistsAsync(email, ct))
            .WithMessage("Email is already registered");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8).MaximumLength(128)
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]")
            .WithMessage("Password must contain uppercase, lowercase, number, and special character");
    }
}
```

---

## Pattern 4: Error Handling & Resilience

**When to Use**: All services requiring robust error handling

**Template Structure**:
```
### NFR-ERR-X: Error Handling Strategy
**Description**: Comprehensive error handling and resilience

**Requirements**:
- [ ] Exception Handling: {global exception handler, custom exceptions}
- [ ] Retry Logic: {transient failure handling}
- [ ] Circuit Breaker: {prevent cascade failures}
- [ ] Error Responses: {standard error format}
- [ ] Logging: {error logging requirements}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### NFR-ERR-1: Service Error Handling & Resilience
**Description**: Robust error handling with retry logic and circuit breaker patterns

**Requirements**:
- [ ] Global exception handler middleware catches all unhandled exceptions
- [ ] Custom exceptions: DomainException (400), NotFoundException (404), ConflictException (409)
- [ ] Retry logic using Polly: 3 retries with exponential backoff (1s, 2s, 4s) for transient failures
- [ ] Circuit breaker: Opens after 5 consecutive failures, remains open for 30 seconds
- [ ] Timeout policy: API calls timeout after 30 seconds
- [ ] Standard error response JSON: {"error": "error_code", "message": "Human-readable message", "traceId": "guid", "timestamp": "ISO8601"}
- [ ] All exceptions logged with ILogger including exception type, message, stack trace, request context
- [ ] Transient failures (DbUpdateException, HttpRequestException, TimeoutException) retry automatically
- [ ] Non-transient failures (ArgumentException, DomainException) fail immediately

**Implementation**:
// Program.cs
builder.Services.AddHttpClient<IExternalApiClient, ExternalApiClient>()
    .AddPolicyHandler(Policy
        .Handle<HttpRequestException>()
        .Or<TimeoutException>()
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))))
    .AddPolicyHandler(Policy
        .Handle<HttpRequestException>()
        .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));

// Middleware
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionHandler = context.Features.Get<IExceptionHandlerFeature>();
        var error = exceptionHandler?.Error;

        var statusCode = error switch
        {
            NotFoundException => StatusCodes.Status404NotFound,
            DomainException => StatusCodes.Status400BadRequest,
            ConflictException => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new ErrorResponse(
            error?.GetType().Name ?? "UnknownError",
            error?.Message ?? "An error occurred",
            Activity.Current?.Id ?? Guid.NewGuid().ToString(),
            DateTime.UtcNow
        ));
    });
});
```

---

## Pattern 5: Performance & Scalability Requirements

**When to Use**: Services with specific performance SLAs

**Template Structure**:
```
### NFR-PERF-X: Performance Requirements
**Description**: Performance benchmarks and scalability targets

**Requirements**:
- [ ] Response Time: {latency requirements}
- [ ] Throughput: {requests per second}
- [ ] Resource Limits: {CPU, memory, connections}
- [ ] Caching: {caching strategy}
- [ ] Database: {query optimization requirements}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### NFR-PERF-1: API Performance & Scalability
**Description**: Performance targets for product catalog API

**Requirements**:
- [ ] Response time p95 < 200ms for GET /api/products
- [ ] Response time p95 < 500ms for POST /api/products (includes database write)
- [ ] Throughput: 1000 requests per second sustained load
- [ ] Database query execution < 50ms p95
- [ ] Memory usage < 512 MB baseline, < 2 GB under load
- [ ] CPU utilization < 60% at sustained load
- [ ] Connection pooling: Min 10, Max 100 database connections
- [ ] Response caching: GET /api/products cached for 5 minutes with ETags
- [ ] Output caching: Product details cached for 10 minutes, invalidated on updates
- [ ] Async/await throughout (no blocking calls)
- [ ] Use compiled queries for frequently executed EF queries
- [ ] Implement pagination (max 100 items per page) to prevent large result sets

**Measurement**:
- BenchmarkDotNet for micro-benchmarks
- Load testing with K6 or Apache JMeter (1000 concurrent users, 10-minute duration)
- Application Insights for production monitoring (p50, p95, p99 latencies)

**Optimization Strategies**:
- Use HybridCache for distributed caching (Redis)
- Implement projection (select only needed columns) in EF queries
- Use AsNoTracking() for read-only queries
- Database indexes on frequently queried columns (ProductName, CategoryId, CreatedAt)
```

---

## Pattern 6: Caching Strategy

**When to Use**: Read-heavy operations requiring performance optimization

**Template Structure**:
```
### NFR-CACHE-X: Caching Requirements
**Description**: Caching strategy for improved performance

**Requirements**:
- [ ] Cache Layers: {memory, distributed, CDN}
- [ ] Cache Keys: {key naming convention}
- [ ] TTL: {time-to-live for different data types}
- [ ] Invalidation: {cache invalidation strategy}
- [ ] Cache Miss Handling: {fallback behavior}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### NFR-CACHE-1: Multi-Layer Caching Strategy
**Description**: Memory and distributed caching for product catalog

**Requirements**:
- [ ] L1 Cache (Memory): IMemoryCache for frequently accessed data, 5-minute TTL
- [ ] L2 Cache (Distributed): HybridCache with Redis for shared cache across instances
- [ ] Cache keys follow pattern: "{entity}:{id}" (e.g., "product:12345") or "{entity}:list:{page}:{pageSize}" (e.g., "product:list:1:20")
- [ ] TTL varies by data type:
  - Product details: 10 minutes
  - Product list: 5 minutes
  - Category tree: 1 hour (rarely changes)
  - User profile: 15 minutes
- [ ] Cache invalidation:
  - Product updated/deleted → Remove "product:{id}" and all "product:list:*" entries
  - Category changed → Remove "category:tree" entry
  - Manual invalidation endpoint: POST /api/admin/cache/invalidate with key pattern
- [ ] Cache-aside pattern: Check cache → if miss, query database → store in cache → return
- [ ] Circuit breaker on Redis: Fallback to database if Redis unavailable (degrade gracefully)
- [ ] ETags for HTTP caching: Product API returns ETag header, clients send If-None-Match for 304 Not Modified
- [ ] Stampede prevention: Use locking to prevent multiple simultaneous cache fills

**Implementation**:
// Program.cs
builder.Services.AddHybridCache(options =>
{
    options.MaximumPayloadBytes = 1024 * 1024; // 1 MB max
    options.MaximumKeyLength = 256;
    options.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(10),
        LocalCacheExpiration = TimeSpan.FromMinutes(5)
    };
});
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "ProductCatalog:";
});

// Service usage
public async Task<Product?> GetProductByIdAsync(int id, CancellationToken ct)
{
    return await _cache.GetOrCreateAsync(
        $"product:{id}",
        async token => await _repository.GetByIdAsync(id, token),
        new HybridCacheEntryOptions { Expiration = TimeSpan.FromMinutes(10) },
        ct
    );
}
```

---

## Pattern 7: Rate Limiting & Throttling

**When to Use**: Public APIs requiring abuse prevention

**Template Structure**:
```
### NFR-RL-X: Rate Limiting Requirements
**Description**: Request rate limiting to prevent abuse

**Requirements**:
- [ ] Rate Limit Policy: {requests per time window}
- [ ] Identification: {by IP, API key, user ID}
- [ ] Response: {429 status with Retry-After header}
- [ ] Bypass: {admin/internal exemptions}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### NFR-RL-1: API Rate Limiting Policy
**Description**: Rate limiting using ASP.NET Core 9 rate limiting middleware

**Requirements**:
- [ ] Anonymous users: 100 requests per minute per IP address
- [ ] Authenticated users: 1000 requests per minute per user ID
- [ ] Login endpoint: 5 requests per 15 minutes per email address
- [ ] Password reset: 3 requests per hour per email address
- [ ] Admin users: Exempt from rate limiting
- [ ] Response: 429 Too Many Requests with headers:
  - X-RateLimit-Limit: Maximum requests allowed
  - X-RateLimit-Remaining: Requests remaining in current window
  - X-RateLimit-Reset: Unix timestamp when limit resets
  - Retry-After: Seconds until retry allowed
- [ ] Sliding window algorithm for smooth rate limiting
- [ ] Distributed rate limiting using Redis for multi-instance deployments

**Implementation**:
// Program.cs
builder.Services.AddRateLimiter(options =>
{
    // Default policy for anonymous users
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var partition = userId ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

        return RateLimitPartition.GetSlidingWindowLimiter(partition, _ =>
            new SlidingWindowRateLimiterOptions
            {
                PermitLimit = userId != null ? 1000 : 100,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    // Specific policy for login endpoint
    options.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Request.Form["email"].ToString() ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(15)
            }));

    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers["Retry-After"] = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
            ? ((int)retryAfter.TotalSeconds).ToString()
            : "60";

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "rate_limit_exceeded",
            message = "Too many requests. Please try again later.",
            retryAfter = context.HttpContext.Response.Headers["Retry-After"]
        }, cancellationToken: ct);
    };
});

app.UseRateLimiter();

// Apply to specific endpoint
app.MapPost("/api/auth/login", LoginAsync).RequireRateLimiting("login");
```

---

## Pattern 8: Audit Logging & Compliance

**When to Use**: Systems requiring audit trails (financial, healthcare, GDPR)

**Template Structure**:
```
### NFR-AUDIT-X: Audit Logging Requirements
**Description**: Comprehensive audit trail for compliance

**Requirements**:
- [ ] Logged Events: {list events requiring audit}
- [ ] Audit Data: {what information to capture}
- [ ] Retention: {how long to retain logs}
- [ ] Access Control: {who can view audit logs}
- [ ] Compliance: {regulatory standards}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### NFR-AUDIT-1: Audit Logging for GDPR Compliance
**Description**: Comprehensive audit logging for data access and modifications

**Requirements**:
- [ ] Log all CRUD operations on User, Order, Payment entities
- [ ] Capture: User ID (who), Action (what), Entity ID (which), Timestamp (when), IP Address (where), Changes (old/new values)
- [ ] Log authentication events: Login success/failure, password reset, account lockout
- [ ] Log sensitive data access: Admin viewing user PII, bulk data exports
- [ ] Store audit logs in separate AuditLog table with retention:
  - Authentication events: 90 days
  - Data modifications: 7 years (financial records)
  - Data access logs: 1 year
- [ ] Audit logs immutable (append-only, no updates/deletes)
- [ ] Access control: Only Security Admin role can query audit logs
- [ ] Export capability: Audit logs exportable to JSON for compliance reporting
- [ ] Structured logging to Application Insights for real-time monitoring

**Implementation**:
// AuditLog entity
public class AuditLog
{
    public Guid Id { get; init; }
    public Guid? UserId { get; init; }
    public required string Action { get; init; } // "User.Update", "Order.Create"
    public required string EntityType { get; init; }
    public string? EntityId { get; init; }
    public DateTime Timestamp { get; init; }
    public string? IpAddress { get; init; }
    public string? Changes { get; init; } // JSON: {"Email": {"Old": "old@example.com", "New": "new@example.com"}}
    public required string UserAgent { get; init; }
}

// Audit interceptor
public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContext;

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        var entries = eventData.Context?.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList() ?? [];

        foreach (var entry in entries)
        {
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = GetCurrentUserId(),
                Action = $"{entry.Entity.GetType().Name}.{entry.State}",
                EntityType = entry.Entity.GetType().Name,
                EntityId = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString(),
                Timestamp = DateTime.UtcNow,
                IpAddress = _httpContext.HttpContext?.Connection.RemoteIpAddress?.ToString(),
                Changes = SerializeChanges(entry),
                UserAgent = _httpContext.HttpContext?.Request.Headers["User-Agent"].ToString() ?? "Unknown"
            };

            eventData.Context?.Set<AuditLog>().Add(auditLog);
        }

        return base.SavingChanges(eventData, result);
    }
}

// Register in Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .AddInterceptors(new AuditInterceptor(builder.Services.BuildServiceProvider().GetRequiredService<IHttpContextAccessor>()));
});
```

---

## Pattern 9: Integration with External Services

**When to Use**: APIs calling third-party services or legacy systems

**Template Structure**:
```
### FR-INT-X: External Service Integration
**Description**: Integration with external system

**Requirements**:
- [ ] Service Details: {name, protocol, authentication}
- [ ] Error Handling: {timeout, retry, circuit breaker}
- [ ] Data Mapping: {request/response transformation}
- [ ] Monitoring: {success rate, latency tracking}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### FR-INT-1: Payment Gateway Integration (Stripe)
**Description**: Process payments via Stripe API

**Requirements**:
- [ ] Create payment intent: POST to Stripe API /v1/payment_intents
- [ ] Confirm payment: POST to /v1/payment_intents/{id}/confirm
- [ ] Handle webhooks: POST /api/webhooks/stripe for payment success/failure events
- [ ] Authentication: Use Stripe secret key from Azure Key Vault, Bearer token auth
- [ ] Timeout: 10 seconds for payment intent creation, 30 seconds for confirmation
- [ ] Retry: 3 retries with exponential backoff for network failures
- [ ] Circuit breaker: Open after 5 consecutive failures, 60-second cooldown
- [ ] Idempotency: Use idempotency keys to prevent duplicate charges
- [ ] Error handling: Map Stripe errors to domain exceptions
  - card_declined → PaymentDeclinedException
  - insufficient_funds → InsufficientFundsException
  - rate_limit_error → Retry with backoff
- [ ] Logging: Log all API calls (request/response) with sensitive data (card numbers) masked
- [ ] Monitoring: Track payment success rate, average latency, error rate in Application Insights

**Implementation**:
// IPaymentGateway interface
public interface IPaymentGateway
{
    Task<PaymentResult> CreatePaymentAsync(PaymentRequest request, CancellationToken ct);
    Task<PaymentResult> ConfirmPaymentAsync(string paymentIntentId, CancellationToken ct);
    Task<bool> VerifyWebhookSignature(string payload, string signature);
}

// StripePaymentGateway with Polly policies
public class StripePaymentGateway : IPaymentGateway
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<StripePaymentGateway> _logger;

    public StripePaymentGateway(HttpClient httpClient, ILogger<StripePaymentGateway> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<PaymentResult> CreatePaymentAsync(PaymentRequest request, CancellationToken ct)
    {
        var idempotencyKey = Guid.NewGuid().ToString();
        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("amount", (request.Amount * 100).ToString("F0")),
            new KeyValuePair<string, string>("currency", request.Currency),
            new KeyValuePair<string, string>("payment_method", request.PaymentMethodId)
        });

        _httpClient.DefaultRequestHeaders.Add("Idempotency-Key", idempotencyKey);

        try
        {
            var response = await _httpClient.PostAsync("/v1/payment_intents", content, ct);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<StripePaymentIntent>(ct);
            _logger.LogInformation("Payment intent created: {PaymentIntentId}", result!.Id);

            return new PaymentResult(true, result.Id, result.Status);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.PaymentRequired)
        {
            _logger.LogWarning("Payment declined: {Message}", ex.Message);
            throw new PaymentDeclinedException("Card declined by issuer", ex);
        }
    }
}

// Register with Polly policies in Program.cs
builder.Services.AddHttpClient<IPaymentGateway, StripePaymentGateway>(client =>
{
    client.BaseAddress = new Uri("https://api.stripe.com");
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", builder.Configuration["Stripe:SecretKey"]);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.AddPolicyHandler(Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))))
.AddPolicyHandler(Policy
    .Handle<HttpRequestException>()
    .CircuitBreakerAsync(5, TimeSpan.FromSeconds(60)));
```

---

## Pattern 10: Background Jobs & Async Processing

**When to Use**: Long-running operations or scheduled tasks

**Template Structure**:
```
### FR-BG-X: Background Job Processing
**Description**: Async processing for long-running operations

**Requirements**:
- [ ] Job Type: {scheduled, event-driven, one-time}
- [ ] Trigger: {schedule, message queue, API call}
- [ ] Execution: {retry logic, timeout, concurrency}
- [ ] Monitoring: {job status, failure tracking}
```

**Concrete Example** (C# 13/.NET 9):
```csharp
### FR-BG-1: Order Report Generation Background Job
**Description**: Generate daily order reports and email to administrators

**Requirements**:
- [ ] Schedule: Daily at 2:00 AM UTC (IHostedService with Timer)
- [ ] Data source: Query Orders table for previous day (UTC date range)
- [ ] Report format: CSV file with columns: OrderId, CustomerId, Total, Status, CreatedAt
- [ ] Storage: Upload CSV to Azure Blob Storage in container "reports/orders/{yyyy-MM-dd}.csv"
- [ ] Notification: Send email to admin@company.com with download link
- [ ] Execution time limit: 10 minutes timeout
- [ ] Retry: 3 retries if database query fails or blob upload fails
- [ ] Concurrency: Single instance only (use distributed lock with Redis to prevent duplicate execution)
- [ ] Error handling: Log failures, send alert email to devops@company.com
- [ ] Monitoring: Log start time, end time, record count, file size to Application Insights

**Implementation**:
// OrderReportBackgroundService.cs
public class OrderReportBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OrderReportBackgroundService> _logger;
    private readonly IDistributedLockProvider _lockProvider;
    private readonly TimeSpan _interval = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var scheduledTime = new DateTime(now.Year, now.Month, now.Day, 2, 0, 0, DateTimeKind.Utc);
            if (now > scheduledTime)
                scheduledTime = scheduledTime.AddDays(1);

            var delay = scheduledTime - now;
            _logger.LogInformation("Next report generation scheduled for {ScheduledTime}", scheduledTime);

            await Task.Delay(delay, stoppingToken);

            // Acquire distributed lock to prevent duplicate execution
            await using var @lock = await _lockProvider.AcquireLockAsync("OrderReportGeneration", TimeSpan.FromMinutes(15), stoppingToken);

            if (@lock == null)
            {
                _logger.LogWarning("Could not acquire lock, another instance is processing");
                continue;
            }

            using var scope = _serviceProvider.CreateScope();
            var reportService = scope.ServiceProvider.GetRequiredService<IOrderReportService>();

            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                cts.CancelAfter(TimeSpan.FromMinutes(10)); // 10-minute timeout

                await reportService.GenerateAndEmailDailyReportAsync(DateTime.UtcNow.AddDays(-1).Date, cts.Token);
                _logger.LogInformation("Order report generated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate order report");
                await SendAlertEmailAsync("Order report generation failed", ex.Message);
            }
        }
    }
}

// Register in Program.cs
builder.Services.AddHostedService<OrderReportBackgroundService>();

// For message queue-based jobs, use Azure Service Bus or RabbitMQ with MassTransit:
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderPlacedConsumer>();
    x.UsingAzureServiceBus((context, cfg) =>
    {
        cfg.Host(builder.Configuration["AzureServiceBus:ConnectionString"]);
        cfg.ReceiveEndpoint("order-placed", e =>
        {
            e.ConfigureConsumer<OrderPlacedConsumer>(context);
        });
    });
});
```

---

## Usage Guidelines

1. **Copy-Paste Liberally**: These patterns are designed to be copied into your PRPs and customized
2. **Combine Patterns**: Many features require multiple patterns (e.g., CRUD + Validation + Caching)
3. **Adapt to Context**: Change entity names, endpoints, and business rules to match your domain
4. **Add Specificity**: The more specific your requirements, the better (exact endpoints, error codes, timeouts)
5. **Reference Standards**: Always specify C# 13/.NET 9 conventions, NuGet package versions, and architectural patterns

---

*These requirement patterns demonstrate C# 13/.NET 9 best practices and are designed for immediate use in your PRPs. Customize them to match your specific technical and business requirements.*
