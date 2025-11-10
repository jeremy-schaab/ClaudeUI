#!/usr/bin/env python3
"""
Validators - Check if GIFs meet platform-specific requirements.

These validators help ensure your GIFs meet various platform size and dimension constraints.
Supports multiple platforms including Slack, Discord, Twitter, and custom presets.
"""

from pathlib import Path
from typing import Optional


# Platform-specific presets for common use cases
PLATFORM_PRESETS = {
    # Slack presets
    'slack_emoji': {
        'name': 'Slack Emoji',
        'max_size_kb': 64,
        'optimal_dimensions': (128, 128),
        'min_dimensions': (64, 64),
        'max_dimensions': (128, 128),
        'must_be_square': True,
        'max_colors': 48,
        'recommended_fps': 12,
        'recommended_frames': 12
    },
    'slack_message': {
        'name': 'Slack Message',
        'max_size_kb': 2048,
        'optimal_dimensions': (480, 480),
        'min_dimensions': (320, 320),
        'max_dimensions': (640, 640),
        'must_be_square': False,
        'max_colors': 256,
        'recommended_fps': 20,
        'recommended_frames': 60
    },

    # Discord presets
    'discord_emoji': {
        'name': 'Discord Emoji',
        'max_size_kb': 256,
        'optimal_dimensions': (128, 128),
        'min_dimensions': (32, 32),
        'max_dimensions': (128, 128),
        'must_be_square': True,
        'max_colors': 256,
        'recommended_fps': 15,
        'recommended_frames': 30
    },
    'discord_sticker': {
        'name': 'Discord Sticker',
        'max_size_kb': 512,
        'optimal_dimensions': (320, 320),
        'min_dimensions': (160, 160),
        'max_dimensions': (320, 320),
        'must_be_square': False,
        'max_colors': 256,
        'recommended_fps': 20,
        'recommended_frames': 60
    },

    # Social media presets
    'twitter': {
        'name': 'Twitter',
        'max_size_kb': 15360,  # 15MB
        'optimal_dimensions': (1280, 720),
        'min_dimensions': (600, 335),
        'max_dimensions': (1920, 1080),
        'must_be_square': False,
        'max_colors': 256,
        'recommended_fps': 30,
        'recommended_frames': 150
    },
    'instagram_story': {
        'name': 'Instagram Story',
        'max_size_kb': 8192,  # 8MB
        'optimal_dimensions': (1080, 1920),
        'min_dimensions': (600, 1067),
        'max_dimensions': (1080, 1920),
        'must_be_square': False,
        'max_colors': 256,
        'recommended_fps': 30,
        'recommended_frames': 150
    },
    'instagram_post': {
        'name': 'Instagram Post',
        'max_size_kb': 8192,  # 8MB
        'optimal_dimensions': (1080, 1080),
        'min_dimensions': (600, 600),
        'max_dimensions': (1080, 1350),
        'must_be_square': False,
        'max_colors': 256,
        'recommended_fps': 30,
        'recommended_frames': 150
    },

    # Website presets
    'loading_spinner': {
        'name': 'Loading Spinner',
        'max_size_kb': 100,
        'optimal_dimensions': (64, 64),
        'min_dimensions': (32, 32),
        'max_dimensions': (128, 128),
        'must_be_square': True,
        'max_colors': 64,
        'recommended_fps': 15,
        'recommended_frames': 20
    },
    'banner': {
        'name': 'Website Banner',
        'max_size_kb': 500,
        'optimal_dimensions': (728, 90),
        'min_dimensions': (468, 60),
        'max_dimensions': (970, 250),
        'must_be_square': False,
        'max_colors': 256,
        'recommended_fps': 20,
        'recommended_frames': 40
    },

    # General/flexible presets
    'general': {
        'name': 'General Purpose',
        'max_size_kb': None,  # No limit
        'optimal_dimensions': None,
        'min_dimensions': None,
        'max_dimensions': None,
        'must_be_square': False,
        'max_colors': 256,
        'recommended_fps': 24,
        'recommended_frames': None
    },
    'high_quality': {
        'name': 'High Quality',
        'max_size_kb': 10240,  # 10MB
        'optimal_dimensions': (1920, 1080),
        'min_dimensions': (1280, 720),
        'max_dimensions': (3840, 2160),
        'must_be_square': False,
        'max_colors': 256,
        'recommended_fps': 30,
        'recommended_frames': 180
    }
}


def get_preset(platform: str) -> dict:
    """
    Get platform preset configuration.

    Args:
        platform: Platform name (e.g., 'slack_emoji', 'discord_emoji', 'twitter')

    Returns:
        Platform preset dictionary

    Raises:
        ValueError: If platform preset not found
    """
    if platform not in PLATFORM_PRESETS:
        available = ', '.join(PLATFORM_PRESETS.keys())
        raise ValueError(f"Unknown platform '{platform}'. Available: {available}")
    return PLATFORM_PRESETS[platform]


