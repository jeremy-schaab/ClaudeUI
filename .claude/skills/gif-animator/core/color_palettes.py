"""
Color Palettes - Color management and palette definitions
"""
from typing import Tuple, List, Dict
import colorsys


# Color type alias
Color = Tuple[int, int, int]
ColorWithAlpha = Tuple[int, int, int, int]


# Predefined color palettes
PALETTES = {
    'VIBRANT': {
        'primary': (255, 59, 48),      # Red
        'secondary': (52, 199, 89),    # Green
        'accent': (0, 122, 255),       # Blue
        'warning': (255, 149, 0),      # Orange
        'success': (52, 199, 89),      # Green
        'error': (255, 59, 48),        # Red
        'info': (90, 200, 250),        # Light Blue
        'background': (255, 255, 255), # White
        'text': (0, 0, 0),             # Black
    },
    'PASTEL': {
        'primary': (255, 179, 186),    # Pink
        'secondary': (186, 225, 255),  # Light Blue
        'accent': (255, 223, 186),     # Peach
        'warning': (255, 218, 185),    # Light Orange
        'success': (186, 255, 201),    # Light Green
        'error': (255, 179, 186),      # Light Pink
        'info': (204, 229, 255),       # Pale Blue
        'background': (255, 255, 255), # White
        'text': (80, 80, 80),          # Dark Gray
    },
    'DARK': {
        'primary': (187, 134, 252),    # Purple
        'secondary': (100, 210, 255),  # Cyan
        'accent': (255, 121, 198),     # Pink
        'warning': (255, 184, 108),    # Orange
        'success': (80, 250, 123),     # Green
        'error': (255, 85, 85),        # Red
        'info': (139, 233, 253),       # Light Cyan
        'background': (40, 42, 54),    # Dark Gray
        'text': (248, 248, 242),       # Off White
    },
    'NEON': {
        'primary': (255, 16, 240),     # Hot Pink
        'secondary': (0, 255, 255),    # Cyan
        'accent': (57, 255, 20),       # Lime
        'warning': (255, 128, 0),      # Orange
        'success': (57, 255, 20),      # Lime
        'error': (255, 0, 110),        # Hot Pink
        'info': (0, 242, 254),         # Electric Blue
        'background': (20, 20, 40),    # Dark Blue
        'text': (255, 255, 255),       # White
    },
    'PROFESSIONAL': {
        'primary': (0, 102, 204),      # Corporate Blue
        'secondary': (102, 102, 102),  # Gray
        'accent': (0, 153, 153),       # Teal
        'warning': (204, 102, 0),      # Brown
        'success': (51, 153, 102),     # Green
        'error': (204, 0, 0),          # Red
        'info': (102, 153, 204),       # Light Blue
        'background': (255, 255, 255), # White
        'text': (51, 51, 51),          # Dark Gray
    },
    'OCEAN': {
        'primary': (0, 119, 182),      # Deep Blue
        'secondary': (3, 169, 244),    # Light Blue
        'accent': (0, 188, 212),       # Cyan
        'warning': (255, 160, 0),      # Amber
        'success': (0, 200, 83),       # Green
        'error': (244, 67, 54),        # Red
        'info': (100, 181, 246),       # Sky Blue
        'background': (240, 248, 255), # Alice Blue
        'text': (33, 33, 33),          # Dark
    },
    'SUNSET': {
        'primary': (255, 87, 34),      # Deep Orange
        'secondary': (255, 152, 0),    # Orange
        'accent': (255, 193, 7),       # Amber
        'warning': (255, 152, 0),      # Orange
        'success': (139, 195, 74),     # Light Green
        'error': (244, 67, 54),        # Red
        'info': (255, 171, 145),       # Peach
        'background': (255, 245, 238), # Light Orange
        'text': (62, 39, 35),          # Dark Brown
    },
    'FOREST': {
        'primary': (56, 142, 60),      # Green
        'secondary': (104, 159, 56),   # Light Green
        'accent': (0, 137, 123),       # Teal
        'warning': (251, 192, 45),     # Yellow
        'success': (76, 175, 80),      # Green
        'error': (211, 47, 47),        # Red
        'info': (38, 166, 154),        # Turquoise
        'background': (245, 248, 245), # Mint Cream
        'text': (27, 94, 32),          # Dark Green
    },
}


