# Test Patterns for PRPs

This reference provides reusable test patterns for C# 13/.NET 9 applications using xUnit, Moq, FluentAssertions, WebApplicationFactory, and other modern testing tools. Each pattern includes concrete examples you can adapt for your test suites.

---

## Pattern 1: Service Layer Unit Testing (AAA Pattern)

**When to Use**: Testing business logic in service classes with mocked dependencies

**Setup**: xUnit + Moq + FluentAssertions

**Template Structure**:
```csharp
public class {ServiceName}Tests
{
    [Fact]
    public async Task {MethodName}_{Scenario}_{ExpectedResult}()
    {
        // Arrange - Set up mocks and test data
        var mockDependency = new Mock<IDependency>();
        mockDependency.Setup(d => d.MethodAsync(It.IsAny<T>())).ReturnsAsync(expectedValue);
        var sut = new ServiceUnderTest(mockDependency.Object);

        // Act - Execute the method being tested
        var result = await sut.MethodAsync(input);

        // Assert - Verify the outcome
        result.Should().Be(expectedValue);
        mockDependency.Verify(d => d.MethodAsync(input), Times.Once);
    }
}
```

**Concrete Example**:
```csharp
public class AuthenticationServiceTests
{
    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsSuccessWithTokens()
    {
        // Arrange
        var mockUserRepo = new Mock<IUserRepository>();
        var mockTokenGen = new Mock<IJwtTokenGenerator>();
        var mockPasswordHasher = new Mock<IPasswordHasher<User>>();
        var mockLogger = new Mock<ILogger<AuthenticationService>>();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            PasswordHash = "hashed_password"
        };

        mockUserRepo
            .Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        mockPasswordHasher
            .Setup(h => h.VerifyHashedPassword(user, "hashed_password", "correct_password"))
            .Returns(PasswordVerificationResult.Success);

        mockTokenGen
            .Setup(t => t.GenerateAccessToken(user, It.IsAny<IEnumerable<string>>()))
            .Returns("access_token_123");

        mockTokenGen
            .Setup(t => t.GenerateRefreshToken())
            .Returns("refresh_token_456");

        var sut = new AuthenticationService(
            mockUserRepo.Object,
            mockTokenGen.Object,
            mockPasswordHasher.Object,
            Mock.Of<IEmailService>(),
            mockLogger.Object);

        // Act
        var result = await sut.LoginAsync("test@example.com", "correct_password");

        // Assert
        result.Success.Should().BeTrue();
        result.AccessToken.Should().Be("access_token_123");
        result.RefreshToken.Should().Be("refresh_token_456");
        result.ExpiresIn.Should().Be(900); // 15 minutes
        result.Error.Should().BeNull();

        // Verify interactions
        mockUserRepo.Verify(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()), Times.Once);
        mockPasswordHasher.Verify(h => h.VerifyHashedPassword(user, "hashed_password", "correct_password"), Times.Once);
        mockTokenGen.Verify(t => t.GenerateAccessToken(user, It.IsAny<IEnumerable<string>>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ReturnsFailure()
    {
        // Arrange
        var mockUserRepo = new Mock<IUserRepository>();
        var mockPasswordHasher = new Mock<IPasswordHasher<User>>();

        var user = new User { Email = "test@example.com", PasswordHash = "hashed_password" };
        mockUserRepo.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, "hashed_password", "wrong_password"))
            .Returns(PasswordVerificationResult.Failed);

        var sut = new AuthenticationService(
            mockUserRepo.Object,
            Mock.Of<IJwtTokenGenerator>(),
            mockPasswordHasher.Object,
            Mock.Of<IEmailService>(),
            Mock.Of<ILogger<AuthenticationService>>());

        // Act
        var result = await sut.LoginAsync("test@example.com", "wrong_password");

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("invalid");
        result.AccessToken.Should().BeNull();
        result.RefreshToken.Should().BeNull();
    }
}
```

---

## Pattern 2: Theory-Based Testing with Multiple Inputs

**When to Use**: Testing edge cases, null/empty values, boundary conditions

**Template Structure**:
```csharp
[Theory]
[InlineData({test_case_1_params})]
[InlineData({test_case_2_params})]
public async Task {MethodName}_WithInvalidInput_ThrowsException({params})
{
    // Arrange
    var sut = CreateSystemUnderTest();

    // Act & Assert
    await Assert.ThrowsAsync<ArgumentException>(() => sut.MethodAsync(params));
}
```

