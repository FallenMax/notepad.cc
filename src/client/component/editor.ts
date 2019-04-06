import hashString from 'string-hash'
import m, { FactoryComponent } from 'mithril'
import { merge3, createPatch, applyPatch, Patch } from '../lib/diff3'
import { UserError } from '../util/error'
import { isDebugging, isMac } from '../util/env'
import { createNoteService } from '../service/note.service'
import { START, END } from '../lib/assist/assistor.types'
import { assist } from '../lib/assist/assist'
import { assertNever } from '../util/assert'

const noop = (_error?: any) => {}

const showError = (e: any) => {
  console.error(e)
  window.alert(
    (e && e.errmsg) || 'Unknown error occured, please refresh to retry.',
  )
}

interface HistoryRecord {
  time: Date
  value: string
  action: 'input' | 'assistedInput' | 'received'
}

const isUndo = (e: any) => {
  if (e.inputType === 'historyUndo') {
    return true
  }
  if (
    e.type === 'keydown' &&
    e.key === 'z' &&
    (isMac ? e.metaKey : e.ctrlKey) &&
    !e.shiftKey
  ) {
    return true
  }
  return false
}
const isRedo = (e: any) => {
  if (e.inputType === 'historyRedo') {
    return true
  }
  if (
    e.type === 'keydown' &&
    e.key === 'z' &&
    (isMac ? e.metaKey : e.ctrlKey) &&
    e.shiftKey
  ) {
    return true
  }
  return false
}

// attempt to set textarea value while perserving selected range
const setTextareaValue = (textarea: HTMLTextAreaElement, value: string) => {
  if (value === textarea.value) {
    return
  }

  const prev = textarea.value
  const next = value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  const prevWithSelectionMark =
    prev.substring(0, start) +
    START +
    prev.substring(start, end) +
    END +
    prev.substring(end)
  const nextWithSelectingMark =
    merge3(next, prev, prevWithSelectionMark) || next + START + END
  const [before, , between, , after] = nextWithSelectingMark.split(
    new RegExp(`(${START}|${END})`, 'mg'),
  )
  textarea.value = [before, between, after].join('')
  textarea.setSelectionRange(before.length, before.length + between.length)
}

export interface EditorProps {
  id: string
  socket: SocketIOClient.Socket
  onSaveStatusChange: (isSaving: boolean) => void
}

