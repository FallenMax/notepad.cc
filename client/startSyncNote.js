const { createPatch, applyPatch, merge3 } = require('../server/lib/diff3')
const hashString = require('string-hash')

class NoteManager {
  constructor({ $editor, socket, id }) {
    this.$status = document.getElementById('save-status')
    this.$editor = $editor
    this.socket = socket
    this.id = id
    this.remoteNote = $editor.value // a copy of remote version
    this.statusTimer = null
    this._isSaving = false
    this._isCompositing = false
    this._compositionDefers = []
  }

  start() {
    const onInput = debounce(e => this.onInput(e), 500)
    this.$editor.addEventListener('input', e => {
      if (!this.isCompositing) {
        onInput(e)
      }
    })
    this.$editor.addEventListener('compositionstart', e => {
      this.isCompositing = true
    })
    this.$editor.addEventListener('compositionend', e => {
      this.isCompositing = false
      onInput(e)
    })

    this.socket.emit('subscribe', { id: this.id })
    this.socket.on('updated note', update => this.onUpdate(update))
  }

  get isCompositing() {
    return this._isCompositing
  }

  set isCompositing(isCompositing) {
    this._isCompositing = isCompositing
    if (!isCompositing) {
      this._compositionDefers.forEach(resolve => resolve(true))
      this._compositionDefers = []
    }
  }

  waitCompositionEnd() {
    return new Promise(resolve => {
      if (!this.isCompositing) {
        resolve(true)
      } else {
        this._compositionDefers.push(resolve)
      }
    })
  }

  get isSaving() {
    return this._isSaving
  }

  set isSaving(isSaving) {
    clearTimeout(this.statusTimer)
    this._isSaving = isSaving
    if (isSaving) {
      this.$status.classList.add('show')
    } else {
      this.statusTimer = setTimeout(
        () => this.$status.classList.remove('show'),
        1000
      )
    }
  }

  saveToServer(note) {
    return new Promise((resolve, reject) => {
      this.isSaving = true
      const msg = {
        id: this.id,
        p: createPatch(this.remoteNote, note),
        h: hashString(note)
      }
      this.socket.emit('save', msg, ({ error } = {}) => {
        this.isSaving = false
        if (!error) {
          return resolve(note)
        } else {
          return reject(error)
        }
      })
    })
  }

  loadToEditor(note) {
    const $editor = this.$editor
    const nextCaretPos = getNextCaretPos($editor.value, note, $editor)
    $editor.value = note
    $editor.setSelectionRange(nextCaretPos, nextCaretPos)

    function getNextCaretPos(prev, next, $editor) {
      const caretSymbol = genUniqCaret(next, prev)
      const prevCaretPos = $editor.selectionStart
      const prevWithCaret = '' +
        prev.substring(0, prevCaretPos) +
        caretSymbol +
        prev.substring(prevCaretPos, prev.length)
      const nextWithCaret = merge3(next, prev, prevWithCaret)
      return nextWithCaret != null
        ? nextWithCaret.indexOf(caretSymbol)
        : next.length
    }
  }

  fetchRemote() {
    return new Promise((resolve, reject) => {
      this.socket.emit(
        'get',
        { id: this.id },
        ({ note } = {}) =>
          note != null ? resolve(note) : reject(new Error('empty response'))
      )
    })
  }

  rebase(newRemoteNote) {
    return this.waitCompositionEnd().then(() => {
      if (this.remoteNote === this.$editor.value) {
        this.loadToEditor(newRemoteNote)
      } else {
        const merged = merge3(
          newRemoteNote,
          this.remoteNote,
          this.$editor.value
        )
        if (merged == null) {
          console.warn(
            'failed to merge with remote version, discarding local version :('
          )
          this.loadToEditor(newRemoteNote)
        } else {
          console.info('merged with remote version :)')
          this.loadToEditor(merged)
        }
      }
      this.remoteNote = newRemoteNote
    })
  }

  onInput(e) {
    const { remoteNote } = this
    const note = this.$editor.value
    if (!this.isSaving && note !== remoteNote) {
      this.saveToServer(note).then(
        note => this.remoteNote = note,
        error => {
          this.fetchRemote()
            .then(newRemoteNote => this.rebase(newRemoteNote))
            .then(() => {
              this.saveToServer(this.$editor.value)
            })
        }
      )
    }
  }

  onUpdate({ h: hash, p: patch }) {
    let newRemoteNote = applyPatch(this.remoteNote, patch)
    Promise.resolve(
      verify(newRemoteNote, hash) ? newRemoteNote : this.fetchRemote()
    ).then(newRemoteNote => this.rebase(newRemoteNote))
  }
}

module.exports = ({ id, socket }) => {
  const noteManager = new NoteManager({
    id,
    socket,
    $editor: document.getElementById('editor')
  })
  noteManager.start()
}

function genUniqCaret(...strs) {
  let caretList = ['☠', '☮', '☯', '♠', '\u0000'] // i don't think any one will use last one
  return caretList.find(v => strs.every(str => !str.includes(v)))
}

function verify(str, hash) {
  return str != null && hashString(str) === hash
}

function debounce(fn, delay) {
  let timer
  return function(arg) {
    clearTimeout(timer)
    timer = setTimeout(
      () => {
        fn(arg)
      },
      delay
    )
  }
}
