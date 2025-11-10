#!/bin/bash

# parse-story.sh - Extracts information from story markdown file
# Usage: ./parse-story.sh <story-file>

set -e

STORY_FILE=$1

if [ -z "$STORY_FILE" ]; then
    echo "Error: Story file path required"
    echo "Usage: $0 <story-file>"
    exit 1
fi

if [ ! -f "$STORY_FILE" ]; then
    echo "Error: Story file not found: $STORY_FILE"
    exit 1
fi

# Extract story number and title
STORY_NUMBER=$(grep -oP '# User Story \K\d+' "$STORY_FILE" | head -1)
STORY_TITLE=$(grep -oP '# User Story \d+ : \K.+$' "$STORY_FILE" | head -1)

# Extract details
STATE=$(grep -oP '\*\*State\*\*: \K.+$' "$STORY_FILE" | head -1)
PRIORITY=$(grep -oP '\*\*Priority\*\*: \K.+$' "$STORY_FILE" | head -1)
ASSIGNED_TO=$(grep -oP '\*\*Assigned To\*\*: \K.+$' "$STORY_FILE" | head -1)
STORY_POINTS=$(grep -oP '\*\*Story Points\*\*: \K.+$' "$STORY_FILE" | head -1)

# Extract description (between ## Description and next ##)
DESCRIPTION=$(sed -n '/## Description/,/^##/p' "$STORY_FILE" | sed '1d;$d' | tr '\n' ' ' | sed 's/<br>/\n/g')

# Extract acceptance criteria
ACCEPTANCE_CRITERIA=$(sed -n '/## Acceptance Criteria/,/^##/p' "$STORY_FILE" | sed '1d;$d' | grep -v '^$' || echo "")

# Extract features if present
FEATURES=$(sed -n '/## Features/,/^##/p' "$STORY_FILE" | grep -E '^\d+\.' | sed 's/^[0-9]*\. //' || sed -n '/## Implementation Plan/,/^##/p' "$STORY_FILE" | grep -E '^## Feature' | sed 's/^## Feature [0-9]*: //' || echo "")

# Extract implementation phases
PHASES=$(sed -n '/## Implementation Plan/,$p' "$STORY_FILE" | grep -E '^## (Phase|Feature) [0-9]+:' | sed 's/^## //' || echo "")

# Extract Azure DevOps link
AZURE_LINK=$(grep -oP '\[View in Azure DevOps\]\(\K[^)]+' "$STORY_FILE" | head -1)

# Get file basename for slug
FILE_BASENAME=$(basename "$STORY_FILE" .md)
STORY_SLUG=$(echo "$FILE_BASENAME" | sed "s/^$STORY_NUMBER-//")

# Output JSON
cat <<EOF
{
  "storyNumber": "$STORY_NUMBER",
  "storyTitle": "$STORY_TITLE",
  "storySlug": "$STORY_SLUG",
  "state": "$STATE",
  "priority": "$PRIORITY",
  "assignedTo": "$ASSIGNED_TO",
  "storyPoints": "$STORY_POINTS",
  "description": $(echo "$DESCRIPTION" | jq -Rs .),
  "acceptanceCriteria": $(echo "$ACCEPTANCE_CRITERIA" | jq -Rs .),
  "features": [$(echo "$FEATURES" | awk '{printf "\"%s\",", $0}' | sed 's/,$//')],
  "phases": [$(echo "$PHASES" | awk '{printf "\"%s\",", $0}' | sed 's/,$//')],
  "azureDevOpsLink": "$AZURE_LINK",
  "sourceFile": "$STORY_FILE"
}
EOF
