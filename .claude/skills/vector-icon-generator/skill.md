---
skill_name: vector-icon-generator
description: Professional vector icon generation for web UI and documentation
version: 1.0.0
author: SchaabCore
tags: [icons, svg, vector, design, ui, graphics]
created: 2025-01-28
---

# Vector Icon Generator

Professional SVG icon generation skill for creating scalable, accessible icons optimized for web UI components and documentation.

## Features

- **Multiple Icon Styles**: Line art (thin/regular/bold), filled, duotone, minimal, rounded, sharp
- **Platform Presets**: Optimized settings for web UI, documentation, favicons, mobile, and app icons
- **Composable Primitives**: Build complex icons from basic shapes (circles, paths, polygons, etc.)
- **Color Palettes**: 9 pre-defined palettes (minimal, vibrant, pastel, dark, professional, ocean, sunset, forest, accessible)
- **Accessibility**: WCAG contrast validation, minimum stroke width enforcement
- **Quality Review**: Automatic detection of disconnected paths, poor centering, asymmetry, and style inconsistencies
- **SVG Export**: Professional vector format that scales perfectly to any size without quality loss
- **Validation**: Comprehensive quality checks for accessibility and platform compatibility

## Installation

```bash
cd .claude/skills/vector-icon-generator
pip install -r requirements.txt
```

**Dependencies:**
- `svgwrite>=1.4.3` - SVG document generation
- `lxml>=4.9.0` - XML parsing

**Note:** PNG export is disabled. The skill generates SVG files which are vector-based and scale perfectly to any size without quality loss.

## Quick Start

### Example 1: Simple Circle Icon

```python
from core.svg_builder import SVGBuilder, IconConfig

# Create a simple circle icon
builder = SVGBuilder(48, 48)
builder.add_circle(24, 24, 20, stroke='#3B82F6', stroke_width=2, fill='none')
svg = builder.to_svg()
builder.save('circle-icon.svg')
```

### Example 2: Styled Icon with Preset

```python
from core.svg_builder import SVGBuilder, IconConfig
from core.icon_styles import get_style_preset, apply_style_to_config

# Use a style preset
config = IconConfig(width=48, height=48)
style = get_style_preset('line_art_bold')
apply_style_to_config(config, style)

builder = SVGBuilder(48, 48, config)
builder.add_circle(24, 24, 20)
builder.save('styled-icon.svg')
```

### Example 3: Complex Icon with Geometry

```python
from core.svg_builder import SVGBuilder
from core.geometry import heart_path, star_path

builder = SVGBuilder(48, 48)

# Add a heart shape
heart = heart_path(24, 24, 2)
builder.add_path(heart, fill='#EF4444', stroke='none')

svg = builder.to_svg()
```

### Example 4: Export Multi-Size Icon Set

```python
from core.svg_builder import SVGBuilder
from core.export import IconExporter

# Create icon
builder = SVGBuilder(48, 48)
builder.add_circle(24, 24, 20, stroke='#3B82F6', stroke_width=2, fill='none')
svg_content = builder.to_svg()

# Export in multiple sizes (SVG only - scales perfectly to any size)
files = IconExporter.export_multi_size(
    svg_content,
    'my-icon',
    sizes=[16, 24, 32, 48, 64],
    formats=['svg'],
    output_dir='./icons'
)

print(f"Exported {len(files)} SVG files")
# SVG files work at any size - browsers/apps scale them automatically
```

## Icon Styles

### Available Styles

| Style | Description | Stroke Width | Use Case |
|-------|-------------|--------------|----------|
| `line_art_thin` | Thin outlined icons | 1.5px | Delicate, minimal UI |
| `line_art` | Standard outlined icons | 2.0px | General purpose |
| `line_art_bold` | Bold outlined icons | 2.5px | Prominent UI elements |
| `filled` | Solid filled icons | N/A | Modern, clean UI |
| `filled_stroke` | Filled with border | 1.0px | Defined edges |
| `duotone` | Two-color icons | N/A | Depth and hierarchy |
| `duotone_outlined` | Outlined duotone | 2.0px | Hybrid approach |
| `minimal` | Ultra-minimal | 1.0px | Subtle, elegant |
| `rounded` | Soft rounded corners | 2.0px | Friendly, modern |
| `sharp` | Angular, precise | 2.0px | Technical, precise |

