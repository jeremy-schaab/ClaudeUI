# .NET Error Codes Reference

Quick reference for common .NET compiler, MSBuild, NuGet, and runtime errors with resolutions.

## Table of Contents
- [Compiler Errors (CS####)](#compiler-errors-cs)
- [MSBuild Errors (MSB####)](#msbuild-errors-msb)
- [NuGet Errors (NU####)](#nuget-errors-nu)
- [Runtime Errors](#runtime-errors)

---

## Compiler Errors (CS####)

### CS0103: The name 'X' does not exist in the current context
**Cause**: Variable, type, or member not declared or not in scope

**Fix**:
1. Check variable is declared before use
2. Add missing using statement
3. Check namespace and type name spelling
4. Verify project reference is added

**Example**:
```csharp
// ❌ Error
public void Method()
{
    logger.LogInformation("Test");  // CS0103: 'logger' not declared
}

// ✅ Fix
private readonly ILogger _logger;

public void Method()
{
    _logger.LogInformation("Test");
}
```

### CS0246: The type or namespace name 'X' could not be found
**Cause**: Type or namespace not available or missing reference

**Fix**:
1. Add missing using statement
2. Add project or package reference
3. Check type name spelling and namespace
4. Run `dotnet restore`
5. Check target framework compatibility

**Example**:
```csharp
// ❌ Error
public class MyController : ControllerBase  // CS0246

// ✅ Fix - Add using
using Microsoft.AspNetCore.Mvc;

public class MyController : ControllerBase
```

### CS1061: 'X' does not contain a definition for 'Y'
**Cause**: Method or property doesn't exist on type

**Fix**:
1. Check method/property name spelling
2. Verify correct type (not base class)
3. Add missing extension method using
4. Check if member is from newer/older version

**Example**:
```csharp
// ❌ Error
string text = "hello";
text.ToTitleCase();  // CS1061

// ✅ Fix
using System.Globalization;
string text = "hello";
CultureInfo.CurrentCulture.TextInfo.ToTitleCase(text);
```

### CS0029: Cannot implicitly convert type 'X' to 'Y'
**Cause**: Type mismatch without implicit conversion

**Fix**:
1. Cast explicitly if conversion is valid
2. Change return type to match
3. Use correct type initially
4. Add conversion method

**Example**:
```csharp
// ❌ Error
int number = "123";  // CS0029

// ✅ Fix
int number = int.Parse("123");
// or
int number = Convert.ToInt32("123");
```

### CS0266: Cannot implicitly convert type 'X' to 'Y'. An explicit conversion exists
**Cause**: Explicit cast required

**Fix**:
1. Add explicit cast
2. Use conversion method if safer

**Example**:
```csharp
// ❌ Error
int number = 123.45;  // CS0266

// ✅ Fix
int number = (int)123.45;
// or (safer)
int number = Convert.ToInt32(123.45);
```

### CS0161: Not all code paths return a value
**Cause**: Method doesn't return value in all branches

**Fix**:
1. Add return statement to all code paths
2. Add default return at end
3. Change return type to void if appropriate

**Example**:
```csharp
// ❌ Error
public string GetValue(int type)
{
    if (type == 1)
        return "One";
    // CS0161: Missing return for other cases
}

// ✅ Fix
public string GetValue(int type)
{
    if (type == 1)
        return "One";
    return "Unknown";
}
// or use switch expression
public string GetValue(int type) => type switch
{
    1 => "One",
    _ => "Unknown"
};
```

### CS0019: Operator 'X' cannot be applied to operands of type 'Y' and 'Z'
**Cause**: Invalid operator for types

**Fix**:
1. Use correct operator for types
2. Convert types appropriately
3. Implement operator overload if custom type

**Example**:
```csharp
// ❌ Error
string result = "hello" - "world";  // CS0019

// ✅ Fix
string result = "hello".Replace("world", "");
```

### CS0119: 'X' is a type, which is not valid in the given context
**Cause**: Using type name where instance expected

**Fix**:
1. Create instance with new
2. Use static member if that's the intent
3. Fix typo in member name

**Example**:
```csharp
// ❌ Error
var result = DateTime.AddDays(5);  // CS0119

// ✅ Fix
var result = DateTime.Now.AddDays(5);
```

### CS0019: Operator '==' cannot be applied to operands of type 'X' and 'Y'
**Cause**: Comparing incompatible types

**Fix**:
1. Convert types to same type
2. Use appropriate comparison method
3. Fix logic error

**Example**:
```csharp
// ❌ Error
if (myString == 123)  // CS0019

// ✅ Fix
if (myString == "123")
// or
if (int.Parse(myString) == 123)
```

---

## MSBuild Errors (MSB####)

### MSB3073: The command "X" exited with code Y
**Cause**: Pre/post-build event command failed

**Fix**:
1. Check command syntax and paths
2. Verify script files exist and have permissions
3. Check for platform-specific issues (Windows/Linux)
4. Review command output for specific error
5. Use absolute paths or $(ProjectDir) variable

**Example**:
```xml
<!-- ❌ Error: Script not found -->
<PostBuildEvent>
  scripts/deploy.bat
</PostBuildEvent>

<!-- ✅ Fix: Use full path -->
<PostBuildEvent>
  "$(ProjectDir)scripts\deploy.bat" "$(TargetDir)"
</PostBuildEvent>
```

### MSB3644: The reference assemblies for framework 'X' were not found
**Cause**: Target framework not installed

**Fix**:
1. Install required .NET SDK version
2. Change target framework to installed version
3. Update global.json if SDK version specified
4. Run `dotnet --list-sdks` to see installed SDKs

**Example**:
```xml
<!-- ❌ Error: .NET 9 not installed -->
<TargetFramework>net9.0</TargetFramework>

<!-- ✅ Fix: Use installed version -->
<TargetFramework>net8.0</TargetFramework>
```

### MSB4062: The "X" task could not be loaded
**Cause**: MSBuild task assembly missing or incorrect

**Fix**:
1. Restore NuGet packages: `dotnet restore`
2. Update MSBuild or .NET SDK
3. Remove problematic task reference
4. Clear obj/ and bin/ folders and rebuild

### MSB3021: Unable to copy file "X" to "Y"
**Cause**: File locked or permissions issue

**Fix**:
1. Close applications using the file
2. Check file permissions
3. Kill running processes: `dotnet build-server shutdown`
4. Delete bin/ and obj/ folders

### MSB4019: The imported project "X" was not found
**Cause**: Missing import file or incorrect path

**Fix**:
1. Check import path is correct
2. Restore NuGet packages
3. Verify package is installed
4. Use relative path or $(MSBuildExtensionsPath)

---

## NuGet Errors (NU####)

### NU1101: Unable to find package 'X'
**Cause**: Package doesn't exist or source not configured

**Fix**:
1. Check package name and version
2. Verify NuGet.config has correct sources
3. Check package exists on source
4. Try `dotnet restore --force`
5. Clear cache: `dotnet nuget locals all --clear`

**Example**:
```bash
# Check sources
dotnet nuget list source

# Add source if needed
dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org

# Restore with diagnostics
dotnet restore --verbosity detailed
```

### NU1102: Unable to find package 'X' with version 'Y'
**Cause**: Specific version doesn't exist

**Fix**:
1. Check available versions on NuGet.org
2. Update version to available one
3. Use floating version: `1.0.*`
4. Check if version was unpublished

**Example**:
```xml
<!-- ❌ Error: Version doesn't exist -->
<PackageReference Include="Newtonsoft.Json" Version="99.0.0" />

<!-- ✅ Fix: Use valid version -->
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
```

### NU1605: Detected package downgrade
**Cause**: Dependency conflict causing downgrade

**Fix**:
1. Add explicit reference to higher version
2. Update conflicting packages
3. Check transitive dependencies
4. Use `<PackageReference Update>` in Directory.Build.props

**Example**:
```xml
<!-- ✅ Fix: Explicitly reference higher version -->
<ItemGroup>
  <PackageReference Include="System.Text.Json" Version="8.0.0" />
</ItemGroup>
```

### NU1608: Detected package version outside of dependency constraint
**Cause**: Package version doesn't satisfy dependency requirements

**Fix**:
1. Update to version that satisfies constraint
2. Update dependent package
3. Check for breaking changes

---

## Runtime Errors

### NullReferenceException
**Cause**: Accessing member of null object

**Fix**:
1. Use null-conditional operators: `obj?.Method()`
2. Check for null before access: `if (obj != null)`
3. Use null-coalescing: `obj ?? defaultValue`
4. Enable nullable reference types
5. **NEVER** null-check DI-injected dependencies (trust the container)

**Example**:
```csharp
// ❌ Error prone
string result = user.Name.ToUpper();  // NullReferenceException if user or Name is null

// ✅ Fix: Null-conditional and coalescing
string result = user?.Name?.ToUpper() ?? "Unknown";

// ❌ WRONG: Don't null-check DI parameters
public Service(ILogger logger)
{
    _logger = logger ?? throw new ArgumentNullException(nameof(logger));
}

// ✅ CORRECT: Trust DI container
public Service(ILogger logger)
{
    _logger = logger;
}
```

### InvalidOperationException: Sequence contains no elements
**Cause**: LINQ operation on empty collection

**Fix**:
1. Use `FirstOrDefault()` instead of `First()`
2. Check `Any()` before operation
3. Provide default value with DefaultIfEmpty()

**Example**:
```csharp
// ❌ Error
var item = collection.First();  // InvalidOperationException if empty

// ✅ Fix
var item = collection.FirstOrDefault();
// or
if (collection.Any())
{
    var item = collection.First();
}
```

### ObjectDisposedException: Cannot access a disposed object
**Cause**: Using object after Dispose()

**Fix**:
1. Use `using` statement for IDisposable
2. Check IsDisposed property if available
3. Don't store reference beyond scope
4. Use async disposal for async resources

**Example**:
```csharp
// ❌ Error
var stream = new FileStream(path, FileMode.Open);
stream.Dispose();
stream.Read(buffer, 0, buffer.Length);  // ObjectDisposedException

// ✅ Fix
using var stream = new FileStream(path, FileMode.Open);
stream.Read(buffer, 0, buffer.Length);
```

### ArgumentNullException: Value cannot be null
**Cause**: Null passed to method that doesn't accept null

**Fix**:
1. Check for null before passing
2. Use nullable reference types
3. Provide default value
4. Add required member annotation

**Example**:
```csharp
// ❌ Error
ProcessData(null);  // ArgumentNullException

// ✅ Fix: Check before calling
if (data != null)
{
    ProcessData(data);
}

// or: Use required members
public class Request
{
    public required string Data { get; init; }
}
```

### TaskCanceledException: A task was canceled
**Cause**: Async operation canceled

**Fix**:
1. Handle cancellation with try-catch
2. Check CancellationToken.IsCancellationRequested
3. Pass cancellation token properly
4. Don't swallow cancellation exceptions

**Example**:
```csharp
// ✅ Proper cancellation handling
try
{
    await LongRunningOperationAsync(cancellationToken);
}
catch (OperationCanceledException)
{
    // Log and handle cancellation
    _logger.LogInformation("Operation was canceled");
}
```

---

## Quick Diagnostic Commands

### Check SDK Versions
```bash
dotnet --list-sdks
dotnet --version
```

### Restore and Clean
```bash
dotnet restore
dotnet clean
dotnet build-server shutdown
```

### Clear Caches
```bash
# Clear NuGet cache
dotnet nuget locals all --clear

# Clear build cache
rm -rf bin/ obj/
```

### Build with Diagnostics
```bash
dotnet build --verbosity detailed
dotnet build /p:RunAnalyzers=true
```

### Check References
```bash
dotnet list package
dotnet list reference
```

---

## Tips for Error Resolution

1. **Read the full error message** - includes file, line, and context
2. **Check inner exceptions** - root cause often nested
3. **Use verbosity flags** - `--verbosity detailed` for more info
4. **Clean and restore first** - resolves many strange errors
5. **Update packages** - fixes often in newer versions
6. **Check for breaking changes** - when updating major versions
7. **Review recent changes** - error often in latest changes
8. **Isolate the problem** - comment out code to find source
9. **Check documentation** - official docs have solutions
10. **Search error code** - others have likely encountered it

---

## Resources

- [.NET Error Codes Documentation](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/)
- [MSBuild Error Reference](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-errors)
- [NuGet Error Reference](https://learn.microsoft.com/en-us/nuget/reference/errors-and-warnings/)
- [.NET Runtime Exceptions](https://learn.microsoft.com/en-us/dotnet/standard/exceptions/)
