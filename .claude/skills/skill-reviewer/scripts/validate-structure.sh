#!/bin/bash
# validate-structure.sh
# Purpose: Check file/directory structure of a skill
# Usage: ./validate-structure.sh <skill-path>

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

if [ $# -ne 1 ]; then
    echo "Usage: $0 <skill-path>"
    exit 1
fi

SKILL_PATH="$1"
ISSUES=0

echo "Structure Validation"
echo "===================="

# Check SKILL.md exists
if [ -f "$SKILL_PATH/SKILL.md" ]; then
    echo -e "${GREEN}✅ STRUCT-001: SKILL.md exists${NC}"
else
    echo -e "${RED}❌ STRUCT-001: SKILL.md missing (-20 points)${NC}"
    ((ISSUES+=20))
fi

# Check for YAML frontmatter
if [ -f "$SKILL_PATH/SKILL.md" ] && grep -q "^---$" "$SKILL_PATH/SKILL.md"; then
    echo -e "${GREEN}✅ STRUCT-002: YAML frontmatter present${NC}"
else
    echo -e "${RED}❌ STRUCT-002: YAML frontmatter missing (-20 points)${NC}"
    ((ISSUES+=20))
fi

# Check directory name matches (extracted from YAML if present)
SKILL_NAME=$(basename "$SKILL_PATH")
if [ -f "$SKILL_PATH/SKILL.md" ]; then
    YAML_NAME=$(sed -n '/^---$/,/^---$/p' "$SKILL_PATH/SKILL.md" | grep "^name:" | awk '{print $2}' || echo "")
    if [ "$YAML_NAME" = "$SKILL_NAME" ]; then
        echo -e "${GREEN}✅ STRUCT-003: Directory name matches YAML name${NC}"
    elif [ -n "$YAML_NAME" ]; then
        echo -e "${RED}❌ STRUCT-003: Directory name mismatch (-5 points)${NC}"
        ((ISSUES+=5))
    fi
fi

# Check for scripts directory with execute permissions
if [ -d "$SKILL_PATH/scripts" ]; then
    SH_COUNT=$(find "$SKILL_PATH/scripts" -name "*.sh" 2>/dev/null | wc -l)
    if [ $SH_COUNT -gt 0 ]; then
        NON_EXEC=$(find "$SKILL_PATH/scripts" -name "*.sh" ! -perm -111 2>/dev/null | wc -l)
        if [ $NON_EXEC -eq 0 ]; then
            echo -e "${GREEN}✅ STRUCT-005: All scripts executable${NC}"
        else
            echo -e "${RED}❌ STRUCT-005: $NON_EXEC scripts not executable (-1 point)${NC}"
            ((ISSUES+=1))
        fi
    fi
fi

echo ""
echo "Total Penalty: $ISSUES points"
exit 0