# Impact/emotion-based colors
IMPACT_COLORS = {
    'urgent': (255, 59, 48),       # Red
    'warning': (255, 149, 0),      # Orange
    'success': (52, 199, 89),      # Green
    'info': (0, 122, 255),         # Blue
    'celebrate': (255, 204, 0),    # Gold
    'error': (255, 59, 48),        # Red
    'neutral': (142, 142, 147),    # Gray
    'calm': (90, 200, 250),        # Light Blue
    'energetic': (255, 45, 85),    # Hot Pink
    'professional': (0, 102, 204), # Corporate Blue
}


def get_palette(name: str) -> Dict[str, Color]:
    """
    Get a color palette by name

    Args:
        name: Palette name (case-insensitive)

    Returns:
        Dictionary of color names to RGB tuples

    Raises:
        ValueError: If palette name not found
    """
    palette_name = name.upper()
    if palette_name not in PALETTES:
        available = ', '.join(PALETTES.keys())
        raise ValueError(f"Unknown palette: {name}. Available: {available}")
    return PALETTES[palette_name]


def lighten(color: Color, amount: float = 0.2) -> Color:
    """
    Lighten a color by a percentage

    Args:
        color: RGB color tuple
        amount: Amount to lighten (0.0 to 1.0)

    Returns:
        Lightened RGB color
    """
    r, g, b = color
    r = min(255, int(r + (255 - r) * amount))
    g = min(255, int(g + (255 - g) * amount))
    b = min(255, int(b + (255 - b) * amount))
    return (r, g, b)


def darken(color: Color, amount: float = 0.2) -> Color:
    """
    Darken a color by a percentage

    Args:
        color: RGB color tuple
        amount: Amount to darken (0.0 to 1.0)

    Returns:
        Darkened RGB color
    """
    r, g, b = color
    r = max(0, int(r * (1 - amount)))
    g = max(0, int(g * (1 - amount)))
    b = max(0, int(b * (1 - amount)))
    return (r, g, b)


def blend(color1: Color, color2: Color, ratio: float = 0.5) -> Color:
    """
    Blend two colors together

    Args:
        color1: First RGB color
        color2: Second RGB color
        ratio: Blend ratio (0.0 = color1, 1.0 = color2)

    Returns:
        Blended RGB color
    """
    r = int(color1[0] + (color2[0] - color1[0]) * ratio)
    g = int(color1[1] + (color2[1] - color1[1]) * ratio)
    b = int(color1[2] + (color2[2] - color1[2]) * ratio)
    return (r, g, b)


def add_alpha(color: Color, alpha: int = 255) -> ColorWithAlpha:
    """
    Add alpha channel to RGB color

    Args:
        color: RGB color tuple
        alpha: Alpha value (0-255)

    Returns:
        RGBA color tuple
    """
    return (*color, alpha)


def rgb_to_hex(color: Color) -> str:
    """
    Convert RGB to hex color string

    Args:
        color: RGB color tuple

    Returns:
        Hex color string (e.g., '#FF0000')
    """
    return '#{:02x}{:02x}{:02x}'.format(*color)


def hex_to_rgb(hex_color: str) -> Color:
    """
    Convert hex color string to RGB

    Args:
        hex_color: Hex color string (with or without #)

    Returns:
        RGB color tuple
    """
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hsv(color: Color) -> Tuple[float, float, float]:
    """
    Convert RGB to HSV

    Args:
        color: RGB color tuple (0-255)

    Returns:
        HSV tuple (h: 0-360, s: 0-1, v: 0-1)
    """
    r, g, b = [x / 255.0 for x in color]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return (h * 360, s, v)


