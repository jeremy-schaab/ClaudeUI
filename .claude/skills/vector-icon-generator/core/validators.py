"""
Validators Module
=================

Icon validation and quality checking.
Ensures icons meet accessibility and quality standards.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass
from .color_palettes import calculate_contrast_ratio, is_wcag_compliant


@dataclass
class ValidationResult:
    """Result of icon validation"""
    valid: bool
    issues: List[str]
    warnings: List[str]
    suggestions: List[str]

    def has_issues(self) -> bool:
        """Check if there are any validation issues"""
        return len(self.issues) > 0

    def has_warnings(self) -> bool:
        """Check if there are any warnings"""
        return len(self.warnings) > 0

    def get_summary(self) -> str:
        """Get validation summary"""
        if self.valid and not self.warnings:
            return "✓ Icon passed all validation checks"

        lines = []
        if self.issues:
            lines.append(f"✗ {len(self.issues)} issue(s) found:")
            for issue in self.issues:
                lines.append(f"  - {issue}")

        if self.warnings:
            lines.append(f"⚠ {len(self.warnings)} warning(s):")
            for warning in self.warnings:
                lines.append(f"  - {warning}")

        if self.suggestions:
            lines.append(f"💡 {len(self.suggestions)} suggestion(s):")
            for suggestion in self.suggestions:
                lines.append(f"  - {suggestion}")

        return "\n".join(lines)


def validate_svg_string(
    svg_content: str,
    min_size: Optional[int] = None,
    max_size: Optional[int] = None,
    check_accessibility: bool = True
) -> ValidationResult:
    """
    Validate SVG content string.

    Args:
        svg_content: SVG XML content
        min_size: Minimum icon size (optional)
        max_size: Maximum icon size (optional)
        check_accessibility: Check accessibility compliance

    Returns:
        ValidationResult instance
    """
    issues = []
    warnings = []
    suggestions = []

    # Basic SVG structure check
    if not svg_content.strip():
        issues.append("SVG content is empty")
        return ValidationResult(False, issues, warnings, suggestions)

    if '<svg' not in svg_content:
        issues.append("SVG root element not found")
        return ValidationResult(False, issues, warnings, suggestions)

    # Check for viewBox
    if 'viewBox' not in svg_content and 'viewbox' not in svg_content.lower():
        warnings.append("viewBox attribute missing - icon may not scale properly")
        suggestions.append("Add viewBox attribute for proper scaling")

    # Check for xmlns
    if 'xmlns' not in svg_content:
        warnings.append("XML namespace (xmlns) missing")
        suggestions.append("Add xmlns='http://www.w3.org/2000/svg' for standards compliance")

    # Check for size attributes
    has_width = 'width=' in svg_content
    has_height = 'height=' in svg_content

    if not has_width and not has_height:
        warnings.append("Width and height attributes missing")
        suggestions.append("Add width and height attributes for explicit sizing")

    # Check file size (approximate)
    size_kb = len(svg_content.encode('utf-8')) / 1024
    if size_kb > 50:
        warnings.append(f"SVG file size is large ({size_kb:.1f}KB)")
        suggestions.append("Consider simplifying paths or reducing precision")

    # Check for common issues
    if '<script' in svg_content.lower():
        issues.append("Script tags found - potential security risk")

    if 'data:' in svg_content:
        warnings.append("Embedded data URIs found - increases file size")

    # Accessibility checks
    if check_accessibility:
        if '<title>' not in svg_content.lower():
            warnings.append("Missing <title> element for accessibility")
            suggestions.append("Add <title> element for screen readers")

        if 'aria-label' not in svg_content.lower() and 'aria-labelledby' not in svg_content.lower():
            suggestions.append("Consider adding aria-label or aria-labelledby for accessibility")

    valid = len(issues) == 0
    return ValidationResult(valid, issues, warnings, suggestions)


def validate_stroke_width(
    stroke_width: float,
    icon_size: int = 48,
    style: str = 'line_art'
) -> ValidationResult:
    """
    Validate stroke width for accessibility.

    Args:
        stroke_width: Stroke width in pixels
        icon_size: Icon size in pixels
        style: Icon style

    Returns:
        ValidationResult instance
    """
    issues = []
    warnings = []
    suggestions = []

    # Minimum stroke width for accessibility (scales with size)
    min_stroke = max(1.0, icon_size / 32)

    if stroke_width < min_stroke and style.startswith('line_art'):
        issues.append(f"Stroke width ({stroke_width}px) is too thin for {icon_size}px icon")
        suggestions.append(f"Use at least {min_stroke:.1f}px stroke width for accessibility")

    # Maximum stroke width (shouldn't be more than 10% of icon size)
    max_stroke = icon_size * 0.1
    if stroke_width > max_stroke:
        warnings.append(f"Stroke width ({stroke_width}px) is very bold for {icon_size}px icon")
        suggestions.append(f"Consider using stroke width between {min_stroke:.1f}px and {max_stroke:.1f}px")

    valid = len(issues) == 0
    return ValidationResult(valid, issues, warnings, suggestions)


def validate_color_contrast(
    foreground: str,
    background: str = '#FFFFFF',
    level: str = 'AA'
) -> ValidationResult:
    """
    Validate color contrast for accessibility.

    Args:
        foreground: Foreground color (hex)
        background: Background color (hex)
        level: WCAG level ('AA' or 'AAA')

    Returns:
        ValidationResult instance
    """
    issues = []
    warnings = []
    suggestions = []

    try:
        ratio = calculate_contrast_ratio(foreground, background)
        compliant = is_wcag_compliant(foreground, background, level, 'large')

        if not compliant:
            required_ratio = 3.0 if level == 'AA' else 4.5
            issues.append(
                f"Color contrast ratio ({ratio:.2f}:1) does not meet WCAG {level} "
                f"requirements (minimum {required_ratio}:1)"
            )
            suggestions.append("Use darker foreground or lighter background colors")
        else:
            # Check if it would pass AAA
            if level == 'AA' and is_wcag_compliant(foreground, background, 'AAA', 'large'):
                suggestions.append(f"Great! Your colors also meet WCAG AAA standards ({ratio:.2f}:1)")

    except Exception as e:
        issues.append(f"Error validating color contrast: {str(e)}")

    valid = len(issues) == 0
    return ValidationResult(valid, issues, warnings, suggestions)


def validate_icon_complexity(
    svg_content: str,
    max_paths: int = 20,
    max_points: int = 200
) -> ValidationResult:
    """
    Validate icon complexity.

    Args:
        svg_content: SVG XML content
        max_paths: Maximum number of path elements
        max_points: Maximum total path points

    Returns:
        ValidationResult instance
    """
    issues = []
    warnings = []
    suggestions = []

    # Count path elements
    path_count = svg_content.count('<path')
    if path_count > max_paths:
        warnings.append(f"Icon has {path_count} paths (recommended max: {max_paths})")
        suggestions.append("Consider simplifying the icon design or combining paths")

    # Estimate complexity by counting path commands
    path_commands = svg_content.count('M ') + svg_content.count('L ') + svg_content.count('C ')
    if path_commands > max_points:
        warnings.append(f"Icon has high path complexity ({path_commands} commands)")
        suggestions.append("Simplify paths or reduce detail for better performance")

    valid = len(issues) == 0
    return ValidationResult(valid, issues, warnings, suggestions)


def validate_icon_for_platform(
    svg_content: str,
    platform: str,
    size: int
) -> ValidationResult:
    """
    Validate icon for specific platform requirements.

    Args:
        svg_content: SVG XML content
        platform: Platform name
        size: Icon size

    Returns:
        ValidationResult instance
    """
    from .icon_styles import get_platform_preset

    issues = []
    warnings = []
    suggestions = []

    preset = get_platform_preset(platform)
    if not preset:
        warnings.append(f"Unknown platform: {platform}")
        return ValidationResult(True, issues, warnings, suggestions)

    # Check size
    if size != preset.size:
        warnings.append(f"Icon size ({size}px) differs from recommended size for {platform} ({preset.size}px)")
        suggestions.append(f"Use {preset.size}x{preset.size}px for optimal {platform} compatibility")

    # Check complexity
    if preset.max_complexity == 'simple':
        complexity_result = validate_icon_complexity(svg_content, max_paths=5, max_points=50)
        if complexity_result.has_warnings():
            warnings.extend(complexity_result.warnings)
            suggestions.append(f"Simplify icon for {platform} (requires simple designs)")

    valid = len(issues) == 0
    return ValidationResult(valid, issues, warnings, suggestions)


def validate_icon_complete(
    svg_content: str,
    size: int = 48,
    stroke_width: Optional[float] = None,
    foreground: str = '#000000',
    background: str = '#FFFFFF',
    platform: Optional[str] = None
) -> ValidationResult:
    """
    Perform complete icon validation.

    Args:
        svg_content: SVG XML content
        size: Icon size
        stroke_width: Stroke width (optional)
        foreground: Foreground color
        background: Background color
        platform: Target platform (optional)

    Returns:
        Combined ValidationResult
    """
    all_issues = []
    all_warnings = []
    all_suggestions = []

    # SVG structure validation
    svg_result = validate_svg_string(svg_content)
    all_issues.extend(svg_result.issues)
    all_warnings.extend(svg_result.warnings)
    all_suggestions.extend(svg_result.suggestions)

    # Stroke width validation
    if stroke_width is not None:
        stroke_result = validate_stroke_width(stroke_width, size)
        all_issues.extend(stroke_result.issues)
        all_warnings.extend(stroke_result.warnings)
        all_suggestions.extend(stroke_result.suggestions)

    # Color contrast validation
    contrast_result = validate_color_contrast(foreground, background)
    all_issues.extend(contrast_result.issues)
    all_warnings.extend(contrast_result.warnings)
    all_suggestions.extend(contrast_result.suggestions)

    # Platform-specific validation
    if platform:
        platform_result = validate_icon_for_platform(svg_content, platform, size)
        all_issues.extend(platform_result.issues)
        all_warnings.extend(platform_result.warnings)
        all_suggestions.extend(platform_result.suggestions)

    valid = len(all_issues) == 0
    return ValidationResult(valid, all_issues, all_warnings, all_suggestions)


if __name__ == '__main__':
    # Example usage
    print("Validators Module\n" + "=" * 50)

    # Test SVG validation
    sample_svg = '''<?xml version="1.0"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <path d="M10,10 L40,40" stroke="#000" stroke-width="2"/>
    </svg>'''

    result = validate_svg_string(sample_svg)
    print("\nSVG Validation:")
    print(result.get_summary())

    # Test stroke width validation
    result = validate_stroke_width(1.0, 48, 'line_art')
    print("\n\nStroke Width Validation:")
    print(result.get_summary())

    # Test color contrast
    result = validate_color_contrast('#666666', '#FFFFFF', 'AA')
    print("\n\nColor Contrast Validation:")
    print(result.get_summary())
