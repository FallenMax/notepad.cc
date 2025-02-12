import hashString from 'string-hash'
import { ErrorCode } from '../../common/error'
import { applyPatch, createPatch, merge3, Patch } from '../../common/lib/diff3'
import { getTransformer } from '../lib/transformer/transformer'
import { END, START, Transformer } from '../lib/transformer/transformer.type'
import { NoteService } from '../service/note.service'
import { isDebugging } from '../util/env'
import { UserError } from '../util/error'

const noop = (_error?: any) => {}

const showError = (e: any) => {
  console.error(e)
  window.alert(
    (e && e.errmsg) || 'Unknown error occurred, please refresh to retry.',
  )
}

// attempt to set textarea value while preserving selected range
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
  noteService: NoteService
  onSaveStatusChange: (isSaving: boolean) => void
}

export class Editor {
  $textarea: HTMLTextAreaElement
  private teardown: () => void = () => {}
  private onInput = () => {}

  constructor(textarea: HTMLTextAreaElement, private props: EditorProps) {
    this.$textarea = textarea
  }

  async init() {
    //-------------- state --------------
    // note versions
    let common = ''
    let remote = ''

    // branch status
    let remoteUpdated = false
    let localUpdated = false
    let remoteStale = false

    // operation status
    let operation = 'idle' as 'idle' | 'push' | 'pull'
    let disableTimer: number
    const setOperation = (op: 'idle' | 'push' | 'pull') => {
      operation = op
      if (op === 'idle') {
        window.clearTimeout(disableTimer)
        this.$textarea.disabled = false
      } else {
        window.clearTimeout(disableTimer)
        disableTimer = window.setTimeout(() => {
          this.$textarea.disabled = true
        }, 1000 * 10)
      }
    }

    // special conditions
    let isCompositing = false

    //-------------- note operations --------------
    const pushLocal = async (callback = noop) => {
      if (isDebugging) {
        console.info('operation:pushLocal')
      }
      try {
        const current = this.$textarea.value
        const patch = createPatch(remote, current)
        const hash = hashString(current)

        await this.props.noteService.saveNote(this.props.id, patch, hash)

        remote = current
        common = current
        remoteUpdated = false
        remoteStale = false
        localUpdated = current !== this.$textarea.value
        callback()
      } catch (e: any) {
        if (e?.errcode) {
          switch (e.errcode) {
            case ErrorCode.HASH_MISMATCH:
              remoteStale = true
              break
            case ErrorCode.EXCEEDED_MAX_SIZE:
              window.alert(`Note's size exceeded limit (100,000 characters).`)
              break
          }
        }
        callback(e)
      }
    }

    const pullRemote = (callback = noop) => {
      if (isDebugging) {
        console.info('operation:pullRemote')
      }
      this.props.noteService
        .fetchNote(this.props.id)
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
      let rebasedLocal = merge3(remote, common, this.$textarea.value)
      if (rebasedLocal == null) {
        console.warn('failed to merge, discarding local note :(')
        rebasedLocal = remote
      }
      setTextareaValue(this.$textarea, rebasedLocal)
      common = remote
      remoteUpdated = false
      localUpdated = true

      callback()
    }

    const forwardLocal = (callback = noop) => {
      if (isDebugging) {
        console.info('operation:forwardLocal')
      }
      setTextareaValue(this.$textarea, remote)
      common = remote
      remoteUpdated = false
      callback()
    }

    /** pattern match current state and exec corresponding sync operation */
    const requestSync = () => {
      if (remoteStale) {
        if (operation !== 'idle') {
          deferSync()
          return
        }
        setOperation('pull')
        this.props.onSaveStatusChange(true)
        pullRemote(() => {
          setOperation('idle')
          this.props.onSaveStatusChange(false)
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
        setOperation('push')
        this.props.onSaveStatusChange(true)
        this.$textarea.disabled = false
        pushLocal((error) => {
          if (error) {
            console.error(error)
            setOperation('idle')
            deferSync()
            this.$textarea.disabled = true
            return
          }
          setOperation('idle')
          this.props.onSaveStatusChange(false)
          this.$textarea.disabled = false
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
    const onInput = () => {
      localUpdated = true
      deferSync()
    }
    this.onInput = onInput

    const onKeyDown = (e: KeyboardEvent) => {
      if (isCompositing) {
        return
      }

      const transformer = getTransformer(e)
      if (transformer) {
        const applied = this.applyTransformer(transformer)
        if (applied) {
          e.preventDefault()
        }
      }
    }

    const onNoteUpdate = (params: { h: number; p: Patch }) => {
      const { h: hash, p: patch } = params
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
    this.props.noteService.on('noteUpdate', onNoteUpdate)

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (localUpdated) {
        const message = 'Your change has not been saved, quit?'
        e.returnValue = message // Gecko, Trident, Chrome 34+
        return message // Gecko, WebKit, Chrome <34
      }
    }

    let periodicSyncTimer: number
    const start = async () => {
      try {
        let note = (window as any).__note
        if (note == null) {
          const result = await this.props.noteService.fetchNote(this.props.id)
          if (typeof result.note !== 'string') {
            throw new UserError('Failed to fetch note')
          }
          note = result.note
        }

        this.$textarea.value = note
        common = note
        remote = note

        remoteUpdated = false
        localUpdated = false
        remoteStale = false

        setOperation('idle')
        isCompositing = false

        await this.props.noteService.subscribe(this.props.id)

        this.$textarea.addEventListener('compositionstart', onCompositingStart)
        this.$textarea.addEventListener('compositionend', onCompositingEnd)
        this.$textarea.addEventListener('keydown', onKeyDown)
        this.$textarea.addEventListener('input', onInput)
        window.addEventListener('beforeunload', onBeforeUnload)
        periodicSyncTimer = window.setInterval(() => {
          this.props.noteService.subscribe(this.props.id) // in case server restarted and subscriptions are lost
          deferSync()
        }, 1000 * 60)

        this.$textarea.disabled = false
      } catch (error) {
        showError(error)
      }
    }

    this.teardown = () => {
      this.$textarea.removeEventListener('compositionstart', onCompositingStart)
      this.$textarea.removeEventListener('compositionend', onCompositingEnd)
      this.$textarea.removeEventListener('keydown', onKeyDown)
      this.$textarea.removeEventListener('input', onInput)
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.clearInterval(periodicSyncTimer)

      this.props.noteService.off('noteUpdate', onNoteUpdate)
      this.props.noteService.unsubscribe(this.props.id)
    }

    start()
  }

  destroy() {
    this.teardown()
  }

  applyTransformer(transformer: Transformer): boolean {
    const $textarea = this.$textarea

    const value = $textarea.value
    const start = $textarea.selectionStart
    const end = $textarea.selectionEnd

    const state = [
      value.substring(0, start),
      START,
      value.substring(start, end),
      END,
      value.substring(end),
    ].join('')

    const transformed = transformer(state)

    if (transformed != null) {
      const [before, _start, between, _end, after] = transformed.split(
        new RegExp(`(${START}|${END})`, 'mg'),
      )
      $textarea.value = [before, between, after].join('')
      $textarea.setSelectionRange(before.length, before.length + between.length)
      this.onInput()
      return true
    }
    return false
  }
}