### Platform Presets

| Platform | Size | Recommended Style | Complexity | Notes |
|----------|------|-------------------|------------|-------|
| `web_ui` | 24px | line_art_regular | Moderate | Buttons, navigation |
| `documentation` | 48px | line_art_bold | Complex | Technical docs, diagrams |
| `favicon` | 16px | filled_solid | Simple | Browser icons |
| `app_icon` | 512px | filled_stroke | Complex | High-detail app icons |
| `mobile_ui` | 32px | line_art_regular | Moderate | Mobile interfaces |

## Color Palettes

### Available Palettes

- **MINIMAL**: Monochrome for clean, minimal icons
- **VIBRANT**: Bright, saturated colors
- **PASTEL**: Soft, muted colors
- **DARK**: Dark theme optimized
- **PROFESSIONAL**: Corporate, business colors
- **OCEAN**: Blues and teals
- **SUNSET**: Warm tones
- **FOREST**: Greens and earth tones
- **ACCESSIBLE**: WCAG AA compliant

### Using Palettes

```python
from core.color_palettes import get_palette

palette = get_palette('vibrant')
print(palette['primary'])    # '#3B82F6'
print(palette['success'])    # '#10B981'
print(palette['error'])      # '#EF4444'
```

## Geometry Primitives

The `geometry` module provides functions for creating complex shapes:

### Basic Shapes

- `rounded_rect_path()` - Rounded rectangles
- `star_path()` - Star shapes (5-point, 6-point, etc.)
- `polygon_path()` - Regular polygons
- `heart_path()` - Heart shape
- `cross_path()` - Plus/cross shape
- `x_path()` - X shape

### Navigation Elements

- `arrow_path()` - Arrows with customizable heads
- `chevron_path()` - Chevron shapes (>, <, ^, v)
- `arc_path()` - Circular arcs

### Advanced Shapes

- `ring_path()` - Donut/ring shapes
- `bezier_curve()` - Cubic Bezier curves
- `smooth_polyline()` - Smooth curves through points

### Example Usage

```python
from core.svg_builder import SVGBuilder
from core.geometry import chevron_path, star_path

builder = SVGBuilder(48, 48)

# Add chevron pointing right
chevron = chevron_path(12, 16, 12, 16, 'right')
builder.add_path(chevron, stroke='#000', stroke_width=2)

# Add star
star = star_path(36, 24, 10, 5, 5)
builder.add_path(star, fill='#F59E0B', stroke='none')
```

## Validation & Accessibility

### Automatic Validation

```python
from core.validators import validate_icon_complete

svg_content = builder.to_svg()
result = validate_icon_complete(
    svg_content,
    size=48,
    stroke_width=2.0,
    foreground='#000000',
    background='#FFFFFF',
    platform='web_ui'
)

print(result.get_summary())
```

### Accessibility Checks

- **WCAG Contrast**: Validates color contrast ratios (AA/AAA compliance)
- **Stroke Width**: Ensures minimum stroke width for visibility
- **Complexity**: Warns about overly complex icons
- **Platform Compatibility**: Checks size and complexity for target platforms

### Color Contrast Validation

```python
from core.validators import validate_color_contrast

result = validate_color_contrast('#3B82F6', '#FFFFFF', level='AA')
if result.valid:
    print("✓ Colors meet WCAG AA standards")
else:
    print("✗ Contrast issues:")
    for issue in result.issues:
        print(f"  - {issue}")
```

### Icon Quality Review

The quality review system automatically detects visual design issues:

```python
from core.icon_review import IconReviewer

svg_content = builder.to_svg()
review = IconReviewer.review_icon(svg_content, 'my-icon')

print(review.get_summary())
# Outputs:
# Icon Review: my-icon
# Score: 100.0/100
# Status: PASSED
# No issues found.
```

**Review Checks:**
- **Connectivity** (Critical): Detects disconnected path segments in stroke-only paths
- **Path Complexity** (Major/Minor): Warns about paths with >30 commands
- **Coordinate Precision** (Minor): Identifies excessive decimal places
- **Centering** (Minor): Checks if icon is centered in viewBox
- **Symmetry** (Suggestion): Detects potential balance issues
- **Stroke Consistency** (Suggestion): Flags multiple stroke widths

