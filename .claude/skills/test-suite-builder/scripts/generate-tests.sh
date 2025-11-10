#!/bin/bash

# generate-tests.sh - Generates test file from source file
# Usage: ./generate-tests.sh <source-file> [test-type]

set -e

SOURCE_FILE=$1
TEST_TYPE=${2:-unit}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../templates"
CONFIG_DIR="$SCRIPT_DIR/../config"

if [ -z "$SOURCE_FILE" ]; then
    echo "Error: Source file path required"
    echo "Usage: $0 <source-file> [test-type]"
    exit 1
fi

echo "=================================================="
echo "CloudManager Test Suite Builder"
echo "=================================================="
echo ""

# Step 1: Analyze source file
echo "Step 1: Analyzing source file..."
ANALYSIS=$("$SCRIPT_DIR/analyze-code.sh" "$SOURCE_FILE")

# Extract values from JSON
CLASS_NAME=$(echo "$ANALYSIS" | grep -oP '"className":\s*"\K[^"]+')
NAMESPACE=$(echo "$ANALYSIS" | grep -oP '"namespace":\s*"\K[^"]+')
CLASS_TYPE=$(echo "$ANALYSIS" | grep -oP '"classType":\s*"\K[^"]+')
TEST_PROJECT=$(echo "$ANALYSIS" | grep -oP '"testProject":\s*"\K[^"]+')

echo "  Class: $CLASS_NAME"
echo "  Type: $CLASS_TYPE"
echo "  Namespace: $NAMESPACE"
echo "  Test Project: $TEST_PROJECT"
echo ""

# Step 2: Select appropriate template
echo "Step 2: Loading template..."
TEMPLATE_FILE="$TEMPLATE_DIR/${TEST_TYPE}-test.cs.template"
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template not found: $TEMPLATE_FILE"
    exit 1
fi
echo "  Template: $TEMPLATE_FILE"
echo ""

TEST_CONTENT=$(cat "$TEMPLATE_FILE")

# Step 3: Generate mock declarations
echo "Step 3: Generating mock declarations..."
DEPENDENCIES=$(echo "$ANALYSIS" | grep -A 100 '"dependencies"' | grep -oP '"\K[^"]+' | grep '^I')
MOCK_DECLARATIONS=""
MOCK_INITIALIZATIONS=""
CONSTRUCTOR_PARAMS=""
SERVICE_REGISTRATIONS=""

for dep in $DEPENDENCIES; do
    if [ "$dep" != "ILogger" ]; then
        MOCK_VAR="_mock${dep#I}"
        MOCK_DECLARATIONS+="    private readonly Mock<$dep> $MOCK_VAR;\n"
        MOCK_INITIALIZATIONS+="        $MOCK_VAR = new Mock<$dep>();\n"

        if [ -z "$CONSTRUCTOR_PARAMS" ]; then
            CONSTRUCTOR_PARAMS+="${MOCK_VAR}.Object"
        else
            CONSTRUCTOR_PARAMS+=", ${MOCK_VAR}.Object"
        fi

        SERVICE_REGISTRATIONS+="        Services.AddSingleton(${MOCK_VAR}.Object);\n"
    else
        # Handle ILogger specially
        LOGGER_TYPE="ILogger<$CLASS_NAME>"
        MOCK_VAR="_mockLogger"
        MOCK_DECLARATIONS+="    private readonly Mock<$LOGGER_TYPE> $MOCK_VAR;\n"
        MOCK_INITIALIZATIONS+="        $MOCK_VAR = new Mock<$LOGGER_TYPE>();\n"

        if [ -z "$CONSTRUCTOR_PARAMS" ]; then
            CONSTRUCTOR_PARAMS+="${MOCK_VAR}.Object"
        else
            CONSTRUCTOR_PARAMS+=", ${MOCK_VAR}.Object"
        fi
    fi
done

echo "  Generated ${#DEPENDENCIES[@]} mock declarations"
echo ""

# Step 4: Generate test methods
echo "Step 4: Generating test methods..."
PUBLIC_METHODS=$(echo "$ANALYSIS" | grep -A 100 '"publicMethods"' | grep -oP '"\K[^"]+')
TEST_METHODS=""
METHOD_NUM=0

for method in $PUBLIC_METHODS; do
    # Skip constructors and property accessors
    if [ "$method" = "$CLASS_NAME" ] || [ "$method" = "get" ] || [ "$method" = "set" ]; then
        continue
    fi

    METHOD_NUM=$((METHOD_NUM + 1))

    # Generate happy path test
    TEST_METHODS+="
    [Fact]
    public async Task ${method}_ValidInput_ReturnsExpectedResult()
    {
        // Arrange
        // TODO: Setup test data and mock behaviors

        // Act
        var result = await _sut.${method}();

        // Assert
        result.Should().NotBeNull();
        // TODO: Add specific assertions
    }