def hsv_to_rgb(h: float, s: float, v: float) -> Color:
    """
    Convert HSV to RGB

    Args:
        h: Hue (0-360)
        s: Saturation (0-1)
        v: Value (0-1)

    Returns:
        RGB color tuple
    """
    h = h / 360.0
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return (int(r * 255), int(g * 255), int(b * 255))


def adjust_saturation(color: Color, amount: float) -> Color:
    """
    Adjust color saturation

    Args:
        color: RGB color tuple
        amount: Saturation adjustment (-1.0 to 1.0)

    Returns:
        Adjusted RGB color
    """
    h, s, v = rgb_to_hsv(color)
    s = max(0, min(1, s + amount))
    return hsv_to_rgb(h, s, v)


def adjust_hue(color: Color, degrees: float) -> Color:
    """
    Rotate color hue

    Args:
        color: RGB color tuple
        degrees: Degrees to rotate hue (-360 to 360)

    Returns:
        Adjusted RGB color
    """
    h, s, v = rgb_to_hsv(color)
    h = (h + degrees) % 360
    return hsv_to_rgb(h, s, v)


def get_complementary(color: Color) -> Color:
    """
    Get complementary color (opposite on color wheel)

    Args:
        color: RGB color tuple

    Returns:
        Complementary RGB color
    """
    return adjust_hue(color, 180)


def get_analogous(color: Color) -> List[Color]:
    """
    Get analogous colors (adjacent on color wheel)

    Args:
        color: RGB color tuple

    Returns:
        List of 3 analogous colors
    """
    return [
        adjust_hue(color, -30),
        color,
        adjust_hue(color, 30),
    ]


def get_triadic(color: Color) -> List[Color]:
    """
    Get triadic color scheme

    Args:
        color: RGB color tuple

    Returns:
        List of 3 triadic colors
    """
    return [
        color,
        adjust_hue(color, 120),
        adjust_hue(color, 240),
    ]


def get_gradient_colors(color1: Color, color2: Color, steps: int) -> List[Color]:
    """
    Generate gradient colors between two colors

    Args:
        color1: Start color
        color2: End color
        steps: Number of gradient steps

    Returns:
        List of RGB colors forming a gradient
    """
    if steps < 2:
        return [color1]

    colors = []
    for i in range(steps):
        ratio = i / (steps - 1)
        colors.append(blend(color1, color2, ratio))

    return colors


def get_tint(color: Color, level: int = 1) -> Color:
    """
    Get lighter tint of color (1-5, where 5 is lightest)

    Args:
        color: RGB color tuple
        level: Tint level (1-5)

    Returns:
        Tinted RGB color
    """
    amount = level * 0.15
    return lighten(color, amount)


def get_shade(color: Color, level: int = 1) -> Color:
    """
    Get darker shade of color (1-5, where 5 is darkest)

    Args:
        color: RGB color tuple
        level: Shade level (1-5)

    Returns:
        Shaded RGB color
    """
    amount = level * 0.15
    return darken(color, amount)


def is_dark(color: Color) -> bool:
    """
    Check if color is dark (for choosing text color)

    Args:
        color: RGB color tuple

    Returns:
        True if color is dark, False if light
    """
    # Calculate relative luminance
    r, g, b = [x / 255.0 for x in color]
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return luminance < 0.5


def get_text_color(background: Color) -> Color:
    """
    Get appropriate text color (black or white) for background

    Args:
        background: Background RGB color

    Returns:
        Black or white RGB color for text
    """
    return (0, 0, 0) if not is_dark(background) else (255, 255, 255)


def create_palette_from_base(base_color: Color) -> Dict[str, Color]:
    """
    Create a complete color palette from a base color

    Args:
        base_color: Base RGB color

    Returns:
        Dictionary of palette colors
    """
    return {
        'primary': base_color,
        'secondary': adjust_hue(base_color, 30),
        'accent': get_complementary(base_color),
        'warning': (255, 149, 0),
        'success': (52, 199, 89),
        'error': (255, 59, 48),
        'info': (0, 122, 255),
        'background': (255, 255, 255),
        'text': (0, 0, 0),
    }
