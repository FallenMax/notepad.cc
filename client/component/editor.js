const { createPatch, applyPatch, merge3 } = require('../../server/lib/diff3')
const hashString = require('string-hash')
const Stream = require('../util/stream.js')
const m = require('mithril')

module.exports = {
  oncreate({ dom, attrs: { id, socket, onStatusChange } }) {
    const $editor = dom

    //------ streams --------

    // remote
    const remoteNote$ = remoteNoteStream()
    const isRemoteNoteStale$ = remoteNote$.map(() => false)

    // local
    const compositing$ = compositingStream().unique()
    const notCompositing$ = compositing$.map(comp => !comp)
    const input$ = Stream.fromEvent($editor, 'input')
    const commonParent$ = Stream($editor.value) // the 'o' in threeWayMerge(a,o,b)

    // remote => local
    const updateLocal$ = remoteNote$.until(notCompositing$)

    // local => remote
    const savePending$ = input$.debounce(500)
    const isSaving$ = Stream(false)

    const editorDirty$ = editorDirtyStream(input$, isSaving$)

    //------ effects --------
    updateLocal$.subscribe(mergeToEditor, false)

    isRemoteNoteStale$
      .unique()
      .filter(Boolean)
      .subscribe(fetchNote)

    savePending$
      .until(notCompositing$)
      .map(() => $editor.value)
      .subscribe(saveToRemote, false)

    isSaving$.unique().subscribe(onStatusChange)

    editorDirty$.subscribe(setBeforeunloadPrompt)

    //------- trigger fist fetch ---------
    isRemoteNoteStale$(true)

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
          if (dom.disabled) {
            dom.disabled = false
          }
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
      if (!isSaving$() && note !== remoteNote) {
        isSaving$(true)
        const msg = {
          id: id,
          p: createPatch(remoteNote, note),
          h: hashString(note),
        }
        socket.emit('save', msg, ({ error } = {}) => {
          isSaving$(false)
          if (!error) {
            commonParent$(note)
            remoteNote$(note)
          } else {
            if (error.errcode === 'HASH_MISMATCH') {
              isRemoteNoteStale$(true)
            } else if (error.errcode === 'EXCEEDED_MAX_SIZE') {
              window.alert(
                'Note exceeded max size (100,000 characters), please do not abuse this free service.'
              )
            }
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

    function editorDirtyStream(input$, $isSaving) {
      const $dirty = Stream(false)
      input$.subscribe(() => $dirty(true))
      $isSaving.filter(s => !s).subscribe(() => $dirty(false))
      return $dirty
    }

    function beforeunloadPrompt(e) {
      var confirmationMessage = 'Your change has not been saved, quit?'

      e.returnValue = confirmationMessage // Gecko, Trident, Chrome 34+
      return confirmationMessage // Gecko, WebKit, Chrome <34
    }

    function setBeforeunloadPrompt(isDirty) {
      if (isDirty) {
        window.addEventListener('beforeunload', beforeunloadPrompt)
      } else {
        window.removeEventListener('beforeunload', beforeunloadPrompt)
      }
    }
  },
  onbeforeupdate() {
    // update textarea manually
    return false
  },
  view() {
    return m(
      'textarea#editor',
      { disabled: true, spellcheck: 'false' },
      '(Loading...)'
    )
  },
}

// --------- helpers -----------

function genUniqCaret(...strs) {
  let caretList = ['☠', '☮', '☯', '♠', '\u0000'] // i don't think any one will use last one
  return caretList.find(v => strs.every(str => !str.includes(v)))
}

function verify(str, hash) {
  return str != null && hashString(str) === hash
}
