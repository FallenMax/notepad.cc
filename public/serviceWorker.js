const CACHE_NAME = 'v5'
const urlsToCache = [
  '/style/main.css',
  '/script/main.js',
  '/image/bg.png'
]

self.addEventListener('install', function(event) {
  console.info('[sw] install')
  console.info('[sw] new cache: ', CACHE_NAME)
  const cacheResources = caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
  event.waitUntil(cacheResources)
})

self.addEventListener('activate', function(event) {
  console.info('[sw] activate')
  const obseleteOldCache = caches.keys()
    .then(cacheNames =>
      Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.info('[sw] obselete cache: ', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    )
  event.waitUntil(obseleteOldCache)
})

self.addEventListener('fetch', function(event) {
  const cachedResponse = caches.match(event.request)
    .then(function(response) {
      if (response) {
        console.info('[sw] cache hit:', event.request.url)
        return response
      } else {
        return fetch(event.request)
      }
    })
  event.respondWith(cachedResponse)
})
