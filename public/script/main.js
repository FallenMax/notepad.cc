var io = window.io
var id = window.__id
var socket = io()

start()

function start() {
  startSyncNote()
  startMonitorNetwork()
  startServiceWorker()

  socket.emit('enter', { id: id })
}

function startMonitorNetwork() {
  var events = {
    'connect': '',
    'reconnect': '',
    'reconnect_attempt': 'Connection lost',
    'connect_error': 'Connection lost',
    'connect_timeout': 'Connection lost',
    'reconnect_error': 'Connection lost',
    'reconnect_failed': 'Connection lost',
  }
  var status = document.getElementById('network-status')

  Object.keys(events).forEach(function(evt) {
    return socket.on(evt, function() {
      status.textContent = events[evt]
    })
  })
}

function startSyncNote() {
  var editor = document.getElementById('editor')
  var status = document.getElementById('save-status')
  var timer

  editor.addEventListener('input', throttle(function(e) {
    save(e.target.value)
  }, 500))

  socket.on('updated note', function(update) {
    editor.value = update.note
  })

  function save(note) {
    clearTimeout(timer)
    status.classList.add('show')
    socket.emit('save', { id: id, note: note }, function(rsp) {
      if (rsp && rsp.code === 'success') {
        setTimeout(function() {
          return status.classList.remove('show')
        }, 1000)
      }
    })
  }

  function throttle(fn, delay) {
    var timer
    return function throttled(arg) {
      clearTimeout(timer)
      timer = setTimeout(function() {
        fn(arg)
      }, delay)
    }
  }
}


function startServiceWorker() {
  if (location.protocol === 'https:' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./serviceWorker.js')
      .then(function(reg) {
        console.info('[sw] register')
      })
      .catch(function(err) {
        console.error('[sw] Failed to register service worker. ', err)
      })
  }
}
