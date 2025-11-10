"""
Typography - Text rendering system with advanced features
"""
from PIL import Image, ImageDraw, ImageFont
from typing import Tuple, Optional, List
import textwrap


class Typography:
    """
    Advanced text rendering system
    """

    # Default font sizes
    FONT_SIZES = {
        'small': 24,
        'medium': 36,
        'large': 48,
        'xlarge': 64,
        'xxlarge': 80,
    }

    def __init__(self):
        self._font_cache = {}

    def get_font(self, size: int = 36, bold: bool = False) -> ImageFont.FreeTypeFont:
        """
        Get a font with caching

        Args:
            size: Font size in pixels
            bold: Whether to use bold font

        Returns:
            PIL Font object
        """
        cache_key = (size, bold)
        if cache_key in self._font_cache:
            return self._font_cache[cache_key]

        try:
            # Try to load system fonts (Windows/Linux/Mac compatible)
            font_names = [
                'Arial Bold' if bold else 'Arial',
                'Helvetica Bold' if bold else 'Helvetica',
                'DejaVuSans-Bold' if bold else 'DejaVuSans',
            ]

            font = None
            for font_name in font_names:
                try:
                    font = ImageFont.truetype(font_name, size)
                    break
                except:
                    continue

            if font is None:
                # Fallback to default font
                font = ImageFont.load_default()

            self._font_cache[cache_key] = font
            return font

        except Exception:
            return ImageFont.load_default()

    def get_text_size(
        self,
        text: str,
        font_size: int = 36,
        bold: bool = False
    ) -> Tuple[int, int]:
        """
        Get text dimensions

        Args:
            text: Text to measure
            font_size: Font size in pixels
            bold: Whether to use bold font

        Returns:
            (width, height) tuple
        """
        font = self.get_font(font_size, bold)

        # Create a temporary image to measure text
        temp_img = Image.new('RGB', (1, 1))
        draw = ImageDraw.Draw(temp_img)
        bbox = draw.textbbox((0, 0), text, font=font)

        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]

        return (width, height)

    def render_text(
        self,
        text: str,
        font_size: int = 36,
        color: Tuple[int, int, int, int] = (0, 0, 0, 255),
        bold: bool = False,
        padding: int = 20
    ) -> Image.Image:
        """
        Render text to an image

        Args:
            text: Text to render
            font_size: Font size in pixels
            color: Text color (R, G, B, A)
            bold: Whether to use bold font
            padding: Padding around text

        Returns:
            Image with rendered text
        """
        font = self.get_font(font_size, bold)

        # Measure text
        text_width, text_height = self.get_text_size(text, font_size, bold)

        # Create image with padding
        img = Image.new('RGBA',
                       (text_width + padding * 2, text_height + padding * 2),
                       (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw text centered
        draw.text((padding, padding), text, font=font, fill=color)

        return img

    def render_multiline_text(
        self,
        text: str,
        font_size: int = 36,
        color: Tuple[int, int, int, int] = (0, 0, 0, 255),
        bold: bool = False,
        line_spacing: int = 10,
        max_width: Optional[int] = None,
        align: str = 'left',
        padding: int = 20
    ) -> Image.Image:
        """
        Render multiline text

        Args:
            text: Text to render
            font_size: Font size in pixels
            color: Text color (R, G, B, A)
            bold: Whether to use bold font
            line_spacing: Spacing between lines
            max_width: Maximum width for text wrapping (None = no wrap)
            align: Text alignment ('left', 'center', 'right')
            padding: Padding around text

        Returns:
            Image with rendered text
        """
        font = self.get_font(font_size, bold)

        # Wrap text if max_width specified
        if max_width:
            # Estimate characters per line
            avg_char_width = font_size * 0.6
            chars_per_line = int(max_width / avg_char_width)
            lines = textwrap.wrap(text, width=chars_per_line)
        else:
            lines = text.split('\n')

        # Measure lines
        line_heights = []
        line_widths = []
        for line in lines:
            w, h = self.get_text_size(line, font_size, bold)
            line_widths.append(w)
            line_heights.append(h)

        # Calculate total dimensions
        total_width = max(line_widths) if line_widths else 0
        total_height = sum(line_heights) + line_spacing * (len(lines) - 1)

        # Create image
        img = Image.new('RGBA',
                       (total_width + padding * 2, total_height + padding * 2),
                       (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw each line
        y = padding
        for line, line_width in zip(lines, line_widths):
            if align == 'center':
                x = (total_width - line_width) // 2 + padding
            elif align == 'right':
                x = total_width - line_width + padding
            else:  # left
                x = padding

            draw.text((x, y), line, font=font, fill=color)
            y += self.get_text_size(line, font_size, bold)[1] + line_spacing

        return img

    def render_text_with_outline(
        self,
        text: str,
        font_size: int = 36,
        text_color: Tuple[int, int, int, int] = (255, 255, 255, 255),
        outline_color: Tuple[int, int, int, int] = (0, 0, 0, 255),
        outline_width: int = 2,
        bold: bool = False,
        padding: int = 20
    ) -> Image.Image:
        """
        Render text with outline

        Args:
            text: Text to render
            font_size: Font size in pixels
            text_color: Text color (R, G, B, A)
            outline_color: Outline color (R, G, B, A)
            outline_width: Outline width in pixels
            bold: Whether to use bold font
            padding: Padding around text

        Returns:
            Image with outlined text
        """
        font = self.get_font(font_size, bold)

        # Measure text
        text_width, text_height = self.get_text_size(text, font_size, bold)

        # Create image with extra space for outline
        total_padding = padding + outline_width
        img = Image.new('RGBA',
                       (text_width + total_padding * 2, text_height + total_padding * 2),
                       (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw outline by drawing text in multiple positions
        for x_offset in range(-outline_width, outline_width + 1):
            for y_offset in range(-outline_width, outline_width + 1):
                if x_offset != 0 or y_offset != 0:
                    draw.text(
                        (total_padding + x_offset, total_padding + y_offset),
                        text,
                        font=font,
                        fill=outline_color
                    )

        # Draw main text
        draw.text((total_padding, total_padding), text, font=font, fill=text_color)

        return img

    def render_text_with_shadow(
        self,
        text: str,
        font_size: int = 36,
        text_color: Tuple[int, int, int, int] = (255, 255, 255, 255),
        shadow_color: Tuple[int, int, int, int] = (0, 0, 0, 128),
        shadow_offset: Tuple[int, int] = (3, 3),
        bold: bool = False,
        padding: int = 20
    ) -> Image.Image:
        """
        Render text with drop shadow

        Args:
            text: Text to render
            font_size: Font size in pixels
            text_color: Text color (R, G, B, A)
            shadow_color: Shadow color (R, G, B, A)
            shadow_offset: Shadow offset (x, y)
            bold: Whether to use bold font
            padding: Padding around text

        Returns:
            Image with shadowed text
        """
        font = self.get_font(font_size, bold)

        # Measure text
        text_width, text_height = self.get_text_size(text, font_size, bold)

        # Calculate image size with shadow
        img_width = text_width + padding * 2 + abs(shadow_offset[0])
        img_height = text_height + padding * 2 + abs(shadow_offset[1])

        img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw shadow
        shadow_x = padding + max(0, shadow_offset[0])
        shadow_y = padding + max(0, shadow_offset[1])
        draw.text((shadow_x, shadow_y), text, font=font, fill=shadow_color)

        # Draw main text
        text_x = padding + max(0, -shadow_offset[0])
        text_y = padding + max(0, -shadow_offset[1])
        draw.text((text_x, text_y), text, font=font, fill=text_color)

        return img

    def render_text_in_box(
        self,
        text: str,
        box_width: int,
        box_height: int,
        font_size: int = 36,
        text_color: Tuple[int, int, int, int] = (0, 0, 0, 255),
        background_color: Tuple[int, int, int, int] = (255, 255, 255, 255),
        bold: bool = False,
        align: str = 'center',
        valign: str = 'center',
        padding: int = 20
    ) -> Image.Image:
        """
        Render text centered in a box

        Args:
            text: Text to render
            box_width: Box width
            box_height: Box height
            font_size: Font size in pixels
            text_color: Text color (R, G, B, A)
            background_color: Background color (R, G, B, A)
            bold: Whether to use bold font
            align: Horizontal alignment ('left', 'center', 'right')
            valign: Vertical alignment ('top', 'center', 'bottom')
            padding: Padding inside box

        Returns:
            Image with text in box
        """
        # Create box
        img = Image.new('RGBA', (box_width, box_height), background_color)

        # Render text
        text_img = self.render_multiline_text(
            text,
            font_size=font_size,
            color=text_color,
            bold=bold,
            max_width=box_width - padding * 2,
            align=align,
            padding=0
        )

        # Calculate position
        if align == 'left':
            x = padding
        elif align == 'right':
            x = box_width - text_img.width - padding
        else:  # center
            x = (box_width - text_img.width) // 2

        if valign == 'top':
            y = padding
        elif valign == 'bottom':
            y = box_height - text_img.height - padding
        else:  # center
            y = (box_height - text_img.height) // 2

        # Paste text
        img.paste(text_img, (x, y), text_img)

        return img

    def create_badge(
        self,
        text: str,
        font_size: int = 24,
        text_color: Tuple[int, int, int, int] = (255, 255, 255, 255),
        background_color: Tuple[int, int, int, int] = (255, 0, 0, 255),
        padding: int = 15,
        radius: int = 10
    ) -> Image.Image:
        """
        Create a badge with text

        Args:
            text: Badge text
            font_size: Font size
            text_color: Text color
            background_color: Background color
            padding: Padding around text
            radius: Corner radius

        Returns:
            Badge image
        """
        font = self.get_font(font_size, bold=True)

        # Measure text
        text_width, text_height = self.get_text_size(text, font_size, bold=True)

        # Create image
        width = text_width + padding * 2
        height = text_height + padding * 2

        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw rounded rectangle background
        draw.rounded_rectangle(
            [(0, 0), (width - 1, height - 1)],
            radius=radius,
            fill=background_color
        )

        # Draw text
        draw.text((padding, padding), text, font=font, fill=text_color)

        return img

    def create_title_card(
        self,
        title: str,
        subtitle: Optional[str] = None,
        width: int = 480,
        height: int = 270,
        title_size: int = 48,
        subtitle_size: int = 24,
        title_color: Tuple[int, int, int, int] = (255, 255, 255, 255),
        subtitle_color: Tuple[int, int, int, int] = (200, 200, 200, 255),
        background_color: Tuple[int, int, int, int] = (0, 0, 0, 255)
    ) -> Image.Image:
        """
        Create a title card with optional subtitle

        Args:
            title: Main title text
            subtitle: Subtitle text (optional)
            width: Card width
            height: Card height
            title_size: Title font size
            subtitle_size: Subtitle font size
            title_color: Title text color
            subtitle_color: Subtitle text color
            background_color: Background color

        Returns:
            Title card image
        """
        # Create background
        img = Image.new('RGBA', (width, height), background_color)

        # Render title
        title_img = self.render_text(title, title_size, title_color, bold=True, padding=0)

        # Calculate positions
        if subtitle:
            subtitle_img = self.render_text(subtitle, subtitle_size, subtitle_color, padding=0)

            # Stack vertically with spacing
            total_height = title_img.height + 20 + subtitle_img.height
            y_start = (height - total_height) // 2

            # Paste title
            title_x = (width - title_img.width) // 2
            img.paste(title_img, (title_x, y_start), title_img)

            # Paste subtitle
            subtitle_x = (width - subtitle_img.width) // 2
            img.paste(subtitle_img, (subtitle_x, y_start + title_img.height + 20), subtitle_img)
        else:
            # Center title only
            title_x = (width - title_img.width) // 2
            title_y = (height - title_img.height) // 2
            img.paste(title_img, (title_x, title_y), title_img)

        return img


# Global instance for convenience
typography = Typography()
