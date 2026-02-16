const CACHE_NAME = "tee-box-bets-v1";
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

// Install — cache everything
self.addEventListener("install", event => {
self.skipWaiting();
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
);
});

// Activate — delete old caches
self.addEventListener("activate", event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
)
)
);
self.clients.claim();
});

// Fetch — always try network first, fallback to cache
self.addEventListener("fetch", event => {
event.respondWith(
fetch(event.request)
.then(response => {
const copy = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
return response;
})
.catch(() => caches.match(event.request))
);
});