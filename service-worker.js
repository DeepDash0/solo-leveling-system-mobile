/* V6: only app shell, never the old synthetic audio. Audio uploads live in browser IndexedDB. */
const CACHE='the-system-mobile-v6';
const CORE=['./','./index.html','./manifest.webmanifest','./system-icon.svg',
'./css/base.css?v=5','./css/fx.css?v=5','./css/sound.css?v=5','./css/experience.css?v=5',
'./css/authentic-audio.css?v=6','./js/rules.js?v=5','./js/game.js?v=5',
'./js/authentic-audio.js?v=6','./js/sfx.js?v=6','./js/experience.js?v=5','./js/particles.js?v=5'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('the-system-mobile-')&&k!==CACHE).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(response=>{
   if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(req,clone))}
   return response;
  }).catch(async()=>await caches.match(req)||await caches.match('./index.html')));
 }else{
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
   if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(req,clone))}
   return response;
  })));
 }
});