**Concrete Example**:
```csharp
public class ProductServiceTests
{
    [Theory]
    [InlineData(null, 10.99, "Electronics")] // Null name
    [InlineData("", 10.99, "Electronics")] // Empty name
    [InlineData("Product", 0, "Electronics")] // Zero price
    [InlineData("Product", -5, "Electronics")] // Negative price
    [InlineData("Product", 10.99, null)] // Null category
    [InlineData("Product", 10.99, "")] // Empty category
    public async Task CreateProductAsync_WithInvalidInput_ThrowsArgumentException(
        string name, decimal price, string category)
    {
        // Arrange
        var mockRepo = new Mock<IProductRepository>();
        var sut = new ProductService(mockRepo.Object, Mock.Of<ILogger<ProductService>>());

        // Act & Assert
        var act = () => sut.CreateProductAsync(name, price, category, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Theory]
    [MemberData(nameof(ValidProductTestCases))]
    public async Task CreateProductAsync_WithValidInput_CreatesProduct(
        string name, decimal price, string category, int expectedStock)
    {
        // Arrange
        var mockRepo = new Mock<IProductRepository>();
        mockRepo.Setup(r => r.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product p, CancellationToken ct) => p);

        var sut = new ProductService(mockRepo.Object, Mock.Of<ILogger<ProductService>>());

        // Act
        var result = await sut.CreateProductAsync(name, price, category, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(name);
        result.Price.Should().Be(price);
        result.Category.Should().Be(category);
        result.Stock.Should().Be(expectedStock);
    }

    public static IEnumerable<object[]> ValidProductTestCases()
    {
        yield return new object[] { "Laptop", 999.99m, "Electronics", 0 };
        yield return new object[] { "Book", 19.99m, "Literature", 0 };
        yield return new object[] { "Headphones", 79.99m, "Audio", 0 };
    }

    [Theory]
    [ClassData(typeof(BoundaryPriceTestData))]
    public async Task UpdatePriceAsync_WithBoundaryValues_HandlesCorrectly(
        decimal newPrice, bool shouldSucceed)
    {
        // Test boundary conditions...
    }
}

public class BoundaryPriceTestData : IEnumerable<object[]>
{
    public IEnumerator<object[]> GetEnumerator()
    {
        yield return new object[] { 0.01m, true }; // Minimum valid price
        yield return new object[] { 0m, false }; // Boundary: zero (invalid)
        yield return new object[] { -0.01m, false }; // Below boundary (invalid)
        yield return new object[] { 999999.99m, true }; // Maximum reasonable price
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
```

---

## Pattern 3: Integration Testing with WebApplicationFactory

**When to Use**: Testing API endpoints end-to-end with real HTTP requests

**Setup**: xUnit + WebApplicationFactory + FluentAssertions

**Template Structure**:
```csharp
public class {ControllerName}IntegrationTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task {HttpMethod}_{Endpoint}_{Scenario}_Returns{StatusCode}()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.{HttpMethod}Async("{endpoint}", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.{ExpectedStatus});
        var result = await response.Content.ReadFromJsonAsync<TResponse>();
        result.Should().NotBeNull();
    }
}
```

**Concrete Example**:
```csharp
public class AuthenticationEndpointsIntegrationTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task POST_Login_WithValidCredentials_Returns200WithTokens()
    {
        // Arrange
        var client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace production dependencies with test doubles
                services.RemoveAll<IEmailService>();
                services.AddSingleton<IEmailService, FakeEmailService>();
            });
        }).CreateClient();

        var request = new LoginRequest("test@example.com", "Test123!");

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<AuthenticationResponse>();
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.ExpiresIn.Should().Be(900);

        // Verify JWT token structure
        var tokenParts = result.AccessToken.Split('.');
        tokenParts.Should().HaveCount(3); // Header, Payload, Signature
    }

    [Fact]
    public async Task POST_Login_WithInvalidCredentials_Returns401()
    {
        // Arrange
        var client = factory.CreateClient();
        var request = new LoginRequest("test@example.com", "WrongPassword");

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Error.Should().Be("invalid_credentials");
        error.Message.Should().Contain("incorrect");
    }

    [Fact]
    public async Task GET_ProtectedEndpoint_WithoutToken_Returns401()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GET_ProtectedEndpoint_WithValidToken_Returns200()
    {
        // Arrange
        var client = factory.CreateClient();

        // First, login to get token
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("test@example.com", "Test123!"));
        var authResult = await loginResponse.Content.ReadFromJsonAsync<AuthenticationResponse>();

        // Add token to subsequent request
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", authResult!.AccessToken);

        // Act
        var response = await client.GetAsync("/api/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

// Custom WebApplicationFactory for integration tests
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove production database context
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Add in-memory database for testing
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase("IntegrationTestDb");
            });

            // Build service provider and seed test data
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
            SeedTestData(db);
        });
    }

    private static void SeedTestData(AppDbContext db)
    {
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            PasswordHash = HashPassword("Test123!"),
            EmailConfirmed = true
        });
        db.SaveChanges();
    }
}
```

