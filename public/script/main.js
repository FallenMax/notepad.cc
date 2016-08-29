var io = window.io
var id = window.__id
var socket = io()

start()

function start() {
  updatePageURI()
  startSyncNote()
  startMonitorNetwork()
  startServiceWorker()
}

function updatePageURI() {
  var link = document.getElementById('this-page')
  link.href = link.textContent = location.href
}

function startMonitorNetwork() {
  var events = {
    'connect': '',
    'reconnect': '',
    'reconnect_attempt': 'connection lost',
    'connect_error': 'connection lost',
    'connect_timeout': 'connection lost',
    'reconnect_error': 'connection lost',
    'reconnect_failed': 'connection lost',
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
  var saveThrottled = throttle(function(e) {
    save(e.target.value)
  }, 500)

  // listen on update from others
  socket.emit('subscribe', { id: id }) // tell server we are to receive update for ${id}
  socket.on('updated note', update)

  // save updated note to server
  editor.addEventListener('input', saveThrottled)
  editor.addEventListener('compositionend', saveThrottled)

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

  function update(msg) {
    var nextCaretPos = caretPosAfterUpdate(editor.value, msg.note, editor.selectionStart)
    editor.value = msg.note
    editor.setSelectionRange(nextCaretPos, nextCaretPos)

    function caretPosAfterUpdate(prevStr, nextStr, prevCaretPos) {
      var prevLen = prevStr.length
      var nextLen = nextStr.length
      var nextCaretPos

      var commonStart = commonLenFromStart(prevStr, nextStr)
      var commonEnd = commonLenFromStart(reverse(prevStr), reverse(nextStr))

      if (commonStart === Math.max(prevLen, nextLen)) {
        nextCaretPos = prevCaretPos
      } else {
        if (prevCaretPos < commonStart) {
          nextCaretPos = prevCaretPos
        } else if (prevCaretPos <= prevLen - commonEnd) {
          nextCaretPos = nextLen - commonEnd
        } else {
          nextCaretPos = nextLen - (prevLen - prevCaretPos)
        }
      }
      return nextCaretPos
    }

    function commonLenFromStart(a, b) {
      var i = 0
      var minLen = Math.min(a.length, b.length)
      while (i < minLen && a[i] === b[i]) {
        i++
      }
      return i
    }

    function reverse(str) {
      return str.split('').reverse().join('')
    }
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
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(function(reg) {
      reg.onupdatefound = function() {
        var installingWorker = reg.installing
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
    }).catch(function(e) {
      console.error('Error during service worker registration:', e)
    })
  }
}
