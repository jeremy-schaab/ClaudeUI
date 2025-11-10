"""
Icon Composer Module
====================

Composition utilities for icon creation.
Static helper methods for common icon patterns and layouts.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

from typing import Tuple, Optional
from .svg_builder import SVGBuilder


class IconComposer:
    """Static utility methods for icon composition"""

    @staticmethod
    def center_element(
        canvas_size: int,
        element_size: int
    ) -> float:
        """
        Calculate centered position for an element.

        Args:
            canvas_size: Canvas dimension
            element_size: Element dimension

        Returns:
            Centered position coordinate
        """
        return (canvas_size - element_size) / 2

    @staticmethod
    def add_centered_circle(
        builder: SVGBuilder,
        radius: float,
        **kwargs
    ) -> SVGBuilder:
        """
        Add a centered circle to the builder.

        Args:
            builder: SVGBuilder instance
            radius: Circle radius
            **kwargs: Additional circle attributes

        Returns:
            SVGBuilder for chaining
        """
        cx = builder.width / 2
        cy = builder.height / 2
        return builder.add_circle(cx, cy, radius, **kwargs)

    @staticmethod
    def add_shadow(
        builder: SVGBuilder,
        element_id: str,
        offset_x: float = 2,
        offset_y: float = 2,
        blur: float = 4,
        opacity: float = 0.3
    ) -> SVGBuilder:
        """
        Add a drop shadow filter definition.

        Args:
            builder: SVGBuilder instance
            element_id: ID for the shadow filter
            offset_x: Horizontal shadow offset
            offset_y: Vertical shadow offset
            blur: Shadow blur radius
            opacity: Shadow opacity

        Returns:
            SVGBuilder for chaining
        """
        # Note: Shadow filters require more complex filter implementation
        # This is a placeholder for future enhancement
        return builder

    @staticmethod
    def create_grid_layout(
        canvas_size: int,
        rows: int,
        cols: int,
        padding: int = 4
    ) -> list[Tuple[float, float]]:
        """
        Calculate grid positions for icon elements.

        Args:
            canvas_size: Canvas size in pixels
            rows: Number of rows
            cols: Number of columns
            padding: Padding from edges

        Returns:
            List of (x, y) coordinate tuples
        """
        available_space = canvas_size - 2 * padding
        cell_width = available_space / cols
        cell_height = available_space / rows

        positions = []
        for row in range(rows):
            for col in range(cols):
                x = padding + col * cell_width + cell_width / 2
                y = padding + row * cell_height + cell_height / 2
                positions.append((x, y))

        return positions

    @staticmethod
    def create_circular_layout(
        center_x: float,
        center_y: float,
        radius: float,
        count: int,
        start_angle: float = 0
    ) -> list[Tuple[float, float]]:
        """
        Calculate circular positions for icon elements.

        Args:
            center_x: Center X coordinate
            center_y: Center Y coordinate
            radius: Circle radius
            count: Number of positions
            start_angle: Starting angle in degrees

        Returns:
            List of (x, y) coordinate tuples
        """
        import math
        positions = []
        angle_step = 360 / count

        for i in range(count):
            angle = math.radians(start_angle + i * angle_step)
            x = center_x + radius * math.cos(angle)
            y = center_y + radius * math.sin(angle)
            positions.append((x, y))

        return positions

    @staticmethod
    def add_badge(
        builder: SVGBuilder,
        position: str = 'top-right',
        size: int = 10,
        color: str = '#EF4444',
        border_color: Optional[str] = None,
        border_width: float = 1.5
    ) -> SVGBuilder:
        """
        Add a small badge/notification dot to the icon.

        Args:
            builder: SVGBuilder instance
            position: Badge position ('top-right', 'top-left', 'bottom-right', 'bottom-left')
            size: Badge size (diameter)
            color: Badge fill color
            border_color: Optional border color
            border_width: Border width

        Returns:
            SVGBuilder for chaining
        """
        canvas = builder.width
        margin = 6
        radius = size / 2

        positions = {
            'top-right': (canvas - margin, margin),
            'top-left': (margin, margin),
            'bottom-right': (canvas - margin, canvas - margin),
            'bottom-left': (margin, canvas - margin)
        }

        x, y = positions.get(position, positions['top-right'])

        if border_color:
            builder.add_circle(x, y, radius, fill=color, stroke=border_color, stroke_width=border_width)
        else:
            builder.add_circle(x, y, radius, fill=color, stroke='none')

        return builder

    @staticmethod
    def add_container_rect(
        builder: SVGBuilder,
        padding: int = 8,
        corner_radius: int = 4,
        **kwargs
    ) -> SVGBuilder:
        """
        Add a container rectangle around icon content.

        Args:
            builder: SVGBuilder instance
            padding: Padding from edges
            corner_radius: Corner radius
            **kwargs: Additional rectangle attributes

        Returns:
            SVGBuilder for chaining
        """
        size = builder.width - 2 * padding
        return builder.add_rect(
            padding,
            padding,
            size,
            size,
            rx=corner_radius,
            ry=corner_radius,
            **kwargs
        )

    @staticmethod
    def calculate_stroke_for_size(
        size: int,
        style: str = 'regular'
    ) -> float:
        """
        Calculate appropriate stroke width for icon size.

        Args:
            size: Icon size in pixels
            style: 'thin', 'regular', or 'bold'

        Returns:
            Recommended stroke width
        """
        # Base stroke widths for 48px icons
        base_strokes = {
            'thin': 1.5,
            'regular': 2.0,
            'bold': 2.5
        }

        base_size = 48
        base_stroke = base_strokes.get(style, 2.0)

        # Scale stroke proportionally
        return (size / base_size) * base_stroke


if __name__ == '__main__':
    # Example usage
    print("Icon Composer Module\n" + "=" * 50)

    print("\nGrid Layout (3x3):")
    positions = IconComposer.create_grid_layout(48, 3, 3, 4)
    for i, (x, y) in enumerate(positions):
        print(f"  Position {i + 1}: ({x:.2f}, {y:.2f})")

    print("\nCircular Layout (6 points):")
    positions = IconComposer.create_circular_layout(24, 24, 15, 6)
    for i, (x, y) in enumerate(positions):
        print(f"  Position {i + 1}: ({x:.2f}, {y:.2f})")

    print("\nStroke Recommendations:")
    for size in [16, 24, 32, 48, 64]:
        stroke = IconComposer.calculate_stroke_for_size(size, 'regular')
        print(f"  {size}px icon: {stroke:.2f}px stroke")
