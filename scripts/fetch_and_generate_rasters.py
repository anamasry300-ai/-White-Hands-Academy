"""
Fetch images from Wikimedia Commons for given keywords and generate WebP derivatives.
Saves originals to assets/images/raster/ and derivatives to assets/images/derivatives/
Requires: requests, pillow
"""
import os
from pathlib import Path
import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RASTER_DIR = ROOT / 'assets' / 'images' / 'raster'
DERIV_DIR = ROOT / 'assets' / 'images' / 'derivatives'
RASTER_DIR.mkdir(parents=True, exist_ok=True)
DERIV_DIR.mkdir(parents=True, exist_ok=True)
WIDTHS = [320, 640, 1280]

# Map target base filenames to search keywords
TO_FETCH = {
    'photo-forest.jpg': 'coffee forest',
    'photo-cherries.jpg': 'coffee cherries',
    'photo-farmer.jpg': 'coffee farmer',
    'photo-classroom.jpg': 'coffee classroom',
    'photo-cup.jpg': 'coffee cup',
    'photo-barista.jpg': 'barista',
    'photo-pour.jpg': 'coffee pour over',
    'photo-roast.jpg': 'coffee roasting',
    'photo-latte.jpg': 'latte art',
    'photo-recipe.jpg': 'coffee preparation'
}

WIKI_API = 'https://commons.wikimedia.org/w/api.php'

session = requests.Session()
# Wikimedia requires requests to include a descriptive User-Agent
session.headers.update({'User-Agent': 'EsenzaAcademy/1.0 (contact: dev@esenza.example)'} )

for fname, query in TO_FETCH.items():
    print('Searching for', query)
    params = {
        'action': 'query',
        'format': 'json',
        'list': 'search',
        'srsearch': query,
        'srnamespace': 6,
        'srlimit': 5
    }
    r = session.get(WIKI_API, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    results = data.get('query', {}).get('search', [])
    image_url = None
    for res in results:
        title = res.get('title')
        # fetch image info
        info_params = {
            'action': 'query',
            'format': 'json',
            'prop': 'imageinfo',
            'titles': title,
            'iiprop': 'url|extmetadata',
            'iiurlwidth': 1600
        }
        ri = session.get(WIKI_API, params=info_params, timeout=20)
        ri.raise_for_status()
        j = ri.json()
        pages = j.get('query', {}).get('pages', {})
        for pid, page in pages.items():
            iinfo = page.get('imageinfo')
            if iinfo:
                url = iinfo[0].get('thumburl') or iinfo[0].get('url')
                if url and url.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_url = url
                    break
        if image_url:
            break
    if not image_url:
        print('No image found for', query)
        continue

    out_path = RASTER_DIR / fname
    print('Downloading', image_url, '->', out_path.name)
    resp = session.get(image_url, timeout=30)
    resp.raise_for_status()
    out_path.write_bytes(resp.content)

    # generate derivatives
    try:
        img = Image.open(out_path)
        for w in WIDTHS:
            ratio = w / float(img.width)
            h = int(img.height * ratio)
            resized = img.resize((w, h), Image.LANCZOS)
            webp_path = DERIV_DIR / f"{Path(fname).stem}-{w}.webp"
            resized.save(webp_path, 'WEBP', quality=80, method=6)
            print('Wrote', webp_path.name)
    except Exception as e:
        print('Error generating derivatives for', out_path.name, e)

print('All done')
