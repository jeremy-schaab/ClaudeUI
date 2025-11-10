#!/bin/bash

# generate-component.sh - Generates Blazor component from template
# Usage: ./generate-component.sh <component-type> <entity-name> [options]

set -e

COMPONENT_TYPE=$1
ENTITY_NAME=$2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../templates"
CONFIG_DIR="$SCRIPT_DIR/../config"

if [ -z "$COMPONENT_TYPE" ] || [ -z "$ENTITY_NAME" ]; then
    echo "Error: Component type and entity name required"
    echo "Usage: $0 <component-type> <entity-name>"
    echo "Component types: grid, dialog, form, crud-page, lookup"
    exit 1
fi

echo "=================================================="
echo "Blazor Telerik Scaffold"
echo "=================================================="
echo "Generating $COMPONENT_TYPE for $ENTITY_NAME"
echo ""

# Determine template file
TEMPLATE_FILE="$TEMPLATE_DIR/${COMPONENT_TYPE}-component.razor.template"
if [ "$COMPONENT_TYPE" = "crud-page" ]; then
    TEMPLATE_FILE="$TEMPLATE_DIR/crud-page.razor.template"
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template not found: $TEMPLATE_FILE"
    exit 1
fi

# Determine output location
if [ "$COMPONENT_TYPE" = "crud-page" ]; then
    OUTPUT_DIR="src/Fyi.Cloud.Manager.WebApp/Fyi.Cloud.Manager.WebApp/Components/Pages"
    OUTPUT_FILE="$OUTPUT_DIR/${ENTITY_NAME}s.razor"
else
    OUTPUT_DIR="src/Fyi.Cloud.Manager.Web.Components"
    OUTPUT_FILE="$OUTPUT_DIR/${ENTITY_NAME}${COMPONENT_TYPE^}.razor"
fi

mkdir -p "$OUTPUT_DIR"

echo "Template: $TEMPLATE_FILE"
echo "Output: $OUTPUT_FILE"
echo ""

# Generate component content
CONTENT=$(cat "$TEMPLATE_FILE")

# Replace placeholders
CONTENT="${CONTENT//\{\{ENTITY_NAME\}\}/$ENTITY_NAME}"
CONTENT="${CONTENT//\{\{ENTITY_NAME_LOWER\}\}/$(echo $ENTITY_NAME | tr '[:upper:]' '[:lower:]')}"
CONTENT="${CONTENT//\{\{NAMESPACE\}\}/Fyi.Cloud.Manager}"
CONTENT="${CONTENT//\{\{COMPONENT_NAME\}\}/${ENTITY_NAME}${COMPONENT_TYPE^}}"
CONTENT="${CONTENT//\{\{PAGE_NAME\}\}/${ENTITY_NAME}s}"
CONTENT="${CONTENT//\{\{PAGE_TITLE\}\}/${ENTITY_NAME}s}"
CONTENT="${CONTENT//\{\{ROUTE\}\}/$(echo ${ENTITY_NAME}s | tr '[:upper:]' '[:lower:]')}"
CONTENT="${CONTENT//\{\{ID_FIELD\}\}/${ENTITY_NAME}Id}"

# Write component file
echo "$CONTENT" > "$OUTPUT_FILE"

echo "✅ Component generated successfully!"
echo ""
echo "Component: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "  1. Review generated component"
echo "  2. Customize as needed"
echo "  3. Add to navigation (if page)"
echo "  4. Test the component"
echo ""
