"""
SVG Builder Module
==================

Core SVG document builder for icon generation.
Provides fluent API for creating scalable vector graphics.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any
from xml.etree import ElementTree as ET
from xml.dom import minidom


@dataclass
class IconConfig:
    """Configuration for icon generation"""
    width: int = 48
    height: int = 48
    viewbox: Optional[Tuple[int, int, int, int]] = None  # (x, y, width, height)
    stroke_width: float = 2.0
    stroke_color: str = '#000000'
    fill_color: str = 'none'
    stroke_linecap: str = 'round'  # butt, round, square
    stroke_linejoin: str = 'round'  # miter, round, bevel
    background: Optional[str] = None
    style: str = 'line_art'  # line_art, filled, duotone

    def __post_init__(self):
        """Set default viewbox if not provided"""
        if self.viewbox is None:
            self.viewbox = (0, 0, self.width, self.height)


class SVGBuilder:
    """
    SVG document builder with fluent API.

    Example:
        builder = SVGBuilder(48, 48)
        builder.add_circle(24, 24, 20, fill='#3B82F6')
        builder.add_path('M10,10 L40,40', stroke='#000')
        svg_string = builder.to_svg()
    """

    def __init__(
        self,
        width: int = 48,
        height: int = 48,
        config: Optional[IconConfig] = None
    ):
        """
        Initialize SVG builder.

        Args:
            width: Canvas width in pixels
            height: Canvas height in pixels
            config: Optional IconConfig for default styles
        """
        self.config = config or IconConfig(width=width, height=height)
        self.width = width
        self.height = height
        self.elements: List[ET.Element] = []
        self.defs: List[ET.Element] = []
        self.current_group: Optional[ET.Element] = None
        self.groups_stack: List[ET.Element] = []

    def add_path(
        self,
        d: str,
        stroke: Optional[str] = None,
        stroke_width: Optional[float] = None,
        fill: Optional[str] = None,
        stroke_linecap: Optional[str] = None,
        stroke_linejoin: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs
    ) -> 'SVGBuilder':
        """
        Add a path element to the SVG.

        Args:
            d: Path data string (e.g., 'M10,10 L40,40')
            stroke: Stroke color (hex or color name)
            stroke_width: Stroke width in pixels
            fill: Fill color
            stroke_linecap: Line cap style
            stroke_linejoin: Line join style
            opacity: Opacity (0.0-1.0)
            **kwargs: Additional SVG attributes

        Returns:
            Self for method chaining
        """
        elem = ET.Element('path', d=d)
        self._apply_style(
            elem,
            stroke=stroke,
            stroke_width=stroke_width,
            fill=fill,
            stroke_linecap=stroke_linecap,
            stroke_linejoin=stroke_linejoin,
            opacity=opacity,
            **kwargs
        )
        self._add_element(elem)
        return self

    def add_circle(
        self,
        cx: float,
        cy: float,
        r: float,
        stroke: Optional[str] = None,
        stroke_width: Optional[float] = None,
        fill: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs
    ) -> 'SVGBuilder':
        """
        Add a circle element to the SVG.

        Args:
            cx: Center X coordinate
            cy: Center Y coordinate
            r: Radius
            stroke: Stroke color
            stroke_width: Stroke width
            fill: Fill color
            opacity: Opacity (0.0-1.0)
            **kwargs: Additional SVG attributes

        Returns:
            Self for method chaining
        """
        elem = ET.Element('circle', cx=str(cx), cy=str(cy), r=str(r))
        self._apply_style(
            elem,
            stroke=stroke,
            stroke_width=stroke_width,
            fill=fill,
            opacity=opacity,
            **kwargs
        )
        self._add_element(elem)
        return self

    def add_rect(
        self,
        x: float,
        y: float,
        width: float,
        height: float,
        rx: Optional[float] = None,
        ry: Optional[float] = None,
        stroke: Optional[str] = None,
        stroke_width: Optional[float] = None,
        fill: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs
    ) -> 'SVGBuilder':
        """
        Add a rectangle element to the SVG.

        Args:
            x: X coordinate of top-left corner
            y: Y coordinate of top-left corner
            width: Rectangle width
            height: Rectangle height
            rx: X-axis corner radius (optional)
            ry: Y-axis corner radius (optional)
            stroke: Stroke color
            stroke_width: Stroke width
            fill: Fill color
            opacity: Opacity (0.0-1.0)
            **kwargs: Additional SVG attributes

        Returns:
            Self for method chaining
        """
        attrs = {'x': str(x), 'y': str(y), 'width': str(width), 'height': str(height)}
        if rx is not None:
            attrs['rx'] = str(rx)
        if ry is not None:
            attrs['ry'] = str(ry)

        elem = ET.Element('rect', **attrs)
        self._apply_style(
            elem,
            stroke=stroke,
            stroke_width=stroke_width,
            fill=fill,
            opacity=opacity,
            **kwargs
        )
        self._add_element(elem)
        return self

    def add_line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        stroke: Optional[str] = None,
        stroke_width: Optional[float] = None,
        stroke_linecap: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs
    ) -> 'SVGBuilder':
        """
        Add a line element to the SVG.

        Args:
            x1: Start X coordinate
            y1: Start Y coordinate
            x2: End X coordinate
            y2: End Y coordinate
            stroke: Stroke color
            stroke_width: Stroke width
            stroke_linecap: Line cap style
            opacity: Opacity (0.0-1.0)
            **kwargs: Additional SVG attributes

        Returns:
            Self for method chaining
        """
        elem = ET.Element('line', x1=str(x1), y1=str(y1), x2=str(x2), y2=str(y2))
        self._apply_style(
            elem,
            stroke=stroke,
            stroke_width=stroke_width,
            stroke_linecap=stroke_linecap,
            opacity=opacity,
            **kwargs
        )
        self._add_element(elem)
        return self

    def add_polyline(
        self,
        points: List[Tuple[float, float]],
        stroke: Optional[str] = None,
        stroke_width: Optional[float] = None,
        fill: Optional[str] = None,
        stroke_linecap: Optional[str] = None,
        stroke_linejoin: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs
    ) -> 'SVGBuilder':
        """
        Add a polyline element to the SVG.

        Args:
            points: List of (x, y) coordinate tuples
            stroke: Stroke color
            stroke_width: Stroke width
            fill: Fill color
            stroke_linecap: Line cap style
            stroke_linejoin: Line join style
            opacity: Opacity (0.0-1.0)
            **kwargs: Additional SVG attributes

        Returns:
            Self for method chaining
        """
        points_str = ' '.join(f"{x},{y}" for x, y in points)
        elem = ET.Element('polyline', points=points_str)
        self._apply_style(
            elem,
            stroke=stroke,
            stroke_width=stroke_width,
            fill=fill,
            stroke_linecap=stroke_linecap,
            stroke_linejoin=stroke_linejoin,
            opacity=opacity,
            **kwargs
        )
        self._add_element(elem)
        return self

    def add_polygon(
        self,
        points: List[Tuple[float, float]],
        stroke: Optional[str] = None,
        stroke_width: Optional[float] = None,
        fill: Optional[str] = None,
        stroke_linejoin: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs
    ) -> 'SVGBuilder':
        """
        Add a polygon element to the SVG.

        Args:
            points: List of (x, y) coordinate tuples
            stroke: Stroke color
            stroke_width: Stroke width
            fill: Fill color
            stroke_linejoin: Line join style
            opacity: Opacity (0.0-1.0)
            **kwargs: Additional SVG attributes

        Returns:
            Self for method chaining
        """
        points_str = ' '.join(f"{x},{y}" for x, y in points)
        elem = ET.Element('polygon', points=points_str)
        self._apply_style(
            elem,
            stroke=stroke,
            stroke_width=stroke_width,
            fill=fill,
            stroke_linejoin=stroke_linejoin,
            opacity=opacity,
            **kwargs
        )
        self._add_element(elem)
        return self

    def add_text(
        self,
        text: str,
        x: float,
        y: float,
        font_size: int = 16,
        font_family: str = 'Arial, sans-serif',
        fill: Optional[str] = None,
        text_anchor: str = 'start',
        opacity: float = 1.0,
        **kwargs
    ) -> 'SVGBuilder':
        """
        Add a text element to the SVG.

        Args:
            text: Text content
            x: X coordinate
            y: Y coordinate
            font_size: Font size in pixels
            font_family: Font family
            fill: Text color
            text_anchor: Text alignment (start, middle, end)
            opacity: Opacity (0.0-1.0)
            **kwargs: Additional SVG attributes

        Returns:
            Self for method chaining
        """
        elem = ET.Element('text', x=str(x), y=str(y))
        elem.text = text

        style_parts = [
            f'font-size:{font_size}px',
            f'font-family:{font_family}',
            f'text-anchor:{text_anchor}'
        ]

        if fill or self.config.fill_color != 'none':
            fill_color = fill or self.config.fill_color
            style_parts.append(f'fill:{fill_color}')

        if opacity < 1.0:
            style_parts.append(f'opacity:{opacity}')

        elem.set('style', ';'.join(style_parts))

        for key, value in kwargs.items():
            elem.set(key, str(value))

        self._add_element(elem)
        return self

    def begin_group(
        self,
        id: Optional[str] = None,
        transform: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs
    ) -> 'SVGBuilder':
        """
        Begin a group element for grouping multiple elements.

        Args:
            id: Optional group ID
            transform: Transform attribute (e.g., 'rotate(45 24 24)')
            opacity: Group opacity
            **kwargs: Additional SVG attributes

        Returns:
            Self for method chaining
        """
        attrs = {}
        if id:
            attrs['id'] = id
        if transform:
            attrs['transform'] = transform
        if opacity < 1.0:
            attrs['opacity'] = str(opacity)

        for key, value in kwargs.items():
            attrs[key] = str(value)

        group = ET.Element('g', **attrs)

        if self.current_group is not None:
            self.groups_stack.append(self.current_group)

        self.current_group = group
        return self

    def end_group(self) -> 'SVGBuilder':
        """
        End the current group element.

        Returns:
            Self for method chaining
        """
        if self.current_group is not None:
            if self.groups_stack:
                parent_group = self.groups_stack.pop()
                parent_group.append(self.current_group)
                self.current_group = parent_group
            else:
                self.elements.append(self.current_group)
                self.current_group = None
        return self

    def add_gradient(
        self,
        id: str,
        gradient_type: str = 'linear',
        stops: List[Tuple[float, str, float]] = None,
        x1: str = '0%',
        y1: str = '0%',
        x2: str = '100%',
        y2: str = '0%',
        cx: str = '50%',
        cy: str = '50%',
        r: str = '50%'
    ) -> 'SVGBuilder':
        """
        Add a gradient definition.

        Args:
            id: Gradient ID for referencing
            gradient_type: 'linear' or 'radial'
            stops: List of (offset, color, opacity) tuples
            x1, y1, x2, y2: Linear gradient coordinates
            cx, cy, r: Radial gradient coordinates

        Returns:
            Self for method chaining
        """
        if gradient_type == 'linear':
            grad = ET.Element('linearGradient', id=id, x1=x1, y1=y1, x2=x2, y2=y2)
        else:
            grad = ET.Element('radialGradient', id=id, cx=cx, cy=cy, r=r)

        if stops:
            for offset, color, opacity in stops:
                stop = ET.Element('stop', offset=f"{offset}%")
                stop.set('style', f'stop-color:{color};stop-opacity:{opacity}')
                grad.append(stop)

        self.defs.append(grad)
        return self

    def transform_rotate(self, angle: float, cx: Optional[float] = None, cy: Optional[float] = None) -> str:
        """Generate rotation transform string"""
        if cx is not None and cy is not None:
            return f"rotate({angle} {cx} {cy})"
        return f"rotate({angle})"

    def transform_scale(self, sx: float, sy: Optional[float] = None) -> str:
        """Generate scale transform string"""
        if sy is not None:
            return f"scale({sx} {sy})"
        return f"scale({sx})"

    def transform_translate(self, tx: float, ty: float) -> str:
        """Generate translate transform string"""
        return f"translate({tx} {ty})"

    def _apply_style(
        self,
        elem: ET.Element,
        stroke: Optional[str] = None,
        stroke_width: Optional[float] = None,
        fill: Optional[str] = None,
        stroke_linecap: Optional[str] = None,
        stroke_linejoin: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs
    ):
        """Apply style attributes to an element"""
        style_parts = []

        # Stroke
        if stroke or self.config.stroke_color:
            stroke_color = stroke or self.config.stroke_color
            style_parts.append(f'stroke:{stroke_color}')

        # Stroke width
        if stroke_width is not None or self.config.stroke_width:
            width = stroke_width if stroke_width is not None else self.config.stroke_width
            style_parts.append(f'stroke-width:{width}')

        # Fill
        if fill is not None:
            style_parts.append(f'fill:{fill}')
        elif self.config.fill_color:
            style_parts.append(f'fill:{self.config.fill_color}')

        # Stroke linecap
        if stroke_linecap or self.config.stroke_linecap:
            cap = stroke_linecap or self.config.stroke_linecap
            style_parts.append(f'stroke-linecap:{cap}')

        # Stroke linejoin
        if stroke_linejoin or self.config.stroke_linejoin:
            join = stroke_linejoin or self.config.stroke_linejoin
            style_parts.append(f'stroke-linejoin:{join}')

        # Opacity
        if opacity < 1.0:
            style_parts.append(f'opacity:{opacity}')

        if style_parts:
            elem.set('style', ';'.join(style_parts))

        # Additional attributes
        for key, value in kwargs.items():
            elem.set(key, str(value))

    def _add_element(self, elem: ET.Element):
        """Add element to current group or root"""
        if self.current_group is not None:
            self.current_group.append(elem)
        else:
            self.elements.append(elem)

    def to_svg(self, pretty: bool = True, include_xml_declaration: bool = True) -> str:
        """
        Generate SVG string.

        Args:
            pretty: Format with indentation
            include_xml_declaration: Include XML declaration

        Returns:
            SVG string
        """
        vb = self.config.viewbox
        svg = ET.Element(
            'svg',
            xmlns='http://www.w3.org/2000/svg',
            width=str(self.width),
            height=str(self.height),
            viewBox=f"{vb[0]} {vb[1]} {vb[2]} {vb[3]}"
        )

        # Add background if specified
        if self.config.background:
            bg = ET.Element(
                'rect',
                x='0',
                y='0',
                width=str(self.width),
                height=str(self.height),
                fill=self.config.background
            )
            svg.append(bg)

        # Add defs if any
        if self.defs:
            defs_elem = ET.Element('defs')
            for def_elem in self.defs:
                defs_elem.append(def_elem)
            svg.append(defs_elem)

        # Add all elements
        for elem in self.elements:
            svg.append(elem)

        # Convert to string
        svg_string = ET.tostring(svg, encoding='unicode')

        if pretty:
            dom = minidom.parseString(svg_string)
            svg_string = dom.toprettyxml(indent='  ')
            # Remove XML declaration if not wanted
            if not include_xml_declaration:
                svg_string = '\n'.join(svg_string.split('\n')[1:])

        return svg_string

    def save(self, filename: str, pretty: bool = True):
        """
        Save SVG to file.

        Args:
            filename: Output filename
            pretty: Format with indentation
        """
        svg_content = self.to_svg(pretty=pretty)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(svg_content)


if __name__ == '__main__':
    # Example usage
    print("SVG Builder Example\n" + "=" * 50)

    # Create a simple icon
    builder = SVGBuilder(48, 48)
    builder.add_circle(24, 24, 20, stroke='#3B82F6', stroke_width=2, fill='none')
    builder.add_line(10, 24, 38, 24, stroke='#3B82F6', stroke_width=2)

    print(builder.to_svg())
