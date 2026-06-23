"""
Generate an updated CSV for downloaded images including Wikimedia attribution links.
"""
import csv
from pathlib import Path
import requests
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
RASTER_DIR = ROOT / 'assets' / 'images' / 'raster'
OUT_CSV = ROOT / 'assets' / 'journey-image-metadata.updated.csv'

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
session.headers.update({'User-Agent': 'EsenzaAcademy/1.0 (contact: dev@esenza.example)'} )

rows = []
for fname, query in TO_FETCH.items():
    params = {
        'action': 'query',
        'format': 'json',
        'list': 'search',
        'srsearch': query,
        'srnamespace': 6,
        'srlimit': 1
    }
    r = session.get(WIKI_API, params=params, timeout=20)
    r.raise_for_status()
    results = r.json().get('query', {}).get('search', [])
    title = None
    if results:
        title = results[0].get('title')
    attribution = ''
    if title:
        # build file page url
        attribution = 'https://commons.wikimedia.org/wiki/' + quote(title.replace(' ', '_'))
    raster_path = f'assets/images/raster/{fname}'
    title_text = title or ''
    caption = ''
    detail = f'Auto-downloaded for {query} from Wikimedia Commons. Source page: {attribution}'
    rows.append([fname, raster_path, title_text, caption, detail, attribution])

# write csv
with OUT_CSV.open('w', newline='', encoding='utf-8') as fh:
    writer = csv.writer(fh)
    writer.writerow(['filename','raster_path','title','caption','detail','attribution'])
    writer.writerows(rows)

print('Wrote', OUT_CSV)
