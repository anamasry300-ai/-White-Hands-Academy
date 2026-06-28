# White Hands Academy — Session Memory

## الهدف
إنشاء أكبر أكاديمية لتعليم القهوة في العالم بستايل مجلة علمية (National Geographic): صور full-bleed، نص متراكب فوق الصور، فخامة سينمائية.

## الإنجازات

### ✅ Completed
- **كل `svg()` و `bgSVG()` استبدلت بـ `photo()`** — إجمالي 121+ استبدال
- **39 صورة محلية** في `images/` (A0~A3, barista, barista_work, beans, beans_tree, blossom, brew, cafe, cherry, chemex, coffee_bags, coffee_shop, coldbrew, cup, cupping, espresso, farm, filter, fresh_roast, grinder, harvest, journey, lab, latte, map, moka, plantation, processing, roast, roastery, sustainability, team, v60, water + aerial, aroma)
- **Magazine CSS**: `.img-c` → full-bleed hero 340px (220px mobile) مع gradient ونص أبيض متراكب
- **كلاسات مجلة**: `.mag-card`, `.mag-quote`, `.mag-grid-2`, `.mag-table`
- **دوال JS**: `magHero()`, `magSection()`, `magQuote()`, `magGrid2()` — جاهزين للاستخدام في محتوى الدروس
- PWA مع service worker v2
- تسجيل دخول offline بـ localStorage
- AGENTS.md

### Committed
```
d187142 — 18 new magazine photos + magHero/magSection/magQuote/magGrid2 helpers + AGENTS.md
3b71bb6 — Magazine layout: replace all bgSVG() with photo()
0d6456e — Replace all SVG in lesson content with photos
```

### ✅ Pushed to GitHub Pages

## 🔥 Pending
- [ ] تأكيد أن الموقع شغال (فتح الرابط بعد الرفع)
- [ ] إصلاح مشكلة navigation بين الدروس (modules مش مفتوحة)
- [ ] تحسين تطابق الصور مع محتوى الدروس
- [ ] تظبيط CSS متقدم: parallax, typography, transitions
- [ ] Firebase setup (محتاج user يعمل مشروع)

## Important Notes
- Site: https://anamasry300-ai.github.io/-White-Hands-Academy/
- Repo: https://github.com/anamasry300-ai/-White-Hands-Academy.git
- Academy path: `C:\Users\Acer\OneDrive\Desktop\Academy`
- Remote uses token auth (ghp_...)
- Push method: direct push (not force push anymore)
