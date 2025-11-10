---
name: skill-tester
description: This skill should be used when testing other Claude Code skills with hybrid validation (output + build/test execution). Use when verifying skill functionality, ensuring code generation quality, running regression tests on skills, validating C# code output, or testing skill changes before deployment. Activates for skill testing, code generation validation, or when users mention "test skill", "validate skill", "skill regression", "verify skill quality", "test my skill", or "run skill tests".
---

# Skill Tester

## Purpose

Test Claude Code skills using a comprehensive hybrid validation approach that combines:

1. **Output Validation** - Verify files are created with expected content patterns
2. **Syntax Validation** - Check C# code compiles without errors
3. **Build Validation** - Execute `dotnet build` to ensure compilation succeeds
4. **Test Validation** - Run `dotnet test` to verify generated tests pass
5. **Report Generation** - Create clear, actionable test reports with diagnostics

This skill is essential for:
- Ensuring skill quality before deployment
- Running regression tests after skill modifications
- Validating C# code generation accuracy
- Maintaining skill reliability and consistency
- Building confidence in skill outputs

---

## When to Use This Skill

Use this skill when:

- **Testing new skills** - Validate a newly created skill works as expected
- **Regression testing** - Verify existing skills still work after updates
- **Quality assurance** - Ensure code-generating skills produce compilable, testable code
- **Continuous validation** - Regularly test skills to catch issues early
- **Before deployment** - Validate skills before sharing with team or community
- **Debugging skill issues** - Isolate problems with specific test cases
- **Skill development** - Iteratively test during skill creation

Specific activation scenarios:
- "Test the blazor-component-generator skill"
- "Run regression tests on all C# skills"
- "Validate that test-suite-builder generates working tests"
- "Check if my skill changes broke anything"
- "Run skill tests before I commit"

---

## Step-by-Step Implementation

### Workflow 1: Run Single Skill Test

**Purpose:** Test a specific skill with one test case

**Steps:**

1. **Load Test Case**
   - Read test case YAML from `test-cases/[skill-name].yaml`
   - Parse test ID, input, expected outputs, validation flags
   - Verify test case is well-formed

2. **Prepare Test Environment**
   - Check required directories exist
   - Create temporary workspace if needed
   - Load test configuration from `assets/test-config.json`

3. **Invoke Target Skill**
   - Execute the skill with test input (user request + context files)
   - Capture skill output and any generated files
   - Record execution time and any errors

4. **Run Output Validation** (Always enabled)
   - Check expected files were created: `scripts/validate-output.sh`
   - Verify file content contains required patterns
   - Validate file structure and naming conventions
   - Report: ✅ files created, ❌ missing files, ⚠️ unexpected files

