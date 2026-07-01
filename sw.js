const CACHE = 'wha-v5';
const FILES = [
  '.',
  'index.html',
  'academy-script.js',
  'academy-styles.css',
  'manifest.json'
];
const LOCAL_IMGS = [
  'A0','A1','A2','A3','aerial','affogato','aroma','B1','B2','B3','bezzera_patent','barista','barista_work','beans','beans_tree','blossom','brew','C1','C2','C3','cafe','cappuccino','chemex','cherry','coffee_bags','coffee_map','coffee_shop','coffee_story','coffee_timeline','coldbrew','comparison','cortado','cup','cupping','espresso','espresso_gen','espresso_mod','espresso_success','ethiopian','ethiopian_ceremony','farm','filter','gaggia_lever','flatwhite','fresh_roast','grinder','harvest','j0','j1','j10','j2','j3','j4','j5','j6','j7','j8','j9','journey','kaldy','kaldy_monk','lab','latte','macchiato','map','mecca_cafe','mocha_drink','moka','ottoman_cafe','plantation','processing','processing_methods','roast','roastery','sustainability','team','turkish','turkish_cup','turkish_delight','v60','water'
];
const ALL_ASSETS = [...FILES, ...LOCAL_IMGS.map(k => 'images/'+k+'.jpg')];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return c.addAll(FILES).catch(()=>{});
    }).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname === 'images.unsplash.com' || url.hostname.includes('googleapis') || url.hostname.includes('gstatic.com')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request)))
    );
  }
});
