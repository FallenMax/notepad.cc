// Docs:
// - https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API/Using_Service_Workers
// - https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
// Inspect:
// - chrome://serviceworker-internals/

const CACHE_NAME = 'v1'

function isAssets(path) {
  return path.startsWith('/assets/')
}
function isManifest(path) {
  return path.startsWith('/assets/manifest.webmanifest')
}
function isSocketIO(path) {
  return path.startsWith('/socket.io')
}
function isPage(path) {
  return !isAssets(path) && !isSocketIO(path)
}

//-------------- Utils --------------

const log = console.log

async function staleWhileRevalidate(request, revalidate = false) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const url = typeof request === 'string' ? request : request.url

    let resp = await cache.match(url)
    if (!resp) {
      log('cache miss:', url)
      resp = await fetch(request)
      if (resp.ok) {
        void cache.put(url, resp.clone())
      }
    } else {
      log('cache hit:', url)
      if (revalidate) {
        const oldText = await resp.clone().text()
        void (async () => {
          log('cache revalidate:', url)
          const newResp = await fetch(request)
          if (newResp.ok) {
            // Do not wait
            void cache.put(url, newResp.clone()) // clone() is needed as response stream can only be read once
          }
        })()
      }
    }

    return resp
  } catch (e) {
    return fetch(request)
  }
}

self.addEventListener('install', (event) => {
  log('installing (skip waiting)')
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  log('activating')
  event.waitUntil(
    self.clients.claim().then(() => {
      log('force activated')
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = typeof request === 'string' ? request : request.url

  if (request.method == 'GET' && url.startsWith(location.origin)) {
    const path = new URL(url).pathname
    if (isPage(path)) {
      // For our SPA app, index.html content is same for every route
      event.respondWith(staleWhileRevalidate(location.origin + '/_', true)) // add a `/_` to avoid redirect
    } else if (isAssets(path)) {
      const revalidate = isManifest(path)
      event.respondWith(staleWhileRevalidate(request, revalidate))
    }
  }
})
