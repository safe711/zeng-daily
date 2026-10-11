const CACHE = 'daily-shell-v0.1.2-test.12';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./src/style.css','./src/app.js','./src/model.js','./src/storage.js','./src/hold.js','./src/ritual.js','./src/photos.js','./src/share.js','./src/reports.js','./src/subscription.js','./src/subscriptionview.js','./src/signature.js','./src/hosting.js','./src/integrations.js','./src/contractcrypto.js','./src/pushclient.js','./src/shoes.js','./src/shoecard.js','./src/shoeview.js','./src/notifications.js','./src/lanbackup.js','./src/updater.js','./src/version.js','./src/certificate.js','./nas-install.html','./assets/payment-qr.jpg','./src/rules.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(path=>new Request(path,{cache:'reload'}))))));
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
const pushKinds=['morning','noon','evening','gratitude','subscription'];
self.addEventListener('push',event=>{
  let kind='';try{const payload=event.data?.json();if(pushKinds.includes(payload?.kind))kind=payload.kind;}catch{}
  event.waitUntil(self.registration.showNotification('日课',{body:'有一项日程待查看，请打开日课。',icon:new URL('icon-192.png',self.registration.scope).href,tag:`daily-${kind||'reminder'}`,data:{kind}}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const kind=pushKinds.includes(event.notification.data?.kind)?event.notification.data.kind:'';
  const target=new URL(kind==='subscription'?'#subscription':kind?`#ritual/${kind}`:'./',self.registration.scope).href;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows)if(client.url.startsWith(self.registration.scope)){await client.navigate(target);await client.focus();return;}
    await self.clients.openWindow(target);
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='GET_BUILD')event.ports[0]?.postMessage({build:CACHE});
  if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
});
