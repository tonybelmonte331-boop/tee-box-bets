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

"./manifest.json",

"./icons/icon-192.png",
"./icons/icon-512.png"
];

/* ---------- INSTALL ---------- */

self.addEventListener("install", event => {
self.skipWaiting();

event.waitUntil(
caches.open(CACHE_NAME).then(cache => {
return cache.addAll(FILES_TO_CACHE);
})
);
});

/* ---------- ACTIVATE ---------- */

self.addEventListener("activate", event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys.map(key => {
if (key !== CACHE_NAME) return caches.delete(key);
})
)
)
);

self.clients.claim();
});

/* ---------- FETCH ---------- */

self.addEventListener("fetch", event => {
event.respondWith(
caches.match(event.request).then(cached => {
return cached || fetch(event.request);
})
);
});
