"""
Frame Composer - Utilities for composing frames with elements
"""
from PIL import Image, ImageDraw, ImageFilter
from typing import Tuple, Optional, List
import math


class FrameComposer:
    """
    Utilities for composing frames with various elements and effects
    """

    @staticmethod
    def create_background(
        width: int,
        height: int,
        color: Tuple[int, int, int, int] = (255, 255, 255, 255)
    ) -> Image.Image:
        """Create a solid color background"""
        return Image.new('RGBA', (width, height), color)

    @staticmethod
    def create_gradient_background(
        width: int,
        height: int,
        color1: Tuple[int, int, int],
        color2: Tuple[int, int, int],
        direction: str = 'vertical'
    ) -> Image.Image:
        """
        Create a gradient background

        Args:
            width: Image width
            height: Image height
            color1: Start color (R, G, B)
            color2: End color (R, G, B)
            direction: 'vertical', 'horizontal', 'diagonal'

        Returns:
            Gradient background image
        """
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)

        if direction == 'vertical':
            for y in range(height):
                ratio = y / height
                r = int(color1[0] + (color2[0] - color1[0]) * ratio)
                g = int(color1[1] + (color2[1] - color1[1]) * ratio)
                b = int(color1[2] + (color2[2] - color1[2]) * ratio)
                draw.line([(0, y), (width, y)], fill=(r, g, b))

        elif direction == 'horizontal':
            for x in range(width):
                ratio = x / width
                r = int(color1[0] + (color2[0] - color1[0]) * ratio)
                g = int(color1[1] + (color2[1] - color1[1]) * ratio)
                b = int(color1[2] + (color2[2] - color1[2]) * ratio)
                draw.line([(x, 0), (x, height)], fill=(r, g, b))

        elif direction == 'diagonal':
            max_distance = math.sqrt(width ** 2 + height ** 2)
            for y in range(height):
                for x in range(width):
                    distance = math.sqrt(x ** 2 + y ** 2)
                    ratio = distance / max_distance
                    r = int(color1[0] + (color2[0] - color1[0]) * ratio)
                    g = int(color1[1] + (color2[1] - color1[1]) * ratio)
                    b = int(color1[2] + (color2[2] - color1[2]) * ratio)
                    draw.point((x, y), fill=(r, g, b))

        return img.convert('RGBA')

    @staticmethod
    def create_radial_gradient(
        width: int,
        height: int,
        center_color: Tuple[int, int, int],
        edge_color: Tuple[int, int, int],
        center: Optional[Tuple[int, int]] = None
    ) -> Image.Image:
        """
        Create a radial gradient background

        Args:
            width: Image width
            height: Image height
            center_color: Color at center (R, G, B)
            edge_color: Color at edges (R, G, B)
            center: Center point (x, y), default is image center

        Returns:
            Radial gradient background
        """
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)

        if center is None:
            center = (width // 2, height // 2)

        max_distance = math.sqrt(
            max(center[0], width - center[0]) ** 2 +
            max(center[1], height - center[1]) ** 2
        )

        for y in range(height):
            for x in range(width):
                distance = math.sqrt((x - center[0]) ** 2 + (y - center[1]) ** 2)
                ratio = min(distance / max_distance, 1.0)
                r = int(center_color[0] + (edge_color[0] - center_color[0]) * ratio)
                g = int(center_color[1] + (edge_color[1] - center_color[1]) * ratio)
                b = int(center_color[2] + (edge_color[2] - center_color[2]) * ratio)
                draw.point((x, y), fill=(r, g, b))

        return img.convert('RGBA')

    @staticmethod
    def paste_centered(
        background: Image.Image,
        element: Image.Image,
        offset: Tuple[int, int] = (0, 0)
    ) -> Image.Image:
        """
        Paste element centered on background

        Args:
            background: Background image
            element: Element to paste
            offset: Offset from center (x, y)

        Returns:
            Composed image
        """
        result = background.copy()
        x = (background.width - element.width) // 2 + offset[0]
        y = (background.height - element.height) // 2 + offset[1]
        result.paste(element, (x, y), element if element.mode == 'RGBA' else None)
        return result

    @staticmethod
    def paste_with_position(
        background: Image.Image,
        element: Image.Image,
        position: str,
        margin: int = 20
    ) -> Image.Image:
        """
        Paste element at a named position

        Args:
            background: Background image
            element: Element to paste
            position: 'top-left', 'top-center', 'top-right', 'center-left', 'center',
                     'center-right', 'bottom-left', 'bottom-center', 'bottom-right'
            margin: Margin from edges in pixels

        Returns:
            Composed image
        """
        result = background.copy()
        bg_w, bg_h = background.size
        el_w, el_h = element.size

        # Calculate position
        positions = {
            'top-left': (margin, margin),
            'top-center': ((bg_w - el_w) // 2, margin),
            'top-right': (bg_w - el_w - margin, margin),
            'center-left': (margin, (bg_h - el_h) // 2),
            'center': ((bg_w - el_w) // 2, (bg_h - el_h) // 2),
            'center-right': (bg_w - el_w - margin, (bg_h - el_h) // 2),
            'bottom-left': (margin, bg_h - el_h - margin),
            'bottom-center': ((bg_w - el_w) // 2, bg_h - el_h - margin),
            'bottom-right': (bg_w - el_w - margin, bg_h - el_h - margin),
        }

        pos = positions.get(position, positions['center'])
        result.paste(element, pos, element if element.mode == 'RGBA' else None)
        return result

    @staticmethod
    def add_shadow(
        image: Image.Image,
        offset: Tuple[int, int] = (5, 5),
        blur_radius: int = 10,
        opacity: int = 128
    ) -> Image.Image:
        """
        Add drop shadow to an image

        Args:
            image: Image to add shadow to
            offset: Shadow offset (x, y)
            blur_radius: Blur radius for shadow
            opacity: Shadow opacity (0-255)

        Returns:
            Image with shadow
        """
        # Create shadow layer
        shadow = Image.new('RGBA', image.size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)

        # Draw shadow based on alpha channel
        if image.mode == 'RGBA':
            alpha = image.split()[3]
            shadow.paste((0, 0, 0, opacity), (0, 0), alpha)
        else:
            shadow.paste((0, 0, 0, opacity), (0, 0))

        # Blur shadow
        shadow = shadow.filter(ImageFilter.GaussianBlur(blur_radius))

        # Create result with shadow offset
        result = Image.new('RGBA',
                          (image.width + abs(offset[0]) + blur_radius * 2,
                           image.height + abs(offset[1]) + blur_radius * 2),
                          (0, 0, 0, 0))

        shadow_x = blur_radius + max(0, offset[0])
        shadow_y = blur_radius + max(0, offset[1])
        result.paste(shadow, (shadow_x, shadow_y), shadow)

        image_x = blur_radius + max(0, -offset[0])
        image_y = blur_radius + max(0, -offset[1])
        result.paste(image, (image_x, image_y), image if image.mode == 'RGBA' else None)

        return result

    @staticmethod
    def add_border(
        image: Image.Image,
        width: int = 5,
        color: Tuple[int, int, int, int] = (0, 0, 0, 255),
        radius: int = 0
    ) -> Image.Image:
        """
        Add border around image

        Args:
            image: Image to add border to
            width: Border width in pixels
            color: Border color (R, G, B, A)
            radius: Border radius for rounded corners

        Returns:
            Image with border
        """
        result = Image.new('RGBA',
                          (image.width + width * 2, image.height + width * 2),
                          (0, 0, 0, 0))

        # Draw border
        draw = ImageDraw.Draw(result)
        if radius > 0:
            draw.rounded_rectangle(
                [(0, 0), (result.width - 1, result.height - 1)],
                radius=radius,
                fill=color
            )
        else:
            draw.rectangle([(0, 0), (result.width - 1, result.height - 1)], fill=color)

        # Paste original image
        result.paste(image, (width, width), image if image.mode == 'RGBA' else None)

        return result

    @staticmethod
    def create_rounded_rectangle(
        width: int,
        height: int,
        radius: int,
        color: Tuple[int, int, int, int] = (255, 255, 255, 255)
    ) -> Image.Image:
        """
        Create a rounded rectangle

        Args:
            width: Rectangle width
            height: Rectangle height
            radius: Corner radius
            color: Fill color (R, G, B, A)

        Returns:
            Rounded rectangle image
        """
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.rounded_rectangle([(0, 0), (width - 1, height - 1)], radius=radius, fill=color)
        return img

    @staticmethod
    def create_circle(
        diameter: int,
        color: Tuple[int, int, int, int] = (255, 255, 255, 255)
    ) -> Image.Image:
        """
        Create a circle

        Args:
            diameter: Circle diameter
            color: Fill color (R, G, B, A)

        Returns:
            Circle image
        """
        img = Image.new('RGBA', (diameter, diameter), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.ellipse([(0, 0), (diameter - 1, diameter - 1)], fill=color)
        return img

    @staticmethod
    def blend_images(
        image1: Image.Image,
        image2: Image.Image,
        alpha: float = 0.5
    ) -> Image.Image:
        """
        Blend two images together

        Args:
            image1: First image
            image2: Second image
            alpha: Blend factor (0.0 = image1, 1.0 = image2)

        Returns:
            Blended image
        """
        if image1.size != image2.size:
            image2 = image2.resize(image1.size, Image.LANCZOS)

        return Image.blend(image1.convert('RGBA'), image2.convert('RGBA'), alpha)

    @staticmethod
    def apply_opacity(
        image: Image.Image,
        opacity: float
    ) -> Image.Image:
        """
        Apply opacity to an image

        Args:
            image: Image to modify
            opacity: Opacity value (0.0 to 1.0)

        Returns:
            Image with applied opacity
        """
        if image.mode != 'RGBA':
            image = image.convert('RGBA')

        alpha = image.split()[3]
        alpha = alpha.point(lambda p: int(p * opacity))
        image.putalpha(alpha)
        return image

    @staticmethod
    def stack_vertical(
        images: List[Image.Image],
        spacing: int = 0,
        align: str = 'center'
    ) -> Image.Image:
        """
        Stack images vertically

        Args:
            images: List of images to stack
            spacing: Spacing between images
            align: 'left', 'center', 'right'

        Returns:
            Stacked image
        """
        if not images:
            raise ValueError("No images to stack")

        total_width = max(img.width for img in images)
        total_height = sum(img.height for img in images) + spacing * (len(images) - 1)

        result = Image.new('RGBA', (total_width, total_height), (0, 0, 0, 0))

        y = 0
        for img in images:
            if align == 'left':
                x = 0
            elif align == 'right':
                x = total_width - img.width
            else:  # center
                x = (total_width - img.width) // 2

            result.paste(img, (x, y), img if img.mode == 'RGBA' else None)
            y += img.height + spacing

        return result

    @staticmethod
    def stack_horizontal(
        images: List[Image.Image],
        spacing: int = 0,
        align: str = 'center'
    ) -> Image.Image:
        """
        Stack images horizontally

        Args:
            images: List of images to stack
            spacing: Spacing between images
            align: 'top', 'center', 'bottom'

        Returns:
            Stacked image
        """
        if not images:
            raise ValueError("No images to stack")

        total_width = sum(img.width for img in images) + spacing * (len(images) - 1)
        total_height = max(img.height for img in images)

        result = Image.new('RGBA', (total_width, total_height), (0, 0, 0, 0))

        x = 0
        for img in images:
            if align == 'top':
                y = 0
            elif align == 'bottom':
                y = total_height - img.height
            else:  # center
                y = (total_height - img.height) // 2

            result.paste(img, (x, y), img if img.mode == 'RGBA' else None)
            x += img.width + spacing

        return result
