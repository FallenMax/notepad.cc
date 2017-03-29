const io = window.io
const id = /\/([^\/]+)$/.exec(location.pathname)[1]
const socket = io()

const updatePageURI = require('./updatePageURI')
const startSyncNote = require('./startSyncNote')
const startMonitorNetwork = require('./startMonitorNetwork')

function start() {
  updatePageURI({ href: location.href })
  startSyncNote({ id, socket })
  startMonitorNetwork({ socket })
}

start()
