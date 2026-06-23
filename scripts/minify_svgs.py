#!/usr/bin/env python3
"""Simple SVG minifier: creates .min.svg files next to originals.

Usage: python scripts/minify_svgs.py

This script uses only the standard library: it strips XML comments and collapses
excess whitespace between tags. It is conservative and intended for project use
when full SVGO is not available.
"""
import re
from pathlib import Path


def minify_svg(src_path: Path, dest_path: Path):
    text = src_path.read_text(encoding="utf-8")
    # remove XML comments
    text = re.sub(r"<!--(.*?)-->", "", text, flags=re.DOTALL)
    # collapse whitespace between tags
    text = re.sub(r">\s+<", "><", text)
    # collapse multiple spaces
    text = re.sub(r"\s{2,}", " ", text)
    dest_path.write_text(text.strip(), encoding="utf-8")


def main():
    base = Path(__file__).resolve().parents[1] / "assets" / "images"
    if not base.exists():
        print("assets/images not found; run this from the project root.")
        return
    svgs = sorted(base.glob("*.svg"))
    if not svgs:
        print("No SVG files found in assets/images")
        return
    for svg in svgs:
        dest = svg.with_name(svg.stem + ".min.svg")
        try:
            minify_svg(svg, dest)
            print(f"Wrote {dest.relative_to(base.parent)}")
        except Exception as e:
            print(f"Failed {svg}: {e}")


if __name__ == "__main__":
    main()
