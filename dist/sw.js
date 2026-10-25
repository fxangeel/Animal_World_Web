// Service worker: la tienda abre sin conexión. Estáticos con caché primero, catálogo y páginas con red primero. La API nunca se guarda.
const VERSION = 'aw-v1';
const SHELL = ['./', 'styles.css', 'mobile.css', 'theme.css', 'theme-mobile.css', 'enhance.css', 'js/app.js', 'js/config.js', 'js/api.js', 'js/store.js', 'js/ui.js', 'js/shop.js', 'js/content.js', 'js/checkout.js', 'js/extras.js', 'js/account.js', 'js/motion.js', 'js/enhance.js', 'data/catalog.json', 'assets/paw.svg', 'assets/hero-dog.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  const assetLike = url.pathname.includes('/assets/');
  e.respondWith(assetLike ? cacheFirst(req) : networkFirst(req));
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
  return res;
}
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || (req.mode === 'navigate' ? caches.match('./') : Response.error());
  }
}
