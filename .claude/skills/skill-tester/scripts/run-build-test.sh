#!/bin/bash

# run-build-test.sh
# Purpose: Execute dotnet build and report results
# Usage: ./run-build-test.sh <project-path> [configuration]
# Outputs: Build status, error count, warning count

set -euo pipefail

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <project-path> [configuration]"
    exit 1
fi

PROJECT_PATH="$1"
CONFIGURATION="${2:-Debug}"

# Validate project path
if [ ! -e "$PROJECT_PATH" ]; then
    echo -e "${RED}❌ Project path not found: $PROJECT_PATH${NC}"
    exit 1
fi

# Determine if it's a solution or project file
if [ -d "$PROJECT_PATH" ]; then
    # It's a directory, find .csproj or .sln
    if ls "$PROJECT_PATH"/*.sln 1> /dev/null 2>&1; then
        BUILD_TARGET=$(ls "$PROJECT_PATH"/*.sln | head -1)
    elif ls "$PROJECT_PATH"/*.csproj 1> /dev/null 2>&1; then
        BUILD_TARGET=$(ls "$PROJECT_PATH"/*.csproj | head -1)
    else
        echo -e "${RED}❌ No solution or project file found in: $PROJECT_PATH${NC}"
        exit 1
    fi
else
    BUILD_TARGET="$PROJECT_PATH"
fi

echo "================================================"
echo "Build Validation"
echo "================================================"
echo "Target: $BUILD_TARGET"
echo "Configuration: $CONFIGURATION"
echo ""

# Check if dotnet CLI is available
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ dotnet CLI not found in PATH${NC}"
    echo "Please install .NET SDK from https://dotnet.microsoft.com/download"
    exit 1
fi

# Show dotnet version
DOTNET_VERSION=$(dotnet --version)
echo "dotnet version: $DOTNET_VERSION"
echo ""

# Create temporary file for build output
BUILD_OUTPUT=$(mktemp)
BUILD_ERRORS=$(mktemp)

# Ensure cleanup on exit
trap "rm -f $BUILD_OUTPUT $BUILD_ERRORS" EXIT

# Run dotnet restore first
echo "Restoring packages..."
if dotnet restore "$BUILD_TARGET" --verbosity quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Package restore succeeded${NC}"
else
    echo -e "${YELLOW}⚠️  Package restore had warnings (continuing)${NC}"
fi

echo ""
echo "Building project..."
echo ""

# Run dotnet build
START_TIME=$(date +%s)
if dotnet build "$BUILD_TARGET" \
    --configuration "$CONFIGURATION" \
    --no-restore \
    --verbosity normal \
    > "$BUILD_OUTPUT" 2>&1; then
    BUILD_SUCCESS=1
else
    BUILD_SUCCESS=0
fi
END_TIME=$(date +%s)
BUILD_DURATION=$((END_TIME - START_TIME))

# Parse build output for errors and warnings
ERROR_COUNT=$(grep -c "error CS" "$BUILD_OUTPUT" 2>/dev/null || echo "0")
WARNING_COUNT=$(grep -c "warning CS" "$BUILD_OUTPUT" 2>/dev/null || echo "0")

# Extract error details
if [ $ERROR_COUNT -gt 0 ]; then
    grep "error CS" "$BUILD_OUTPUT" > "$BUILD_ERRORS" || true
fi

echo ""
echo "================================================"
echo "Build Results"
echo "================================================"
echo "Duration: ${BUILD_DURATION}s"
echo ""

if [ $BUILD_SUCCESS -eq 1 ]; then
    echo -e "${GREEN}✅ BUILD SUCCEEDED${NC}"
    echo ""
    echo "Errors: 0"
    if [ $WARNING_COUNT -gt 0 ]; then
        echo -e "Warnings: ${YELLOW}$WARNING_COUNT${NC}"
        echo ""
        echo "Warnings found:"
        grep "warning CS" "$BUILD_OUTPUT" || true
    else
        echo "Warnings: 0"
    fi
    exit 0
else
    echo -e "${RED}❌ BUILD FAILED${NC}"
    echo ""
    echo -e "Errors: ${RED}$ERROR_COUNT${NC}"
    echo -e "Warnings: ${YELLOW}$WARNING_COUNT${NC}"
    echo ""

    if [ $ERROR_COUNT -gt 0 ]; then
        echo "Build Errors:"
        echo "----------------------------------------"
        cat "$BUILD_ERRORS"
        echo "----------------------------------------"
    fi

    echo ""
    echo "Full build output:"
    echo "----------------------------------------"
    cat "$BUILD_OUTPUT"
    echo "----------------------------------------"
    exit 1
fi