def list_platforms() -> list[str]:
    """Get list of available platform presets."""
    return list(PLATFORM_PRESETS.keys())


def check_file_size(gif_path: str | Path, platform: str = 'general') -> tuple[bool, dict]:
    """
    Check if GIF meets platform size limits.

    Args:
        gif_path: Path to GIF file
        platform: Platform preset name (e.g., 'slack_emoji', 'discord_emoji')

    Returns:
        Tuple of (passes: bool, info: dict with details)
    """
    gif_path = Path(gif_path)
    preset = get_preset(platform)

    if not gif_path.exists():
        return False, {'error': f'File not found: {gif_path}'}

    size_bytes = gif_path.stat().st_size
    size_kb = size_bytes / 1024
    size_mb = size_kb / 1024

    limit_kb = preset['max_size_kb']
    passes = limit_kb is None or size_kb <= limit_kb

    info = {
        'size_bytes': size_bytes,
        'size_kb': size_kb,
        'size_mb': size_mb,
        'limit_kb': limit_kb,
        'limit_mb': limit_kb / 1024 if limit_kb else None,
        'passes': passes,
        'platform': preset['name']
    }

    # Print feedback
    if limit_kb is None:
        print(f"ℹ {size_kb:.1f} KB - no size limit for {preset['name']}")
    elif passes:
        print(f"✓ {size_kb:.1f} KB - within {limit_kb} KB limit for {preset['name']}")
    else:
        print(f"✗ {size_kb:.1f} KB - exceeds {limit_kb} KB limit for {preset['name']}")
        overage_kb = size_kb - limit_kb
        overage_percent = (overage_kb / limit_kb) * 100
        print(f"  Over by: {overage_kb:.1f} KB ({overage_percent:.1f}%)")
        print(f"  Try: fewer frames, fewer colors, or simpler design")

    return passes, info


def validate_dimensions(width: int, height: int, platform: str = 'general') -> tuple[bool, dict]:
    """
    Check if dimensions meet platform requirements.

    Args:
        width: Frame width in pixels
        height: Frame height in pixels
        platform: Platform preset name

    Returns:
        Tuple of (passes: bool, info: dict with details)
    """
    preset = get_preset(platform)

    info = {
        'width': width,
        'height': height,
        'is_square': width == height,
        'platform': preset['name']
    }

    optimal_dims = preset['optimal_dimensions']
    min_dims = preset['min_dimensions']
    max_dims = preset['max_dimensions']
    must_be_square = preset['must_be_square']

    # Check if dimensions match optimal
    if optimal_dims:
        optimal = (width, height) == optimal_dims
        info['optimal'] = optimal
    else:
        optimal = None

    # Check if square when required
    if must_be_square and width != height:
        print(f"✗ {width}x{height} - {preset['name']} requires square dimensions")
        if optimal_dims:
            print(f"  Recommended: {optimal_dims[0]}x{optimal_dims[1]}")
        return False, info

    # Check dimension limits
    passes = True
    if min_dims and (width < min_dims[0] or height < min_dims[1]):
        print(f"✗ {width}x{height} - below minimum {min_dims[0]}x{min_dims[1]} for {preset['name']}")
        passes = False
    elif max_dims and (width > max_dims[0] or height > max_dims[1]):
        print(f"✗ {width}x{height} - exceeds maximum {max_dims[0]}x{max_dims[1]} for {preset['name']}")
        passes = False
    elif optimal and optimal_dims:
        print(f"✓ {width}x{height} - optimal for {preset['name']}")
    elif optimal_dims:
        print(f"⚠ {width}x{height} - acceptable but {optimal_dims[0]}x{optimal_dims[1]} is optimal")
    else:
        print(f"✓ {width}x{height} - acceptable for {preset['name']}")

    info['passes'] = passes
    return passes, info


