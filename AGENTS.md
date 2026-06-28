# White Hands Academy — Session Memory

## Project Goal
Build the world's largest coffee education platform with a National Geographic magazine style: full-bleed images, text-overlaid photos, cinematic luxury.

## Completed
- **Refactored academy-script.js**: removed dead SVG code (~130 lines of inline SVGs + `svg()`/`bgSVG()` functions), removed forced 2s loading delay, consolidated init flow (no arbitrary timeouts), created `initUI()` helper
- **49 local JPG images** in `images/` — all properly named and tracked
- **49 local keys** in `LOCAL_IMGS` Set and `sw.js` cache list
- **`coffee_timeline` image** added (Coffee's Journey Through Time timeline)
- **Magazine CSS**: `.img-c` full-bleed hero 340px (220px mobile) with gradient overlay and white text
- **Magazine classes**: `.mag-card`, `.mag-quote`, `.mag-grid-2`, `.mag-table`
- **JS helpers**: `magHero()`, `magSection()`, `magQuote()`, `magGrid2()`
- PWA with service worker v2
- Offline login via localStorage
- AGENTS.md session memory

## Pending
- [ ] Verify site works after push (open live URL)
- [ ] Fix navigation between lessons (modules not opening issue)
- [ ] Improve image-to-lesson-content matching
- [ ] Advanced CSS: parallax, typography, transitions
- [ ] Firebase setup (requires user to create Firebase project and paste config)

## Important Notes
- Site: https://anamasry300-ai.github.io/-White-Hands-Academy/
- Repo: https://github.com/anamasry300-ai/-White-Hands-Academy.git
- Academy path: `C:\Users\Acer\OneDrive\Desktop\Academy`
- Push: `git push` via HTTPS token auth
- Images NOT local yet (serve from Unsplash): B1, B2, B3, C1, C2, C3, j0–j10 (12 keys)
- Firebase non-functional until user creates project and pastes config
