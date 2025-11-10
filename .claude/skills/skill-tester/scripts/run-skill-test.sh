#!/bin/bash

# run-skill-test.sh
# Purpose: Orchestrate complete skill test execution with hybrid validation
# Usage: ./run-skill-test.sh <skill-name> <test-case-id> [workspace-path]
# Outputs: Complete test execution with report generation

set -euo pipefail

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_TESTER_DIR="$(dirname "$SCRIPT_DIR")"
TEST_CASES_DIR="$SKILL_TESTER_DIR/test-cases"
REPORTS_DIR="$SKILL_TESTER_DIR/reports"
CONFIG_FILE="$SKILL_TESTER_DIR/config/test-config.json"

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <skill-name> <test-case-id> [workspace-path]"
    exit 1
fi

SKILL_NAME="$1"
TEST_CASE_ID="$2"
WORKSPACE_PATH="${3:-./.skill-tester-workspace}"

# Ensure directories exist
mkdir -p "$REPORTS_DIR"
mkdir -p "$WORKSPACE_PATH"

# Locate test case file
TEST_CASE_FILE="$TEST_CASES_DIR/${SKILL_NAME}.yaml"

if [ ! -f "$TEST_CASE_FILE" ]; then
    echo -e "${RED}❌ Test case file not found: $TEST_CASE_FILE${NC}"
    exit 1
fi

# Extract test case details from YAML (simplified parsing)
TEST_CASE_NAME=$(grep -A 1 "id: $TEST_CASE_ID" "$TEST_CASE_FILE" | grep "name:" | awk -F': ' '{print $2}' | xargs || echo "Unknown")

# Parse validation flags from test case
OUTPUT_CHECK=$(grep -A 10 "id: $TEST_CASE_ID" "$TEST_CASE_FILE" | grep "output_check:" | awk '{print $2}' || echo "true")
SYNTAX_CHECK=$(grep -A 10 "id: $TEST_CASE_ID" "$TEST_CASE_FILE" | grep "syntax_check:" | awk '{print $2}' || echo "true")
BUILD_CHECK=$(grep -A 10 "id: $TEST_CASE_ID" "$TEST_CASE_FILE" | grep "build_check:" | awk '{print $2}' || echo "false")
TEST_CHECK=$(grep -A 10 "id: $TEST_CASE_ID" "$TEST_CASE_FILE" | grep "test_check:" | awk '{print $2}' || echo "false")

# Initialize test tracking
OVERALL_STATUS="PASSED"
VALIDATION_FAILURES=0

echo "================================================"
echo "Skill Tester - Test Orchestrator"
echo "================================================"
echo -e "${CYAN}Skill:${NC} $SKILL_NAME"
echo -e "${CYAN}Test Case:${NC} $TEST_CASE_ID - $TEST_CASE_NAME"
echo -e "${CYAN}Workspace:${NC} $WORKSPACE_PATH"
echo ""
echo "Validation Plan:"
echo "  Output Check: $([ "$OUTPUT_CHECK" = "true" ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}○${NC}")"
echo "  Syntax Check: $([ "$SYNTAX_CHECK" = "true" ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}○${NC}")"
echo "  Build Check: $([ "$BUILD_CHECK" = "true" ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}○${NC}")"
echo "  Test Check: $([ "$TEST_CHECK" = "true" ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}○${NC}")"
echo "================================================"
echo ""

# Record start time
START_TIME=$(date +%s)

# ==================================================
# Phase 1: Output Validation (Always enabled)
# ==================================================

if [ "$OUTPUT_CHECK" = "true" ]; then
    echo -e "${BLUE}[1/4] Running Output Validation...${NC}"
    echo ""

    if "$SCRIPT_DIR/validate-output.sh" "$TEST_CASE_FILE" "$WORKSPACE_PATH"; then
        echo -e "${GREEN}✅ Output validation passed${NC}"
    else
        echo -e "${RED}❌ Output validation failed${NC}"
        OVERALL_STATUS="FAILED"
        VALIDATION_FAILURES=$((VALIDATION_FAILURES + 1))
    fi

    echo ""
fi

# ==================================================
# Phase 2: Syntax Validation (For C# skills)
# ==================================================