**Example Review Output:**
```
Icon Review: arrow-left
Score: 75.0/100
Status: FAILED

[!] CRITICAL (1):
  - [connectivity] Path has 2 disconnected segments
    Details: Stroke-only paths with multiple M commands appear as separate, disconnected lines
    Fix: Connect path segments using L (line) commands instead of M (move) commands
```

**Score Interpretation:**
- **100-90**: Excellent quality, ready for production
- **89-70**: Good quality, minor improvements possible
- **69-50**: Acceptable quality, address flagged issues
- **<50**: Poor quality, significant issues need fixing

## Export Options

### Single SVG Export

```python
from core.export import IconExporter

# Uses default location: docs/icons/generated
IconExporter.export_svg(
    svg_content,
    'my-icon',
    minify=True
)

# Or specify custom location
IconExporter.export_svg(
    svg_content,
    'my-icon',
    output_dir='./custom-icons',
    minify=True
)
```

### Multi-Size SVG Export

**Note:** PNG export is disabled. SVG files are vector-based and scale perfectly to any size without quality loss.

```python
# Export same icon at multiple sizes (SVG only)
files = IconExporter.export_multi_size(
    svg_content,
    'my-icon',
    sizes=[16, 24, 32, 48, 64],
    formats=['svg']  # Only SVG supported
)

# Or specify custom location
files = IconExporter.export_multi_size(
    svg_content,
    'my-icon',
    sizes=[16, 24, 32, 48, 64],
    formats=['svg'],
    output_dir='./custom-icon-set'
)
```

### Icon Set with Manifest

```python
icons = [
    ('icon-1', svg_content_1),
    ('icon-2', svg_content_2),
    ('icon-3', svg_content_3)
]

# Export full icon set (SVG only)
files = IconExporter.export_icon_set(
    icons,
    sizes=[16, 24, 32, 48],
    formats=['svg'],  # Only SVG supported
    create_manifest=True
)
```

### Why SVG Only?

- **Perfect Scaling**: Vector format scales to any size without pixelation
- **Smaller File Size**: Usually smaller than equivalent PNG files
- **Cross-Platform**: Works in all modern browsers and applications
- **CSS Styling**: Can be styled and animated with CSS
- **Accessibility**: Better support for screen readers and high contrast modes
- **No Library Dependencies**: No Cairo/GTK+ installation required

## Building Custom Icons

### Step 1: Choose Size and Style

```python
from core.svg_builder import SVGBuilder, IconConfig
from core.icon_styles import get_style_preset

config = IconConfig(width=48, height=48)
style = get_style_preset('line_art')
config.stroke_width = style.stroke_width
config.stroke_color = '#3B82F6'

builder = SVGBuilder(48, 48, config)
```

### Step 2: Add Shapes

```python
# Add basic shapes
builder.add_circle(24, 24, 18)
builder.add_rect(12, 12, 24, 24, rx=4)

# Or use geometry primitives
from core.geometry import rounded_rect_path
path = rounded_rect_path(12, 12, 24, 24, 4)
builder.add_path(path)
```

### Step 3: Group and Transform

```python
# Group elements
builder.begin_group(id='main-group', transform='rotate(45 24 24)')
builder.add_circle(24, 24, 10)
builder.add_rect(19, 19, 10, 10)
builder.end_group()
```

### Step 4: Validate and Export

```python
# Get SVG
svg_content = builder.to_svg()

# Validate
from core.validators import validate_icon_complete
result = validate_icon_complete(svg_content, 48)
print(result.get_summary())

# Export
builder.save('my-custom-icon.svg')
```

## Best Practices

### Icon Design

1. **Keep It Simple**: Use 5-10 paths maximum for web UI icons
2. **Consistent Stroke Width**: Use 1.5-2.5px for 48px icons
3. **Grid Alignment**: Align to pixel grid for crisp rendering
4. **Appropriate Detail**: Match detail level to icon size
5. **Test at Small Sizes**: Verify icons work at 16x16 and 24x24

### Accessibility

1. **Color Contrast**: Maintain minimum 3:1 contrast ratio (WCAG AA)
2. **Stroke Width**: Use minimum 1.5px strokes for visibility
3. **Meaningful Shapes**: Ensure icons are recognizable
4. **Provide Alternatives**: Use labels or titles for screen readers
5. **Test in Context**: Verify on actual backgrounds

### Performance

