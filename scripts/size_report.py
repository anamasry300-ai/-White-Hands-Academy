from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / 'assets' / 'images'
RASTER = IMG_DIR / 'raster'
DERIV = IMG_DIR / 'derivatives'

def human(n):
    for unit in ['B','KB','MB','GB']:
        if n<1024:
            return f"{n:.1f}{unit}"
        n/=1024
    return f"{n:.1f}TB"

report = []
report.append('Image size report')
report.append('---')

# original svgs
svgs = sorted(IMG_DIR.glob('*.svg'))
if svgs:
    report.append('SVG originals:')
    for p in svgs:
        report.append(f"{p.name}: {human(p.stat().st_size)}")

# raster
if RASTER.exists():
    report.append('')
    report.append('Raster originals:')
    for p in sorted(RASTER.iterdir()):
        if p.is_file():
            report.append(f"{p.name}: {human(p.stat().st_size)}")

# derivatives
if DERIV.exists():
    report.append('')
    report.append('Derivatives (WebP):')
    for p in sorted(DERIV.iterdir()):
        if p.is_file():
            report.append(f"{p.name}: {human(p.stat().st_size)}")

out = ROOT / 'scripts' / 'size-report.txt'
out.write_text('\n'.join(report), encoding='utf-8')
print('Wrote', out)
