const CACHE = 'wha-v2';
const FILES = [
  '.',
  'index.html',
  'academy-script.js',
  'academy-styles.css',
  'manifest.json'
];
const LOCAL_IMGS = [
  'A0','A1','A2','A3','barista','beans','cafe','cherry','coldbrew',
  'cupping','espresso','journey','latte','map','roast','team','v60','water'
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
