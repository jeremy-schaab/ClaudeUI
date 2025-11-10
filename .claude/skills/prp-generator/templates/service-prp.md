# Product Requirement Prompt - User Authentication Service

> **💡 Template Usage**: This is a complete example of a backend service PRP demonstrating C# 13/.NET 9 best practices. Customize sections marked with 💡 to match your specific requirements. Use as both a learning tool and starting point.

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Service Name** | 💡 User Authentication Service |
| **Service Type** | Backend REST API Service |
| **Complexity** | Medium |
| **Estimated Effort** | 40 hours (5 days) |
| **Technology Stack** | C# 13, .NET 9, ASP.NET Core Minimal APIs, Entity Framework Core 9, JWT Bearer |
| **Primary Consumers** | Web and mobile applications requiring user authentication |
| **Business Value** | Enables secure user access control across all client applications |

**Service Overview**: Provides JWT-based authentication with email/password login, token refresh capabilities, and secure password reset functionality. Implements industry-standard security practices including rate limiting, account lockout, and secure token management.

---

## Current State Analysis

### Existing Components
💡 **Discovered via `Glob **/Models/User.cs` and `Grep "interface IUser"`**:

- **`src/Core/Models/User.cs`**: User entity with Id, Email, PasswordHash, EmailConfirmed, LockoutEnd
- **`src/Data/Repositories/IUserRepository.cs`**: User data access with GetByEmailAsync, UpdateAsync
- **`src/Core/Interfaces/IEmailService.cs`**: Email sending for notifications

### Dependencies
- **Entity Framework Core 9.0**: Database ORM
- **Microsoft.AspNetCore.Authentication.JwtBearer 9.0**: JWT token handling
- **Microsoft.AspNetCore.Identity 9.0**: Password hashing and user management
- **System.IdentityModel.Tokens.Jwt**: Token generation and validation

### Gaps (What Needs to Be Built)
- Authentication service implementing `IAuthenticationService`
- JWT token generation service implementing `IJwtTokenGenerator`
- Login endpoint: `POST /api/auth/login`
- Token refresh endpoint: `POST /api/auth/refresh`
- Password reset request endpoint: `POST /api/auth/password-reset/request`
- Password reset confirm endpoint: `POST /api/auth/password-reset/confirm`
- Token validation middleware
- RefreshToken database table and repository

---

## Functional Requirements

### FR-1: User Login with Email/Password
**Priority**: Must-have

**Description**: Users authenticate using email and password credentials, receiving JWT access and refresh tokens upon successful validation.

**Acceptance Criteria**:
- [ ] User submits email and password to `POST /api/auth/login`
- [ ] System validates credentials against database using `IUserRepository`
- [ ] On success: Returns 200 OK with JSON: `{"accessToken": "...", "refreshToken": "...", "expiresIn": 900}`
- [ ] On failure: Returns 401 Unauthorized with JSON: `{"error": "invalid_credentials", "message": "Email or password is incorrect"}`
- [ ] Failed login attempts logged to `ILogger<AuthenticationService>` for security monitoring
- [ ] Passwords validated using `Identity.PasswordHasher` with PBKDF2

**Business Rules**:
- Access tokens (JWT) expire after 15 minutes
- Refresh tokens expire after 7 days
- Maximum 5 failed attempts before 15-minute account lockout
- Lockout period doubles after each subsequent lockout (15m → 30m → 1h → 2h → 4h)
- Successful login resets failed attempt counter

### FR-2: JWT Token Refresh
**Priority**: Must-have

**Description**: Users obtain new access tokens using valid refresh tokens without re-entering credentials.

**Acceptance Criteria**:
- [ ] User submits refresh token to `POST /api/auth/refresh`
- [ ] System validates refresh token signature, expiration, and revocation status
- [ ] On success: Returns 200 OK with new access token and refresh token
- [ ] On failure: Returns 401 Unauthorized requiring full re-authentication
- [ ] Old refresh token invalidated (one-time use)
- [ ] Refresh token rotation implemented for security

**Business Rules**:
- Refresh tokens are single-use (invalidated after successful refresh)
- Refresh token family tracked to detect token theft
- If token reuse detected: Invalidate entire token family and force re-authentication
- New refresh token issued with each access token refresh

