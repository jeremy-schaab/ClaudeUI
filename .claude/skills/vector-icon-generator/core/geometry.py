"""
Geometry Module
===============

Vector shape primitives and path generation utilities.
Provides functions for creating complex paths, curves, and shapes.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

import math
from typing import List, Tuple, Optional


def rounded_rect_path(
    x: float,
    y: float,
    width: float,
    height: float,
    radius: float
) -> str:
    """
    Generate SVG path data for a rounded rectangle.

    Args:
        x: X coordinate of top-left corner
        y: Y coordinate of top-left corner
        width: Rectangle width
        height: Rectangle height
        radius: Corner radius

    Returns:
        SVG path data string
    """
    # Clamp radius to half the smallest dimension
    r = min(radius, width / 2, height / 2)

    return (
        f"M{x + r},{y} "
        f"L{x + width - r},{y} "
        f"Q{x + width},{y} {x + width},{y + r} "
        f"L{x + width},{y + height - r} "
        f"Q{x + width},{y + height} {x + width - r},{y + height} "
        f"L{x + r},{y + height} "
        f"Q{x},{y + height} {x},{y + height - r} "
        f"L{x},{y + r} "
        f"Q{x},{y} {x + r},{y} "
        f"Z"
    )


def star_path(
    cx: float,
    cy: float,
    outer_radius: float,
    inner_radius: float,
    points: int = 5
) -> str:
    """
    Generate SVG path data for a star shape.

    Args:
        cx: Center X coordinate
        cy: Center Y coordinate
        outer_radius: Radius to outer points
        inner_radius: Radius to inner points
        points: Number of star points

    Returns:
        SVG path data string
    """
    path_parts = []
    angle_step = math.pi / points

    for i in range(points * 2):
        angle = i * angle_step - math.pi / 2
        radius = outer_radius if i % 2 == 0 else inner_radius
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)

        if i == 0:
            path_parts.append(f"M{x:.2f},{y:.2f}")
        else:
            path_parts.append(f"L{x:.2f},{y:.2f}")

    path_parts.append("Z")
    return " ".join(path_parts)


def polygon_path(
    cx: float,
    cy: float,
    radius: float,
    sides: int,
    rotation: float = 0
) -> str:
    """
    Generate SVG path data for a regular polygon.

    Args:
        cx: Center X coordinate
        cy: Center Y coordinate
        radius: Distance from center to vertices
        sides: Number of sides
        rotation: Rotation angle in degrees

    Returns:
        SVG path data string
    """
    path_parts = []
    angle_step = (2 * math.pi) / sides
    start_angle = math.radians(rotation) - math.pi / 2

    for i in range(sides):
        angle = start_angle + i * angle_step
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)

        if i == 0:
            path_parts.append(f"M{x:.2f},{y:.2f}")
        else:
            path_parts.append(f"L{x:.2f},{y:.2f}")

    path_parts.append("Z")
    return " ".join(path_parts)


def arrow_path(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    head_length: float = 10,
    head_width: float = 8
) -> str:
    """
    Generate SVG path data for an arrow with connected shaft and head.

    Args:
        x1: Start X coordinate
        y1: Start Y coordinate
        x2: End X coordinate (arrow tip)
        y2: End Y coordinate (arrow tip)
        head_length: Length of arrowhead
        head_width: Width of arrowhead

    Returns:
        SVG path data string (single continuous path)
    """
    # Calculate angle
    dx = x2 - x1
    dy = y2 - y1
    angle = math.atan2(dy, dx)

    # Calculate arrowhead base point (where shaft meets head)
    back_x = x2 - head_length * math.cos(angle)
    back_y = y2 - head_length * math.sin(angle)

    # Calculate arrowhead side points
    side1_x = back_x - head_width / 2 * math.sin(angle)
    side1_y = back_y + head_width / 2 * math.cos(angle)

    side2_x = back_x + head_width / 2 * math.sin(angle)
    side2_y = back_y - head_width / 2 * math.cos(angle)

    # Create a single continuous path without lifting the pen:
    # 1. Draw shaft from start to arrow base
    # 2. Draw one side of arrowhead
    # 3. Draw to the tip
    # 4. Draw back along other side of arrowhead
    # 5. Return to base
    # This creates one connected path for the entire arrow
    return (
        f"M{x1:.2f},{y1:.2f} "      # Start of shaft
        f"L{back_x:.2f},{back_y:.2f} "  # End of shaft (arrow base)
        f"L{side1_x:.2f},{side1_y:.2f} "  # One side of arrowhead
        f"L{x2:.2f},{y2:.2f} "      # Arrow tip
        f"L{side2_x:.2f},{side2_y:.2f} "  # Other side of arrowhead
        f"L{back_x:.2f},{back_y:.2f}"  # Back to arrow base
    )


def chevron_path(
    x: float,
    y: float,
    width: float,
    height: float,
    direction: str = 'right'
) -> str:
    """
    Generate SVG path data for a chevron (> shape).

    Args:
        x: X coordinate of bounding box
        y: Y coordinate of bounding box
        width: Chevron width
        height: Chevron height
        direction: 'left', 'right', 'up', 'down'

    Returns:
        SVG path data string
    """
    if direction == 'right':
        return f"M{x},{y} L{x + width},{y + height / 2} L{x},{y + height}"
    elif direction == 'left':
        return f"M{x + width},{y} L{x},{y + height / 2} L{x + width},{y + height}"
    elif direction == 'up':
        return f"M{x},{y + height} L{x + width / 2},{y} L{x + width},{y + height}"
    elif direction == 'down':
        return f"M{x},{y} L{x + width / 2},{y + height} L{x + width},{y}"
    else:
        raise ValueError(f"Invalid direction: {direction}")


def arc_path(
    cx: float,
    cy: float,
    radius: float,
    start_angle: float,
    end_angle: float,
    clockwise: bool = True
) -> str:
    """
    Generate SVG path data for an arc.

    Args:
        cx: Center X coordinate
        cy: Center Y coordinate
        radius: Arc radius
        start_angle: Start angle in degrees
        end_angle: End angle in degrees
        clockwise: Draw arc clockwise if True

    Returns:
        SVG path data string
    """
    start_rad = math.radians(start_angle)
    end_rad = math.radians(end_angle)

    start_x = cx + radius * math.cos(start_rad)
    start_y = cy + radius * math.sin(start_rad)
    end_x = cx + radius * math.cos(end_rad)
    end_y = cy + radius * math.sin(end_rad)

    # Determine if we need large arc flag
    angle_diff = (end_angle - start_angle) % 360
    large_arc = 1 if angle_diff > 180 else 0
    sweep = 1 if clockwise else 0

    return (
        f"M{start_x:.2f},{start_y:.2f} "
        f"A{radius},{radius} 0 {large_arc},{sweep} {end_x:.2f},{end_y:.2f}"
    )


def heart_path(
    cx: float,
    cy: float,
    size: float
) -> str:
    """
    Generate SVG path data for a heart shape.

    Args:
        cx: Center X coordinate
        cy: Center Y coordinate
        size: Heart size

    Returns:
        SVG path data string
    """
    # Scale factor
    s = size / 20

    # Heart path (normalized to 20x20, then scaled)
    return (
        f"M{cx},{cy - 2 * s} "
        f"C{cx},{cy - 5 * s} {cx - 5 * s},{cy - 8 * s} {cx - 8 * s},{cy - 5 * s} "
        f"C{cx - 11 * s},{cy - 2 * s} {cx - 11 * s},{cy + 2 * s} {cx - 8 * s},{cy + 5 * s} "
        f"L{cx},{cy + 10 * s} "
        f"L{cx + 8 * s},{cy + 5 * s} "
        f"C{cx + 11 * s},{cy + 2 * s} {cx + 11 * s},{cy - 2 * s} {cx + 8 * s},{cy - 5 * s} "
        f"C{cx + 5 * s},{cy - 8 * s} {cx},{cy - 5 * s} {cx},{cy - 2 * s} "
        f"Z"
    )


def cross_path(
    cx: float,
    cy: float,
    size: float,
    thickness: float = 2
) -> str:
    """
    Generate SVG path data for a cross/plus shape.

    Args:
        cx: Center X coordinate
        cy: Center Y coordinate
        size: Cross size (length of each arm)
        thickness: Line thickness

    Returns:
        SVG path data string
    """
    half_size = size / 2
    half_thick = thickness / 2

    return (
        # Horizontal bar
        f"M{cx - half_size},{cy - half_thick} "
        f"L{cx + half_size},{cy - half_thick} "
        f"L{cx + half_size},{cy + half_thick} "
        f"L{cx - half_size},{cy + half_thick} "
        f"Z "
        # Vertical bar
        f"M{cx - half_thick},{cy - half_size} "
        f"L{cx + half_thick},{cy - half_size} "
        f"L{cx + half_thick},{cy + half_size} "
        f"L{cx - half_thick},{cy + half_size} "
        f"Z"
    )


def x_path(
    cx: float,
    cy: float,
    size: float,
    thickness: float = 2
) -> str:
    """
    Generate SVG path data for an X shape.

    Args:
        cx: Center X coordinate
        cy: Center Y coordinate
        size: X size
        thickness: Line thickness

    Returns:
        SVG path data string
    """
    half_size = size / 2
    angle = math.radians(45)
    cos45 = math.cos(angle)
    sin45 = math.sin(angle)

    # Calculate rotated rectangle for diagonal lines
    dx = half_size * cos45
    dy = half_size * sin45
    dt = thickness / 2

    # First diagonal (top-left to bottom-right)
    path1 = (
        f"M{cx - dx - dt * sin45},{cy - dy + dt * cos45} "
        f"L{cx - dx + dt * sin45},{cy - dy - dt * cos45} "
        f"L{cx + dx + dt * sin45},{cy + dy - dt * cos45} "
        f"L{cx + dx - dt * sin45},{cy + dy + dt * cos45} "
        f"Z "
    )

    # Second diagonal (top-right to bottom-left)
    path2 = (
        f"M{cx + dx - dt * sin45},{cy - dy - dt * cos45} "
        f"L{cx + dx + dt * sin45},{cy - dy + dt * cos45} "
        f"L{cx - dx + dt * sin45},{cy + dy + dt * cos45} "
        f"L{cx - dx - dt * sin45},{cy + dy - dt * cos45} "
        f"Z"
    )

    return path1 + path2


def bezier_curve(
    start: Tuple[float, float],
    control1: Tuple[float, float],
    control2: Tuple[float, float],
    end: Tuple[float, float]
) -> str:
    """
    Generate SVG path data for a cubic Bezier curve.

    Args:
        start: Starting point (x, y)
        control1: First control point (x, y)
        control2: Second control point (x, y)
        end: End point (x, y)

    Returns:
        SVG path data string
    """
    return (
        f"M{start[0]},{start[1]} "
        f"C{control1[0]},{control1[1]} "
        f"{control2[0]},{control2[1]} "
        f"{end[0]},{end[1]}"
    )


def smooth_polyline(
    points: List[Tuple[float, float]],
    tension: float = 0.5
) -> str:
    """
    Generate SVG path data for a smooth curve through points.

    Args:
        points: List of (x, y) coordinate tuples
        tension: Curve tension (0 = straight lines, 1 = very smooth)

    Returns:
        SVG path data string
    """
    if len(points) < 2:
        return ""

    if len(points) == 2:
        return f"M{points[0][0]},{points[0][1]} L{points[1][0]},{points[1][1]}"

    path_parts = [f"M{points[0][0]},{points[0][1]}"]

    for i in range(len(points) - 1):
        p0 = points[max(0, i - 1)]
        p1 = points[i]
        p2 = points[i + 1]
        p3 = points[min(len(points) - 1, i + 2)]

        # Calculate control points
        cp1_x = p1[0] + (p2[0] - p0[0]) * tension / 6
        cp1_y = p1[1] + (p2[1] - p0[1]) * tension / 6
        cp2_x = p2[0] - (p3[0] - p1[0]) * tension / 6
        cp2_y = p2[1] - (p3[1] - p1[1]) * tension / 6

        path_parts.append(
            f"C{cp1_x:.2f},{cp1_y:.2f} {cp2_x:.2f},{cp2_y:.2f} {p2[0]:.2f},{p2[1]:.2f}"
        )

    return " ".join(path_parts)


def ring_path(
    cx: float,
    cy: float,
    outer_radius: float,
    inner_radius: float
) -> str:
    """
    Generate SVG path data for a ring (donut) shape.

    Args:
        cx: Center X coordinate
        cy: Center Y coordinate
        outer_radius: Outer radius
        inner_radius: Inner radius

    Returns:
        SVG path data string
    """
    return (
        f"M{cx - outer_radius},{cy} "
        f"A{outer_radius},{outer_radius} 0 1,0 {cx + outer_radius},{cy} "
        f"A{outer_radius},{outer_radius} 0 1,0 {cx - outer_radius},{cy} "
        f"Z "
        f"M{cx - inner_radius},{cy} "
        f"A{inner_radius},{inner_radius} 0 1,1 {cx + inner_radius},{cy} "
        f"A{inner_radius},{inner_radius} 0 1,1 {cx - inner_radius},{cy} "
        f"Z"
    )


def grid_position(
    position: str,
    canvas_size: int = 48,
    margin: int = 4
) -> Tuple[float, float]:
    """
    Get coordinates for named grid positions.

    Args:
        position: Position name (e.g., 'center', 'top-left', 'bottom-right')
        canvas_size: Canvas size in pixels
        margin: Margin from edges

    Returns:
        (x, y) coordinates
    """
    positions = {
        'center': (canvas_size / 2, canvas_size / 2),
        'top-left': (margin, margin),
        'top-center': (canvas_size / 2, margin),
        'top-right': (canvas_size - margin, margin),
        'middle-left': (margin, canvas_size / 2),
        'middle-right': (canvas_size - margin, canvas_size / 2),
        'bottom-left': (margin, canvas_size - margin),
        'bottom-center': (canvas_size / 2, canvas_size - margin),
        'bottom-right': (canvas_size - margin, canvas_size - margin)
    }

    if position not in positions:
        raise ValueError(f"Invalid position: {position}")

    return positions[position]


if __name__ == '__main__':
    # Example usage
    print("Geometry Module Examples\n" + "=" * 50)

    print("\n1. Rounded Rectangle Path:")
    print(rounded_rect_path(10, 10, 28, 20, 5))

    print("\n2. Star Path:")
    print(star_path(24, 24, 20, 10, 5))

    print("\n3. Heart Path:")
    print(heart_path(24, 24, 2))

    print("\n4. Chevron (Right):")
    print(chevron_path(10, 10, 15, 28, 'right'))
