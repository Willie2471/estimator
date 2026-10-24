// Caches the app shell so the survey tool opens with no signal.
// Only this app's own files are cached; every other request (Apps Script, the estimator, etc.) passes straight through.
// Bump CACHE when you deploy a new version so crews pick it up.
const CACHE = 'wsfs-v1';
const FILES = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const SCOPE = new URL(self.registration.scope);
const MINE = new Set(['', ...FILES].map(f => new URL(f, SCOPE).pathname));
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', ...FILES])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !MINE.has(u.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
