---
name: gif-animator
description: This skill should be used when users need to create animated GIFs for platforms like Slack, Discord, Twitter, Instagram, or websites. It provides composable animation primitives, visual effects, typography, color palettes, and platform-specific optimizations with Python utilities.
---

# GIF Animator Toolkit

A professional toolkit for creating animated GIFs with composable animation primitives, visual effects, and platform-specific optimizations.

## Overview

The GIF Animator provides building blocks for generating high-quality animated GIFs for any purpose: social media, messaging platforms, websites, marketing, and more. Rather than rigid templates, this toolkit offers composable primitives that you can mix and match to create custom animations.

## Key Features

- **Platform Presets**: Built-in optimization for 12+ platforms (Slack, Discord, Twitter, Instagram, etc.)
- **Animation Primitives**: 13+ composable effects (bounce, spin, fade, zoom, etc.)
- **Visual Effects**: Particle systems, motion blur, impact flashes, screen shake
- **Typography System**: Professional text rendering with outlines, shadows, and glows
- **Color Management**: 8 curated palettes plus color manipulation utilities
- **Easing Functions**: 40+ timing functions for smooth, natural motion
- **Optimization Tools**: Automatic color quantization, frame deduplication, size reduction

## Platform Presets

The toolkit includes optimized presets for common platforms:

### Messaging Platforms
- **slack_emoji**: 64KB max, 128x128px (strict requirements)
- **slack_message**: 2MB max, 480x480px
- **discord_emoji**: 256KB max, 128x128px
- **discord_sticker**: 512KB max, 320x320px

### Social Media
- **twitter**: 15MB max, 1280x720px (16:9)
- **instagram_story**: 8MB max, 1080x1920px (9:16 vertical)
- **instagram_post**: 8MB max, 1080x1080px (square)

### Website/UI
- **loading_spinner**: 100KB max, 64x64px (small and fast)
- **banner**: 500KB max, 728x90px (standard banner size)

### General Purpose
- **general**: No limits (use any size/dimensions)
- **high_quality**: 10MB max, 1920x1080px (HD quality)

## Toolkit Components

### Validators (`core/validators.py`)
Platform-aware validation system:
- `validate_gif(path, platform)` - Complete validation for any platform
- `check_file_size(path, platform)` - Size limit checking
- `validate_dimensions(w, h, platform)` - Dimension validation
- `is_valid_for_platform(path, platform)` - Quick ready check
- `get_optimization_suggestions(results)` - Smart optimization tips
- `list_platforms()` - Show all available presets

### GIF Builder (`core/gif_builder.py`)
Core animation engine:
- `GIFBuilder` - Frame-by-frame GIF construction
- Automatic color quantization (global palette)
- Duplicate frame removal
- Platform-specific optimizations
- Multiple export formats

### Animation Primitives (`templates/`)
Composable building blocks:
- **bounce.py** - Bouncing physics with gravity
- **spin.py** - Rotation, wobble, loading spinners
- **shake.py** - Vibration and jiggle effects
- **pulse.py** - Heartbeat and breathing animations
- **fade.py** - Fade in/out transitions
- **zoom.py** - Scale with motion blur
- **explode.py** - Burst and particle effects
- **wiggle.py** - Organic wiggling motion
- **slide.py** - Directional movement
- **flip.py** - Card flip effects
- **morph.py** - Shape transformation
- **move.py** - Path-based movement (linear, arc, circular)
- **kaleidoscope.py** - Mirrored patterns

### Frame Composer (`core/frame_composer.py`)
Drawing and composition utilities:
- Shape drawing (circles, rectangles, stars, rounded corners)
- Text rendering with shadows
- Emoji rendering
- Layer composition with alpha blending
- Gradient backgrounds
- Vignette effects

### Typography (`core/typography.py`)
Professional text rendering:
- `draw_text_with_outline()` - Maximum readability on any background
- `draw_text_with_shadow()` - Drop shadow effects
- `draw_text_with_glow()` - Glowing text
- `draw_text_in_box()` - Text in semi-transparent box
- Font scaling and sizing utilities
- Multi-line text support

### Color Palettes (`core/color_palettes.py`)
Color management system:
- 8 pre-made palettes (vibrant, pastel, dark, neon, professional, ocean, sunset, forest)
- Color manipulation (lighten, darken, blend, saturation, hue shift)
- Gradient generation
- Impact colors (flash, explosion, fire, magic, success, error)
- Complementary, analogous, and triadic color schemes

### Visual Effects (`core/visual_effects.py`)
Advanced animation effects:
- `ParticleSystem` - Confetti, sparkles, explosions, smoke
- `create_impact_flash()` - Bright flash at impact point
- `create_shockwave_rings()` - Expanding ring effects
- `create_speed_lines()` - Motion lines for speed
- `add_motion_blur()` - Frame blending for smooth motion
- `apply_screen_shake()` - Camera shake effect
- Glow, pixelate, wave, chromatic aberration