---

## Pattern 4: Repository Layer Testing with In-Memory Database

**When to Use**: Testing data access logic without external database dependencies

**Setup**: xUnit + Entity Framework Core In-Memory Database + FluentAssertions

**Concrete Example**:
```csharp
public class UserRepositoryTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly UserRepository _repository;

    public UserRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AppDbContext(options);
        _repository = new UserRepository(_context);

        // Seed test data
        _context.Users.AddRange(
            new User { Id = Guid.NewGuid(), Email = "user1@example.com", DisplayName = "User One" },
            new User { Id = Guid.NewGuid(), Email = "user2@example.com", DisplayName = "User Two" },
            new User { Id = Guid.NewGuid(), Email = "user3@example.com", DisplayName = "User Three" }
        );
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetByEmailAsync_WithExistingEmail_ReturnsUser()
    {
        // Act
        var result = await _repository.GetByEmailAsync("user1@example.com", CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("user1@example.com");
        result.DisplayName.Should().Be("User One");
    }

    [Fact]
    public async Task GetByEmailAsync_WithNonExistentEmail_ReturnsNull()
    {
        // Act
        var result = await _repository.GetByEmailAsync("nonexistent@example.com", CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task AddAsync_WithValidUser_AddsToDatabase()
    {
        // Arrange
        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "newuser@example.com",
            DisplayName = "New User",
            PasswordHash = "hashed_password"
        };

        // Act
        var result = await _repository.AddAsync(newUser, CancellationToken.None);
        await _context.SaveChangesAsync();

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();

        var userInDb = await _context.Users.FindAsync(result.Id);
        userInDb.Should().NotBeNull();
        userInDb!.Email.Should().Be("newuser@example.com");
    }

    [Fact]
    public async Task UpdateAsync_ModifiesExistingUser()
    {
        // Arrange
        var user = await _repository.GetByEmailAsync("user1@example.com", CancellationToken.None);
        user!.DisplayName = "Updated Name";

        // Act
        await _repository.UpdateAsync(user, CancellationToken.None);
        await _context.SaveChangesAsync();

        // Assert
        var updatedUser = await _repository.GetByIdAsync(user.Id, CancellationToken.None);
        updatedUser!.DisplayName.Should().Be("Updated Name");
    }

    [Fact]
    public async Task DeleteAsync_RemovesUserFromDatabase()
    {
        // Arrange
        var user = await _repository.GetByEmailAsync("user1@example.com", CancellationToken.None);

        // Act
        await _repository.DeleteAsync(user!.Id, CancellationToken.None);
        await _context.SaveChangesAsync();

        // Assert
        var deletedUser = await _repository.GetByIdAsync(user.Id, CancellationToken.None);
        deletedUser.Should().BeNull();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
```

---

## Pattern 5: Authentication & Authorization Testing

**When to Use**: Testing security requirements and access control