export const Editor: FactoryComponent<EditorProps> = () => {
  let teardown = () => {}

  return {
    oncreate(vnode): void {
      const id = vnode.attrs.id
      const socket = vnode.attrs.socket

      //-------------- note service --------------
      const { subscribe, fetchNote, saveNote } = createNoteService({
        socket,
        id,
      })

      //-------------- state --------------
      // note versions
      const editor = vnode.dom as HTMLTextAreaElement
      let common = ''
      let remote = ''

      // branch status
      let remoteUpdated = false
      let localUpdated = false
      let remoteStale = false

      // operation status
      let operation = 'idle' as 'idle' | 'push' | 'pull'

      // special conditions
      let isCompositing = false

      // history state, to support proper undo/redo
      interface HistoryRecord {
        time: Date
        value: string
        action: 'input' | 'assistedInput' | 'received'
      }
      let historyStack: HistoryRecord[] = []
      let historyPointer = 0

      const getState = () => {
        return {
          remoteUpdated,
          localUpdated,
          remoteStale,
          operation,
          isCompositing,
        }
      }
      if (isDebugging) {
        // @ts-ignore
        window.s = getState
      }

      //-------------- history (undo/redo) operations --------------
      // merge adjacent records, remove old ones
      const compactHistory = () => {
        const last = historyStack[historyStack.length - 1]
        const oneBeforeLast = historyStack[historyStack.length - 2]
        const MINIMAL_INTERVAL = 1000 * 3
        if (last && oneBeforeLast) {
          if (
            last.action === 'input' &&
            oneBeforeLast.action === 'input' &&
            last.time.getTime() - oneBeforeLast.time.getTime() <
              MINIMAL_INTERVAL
          ) {
            // drop last
          }
        }

        const MAX_HISTORY_SIZE = 200
        while (historyStack.length > MAX_HISTORY_SIZE) {
          historyStack.shift()
          historyPointer--
        }
      }

      const addHistoryRecord = (action: HistoryRecord['action']) => {
        historyStack.push({
          action,
          value: editor.value,
          time: new Date(),
        })
        historyPointer++
        compactHistory()
      }

      const undo = (e: Event) => {
        console.info('[editor] undo')
        e.preventDefault()
        e.stopPropagation()
        if (historyPointer > 0) {
          historyPointer--
          setTextareaValue(editor, historyStack[historyPointer].value)
          localUpdated = true
          deferSync()
        }
      }

      const redo = (e: Event) => {
        console.info('[editor] redo')
        e.preventDefault()
        e.stopPropagation()
        if (historyStack.length - 1 > historyPointer) {
          historyPointer++
          setTextareaValue(editor, historyStack[historyPointer].value)
          localUpdated = true
          deferSync()
        }
      }

      //-------------- version operations --------------
      const pushLocal = (callback = noop) => {
        if (isDebugging) {
          console.info('operation:pushLocal')
        }
        try {
          const current = editor.value
          const patch = createPatch(remote, current)
          const hash = hashString(current)

          saveNote(patch, hash)
            .then(({ errcode }) => {
              if (errcode) {
                switch (errcode) {
                  case 'HASH_MISMATCH':
                    remoteStale = true
                    break
                  case 'EXCEEDED_MAX_SIZE':
                    throw new UserError(
                      `Note's size exceeded limit (100,000 characters).`,
                    )
                  default:
                    return assertNever(errcode)
                }
              } else {
                remote = current
                common = current
                remoteUpdated = false
                remoteStale = false
                localUpdated = current !== editor.value
              }
              callback()
            })
            .catch(callback)
        } catch (error) {
          callback(error)
        }
      }

      const pullRemote = (callback = noop) => {
        if (isDebugging) {
          console.info('operation:pullRemote')
        }
        fetchNote()
          .then(({ note }) => {
            remote = note
            remoteStale = false
            remoteUpdated = false
          })
          .then(callback)
          .catch(callback)
      }

      const rebaseLocal = (callback = noop) => {
        if (isDebugging) {
          console.info('operation:rebaseLocal')
        }
        let rebasedLocal = merge3(remote, common, editor.value)
        if (rebasedLocal == null) {
          console.warn('failed to merge, discarding local note :(')
          rebasedLocal = remote
        }
        setTextareaValue(editor, rebasedLocal)
        common = remote
        remoteUpdated = false
        localUpdated = true

        callback()
      }

      const forwardLocal = (callback = noop) => {
        if (isDebugging) {
          console.info('operation:forwardLocal')
        }
        setTextareaValue(editor, remote)
        common = remote
        remoteUpdated = false
        callback()
      }

      /** pattern match current state and exec corresponding sync operation */
      const requestSync = () => {
        if (isDebugging) {
          console.info('[sync] start', getState())
        }
        if (remoteStale) {
          if (operation !== 'idle') {
            deferSync()
            return
          }
          operation = 'pull'
          vnode.attrs.onSaveStatusChange(true)
          pullRemote(() => {
            operation = 'idle'
            vnode.attrs.onSaveStatusChange(false)
            requestSync()
          })
          return
        }

        if (localUpdated && remoteUpdated) {
          if (isCompositing) {
            deferSync()
            return
          }
          rebaseLocal(requestSync)
          return
        }

        if (localUpdated) {
          if (operation !== 'idle' || isCompositing) {
            deferSync()
            return
          }
          operation = 'push'
          vnode.attrs.onSaveStatusChange(true)
          pushLocal(() => {
            operation = 'idle'
            vnode.attrs.onSaveStatusChange(false)
            requestSync()
          })
          return
        }

        if (remoteUpdated) {
          if (isCompositing) {
            deferSync()
            return
          }
          forwardLocal(requestSync)
          return
        }
      }

      let syncTimer: number | undefined
      const deferSync = () => {
        if (isDebugging) {
          console.info('deferSync')
        }
        clearTimeout(syncTimer)
        syncTimer = window.setTimeout(requestSync, 100)
      }

      //-------------- event handlers --------------
      const onCompositingStart = () => {
        isCompositing = true
      }
      const onCompositingEnd = () => {
        isCompositing = false
      }

      const onInput = (e?: Event) => {
        if (e) {
          if (isUndo(e)) {
            undo(e)
            return
          } else if (isRedo(e)) {
            redo(e)
            return
          }
        }
        localUpdated = true
        deferSync()
      }
      const onKeyDown = (e: KeyboardEvent) => {
        if (isUndo(e)) {
          undo(e)
          return
        } else if (isRedo(e)) {
          redo(e)
          return
        }
        if (isCompositing) {
          return
        }
        const assisted = assist(editor, e)
        if (assisted) {
          onInput()
        }
      }

      const onNoteUpdate = ({ h: hash, p: patch }: { h: number; p: Patch }) => {
        const note = applyPatch(remote, patch)
        const verified = note != null && hashString(note) === hash
        if (verified) {
          remote = note!
          remoteUpdated = true
          remoteStale = false
        } else {
          remoteStale = true
        }
        requestSync()
      }

      const onBeforeUnload = (e: BeforeUnloadEvent) => {
        if (localUpdated) {
          const message = 'Your change has not been saved, quit?'
          e.returnValue = message // Gecko, Trident, Chrome 34+
          return message // Gecko, WebKit, Chrome <34
        }
      }

      const start = async () => {
        try {
          const result = await fetchNote()
          if (typeof result.note !== 'string') {
            throw new UserError('Failed to fetwh note')
          }

          editor.value = result.note
          common = result.note
          remote = result.note

          remoteUpdated = false
          localUpdated = false
          remoteStale = false

          operation = 'idle'
          isCompositing = false

          historyStack = [
            {
              time: new Date(),
              value: editor.value,
              action: 'received',
            },
          ]
          historyPointer = 0

          await subscribe()

          editor.addEventListener('compositionstart', onCompositingStart)
          editor.addEventListener('compositionend', onCompositingEnd)
          editor.addEventListener('keydown', onKeyDown)
          editor.addEventListener('input', onInput)
          socket.on('note_update', onNoteUpdate)
          window.addEventListener('beforeunload', onBeforeUnload)

          editor.disabled = false
        } catch (error) {
          showError(error)
        }
      }

      teardown = () => {
        editor.removeEventListener('compositionstart', onCompositingStart)
        editor.removeEventListener('compositionend', onCompositingEnd)
        editor.removeEventListener('keydown', onKeyDown)
        editor.removeEventListener('input', onInput)
        socket.off('note_update', onNoteUpdate)
        window.removeEventListener('beforeunload', onBeforeUnload)
        // todo
        // unsubscribe()
      }

      start()
    },
    onbeforeupdate() {
      // skip mithril update, we will update textarea ourselves
      return false
    },
    onremove() {
      teardown()
    },
    view() {
      return m(
        'textarea#editor',
        { disabled: true, spellcheck: 'false' },
        '(Loading...)',
      )
    },
  }
}