def validate_gif(gif_path: str | Path, platform: str = 'general') -> tuple[bool, dict]:
    """
    Run all validations on a GIF file for a specific platform.

    Args:
        gif_path: Path to GIF file
        platform: Platform preset name (e.g., 'slack_emoji', 'discord_emoji')

    Returns:
        Tuple of (all_pass: bool, results: dict)
    """
    from PIL import Image

    gif_path = Path(gif_path)
    preset = get_preset(platform)

    if not gif_path.exists():
        return False, {'error': f'File not found: {gif_path}'}

    print(f"\nValidating {gif_path.name} for {preset['name']}:")
    print("=" * 60)

    # Check file size
    size_pass, size_info = check_file_size(gif_path, platform)

    # Check dimensions
    try:
        with Image.open(gif_path) as img:
            width, height = img.size
            dim_pass, dim_info = validate_dimensions(width, height, platform)

            # Count frames
            frame_count = 0
            try:
                while True:
                    img.seek(frame_count)
                    frame_count += 1
            except EOFError:
                pass

            # Get duration if available
            try:
                duration_ms = img.info.get('duration', 100)
                total_duration = (duration_ms * frame_count) / 1000
                fps = frame_count / total_duration if total_duration > 0 else 0
            except:
                duration_ms = None
                total_duration = None
                fps = None

    except Exception as e:
        return False, {'error': f'Failed to read GIF: {e}'}

    print(f"\nFrames: {frame_count}")
    if total_duration:
        print(f"Duration: {total_duration:.1f}s @ {fps:.1f} fps")

    # Check recommended values
    if preset['recommended_frames'] and frame_count > preset['recommended_frames']:
        print(f"⚠ Frame count ({frame_count}) exceeds recommended {preset['recommended_frames']}")
    if fps and preset['recommended_fps'] and fps > preset['recommended_fps'] * 1.5:
        print(f"⚠ FPS ({fps:.1f}) is high, recommended: {preset['recommended_fps']}")

    all_pass = size_pass and dim_pass

    results = {
        'file': str(gif_path),
        'platform': preset['name'],
        'passes': all_pass,
        'size': size_info,
        'dimensions': dim_info,
        'frame_count': frame_count,
        'duration_seconds': total_duration,
        'fps': fps,
        'preset': preset
    }

    print("=" * 60)
    if all_pass:
        print(f"✓ All validations passed for {preset['name']}!")
    else:
        print(f"✗ Some validations failed for {preset['name']}")
    print()

    return all_pass, results


def get_optimization_suggestions(results: dict) -> list[str]:
    """
    Get suggestions for optimizing a GIF based on validation results.

    Args:
        results: Results dict from validate_gif()

    Returns:
        List of suggestion strings
    """
    suggestions = []

    if not results.get('passes', False):
        size_info = results.get('size', {})
        dim_info = results.get('dimensions', {})
        preset = results.get('preset', {})

        # Size suggestions
        if not size_info.get('passes', True) and size_info.get('limit_kb'):
            overage = size_info['size_kb'] - size_info['limit_kb']
            suggestions.append(f"Reduce file size by {overage:.1f} KB:")

            # Strict limits (< 100KB)
            if size_info['limit_kb'] < 100:
                suggestions.append("  - Limit to 10-12 frames")
                suggestions.append("  - Use 32-48 colors maximum")
                suggestions.append("  - Remove gradients (solid colors compress better)")
                suggestions.append("  - Simplify design")
            # Moderate limits (100KB - 1MB)
            elif size_info['limit_kb'] < 1024:
                suggestions.append("  - Reduce frame count or FPS")
                suggestions.append("  - Use 64-128 colors")
                suggestions.append("  - Reduce dimensions if possible")
            # Large limits (> 1MB)
            else:
                suggestions.append("  - Reduce frame count or FPS")
                suggestions.append("  - Use 128-256 colors")
                suggestions.append("  - Consider lower resolution")

        # Dimension suggestions
        if not dim_info.get('passes', True):
            if preset.get('optimal_dimensions'):
                opt_w, opt_h = preset['optimal_dimensions']
                suggestions.append(f"For optimal results on {preset['name']}:")
                suggestions.append(f"  - Use {opt_w}x{opt_h} dimensions")
            if preset.get('must_be_square'):
                suggestions.append("  - Ensure square aspect ratio")

    return suggestions


def is_valid_for_platform(gif_path: str | Path, platform: str = 'general',
                          verbose: bool = True) -> bool:
    """
    Quick check if GIF is valid for a specific platform.

    Args:
        gif_path: Path to GIF file
        platform: Platform preset name
        verbose: Print detailed feedback

    Returns:
        True if valid, False otherwise
    """
    if verbose:
        passes, results = validate_gif(gif_path, platform)
        if not passes:
            suggestions = get_optimization_suggestions(results)
            if suggestions:
                print("\nSuggestions:")
                for suggestion in suggestions:
                    print(suggestion)
        return passes
    else:
        size_pass, _ = check_file_size(gif_path, platform)
        return size_pass


# Backward compatibility aliases for Slack
def check_slack_size(gif_path: str | Path, is_emoji: bool = True) -> tuple[bool, dict]:
    """Legacy function for Slack validation (use check_file_size instead)."""
    platform = 'slack_emoji' if is_emoji else 'slack_message'
    return check_file_size(gif_path, platform)


def is_slack_ready(gif_path: str | Path, is_emoji: bool = True, verbose: bool = True) -> bool:
    """Legacy function for Slack validation (use is_valid_for_platform instead)."""
    platform = 'slack_emoji' if is_emoji else 'slack_message'
    return is_valid_for_platform(gif_path, platform, verbose)
