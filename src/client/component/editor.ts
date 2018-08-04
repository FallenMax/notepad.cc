import m, { Component } from 'mithril'
import hashString from 'string-hash'
import { applyPatch, createPatch, merge3, PatchCompressed } from '../util/diff3'
import { Stream } from '../util/stream'
import { assist } from './assist'
import { START, END } from './assistor.types'

interface NoteError {
  errcode: string
}

export interface EditorProps {
  id: string
  socket: SocketIOClient.Socket
  onStatusChange: (...arg: any[]) => void
}

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

    const input$ = Stream.fromEvent($editor, 'input').map(() => null)

    const keydown$ = Stream.fromEvent($editor, 'keydown')

    const commonParent$ = Stream($editor.value) // the 'o' in threeWayMerge(a,o,b)

    const shouldSave$ = input$.debounce(500).map(() => null)

    const isSaving$ = Stream(false)

    const isEditorDirty$ = Stream.merge([
      input$.map(() => true),
      isSaving$.filter(s => !s).map(() => false),
    ]).startWith(false)

    //------ listeners --------
    keydown$
      .filter(() => isNotCompositing$())
      .subscribe(key => assist($editor, key, () => input$(null)))

    remoteNote$.until(isNotCompositing$).subscribe(mergeToEditor, false)

    isRemoteNoteStale$
      .unique()
      .filter(Boolean)
      .subscribe(fetchNote)

    shouldSave$
      .until(isNotCompositing$)
      .subscribe(() => saveToRemote($editor.value), false)

    isSaving$.unique().subscribe(onStatusChange)

    isEditorDirty$.subscribe(setBeforeUnloadPrompt)

    //------- trigger fist fetch ---------
    isRemoteNoteStale$(true)

    return

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
        const nextWithSelectionMark = getNextWithSelectionMark(
          $editor.value,
          note
        )
        const [
          before,
          _start,
          between,
          _end,
          after,
        ] = nextWithSelectionMark.split(new RegExp(`(${START}|${END})`, 'mg'))
        $editor.value = [before, between, after].join('')
        $editor.setSelectionRange(before.length, before.length + between.length)
      }

      function getNextWithSelectionMark(prev: string, next: string): string {
        const selectionStart = $editor.selectionStart
        const selectionEnd = $editor.selectionEnd
        const prevWithSelectionMark =
          prev.substring(0, selectionStart) +
          START +
          prev.substring(selectionStart, selectionEnd) +
          END +
          prev.substring(selectionEnd)

        const nextWithSelectionMark = merge3(next, prev, prevWithSelectionMark)
        if (nextWithSelectionMark == null) {
          return next + START + END
        } else {
          return nextWithSelectionMark
        }
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
      const compositionEnd$ = Stream.fromEvent(elem, 'compositionend')
      const compositing$ = Stream.merge([
        compositionStart$.map(() => true),
        compositionEnd$.map(() => false),
      ])
        .startWith(false)
        .unique()
      return compositing$
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