**Concrete Example**:
```csharp
public class AuthorizationTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Theory]
    [InlineData("/api/admin/users", "User", HttpStatusCode.Forbidden)]
    [InlineData("/api/admin/users", "Admin", HttpStatusCode.OK)]
    [InlineData("/api/users/me", "User", HttpStatusCode.OK)]
    [InlineData("/api/users/me", "Guest", HttpStatusCode.Unauthorized)]
    public async Task ProtectedEndpoint_WithRole_ReturnsExpectedStatusCode(
        string endpoint, string role, HttpStatusCode expectedStatus)
    {
        // Arrange
        var client = factory.CreateClient();
        var token = GenerateFakeJwtToken(role);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await client.GetAsync(endpoint);

        // Assert
        response.StatusCode.Should().Be(expectedStatus);
    }

    [Fact]
    public async Task JwtToken_WithExpiredToken_Returns401()
    {
        // Arrange
        var client = factory.CreateClient();
        var expiredToken = GenerateExpiredJwtToken();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expiredToken);

        // Act
        var response = await client.GetAsync("/api/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task JwtToken_WithInvalidSignature_Returns401()
    {
        // Arrange
        var client = factory.CreateClient();
        var tamperedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature";
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tamperedToken);

        // Act
        var response = await client.GetAsync("/api/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private string GenerateFakeJwtToken(string role)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("test_secret_key_32_characters_long!"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: "test_issuer",
            audience: "test_audience",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

---

## Pattern 6: Performance & Load Testing with BenchmarkDotNet

**When to Use**: Measuring performance characteristics and detecting regressions

**Setup**: BenchmarkDotNet + xUnit

**Concrete Example**:
```csharp
[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net90)]
public class ProductServiceBenchmarks
{
    private ProductService _service = null!;
    private Mock<IProductRepository> _mockRepo = null!;

    [GlobalSetup]
    public void Setup()
    {
        _mockRepo = new Mock<IProductRepository>();
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(GenerateProducts(1000));

        _service = new ProductService(_mockRepo.Object, Mock.Of<ILogger<ProductService>>());
    }

    [Benchmark(Baseline = true)]
    public async Task GetAllProducts_WithoutCaching()
    {
        await _service.GetAllProductsAsync(CancellationToken.None);
    }

    [Benchmark]
    public async Task GetAllProducts_WithMemoryCache()
    {
        // Test cached version performance
        await _service.GetAllProductsWithCacheAsync(CancellationToken.None);
    }

    [Benchmark]
    [Arguments(10)]
    [Arguments(100)]
    [Arguments(1000)]
    public async Task FilterProducts_ByCategory(int productCount)
    {
        _mockRepo.Setup(r => r.GetByCategoryAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(GenerateProducts(productCount));

        await _service.GetProductsByCategoryAsync("Electronics", CancellationToken.None);
    }

    private List<Product> GenerateProducts(int count)
    {
        return Enumerable.Range(1, count)
            .Select(i => new Product
            {
                Id = i,
                Name = $"Product {i}",
                Price = 10.99m * i,
                Category = i % 2 == 0 ? "Electronics" : "Books"
            })
            .ToList();
    }
}

// Run benchmarks
// dotnet run -c Release --project Benchmarks.csproj

// Expected Output:
// |                        Method | productCount |      Mean |     Error |    StdDev | Allocated |
// |------------------------------ |------------- |----------:|----------:|----------:|----------:|
// |  GetAllProducts_WithoutCaching|            - |  12.34 ms |  0.245 ms |  0.217 ms |   1.2 KB |
// |     GetAllProducts_WithMemoryCache|            - |   0.45 ms |  0.009 ms |  0.008 ms |   0.3 KB |
// |   FilterProducts_ByCategory   |           10 |   1.23 ms |  0.024 ms |  0.021 ms |   0.5 KB |
// |   FilterProducts_ByCategory   |          100 |   5.67 ms |  0.112 ms |  0.105 ms |   2.1 KB |
// |   FilterProducts_ByCategory   |         1000 |  45.89 ms |  0.912 ms |  0.853 ms |  15.3 KB |
```

---

## Pattern 7: Error Handling & Exception Testing

**When to Use**: Verifying proper exception handling and error responses

**Concrete Example**:
```csharp
public class ErrorHandlingTests
{
    [Fact]
    public async Task ServiceMethod_WithNullArgument_ThrowsArgumentNullException()
    {
        // Arrange
        var service = new ProductService(Mock.Of<IProductRepository>(), Mock.Of<ILogger<ProductService>>());

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            service.CreateProductAsync(null!, 10.99m, "Electronics", CancellationToken.None));
    }

    [Fact]
    public async Task ServiceMethod_WhenRepositoryThrows_PropagatesException()
    {
        // Arrange
        var mockRepo = new Mock<IProductRepository>();
        mockRepo.Setup(r => r.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateException("Database error"));

        var service = new ProductService(mockRepo.Object, Mock.Of<ILogger<ProductService>>());

        // Act & Assert
        await Assert.ThrowsAsync<DbUpdateException>(() =>
            service.CreateProductAsync("Product", 10.99m, "Electronics", CancellationToken.None));
    }

