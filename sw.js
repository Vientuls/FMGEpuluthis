// Offline cache. Bump VERSION when you change the app so phones pick up the new files.
const VERSION = 'v3';
const SHELL = ['./', 'index.html', 'config.js', 'css/app.css', 'manifest.webmanifest', 'icons/icon-192.png',
  'js/main.js', 'js/ui.js', 'js/router.js', 'js/themes.js', 'js/store.js', 'js/data.js', 'js/game.js', 'js/sync.js', 'js/state.js',
  'js/views/home.js', 'js/views/test.js', 'js/views/result.js', 'js/views/add.js', 'js/views/who.js', 'js/views/settings.js', 'js/views/cards.js', 'js/srs.js', 'data/meta.json'];
const CORE = 'core-' + VERSION, BULK = 'bulk-v1';          // BULK (questions + images) survives app updates
self.addEventListener('install', e => { e.waitUntil(caches.open(CORE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('core-') && k != CORE).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method != 'GET' || u.origin != location.origin) return;       // Supabase etc. go straight to network
  const bulk = /\/(img|data\/sets)\//.test(u.pathname);
  if (bulk) {                                                           // cache-first: these files never change
    e.respondWith(caches.open(BULK).then(c => c.match(r).then(m => m || fetch(r).then(n => { if (n.ok) c.put(r, n.clone()); return n }))));
  } else {                                                              // app files: show cached copy instantly, refresh in background
    e.respondWith(caches.open(CORE).then(c => c.match(r, { ignoreSearch: true }).then(m => {
      const net = fetch(r).then(n => { if (n.ok) c.put(r, n.clone()); return n }).catch(() => m || (r.mode == 'navigate' ? c.match('index.html') : undefined));
      return m || net;
    })));
  }
});