1. **Minimize Paths**: Combine paths when possible
2. **Reduce Precision**: 2 decimal places is sufficient
3. **Use viewBox**: Always include for proper scaling
4. **Optimize SVG**: Use minification for production
5. **Consider PNG**: Use rasterized versions for frequently used icons

### Platform-Specific Tips

**Web UI (24px)**:
- Use line art or filled styles
- Keep details moderate
- Test at 1x and 2x scales

**Documentation (48px)**:
- Use bold line art
- Can include more detail
- Focus on clarity

**Favicons (16px)**:
- Use filled solid style
- Extremely simple shapes
- High contrast colors

## Troubleshooting

### Icons appear blurry
- Ensure viewBox matches width/height
- Align shapes to pixel boundaries
- Use appropriate stroke width for size

### Colors don't meet contrast requirements
- Use the validators module to check contrast
- Reference ACCESSIBLE palette for compliant colors
- Lighten/darken colors using color_palettes utilities

### PNG export fails
- Install cairosvg: `pip install cairosvg`
- On Windows, may need GTK+ libraries
- Fallback: Export SVG and use external tool

### Icons too complex
- Reduce number of paths
- Simplify curved paths
- Use basic shapes instead of detailed drawings

## Advanced Techniques

### Gradients

```python
builder.add_gradient(
    'my-gradient',
    gradient_type='linear',
    stops=[
        (0, '#3B82F6', 1.0),
        (100, '#8B5CF6', 1.0)
    ],
    x1='0%', y1='0%', x2='100%', y2='100%'
)

builder.add_rect(10, 10, 28, 28, fill='url(#my-gradient)')
```

### Duotone Icons

```python
from core.icon_styles import get_style_preset

style = get_style_preset('duotone')

# Background layer (secondary color, semi-transparent)
builder.add_circle(24, 24, 20, fill=style.secondary_color,
                   opacity=style.secondary_opacity)

# Foreground layer (primary color, full opacity)
builder.add_path(icon_detail_path, fill=style.fill_color)
```

### Responsive Icons

```python
# Create adaptive icon that changes based on size
def create_adaptive_icon(size):
    builder = SVGBuilder(size, size)

    # Show more detail at larger sizes
    if size >= 48:
        # Add detailed elements
        pass
    elif size >= 24:
        # Add moderate detail
        pass
    else:
        # Minimal version
        pass

    return builder.to_svg()
```

## Slash Commands

Use these commands in Claude Code:

### `/icon-generate [name] [style] [color]`
Generate a single icon with specified parameters.

**Example:**
```
/icon-generate arrow-right line_art #3B82F6
```

### `/icon-set [category] [style] [palette]`
Generate a complete icon set from a category.

**Example:**
```
/icon-set navigation filled VIBRANT
```

### `/icon-export [file] [formats] [sizes]`
Export icon to multiple formats and sizes.

**Example:**
```
/icon-export my-icon.svg png,svg 16,24,32,48
```

## API Reference

### Core Modules

- **`svg_builder`**: SVG document builder with fluent API
- **`geometry`**: Vector shape primitives and path generation
- **`icon_styles`**: Style presets and platform configurations
- **`color_palettes`**: Color schemes and manipulation utilities
- **`icon_composer`**: Composition helpers and layout utilities
- **`validators`**: Quality checks and accessibility validation
- **`export`**: Multi-format export functionality

### Templates

- **`templates/navigation.py`**: Navigation icons (arrows, chevrons, menu)
- **`templates/actions.py`**: Action icons (edit, delete, save, add)
- **`templates/social.py`**: Social media icons (share, like, comment)
- **`templates/files.py`**: File type icons (document, folder, image)
- **`templates/status.py`**: Status icons (check, warning, error, info)

## License

Apache 2.0 - See LICENSE.txt for details

## Version History

- **1.0.0** (2025-01-28): Initial release
  - Core SVG builder
  - 10 icon styles
  - 5 platform presets
  - 9 color palettes
  - Multi-format export
  - Comprehensive validation

## Contributing

To add new icons or features:

1. **New Geometry Primitive**: Add function to `core/geometry.py`
2. **New Style**: Add StylePreset to `core/icon_styles.py`
3. **New Palette**: Add palette dict to `core/color_palettes.py`
4. **New Template**: Create file in `templates/` directory

## Support

For issues, questions, or contributions, please refer to the SchaabCore project documentation.
