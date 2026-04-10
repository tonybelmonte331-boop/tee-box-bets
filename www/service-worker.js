const CACHE_NAME = "tee-box-bets-v176"; // bump version anytime you change files

const FILES_TO_CACHE = [
"./",
"./index.html",
"./style.css",
"./app.js",

// Game engines
"./games/skins/engine.js",
"./games/vegas/engine.js",
"./games/nassau/engine.js",
"./games/wolf/engine.js",
"./games/baseball/engine.js",
"./games/bingo/engine.js",
"./games/dots/engine.js",
"./games/nine/engine.js",
"./games/sixes/engine.js",
"./games/battle/engine.js",

// Game UI
"./games/skins/ui.js",
"./games/vegas/ui.js",
"./games/nassau/ui.js",
"./games/wolf/ui.js",
"./games/baseball/ui.js",
"./games/bingo/ui.js",
"./games/dots/ui.js",
"./games/nine/ui.js",
"./games/sixes/ui.js",
"./games/battle/ui.js",

// Game Rules
"./games/skins/rules.js",
"./games/vegas/rules.js",
"./games/nassau/rules.js",
"./games/wolf/rules.js",
"./games/baseball/rules.js",
"./games/bingo/rules.js",
"./games/dots/rules.js",
"./games/nine/rules.js",
"./games/sixes/rules.js",
"./games/battle/rules.js",

// Shared
"./games/sidebets.js",
"./router/gameRouter.js",

"./manifest.json",
"./icons/icon-192.png",
"./icons/icon-512.png",
"./icons/splash.png"
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