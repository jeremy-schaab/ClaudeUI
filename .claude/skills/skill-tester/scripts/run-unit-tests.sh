#!/bin/bash

# run-unit-tests.sh
# Purpose: Execute dotnet test and collect results
# Usage: ./run-unit-tests.sh <project-path> [--coverage]
# Outputs: Test counts (passed/failed/skipped), coverage metrics

set -euo pipefail

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
PROJECT_PATH=""
ENABLE_COVERAGE=0

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            ENABLE_COVERAGE=1
            shift
            ;;
        *)
            PROJECT_PATH="$1"
            shift
            ;;
    esac
done

# Validate project path
if [ -z "$PROJECT_PATH" ]; then
    echo "Usage: $0 <project-path> [--coverage]"
    exit 1
fi

if [ ! -e "$PROJECT_PATH" ]; then
    echo -e "${RED}❌ Project path not found: $PROJECT_PATH${NC}"
    exit 1
fi

# Determine if it's a directory, solution, or project file
if [ -d "$PROJECT_PATH" ]; then
    # It's a directory, find test projects
    if ls "$PROJECT_PATH"/*.sln 1> /dev/null 2>&1; then
        TEST_TARGET=$(ls "$PROJECT_PATH"/*.sln | head -1)
    elif ls "$PROJECT_PATH"/*Tests.csproj 1> /dev/null 2>&1; then
        TEST_TARGET=$(ls "$PROJECT_PATH"/*Tests.csproj | head -1)
    elif ls "$PROJECT_PATH"/*.Tests/*.csproj 1> /dev/null 2>&1; then
        TEST_TARGET=$(ls "$PROJECT_PATH"/*.Tests/*.csproj | head -1)
    else
        echo -e "${RED}❌ No test project found in: $PROJECT_PATH${NC}"
        exit 1
    fi
else
    TEST_TARGET="$PROJECT_PATH"
fi

echo "================================================"
echo "Test Validation"
echo "================================================"
echo "Target: $TEST_TARGET"
echo "Coverage: $([ $ENABLE_COVERAGE -eq 1 ] && echo 'Enabled' || echo 'Disabled')"
echo ""

# Check if dotnet CLI is available
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ dotnet CLI not found in PATH${NC}"
    exit 1
fi

# Create temporary files for test output
TEST_OUTPUT=$(mktemp)
TEST_RESULTS=$(mktemp)

# Ensure cleanup on exit
trap "rm -f $TEST_OUTPUT $TEST_RESULTS" EXIT

# Prepare test results directory
TEST_RESULTS_DIR="./TestResults"
rm -rf "$TEST_RESULTS_DIR"
mkdir -p "$TEST_RESULTS_DIR"

echo "Running tests..."
echo ""

# Build test command
TEST_COMMAND="dotnet test \"$TEST_TARGET\" --no-build --verbosity normal --results-directory \"$TEST_RESULTS_DIR\" --logger \"console;verbosity=detailed\""

if [ $ENABLE_COVERAGE -eq 1 ]; then
    TEST_COMMAND="$TEST_COMMAND --collect:\"XPlat Code Coverage\""
fi

# Run tests
START_TIME=$(date +%s)
if eval $TEST_COMMAND > "$TEST_OUTPUT" 2>&1; then
    TEST_SUCCESS=1
else
    TEST_SUCCESS=0
fi
END_TIME=$(date +%s)
TEST_DURATION=$((END_TIME - START_TIME))

# Parse test results
TOTAL_TESTS=$(grep -oP "Total tests: \K\d+" "$TEST_OUTPUT" | tail -1 || echo "0")
PASSED_TESTS=$(grep -oP "Passed: \K\d+" "$TEST_OUTPUT" | tail -1 || echo "0")
FAILED_TESTS=$(grep -oP "Failed: \K\d+" "$TEST_OUTPUT" | tail -1 || echo "0")
SKIPPED_TESTS=$(grep -oP "Skipped: \K\d+" "$TEST_OUTPUT" | tail -1 || echo "0")

# If parsing failed, try alternative format
if [ "$TOTAL_TESTS" -eq 0 ]; then
    TOTAL_TESTS=$(grep -oP "Total: \K\d+" "$TEST_OUTPUT" | tail -1 || echo "0")
    PASSED_TESTS=$(grep -oP "Passed! - \K\d+" "$TEST_OUTPUT" | tail -1 || echo "0")
    FAILED_TESTS=$(grep -oP "Failed! - \K\d+" "$TEST_OUTPUT" | tail -1 || echo "0")
fi

# Parse coverage if enabled
COVERAGE_PERCENT="N/A"
if [ $ENABLE_COVERAGE -eq 1 ]; then
    # Look for coverage files
    COVERAGE_FILE=$(find "$TEST_RESULTS_DIR" -name "coverage.cobertura.xml" | head -1 || echo "")

    if [ -n "$COVERAGE_FILE" ] && [ -f "$COVERAGE_FILE" ]; then
        # Try to extract line coverage from cobertura XML
        # This is a simplified extraction - in production, use reportgenerator
        LINE_RATE=$(grep -oP 'line-rate="\K[0-9.]+' "$COVERAGE_FILE" | head -1 || echo "")
        if [ -n "$LINE_RATE" ]; then
            COVERAGE_PERCENT=$(awk "BEGIN {printf \"%.1f\", $LINE_RATE * 100}")
        fi

        echo -e "${BLUE}ℹ️  Coverage file generated: $COVERAGE_FILE${NC}"
        echo ""
    fi
fi

# Display results
echo ""
echo "================================================"
echo "Test Results"
echo "================================================"
echo "Duration: ${TEST_DURATION}s"
echo ""

if [ $TEST_SUCCESS -eq 1 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
else
    echo -e "${RED}❌ TESTS FAILED${NC}"
fi

echo ""
echo "Test Summary:"
echo "  Total: $TOTAL_TESTS"
echo -e "  Passed: ${GREEN}$PASSED_TESTS${NC}"

if [ "$FAILED_TESTS" -gt 0 ]; then
    echo -e "  Failed: ${RED}$FAILED_TESTS${NC}"
else
    echo "  Failed: 0"
fi

if [ "$SKIPPED_TESTS" -gt 0 ]; then
    echo -e "  Skipped: ${YELLOW}$SKIPPED_TESTS${NC}"
fi

if [ $ENABLE_COVERAGE -eq 1 ]; then
    echo ""
    echo "Coverage:"
    if [ "$COVERAGE_PERCENT" != "N/A" ]; then
        echo -e "  Line Coverage: ${GREEN}${COVERAGE_PERCENT}%${NC}"
    else
        echo -e "  ${YELLOW}Coverage data not available${NC}"
    fi
fi

# Show failed test details if any
if [ "$FAILED_TESTS" -gt 0 ]; then
    echo ""
    echo "Failed Tests:"
    echo "----------------------------------------"
    grep -A 5 "Failed" "$TEST_OUTPUT" || true
    echo "----------------------------------------"
fi

echo ""
echo "Full test output:"
echo "----------------------------------------"
cat "$TEST_OUTPUT"
echo "----------------------------------------"

# Exit with appropriate code
if [ $TEST_SUCCESS -eq 1 ] && [ "$FAILED_TESTS" -eq 0 ]; then
    exit 0
else
    exit 1
fi
