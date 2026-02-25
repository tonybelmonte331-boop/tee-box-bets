const CACHE_NAME = "tee-box-bets-v60"; // bump version anytime you change files

const FILES_TO_CACHE = [
"./",
"./index.html",
"./style.css",
"./app.js",
"./games/skins.js",
"./games/vegas.js",
"./games/nassau.js",
"./games/sidebets.js",
"./manifest.json"
];

// INSTALL — cache core files
self.addEventListener("install", event => {
self.skipWaiting();
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
);
});

// ACTIVATE — clear old caches + take control immediately
self.addEventListener("activate", event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.map(k => caches.delete(k))
)
)
);
self.clients.claim();
});

// FETCH — network first, cache update in background
self.addEventListener("fetch", event => {
event.respondWith(
fetch(event.request)
.then(res => {
const copy = res.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
return res;
})
.catch(() => caches.match(event.request))
);
});