### Easing Functions (`core/easing.py`)
Smooth animation timing:
- **Linear**: Constant speed
- **Quadratic/Cubic**: Gradual acceleration/deceleration
- **Bounce**: Spring-like motion
- **Elastic**: Rubber band effect
- **Back**: Anticipation and overshoot
- **Sine/Expo/Circular**: Various smooth curves
- Each with ease-in, ease-out, and ease-in-out variants

## Dependencies

Required Python packages (install if not present):
```bash
pip install pillow>=10.0.0 imageio>=2.31.0 imageio-ffmpeg>=0.4.9 numpy>=1.24.0
```

## Usage Philosophy

This toolkit provides **building blocks, not rigid recipes**. The creative workflow:

1. **Define your target** - Choose platform preset or go custom
2. **Design animation phases** - Break down into stages (intro, main, outro)
3. **Mix primitives freely** - Combine bounce + spin, fade + zoom, etc.
4. **Add effects** - Particles, motion blur, text overlays
5. **Validate early** - Check platform limits before adding complexity
6. **Iterate** - Adjust frames, colors, complexity as needed

## Quick Start Examples

### Example 1: Discord Emoji

```python
from core.gif_builder import GIFBuilder
from core.validators import validate_gif
from templates.spin import create_spin_animation

# Create builder for Discord emoji size
builder = GIFBuilder(width=128, height=128, fps=15)

# Generate spin animation
frames = create_spin_animation(
    object_type='emoji',
    object_data={'emoji': '⭐', 'size': 80},
    num_frames=30,
    rotation_type='clockwise',
    full_rotations=2,
    frame_width=128,
    frame_height=128
)

# Add and save
builder.add_frames(frames)
builder.save('star_spin.gif', num_colors=128)

# Validate for Discord
validate_gif('star_spin.gif', platform='discord_emoji')
```

### Example 2: Twitter Animation

```python
from core.gif_builder import GIFBuilder
from core.typography import draw_text_with_outline
from core.frame_composer import create_gradient_background
from core.color_palettes import get_palette

# Create builder for Twitter size (16:9)
builder = GIFBuilder(width=1280, height=720, fps=30)

palette = get_palette('vibrant')

for i in range(60):
    # Create gradient background
    frame = create_gradient_background(
        width=1280,
        height=720,
        top_color=palette['background'],
        bottom_color=palette['accent']
    )

    # Add text with outline
    draw_text_with_outline(
        frame,
        text="Amazing!",
        position=(640, 360),
        font_size=120,
        text_color=palette['text'],
        outline_color=palette['primary'],
        outline_width=5,
        centered=True
    )

    builder.add_frame(frame)

builder.save('twitter_post.gif', num_colors=256)
```

### Example 3: High-Quality Animation

```python
from core.gif_builder import GIFBuilder
from templates.bounce import create_bounce_animation
from templates.spin import create_spin_animation
from core.visual_effects import ParticleSystem

# HD quality - no limits
builder = GIFBuilder(width=1920, height=1080, fps=30)

# Combine bounce + spin for complex motion
bounce_frames = create_bounce_animation(
    object_type='emoji',
    object_data={'emoji': '🚀', 'size': 200},
    num_frames=60,
    frame_width=1920,
    frame_height=1080,
    bounce_height=400
)

# Add particle effects
particles = ParticleSystem()
for i, frame in enumerate(bounce_frames):
    if i % 5 == 0:  # Emit particles every 5 frames
        particles.emit_sparkles(960, 540 + i*5, count=10)
    particles.update()
    particles.render(frame)
    builder.add_frame(frame)

builder.save('rocket_animation.gif', num_colors=256)
```

### Example 4: Loading Spinner for Website

```python
from core.gif_builder import GIFBuilder
from templates.spin import create_loading_spinner

# Small, optimized spinner
builder = GIFBuilder(width=64, height=64, fps=15)

frames = create_loading_spinner(
    num_frames=20,
    spinner_type='dots',
    size=50,
    color=(100, 150, 255),
    frame_width=64,
    frame_height=64
)

builder.add_frames(frames)
builder.save('loading.gif', num_colors=32, optimize_for_emoji=True)

# Validate for web use
from core.validators import validate_gif
validate_gif('loading.gif', platform='loading_spinner')
```

## Optimization Strategies

### For Small Files (< 100KB)
- **Aggressive** frame reduction (10-15 frames max)
- **Aggressive** color reduction (32-48 colors)
- Remove gradients (solid colors compress better)
- Simplify visual design
- Use `optimize_for_emoji=True`

### For Medium Files (100KB - 1MB)
- Moderate frame reduction (30-60 frames)
- Moderate color reduction (64-128 colors)
- Reduce dimensions if possible
- Enable frame deduplication

