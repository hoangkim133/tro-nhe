const CACHE_NAME = 'nhatro-v8';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/store.js',
    './js/sync.js',
    './js/components/navbar.js',
    './js/components/invoice.js',
    './js/views/home.js',
    './js/views/house.js',
    './js/views/room.js',
    './js/views/billing.js',
    './js/views/settings.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    // Activate new SW immediately
    self.skipWaiting();
});

// Activate - clean old caches + take control immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    // Take over all clients immediately
    self.clients.claim();
});

// Fetch - Network first for HTML/JS/CSS, cache first for images/fonts
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and Google Apps Script calls
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('script.google.com')) return;

    const url = new URL(event.request.url);
    const isAppFile = url.origin === self.location.origin;
    const isStaticAsset = url.pathname.match(/\.(png|jpg|svg|woff2?)$/);

    if (!isAppFile) {
        // External resources (fonts etc): network first, fallback cache
        event.respondWith(
            fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    if (isStaticAsset) {
        // Icons/images: cache first (rarely change)
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // HTML/JS/CSS: Network first, fallback cache (always get latest)
    event.respondWith(
        fetch(event.request).then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return response;
        }).catch(() => caches.match(event.request))
    );
});
