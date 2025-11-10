"""
GIF Builder - Core GIF creation and optimization
"""
from PIL import Image, ImageDraw, ImageFont, ImageSequence
import io
from typing import List, Tuple, Optional, Callable
from dataclasses import dataclass
from .easing import EasingFunction, ease_in_out_cubic


@dataclass
class GIFConfig:
    """Configuration for GIF creation"""
    width: int = 480
    height: int = 270
    fps: int = 30
    duration_seconds: float = 3.0
    loop: int = 0  # 0 = infinite loop
    optimize: bool = True
    quality: int = 85


class GIFBuilder:
    """
    High-performance GIF builder with optimization
    """

    def __init__(self, config: Optional[GIFConfig] = None):
        self.config = config or GIFConfig()
        self.frames: List[Image.Image] = []

    @property
    def frame_count(self) -> int:
        """Calculate total number of frames"""
        return int(self.config.fps * self.config.duration_seconds)

    @property
    def frame_duration(self) -> int:
        """Duration per frame in milliseconds"""
        return int(1000 / self.config.fps)

    def create_frame(self, background_color: Tuple[int, int, int, int] = (255, 255, 255, 255)) -> Image.Image:
        """Create a new blank frame"""
        return Image.new('RGBA', (self.config.width, self.config.height), background_color)

    def add_frame(self, frame: Image.Image):
        """Add a frame to the GIF"""
        self.frames.append(frame.copy())

    def add_frames(self, frames: List[Image.Image]):
        """Add multiple frames to the GIF"""
        self.frames.extend([f.copy() for f in frames])

    def clear_frames(self):
        """Clear all frames"""
        self.frames.clear()

    def animate_property(
        self,
        start_value: float,
        end_value: float,
        easing: EasingFunction = ease_in_out_cubic,
        start_frame: int = 0,
        end_frame: Optional[int] = None
    ) -> List[float]:
        """
        Animate a property from start to end value using an easing function

        Args:
            start_value: Starting value
            end_value: Ending value
            easing: Easing function to use
            start_frame: Frame to start animation
            end_frame: Frame to end animation (None = last frame)

        Returns:
            List of interpolated values for each frame
        """
        if end_frame is None:
            end_frame = self.frame_count

        values = []
        frame_range = end_frame - start_frame

        for i in range(self.frame_count):
            if i < start_frame:
                values.append(start_value)
            elif i >= end_frame:
                values.append(end_value)
            else:
                progress = (i - start_frame) / frame_range
                t = easing(progress)
                value = start_value + (end_value - start_value) * t
                values.append(value)

        return values

    def optimize_palette(self, frames: Optional[List[Image.Image]] = None) -> List[Image.Image]:
        """
        Optimize frames by reducing to indexed color palette

        Args:
            frames: Frames to optimize (None = use self.frames)

        Returns:
            Optimized frames
        """
        if frames is None:
            frames = self.frames

        if not frames:
            return []

        # Convert RGBA to RGB with white background for palette optimization
        rgb_frames = []
        for frame in frames:
            if frame.mode == 'RGBA':
                background = Image.new('RGB', frame.size, (255, 255, 255))
                background.paste(frame, mask=frame.split()[3])  # Use alpha as mask
                rgb_frames.append(background)
            else:
                rgb_frames.append(frame.convert('RGB'))

        # Optimize each frame to P mode (palette)
        optimized = []
        for frame in rgb_frames:
            # Convert to palette mode with adaptive palette
            palette_frame = frame.convert('P', palette=Image.ADAPTIVE, colors=256)
            optimized.append(palette_frame)

        return optimized

    def save(self, output_path: Optional[str] = None) -> bytes:
        """
        Save GIF to file or return as bytes

        Args:
            output_path: Path to save file (None = return bytes)

        Returns:
            GIF data as bytes
        """
        if not self.frames:
            raise ValueError("No frames to save")

        # Optimize frames if enabled
        frames_to_save = self.frames
        if self.config.optimize:
            frames_to_save = self.optimize_palette()

        # Save to bytes buffer
        output = io.BytesIO()
        frames_to_save[0].save(
            output,
            format='GIF',
            save_all=True,
            append_images=frames_to_save[1:],
            duration=self.frame_duration,
            loop=self.config.loop,
            optimize=self.config.optimize
        )

        gif_bytes = output.getvalue()

        # Save to file if path provided
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(gif_bytes)

        return gif_bytes

    def get_file_size(self) -> int:
        """Get the size of the GIF in bytes"""
        return len(self.save())

    def get_file_size_kb(self) -> float:
        """Get the size of the GIF in kilobytes"""
        return self.get_file_size() / 1024

    @staticmethod
    def load_gif(file_path: str) -> Tuple[List[Image.Image], int]:
        """
        Load an existing GIF file

        Args:
            file_path: Path to GIF file

        Returns:
            Tuple of (frames, duration_ms)
        """
        img = Image.open(file_path)
        frames = []
        duration = img.info.get('duration', 100)

        for frame in ImageSequence.Iterator(img):
            frames.append(frame.copy().convert('RGBA'))

        return frames, duration

    def reverse_frames(self):
        """Reverse the order of frames"""
        self.frames.reverse()

    def duplicate_frames(self, count: int = 2):
        """
        Duplicate each frame multiple times (for slower playback)

        Args:
            count: Number of times to duplicate each frame
        """
        duplicated = []
        for frame in self.frames:
            for _ in range(count):
                duplicated.append(frame.copy())
        self.frames = duplicated

    def ping_pong(self):
        """Add reversed frames to create ping-pong effect"""
        if len(self.frames) > 1:
            reversed_frames = list(reversed(self.frames[1:-1]))
            self.frames.extend(reversed_frames)

    def apply_effect(self, effect_func: Callable[[Image.Image, int], Image.Image]):
        """
        Apply a custom effect function to all frames

        Args:
            effect_func: Function that takes (frame, frame_index) and returns modified frame
        """
        self.frames = [effect_func(frame, i) for i, frame in enumerate(self.frames)]

    def resize(self, width: int, height: int):
        """Resize all frames"""
        self.frames = [frame.resize((width, height), Image.LANCZOS) for frame in self.frames]
        self.config.width = width
        self.config.height = height

    def crop(self, box: Tuple[int, int, int, int]):
        """
        Crop all frames

        Args:
            box: (left, top, right, bottom)
        """
        self.frames = [frame.crop(box) for frame in self.frames]
        self.config.width = box[2] - box[0]
        self.config.height = box[3] - box[1]


