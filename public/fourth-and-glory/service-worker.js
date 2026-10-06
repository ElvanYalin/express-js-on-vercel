// Network-first: çevrimiçiyken en yeni sürüm, çevrimdışıyken önbellek.
const CACHE="fourth-glory-3d-v0.8.0";
const FILES=["./","./index.html","./css/style.css","./js/data.js","./js/stage-look.js","./js/difficulty.js","./js/state.js","./js/career.js","./js/ui-state.js","./js/career-ui.js","./js/stadium.js","./js/audio.js","./js/athlete.js","./js/gl3d.js","./js/three.js","./js/athlete-model.js","./js/athlete-game.js","./js/gl3d-enhanced.js","./js/engine.js","./js/preview.js","./js/game.js","./js/map.js","./js/ui.js","./manifest.webmanifest"];
self.addEventListener("install",e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))); });
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith("fourth-glory-")&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{ if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)); return r; }).catch(()=>caches.match(e.request))); });
