# Claude.md - C# 12/13 Features and Style Guidelines

## Table of Contents
- [C# 12 Features](#c-12-features)
- [C# 13 Features](#c-13-features)
- [General Style Guidelines](#general-style-guidelines)
- [Formatting Guidelines](#formatting-guidelines)
- [Best Practices](#best-practices)

---

## C# 12 Features

### 1. Primary Constructors for Classes and Structs
```csharp
// Primary constructor on a class
public class Person(string firstName, string lastName)
{
    public string FullName => $"{firstName} {lastName}";
    
    // Constructor parameters are in scope for the entire class
    public void Display() => Console.WriteLine($"{firstName} {lastName}");
}

// Primary constructor with inheritance
public class Employee(string firstName, string lastName, int id) 
    : Person(firstName, lastName)
{
    public int Id { get; } = id;
}
```

### 2. Collection Expressions
```csharp
// Simplified collection initialization
int[] numbers = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob", "Charlie"];
Span<int> span = [1, 2, 3];

// Spread operator with collections
int[] moreNumbers = [0, ..numbers, 6, 7];
List<string> allNames = [..names, "David", "Eve"];

// Works with custom collections implementing collection builder pattern
HashSet<int> set = [1, 2, 3, 4, 5];
```

### 3. Inline Arrays
```csharp
// Fixed-size inline array struct
[System.Runtime.CompilerServices.InlineArray(10)]
public struct Buffer10<T>
{
    private T _element0;
}

// Usage
var buffer = new Buffer10<int>();
for (int i = 0; i < 10; i++)
{
    buffer[i] = i * 2;
}
```

### 4. Optional Lambda Expression Parameters
```csharp
// Lambda parameters can now have default values
var incrementBy = (int value, int increment = 1) => value + increment;

Console.WriteLine(incrementBy(5));      // 6
Console.WriteLine(incrementBy(5, 3));   // 8

// With method group conversions
var multiply = (int a, int b = 2) => a * b;
Func<int, int> doubler = multiply;
```

### 5. ref readonly Parameters
```csharp
public void ProcessLargeStruct(ref readonly LargeStruct data)
{
    // Can read data efficiently without copying
    // Cannot modify data
    Console.WriteLine(data.Value);
}

// Useful for large value types to avoid copying
public ref readonly LargeStruct GetData(ref readonly LargeStruct input)
{
    return ref input;
}
```

### 6. Alias Any Type with 'using'
```csharp
// Alias any type, including tuples and pointers
using Point = (int X, int Y);
using StringList = System.Collections.Generic.List<string>;
using unsafe IntPtr = int*;
using Matrix = float[,];

// Global using alias
global using UserId = System.Guid;

// Use the aliases
Point origin = (0, 0);
StringList names = ["Alice", "Bob"];
UserId id = Guid.NewGuid();
```

### 7. Experimental Attribute
```csharp
// Mark APIs as experimental
[Experimental("MYEXP001")]
public class ExperimentalFeature
{
    public void NewMethod() { }
}

// Compiler will warn when using experimental features
// Suppress with: #pragma warning disable MYEXP001
```

### 8. Interceptors (Experimental)
```csharp
// Interceptors allow compile-time method interception
// Must be enabled with <Features>InterceptorsPreview</Features>

[InterceptsLocation("Program.cs", line: 10, column: 5)]
public static void InterceptedMethod(this Example obj)
{
    // This replaces the original method call at compile time
}
```

---

## C# 13 Features

### 1. params Collections
```csharp
// params now works with any collection type, not just arrays
public void ProcessItems(params List<string> items)
{
    foreach (var item in items)
        Console.WriteLine(item);
}

// Works with Span<T> for better performance
public void ProcessNumbers(params ReadOnlySpan<int> numbers)
{
    foreach (var num in numbers)
        Console.WriteLine(num);
}

// Call with collection expressions
ProcessItems(["one", "two", "three"]);
ProcessNumbers([1, 2, 3, 4, 5]);
```

### 2. New Lock Object
```csharp
// New System.Threading.Lock type for better performance
private readonly Lock _lock = new();

public void ThreadSafeMethod()
{
    // Compiler recognizes Lock type and generates optimized code
    lock (_lock)
    {
        // Critical section
    }
}

// Scoped lock with using
public void AlternativePattern()
{
    using (_lock.EnterScope())
    {
        // Critical section
    }
}
```

### 3. New Escape Sequence \e
```csharp
// \e represents the escape character (0x1B)
string ansiRed = "\e[31m";
string ansiReset = "\e[0m";
string coloredText = $"{ansiRed}Error!{ansiReset}";

// Useful for terminal colors and control sequences
Console.WriteLine($"\e[1;32mSuccess!\e[0m");  // Bold green text
```

### 4. Method Group Natural Type Improvements
```csharp
// Better type inference for method groups
var functions = [Console.WriteLine, Console.Write];  // Inferred as Action<string?>[]

// Improved overload resolution
var comparison = string.Compare;  // Better inference of which overload

// Conditional method groups
var action = condition ? Method1 : Method2;  // Both must have compatible signatures
```

### 5. Implicit Indexer Access in Object Initializers
```csharp
public class DataContainer
{
    private int[] _data = new int[10];
    public int this[int index]
    {
        get => _data[index];
        set => _data[index] = value;
    }
}

// Can now use indexer in object initializer
var container = new DataContainer
{
    [0] = 10,
    [1] = 20,
    [2] = 30
};

// Works with dictionaries naturally
var dict = new Dictionary<string, int>
{
    ["one"] = 1,
    ["two"] = 2,
    ["three"] = 3
};
```

### 6. ref and unsafe in Async Methods and Iterators
```csharp
// Can now use ref locals and ref structs in async methods (with restrictions)
public async Task ProcessDataAsync()
{
    // ref locals allowed before first await
    ref int local = ref GetReference();
    local = 42;
    
    await Task.Delay(100);
    
    // Cannot use ref local after await
}

// Unsafe code in iterators (with restrictions)
public IEnumerable<int> GetNumbers()
{
    unsafe
    {
        int* ptr = stackalloc int[10];
        // Process data before yield
    }
    
    yield return 1;
    yield return 2;
}
```

### 7. ref struct Interfaces
```csharp
// ref structs can now implement interfaces
public ref struct RefContainer : IDisposable
{
    private Span<byte> _data;
    
    public RefContainer(Span<byte> data)
    {
        _data = data;
    }
    
    public void Dispose()
    {
        _data.Clear();
    }
}

// Allows use in generic contexts with anti-constraint
public void Process<T>(T item) where T : IDisposable, allows ref struct
{
    using (item)
    {
        // Process
    }
}
```

### 8. Partial Properties
```csharp
// Partial class with partial property
public partial class Person
{
    public partial string Name { get; set; }
}

public partial class Person
{
    private string _name = string.Empty;
    
    public partial string Name
    {
        get => _name;
        set => _name = value ?? string.Empty;
    }
}
```

### 9. Overload Resolution Priority
```csharp
public class Api
{
    // Lower priority - will be chosen last
    [OverloadResolutionPriority(1)]
    public void Method(object obj) { }
    
    // Higher priority - will be chosen first
    [OverloadResolutionPriority(10)]
    public void Method(string text) { }
    
    // Default priority (5)
    public void Method(int number) { }
}
```

---

## General Style Guidelines

### Naming Conventions

```csharp
// PascalCase for public members, types, and namespaces
public class CustomerService
{
    public string CustomerName { get; set; }
    public void ProcessOrder() { }
}

// camelCase for private fields and local variables
private readonly ILogger _logger;
private int _retryCount;
void ProcessData()
{
    int itemCount = 0;
    string userName = "Alice";
}

// Interface names start with 'I'
public interface IRepository<T> { }

// Async methods end with 'Async'
public async Task<string> GetDataAsync() { }

// Constants and static readonly fields in PascalCase
public const int MaxRetries = 3;
public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);
```

### File-Scoped Namespaces
```csharp
// Prefer file-scoped namespaces (C# 10+)
namespace MyApp.Services;

public class OrderService
{
    // Class content
}
```

### Target-Typed New
```csharp
// Prefer target-typed new when type is obvious
List<string> names = new();
Dictionary<int, string> lookup = new();
var service = new CustomerService();  // Use var when creating new instances
```

### Pattern Matching
```csharp
// Use pattern matching extensively
public string Describe(object obj) => obj switch
{
    null => "null",
    string s => $"String: {s}",
    int n when n > 0 => $"Positive: {n}",
    int n => $"Non-positive: {n}",
    IEnumerable<int> nums => $"Numbers: {string.Join(", ", nums)}",
    _ => "Unknown"
};

// Property patterns
if (person is { Age: > 18, Name: not null })
{
    // Process adult with name
}

// List patterns
int[] numbers = [1, 2, 3, 4, 5];
if (numbers is [1, 2, .. var rest, 5])
{
    // Matches arrays starting with 1, 2 and ending with 5
}
```

### Null Handling
```csharp
// Use nullable reference types
#nullable enable

public class Service
{
    // Explicit nullable annotations
    public string? GetOptionalData() => null;
    public string GetRequiredData() => "data";
    
    // Null-coalescing operators
    public void Process(string? input)
    {
        string value = input ?? "default";
        string result = input?.ToUpper() ?? "EMPTY";
        
        // Null-coalescing assignment
        input ??= "default value";
    }
    
    // Null-forgiving operator when you know better than compiler
    public void UseNonNull(string? maybeNull)
    {
        if (ValidateNotNull(maybeNull))
        {
            int length = maybeNull!.Length;  // We know it's not null
        }
    }
    
    // IMPORTANT: Never null-check constructor parameters for DI-injected dependencies
    // ❌ WRONG - Don't do this:
    // public Service(ILogger logger) 
    // {
    //     _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    // }
    //
    // ✅ CORRECT - Trust the DI container:
    // public Service(ILogger logger) 
    // {
    //     _logger = logger;
    // }
}
```

---

## Formatting Guidelines

### Indentation and Braces
```csharp
// Use 4 spaces for indentation (not tabs)
// Opening braces on new line (Allman style)
public class Example
{
    public void Method()
    {
        if (condition)
        {
            // Code block
        }
    }
}

// Single-line blocks can omit braces for simple statements
if (condition)
    DoSomething();

// But prefer braces for clarity and maintainability
if (condition)
{
    DoSomething();
}
```

### Line Length and Wrapping
```csharp
// Keep lines under 120 characters when possible
// Break long method calls
var result = await service
    .ConfigureOptions(options)
    .WithTimeout(TimeSpan.FromSeconds(30))
    .ExecuteAsync(cancellationToken);

// Break long parameter lists
public void MethodWithManyParameters(
    string firstName,
    string lastName,
    int age,
    string address,
    string phoneNumber)
{
    // Implementation
}
```

### Expression Bodied Members
```csharp
// Use expression body when implementation is single expression
public string FullName => $"{FirstName} {LastName}";
public void PrintName() => Console.WriteLine(FullName);
public Customer? FindById(int id) => _customers.FirstOrDefault(c => c.Id == id);

// Constructor expression body
public Person(string name) => Name = name;

// Destructor expression body
~ResourceHandler() => Dispose(false);
```

### Using Statements
```csharp
// Order using statements
// 1. System namespaces first
// 2. Other external namespaces
// 3. Internal namespaces
// 4. Aliases last

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using MyApp.Core;
using MyApp.Services;
using UserId = System.Guid;

// File-scoped using for common namespaces
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;
```

---

## Best Practices

### 1. Use Modern Language Features
```csharp
// Prefer records for immutable data
public record Person(string Name, int Age);

// Use init-only properties
public class Configuration
{
    public string ConnectionString { get; init; } = string.Empty;
    public int Timeout { get; init; } = 30;
}

// Required members
public class Request
{
    public required string Id { get; init; }
    public required string Endpoint { get; init; }
}
```

### 2. Async/Await Best Practices
```csharp
// Always use async/await for I/O operations
public async Task<Data> GetDataAsync()
{
    // Use ConfigureAwait(false) in library code
    var result = await HttpClient.GetAsync(url).ConfigureAwait(false);
    return await ProcessAsync(result).ConfigureAwait(false);
}

// Avoid async void except for event handlers
private async void Button_Click(object sender, EventArgs e)
{
    try
    {
        await ProcessAsync();
    }
    catch (Exception ex)
    {
        // Handle exception
    }
}

// Use ValueTask for hot paths
public ValueTask<int> GetCachedValueAsync()
{
    return _cache.TryGetValue(key, out var value)
        ? new ValueTask<int>(value)
        : new ValueTask<int>(LoadValueAsync());
}
```

### 3. LINQ Usage
```csharp
// Prefer method syntax for simple queries
var adults = people.Where(p => p.Age >= 18).OrderBy(p => p.Name);

// Use query syntax for complex joins
var query = from order in orders
            join customer in customers on order.CustomerId equals customer.Id
            where order.Total > 100
            select new { customer.Name, order.Total };

// Use appropriate LINQ methods
var first = collection.FirstOrDefault();  // Not: collection.Where(x => ...).FirstOrDefault()
var any = collection.Any(x => x > 5);     // Not: collection.Where(x => x > 5).Count() > 0
```

### 4. Exception Handling
```csharp
// Use specific exception types
public void Validate(string input)
{
    if (string.IsNullOrEmpty(input))
        throw new ArgumentNullException(nameof(input));
    
    if (input.Length > MaxLength)
        throw new ArgumentException($"Input exceeds maximum length of {MaxLength}", nameof(input));
}

// Use exception filters
try
{
    await ProcessAsync();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
{
    // Handle 404 specifically
}
catch (HttpRequestException ex)
{
    // Handle other HTTP exceptions
}
```

### 5. Resource Management
```csharp
// Always dispose IDisposable resources
using var stream = new FileStream(path, FileMode.Open);
using var reader = new StreamReader(stream);
var content = await reader.ReadToEndAsync();

// Implement IAsyncDisposable for async cleanup
public class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await CleanupAsync();
        GC.SuppressFinalize(this);
    }
}

// Use await using for async disposal
await using var resource = new AsyncResource();
await resource.ProcessAsync();
```

### 6. Performance Considerations
```csharp
// Use Span<T> and Memory<T> for efficient memory usage
public void ProcessBuffer(ReadOnlySpan<byte> buffer)
{
    // Process without allocation
}

// Use StringComparison for string operations
bool equal = string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

// Prefer StringBuilder for multiple concatenations
var sb = new StringBuilder();
foreach (var item in items)
{
    sb.AppendLine(item.ToString());
}

// Use ArrayPool for temporary arrays
var pool = ArrayPool<byte>.Shared;
var buffer = pool.Rent(1024);
try
{
    // Use buffer
}
finally
{
    pool.Return(buffer);
}
```

### 7. Testing Considerations
```csharp
// Design for testability - use dependency injection
public class Service
{
    private readonly IRepository _repository;
    private readonly ILogger<Service> _logger;
    
    // DO NOT null-check DI-injected dependencies - the container ensures non-null
    public Service(IRepository repository, ILogger<Service> logger)
    {
        _repository = repository;  // Direct assignment, no null checks
        _logger = logger;
    }
}

// Make methods virtual for mocking if not using interfaces
public virtual async Task<Result> ProcessAsync() { }

// Use internal for test access with InternalsVisibleTo
[assembly: InternalsVisibleTo("MyApp.Tests")]
internal class InternalComponent { }
```

---

## Summary

When using C# 12 and 13:
- Embrace collection expressions `[1, 2, 3]` for cleaner code
- Use primary constructors to reduce boilerplate
- Leverage pattern matching extensively
- Always enable nullable reference types
- Prefer modern async patterns with ValueTask where appropriate
- Use file-scoped namespaces and global usings
- Follow consistent naming conventions (PascalCase for public, camelCase for private)
- Design with testability and performance in mind
- Take advantage of new performance features like `params` collections and the new Lock type

Remember: Write code for readability and maintainability first, optimize when necessary.