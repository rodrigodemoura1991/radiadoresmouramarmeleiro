const CACHE_NAME = 'radiadores-moura-v41-popup-edit';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css?v=stable2',
  './css/payments.css?v=payments1',
  './css/layout-consolidated.css?v=layout1',
  './app.js?v=v30-popup',
  './auth-fix.js?v=auth3',
  './stability.js?v=stable3',
  './freight.js?v=freight8',
  './freight-ui.js?v=freight8',
  './tenant-fix.js?v=tenant3',
  './supabase-config.js?v=stable5',
  './js/launch-reference-test.js?v=v30-popup',
  './js/servicos-popup-edicao.js?v=v30-popup',
  './assets/logo-radiadores-moura.svg',
  './manifest.webmanifest',
  './8857A320-4E57-4A00-933D-C76434BC6953.png'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => { const request=event.request, url=new URL(request.url); if(request.method!=='GET'||url.origin!==self.location.origin)return; event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html')))); });
