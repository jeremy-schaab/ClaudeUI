#!/bin/bash

# validate-output.sh
# Purpose: Validate skill output files and content patterns
# Usage: ./validate-output.sh <test-case-yaml> <workspace-path>
# Outputs: Validation results with ✅/❌ indicators

set -euo pipefail

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <test-case-yaml> <workspace-path>"
    exit 1
fi

TEST_CASE_YAML="$1"
WORKSPACE_PATH="$2"

# Validate inputs
if [ ! -f "$TEST_CASE_YAML" ]; then
    echo -e "${RED}❌ Test case file not found: $TEST_CASE_YAML${NC}"
    exit 1
fi

if [ ! -d "$WORKSPACE_PATH" ]; then
    echo -e "${YELLOW}⚠️  Workspace path does not exist: $WORKSPACE_PATH${NC}"
    echo "Creating workspace directory..."
    mkdir -p "$WORKSPACE_PATH"
fi

# Parse test case ID from YAML (simple grep-based parsing)
TEST_CASE_ID=$(grep -m 1 "id:" "$TEST_CASE_YAML" | awk '{print $2}' || echo "UNKNOWN")

echo "================================================"
echo "Output Validation"
echo "================================================"
echo "Test Case: $TEST_CASE_ID"
echo "Workspace: $WORKSPACE_PATH"
echo ""

# Counters
TOTAL_FILES=0
FILES_FOUND=0
FILES_MISSING=0
TOTAL_PATTERNS=0
PATTERNS_FOUND=0
PATTERNS_MISSING=0

# Extract expected outputs from YAML
# This is a simplified parser - in production, use yq or python
IN_EXPECTED_OUTPUTS=0
CURRENT_FILE=""

while IFS= read -r line; do
    # Detect expected_outputs section
    if echo "$line" | grep -q "expected_outputs:"; then
        IN_EXPECTED_OUTPUTS=1
        continue
    fi

    # Exit expected_outputs section when we hit validation or another top-level key
    if [ $IN_EXPECTED_OUTPUTS -eq 1 ] && echo "$line" | grep -qE "^  [a-z_]+:"; then
        IN_EXPECTED_OUTPUTS=0
        break
    fi

    # Parse file path
    if [ $IN_EXPECTED_OUTPUTS -eq 1 ] && echo "$line" | grep -q "- file:"; then
        CURRENT_FILE=$(echo "$line" | sed 's/.*- file: //' | tr -d '"' | xargs)
        TOTAL_FILES=$((TOTAL_FILES + 1))

        # Check if file exists
        FILE_PATH="$WORKSPACE_PATH/$CURRENT_FILE"

        if [ -f "$FILE_PATH" ]; then
            echo -e "${GREEN}✅ File exists: $CURRENT_FILE${NC}"
            FILES_FOUND=$((FILES_FOUND + 1))

            # Get file size
            FILE_SIZE=$(wc -l < "$FILE_PATH" 2>/dev/null || echo "0")
            echo "   Lines: $FILE_SIZE"
        else
            echo -e "${RED}❌ File missing: $CURRENT_FILE${NC}"
            FILES_MISSING=$((FILES_MISSING + 1))
            CURRENT_FILE=""
            continue
        fi
    fi

    # Parse patterns (only if current file exists)
    if [ -n "$CURRENT_FILE" ] && [ $IN_EXPECTED_OUTPUTS -eq 1 ] && echo "$line" | grep -q "^          -"; then
        PATTERN=$(echo "$line" | sed 's/.*- "//' | sed 's/"$//' | xargs)
        TOTAL_PATTERNS=$((TOTAL_PATTERNS + 1))

        FILE_PATH="$WORKSPACE_PATH/$CURRENT_FILE"

        # Search for pattern in file
        if grep -qF "$PATTERN" "$FILE_PATH" 2>/dev/null; then
            echo -e "   ${GREEN}✅ Pattern found: \"$PATTERN\"${NC}"
            PATTERNS_FOUND=$((PATTERNS_FOUND + 1))
        else
            echo -e "   ${RED}❌ Pattern missing: \"$PATTERN\"${NC}"
            PATTERNS_MISSING=$((PATTERNS_MISSING + 1))
        fi
    fi
done < "$TEST_CASE_YAML"

echo ""
echo "================================================"
echo "Validation Summary"
echo "================================================"
echo "Files:"
echo "  Total expected: $TOTAL_FILES"
echo -e "  Found: ${GREEN}$FILES_FOUND${NC}"
echo -e "  Missing: ${RED}$FILES_MISSING${NC}"
echo ""
echo "Patterns:"
echo "  Total expected: $TOTAL_PATTERNS"
echo -e "  Found: ${GREEN}$PATTERNS_FOUND${NC}"
echo -e "  Missing: ${RED}$PATTERNS_MISSING${NC}"
echo ""

# Determine overall result
if [ $FILES_MISSING -eq 0 ] && [ $PATTERNS_MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ OUTPUT VALIDATION PASSED${NC}"
    exit 0
elif [ $FILES_MISSING -gt 0 ]; then
    echo -e "${RED}❌ OUTPUT VALIDATION FAILED: Missing files${NC}"
    exit 1
else
    echo -e "${RED}❌ OUTPUT VALIDATION FAILED: Missing patterns${NC}"
    exit 1
fi
