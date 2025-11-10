#!/bin/bash

# track-git-changes.sh - Tracks git changes and updates tracking file
# Usage: ./track-git-changes.sh <story-number>

set -e

STORY_NUMBER=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

if [ -z "$STORY_NUMBER" ]; then
    echo "Error: Story number required"
    echo "Usage: $0 <story-number>"
    exit 1
fi

# Find tracking file
TRACKING_FILE=$(find docs/stories -name "${STORY_NUMBER}-implementation-tracking.md" | head -1)
if [ -z "$TRACKING_FILE" ]; then
    echo "Error: Tracking file not found for story $STORY_NUMBER"
    exit 1
fi

echo "Tracking git changes for Story $STORY_NUMBER..."
echo ""

# Get changed files from current branch
CURRENT_BRANCH=$(git branch --show-current)
MAIN_BRANCH="main"

# Get all commits on current branch not in main
CHANGED_FILES=$(git diff --name-only "$MAIN_BRANCH...$CURRENT_BRANCH" | sort -u)

if [ -z "$CHANGED_FILES" ]; then
    echo "No changes detected on branch $CURRENT_BRANCH"
    exit 0
fi

# Categorize files
BACKEND_FILES=""
FRONTEND_FILES=""
DATABASE_FILES=""
TEST_FILES=""
CONFIG_FILES=""
DOC_FILES=""

while IFS= read -r file; do
    # Skip tracking file itself
    if [[ "$file" == *"-tracking.md" ]]; then
        continue
    fi

    # Get latest commit for this file
    COMMIT_HASH=$(git log -1 --format="%h" -- "$file" 2>/dev/null || echo "pending")

    if [[ "$file" == src/**/*.cs ]] && [[ "$file" != src/**/*.razor.cs ]]; then
        BACKEND_FILES+="- ✅ \`$file\` (commit $COMMIT_HASH)\n"
    elif [[ "$file" == src/**/*.razor* ]]; then
        FRONTEND_FILES+="- ✅ \`$file\` (commit $COMMIT_HASH)\n"
    elif [[ "$file" == **/*Migration*.cs ]] || [[ "$file" == **/*.sql* ]]; then
        DATABASE_FILES+="- ✅ \`$file\` (commit $COMMIT_HASH)\n"
    elif [[ "$file" == tests/**/*.cs ]]; then
        TEST_FILES+="- ✅ \`$file\` (commit $COMMIT_HASH)\n"
    elif [[ "$file" == **/*.json ]] || [[ "$file" == **/*.yml ]]; then
        CONFIG_FILES+="- ✅ \`$file\` (commit $COMMIT_HASH)\n"
    elif [[ "$file" == docs/**/*.md ]]; then
        DOC_FILES+="- ✅ \`$file\` (commit $COMMIT_HASH)\n"
    fi
done <<< "$CHANGED_FILES"

# Update tracking file
echo "Updating tracking file..."

# Find Files Modified section
if grep -q "## Files Modified" "$TRACKING_FILE"; then
    # Create temp file with updates
    TMP_FILE=$(mktemp)

    # Copy everything before Files Modified section
    sed '/## Files Modified/q' "$TRACKING_FILE" > "$TMP_FILE"

    # Add updated Files Modified section
    echo "" >> "$TMP_FILE"

    if [ -n "$DOC_FILES" ]; then
        echo "### Story Documentation" >> "$TMP_FILE"
        echo -e "$DOC_FILES" >> "$TMP_FILE"
        echo "" >> "$TMP_FILE"
    fi

    if [ -n "$BACKEND_FILES" ]; then
        echo "### Backend Changes" >> "$TMP_FILE"
        echo -e "$BACKEND_FILES" >> "$TMP_FILE"
        echo "" >> "$TMP_FILE"
    fi

    if [ -n "$FRONTEND_FILES" ]; then
        echo "### Frontend Components" >> "$TMP_FILE"
        echo -e "$FRONTEND_FILES" >> "$TMP_FILE"
        echo "" >> "$TMP_FILE"
    fi

    if [ -n "$DATABASE_FILES" ]; then
        echo "### Database Changes" >> "$TMP_FILE"
        echo -e "$DATABASE_FILES" >> "$TMP_FILE"
        echo "" >> "$TMP_FILE"
    fi

    if [ -n "$TEST_FILES" ]; then
        echo "### Tests" >> "$TMP_FILE"
        echo -e "$TEST_FILES" >> "$TMP_FILE"
        echo "" >> "$TMP_FILE"
    fi

    if [ -n "$CONFIG_FILES" ]; then
        echo "### Configuration Files" >> "$TMP_FILE"
        echo -e "$CONFIG_FILES" >> "$TMP_FILE"
        echo "" >> "$TMP_FILE"
    fi

    # Copy everything after Files Modified section
    sed -n '/^## Implementation Summary/,$p' "$TRACKING_FILE" >> "$TMP_FILE"

    # Replace original file
    mv "$TMP_FILE" "$TRACKING_FILE"

    echo "✅ Tracking file updated with git changes"
    echo ""
    echo "Files tracked:"
    echo "  Backend: $(echo -e "$BACKEND_FILES" | grep -c "✅" || echo 0)"
    echo "  Frontend: $(echo -e "$FRONTEND_FILES" | grep -c "✅" || echo 0)"
    echo "  Database: $(echo -e "$DATABASE_FILES" | grep -c "✅" || echo 0)"
    echo "  Tests: $(echo -e "$TEST_FILES" | grep -c "✅" || echo 0)"
    echo "  Config: $(echo -e "$CONFIG_FILES" | grep -c "✅" || echo 0)"
    echo "  Docs: $(echo -e "$DOC_FILES" | grep -c "✅" || echo 0)"
fi

echo ""
echo "Tracking file: $TRACKING_FILE"