### FR-3: Password Reset Request
**Priority**: Must-have

**Description**: Users request password reset link sent to registered email address.

**Acceptance Criteria**:
- [ ] User submits email to `POST /api/auth/password-reset/request`
- [ ] System generates secure reset token (cryptographically random, 256-bit)
- [ ] Reset link sent to email via `IEmailService`
- [ ] Returns 200 OK regardless of email existence (prevent user enumeration)
- [ ] Reset token expires after 1 hour
- [ ] Reset token stored hashed in database

**Business Rules**:
- Always return success response to prevent email enumeration attacks
- Rate limit: Maximum 3 password reset requests per email per hour
- Reset tokens are single-use
- Previous reset tokens for same user invalidated when new request made

---

## Technical Design

### Service Layer Components

#### AuthenticationService.cs
**Location**: `src/Services/Authentication/AuthenticationService.cs`
**Namespace**: `YourApp.Services.Authentication`
**Implements**: `IAuthenticationService`
**Dependencies**:
- `IUserRepository` - User data access
- `IJwtTokenGenerator` - JWT token creation
- `IPasswordHasher<User>` - Password hashing (ASP.NET Core Identity)
- `IEmailService` - Email notifications
- `ILogger<AuthenticationService>` - Structured logging

**Interface Definition**:
```csharp
public interface IAuthenticationService
{
    Task<AuthenticationResult> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);

    Task<AuthenticationResult> RefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);

    Task<Result> RequestPasswordResetAsync(
        string email,
        CancellationToken cancellationToken = default);

    Task<Result> ResetPasswordAsync(
        string token,
        string newPassword,
        CancellationToken cancellationToken = default);
}

public record AuthenticationResult(
    bool Success,
    string? AccessToken,
    string? RefreshToken,
    int ExpiresIn,
    string? Error);
```

#### JwtTokenGenerator.cs
**Location**: `src/Services/Authentication/JwtTokenGenerator.cs`
**Implements**: `IJwtTokenGenerator`
**Configuration**: `JwtSettings` from appsettings.json

```csharp
public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user, IEnumerable<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}
```

### API Layer

#### Minimal API Endpoints
**Location**: `src/Api/Endpoints/AuthenticationEndpoints.cs`
**Route Prefix**: `/api/auth`

```csharp
public static class AuthenticationEndpoints
{
    public static RouteGroupBuilder MapAuthenticationEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/login", LoginAsync)
            .WithName("Login")
            .WithTags("Authentication")
            .Produces<AuthenticationResponse>(StatusCodes.Status200OK)
            .Produces<ErrorResponse>(StatusCodes.Status401Unauthorized);

        group.MapPost("/refresh", RefreshTokenAsync)
            .WithName("RefreshToken")
            .WithTags("Authentication");

        group.MapPost("/password-reset/request", RequestPasswordResetAsync)
            .WithName("RequestPasswordReset")
            .WithTags("Authentication");

        return group;
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        IAuthenticationService authService,
        CancellationToken ct)
    {
        var result = await authService.LoginAsync(request.Email, request.Password, ct);
        return result.Success
            ? Results.Ok(new AuthenticationResponse(result.AccessToken!, result.RefreshToken!, result.ExpiresIn))
            : Results.Unauthorized(new ErrorResponse("invalid_credentials", result.Error!));
    }
}

// DTOs
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record PasswordResetRequest(string Email);
public record AuthenticationResponse(string AccessToken, string RefreshToken, int ExpiresIn);
public record ErrorResponse(string Error, string Message);
```

### Database Changes

#### Migration: AddRefreshTokensTable
**Location**: `src/Data/Migrations/{timestamp}_AddRefreshTokensTable.cs`

