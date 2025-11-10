# Refactoring Safety Practices

Comprehensive guide to safe refactoring practices that prevent breaking existing functionality.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Before Refactoring](#before-refactoring)
3. [During Refactoring](#during-refactoring)
4. [After Refactoring](#after-refactoring)
5. [Version Control Strategies](#version-control-strategies)
6. [Rollback Procedures](#rollback-procedures)

---

## Core Principles

### The Golden Rules

1. **Never refactor and add features simultaneously**
   - Refactor OR add features, never both at once
   - Makes it easier to identify what broke

2. **Always have tests before refactoring**
   - Tests are your safety net
   - If no tests exist, write them first

3. **Take small steps**
   - Refactor incrementally
   - Commit after each successful step

4. **Run tests frequently**
   - After every small change
   - Before every commit

5. **Keep a clean working directory**
   - Commit often
   - Makes rollback easier

---

## Before Refactoring

### Step 1: Ensure Tests Exist

**Check test coverage**:
```bash
dotnet test /p:CollectCoverage=true
```

**Target**: Minimum 80% coverage for code you're refactoring

**If no tests exist**:
```csharp
// Write characterization tests first
[Fact]
public void ProcessOrder_WithValidOrder_ReturnsSuccess()
{
    // Arrange
    var order = new Order { /* valid order */ };

    // Act
    var result = _orderService.ProcessOrderAsync(order).Result;

    // Assert
    Assert.True(result.IsSuccess);
}

[Fact]
public void ProcessOrder_WithNullOrder_ReturnsFailure()
{
    // Act
    var result = _orderService.ProcessOrderAsync(null).Result;

    // Assert
    Assert.False(result.IsSuccess);
    Assert.Contains("null", result.Error, StringComparison.OrdinalIgnoreCase);
}
```

### Step 2: Run All Tests

**Ensure baseline**:
```bash
dotnet test --no-build
```

All tests must pass before you start refactoring.

### Step 3: Create Feature Branch

**Branch naming convention**:
```bash
git checkout -b refactor/order-service-srp
```

### Step 4: Document Current Behavior

**Before you start, document:**
- What the code currently does
- Any known bugs or issues
- Performance characteristics
- Dependencies

**Example**:
```markdown
## Current Behavior - OrderService.ProcessOrderAsync

### Functionality
- Validates order
- Calculates total
- Applies discounts
- Processes payment
- Updates inventory
- Sends confirmation email

### Performance
- Average: 250ms
- 95th percentile: 500ms

### Known Issues
- Doesn't handle concurrent modifications
- Email sending can timeout

### Dependencies
- IOrderRepository
- IPaymentGateway
- IEmailService
```

---

## During Refactoring

### Step 1: Refactor in Small Steps

**Example refactoring sequence**:

1. **Extract validation method** (5 minutes)
2. **Run tests** (30 seconds)
3. **Commit** if tests pass
4. **Extract calculation method** (5 minutes)
5. **Run tests** (30 seconds)
6. **Commit** if tests pass
7. Continue...

### Step 2: Use Compiler as Guide

**Leverage compiler errors**:
- Rename methods/classes
- Let compiler find all usages
- Update each usage
- Compile and test

**Example workflow**:
```csharp
// 1. Create new method
private ValidationResult ValidateOrder(Order order) { /* implementation */ }

// 2. Call new method alongside old code
var validationResult = ValidateOrder(order);
if (!validationResult.IsValid)
    return OrderResult.Failure(validationResult.Error);

// Old validation code still here

// 3. Run tests - should pass

// 4. Remove old validation code

// 5. Run tests again
```

### Step 3: Maintain Behavior

**Never change behavior during refactoring**:

❌ **Bad** (refactoring + behavior change):
```csharp
// Before
public void SaveOrder(Order order)
{
    _orderRepo.Save(order);
}

// After - WRONG: Added validation (behavior change)
public void SaveOrder(Order order)
{
    if (order == null) throw new ArgumentNullException(nameof(order));
    _orderRepo.Save(order);
}
```

✅ **Good** (refactoring only):
```csharp
// Before
public void SaveOrder(Order order)
{
    _orderRepo.Save(order);
}

// After - Extracted to method, same behavior
public void SaveOrder(Order order)
{
    SaveOrderInternal(order);
}

private void SaveOrderInternal(Order order)
{
    _orderRepo.Save(order);
}
```

### Step 4: Run Tests Frequently

**After every change**:
```bash
# Quick test run
dotnet test --filter "FullyQualifiedName~OrderService"

# Full test suite
dotnet test
```

### Step 5: Commit Incrementally

**Commit message format**:
```bash
git commit -m "refactor: extract order validation to separate method"
git commit -m "refactor: extract discount calculation logic"
git commit -m "refactor: apply SRP to OrderService"
```

**Good commit characteristics**:
- ✅ Small, focused changes
- ✅ Tests pass
- ✅ Descriptive message
- ✅ Reversible

---

## After Refactoring

### Step 1: Verify All Tests Pass

```bash
# Run full test suite
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true
```

### Step 2: Check Coverage Maintained

**Coverage should not decrease**:
```bash
# Before refactoring: 85% coverage
# After refactoring: Should be >= 85%
```

If coverage dropped, add tests for new methods.

### Step 3: Performance Testing

**Compare before/after performance**:

```csharp
[Fact]
public async Task ProcessOrder_Performance_Test()
{
    var order = CreateTestOrder();
    var stopwatch = Stopwatch.StartNew();

    await _orderService.ProcessOrderAsync(order);

    stopwatch.Stop();
    Assert.True(stopwatch.ElapsedMilliseconds < 500,
        $"Took {stopwatch.ElapsedMilliseconds}ms, expected < 500ms");
}
```

### Step 4: Code Review

**Self-review checklist**:
- [ ] All tests pass
- [ ] No behavior changes
- [ ] Coverage maintained or improved
- [ ] Performance not degraded
- [ ] Code more maintainable
- [ ] SOLID principles applied
- [ ] No code smells introduced

### Step 5: Update Documentation

**Update relevant documentation**:
- API documentation
- Architecture diagrams
- README files
- Code comments (if needed)

---

## Version Control Strategies

### Strategy 1: Feature Branch

**Workflow**:
```bash
# Create feature branch
git checkout -b refactor/order-service

# Make incremental commits
git add OrderService.cs
git commit -m "refactor: extract validation method"

# More commits...

# Merge when done
git checkout main
git merge refactor/order-service
```

### Strategy 2: Commit Frequently

**Small, reversible commits**:
```bash
git commit -m "refactor: extract ValidateOrder method"
git commit -m "refactor: extract CalculateTotal method"
git commit -m "refactor: extract ApplyDiscount method"
git commit -m "refactor: simplify ProcessOrder orchestration"
```

### Strategy 3: Squash Before Merge (Optional)

**If you want clean history**:
```bash
# Interactive rebase to squash commits
git rebase -i main

# In editor, squash related commits
pick abc1234 refactor: extract ValidateOrder method
squash def5678 refactor: fix ValidateOrder bug
squash ghi9012 refactor: improve ValidateOrder tests

# Results in single commit:
# "refactor: extract and improve order validation"
```

---

## Rollback Procedures

### Scenario 1: Tests Fail After Change

**Immediate rollback**:
```bash
# Undo last commit (keep changes)
git reset HEAD~1

# Or discard changes entirely
git reset --hard HEAD~1
```

### Scenario 2: Discovered Issue After Merge

**Revert merge commit**:
```bash
# Find merge commit
git log --oneline --graph

# Revert the merge
git revert -m 1 <merge-commit-hash>
```

### Scenario 3: Need to Isolate Problem

**Git bisect**:
```bash
# Start bisect
git bisect start

# Mark current as bad
git bisect bad

# Mark known good commit
git bisect good abc1234

# Git will checkout commits for testing
# Run tests and mark each commit
git bisect good  # if tests pass
git bisect bad   # if tests fail

# Git will find the breaking commit
```

---

## Refactoring Patterns by Risk

### Low Risk (Safe to do anytime)

1. **Rename variables/methods**
   - Use IDE refactoring tools
   - Compiler finds all usages

2. **Extract method**
   - Small, focused extraction
   - Easy to verify

3. **Introduce explaining variable**
   - Doesn't change logic
   - Makes code clearer

### Medium Risk (Need good tests)

1. **Extract class**
   - Splits responsibilities
   - More moving parts

2. **Move method**
   - Changes object structure
   - Requires careful testing

3. **Replace conditional with polymorphism**
   - Changes design significantly
   - Needs comprehensive tests

### High Risk (Requires extra caution)

1. **Change method signature**
   - Affects all callers
   - May break external clients

2. **Remove parameter**
   - Could break callers
   - Check all usages carefully

3. **Pull up / push down in hierarchy**
   - Affects inheritance
   - Can break LSP

---

## Continuous Integration

### Pre-commit Checks

**.git/hooks/pre-commit**:
```bash
#!/bin/bash
echo "Running tests before commit..."
dotnet test --no-build
if [ $? -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi
echo "Tests passed. Committing..."
```

### Build Pipeline

**Azure Pipelines / GitHub Actions**:
```yaml
trigger:
  - main
  - feature/*

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: DotNetCoreCLI@2
  inputs:
    command: 'restore'

- task: DotNetCoreCLI@2
  inputs:
    command: 'build'
    arguments: '--configuration Release'

- task: DotNetCoreCLI@2
  inputs:
    command: 'test'
    arguments: '--configuration Release --collect:"XPlat Code Coverage"'

- task: PublishCodeCoverageResults@1
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: '$(Agent.TempDirectory)/**/coverage.cobertura.xml'
```

---

## Safety Checklist

Before pushing refactored code:

### Tests
- [ ] All existing tests pass
- [ ] New tests added for extracted methods
- [ ] Coverage maintained or improved
- [ ] Edge cases covered

### Behavior
- [ ] No behavior changes introduced
- [ ] Performance not degraded
- [ ] No new bugs introduced

### Code Quality
- [ ] Code more maintainable
- [ ] Complexity reduced
- [ ] SOLID principles applied
- [ ] No new code smells

### Version Control
- [ ] Commits are small and focused
- [ ] Commit messages are descriptive
- [ ] Feature branch up to date with main
- [ ] No merge conflicts

### Documentation
- [ ] API docs updated
- [ ] README updated if needed
- [ ] Breaking changes documented

---

## Conclusion

Safe refactoring requires discipline:

1. **Test First**: Ensure tests exist and pass
2. **Small Steps**: Incremental changes with frequent commits
3. **Run Tests**: After every change
4. **No Behavior Changes**: Refactor behavior separately from adding features
5. **Use Version Control**: Commit frequently, branch appropriately
6. **Have Rollback Plan**: Know how to undo changes quickly

Following these practices ensures refactoring improves code without introducing bugs.
