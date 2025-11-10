"""
Visual Effects - Effects and particle systems for GIFs
"""
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from typing import Tuple, List, Optional
import math
import random
from dataclasses import dataclass


@dataclass
class Particle:
    """Particle for particle system"""
    x: float
    y: float
    vx: float  # Velocity X
    vy: float  # Velocity Y
    size: int
    color: Tuple[int, int, int, int]
    life: float  # 0.0 to 1.0
    decay: float  # Life decay per frame


class ParticleSystem:
    """
    Particle system for creating effects like confetti, sparkles, etc.
    """

    def __init__(self):
        self.particles: List[Particle] = []

    def emit(
        self,
        x: float,
        y: float,
        count: int,
        velocity_range: Tuple[float, float] = (-5, 5),
        size_range: Tuple[int, int] = (2, 8),
        colors: Optional[List[Tuple[int, int, int, int]]] = None,
        life_range: Tuple[float, float] = (0.8, 1.0),
        decay_range: Tuple[float, float] = (0.01, 0.05)
    ):
        """
        Emit particles from a point

        Args:
            x, y: Emission point
            count: Number of particles to emit
            velocity_range: Range for random velocity
            size_range: Range for particle size
            colors: List of possible colors (random if None)
            life_range: Initial life range
            decay_range: Life decay rate range
        """
        if colors is None:
            colors = [
                (255, 0, 0, 255),    # Red
                (255, 165, 0, 255),  # Orange
                (255, 255, 0, 255),  # Yellow
                (0, 255, 0, 255),    # Green
                (0, 0, 255, 255),    # Blue
                (255, 0, 255, 255),  # Magenta
            ]

        for _ in range(count):
            self.particles.append(Particle(
                x=x,
                y=y,
                vx=random.uniform(*velocity_range),
                vy=random.uniform(*velocity_range),
                size=random.randint(*size_range),
                color=random.choice(colors),
                life=random.uniform(*life_range),
                decay=random.uniform(*decay_range)
            ))

    def update(self, gravity: float = 0.2):
        """
        Update all particles

        Args:
            gravity: Gravity force applied to particles
        """
        alive_particles = []

        for particle in self.particles:
            # Update velocity (gravity)
            particle.vy += gravity

            # Update position
            particle.x += particle.vx
            particle.y += particle.vy

            # Update life
            particle.life -= particle.decay

            # Keep alive particles
            if particle.life > 0:
                alive_particles.append(particle)

        self.particles = alive_particles

    def render(self, image: Image.Image):
        """
        Render particles to image

        Args:
            image: Image to render particles on
        """
        draw = ImageDraw.Draw(image, 'RGBA')

        for particle in self.particles:
            # Calculate alpha based on life
            alpha = int(particle.color[3] * particle.life)
            color_with_alpha = (*particle.color[:3], alpha)

            # Draw particle as circle
            half_size = particle.size // 2
            bbox = [
                particle.x - half_size,
                particle.y - half_size,
                particle.x + half_size,
                particle.y + half_size
            ]
            draw.ellipse(bbox, fill=color_with_alpha)

    def clear(self):
        """Clear all particles"""
        self.particles.clear()


