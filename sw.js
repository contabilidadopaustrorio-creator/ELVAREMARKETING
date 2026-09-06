const CACHE = 'elvare-v2';
const ASSETS = [
  './tablero_gastos.html',
  './TABLERO.xlsx',
  './Logo 2.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

// El tablero y los datos se piden siempre a la red primero: así una versión
// nueva del HTML o del Excel se ve al instante. El resto (logo, librerías)
// se sirve desde caché, que no cambia.
const SIEMPRE_FRESCO = ['tablero_gastos.html', 'TABLERO.xlsx'];
const esFresco = url => SIEMPRE_FRESCO.some(n => url.includes(n));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (e.request.mode === 'navigate' || esFresco(url)) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
