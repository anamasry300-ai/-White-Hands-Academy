"""
Convert SVG files in assets/images to PNG and WebP derivatives at multiple widths.
Produces files under assets/images/derivatives/ with names like: photo-hero-320.png, photo-hero-320.webp
Requires: cairosvg, pillow
"""
import os
from pathlib import Path
from cairosvg import svg2png
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / 'assets' / 'images'
OUT_DIR = SRC_DIR / 'derivatives'
OUT_DIR.mkdir(parents=True, exist_ok=True)
WIDTHS = [320, 640, 1280]

svg_files = sorted([p for p in SRC_DIR.glob('*.min.svg')])
if not svg_files:
    print('No .min.svg files found in', SRC_DIR)
    exit(0)

for svg in svg_files:
    name = svg.stem.replace('.min','') if svg.stem.endswith('.min') else svg.stem
    for w in WIDTHS:
        out_png = OUT_DIR / f"{name}-{w}.png"
        out_webp = OUT_DIR / f"{name}-{w}.webp"
        try:
            svg2png(url=str(svg), write_to=str(out_png), output_width=w)
            img = Image.open(out_png)
            img.save(out_webp, 'WEBP', quality=80, method=6)
            print(f'Wrote {out_png.name} and {out_webp.name}')
        except Exception as e:
            print('Error processing', svg.name, '->', e)

print('Done')
