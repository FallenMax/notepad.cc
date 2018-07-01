import m from 'mithril'
import { Component } from 'mithril/index'
import hashString from 'string-hash'
import { PatchCompressed, applyPatch, createPatch, merge3 } from '../util/diff3'
import { Stream } from '../util/stream'

interface NoteError {
  errcode: string
}

export interface EditorProps {
  id: string
  socket: SocketIOClient.Socket
  onStatusChange: (...arg: any[]) => void
}

const UNIQUE_CARET = '\u0000'

const verify = (str: string, hash: number): boolean => {
  return str != null && hashString(str) === hash
}

export const Editor: Component<EditorProps> = {
  oncreate({ dom, attrs: { id, socket, onStatusChange } }): void {
    const $editor = dom as HTMLTextAreaElement

    //------ events --------

    const remoteNote$ = remoteNoteStream()

    const isRemoteNoteStale$ = remoteNote$.map(() => false)

    const isNotCompositing$ = compositingStream($editor)
      .unique()
      .map(comp => !comp)

    const input$ = Stream.fromEvent($editor, 'input')
    const keydown$ = Stream.fromEvent($editor, 'keydown')
    const commonParent$ = Stream($editor.value) // the 'o' in threeWayMerge(a,o,b)

    const shouldSave$ = input$.debounce(500).map(() => null)
    const isSaving$ = Stream(false)

    const isEditorDirty$ = editorDirtyStream()

    //------ listeners --------
    keydown$.subscribe(mutateContentOnKeydown)

    remoteNote$.until(isNotCompositing$).subscribe(mergeToEditor, false)

    isRemoteNoteStale$
      .unique()
      .filter(Boolean)
      .subscribe(fetchNote)

    shouldSave$
      .until(isNotCompositing$)
      .map(() => $editor.value)
      .subscribe(saveToRemote, false)

    isSaving$.unique().subscribe(onStatusChange)

    isEditorDirty$.subscribe(setBeforeUnloadPrompt)

    //------- trigger fist fetch ---------
    isRemoteNoteStale$(true)

    return

    function mutateContentOnKeydown(e: KeyboardEvent) {
      // @ts-ignore
      if (e.isComposing) return

      const keyEvent = e
      const content = $editor.value
      const cursorPos = $editor.selectionStart
      const lines = content.split('\n')
      const linesUntilCursor = content.slice(0, cursorPos).split('\n')
      const lineIndex = linesUntilCursor.length - 1
      const activeLine = lines[lineIndex]
      const lineCursorPos = linesUntilCursor[linesUntilCursor.length - 1].length

      if (e.code === 'Tab') {
        const content = $editor.value
        const selectionStart = $editor.selectionStart
        const newContent =
          content.slice(0, selectionStart) +
          '  ' +
          content.slice(selectionStart)
        $editor.value = newContent
        $editor.setSelectionRange(selectionStart + 2, selectionStart + 2)
        e.preventDefault()
        input$()
      }
    }

    function remoteNoteStream(): Stream<string> {
      const remoteNote$ = Stream($editor.value)

      socket.on(
        'note_update',
        ({ h: hash, p: patch }: { h: number; p: PatchCompressed }) => {
          const newNote = applyPatch(remoteNote$(), patch)
          if (verify(newNote, hash)) {
            remoteNote$(newNote)
          } else {
            isRemoteNoteStale$(true)
          }
        }
      )

      socket.emit('subscribe', { id: id })
      return remoteNote$
    }

    function fetchNote(): void {
      socket.emit('get', { id: id }, ({ note }: { note?: string } = {}) => {
        if (note != null && isRemoteNoteStale$()) {
          remoteNote$(note)
          if ($editor.disabled) {
            $editor.disabled = false
          }
        }
      })
    }

    function mergeToEditor(): void {
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
          shouldSave$(null)
        }
      }
    }

    function loadToEditor(note: string) {
      if (note !== $editor.value) {
        const nextCaretPos = getNextCaretPos($editor.value, note)
        $editor.value = note
        $editor.setSelectionRange(nextCaretPos, nextCaretPos)
      }

      function getNextCaretPos(prev: string, next: string) {
        const prevCaretPos = $editor.selectionStart
        const prevWithCaret =
          prev.substring(0, prevCaretPos) +
          UNIQUE_CARET +
          prev.substring(prevCaretPos, prev.length)
        const nextWithCaret = merge3(next, prev, prevWithCaret)
        return nextWithCaret != null
          ? nextWithCaret.indexOf(UNIQUE_CARET)
          : next.length
      }
    }

    function saveToRemote(note: string) {
      const remoteNote = remoteNote$()
      if (!isSaving$() && note !== remoteNote) {
        isSaving$(true)
        const msg = {
          id: id,
          p: createPatch(remoteNote, note),
          h: hashString(note),
        }

        socket.emit('save', msg, ({ error }: { error?: NoteError } = {}) => {
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

    function compositingStream(elem: HTMLElement): Stream<boolean> {
      const compositionStart$ = Stream.fromEvent(elem, 'compositionstart')
      const compositionEnd$ = Stream.fromEvent(elem, 'compositionstart')
      const compositing$ = Stream.merge([
        compositionStart$.map(() => true),
        compositionEnd$.map(() => false),
      ])
        .startWith(false)
        .unique()
      return compositing$.log('comp')
    }

    function editorDirtyStream() {
      const $dirty = Stream(false)
      input$.subscribe(() => $dirty(true))
      isSaving$.filter(s => !s).subscribe(() => $dirty(false))
      return $dirty
    }

    function beforeunloadPrompt(e: BeforeUnloadEvent) {
      var confirmationMessage = 'Your change has not been saved, quit?'

      e.returnValue = confirmationMessage // Gecko, Trident, Chrome 34+
      return confirmationMessage // Gecko, WebKit, Chrome <34
    }

    function setBeforeUnloadPrompt(isDirty: boolean) {
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
