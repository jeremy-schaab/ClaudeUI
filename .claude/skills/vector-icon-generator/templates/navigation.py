"""
Navigation Icons Template
=========================

Template for creating navigation-related icons.
Includes arrows, chevrons, menu, close, and navigation controls.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

import sys
from pathlib import Path

# Add parent directory to path to import core modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.svg_builder import SVGBuilder, IconConfig
from core.geometry import chevron_path, arrow_path
from core.icon_styles import get_style_preset, apply_style_to_config


def create_arrow_left(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create left arrow icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color)
    builder = SVGBuilder(size, size, config)

    # Arrow pointing left
    path = arrow_path(size * 0.75, size / 2, size * 0.25, size / 2, head_length=10, head_width=12)
    builder.add_path(path)

    return builder.to_svg()


def create_arrow_right(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create right arrow icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color)
    builder = SVGBuilder(size, size, config)

    # Arrow pointing right
    path = arrow_path(size * 0.25, size / 2, size * 0.75, size / 2, head_length=10, head_width=12)
    builder.add_path(path)

    return builder.to_svg()


def create_arrow_up(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create up arrow icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color)
    builder = SVGBuilder(size, size, config)

    # Arrow pointing up
    path = arrow_path(size / 2, size * 0.75, size / 2, size * 0.25, head_length=10, head_width=12)
    builder.add_path(path)

    return builder.to_svg()


def create_arrow_down(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create down arrow icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color)
    builder = SVGBuilder(size, size, config)

    # Arrow pointing down
    path = arrow_path(size / 2, size * 0.25, size / 2, size * 0.75, head_length=10, head_width=12)
    builder.add_path(path)

    return builder.to_svg()


def create_chevron_left(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create left chevron icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color, fill_color='none')
    builder = SVGBuilder(size, size, config)

    # Chevron pointing left
    margin = size * 0.25
    width = size * 0.25
    height = size * 0.5
    path = chevron_path(margin, margin, width, height, 'left')
    builder.add_path(path)

    return builder.to_svg()


def create_chevron_right(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create right chevron icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color, fill_color='none')
    builder = SVGBuilder(size, size, config)

    # Chevron pointing right
    margin = size * 0.25
    width = size * 0.25
    height = size * 0.5
    path = chevron_path(margin + width, margin, width, height, 'right')
    builder.add_path(path)

    return builder.to_svg()


def create_menu(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create hamburger menu icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color)
    builder = SVGBuilder(size, size, config)

    # Three horizontal lines
    margin = size * 0.17
    line_spacing = size * 0.25
    line_length = size * 0.66

    for i in range(3):
        y = margin + (i * line_spacing)
        builder.add_line(margin, y, margin + line_length, y)

    return builder.to_svg()


def create_close(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create close (X) icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color)
    builder = SVGBuilder(size, size, config)

    # X shape
    margin = size * 0.25
    end = size * 0.75

    builder.add_line(margin, margin, end, end)
    builder.add_line(end, margin, margin, end)

    return builder.to_svg()


def create_home(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create home icon"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color, fill_color='none')
    builder = SVGBuilder(size, size, config)

    # House shape
    center = size / 2
    roof_height = size * 0.3
    house_top = size * 0.35
    house_bottom = size * 0.85
    house_width = size * 0.5

    # Roof (triangle)
    roof_path = f"M{center},{roof_height} L{center - house_width/2},{house_top} L{center + house_width/2},{house_top} Z"
    builder.add_path(roof_path)

    # House body
    builder.add_rect(
        center - house_width/2,
        house_top,
        house_width,
        house_bottom - house_top
    )

    # Door
    door_width = house_width * 0.3
    door_height = (house_bottom - house_top) * 0.5
    builder.add_rect(
        center - door_width/2,
        house_bottom - door_height,
        door_width,
        door_height
    )

    return builder.to_svg()


def create_back(
    size: int = 48,
    style: str = 'line_art',
    color: str = '#000000',
    stroke_width: float = 2.0
) -> str:
    """Create back arrow icon (arrow with tail)"""
    config = IconConfig(width=size, height=size, stroke_width=stroke_width, stroke_color=color)
    builder = SVGBuilder(size, size, config)

    center_y = size / 2
    # Horizontal line
    builder.add_line(size * 0.25, center_y, size * 0.8, center_y)

    # Arrow head pointing left
    arrow_size = size * 0.15
    builder.add_line(size * 0.25, center_y, size * 0.25 + arrow_size, center_y - arrow_size)
    builder.add_line(size * 0.25, center_y, size * 0.25 + arrow_size, center_y + arrow_size)

    return builder.to_svg()


if __name__ == '__main__':
    print("Navigation Icons Template\n" + "=" * 50)

    # Test all navigation icons
    icons = [
        ('arrow-left', create_arrow_left),
        ('arrow-right', create_arrow_right),
        ('arrow-up', create_arrow_up),
        ('arrow-down', create_arrow_down),
        ('chevron-left', create_chevron_left),
        ('chevron-right', create_chevron_right),
        ('menu', create_menu),
        ('close', create_close),
        ('home', create_home),
        ('back', create_back)
    ]

    print("\nGenerating navigation icons...\n")

    for name, func in icons:
        svg = func(size=48, color='#3B82F6', stroke_width=2)
        filename = f'{name}.svg'

        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(svg)

        print(f"  ✓ {name:20} -> {filename}")

    print(f"\nGenerated {len(icons)} navigation icons successfully!")