5. **Run Syntax Validation** (For C# skills)
   - Parse C# files for syntax errors
   - Check for required using statements, namespaces
   - Validate class/method signatures
   - Report: ✅ valid syntax, ❌ syntax errors

6. **Run Build Validation** (If enabled in test case)
   - Execute: `scripts/run-build-test.sh [project-path]`
   - Parse build output for errors/warnings
   - Check exit code (0 = success)
   - Report: ✅ build succeeded, ❌ build failed with N errors

7. **Run Test Validation** (If enabled in test case)
   - Execute: `scripts/run-unit-tests.sh [project-path]`
   - Parse test results (passed/failed/skipped)
   - Collect code coverage metrics if available
   - Report: ✅ all tests passed, ❌ N tests failed

8. **Generate Test Report**
   - Execute: `scripts/generate-test-report.sh`
   - Use template: `templates/test-report.md.template`
   - Include: summary, validation results, diagnostics, recommendations
   - Save to: `reports/[skill-name]-[test-id]-[timestamp].md`

9. **Display Results**
   - Show summary: Test ID, status (PASSED/FAILED/WARNING)
   - List validation results with ✅/❌/⚠️ indicators
   - Display actionable error messages if failed
   - Provide path to detailed report

**Success Criteria:**
- ✅ Test case executed completely without errors
- ✅ All enabled validations ran successfully
- ✅ Clear PASS/FAIL determination made
- ✅ Test report generated and saved
- ✅ User receives actionable feedback

---

### Workflow 2: Run Full Test Suite for a Skill

**Purpose:** Run all test cases defined for a specific skill

**Steps:**

1. **Discover Test Cases**
   - Locate test case file: `test-cases/[skill-name].yaml`
   - Parse YAML to extract all test cases
   - Filter by priority if specified (high/medium/low)
   - Sort by priority (high first)

2. **Initialize Test Suite**
   - Create test suite execution context
   - Prepare aggregated results structure
   - Set up progress tracking (1 of N tests)

3. **Execute Each Test Case Sequentially**
   - For each test case in the suite:
     - Display: "Running test X of N: [test-name]"
     - Execute Workflow 1 (Run Single Skill Test)
     - Collect result (PASSED/FAILED/WARNING/SKIPPED)
     - Continue to next test (don't stop on failure)

4. **Aggregate Results**
   - Count: total tests, passed, failed, warnings, skipped
   - Calculate pass rate: (passed / total) × 100%
   - Identify critical failures (high-priority test failures)
   - List all failed tests with brief reason

5. **Generate Test Suite Report**
   - Use template: `templates/test-report.md.template`
   - Include:
     - Executive summary (pass rate, critical failures)
     - Per-test results table
     - Failed test diagnostics
     - Recommendations for fixes
   - Save to: `reports/[skill-name]-suite-[timestamp].md`

6. **Display Suite Results**
   - Show summary:
     ```
     ================================================
     Test Suite: [skill-name]
     ================================================
     Total Tests: 10
     Passed: 8 ✅
     Failed: 1 ❌
     Warnings: 1 ⚠️
     Skipped: 0
     Pass Rate: 80%

     Critical Issues: 1
     - TC-001 FAILED: Build errors in generated code

     Full report: reports/[skill-name]-suite-[timestamp].md
     ================================================
     ```

**Success Criteria:**
- ✅ All test cases in suite executed
- ✅ No test execution errors (tests themselves may fail)
- ✅ Comprehensive suite report generated
- ✅ Pass rate calculated and displayed
- ✅ Critical failures highlighted

---

### Workflow 3: Run All Skill Tests (Full Regression)

**Purpose:** Test all skills with all test cases (comprehensive regression testing)

**Steps:**

1. **Discover All Test Suites**
   - Scan `test-cases/` directory
   - Find all `*.yaml` files
   - Extract skill names from filenames
   - Sort alphabetically

2. **Execute Each Test Suite**
   - For each skill:
     - Display: "Testing skill: [skill-name]"
     - Execute Workflow 2 (Run Full Test Suite)
     - Collect suite result (pass rate, failures)
     - Continue to next skill

3. **Aggregate Global Results**
   - Count: total skills tested, total tests run
   - Calculate: overall pass rate, failures per skill
   - Identify: skills with failures, critical issues
   - List: all failed tests across all skills

4. **Generate Regression Report**
   - Use template: `templates/test-report.md.template`
   - Include:
     - Executive dashboard (skills tested, overall pass rate)
     - Per-skill summary table
     - All failures organized by skill
     - Trending analysis (if previous reports available)
     - Recommendations for investigation
   - Save to: `reports/regression-[timestamp].md`

5. **Display Regression Results**
   - Show global summary:
     ```
     ================================================
     Full Regression Test Results
     ================================================
     Skills Tested: 5
     Total Tests: 42
     Passed: 38 ✅
     Failed: 3 ❌
     Warnings: 1 ⚠️
     Overall Pass Rate: 90.5%

     Skills with Failures:
     - blazor-component-generator: 1 failure
     - test-suite-builder: 2 failures

     Full report: reports/regression-[timestamp].md
     ================================================
     ```

**Success Criteria:**
- ✅ All skills tested successfully
- ✅ Global pass rate calculated
- ✅ Regression report generated
- ✅ Trending visible (if applicable)
- ✅ Action items identified

---

### Workflow 4: Add New Test Case

**Purpose:** Create a new test case for an existing or new skill

**Steps:**

1. **Determine Target Skill**
   - Identify which skill to test
   - Check if test case file exists: `test-cases/[skill-name].yaml`
   - If not, use template: `templates/test-case.yaml.template`

2. **Gather Test Case Information**
   - Test ID (e.g., TC-SKILL-001)
   - Test name (descriptive, unique)
   - Priority (high/medium/low)
   - User request (input to skill)
   - Context files (if needed)
   - Expected outputs (files, patterns)
   - Validation flags (output/syntax/build/test)

3. **Define Expected Outputs**
   - List all expected file paths
   - For each file, specify required patterns:
     - Class names
     - Method signatures
     - Attributes
     - Using statements
     - Specific code constructs

4. **Configure Validation Levels**
   - `output_check: true` - Always enable
   - `syntax_check: true` - For C# skills
   - `build_check: true` - For compilable code
   - `test_check: true` - Only if tests should run

5. **Write Test Case YAML**
   - Add new test case to existing file or create new
   - Follow structure from `templates/test-case.yaml.template`
   - Include all fields: id, name, priority, input, expected_outputs, validation
   - Add comments for clarity

6. **Validate Test Case Format**
   - Check YAML is well-formed
   - Ensure all required fields present
   - Verify test ID is unique
   - Validate file paths are relative and correct

7. **Run Test Case**
   - Execute Workflow 1 with new test case
   - Verify test executes without errors
   - Check results match expectations
   - Adjust test case if needed

8. **Document Test Case**
   - Add comment explaining test purpose
   - Document any special requirements
   - Note any known limitations
   - Commit test case to repository

**Success Criteria:**
- ✅ Test case YAML is valid
- ✅ Test case executes successfully
- ✅ Expected outputs are realistic
- ✅ Validation levels appropriate
- ✅ Test is documented

---

## Configuration

### Test Configuration File

**Location:** `assets/test-config.json`

**Purpose:** Global settings for skill testing

**Key Settings:**

```json
{
  "default_settings": {
    "validation": {
      "output_check": true,      // Always check file outputs
      "syntax_check": true,       // Parse C# syntax
      "build_check": true,        // Run dotnet build
      "test_check": false         // Don't run tests by default
    },
    "timeouts": {
      "build_timeout_seconds": 300,  // 5 minutes max
      "test_timeout_seconds": 600    // 10 minutes max
    }
  },
  "dotnet_settings": {
    "build_configuration": "Debug",
    "test_verbosity": "normal",
    "enable_coverage": true
  },
  "success_criteria": {
    "minimum_coverage_percent": 80,
    "allow_build_warnings": false,
    "require_all_tests_pass": true
  }
}
```

### Test Case YAML Structure

**Location:** `test-cases/[skill-name].yaml`

**Format:**

```yaml
skill_name: example-skill
test_suite_version: "1.0"
description: Test suite for example-skill

test_cases:
  - id: TC-EXAMPLE-001
    name: Test case name
    priority: high  # high/medium/low
    input:
      user_request: "User's request to the skill"
      context_files:
        - path/to/context/file.cs
    expected_outputs:
      - file: path/to/generated/file.cs
        patterns:
          - "class ClassName"
          - "public void MethodName"
          - "using System;"
      - file: path/to/another/file.cs
        patterns:
          - "interface IServiceName"
    validation:
      output_check: true
      syntax_check: true
      build_check: true
      test_check: false
    notes: "Optional notes about this test case"
```

---

## Examples

### Example 1: Test Single Test Case

**User Request:**
```
Test the test-suite-builder skill with the unit test generation case
```

**Execution:**

1. Load test case: `test-cases/test-suite-builder.yaml`
2. Find test case: `TC-TSB-001` (Generate Unit Tests)
3. Invoke skill with input: "Generate unit tests for ProductService"
4. Validate outputs:
   - ✅ File created: `tests/ProductServiceTests.cs`
   - ✅ Contains: `[Fact]`, `public class ProductServiceTests`
   - ✅ Uses: xUnit, Moq, FluentAssertions
5. Run build: `dotnet build tests/ProductServiceTests.csproj`
   - ✅ Build succeeded: 0 errors, 0 warnings
6. Run tests: `dotnet test tests/ProductServiceTests.csproj`
   - ✅ All tests passed: 8/8 passed
7. Generate report: `reports/test-suite-builder-TC-TSB-001-20250128.md`

**Output:**
```
================================================
Skill Test Results
================================================
Skill: test-suite-builder
Test Case: TC-TSB-001 - Generate Unit Tests
Status: ✅ PASSED

Validations:
✅ Output Check: All expected files created (1/1)
✅ Syntax Check: Valid C# syntax
✅ Build Check: Build succeeded (0 errors, 0 warnings)
✅ Test Check: All tests passed (8/8)

Metrics:
- Execution time: 12.5s
- Files generated: 1
- Lines of code: 247
- Test coverage: 95%

Overall: All validations passed ✅

Report saved to: reports/test-suite-builder-TC-TSB-001-20250128.md
================================================
```

---

### Example 2: Run Full Test Suite

**User Request:**
```
Run all tests for blazor-component-generator
```

**Execution:**

1. Load test suite: `test-cases/blazor-component-generator.yaml`
2. Found 3 test cases:
   - TC-BLAZOR-001: Generate Syncfusion CRUD Page (high)
   - TC-BLAZOR-002: Generate MudBlazor Data Table (medium)
   - TC-BLAZOR-003: Generate Telerik Form Dialog (medium)
3. Execute each test case:
   - TC-BLAZOR-001: ✅ PASSED
   - TC-BLAZOR-002: ✅ PASSED
   - TC-BLAZOR-003: ❌ FAILED (build error: missing package reference)
4. Aggregate results: 2/3 passed (66.7% pass rate)
5. Generate suite report: `reports/blazor-component-generator-suite-20250128.md`

**Output:**
```
================================================
Test Suite Results
================================================
Skill: blazor-component-generator
Total Tests: 3
Passed: 2 ✅
Failed: 1 ❌
Pass Rate: 66.7%

Failed Tests:
❌ TC-BLAZOR-003: Generate Telerik Form Dialog
   Reason: Build failed - missing package reference
   Error: The type or namespace name 'TelerikForm' could not be found
   Fix: Add package reference: Telerik.UI.for.Blazor

Report saved to: reports/blazor-component-generator-suite-20250128.md
================================================
```

---

### Example 3: Full Regression Test

**User Request:**
```
Run full regression tests on all skills
```

**Execution:**

1. Discovered 3 test suites:
   - test-suite-builder.yaml (3 test cases)
   - blazor-component-generator.yaml (3 test cases)
   - csharp-refactor-advisor.yaml (2 test cases)
2. Execute each suite sequentially
3. Collect results:
   - test-suite-builder: 3/3 passed ✅
   - blazor-component-generator: 2/3 passed ⚠️
   - csharp-refactor-advisor: 2/2 passed ✅
4. Overall: 7/8 passed (87.5%)
5. Generate regression report: `reports/regression-20250128.md`

**Output:**
```
================================================
Full Regression Test Results
================================================
Skills Tested: 3
Total Tests: 8
Passed: 7 ✅
Failed: 1 ❌
Overall Pass Rate: 87.5%

Results by Skill:
✅ test-suite-builder: 100% (3/3)
⚠️ blazor-component-generator: 66.7% (2/3)
✅ csharp-refactor-advisor: 100% (2/2)

Critical Issues:
- blazor-component-generator: Missing package reference in Telerik test

Report saved to: reports/regression-20250128.md
================================================
```

---

### Example 4: Add New Test Case

**User Request:**
```
Create a test case for csharp-refactor-advisor that tests SOLID refactoring
```

**Execution:**

1. Target skill: csharp-refactor-advisor
2. Test case file: `test-cases/csharp-refactor-advisor.yaml` (exists)
3. Gather information:
   - ID: TC-REFACTOR-003
   - Name: Refactor to SOLID Principles
   - Priority: high
   - Input: "Refactor OrderProcessor to follow SOLID principles"
4. Define expected outputs:
   - File: `src/Services/OrderProcessor.cs` (modified)
   - Patterns: Multiple classes (SRP), interfaces (DIP), etc.
5. Configure validation:
   - output_check: true
   - syntax_check: true
   - build_check: true
   - test_check: true (ensure existing tests still pass)
6. Write test case YAML
7. Run test to verify
8. Add to repository

**Result:**
New test case added to `test-cases/csharp-refactor-advisor.yaml`:

```yaml
  - id: TC-REFACTOR-003
    name: Refactor to SOLID Principles
    priority: high
    input:
      user_request: "Refactor OrderProcessor class to follow SOLID principles"
      context_files:
        - src/Services/OrderProcessor.cs
    expected_outputs:
      - file: src/Services/OrderProcessor.cs
        patterns:
          - "class OrderProcessor"
          - "IOrderValidator"
          - "IOrderRepository"
      - file: src/Services/IOrderValidator.cs
        patterns:
          - "interface IOrderValidator"
      - file: src/Services/IOrderRepository.cs
        patterns:
          - "interface IOrderRepository"
    validation:
      output_check: true
      syntax_check: true
      build_check: true
      test_check: true
    notes: "Validates SRP, DIP, and overall SOLID compliance"
```

---

## Best Practices

### Test Case Design

1. **Start Simple**
   - Begin with basic happy-path tests
   - Add edge cases incrementally
   - Don't try to test everything at once

2. **Be Specific with Patterns**
   - Use precise pattern matching (not just "class")
   - Include namespace qualifiers when needed
   - Test for critical constructs (attributes, interfaces)

3. **Enable Appropriate Validation Levels**
   - Output validation: Always enabled
   - Build validation: For all C# code generators
   - Test execution: Only when practical (not for UI components)

4. **Prioritize Tests**
   - High: Critical functionality, must pass before release
   - Medium: Important features, should investigate failures
   - Low: Nice-to-have, informational

5. **Document Test Intent**
   - Use clear, descriptive test names
   - Add notes explaining what's being tested
   - Document known limitations

### Test Execution

1. **Run Tests Incrementally**
   - Test single cases during development
   - Run suite tests before commits
   - Run full regression periodically (weekly)

2. **Isolate Test Cases**
   - Each test should be independent
   - Don't rely on previous test outputs
   - Clean up generated files between tests

3. **Handle Failures Gracefully**
   - Don't stop suite on first failure
   - Collect all failures for comprehensive view
   - Provide actionable error messages

4. **Monitor Performance**
   - Track test execution time
   - Identify slow tests
   - Optimize validation scripts

5. **Version Test Cases**
   - Update test cases when skills change
   - Maintain test suite version in YAML
   - Document breaking changes

### Validation Scripts

1. **Keep Scripts Simple**
   - One responsibility per script
   - Clear input/output contracts
   - Proper error handling

2. **Use Standard Tools**
   - Leverage dotnet CLI for builds/tests
   - Use grep/awk for pattern matching
   - Prefer shell built-ins over external tools

3. **Provide Clear Output**
   - Use ✅/❌/⚠️ indicators consistently
   - Include file paths in error messages
   - Show command output on failures

4. **Handle Edge Cases**
   - Missing files or directories
   - Timeout scenarios
   - Partial failures

5. **Make Scripts Portable**
   - Work on Windows (Git Bash) and Linux
   - Use relative paths
   - Check for required tools before use

### Reporting

1. **Generate Comprehensive Reports**
   - Include summary and details
   - Show both successes and failures
   - Provide recommendations for fixes

2. **Save Reports for History**
   - Use timestamps in filenames
   - Store in `reports/` directory (gitignored)
   - Enable trending analysis

3. **Make Reports Actionable**
   - Clear pass/fail determination
   - Specific error messages with file/line numbers
   - Suggested fixes when possible

4. **Use Visual Indicators**
   - ✅ Success / PASSED
   - ❌ Failure / FAILED
   - ⚠️ Warning / PARTIAL
   - 📊 Metrics / INFO

---

## Success Criteria

When using this skill, verify the following outcomes:

### For Single Test Execution
- ✅ Test case loaded and parsed successfully
- ✅ Target skill invoked without errors
- ✅ All enabled validations executed
- ✅ Clear PASS/FAIL determination made
- ✅ Test report generated with diagnostics
- ✅ Results displayed to user

### For Test Suite Execution
- ✅ All test cases discovered and executed
- ✅ No test execution errors (tests may fail)
- ✅ Pass rate calculated correctly
- ✅ Failed tests listed with reasons
- ✅ Suite report generated
- ✅ Critical failures highlighted

### For Full Regression
- ✅ All skills with test cases tested
- ✅ Overall pass rate calculated
- ✅ Per-skill summary provided
- ✅ Regression report generated
- ✅ Trends visible (if historical data exists)
- ✅ Action items identified

### For New Test Case Creation
- ✅ Test case YAML is valid and well-formed
- ✅ Test case executes without errors
- ✅ Expected outputs are realistic
- ✅ Validation levels appropriate for skill type
- ✅ Test case documented with intent/notes
- ✅ Test case added to repository

### Quality Metrics
- **Pass Rate:** ≥ 80% for test suites
- **Execution Time:** Single test < 60s, suite < 10min
- **Report Completeness:** All sections populated
- **Error Clarity:** Actionable messages with file/line info
- **Coverage:** Critical skill functionality tested

---

## Troubleshooting

### Common Issues

**Issue: Test case YAML won't parse**
- Check YAML syntax with online validator
- Verify indentation (spaces, not tabs)
- Ensure all required fields present

**Issue: Build validation fails**
- Check project file (.csproj) exists
- Verify NuGet packages restored
- Ensure dotnet CLI available in PATH

**Issue: Test validation fails**
- Check test project references
- Verify xUnit/test framework installed
- Ensure tests are discoverable ([Fact], [Theory])

**Issue: Pattern matching too strict**
- Use partial patterns, not full code
- Account for whitespace variations
- Test patterns independently first

**Issue: Scripts don't execute**
- Check script permissions (chmod +x)
- Verify bash available (Windows: Git Bash)
- Check path separators (/ not \)

### Debugging Tips

1. **Run scripts manually** to isolate issues
2. **Check script output** for detailed errors
3. **Validate test case** format before running
4. **Start with output validation** only, add build/test incrementally
5. **Review test reports** for patterns in failures

---

## Integration with Other Skills

This skill complements:

- **skill-creator** - Test newly created skills immediately
- **test-suite-builder** - Validate generated test suites compile and run
- **blazor-component-generator** - Ensure components compile with UI frameworks
- **csharp-refactor-advisor** - Verify refactorings don't break builds/tests
- **ace-framework** - Test self-improving agent implementations

---

## Future Enhancements

Potential improvements:

1. **Parallel Test Execution** - Run independent tests concurrently
2. **Snapshot Testing** - Compare outputs to approved baselines
3. **Performance Benchmarks** - Track generation speed, build time
4. **Visual Regression** - Test UI component rendering (screenshot comparison)
5. **Test Coverage Trending** - Track coverage changes over time
6. **CI/CD Integration** - GitHub Actions workflow for automated testing
7. **Test Case Generator** - AI-assisted test case creation
8. **Mutation Testing** - Verify test quality by introducing bugs

---

## Scripts Reference

### validate-output.sh
**Purpose:** Check file creation and pattern matching
**Usage:** `./scripts/validate-output.sh <test-case-yaml> <workspace-path>`
**Outputs:** List of validation results with ✅/❌ per file

### run-build-test.sh
**Purpose:** Execute dotnet build and report results
**Usage:** `./scripts/run-build-test.sh <project-path>`
**Outputs:** Build status, error count, warning count

### run-unit-tests.sh
**Purpose:** Execute dotnet test and collect results
**Usage:** `./scripts/run-unit-tests.sh <project-path>`
**Outputs:** Test counts (passed/failed/skipped), coverage metrics

### generate-test-report.sh
**Purpose:** Create markdown test report from results
**Usage:** `./scripts/generate-test-report.sh <results-json> <output-path>`
**Outputs:** Formatted markdown report

### run-skill-test.sh
**Purpose:** Orchestrate full test execution (calls other scripts)
**Usage:** `./scripts/run-skill-test.sh <skill-name> <test-case-id>`
**Outputs:** Complete test execution with final report

---

## Additional Resources

- **Test Case Template:** `templates/test-case.yaml.template`
- **Report Template:** `templates/test-report.md.template`
- **Configuration:** `assets/test-config.json`
- **Example Test Cases:** `test-cases/*.yaml`

For questions or issues with this skill, refer to the skill-creator documentation or create a new issue in the repository.
