const CACHE="valdivienne-app-v1";
const CORE=["./","./index.html","./app.css","./app.js","./manifest.webmanifest","./data/data.json","./data/map.kml","./icons/icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
   const copy=r.clone();caches.open(CACHE).then(x=>x.put(e.request,copy));return r;
 }).catch(()=>caches.match("./index.html"))));
});