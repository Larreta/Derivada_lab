const CACHE='derivada-lab-v6';
const FILES=['./','./index.html','./styles.css?v=6','./config.js?v=6','./retos.js?v=6','./game-core.js?v=6','./cloud.js?v=6','./app.js?v=6','./pro.js?v=6','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('derivada-lab-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 if(url.pathname.endsWith('/config.js')){event.respondWith(fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone())}return response}).catch(()=>caches.match(event.request)));return;}
 if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));
 else event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
