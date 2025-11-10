"""
Icon Review Module
==================

Visual quality review and issue detection for generated icons.
Catches common design problems like disconnected paths, poor spacing, and visual artifacts.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ReviewIssue:
    """Represents an icon quality issue"""
    severity: str  # 'critical', 'major', 'minor', 'suggestion'
    category: str  # 'connectivity', 'spacing', 'symmetry', 'complexity', 'style'
    message: str
    details: Optional[str] = None
    fix_suggestion: Optional[str] = None


@dataclass
class ReviewResult:
    """Result of icon review"""
    icon_name: str
    passed: bool
    issues: List[ReviewIssue]
    score: float  # 0-100

    def get_summary(self) -> str:
        """Get human-readable summary"""
        lines = [f"Icon Review: {self.icon_name}"]
        lines.append(f"Score: {self.score:.1f}/100")
        lines.append(f"Status: {'PASSED' if self.passed else 'FAILED'}")
        lines.append("")

        if not self.issues:
            lines.append("No issues found.")
            return "\n".join(lines)

        # Group by severity
        by_severity = {'critical': [], 'major': [], 'minor': [], 'suggestion': []}
        for issue in self.issues:
            by_severity[issue.severity].append(issue)

        for severity in ['critical', 'major', 'minor', 'suggestion']:
            issues = by_severity[severity]
            if issues:
                icon = {'critical': '[!]', 'major': '[*]', 'minor': '[-]', 'suggestion': '[i]'}[severity]
                lines.append(f"{icon} {severity.upper()} ({len(issues)}):")
                for issue in issues:
                    lines.append(f"  - [{issue.category}] {issue.message}")
                    if issue.details:
                        lines.append(f"    Details: {issue.details}")
                    if issue.fix_suggestion:
                        lines.append(f"    Fix: {issue.fix_suggestion}")
                lines.append("")

        return "\n".join(lines)


class IconReviewer:
    """Icon quality reviewer"""

    @staticmethod
    def review_icon(svg_content: str, icon_name: str = "icon") -> ReviewResult:
        """
        Perform comprehensive icon review.

        Args:
            svg_content: SVG XML content
            icon_name: Name of icon for reporting

        Returns:
            ReviewResult with issues and score
        """
        issues = []

        # Extract path data
        paths = IconReviewer._extract_paths(svg_content)

        # Run all checks
        issues.extend(IconReviewer._check_disconnected_paths(paths))
        issues.extend(IconReviewer._check_path_complexity(paths))
        issues.extend(IconReviewer._check_coordinate_precision(paths))
        issues.extend(IconReviewer._check_symmetry(paths))
        issues.extend(IconReviewer._check_centering(svg_content, paths))
        issues.extend(IconReviewer._check_stroke_consistency(svg_content))

        # Calculate score
        score = IconReviewer._calculate_score(issues)

        # Pass if score >= 70 and no critical issues
        critical_count = sum(1 for i in issues if i.severity == 'critical')
        passed = score >= 70 and critical_count == 0

        return ReviewResult(
            icon_name=icon_name,
            passed=passed,
            issues=issues,
            score=score
        )

    @staticmethod
    def _extract_paths(svg_content: str) -> List[Tuple[str, Dict[str, str]]]:
        """
        Extract path data and attributes from SVG.

        Returns:
            List of (path_data, attributes) tuples
        """
        paths = []

        # Find all <path> elements
        path_pattern = r'<path\s+([^>]+)/>'
        for match in re.finditer(path_pattern, svg_content):
            attrs_str = match.group(1)

            # Extract path data
            d_match = re.search(r'd="([^"]+)"', attrs_str)
            path_data = d_match.group(1) if d_match else ""

            # Extract style attributes
            attrs = {}
            for attr in ['stroke', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']:
                attr_match = re.search(f'{attr}:([^;]+)', attrs_str)
                if attr_match:
                    attrs[attr] = attr_match.group(1)

            paths.append((path_data, attrs))

        return paths

    @staticmethod
    def _check_disconnected_paths(paths: List[Tuple[str, Dict[str, str]]]) -> List[ReviewIssue]:
        """Check for disconnected path segments in stroke-only paths"""
        issues = []

        for path_data, attrs in paths:
            # Only check stroke-only paths (not filled)
            if attrs.get('fill') == 'none' or not attrs.get('fill'):
                # Count M (move) commands - more than 1 means disconnected segments
                move_commands = path_data.count(' M')
                if path_data.startswith('M'):
                    move_commands += 1

                if move_commands > 1:
                    issues.append(ReviewIssue(
                        severity='critical',
                        category='connectivity',
                        message=f'Path has {move_commands} disconnected segments',
                        details='Stroke-only paths with multiple M commands appear as separate, disconnected lines',
                        fix_suggestion='Connect path segments using L (line) commands instead of M (move) commands'
                    ))

        return issues

    @staticmethod
    def _check_path_complexity(paths: List[Tuple[str, Dict[str, str]]]) -> List[ReviewIssue]:
        """Check if paths are too complex"""
        issues = []

        for path_data, _ in paths:
            # Count path commands
            commands = len(re.findall(r'[MLHVCSQTAZ]', path_data, re.IGNORECASE))

            if commands > 50:
                issues.append(ReviewIssue(
                    severity='major',
                    category='complexity',
                    message=f'Path is very complex ({commands} commands)',
                    details='Complex paths are harder to render and edit',
                    fix_suggestion='Simplify path or break into multiple simpler paths'
                ))
            elif commands > 30:
                issues.append(ReviewIssue(
                    severity='minor',
                    category='complexity',
                    message=f'Path is moderately complex ({commands} commands)',
                    fix_suggestion='Consider simplifying if possible'
                ))

        return issues

    @staticmethod
    def _check_coordinate_precision(paths: List[Tuple[str, Dict[str, str]]]) -> List[ReviewIssue]:
        """Check for excessive coordinate precision"""
        issues = []

        for path_data, _ in paths:
            # Find coordinates with more than 2 decimal places
            high_precision = re.findall(r'\d+\.\d{3,}', path_data)

            if len(high_precision) > 5:
                issues.append(ReviewIssue(
                    severity='minor',
                    category='complexity',
                    message=f'Path has {len(high_precision)} coordinates with excessive precision',
                    details='More than 2 decimal places is rarely needed and increases file size',
                    fix_suggestion='Round coordinates to 2 decimal places'
                ))

        return issues

    @staticmethod
    def _check_symmetry(paths: List[Tuple[str, Dict[str, str]]]) -> List[ReviewIssue]:
        """Check for basic symmetry issues"""
        issues = []

        # This is a basic check - just flag if we detect potential asymmetry
        # More sophisticated symmetry checking would require path parsing

        for path_data, _ in paths:
            # Extract all coordinates
            coords = re.findall(r'(\d+\.?\d*),(\d+\.?\d*)', path_data)
            if len(coords) < 4:
                continue

            # Check if coordinates are roughly symmetric
            x_coords = [float(x) for x, _ in coords]
            y_coords = [float(y) for _, y in coords]

            # Calculate center
            center_x = (min(x_coords) + max(x_coords)) / 2
            center_y = (min(y_coords) + max(y_coords)) / 2

            # Check if points are roughly balanced around center
            left_count = sum(1 for x in x_coords if x < center_x - 1)
            right_count = sum(1 for x in x_coords if x > center_x + 1)

            if abs(left_count - right_count) > len(coords) * 0.4:
                issues.append(ReviewIssue(
                    severity='suggestion',
                    category='symmetry',
                    message='Icon may be horizontally unbalanced',
                    details=f'{left_count} points on left, {right_count} on right',
                    fix_suggestion='Consider balancing icon around center axis'
                ))

        return issues

    @staticmethod
    def _check_centering(svg_content: str, paths: List[Tuple[str, Dict[str, str]]]) -> List[ReviewIssue]:
        """Check if icon is centered in viewBox"""
        issues = []

        # Extract viewBox
        viewbox_match = re.search(r'viewBox="([^"]+)"', svg_content)
        if not viewbox_match:
            return issues

        viewbox = [float(x) for x in viewbox_match.group(1).split()]
        vb_width = viewbox[2]
        vb_height = viewbox[3]
        vb_center_x = vb_width / 2
        vb_center_y = vb_height / 2

        # Get bounding box of all paths
        all_x = []
        all_y = []

        for path_data, _ in paths:
            coords = re.findall(r'(\d+\.?\d*),(\d+\.?\d*)', path_data)
            all_x.extend([float(x) for x, _ in coords])
            all_y.extend([float(y) for _, y in coords])

        if not all_x:
            return issues

        # Calculate icon bounds
        min_x, max_x = min(all_x), max(all_x)
        min_y, max_y = min(all_y), max(all_y)
        icon_center_x = (min_x + max_x) / 2
        icon_center_y = (min_y + max_y) / 2

        # Check centering (allow 10% tolerance)
        tolerance = vb_width * 0.1

        if abs(icon_center_x - vb_center_x) > tolerance:
            issues.append(ReviewIssue(
                severity='minor',
                category='spacing',
                message='Icon is not horizontally centered',
                details=f'Icon center: {icon_center_x:.1f}, ViewBox center: {vb_center_x:.1f}',
                fix_suggestion='Adjust coordinates to center icon horizontally'
            ))

        if abs(icon_center_y - vb_center_y) > tolerance:
            issues.append(ReviewIssue(
                severity='minor',
                category='spacing',
                message='Icon is not vertically centered',
                details=f'Icon center: {icon_center_y:.1f}, ViewBox center: {vb_center_y:.1f}',
                fix_suggestion='Adjust coordinates to center icon vertically'
            ))

        return issues

    @staticmethod
    def _check_stroke_consistency(svg_content: str) -> List[ReviewIssue]:
        """Check for consistent stroke widths"""
        issues = []

        # Find all stroke-width values
        stroke_widths = re.findall(r'stroke-width:(\d+\.?\d*)', svg_content)
        if not stroke_widths:
            return issues

        unique_widths = set(stroke_widths)

        if len(unique_widths) > 2:
            issues.append(ReviewIssue(
                severity='suggestion',
                category='style',
                message=f'Icon uses {len(unique_widths)} different stroke widths',
                details=f'Widths: {", ".join(unique_widths)}',
                fix_suggestion='Use consistent stroke width for visual harmony'
            ))

        return issues

    @staticmethod
    def _calculate_score(issues: List[ReviewIssue]) -> float:
        """Calculate quality score from issues"""
        score = 100.0

        # Deduct points by severity
        deductions = {
            'critical': 25,
            'major': 10,
            'minor': 3,
            'suggestion': 1
        }

        for issue in issues:
            score -= deductions.get(issue.severity, 0)

        return max(0.0, score)


if __name__ == '__main__':
    # Example usage
    print("Icon Review Module\n" + "=" * 50)

    # Test with disconnected path (like the arrow issue)
    test_svg = '''<?xml version="1.0" ?>
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M32.00,24.00 L24.00,24.00 M24.00,20.00 L16.00,24.00 L24.00,28.00"
        style="stroke:#000000;stroke-width:2.0;fill:none;stroke-linecap:round;stroke-linejoin:round"/>
</svg>'''

    result = IconReviewer.review_icon(test_svg, "test-arrow")
    print(result.get_summary())
