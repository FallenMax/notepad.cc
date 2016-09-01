export default function startServiceWorker() {
  if (location.protocol === 'https:' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('service-worker.js')
      .then(reg => {
        reg.onupdatefound = function() {
          const installingWorker = reg.installing
          installingWorker.onstatechange = function() {
            switch (installingWorker.state) {
              case 'installed':
                if (navigator.serviceWorker.controller) {
                  console.log('New or updated content is available.')
                } else {
                  console.log('Content is now available offline!')
                }
                break
              case 'redundant':
                console.error('The installing service worker became redundant.')
                break
            }
          }
        }
      })
      .catch(e => {
        console.error('Error during service worker registration:', e)
      })
  }
}
