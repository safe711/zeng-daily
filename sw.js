const CACHE = 'daily-shell-v0.1.2-test.2';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./src/style.css','./src/app.js','./src/model.js','./src/storage.js','./src/hold.js','./src/ritual.js','./src/photos.js','./src/share.js','./src/reports.js','./src/subscription.js','./src/subscriptionview.js','./src/signature.js','./src/hosting.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('daily-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(new URL(event.request.url).pathname.includes('/api/'))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request);
    if(cached)return cached;
    try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return cache.match('./index.html');throw error;}
  }));
});
