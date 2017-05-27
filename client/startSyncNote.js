const { createPatch, applyPatch, merge3 } = require('../server/lib/diff3')
const hashString = require('string-hash')
const Stream = require('./stream.js')

let _log = console.log
console.log = function(name, stream) {
  if (stream && stream.subscribe) {
    stream.subscribe(val =>
      _log.call(
        console,
        `%c${name.trim()}:`,
        'color:blue;font-weight:bold',
        val
      )
    )
  } else if (arguments.length === 2) {
    _log.call(console, `%c${name}`, 'color:red;font-weight:bold', stream)
  } else {
    _log.apply(console, arguments)
  }
}

module.exports = ({ id, socket }) => {
  const $editor = document.getElementById('editor')
  const $status = document.getElementById('save-status')
  let _saveStatusTimer

  //------ streams --------

  // remote
  const remoteNote$ = remoteNoteStream()
  const isRemoteNoteStale$ = remoteNote$.map(() => false)

  // local
  const compositing$ = compositingStream().unique()
  const notCompositing$ = compositing$.map(comp => !comp)
  const input$ = Stream.fromEvent($editor, 'input')
  const commonParent$ = Stream($editor.value)

  // remote => local
  const updateLocal$ = remoteNote$.until(notCompositing$)

  // local => remote
  const savePending$ = input$.debounce(500)
  const isSaving$ = Stream(false)

  //------ effects --------
  updateLocal$.subscribe(mergeToEditor)

  isRemoteNoteStale$.unique().filter(Boolean).subscribe(fetchNote)

  savePending$
    .until(notCompositing$)
    .map(() => $editor.value)
    .subscribe(saveToRemote)

  isSaving$.unique().subscribe(updateSaveStatus)

  return

  function remoteNoteStream() {
    const remoteNote$ = Stream($editor.value)

    socket.on('updated note', ({ h: hash, p: patch }) => {
      const newNote = applyPatch(remoteNote$(), patch)
      if (verify(newNote, hash)) {
        remoteNote$(newNote)
      } else {
        isRemoteNoteStale$(true)
      }
    })

    socket.emit('subscribe', { id: id })
    return remoteNote$
  }

  function fetchNote() {
    socket.emit('get', { id: id }, ({ note } = {}) => {
      if (note != null && isRemoteNoteStale$()) {
        remoteNote$(note)
      }
    })
  }

  function mergeToEditor() {
    const newRemoteNote = remoteNote$()

    if (newRemoteNote === $editor.value) {
      commonParent$(newRemoteNote)
    } else if (commonParent$() === $editor.value) {
      loadToEditor(newRemoteNote)
      commonParent$(newRemoteNote)
    } else {
      const merged = merge3(newRemoteNote, commonParent$(), $editor.value)
      if (merged == null) {
        console.warn(
          'failed to merge with remote version, discarding local version :('
        )
        loadToEditor(newRemoteNote)
        commonParent$(newRemoteNote)
      } else {
        console.info('merged with remote version :)')
        loadToEditor(merged)
        commonParent$(newRemoteNote)
        savePending$(true)
      }
    }
  }

  function updateSaveStatus(isSaving) {
    clearTimeout(_saveStatusTimer)
    if (isSaving) {
      $status.classList.add('show')
    } else {
      _saveStatusTimer = setTimeout(() => $status.classList.remove('show'), 300)
    }
  }

  function loadToEditor(note) {
    if (note !== $editor.value) {
      const nextCaretPos = getNextCaretPos($editor.value, note, $editor)
      $editor.value = note
      $editor.setSelectionRange(nextCaretPos, nextCaretPos)
    }

    function getNextCaretPos(prev, next, $editor) {
      const caretSymbol = genUniqCaret(next, prev)
      const prevCaretPos = $editor.selectionStart
      const prevWithCaret =
        '' +
        prev.substring(0, prevCaretPos) +
        caretSymbol +
        prev.substring(prevCaretPos, prev.length)
      const nextWithCaret = merge3(next, prev, prevWithCaret)
      return nextWithCaret != null
        ? nextWithCaret.indexOf(caretSymbol)
        : next.length
    }
  }

  function saveToRemote(note) {
    const remoteNote = remoteNote$()
    if (note !== remoteNote) {
      isSaving$(true)
      const msg = {
        id: id,
        p: createPatch(remoteNote, note),
        h: hashString(note)
      }
      socket.emit('save', msg, ({ error }) => {
        if (!error) {
          isSaving$(false)
          remoteNote$(note)
        } else {
          isRemoteNoteStale$(true)
        }
      })
    }
  }

  function compositingStream() {
    const compositing$ = Stream(false)
    $editor.addEventListener('compositionstart', e => {
      compositing$(true)
    })
    $editor.addEventListener('compositionend', e => {
      compositing$(false)
    })
    return compositing$
  }
}

function genUniqCaret(...strs) {
  let caretList = ['☠', '☮', '☯', '♠', '\u0000'] // i don't think any one will use last one
  return caretList.find(v => strs.every(str => !str.includes(v)))
}

function verify(str, hash) {
  return str != null && hashString(str) === hash
}
