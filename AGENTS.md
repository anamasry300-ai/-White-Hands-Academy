# White Hands Academy — Session Memory

## الهدف
إنشاء أكبر أكاديمية لتعليم القهوة في العالم بستايل مجلة علمية (National Geographic): صور full-bleed، نص متراكب فوق الصور، فخامة سينمائية.

## الإنجازات


### ✅ Completed

### المحتوى والصور
- كل `svg()` و `bgSVG()` استبدلت بـ `photo()` — 121 استبدال
- 21 صورة محلية في `images/` + 18 صورة جديدة (إجمالي 39)
- 18 صورة جديدة (blossom, grinder, brew, filter, moka, aroma, chemex, processing, aerial, sustainability, barista_work, coffee_bags, coffee_shop, plantation, fresh_roast, lab, harvest, cup)

### تنسيق المجلة (Magazine CSS)
- `.img-c` حوّل لماجازين هيرو: full-bleed عرض كامل، ارتفاع 340px (220px موبايل)، نص أبيض فوق الصورة مع gradient
- كلاسيكس إضافية: `.mag-card` بطاقات، `.mag-quote` اقتباسات، `.mag-grid-2` شبكة صور، `.mag-table` جدول أكاديمي

### التقنيات
- PWA مع service worker (v2) يخزّن الصور محلياً
- تسجيل دخول offline بـ localStorage
- Glass morphism، 3D tilt، magnetic buttons
- Google Fonts عبر `<link>` في HTML (مش CSS @import)

### ✅ Committed & Pushed
`3b71bb6` — Magazine layout + 3 new photos
`0d6456e` — Replace all SVG in lesson content with photos
`9a56d5d` — Replace SVGs in module cards

## 🔥 Pending (High Priority)
- [ ] إضافة 18 صورة جديدة لـ PHOTOS + LOCAL_IMGS + sw.js
- [ ] إنشاء دوال magazine layout في JS: `magSection()`, `magHero()`
- [ ] تظبيط CSS الماجازين المتقدم (parallax, typography, transitions)
- [ ] إصلاح مشكلة navigation بين الدروس (modules مش مفتوحة)
- [ ] تحسين تطابق الصور مع المحتوى (كل صورة تعبّر عن موضوع الدرس)
- [ ] رفع على GitHub Pages واختبار الموقع
- [ ] Firebase setup (محتاج من user يعمل مشروع)

## Notes
- Site: https://anamasry300-ai.github.io/-White-Hands-Academy/
- Repo: https://github.com/anamasry300-ai/-White-Hands-Academy.git
- Academy path: `C:\Users\Acer\OneDrive\Desktop\Academy`
- Remote has token in URL (ghp_...)
- Push كان بيتعمل force push بسبب timeout
