#!/bin/bash

# create-tracking-file.sh - Creates implementation tracking file for a story
# Usage: ./create-tracking-file.sh <story-number> [story-file]

set -e

STORY_NUMBER=$1
STORY_FILE=$2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../templates"
CONFIG_DIR="$SCRIPT_DIR/../config"

if [ -z "$STORY_NUMBER" ]; then
    echo "Error: Story number required"
    echo "Usage: $0 <story-number> [story-file]"
    exit 1
fi

# Auto-detect story file if not provided
if [ -z "$STORY_FILE" ]; then
    STORY_FILE=$(find docs/stories -name "${STORY_NUMBER}-*.md" ! -name "*-tracking.md" | head -1)
    if [ -z "$STORY_FILE" ]; then
        echo "Error: Could not find story file for story $STORY_NUMBER"
        exit 1
    fi
    echo "Found story file: $STORY_FILE"
fi

echo "=================================================="
echo "CloudManager Story Tracker"
echo "=================================================="
echo "Creating tracking file for Story $STORY_NUMBER"
echo ""

# Step 1: Parse story file
echo "Step 1: Parsing story file..."
STORY_DATA=$("$SCRIPT_DIR/parse-story.sh" "$STORY_FILE")

STORY_TITLE=$(echo "$STORY_DATA" | jq -r '.storyTitle')
STORY_SLUG=$(echo "$STORY_DATA" | jq -r '.storySlug')
FEATURES=$(echo "$STORY_DATA" | jq -r '.features[]' | sed 's/^/- /')
PHASES=$(echo "$STORY_DATA" | jq -r '.phases[]')

echo "  Title: $STORY_TITLE"
echo "  Features: $(echo "$FEATURES" | wc -l) found"
echo "  Phases: $(echo "$PHASES" | wc -l) found"
echo ""

# Step 2: Determine tracking file path
STORY_DIR=$(dirname "$STORY_FILE")
TRACKING_FILE="$STORY_DIR/${STORY_NUMBER}-implementation-tracking.md"

if [ -f "$TRACKING_FILE" ]; then
    echo "Warning: Tracking file already exists: $TRACKING_FILE"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Step 3: Generate tracking file content
echo "Step 2: Generating tracking file content..."
START_DATE=$(date +%Y-%m-%d)

# Create tracking file header
cat > "$TRACKING_FILE" <<EOF
# Story $STORY_NUMBER - Implementation Tracking

**Story:** $STORY_TITLE

$(if [ -n "$FEATURES" ]; then
    echo "**Features:**"
    echo "$FEATURES"
fi)

**Started:** $START_DATE
**Status:** 📝 Not Started

---

## Implementation Progress

EOF

# Add phases if found, otherwise create default phases
if [ -n "$PHASES" ]; then
    PHASE_NUM=1
    echo "$PHASES" | while read -r phase; do
        cat >> "$TRACKING_FILE" <<EOF
### $phase 📝 PENDING

#### ✅ Completed Tasks
- To be tracked during implementation

#### ⏳ Pending Tasks
- [ ] Begin implementation
- [ ] Track progress

EOF
        PHASE_NUM=$((PHASE_NUM + 1))
    done
else
    # Default phases
    cat >> "$TRACKING_FILE" <<EOF
### Phase 1: Planning and Analysis 📝 PENDING

#### ✅ Completed Tasks
- [x] Story tracking file created

#### ⏳ Pending Tasks
- [ ] Review story requirements
- [ ] Identify implementation approach
- [ ] Create technical design

### Phase 2: Implementation 📝 PENDING

#### ✅ Completed Tasks
- To be tracked during implementation

#### ⏳ Pending Tasks
- [ ] Backend implementation
- [ ] Frontend implementation
- [ ] Testing

EOF
fi

# Add remaining sections
cat >> "$TRACKING_FILE" <<EOF

---

## Current Status Update

### $START_DATE - Implementation Started
- ✅ Story $STORY_NUMBER tracking file created
- ✅ Implementation plan reviewed
- ⏳ Ready to begin implementation

---

## Implementation Notes

### Key Findings
- To be documented during implementation

### Technical Decisions
- To be documented during implementation

### Blockers
None currently

### Questions/Risks
- To be identified during implementation

---

## Files Modified

### Story Documentation
- ✅ \`$STORY_FILE\` (Initial story)
- ✅ \`$TRACKING_FILE\` (This file)

### Backend Changes
- To be tracked during implementation

### Frontend Components
- To be tracked during implementation

---

## Implementation Summary

### ✅ What Was Built
To be documented upon completion

### How It Works
To be documented upon completion

---

## Next Actions

### Immediate
1. ⏳ Begin implementation of Phase 1
2. ⏳ Track progress in this file
3. ⏳ Update file tracking after each commit

### Future Enhancements (Optional)
- To be identified during implementation
EOF

echo "  Created: $TRACKING_FILE"
echo ""

# Step 4: Add to git
echo "Step 3: Adding to git..."
git add "$TRACKING_FILE"
echo "  Staged: $TRACKING_FILE"
echo ""

echo "=================================================="
echo "✅ Tracking file created successfully!"
echo "=================================================="
echo ""
echo "Tracking File: $TRACKING_FILE"
echo ""
echo "Next steps:"
echo "  1. Review and customize tracking file"
echo "  2. Begin implementation"
echo "  3. Update progress with: update-progress $STORY_NUMBER --complete \"task\""
echo "  4. Track files with: track-files $STORY_NUMBER"
echo ""
