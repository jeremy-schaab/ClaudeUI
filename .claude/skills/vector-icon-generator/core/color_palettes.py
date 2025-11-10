"""
Color Palettes Module
=====================

Reusable color schemes and color manipulation utilities.
Provides semantic color palettes optimized for icon design.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

from typing import Dict, Tuple, Optional
import colorsys


# ============================================================================
# COLOR PALETTES
# ============================================================================

MINIMAL = {
    'name': 'Minimal',
    'description': 'Monochrome palette for clean, minimal icons',
    'primary': '#000000',
    'secondary': '#666666',
    'accent': '#999999',
    'background': '#FFFFFF',
    'success': '#2E7D32',
    'warning': '#ED6C02',
    'error': '#D32F2F',
    'info': '#0288D1',
    'text': '#000000'
}

VIBRANT = {
    'name': 'Vibrant',
    'description': 'Bright, saturated colors for eye-catching icons',
    'primary': '#3B82F6',      # Blue
    'secondary': '#8B5CF6',    # Purple
    'accent': '#F59E0B',       # Amber
    'background': '#FFFFFF',
    'success': '#10B981',      # Green
    'warning': '#F59E0B',      # Amber
    'error': '#EF4444',        # Red
    'info': '#06B6D4',         # Cyan
    'text': '#1F2937'          # Gray-800
}

PASTEL = {
    'name': 'Pastel',
    'description': 'Soft, muted colors for gentle, friendly icons',
    'primary': '#93C5FD',      # Light Blue
    'secondary': '#C4B5FD',    # Light Purple
    'accent': '#FCD34D',       # Light Amber
    'background': '#FFFFFF',
    'success': '#86EFAC',      # Light Green
    'warning': '#FDE68A',      # Light Yellow
    'error': '#FCA5A5',        # Light Red
    'info': '#A5F3FC',         # Light Cyan
    'text': '#374151'          # Gray-700
}

DARK = {
    'name': 'Dark',
    'description': 'Dark theme colors for icons on dark backgrounds',
    'primary': '#60A5FA',      # Blue-400
    'secondary': '#A78BFA',    # Purple-400
    'accent': '#FBBF24',       # Amber-400
    'background': '#1F2937',   # Gray-800
    'success': '#34D399',      # Green-400
    'warning': '#FBBF24',      # Amber-400
    'error': '#F87171',        # Red-400
    'info': '#22D3EE',         # Cyan-400
    'text': '#F9FAFB'          # Gray-50
}

PROFESSIONAL = {
    'name': 'Professional',
    'description': 'Corporate, business-appropriate colors',
    'primary': '#2563EB',      # Blue-600
    'secondary': '#475569',    # Slate-600
    'accent': '#7C3AED',       # Violet-600
    'background': '#FFFFFF',
    'success': '#059669',      # Emerald-600
    'warning': '#D97706',      # Amber-600
    'error': '#DC2626',        # Red-600
    'info': '#0284C7',         # Sky-600
    'text': '#0F172A'          # Slate-900
}

OCEAN = {
    'name': 'Ocean',
    'description': 'Blues and teals for calm, trustworthy icons',
    'primary': '#0EA5E9',      # Sky-500
    'secondary': '#06B6D4',    # Cyan-500
    'accent': '#14B8A6',       # Teal-500
    'background': '#F0F9FF',   # Sky-50
    'success': '#10B981',      # Emerald-500
    'warning': '#F59E0B',      # Amber-500
    'error': '#EF4444',        # Red-500
    'info': '#0284C7',         # Sky-600
    'text': '#0C4A6E'          # Sky-900
}

SUNSET = {
    'name': 'Sunset',
    'description': 'Warm tones for energetic, positive icons',
    'primary': '#F97316',      # Orange-500
    'secondary': '#EF4444',    # Red-500
    'accent': '#F59E0B',       # Amber-500
    'background': '#FFF7ED',   # Orange-50
    'success': '#84CC16',      # Lime-500
    'warning': '#EAB308',      # Yellow-500
    'error': '#DC2626',        # Red-600
    'info': '#F97316',         # Orange-500
    'text': '#7C2D12'          # Orange-900
}

FOREST = {
    'name': 'Forest',
    'description': 'Greens and earth tones for natural, organic icons',
    'primary': '#22C55E',      # Green-500
    'secondary': '#84CC16',    # Lime-500
    'accent': '#10B981',       # Emerald-500
    'background': '#F0FDF4',   # Green-50
    'success': '#16A34A',      # Green-600
    'warning': '#CA8A04',      # Yellow-600
    'error': '#DC2626',        # Red-600
    'info': '#14B8A6',         # Teal-500
    'text': '#14532D'          # Green-900
}

ACCESSIBLE = {
    'name': 'Accessible',
    'description': 'WCAG AA compliant colors for maximum accessibility',
    'primary': '#1E40AF',      # Blue-800
    'secondary': '#475569',    # Slate-600
    'accent': '#7C3AED',       # Violet-600
    'background': '#FFFFFF',
    'success': '#15803D',      # Green-700
    'warning': '#B45309',      # Amber-700
    'error': '#B91C1C',        # Red-700
    'info': '#075985',         # Sky-800
    'text': '#000000'
}


# Palette dictionary
PALETTES: Dict[str, Dict[str, str]] = {
    'minimal': MINIMAL,
    'vibrant': VIBRANT,
    'pastel': PASTEL,
    'dark': DARK,
    'professional': PROFESSIONAL,
    'ocean': OCEAN,
    'sunset': SUNSET,
    'forest': FOREST,
    'accessible': ACCESSIBLE
}


# ============================================================================
# SEMANTIC COLOR MAPPINGS
# ============================================================================

STATUS_COLORS = {
    'success': '#10B981',
    'warning': '#F59E0B',
    'error': '#EF4444',
    'info': '#06B6D4',
    'pending': '#94A3B8',
    'disabled': '#D1D5DB'
}

ACTION_COLORS = {
    'primary': '#3B82F6',
    'secondary': '#8B5CF6',
    'danger': '#EF4444',
    'safe': '#10B981',
    'neutral': '#6B7280'
}

BRAND_COLORS = {
    'facebook': '#1877F2',
    'twitter': '#1DA1F2',
    'instagram': '#E4405F',
    'linkedin': '#0A66C2',
    'github': '#181717',
    'youtube': '#FF0000',
    'whatsapp': '#25D366',
    'slack': '#4A154B',
    'discord': '#5865F2',
    'reddit': '#FF4500'
}


# ============================================================================
# COLOR UTILITY FUNCTIONS
# ============================================================================

def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """
    Convert hex color to RGB tuple.

    Args:
        hex_color: Hex color string (e.g., '#FF5733')

    Returns:
        RGB tuple (r, g, b) with values 0-255
    """
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """
    Convert RGB values to hex color string.

    Args:
        r: Red component (0-255)
        g: Green component (0-255)
        b: Blue component (0-255)

    Returns:
        Hex color string (e.g., '#FF5733')
    """
    return f'#{r:02X}{g:02X}{b:02X}'


def lighten(hex_color: str, amount: float = 0.2) -> str:
    """
    Lighten a color by a given amount.

    Args:
        hex_color: Hex color string
        amount: Amount to lighten (0.0 to 1.0)

    Returns:
        Lightened hex color string
    """
    r, g, b = hex_to_rgb(hex_color)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    l = min(1.0, l + amount)
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return rgb_to_hex(int(r * 255), int(g * 255), int(b * 255))


def darken(hex_color: str, amount: float = 0.2) -> str:
    """
    Darken a color by a given amount.

    Args:
        hex_color: Hex color string
        amount: Amount to darken (0.0 to 1.0)

    Returns:
        Darkened hex color string
    """
    r, g, b = hex_to_rgb(hex_color)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    l = max(0.0, l - amount)
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return rgb_to_hex(int(r * 255), int(g * 255), int(b * 255))


def adjust_saturation(hex_color: str, amount: float) -> str:
    """
    Adjust color saturation.

    Args:
        hex_color: Hex color string
        amount: Amount to adjust (-1.0 to 1.0)

    Returns:
        Adjusted hex color string
    """
    r, g, b = hex_to_rgb(hex_color)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    s = max(0.0, min(1.0, s + amount))
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return rgb_to_hex(int(r * 255), int(g * 255), int(b * 255))


def blend_colors(color1: str, color2: str, ratio: float = 0.5) -> str:
    """
    Blend two colors together.

    Args:
        color1: First hex color
        color2: Second hex color
        ratio: Blend ratio (0.0 = all color1, 1.0 = all color2)

    Returns:
        Blended hex color string
    """
    r1, g1, b1 = hex_to_rgb(color1)
    r2, g2, b2 = hex_to_rgb(color2)

    r = int(r1 * (1 - ratio) + r2 * ratio)
    g = int(g1 * (1 - ratio) + g2 * ratio)
    b = int(b1 * (1 - ratio) + b2 * ratio)

    return rgb_to_hex(r, g, b)


def get_contrast_color(hex_color: str) -> str:
    """
    Get contrasting color (black or white) for text on colored background.

    Args:
        hex_color: Background hex color

    Returns:
        '#000000' or '#FFFFFF' based on luminance
    """
    r, g, b = hex_to_rgb(hex_color)
    # Calculate relative luminance
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return '#000000' if luminance > 0.5 else '#FFFFFF'


def calculate_contrast_ratio(color1: str, color2: str) -> float:
    """
    Calculate WCAG contrast ratio between two colors.

    Args:
        color1: First hex color
        color2: Second hex color

    Returns:
        Contrast ratio (1.0 to 21.0)
    """
    def get_luminance(hex_color: str) -> float:
        r, g, b = hex_to_rgb(hex_color)
        # Convert to relative luminance
        r, g, b = r / 255, g / 255, b / 255
        r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
        g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
        b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4
        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    l1 = get_luminance(color1)
    l2 = get_luminance(color2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def is_wcag_compliant(
    foreground: str,
    background: str,
    level: str = 'AA',
    size: str = 'normal'
) -> bool:
    """
    Check if color combination meets WCAG contrast requirements.

    Args:
        foreground: Foreground hex color
        background: Background hex color
        level: 'AA' or 'AAA'
        size: 'normal' or 'large'

    Returns:
        True if compliant, False otherwise
    """
    ratio = calculate_contrast_ratio(foreground, background)

    requirements = {
        ('AA', 'normal'): 4.5,
        ('AA', 'large'): 3.0,
        ('AAA', 'normal'): 7.0,
        ('AAA', 'large'): 4.5
    }

    required_ratio = requirements.get((level, size), 4.5)
    return ratio >= required_ratio


def get_palette(name: str) -> Optional[Dict[str, str]]:
    """
    Get color palette by name.

    Args:
        name: Palette name

    Returns:
        Palette dictionary or None if not found
    """
    return PALETTES.get(name.lower())


def list_palettes() -> Dict[str, str]:
    """
    Get list of available palettes.

    Returns:
        Dictionary mapping palette names to descriptions
    """
    return {
        name: palette['description']
        for name, palette in PALETTES.items()
    }


if __name__ == '__main__':
    # Example usage
    print("Color Palettes Module\n" + "=" * 50)

    print("\nAvailable Palettes:")
    for name, desc in list_palettes().items():
        print(f"  {name:15} - {desc}")

    print("\n\nColor Manipulation Examples:")
    original = '#3B82F6'
    print(f"  Original:   {original}")
    print(f"  Lightened:  {lighten(original, 0.2)}")
    print(f"  Darkened:   {darken(original, 0.2)}")
    print(f"  Desaturated: {adjust_saturation(original, -0.3)}")

    print("\n\nContrast Checking:")
    fg = '#000000'
    bg = '#FFFFFF'
    ratio = calculate_contrast_ratio(fg, bg)
    print(f"  Black on White: {ratio:.2f}:1")
    print(f"  WCAG AA (normal): {is_wcag_compliant(fg, bg, 'AA', 'normal')}")
    print(f"  WCAG AAA (normal): {is_wcag_compliant(fg, bg, 'AAA', 'normal')}")