"

    # Generate null input test
    TEST_METHODS+="
    [Fact]
    public async Task ${method}_NullInput_ThrowsArgumentNullException()
    {
        // Arrange
        // TODO: Setup null input scenario

        // Act
        Func<Task> act = async () => await _sut.${method}(null);

        // Assert
        await act.Should().ThrowAsync<ArgumentNullException>();
    }
"
done

echo "  Generated $((METHOD_NUM * 2)) test methods"
echo ""

# Step 5: Determine additional usings
echo "Step 5: Adding necessary usings..."
ADDITIONAL_USINGS="using $NAMESPACE;"
if echo "$ANALYSIS" | grep -q '"hasDbContext": true'; then
    ADDITIONAL_USINGS+="\nusing Microsoft.EntityFrameworkCore;"
fi
if echo "$ANALYSIS" | grep -q '"isSaga": true'; then
    ADDITIONAL_USINGS+="\nusing MassTransit;"
    ADDITIONAL_USINGS+="\nusing MassTransit.Testing;"
fi
echo ""

# Step 6: Replace template placeholders
echo "Step 6: Populating template..."
TEST_CONTENT=$(echo -e "$TEST_CONTENT" | sed "s|{{NAMESPACE}}|$NAMESPACE|g")
TEST_CONTENT=$(echo -e "$TEST_CONTENT" | sed "s|{{CLASS_NAME}}|$CLASS_NAME|g")
TEST_CONTENT=$(echo -e "$TEST_CONTENT" | sed "s|{{CONTROLLER_NAME}}|$CLASS_NAME|g")
TEST_CONTENT=$(echo -e "$TEST_CONTENT" | sed "s|{{COMPONENT_NAME}}|$CLASS_NAME|g")
TEST_CONTENT=$(echo -e "$TEST_CONTENT" | sed "s|{{SAGA_NAME}}|$CLASS_NAME|g")
TEST_CONTENT=$(echo -e "$TEST_CONTENT" | sed "s|{{ADDITIONAL_USINGS}}|$ADDITIONAL_USINGS|g")

# Replace multi-line placeholders (need careful handling)
echo -e "$TEST_CONTENT" > /tmp/test_template_$$.txt
sed -i "s|{{MOCK_DECLARATIONS}}|$(echo -e "$MOCK_DECLARATIONS" | sed 's/|/\\|/g')|g" /tmp/test_template_$$.txt
sed -i "s|{{MOCK_INITIALIZATIONS}}|$(echo -e "$MOCK_INITIALIZATIONS" | sed 's/|/\\|/g')|g" /tmp/test_template_$$.txt
sed -i "s|{{CONSTRUCTOR_PARAMS}}|$CONSTRUCTOR_PARAMS|g" /tmp/test_template_$$.txt
sed -i "s|{{TEST_METHODS}}|$(echo -e "$TEST_METHODS" | sed 's/|/\\|/g')|g" /tmp/test_template_$$.txt
sed -i "s|{{SERVICE_REGISTRATIONS}}|$(echo -e "$SERVICE_REGISTRATIONS" | sed 's/|/\\|/g')|g" /tmp/test_template_$$.txt
sed -i "s|{{HELPER_METHODS}}|// Add helper methods here|g" /tmp/test_template_$$.txt
TEST_CONTENT=$(cat /tmp/test_template_$$.txt)
rm /tmp/test_template_$$.txt
echo ""

# Step 7: Write test file
echo "Step 7: Writing test file..."
TEST_FILE="$TEST_PROJECT/${CLASS_NAME}Tests.cs"
mkdir -p "$TEST_PROJECT"
echo "$TEST_CONTENT" > "$TEST_FILE"
echo "  Created: $TEST_FILE"
echo ""

# Step 8: Summary
echo "=================================================="
echo "✅ Test generation complete!"
echo "=================================================="
echo ""
echo "Test File: $TEST_FILE"
echo "Test Methods: $((METHOD_NUM * 2))"
echo ""
echo "Next steps:"
echo "  1. Review generated test file: $TEST_FILE"
echo "  2. Add specific test data and assertions"
echo "  3. Update TODO comments with actual implementation"
echo "  4. Run tests: dotnet test $TEST_PROJECT"
echo ""