class AnimationBuilder:
    """Helper class for building complex animations"""

    def __init__(self, gif_builder: GIFBuilder):
        self.builder = gif_builder

    def fade_in(self, frames: List[Image.Image], duration_frames: int) -> List[Image.Image]:
        """Fade in animation"""
        result = []
        for i, frame in enumerate(frames[:duration_frames]):
            alpha = int(255 * (i / duration_frames))
            faded = Image.new('RGBA', frame.size, (255, 255, 255, 0))
            faded.paste(frame, (0, 0))
            faded.putalpha(alpha)
            result.append(faded)
        result.extend(frames[duration_frames:])
        return result

    def fade_out(self, frames: List[Image.Image], duration_frames: int) -> List[Image.Image]:
        """Fade out animation"""
        result = frames[:-duration_frames]
        fade_start = len(frames) - duration_frames
        for i, frame in enumerate(frames[fade_start:]):
            alpha = int(255 * (1 - i / duration_frames))
            faded = Image.new('RGBA', frame.size, (255, 255, 255, 0))
            faded.paste(frame, (0, 0))
            faded.putalpha(alpha)
            result.append(faded)
        return result

    def slide_in(
        self,
        element: Image.Image,
        background: Image.Image,
        direction: str = 'left',
        duration_frames: int = 30,
        easing: EasingFunction = ease_in_out_cubic
    ) -> List[Image.Image]:
        """
        Slide an element into the frame

        Args:
            element: Element to slide in
            background: Background image
            direction: 'left', 'right', 'top', 'bottom'
            duration_frames: Number of frames for animation
            easing: Easing function
        """
        frames = []
        width, height = background.size
        elem_width, elem_height = element.size

        # Calculate start and end positions
        if direction == 'left':
            start_x, start_y = -elem_width, (height - elem_height) // 2
            end_x, end_y = (width - elem_width) // 2, (height - elem_height) // 2
        elif direction == 'right':
            start_x, start_y = width, (height - elem_height) // 2
            end_x, end_y = (width - elem_width) // 2, (height - elem_height) // 2
        elif direction == 'top':
            start_x, start_y = (width - elem_width) // 2, -elem_height
            end_x, end_y = (width - elem_width) // 2, (height - elem_height) // 2
        else:  # bottom
            start_x, start_y = (width - elem_width) // 2, height
            end_x, end_y = (width - elem_width) // 2, (height - elem_height) // 2

        # Animate positions
        for i in range(duration_frames):
            t = easing(i / duration_frames)
            x = int(start_x + (end_x - start_x) * t)
            y = int(start_y + (end_y - start_y) * t)

            frame = background.copy()
            frame.paste(element, (x, y), element if element.mode == 'RGBA' else None)
            frames.append(frame)

        return frames

    def scale_animation(
        self,
        element: Image.Image,
        background: Image.Image,
        start_scale: float = 0.0,
        end_scale: float = 1.0,
        duration_frames: int = 30,
        easing: EasingFunction = ease_in_out_cubic
    ) -> List[Image.Image]:
        """
        Scale animation (grow/shrink)

        Args:
            element: Element to scale
            background: Background image
            start_scale: Starting scale (0.0 to 1.0+)
            end_scale: Ending scale (0.0 to 1.0+)
            duration_frames: Number of frames
            easing: Easing function
        """
        frames = []
        width, height = background.size

        for i in range(duration_frames):
            t = easing(i / duration_frames)
            scale = start_scale + (end_scale - start_scale) * t

            new_width = int(element.width * scale)
            new_height = int(element.height * scale)

            if new_width > 0 and new_height > 0:
                scaled = element.resize((new_width, new_height), Image.LANCZOS)
                frame = background.copy()
                x = (width - new_width) // 2
                y = (height - new_height) // 2
                frame.paste(scaled, (x, y), scaled if scaled.mode == 'RGBA' else None)
                frames.append(frame)

        return frames
