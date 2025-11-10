#!/bin/bash

# analyze-code.sh - Analyzes C# source file for test generation
# Usage: ./analyze-code.sh <source-file>

set -e

SOURCE_FILE=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

if [ -z "$SOURCE_FILE" ]; then
    echo "Error: Source file path required"
    echo "Usage: $0 <source-file>"
    exit 1
fi

if [ ! -f "$SOURCE_FILE" ]; then
    echo "Error: File not found: $SOURCE_FILE"
    exit 1
fi

# Extract class information
CLASS_NAME=$(grep -oP 'class\s+\K\w+' "$SOURCE_FILE" | head -1)
NAMESPACE=$(grep -oP 'namespace\s+\K[\w.]+' "$SOURCE_FILE" | head -1)

# Detect class type
CLASS_TYPE="Unknown"
if grep -q "Controller\s*:" "$SOURCE_FILE" || grep -q "ControllerBase" "$SOURCE_FILE"; then
    CLASS_TYPE="Controller"
elif grep -q "Service\s*:" "$SOURCE_FILE" || grep -q ": I.*Service" "$SOURCE_FILE"; then
    CLASS_TYPE="Service"
elif grep -q "Repository\s*:" "$SOURCE_FILE" || grep -q ": I.*Repository" "$SOURCE_FILE"; then
    CLASS_TYPE="Repository"
elif grep -q "Manager\s*:" "$SOURCE_FILE" || grep -q ": I.*Manager" "$SOURCE_FILE"; then
    CLASS_TYPE="Manager"
elif grep -q "MassTransitStateMachine" "$SOURCE_FILE" || grep -q "SagaStateMachine" "$SOURCE_FILE"; then
    CLASS_TYPE="Saga"
elif grep -q "@page" "$SOURCE_FILE" || grep -q "\.razor" <<< "$SOURCE_FILE"; then
    CLASS_TYPE="BlazorComponent"
fi

# Extract constructor dependencies (interfaces)
DEPENDENCIES=$(grep -A 30 "public $CLASS_NAME(" "$SOURCE_FILE" | grep -oP '\bI[A-Z]\w+' | sort -u)

# Detect patterns
IS_MULTI_TENANT=$(grep -qE "TenantId|ITenantManager|IMyTenantManager" "$SOURCE_FILE" && echo "true" || echo "false")
IS_ASYNC=$(grep -qE "async Task|Task<|ValueTask" "$SOURCE_FILE" && echo "true" || echo "false")
HAS_LOGGING=$(grep -q "ILogger" "$SOURCE_FILE" && echo "true" || echo "false")
HAS_DBCONTEXT=$(grep -qE "DbContext|_context|_dbContext" "$SOURCE_FILE" && echo "true" || echo "false")
IS_SAGA=$(grep -qE "MassTransitStateMachine|State\s+\w+|Event<" "$SOURCE_FILE" && echo "true" || echo "false")

# Extract public methods
PUBLIC_METHODS=$(grep -oP 'public\s+(async\s+)?(Task<?\w*>?|void|\w+)\s+\K\w+(?=\s*\()' "$SOURCE_FILE" | grep -v "^$CLASS_NAME$")

# Count methods
METHOD_COUNT=$(echo "$PUBLIC_METHODS" | grep -c . || echo "0")

# Determine test project
TEST_PROJECT="tests/Fyi.Cloud.Manager.Tests"
if [[ $NAMESPACE == *"Services"* ]]; then
    TEST_PROJECT="tests/Fyi.Cloud.Manager.Services.Tests"
elif [[ $NAMESPACE == *"Infrastructure"* ]]; then
    TEST_PROJECT="tests/Fyi.Cloud.Manager.Infrastructure.Tests"
elif [[ $NAMESPACE == *"Components"* ]]; then
    TEST_PROJECT="tests/Fyi.Cloud.Manager.Components.Tests"
elif [[ $NAMESPACE == *"DbServices"* ]]; then
    TEST_PROJECT="tests/Fyi.Cloud.Manager.DbServices.Tests"
elif [[ $NAMESPACE == *"Product"* ]]; then
    TEST_PROJECT="tests/Fyi.Cloud.Manager.Product.Services.Tests"
fi

# Output JSON report
cat <<EOF
{
  "sourceFile": "$SOURCE_FILE",
  "className": "$CLASS_NAME",
  "namespace": "$NAMESPACE",
  "classType": "$CLASS_TYPE",
  "testProject": "$TEST_PROJECT",
  "patterns": {
    "isMultiTenant": $IS_MULTI_TENANT,
    "isAsync": $IS_ASYNC,
    "hasLogging": $HAS_LOGGING,
    "hasDbContext": $HAS_DBCONTEXT,
    "isSaga": $IS_SAGA
  },
  "dependencies": [$(echo "$DEPENDENCIES" | awk '{printf "\"%s\",", $0}' | sed 's/,$//')],
  "publicMethods": [$(echo "$PUBLIC_METHODS" | awk '{printf "\"%s\",", $0}' | sed 's/,$//')],
  "methodCount": $METHOD_COUNT,
  "recommendations": {
    "unitTests": true,
    "integrationTests": $([ "$CLASS_TYPE" = "Controller" ] && echo "true" || echo "false"),
    "sagaTests": $([ "$CLASS_TYPE" = "Saga" ] && echo "true" || echo "false"),
    "componentTests": $([ "$CLASS_TYPE" = "BlazorComponent" ] && echo "true" || echo "false"),
    "tenantIsolationTests": $IS_MULTI_TENANT,
    "databaseTests": $HAS_DBCONTEXT
  }
}
EOF