### For Large Files (> 1MB)
- Standard frame count (60-150 frames)
- Standard colors (128-256 colors)
- Optimize for quality over size
- Consider video formats (MP4, WebM) if platform supports

## Platform-Specific Tips

### Slack Emoji (Strict!)
The 64KB limit is challenging:
- **Exactly 10-12 frames** (no more!)
- **32-40 colors maximum**
- **No gradients** - use solid colors only
- Keep design super simple
- Test early and often

### Discord (Generous)
Much more flexibility:
- 256KB for emoji allows ~30-40 frames
- 512KB for stickers is plenty for complex animations
- Use full color palette (256 colors)

### Social Media (Quality Focus)
Large file limits mean focus on quality:
- Higher FPS (30fps) for smooth motion
- Full color palette
- Add effects liberally (particles, motion blur, etc.)
- Higher resolution

### Website UI (Speed Focus)
Fast loading is critical:
- Keep file size minimal (< 100KB)
- Optimize for perceived performance
- Use frame deduplication aggressively
- Consider CSS animations for simple cases

## Troubleshooting

**GIF too large:**
- Reduce frames or FPS
- Reduce colors (`num_colors` parameter)
- Simplify visual design
- Enable `remove_duplicates=True`
- Check platform with `validate_gif()`

**Colors look wrong:**
- Use `use_global_palette=True` in color optimization
- Avoid gradients for small files
- Test with different `num_colors` values

**Animation looks choppy:**
- Increase FPS (but increases file size)
- Use easing functions for smoother motion
- Add intermediate frames
- Check frame deduplication isn't removing needed frames

**Text is unreadable:**
- Use `draw_text_with_outline()` instead of plain text
- Increase outline width (4-6px)
- Use high contrast colors
- Put text in semi-transparent box
- Test on dark and light backgrounds

## Advanced Techniques

### Combining Multiple Animations
```python
# Layer bounce + spin + particles
bounce_frames = create_bounce_animation(...)
for i, frame in enumerate(bounce_frames):
    # Add rotation
    add_rotation_to_frame(frame, angle=i*10)
    # Add particles
    particles.emit(x, y, count=5)
    particles.update()
    particles.render(frame)
```

### Custom Platform Presets
```python
from core.validators import PLATFORM_PRESETS

# Add your own platform
PLATFORM_PRESETS['my_platform'] = {
    'name': 'My Custom Platform',
    'max_size_kb': 500,
    'optimal_dimensions': (256, 256),
    'min_dimensions': (128, 128),
    'max_dimensions': (512, 512),
    'must_be_square': True,
    'max_colors': 128,
    'recommended_fps': 20,
    'recommended_frames': 40
}

# Use it
validate_gif('my_animation.gif', platform='my_platform')
```

### Export to Multiple Platforms
```python
# Same animation for multiple platforms
builder = GIFBuilder(width=480, height=480, fps=20)
# ... add frames ...

# Slack version (small, optimized)
builder.save('slack.gif', num_colors=64, optimize_for_emoji=True)

# Discord version (higher quality)
builder.save('discord.gif', num_colors=128)

# Twitter version (full quality)
builder.save('twitter.gif', num_colors=256)
```

## Best Practices

1. **Start with validation target** - Know your platform upfront
2. **Test early** - Create quick prototype and validate before complexity
3. **Use solid colors for small files** - Gradients inflate size dramatically
4. **Mix primitives creatively** - Don't just use one effect
5. **Add easing for polish** - Makes animations feel professional
6. **Check frame deduplication** - Sometimes identical frames sneak in
7. **Validate across platforms** - Test on actual target platform
8. **Profile before optimizing** - Use validation suggestions to guide optimization

## When to Use Each Primitive

- **Bounce**: Playful emphasis, reaction GIFs, celebratory animations
- **Spin**: Loading indicators, continuous rotation, cyclical actions
- **Shake**: Urgency, error states, excitement, emphasis
- **Pulse**: Attention-grabbing, heartbeat, breathing, subtle emphasis
- **Fade**: Transitions, appear/disappear, ghost effects
- **Zoom**: Focus, emphasis, impact, dramatic reveals
- **Explode**: Success celebration, dramatic reveals, impact moments
- **Slide**: Enter/exit animations, scrolling effects
- **Flip**: Before/after transitions, card flips, page turns
- **Move**: Follow paths, orbits, complex trajectories
- **Wiggle**: Organic motion, playful animations, attention-grabbing

## Performance Tips

- Enable frame deduplication (default: on)
- Use global palette for better compression
- Reduce FPS before reducing frame count (less noticeable)
- Test on actual device/platform (colors may look different)
- Use particle systems sparingly for small files
- Cache builder instances for multiple GIFs
- Profile with `validate_gif()` to identify bottlenecks

## License

Apache License 2.0 - See LICENSE.txt

## Credits

Built with Python, Pillow, ImageIO, and NumPy.
