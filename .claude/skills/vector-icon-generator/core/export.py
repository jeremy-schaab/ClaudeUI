"""
Export Module
=============

Multi-format export functionality for icons.
Supports SVG, PNG, and multi-size icon sets.

Author: SchaabCore Vector Icon Generator
License: Apache 2.0
"""

import os
from typing import List, Optional, Tuple
from pathlib import Path


def _get_project_root() -> Path:
    """
    Get the project root directory.

    Returns:
        Path to project root
    """
    # Start from this file and go up to find .git directory or project markers
    current = Path(__file__).resolve()

    # Go up from: core/export.py -> core/ -> vector-icon-generator/ -> skills/ -> .claude/ -> project-root
    project_root = current.parent.parent.parent.parent.parent

    return project_root


def _get_default_output_dir() -> str:
    """
    Get the default output directory for generated icons.

    Returns:
        Path to docs/icons/generated relative to project root
    """
    project_root = _get_project_root()
    return str(project_root / "docs" / "icons" / "generated")


class IconExporter:
    """Icon export utilities"""

    @staticmethod
    def export_svg(
        svg_content: str,
        filename: str,
        output_dir: Optional[str] = None,
        minify: bool = False
    ) -> str:
        """
        Export icon as SVG file.

        Args:
            svg_content: SVG XML content
            filename: Output filename (without extension)
            output_dir: Output directory (default: docs/icons/generated)
            minify: Minify SVG content

        Returns:
            Output file path
        """
        # Use default output directory if none provided
        if output_dir is None:
            output_dir = _get_default_output_dir()

        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # Add .svg extension if not present
        if not filename.endswith('.svg'):
            filename += '.svg'

        output_path = os.path.join(output_dir, filename)

        # Minify if requested
        if minify:
            svg_content = IconExporter._minify_svg(svg_content)

        # Write file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)

        return output_path

    @staticmethod
    def export_png(
        svg_content: str,
        filename: str,
        size: int = 48,
        output_dir: Optional[str] = None,
        scale: float = 1.0
    ) -> Optional[str]:
        """
        Export icon as PNG file.

        NOTE: PNG export is DISABLED due to cross-platform compatibility issues.
        Use SVG format instead - SVG files scale perfectly to any size.

        Args:
            svg_content: SVG XML content
            filename: Output filename (without extension)
            size: Output size in pixels
            output_dir: Output directory (default: docs/icons/generated)
            scale: Scale factor for high-DPI displays

        Returns:
            None (PNG export disabled)
        """
        print("PNG export is disabled. Use SVG format instead - SVG scales to any size.")
        print("Browsers and image viewers can render SVG at any resolution without quality loss.")
        return None

    @staticmethod
    def export_multi_size(
        svg_content: str,
        filename: str,
        sizes: List[int] = None,
        output_dir: Optional[str] = None,
        formats: List[str] = None
    ) -> List[str]:
        """
        Export icon in multiple sizes (SVG only).

        NOTE: PNG multi-size export is disabled. SVG files are vector-based
        and scale perfectly to any size without quality loss.

        Args:
            svg_content: SVG XML content
            filename: Base filename (without extension)
            sizes: List of sizes in pixels (default: [16, 24, 32, 48])
            output_dir: Output directory (default: docs/icons/generated)
            formats: List of formats - only 'svg' supported (default: ['svg'])

        Returns:
            List of output file paths
        """
        # Use default output directory if none provided
        if output_dir is None:
            output_dir = _get_default_output_dir()

        if sizes is None:
            sizes = [16, 24, 32, 48]

        if formats is None:
            formats = ['svg']

        # Filter out PNG format if specified
        if 'png' in formats:
            print("Warning: PNG export is disabled. Exporting SVG only.")
            formats = ['svg']

        output_files = []

        for size in sizes:
            size_dir = os.path.join(output_dir, f'{size}x{size}')

            # Export SVG only
            if 'svg' in formats:
                svg_path = IconExporter.export_svg(
                    svg_content,
                    filename,
                    output_dir=size_dir
                )
                if svg_path:
                    output_files.append(svg_path)

        return output_files

    @staticmethod
    def export_icon_set(
        icons: List[Tuple[str, str]],
        output_dir: Optional[str] = None,
        sizes: List[int] = None,
        formats: List[str] = None,
        create_manifest: bool = True
    ) -> List[str]:
        """
        Export a set of icons (SVG only).

        NOTE: PNG export is disabled. All icons exported as SVG which scale
        perfectly to any size.

        Args:
            icons: List of (name, svg_content) tuples
            output_dir: Output directory (default: docs/icons/generated)
            sizes: List of sizes to export
            formats: List of formats - only 'svg' supported (default: ['svg'])
            create_manifest: Create manifest.json file

        Returns:
            List of all output file paths
        """
        # Use default output directory if none provided
        if output_dir is None:
            output_dir = _get_default_output_dir()

        # Default to SVG only
        if formats is None:
            formats = ['svg']

        all_files = []

        for name, svg_content in icons:
            files = IconExporter.export_multi_size(
                svg_content,
                name,
                sizes=sizes,
                output_dir=output_dir,
                formats=formats
            )
            all_files.extend(files)

        # Create manifest
        if create_manifest:
            manifest_path = IconExporter._create_manifest(
                icons,
                output_dir,
                sizes,
                formats
            )
            if manifest_path:
                all_files.append(manifest_path)

        return all_files

    @staticmethod
    def _minify_svg(svg_content: str) -> str:
        """
        Minify SVG content.

        Args:
            svg_content: SVG XML content

        Returns:
            Minified SVG content
        """
        import re

        # Remove XML declaration if present
        svg_content = re.sub(r'<\?xml[^>]+\?>\s*', '', svg_content)

        # Remove comments
        svg_content = re.sub(r'<!--.*?-->', '', svg_content, flags=re.DOTALL)

        # Remove extra whitespace
        svg_content = re.sub(r'\s+', ' ', svg_content)
        svg_content = re.sub(r'>\s+<', '><', svg_content)

        # Remove unnecessary precision (reduce float decimals to 2 places)
        svg_content = re.sub(r'(\d+\.\d{3,})', lambda m: f"{float(m.group(1)):.2f}", svg_content)

        return svg_content.strip()

    @staticmethod
    def _create_manifest(
        icons: List[Tuple[str, str]],
        output_dir: str,
        sizes: Optional[List[int]],
        formats: Optional[List[str]]
    ) -> Optional[str]:
        """
        Create manifest.json file for icon set.

        Args:
            icons: List of (name, svg_content) tuples
            output_dir: Output directory
            sizes: List of sizes
            formats: List of formats

        Returns:
            Manifest file path or None
        """
        try:
            import json
            from datetime import datetime

            if sizes is None:
                sizes = [16, 24, 32, 48]
            if formats is None:
                formats = ['svg']

            manifest = {
                'name': 'Icon Set',
                'generated': datetime.now().isoformat(),
                'sizes': sizes,
                'formats': formats,
                'icons': []
            }

            for name, _ in icons:
                icon_entry = {
                    'name': name,
                    'files': {}
                }

                for size in sizes:
                    icon_entry['files'][f'{size}x{size}'] = {}
                    for fmt in formats:
                        path = f'{size}x{size}/{name}.{fmt}'
                        icon_entry['files'][f'{size}x{size}'][fmt] = path

                manifest['icons'].append(icon_entry)

            manifest_path = os.path.join(output_dir, 'manifest.json')
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2)

            return manifest_path

        except Exception as e:
            print(f"Error creating manifest: {str(e)}")
            return None


if __name__ == '__main__':
    # Example usage
    print("Export Module\n" + "=" * 50)

    # Sample SVG
    sample_svg = '''<?xml version="1.0"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" stroke="#3B82F6" stroke-width="2" fill="none"/>
    </svg>'''

    print("\n1. Export SVG (minified):")
    minified = IconExporter._minify_svg(sample_svg)
    print(f"  Original size: {len(sample_svg)} bytes")
    print(f"  Minified size: {len(minified)} bytes")
    print(f"  Savings: {(1 - len(minified)/len(sample_svg))*100:.1f}%")

    print("\n2. Multi-size export example:")
    print("  Sizes: 16x16, 24x24, 32x32, 48x48")
    print("  Formats: SVG only (PNG disabled)")
    print("  Output: ./icon-set/[size]/icon-name.svg")
    print("  Note: SVG files scale to any size without quality loss")
