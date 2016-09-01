import { createPatch, applyPatch, merge3 } from '../server/lib/diff3'
import hashString from 'string-hash'
import Stream from './stream'


export default function startSyncNote({ id, socket }) {

  const status = document.getElementById('save-status')
  const editor = document.getElementById('editor')
  const $update = Stream.fromEvent(socket, 'updated note')
  const $remoteNote = Stream(editor.textContent)
  const $stagedNote = Stream.combine(
      Stream.fromEvent(editor, 'input'),
      Stream.fromEvent(editor, 'compositionend'),
      () => null
    )
    .throttle(500)
    .map(() => editor.value)
  const $editorSource = Stream(editor.textContent)
  const $isSaving = Stream(false)
  $editorSource.subscribe(writeToEditor)
  $stagedNote.subscribe(save)
  $isSaving.subscribe(updateStatusText)

  subscribeUpdate()
  setInterval(subscribeUpdate, 1000 * 60) // keep connection alive to receive updates
  $update.subscribe(update)

  window.addEventListener('beforeunload', function(e) {
    if (editor.value !== $remoteNote()) {
      const confirmationMessage = 'Changes you made are not saved'
      e.returnValue = confirmationMessage
      return confirmationMessage
    }
  })


  function subscribeUpdate() {
    socket.emit('subscribe', { id })
  }

  function updateStatusText(isSaving) {
    if (isSaving) {
      status.classList.add('show')
    } else {
      setTimeout(() => status.classList.remove('show'), 1000)
    }
  }

  function save(note) {
    if ($isSaving() === false && note !== $remoteNote()) {
      $isSaving(true)
      const msg = {
        id: id,
        p: createPatch($remoteNote(), note),
        h: hashString(note)
      }
      socket.emit('save', msg, onResponse)
    }

    function onResponse({ error } = {}) {
      $isSaving(false)
      if (!error) {
        $remoteNote(note)
      } else {
        console.info('note is outdated, now pulling from server')
        pull({ callback: saveImmediately })
      }
    }

    function saveImmediately(merged) {
      $stagedNote(merged)
    }
  }

  function update({ h: hash, p: patch }) {
    let latestRemote = applyPatch($remoteNote(), patch)
    if (isConsistent(latestRemote, hash)) {
      if ($remoteNote() === editor.value) {
        $remoteNote(latestRemote)
        $editorSource(latestRemote)
      } else {
        pull({ latestRemote })
      }
    } else {
      pull()
    }
  }

  function pull({ callback, latestRemote } = {}) {
    if (latestRemote == null) {
      socket.emit('get', { id }, ({ note }) => mergeEditorWith(note))
    } else {
      mergeEditorWith(latestRemote)
    }

    function mergeEditorWith(latestRemote) {
      let merged = merge3(latestRemote, $remoteNote(), editor.value)
      if (merged == null) {
        console.warn('failed to merge with remote version, discarding local version :(')
      } else {
        console.info('merged with remote version :)')
      }
      merged = merged != null ? merged : latestRemote // let user resolve conflict or just keep it simple?
      $remoteNote(latestRemote)
      $editorSource(merged)
      if (callback) { callback(merged) }
    }
  }

  function writeToEditor(next) {
    const nextCaretPos = getNextCaretPos(editor.value, next, editor)
    editor.value = next
    editor.setSelectionRange(nextCaretPos, nextCaretPos)

    function getNextCaretPos(prev, next, editor) {
      const caretSymbol = genUniqCaret(next, prev)
      const prevCaretPos = editor.selectionStart
      const prevWithCaret = '' +
        prev.substring(0, prevCaretPos) +
        caretSymbol +
        prev.substring(prevCaretPos + 1, prev.length)
      const nextWithCaret = merge3(next, prev, prevWithCaret)
      return nextWithCaret != null ? nextWithCaret.indexOf(caretSymbol) : next.length
    }
  }
}

function genUniqCaret(...strs) {
  let caretList = ['☠', '☮', '☯', '♠', '\u0000'] // i don't think any one will use last one
  let i = 0
  while (strs.join('').indexOf(caretList[i]) !== -1) { i++ }
  return caretList[i]
}

function isConsistent(str, hash) {
  return str != null && hashString(str) === hash
}