    [Fact]
    public async Task API_WithBusinessRuleViolation_Returns400WithErrorDetails()
    {
        // Arrange
        var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();
        var invalidProduct = new CreateProductRequest("", -10, ""); // Violates multiple rules

        // Act
        var response = await client.PostAsJsonAsync("/api/products", invalidProduct);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ValidationErrorResponse>();
        error.Should().NotBeNull();
        error!.Errors.Should().ContainKey("Name");
        error.Errors.Should().ContainKey("Price");
        error.Errors.Should().ContainKey("Category");
        error.Errors["Price"].Should().Contain("must be greater than 0");
    }

    [Fact]
    public async Task API_WhenDatabaseUnavailable_Returns503()
    {
        // Test service unavailable response when database is down...
    }
}
```

---

## Pattern 8: Asynchronous & Concurrency Testing

**When to Use**: Testing thread safety and async behavior

**Concrete Example**:
```csharp
public class ConcurrencyTests
{
    [Fact]
    public async Task Service_WithConcurrentRequests_HandlesCorrectly()
    {
        // Arrange
        var service = CreateProductService();
        var tasks = new List<Task<Product>>();

        // Act - Simulate 100 concurrent requests
        for (int i = 0; i < 100; i++)
        {
            var productName = $"Product {i}";
            tasks.Add(service.CreateProductAsync(productName, 10.99m, "Electronics", CancellationToken.None));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        results.Should().HaveCount(100);
        results.Should().OnlyContain(p => p != null);
        results.Select(p => p.Name).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task Cache_WithConcurrentAccess_RemainsConsistent()
    {
        // Arrange
        var cacheService = CreateCacheService();
        var tasks = new List<Task>();

        // Act - Simulate simultaneous cache reads and writes
        for (int i = 0; i < 50; i++)
        {
            tasks.Add(cacheService.SetAsync($"key{i}", $"value{i}"));
            tasks.Add(cacheService.GetAsync($"key{i}"));
        }

        await Task.WhenAll(tasks);

        // Assert - Verify cache consistency
        for (int i = 0; i < 50; i++)
        {
            var value = await cacheService.GetAsync($"key{i}");
            value.Should().Be($"value{i}");
        }
    }

    [Fact(Timeout = 5000)] // Fail if test takes longer than 5 seconds
    public async Task AsyncMethod_CompletesWithinTimeout()
    {
        // Arrange
        var service = CreateSlowService();

        // Act
        var result = await service.ProcessAsync(CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
    }
}
```

---

## Pattern 9: Mock Verification & Interaction Testing

**When to Use**: Verifying method calls, argument capturing, and interaction patterns

**Concrete Example**:
```csharp
public class InteractionTests
{
    [Fact]
    public async Task Service_CallsDependenciesInCorrectOrder()
    {
        // Arrange
        var mockRepo = new Mock<IProductRepository>();
        var mockCache = new Mock<ICacheService>();
        var mockLogger = new Mock<ILogger<ProductService>>();
        var callSequence = new MockSequence();

        mockCache.InSequence(callSequence)
            .Setup(c => c.GetAsync<Product>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        mockRepo.InSequence(callSequence)
            .Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Product { Id = 1, Name = "Product" });

        mockCache.InSequence(callSequence)
            .Setup(c => c.SetAsync(It.IsAny<string>(), It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var service = new ProductService(mockRepo.Object, mockCache.Object, mockLogger.Object);

        // Act
        await service.GetProductByIdAsync(1, CancellationToken.None);

        // Assert
        mockCache.Verify(c => c.GetAsync<Product>("product:1", It.IsAny<CancellationToken>()), Times.Once);
        mockRepo.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        mockCache.Verify(c => c.SetAsync("product:1", It.IsAny<Product>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Service_LogsCorrectInformation()
    {
        // Arrange
        var mockLogger = new Mock<ILogger<ProductService>>();
        var service = new ProductService(Mock.Of<IProductRepository>(), mockLogger.Object);

        // Act
        await service.CreateProductAsync("Test Product", 10.99m, "Electronics", CancellationToken.None);

        // Assert
        mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Creating product")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task Service_CapturesArgumentsCorrectly()
    {
        // Arrange
        var mockRepo = new Mock<IProductRepository>();
        Product? capturedProduct = null;

        mockRepo.Setup(r => r.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .Callback<Product, CancellationToken>((p, ct) => capturedProduct = p)
            .ReturnsAsync((Product p, CancellationToken ct) => p);

        var service = new ProductService(mockRepo.Object, Mock.Of<ILogger<ProductService>>());

        // Act
        await service.CreateProductAsync("Laptop", 999.99m, "Electronics", CancellationToken.None);

        // Assert
        capturedProduct.Should().NotBeNull();
        capturedProduct!.Name.Should().Be("Laptop");
        capturedProduct.Price.Should().Be(999.99m);
        capturedProduct.Category.Should().Be("Electronics");
    }
}
```

---

## Pattern 10: Test Data Builders & Object Mothers

**When to Use**: Creating reusable test data factories for complex objects

**Concrete Example**:
```csharp
// Test Data Builder Pattern
public class ProductBuilder
{
    private int _id = 1;
    private string _name = "Default Product";
    private decimal _price = 10.99m;
    private string _category = "Electronics";
    private int _stock = 100;

    public ProductBuilder WithId(int id)
    {
        _id = id;
        return this;
    }

    public ProductBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public ProductBuilder WithPrice(decimal price)
    {
        _price = price;
        return this;
    }

    public ProductBuilder WithCategory(string category)
    {
        _category = category;
        return this;
    }

    public ProductBuilder WithStock(int stock)
    {
        _stock = stock;
        return this;
    }

    public ProductBuilder WithOutOfStock()
    {
        _stock = 0;
        return this;
    }

    public ProductBuilder AsLowStock()
    {
        _stock = 5;
        return this;
    }

    public Product Build()
    {
        return new Product
        {
            Id = _id,
            Name = _name,
            Price = _price,
            Category = _category,
            Stock = _stock
        };
    }
}

// Object Mother Pattern
public static class ProductMother
{
    public static Product CreateDefault() => new ProductBuilder().Build();

    public static Product CreateLaptop() =>
        new ProductBuilder()
            .WithName("Laptop")
            .WithPrice(999.99m)
            .WithCategory("Electronics")
            .WithStock(50)
            .Build();

    public static Product CreateBook() =>
        new ProductBuilder()
            .WithName("C# 13 in Depth")
            .WithPrice(49.99m)
            .WithCategory("Books")
            .WithStock(200)
            .Build();

    public static Product CreateOutOfStockProduct() =>
        new ProductBuilder()
            .WithOutOfStock()
            .Build();

    public static List<Product> CreateProductList(int count) =>
        Enumerable.Range(1, count)
            .Select(i => new ProductBuilder().WithId(i).WithName($"Product {i}").Build())
            .ToList();
}

// Usage in tests
public class ProductServiceTestsWithBuilders
{
    [Fact]
    public async Task CreateProduct_WithDefaultProduct_Succeeds()
    {
        // Arrange
        var product = ProductMother.CreateDefault();
        var service = CreateProductService();

        // Act
        var result = await service.CreateProductAsync(product.Name, product.Price, product.Category, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateStock_WithLowStockProduct_TriggersAlert()
    {
        // Arrange
        var product = new ProductBuilder()
            .WithName("Limited Edition Item")
            .AsLowStock()
            .Build();

        // Test low stock alert logic...
    }

    [Fact]
    public async Task GetProducts_WithMultipleProducts_ReturnsPaginatedList()
    {
        // Arrange
        var products = ProductMother.CreateProductList(100);
        // Use generated products in test...
    }
}
```

---

## Usage Guidelines

1. **Start with AAA Pattern**: Arrange, Act, Assert is the foundation of readable tests
2. **Use Theory for Edge Cases**: Test multiple inputs efficiently with [Theory] and [InlineData]
3. **Integration Tests for Critical Paths**: Test complete user journeys end-to-end
4. **Mock External Dependencies**: Use Moq to isolate unit of work
5. **Verify Interactions**: Use Verify() to ensure dependencies are called correctly
6. **Build Test Data Helpers**: Create builders and object mothers for complex test data
7. **Name Tests Clearly**: {MethodName}_{Scenario}_{ExpectedResult} format
8. **Test Both Paths**: Happy path AND error scenarios
9. **Measure Coverage**: Aim for 90%+ for critical business logic
10. **Keep Tests Fast**: Unit tests should run in milliseconds, integration tests in seconds

---

*These test patterns demonstrate modern C# 13/.NET 9 testing practices using xUnit, Moq, FluentAssertions, and WebApplicationFactory. Adapt them to your specific testing needs and scenarios.*
