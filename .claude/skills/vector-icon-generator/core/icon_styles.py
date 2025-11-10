"""
Icon Styles Module
==================

Style presets and configuration for different icon styles.
Supports line art, filled, and duotone icon styles.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class StylePreset:
    """Icon style preset configuration"""
    name: str
    description: str
    stroke_width: float
    stroke_color: str
    fill_color: str
    stroke_linecap: str = 'round'
    stroke_linejoin: str = 'round'
    opacity: float = 1.0
    secondary_color: Optional[str] = None  # For duotone
    secondary_opacity: float = 0.5  # For duotone


# ============================================================================
# STYLE PRESETS
# ============================================================================

LINE_ART_THIN = StylePreset(
    name='line_art_thin',
    description='Thin outlined icons with 1.5px stroke - delicate, minimal',
    stroke_width=1.5,
    stroke_color='#000000',
    fill_color='none'
)

LINE_ART_REGULAR = StylePreset(
    name='line_art_regular',
    description='Regular outlined icons with 2px stroke - balanced, standard',
    stroke_width=2.0,
    stroke_color='#000000',
    fill_color='none'
)

LINE_ART_BOLD = StylePreset(
    name='line_art_bold',
    description='Bold outlined icons with 2.5px stroke - strong, prominent',
    stroke_width=2.5,
    stroke_color='#000000',
    fill_color='none'
)

FILLED_SOLID = StylePreset(
    name='filled_solid',
    description='Solid filled icons without borders - clean, modern',
    stroke_width=0,
    stroke_color='none',
    fill_color='#000000'
)

FILLED_WITH_STROKE = StylePreset(
    name='filled_with_stroke',
    description='Filled icons with thin border - defined edges',
    stroke_width=1,
    stroke_color='#000000',
    fill_color='#000000'
)

DUOTONE_PRIMARY = StylePreset(
    name='duotone_primary',
    description='Two-color icons with primary and accent colors',
    stroke_width=0,
    stroke_color='none',
    fill_color='#000000',
    secondary_color='#666666',
    secondary_opacity=0.5
)

DUOTONE_OUTLINED = StylePreset(
    name='duotone_outlined',
    description='Two-color icons with outlined primary elements',
    stroke_width=2.0,
    stroke_color='#000000',
    fill_color='none',
    secondary_color='#666666',
    secondary_opacity=0.5
)

MINIMAL = StylePreset(
    name='minimal',
    description='Ultra-minimal icons with thin lines - subtle, elegant',
    stroke_width=1.0,
    stroke_color='#000000',
    fill_color='none',
    stroke_linecap='butt',
    stroke_linejoin='miter'
)

ROUNDED = StylePreset(
    name='rounded',
    description='Soft rounded icons with smooth corners - friendly, modern',
    stroke_width=2.0,
    stroke_color='#000000',
    fill_color='none',
    stroke_linecap='round',
    stroke_linejoin='round'
)

SHARP = StylePreset(
    name='sharp',
    description='Sharp angular icons with square corners - technical, precise',
    stroke_width=2.0,
    stroke_color='#000000',
    fill_color='none',
    stroke_linecap='square',
    stroke_linejoin='miter'
)


# ============================================================================
# STYLE PRESET DICTIONARY
# ============================================================================

STYLE_PRESETS: Dict[str, StylePreset] = {
    'line_art_thin': LINE_ART_THIN,
    'line_art': LINE_ART_REGULAR,
    'line_art_regular': LINE_ART_REGULAR,
    'line_art_bold': LINE_ART_BOLD,
    'filled': FILLED_SOLID,
    'filled_solid': FILLED_SOLID,
    'filled_stroke': FILLED_WITH_STROKE,
    'duotone': DUOTONE_PRIMARY,
    'duotone_primary': DUOTONE_PRIMARY,
    'duotone_outlined': DUOTONE_OUTLINED,
    'minimal': MINIMAL,
    'rounded': ROUNDED,
    'sharp': SHARP
}


# ============================================================================
# PLATFORM PRESETS (inspired by gif-animator's platform presets)
# ============================================================================

@dataclass
class PlatformPreset:
    """Platform-specific icon requirements"""
    name: str
    description: str
    size: int
    recommended_style: str
    min_stroke_width: float
    max_complexity: str  # 'simple', 'moderate', 'complex'
    color_mode: str  # 'monochrome', 'colored', 'any'


WEB_UI = PlatformPreset(
    name='web_ui',
    description='Web UI components (buttons, navigation)',
    size=24,
    recommended_style='line_art_regular',
    min_stroke_width=1.5,
    max_complexity='moderate',
    color_mode='any'
)

DOCUMENTATION = PlatformPreset(
    name='documentation',
    description='Technical documentation and diagrams',
    size=48,
    recommended_style='line_art_bold',
    min_stroke_width=2.0,
    max_complexity='complex',
    color_mode='any'
)

FAVICON = PlatformPreset(
    name='favicon',
    description='Browser favicons and tiny icons',
    size=16,
    recommended_style='filled_solid',
    min_stroke_width=2.0,
    max_complexity='simple',
    color_mode='monochrome'
)

APP_ICON = PlatformPreset(
    name='app_icon',
    description='Application icons (high detail)',
    size=512,
    recommended_style='filled_stroke',
    min_stroke_width=4.0,
    max_complexity='complex',
    color_mode='colored'
)

MOBILE_UI = PlatformPreset(
    name='mobile_ui',
    description='Mobile app UI icons',
    size=32,
    recommended_style='line_art_regular',
    min_stroke_width=2.0,
    max_complexity='moderate',
    color_mode='any'
)


PLATFORM_PRESETS: Dict[str, PlatformPreset] = {
    'web_ui': WEB_UI,
    'documentation': DOCUMENTATION,
    'docs': DOCUMENTATION,
    'favicon': FAVICON,
    'app_icon': APP_ICON,
    'app': APP_ICON,
    'mobile_ui': MOBILE_UI,
    'mobile': MOBILE_UI
}


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_style_preset(name: str) -> Optional[StylePreset]:
    """
    Get style preset by name.

    Args:
        name: Style preset name

    Returns:
        StylePreset or None if not found
    """
    return STYLE_PRESETS.get(name.lower())


def get_platform_preset(name: str) -> Optional[PlatformPreset]:
    """
    Get platform preset by name.

    Args:
        name: Platform preset name

    Returns:
        PlatformPreset or None if not found
    """
    return PLATFORM_PRESETS.get(name.lower())


def apply_style_to_config(config, style: StylePreset):
    """
    Apply style preset to IconConfig.

    Args:
        config: IconConfig instance
        style: StylePreset to apply
    """
    config.stroke_width = style.stroke_width
    config.stroke_color = style.stroke_color
    config.fill_color = style.fill_color
    config.stroke_linecap = style.stroke_linecap
    config.stroke_linejoin = style.stroke_linejoin


def get_color_for_style(
    style: StylePreset,
    primary_color: str,
    secondary_color: Optional[str] = None
) -> Dict[str, str]:
    """
    Get colors for a style preset with custom primary/secondary colors.

    Args:
        style: StylePreset
        primary_color: Primary color (hex)
        secondary_color: Optional secondary color for duotone

    Returns:
        Dictionary with 'stroke', 'fill', and 'secondary' keys
    """
    colors = {}

    if style.fill_color == 'none':
        # Line art style - color goes to stroke
        colors['stroke'] = primary_color
        colors['fill'] = 'none'
    else:
        # Filled style - color goes to fill
        colors['stroke'] = primary_color if style.stroke_width > 0 else 'none'
        colors['fill'] = primary_color

    # Secondary color for duotone
    if style.secondary_color and secondary_color:
        colors['secondary'] = secondary_color
    elif style.secondary_color:
        colors['secondary'] = style.secondary_color
    else:
        colors['secondary'] = None

    return colors


def list_available_styles() -> Dict[str, str]:
    """
    Get list of all available style presets.

    Returns:
        Dictionary mapping style names to descriptions
    """
    return {
        name: preset.description
        for name, preset in STYLE_PRESETS.items()
        if not name.endswith('_regular')  # Skip duplicates
    }


def list_available_platforms() -> Dict[str, str]:
    """
    Get list of all available platform presets.

    Returns:
        Dictionary mapping platform names to descriptions
    """
    return {
        name: f"{preset.description} ({preset.size}x{preset.size}px)"
        for name, preset in PLATFORM_PRESETS.items()
        if name in ['web_ui', 'documentation', 'favicon', 'app_icon', 'mobile_ui']
    }


def recommend_style_for_platform(platform: str) -> Optional[str]:
    """
    Recommend icon style for a given platform.

    Args:
        platform: Platform name

    Returns:
        Recommended style name or None
    """
    preset = get_platform_preset(platform)
    return preset.recommended_style if preset else None


if __name__ == '__main__':
    # Example usage
    print("Icon Styles Module\n" + "=" * 50)

    print("\nAvailable Styles:")
    for name, desc in list_available_styles().items():
        print(f"  {name:20} - {desc}")

    print("\n\nAvailable Platforms:")
    for name, desc in list_available_platforms().items():
        print(f"  {name:20} - {desc}")

    print("\n\nStyle Recommendations:")
    for platform in ['web_ui', 'documentation', 'favicon']:
        style = recommend_style_for_platform(platform)
        print(f"  {platform:20} -> {style}")

    print("\n\nStyle Configuration Example:")
    style = get_style_preset('line_art')
    if style:
        print(f"  Name: {style.name}")
        print(f"  Stroke Width: {style.stroke_width}")
        print(f"  Stroke Color: {style.stroke_color}")
        print(f"  Fill Color: {style.fill_color}")