```csharp
public partial class AddRefreshTokensTable : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "RefreshTokens",
            columns: table => new
            {
                Id = table.Column<Guid>(nullable: false),
                UserId = table.Column<Guid>(nullable: false),
                TokenHash = table.Column<string>(maxLength: 256, nullable: false),
                ExpiresAt = table.Column<DateTime>(nullable: false),
                CreatedAt = table.Column<DateTime>(nullable: false),
                RevokedAt = table.Column<DateTime>(nullable: true),
                TokenFamily = table.Column<string>(maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                table.ForeignKey("FK_RefreshTokens_Users", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("IX_RefreshTokens_UserId", "RefreshTokens", "UserId");
        migrationBuilder.CreateIndex("IX_RefreshTokens_TokenHash", "RefreshTokens", "TokenHash");
        migrationBuilder.CreateIndex("IX_RefreshTokens_TokenFamily", "RefreshTokens", "TokenFamily");
        migrationBuilder.CreateIndex("IX_RefreshTokens_ExpiresAt", "RefreshTokens", "ExpiresAt");
    }
}
```

---

## Non-Functional Requirements

### NFR-1: Security
- [ ] Passwords hashed using ASP.NET Core Identity `PasswordHasher` (PBKDF2, 10,000 iterations minimum)
- [ ] JWT tokens signed using HMACSHA256 with 256-bit secret from Azure Key Vault
- [ ] No secrets in code or configuration files (User Secrets locally, Key Vault in production)
- [ ] SQL injection prevented via Entity Framework Core parameterized queries
- [ ] HTTPS required for all endpoints (enforced via `UseHttpsRedirection` middleware)
- [ ] CORS configured to allow only trusted origins
- [ ] Rate limiting implemented (ASP.NET Core 9 rate limiting middleware): 5 login attempts per 15 minutes per IP

### NFR-2: Performance
- [ ] Login response time p95 < 200ms
- [ ] Token refresh response time p95 < 100ms
- [ ] Database queries optimized with indexes on UserId, TokenHash, TokenFamily
- [ ] JWT validation is stateless (no database lookup per request)
- [ ] Password hashing uses async I/O to prevent thread pool starvation

### NFR-3: Observability
- [ ] Structured logging with `ILogger<T>` for all authentication operations
- [ ] Log login attempts (success and failure) with user ID and IP address (hashed for privacy)
- [ ] Log token refresh events with user ID
- [ ] Log password reset requests with email (hashed for privacy)
- [ ] Application Insights integration for production monitoring
- [ ] Metrics tracked: Login success rate, login latency p95/p99, token refresh rate

---

## Test Requirements

### Unit Tests (xUnit + Moq + FluentAssertions)

