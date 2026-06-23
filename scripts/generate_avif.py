"""
Generate AVIF derivatives from raster originals in assets/images/raster/
Requires: pillow-avif-plugin (already installed)
Produces files in assets/images/derivatives like photo-forest-320.avif
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RASTER = ROOT / 'assets' / 'images' / 'raster'
DERIV = ROOT / 'assets' / 'images' / 'derivatives'
DERIV.mkdir(parents=True, exist_ok=True)
WIDTHS = [320, 640, 1280]

raster_files = sorted([p for p in RASTER.iterdir() if p.suffix.lower() in ('.jpg', '.jpeg', '.png')])
if not raster_files:
    print('No raster files found in', RASTER)
    exit(0)

for p in raster_files:
    name = p.stem
    try:
        img = Image.open(p).convert('RGBA')
    except Exception as e:
        print('Failed to open', p.name, e)
        continue
    for w in WIDTHS:
        ratio = w / float(img.width)
        h = int(img.height * ratio)
        resized = img.resize((w, h), Image.LANCZOS)
        out = DERIV / f"{name}-{w}.avif"
        try:
            resized.save(out, format='AVIF', quality=80, speed=0)
            print('Wrote', out.name)
        except Exception as e:
            print('AVIF save failed for', out.name, e)

print('AVIF generation done')
