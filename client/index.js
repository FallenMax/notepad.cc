const io = window.io
const id = /\/([^\/]+)$/.exec(location.pathname)[1]
const socket = io()

import updatePageURI from './updatePageURI'
import startSyncNote from './startSyncNote'
import startServiceWorker from './startServiceWorker'
import startMonitorNetwork from './startMonitorNetwork'

start()

function start() {
  updatePageURI({ href: location.href })
  startSyncNote({ id, socket })
  startMonitorNetwork({ socket })
  startServiceWorker({ socket })
}