class VisualEffects:
    """
    Collection of visual effects for images
    """

    @staticmethod
    def pulse_effect(
        image: Image.Image,
        scale: float,
        background_color: Tuple[int, int, int, int] = (0, 0, 0, 0)
    ) -> Image.Image:
        """
        Create pulse/scale effect

        Args:
            image: Image to scale
            scale: Scale factor (1.0 = original size)
            background_color: Background color for padding

        Returns:
            Scaled image with same dimensions
        """
        # Calculate new size
        new_width = int(image.width * scale)
        new_height = int(image.height * scale)

        # Scale image
        scaled = image.resize((new_width, new_height), Image.LANCZOS)

        # Create result with original dimensions
        result = Image.new('RGBA', image.size, background_color)

        # Paste scaled image centered
        x = (image.width - new_width) // 2
        y = (image.height - new_height) // 2
        result.paste(scaled, (x, y), scaled if scaled.mode == 'RGBA' else None)

        return result

    @staticmethod
    def rotate_effect(
        image: Image.Image,
        angle: float,
        background_color: Tuple[int, int, int, int] = (0, 0, 0, 0)
    ) -> Image.Image:
        """
        Rotate image

        Args:
            image: Image to rotate
            angle: Rotation angle in degrees (counter-clockwise)
            background_color: Background color for empty areas

        Returns:
            Rotated image
        """
        # Convert background color to RGB if needed
        if len(background_color) == 4:
            bg = background_color
        else:
            bg = (*background_color, 0)

        return image.rotate(angle, expand=False, fillcolor=bg)

    @staticmethod
    def fade_effect(
        image: Image.Image,
        opacity: float
    ) -> Image.Image:
        """
        Apply fade/opacity effect

        Args:
            image: Image to fade
            opacity: Opacity (0.0 = transparent, 1.0 = opaque)

        Returns:
            Faded image
        """
        if image.mode != 'RGBA':
            image = image.convert('RGBA')

        # Create a copy
        result = image.copy()

        # Adjust alpha channel
        alpha = result.split()[3]
        alpha = alpha.point(lambda p: int(p * opacity))
        result.putalpha(alpha)

        return result

    @staticmethod
    def blur_effect(
        image: Image.Image,
        radius: int = 5
    ) -> Image.Image:
        """
        Apply blur effect

        Args:
            image: Image to blur
            radius: Blur radius

        Returns:
            Blurred image
        """
        return image.filter(ImageFilter.GaussianBlur(radius))

    @staticmethod
    def sharpen_effect(
        image: Image.Image,
        factor: float = 1.5
    ) -> Image.Image:
        """
        Sharpen image

        Args:
            image: Image to sharpen
            factor: Sharpening factor (1.0 = original)

        Returns:
            Sharpened image
        """
        enhancer = ImageEnhance.Sharpness(image)
        return enhancer.enhance(factor)

    @staticmethod
    def brightness_effect(
        image: Image.Image,
        factor: float = 1.5
    ) -> Image.Image:
        """
        Adjust brightness

        Args:
            image: Image to adjust
            factor: Brightness factor (1.0 = original, >1.0 = brighter, <1.0 = darker)

        Returns:
            Adjusted image
        """
        enhancer = ImageEnhance.Brightness(image)
        return enhancer.enhance(factor)

    @staticmethod
    def contrast_effect(
        image: Image.Image,
        factor: float = 1.5
    ) -> Image.Image:
        """
        Adjust contrast

        Args:
            image: Image to adjust
            factor: Contrast factor (1.0 = original)

        Returns:
            Adjusted image
        """
        enhancer = ImageEnhance.Contrast(image)
        return enhancer.enhance(factor)

    @staticmethod
    def shake_effect(
        image: Image.Image,
        intensity: int = 10
    ) -> Image.Image:
        """
        Create shake effect with random offset

        Args:
            image: Image to shake
            intensity: Maximum shake distance in pixels

        Returns:
            Image with random offset
        """
        result = Image.new('RGBA', image.size, (0, 0, 0, 0))

        offset_x = random.randint(-intensity, intensity)
        offset_y = random.randint(-intensity, intensity)

        result.paste(image, (offset_x, offset_y), image if image.mode == 'RGBA' else None)

        return result

    @staticmethod
    def glitch_effect(
        image: Image.Image,
        intensity: float = 0.1
    ) -> Image.Image:
        """
        Create digital glitch effect

        Args:
            image: Image to glitch
            intensity: Glitch intensity (0.0 to 1.0)

        Returns:
            Glitched image
        """
        result = image.convert('RGB').copy()
        pixels = result.load()

        width, height = result.size
        glitch_rows = int(height * intensity)

        for _ in range(glitch_rows):
            y = random.randint(0, height - 1)
            offset = random.randint(-20, 20)

            for x in range(width):
                new_x = (x + offset) % width
                if 0 <= new_x < width:
                    # Shift RGB channels
                    r, g, b = pixels[x, y]
                    pixels[new_x, y] = (b, r, g)  # Swap channels

        return result.convert('RGBA')

    @staticmethod
    def zoom_blur_effect(
        image: Image.Image,
        strength: int = 3,
        center: Optional[Tuple[int, int]] = None
    ) -> Image.Image:
        """
        Create zoom blur effect (motion blur toward center)

        Args:
            image: Image to blur
            strength: Blur strength (number of layers)
            center: Center point for zoom (None = image center)

        Returns:
            Zoom-blurred image
        """
        if center is None:
            center = (image.width // 2, image.height // 2)

        result = Image.new('RGBA', image.size, (0, 0, 0, 0))

        for i in range(strength):
            scale = 1.0 - (i * 0.05)
            scaled = image.resize(
                (int(image.width * scale), int(image.height * scale)),
                Image.LANCZOS
            )

            x = center[0] - scaled.width // 2
            y = center[1] - scaled.height // 2

            layer = Image.new('RGBA', image.size, (0, 0, 0, 0))
            layer.paste(scaled, (x, y), scaled if scaled.mode == 'RGBA' else None)

            # Blend with decreasing opacity
            opacity = 1.0 / strength
            result = Image.blend(result.convert('RGBA'), layer, opacity)

        return result

    @staticmethod
    def wave_effect(
        image: Image.Image,
        amplitude: int = 10,
        frequency: float = 0.1,
        offset: float = 0
    ) -> Image.Image:
        """
        Create wave distortion effect

        Args:
            image: Image to distort
            amplitude: Wave height
            frequency: Wave frequency
            offset: Wave offset (for animation)

        Returns:
            Distorted image
        """
        result = Image.new('RGBA', image.size, (0, 0, 0, 0))
        pixels = image.load()
        result_pixels = result.load()

        for y in range(image.height):
            # Calculate wave offset for this row
            wave_offset = int(amplitude * math.sin(frequency * y + offset))

            for x in range(image.width):
                new_x = (x + wave_offset) % image.width
                result_pixels[new_x, y] = pixels[x, y]

        return result

    @staticmethod
    def pixelate_effect(
        image: Image.Image,
        pixel_size: int = 10
    ) -> Image.Image:
        """
        Pixelate image

        Args:
            image: Image to pixelate
            pixel_size: Size of pixels

        Returns:
            Pixelated image
        """
        # Shrink image
        small_size = (
            image.width // pixel_size,
            image.height // pixel_size
        )
        small = image.resize(small_size, Image.NEAREST)

        # Scale back up
        return small.resize(image.size, Image.NEAREST)

    @staticmethod
    def vignette_effect(
        image: Image.Image,
        strength: float = 0.5
    ) -> Image.Image:
        """
        Add vignette effect (darkened edges)

        Args:
            image: Image to add vignette to
            strength: Vignette strength (0.0 to 1.0)

        Returns:
            Image with vignette
        """
        # Create vignette mask
        mask = Image.new('L', image.size, 0)
        draw = ImageDraw.Draw(mask)

        width, height = image.size
        center_x, center_y = width // 2, height // 2
        max_radius = math.sqrt(center_x ** 2 + center_y ** 2)

        for y in range(height):
            for x in range(width):
                distance = math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
                ratio = distance / max_radius
                alpha = int(255 * (1 - ratio * strength))
                draw.point((x, y), fill=alpha)

        # Apply mask
        result = image.copy()
        result.putalpha(mask)

        # Composite with black background
        background = Image.new('RGB', image.size, (0, 0, 0))
        background.paste(result, (0, 0), mask)

        return background.convert('RGBA')

    @staticmethod
    def chromatic_aberration(
        image: Image.Image,
        offset: int = 3
    ) -> Image.Image:
        """
        Create chromatic aberration effect (RGB channel offset)

        Args:
            image: Image to apply effect to
            offset: Pixel offset for channels

        Returns:
            Image with chromatic aberration
        """
        if image.mode != 'RGB' and image.mode != 'RGBA':
            image = image.convert('RGBA')

        r, g, b = image.split()[:3]

        # Offset red channel left
        r = r.transform(image.size, Image.AFFINE, (1, 0, -offset, 0, 1, 0))

        # Offset blue channel right
        b = b.transform(image.size, Image.AFFINE, (1, 0, offset, 0, 1, 0))

        # Merge channels
        if image.mode == 'RGBA':
            a = image.split()[3]
            return Image.merge('RGBA', (r, g, b, a))
        else:
            return Image.merge('RGB', (r, g, b))


def create_sparkle(
    x: int,
    y: int,
    size: int = 20,
    color: Tuple[int, int, int, int] = (255, 255, 255, 255)
) -> Image.Image:
    """
    Create a sparkle/star shape

    Args:
        x, y: Center position
        size: Sparkle size
        color: Sparkle color

    Returns:
        Sparkle image
    """
    img = Image.new('RGBA', (size * 2, size * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size

    # Draw cross
    draw.line([(0, center), (size * 2, center)], fill=color, width=3)
    draw.line([(center, 0), (center, size * 2)], fill=color, width=3)

    # Draw diagonals
    draw.line([(0, 0), (size * 2, size * 2)], fill=color, width=2)
    draw.line([(size * 2, 0), (0, size * 2)], fill=color, width=2)

    return img


def create_confetti_piece() -> Image.Image:
    """
    Create a random confetti piece

    Returns:
        Confetti image
    """
    size = random.randint(8, 16)
    color = random.choice([
        (255, 0, 0, 255),
        (255, 165, 0, 255),
        (255, 255, 0, 255),
        (0, 255, 0, 255),
        (0, 0, 255, 255),
        (255, 0, 255, 255),
    ])

    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Random shape
    shape = random.choice(['circle', 'rectangle', 'triangle'])

    if shape == 'circle':
        draw.ellipse([(0, 0), (size, size)], fill=color)
    elif shape == 'rectangle':
        draw.rectangle([(0, 0), (size, size)], fill=color)
    else:  # triangle
        points = [(size // 2, 0), (0, size), (size, size)]
        draw.polygon(points, fill=color)

    return img