**Location**: `tests/Services.Tests/Authentication/AuthenticationServiceTests.cs`

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

        var user = new User { Id = Guid.NewGuid(), Email = "test@example.com", PasswordHash = "hashed" };
        mockUserRepo.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, "hashed", "password123"))
            .Returns(PasswordVerificationResult.Success);
        mockTokenGen.Setup(t => t.GenerateAccessToken(user, It.IsAny<IEnumerable<string>>()))
            .Returns("access_token_123");

        var sut = new AuthenticationService(mockUserRepo.Object, mockTokenGen.Object,
            mockPasswordHasher.Object, Mock.Of<IEmailService>(), Mock.Of<ILogger<AuthenticationService>>());

        // Act
        var result = await sut.LoginAsync("test@example.com", "password123");

        // Assert
        result.Success.Should().BeTrue();
        result.AccessToken.Should().Be("access_token_123");
        result.ExpiresIn.Should().Be(900);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ReturnsFailure()
    {
        // Test invalid password scenario...
    }

    [Theory]
    [InlineData(null, "password")]
    [InlineData("", "password")]
    [InlineData("email", null)]
    [InlineData("email", "")]
    public async Task LoginAsync_WithInvalidInput_ThrowsArgumentException(string email, string password)
    {
        // Test validation...
    }
}
```

### Integration Tests (WebApplicationFactory)

**Location**: `tests/Api.Tests/Endpoints/AuthenticationEndpointsTests.cs`

```csharp
public class AuthenticationEndpointsTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task POST_Login_WithValidCredentials_Returns200WithTokens()
    {
        // Arrange
        var client = factory.CreateClient();
        var request = new LoginRequest("test@example.com", "password123");

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthenticationResponse>();
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.ExpiresIn.Should().Be(900);
    }
}
```

**Coverage Target**: 90% minimum

---

## Quality Gates

### Entry Gate: PRP Completeness ✅
- [x] Feature summary complete with business value
- [x] Current state analysis references actual discovered files
- [x] Functional requirements enumerated (FR-1, FR-2, FR-3)
- [x] Non-functional requirements cover security, performance, observability
- [x] Technical design specifies exact file paths and namespaces
- [x] Acceptance criteria are testable and measurable
- [x] Test requirements include unit and integration scenarios

### Implementation Gate: Code Quality
**Critical (must pass)**:
- [ ] All components from technical design implemented
- [ ] Unit test coverage ≥ 90%
- [ ] No critical security vulnerabilities (OWASP Top 10 checked)
- [ ] No blocking synchronous calls in async methods
- [ ] All public APIs have XML documentation
- [ ] Dependency injection configured in Program.cs
- [ ] Input validation at API boundary

**Major (should pass 85%)**:
- [ ] SOLID principles followed (SRP, OCP, LSP, ISP, DIP)
- [ ] C# 13/.NET 9 conventions (file-scoped namespaces, nullable reference types)
- [ ] Structured logging with proper context
- [ ] Custom exceptions for domain errors (AuthenticationException)
- [ ] No code duplication (DRY principle)
- [ ] Cyclomatic complexity ≤ 10 per method

### Exit Gate: Deployment Readiness
- [ ] All acceptance criteria met and verified
- [ ] All tests passing (unit + integration)
- [ ] Database migrations tested (up and down)
- [ ] API documentation generated (Swagger UI accessible at /swagger)
- [ ] No pending TODOs or FIXMEs in production code
- [ ] Configuration externalized (no hardcoded values)
- [ ] Deployment checklist complete

---

## Agent Delegation Strategy

### Phase 1: Database Design
**Agent**: `database-engineer` (Riley)
**Responsibility**: Design RefreshTokens table with proper indexes
**Deliverable**: EF Core migration file

### Phase 2: Service Implementation
**Agent**: `backend-developer` (Jordan)
**Responsibility**: Implement AuthenticationService and JwtTokenGenerator
**Deliverable**: Complete C# 13/.NET 9 implementation with unit tests (≥90% coverage)

### Phase 3: API Implementation
**Agent**: `api-developer` (Skyler)
**Responsibility**: Implement authentication endpoints (Minimal APIs)
**Deliverable**: API endpoints with OpenAPI documentation

### Phase 4: Security Review
**Agent**: `security-specialist` (Alex)
**Responsibility**: Security audit focusing on authentication vulnerabilities (OWASP Top 10)
**Deliverable**: Security validation report

### Phase 5: Code Review
**Agent**: `code-reviewer` (Avery)
**Responsibility**: Review for quality, standards, and best practices
**Deliverable**: Code quality report with severity ratings (critical/major/minor)

### Phase 6: Integration Testing
**Agent**: `qa-engineer` (Parker)
**Responsibility**: Run integration tests and verify acceptance criteria
**Deliverable**: Test execution report with coverage metrics

### Phase 7: Documentation
**Agent**: `technical-writer` (Sage)
**Responsibility**: Generate API documentation and usage examples
**Deliverable**: OpenAPI/Swagger documentation and README

---

## Configuration Example

**appsettings.json**:
```json
{
  "JwtSettings": {
    "Secret": "{{FROM_AZURE_KEY_VAULT}}",
    "Issuer": "https://api.yourapp.com",
    "Audience": "https://app.yourapp.com",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "RateLimiting": {
    "LoginAttemptsPerWindow": 5,
    "WindowSizeMinutes": 15
  }
}
```

---

## 💡 Customization Checklist

When adapting this template for your service:

- [ ] Replace "User Authentication Service" with your service name
- [ ] Update Current State Analysis with your actual discovered files
- [ ] Modify functional requirements (FR-1, FR-2, FR-3) to match your needs
- [ ] Adjust technical design file paths to match your project structure
- [ ] Update namespaces to match your project naming conventions
- [ ] Customize quality gates based on your team's standards
- [ ] Modify agent delegation based on available agents
- [ ] Update configuration to match your environment (Azure, AWS, etc.)
- [ ] Adjust performance requirements to match your SLAs
- [ ] Customize test scenarios for your specific business logic

---

*This template demonstrates C# 13/.NET 9 best practices for a production-ready authentication service, including security-first design, comprehensive testing, and observability. Use as a learning tool and starting point for your own service PRPs.*
