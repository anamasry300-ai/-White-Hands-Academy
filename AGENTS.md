# White Hands Academy — Session Memory

## Project Goal
Build the world's largest coffee education platform with a National Geographic magazine style: full-bleed images, text-overlaid photos, cinematic luxury.

## Completed
- **Refactored academy-script.js**: removed dead SVG code (SVG object, svg(), bgSVG(), 40 lines of SVG data — saved ~40KB), removed forced 2s loading delay (requestAnimationFrame instead), consolidated init flow via `initUI()`, reduced timeouts (Firebase 500→200ms, AI.init 1200→400ms), fixed file encoding corruption (restored from git)
- **49 local JPG images** in `images/` — all properly named and tracked
- **49 local keys** in `LOCAL_IMGS` Set and `sw.js` cache list
- **`coffee_timeline` image** added (Coffee's Journey Through Time timeline)
- **Magazine CSS**: `.img-c` full-bleed hero 400px (220px mobile) with gradient overlay and white text
- **Magazine classes**: `.mag-card`, `.mag-quote`, `.mag-grid-2`, `.mag-table`
- **JS helpers**: `magHero()`, `magSection()`, `magQuote()`, `magGrid2()`
- PWA with service worker v2
- Offline login via localStorage
- AGENTS.md session memory

## Pending
- [ ] Verify site works after push (open live URL)
- [ ] Firebase setup (requires user to create Firebase project and paste config)

## Important Notes
- Site: https://anamasry300-ai.github.io/-White-Hands-Academy/
- Repo: https://github.com/anamasry300-ai/-White-Hands-Academy.git
- Academy path: `C:\Users\Acer\OneDrive\Desktop\Academy`
- Push: `git push` via HTTPS token auth
- Firebase non-functional until user creates project and pastes config
- **Encoding**: Never use PowerShell `Set-Content` for JS — corrupts UTF-8 Arabic. Use `edit` tool or Node.js `fs.writeFileSync` with `'utf8'` instead.
- Original clean file at commit `a5e40ba` — `git checkout a5e40ba -- academy-script.js` restores it if encoding breaks.
- `academy-script.js` now ~2522 lines (down from ~2560 after SVG code removal).