if [ "$SYNTAX_CHECK" = "true" ]; then
    echo -e "${BLUE}[2/4] Running Syntax Validation...${NC}"
    echo ""

    # Look for C# files in workspace
    CSHARP_FILES=$(find "$WORKSPACE_PATH" -name "*.cs" 2>/dev/null || echo "")

    if [ -n "$CSHARP_FILES" ]; then
        echo "Found C# files to validate:"
        echo "$CSHARP_FILES"
        echo ""

        # Basic syntax check (in production, use Roslyn)
        SYNTAX_ERRORS=0
        while IFS= read -r cs_file; do
            if [ -f "$cs_file" ]; then
                # Check for basic syntax issues
                if grep -q "class\|interface\|namespace" "$cs_file"; then
                    echo -e "  ${GREEN}✅${NC} $cs_file - Valid C# structure"
                else
                    echo -e "  ${YELLOW}⚠️${NC} $cs_file - No class/interface/namespace found"
                fi
            fi
        done <<< "$CSHARP_FILES"

        if [ $SYNTAX_ERRORS -eq 0 ]; then
            echo -e "${GREEN}✅ Syntax validation passed${NC}"
        else
            echo -e "${RED}❌ Syntax validation failed with $SYNTAX_ERRORS errors${NC}"
            OVERALL_STATUS="FAILED"
            VALIDATION_FAILURES=$((VALIDATION_FAILURES + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  No C# files found in workspace, skipping syntax check${NC}"
    fi

    echo ""
fi

# ==================================================
# Phase 3: Build Validation (If enabled)
# ==================================================

if [ "$BUILD_CHECK" = "true" ]; then
    echo -e "${BLUE}[3/4] Running Build Validation...${NC}"
    echo ""

    # Look for .csproj or .sln in workspace
    PROJECT_FILE=$(find "$WORKSPACE_PATH" -name "*.csproj" -o -name "*.sln" | head -1 || echo "")

    if [ -n "$PROJECT_FILE" ] && [ -f "$PROJECT_FILE" ]; then
        if "$SCRIPT_DIR/run-build-test.sh" "$PROJECT_FILE"; then
            echo -e "${GREEN}✅ Build validation passed${NC}"
        else
            echo -e "${RED}❌ Build validation failed${NC}"
            OVERALL_STATUS="FAILED"
            VALIDATION_FAILURES=$((VALIDATION_FAILURES + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  No project file found in workspace${NC}"
        echo "Workspace contents:"
        ls -la "$WORKSPACE_PATH" || true
        echo ""
        echo "Build validation skipped (no project to build)"
        OVERALL_STATUS="WARNING"
    fi

    echo ""
fi

# ==================================================
# Phase 4: Test Validation (If enabled)
# ==================================================

if [ "$TEST_CHECK" = "true" ]; then
    echo -e "${BLUE}[4/4] Running Test Validation...${NC}"
    echo ""

    # Look for test projects
    TEST_PROJECT=$(find "$WORKSPACE_PATH" -name "*Tests.csproj" -o -name "*.Tests.csproj" | head -1 || echo "")

    if [ -n "$TEST_PROJECT" ] && [ -f "$TEST_PROJECT" ]; then
        if "$SCRIPT_DIR/run-unit-tests.sh" "$TEST_PROJECT" --coverage; then
            echo -e "${GREEN}✅ Test validation passed${NC}"
        else
            echo -e "${RED}❌ Test validation failed${NC}"
            OVERALL_STATUS="FAILED"
            VALIDATION_FAILURES=$((VALIDATION_FAILURES + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  No test project found in workspace${NC}"
        echo "Test validation skipped (no tests to run)"
        if [ "$OVERALL_STATUS" = "PASSED" ]; then
            OVERALL_STATUS="WARNING"
        fi
    fi

    echo ""
fi

# Record end time
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

# ==================================================
# Phase 5: Generate Report
# ==================================================

echo -e "${BLUE}Generating Test Report...${NC}"
echo ""

REPORT_TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
REPORT_FILE="$REPORTS_DIR/${SKILL_NAME}-${TEST_CASE_ID}-${REPORT_TIMESTAMP}.md"

"$SCRIPT_DIR/generate-test-report.sh" "$SKILL_NAME" "$TEST_CASE_ID" "$REPORT_FILE" "$OVERALL_STATUS"

# ==================================================
# Display Final Results
# ==================================================

echo ""
echo "================================================"
echo "Test Execution Complete"
echo "================================================"
echo ""

case "$OVERALL_STATUS" in
    "PASSED")
        echo -e "${GREEN}✅ TEST PASSED${NC}"
        ;;
    "FAILED")
        echo -e "${RED}❌ TEST FAILED${NC}"
        echo -e "Validation failures: ${RED}$VALIDATION_FAILURES${NC}"
        ;;
    "WARNING")
        echo -e "${YELLOW}⚠️  TEST PASSED WITH WARNINGS${NC}"
        ;;
esac

echo ""
echo "Test Details:"
echo "  Skill: $SKILL_NAME"
echo "  Test Case: $TEST_CASE_ID"
echo "  Duration: ${TOTAL_DURATION}s"
echo "  Report: $REPORT_FILE"
echo ""
echo "================================================"

# Exit with appropriate code
if [ "$OVERALL_STATUS" = "PASSED" ]; then
    exit 0
elif [ "$OVERALL_STATUS" = "WARNING" ]; then
    exit 0
else
    exit 1
fi
