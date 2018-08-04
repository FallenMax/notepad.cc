import { assistors } from './assistors'
import { Keys, EditorState, START, END } from './assistor.types'

const isMac = /Mac/.test(navigator.platform)

const isSameKey = (a: Keys, b: Keys): boolean => {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.alt) === Boolean(b.alt) &&
    Boolean(a.ctrl) === Boolean(b.ctrl)
  )
}

const fromKeyboardEvent = (e: KeyboardEvent): Keys => {
  return {
    key: e.key.toLowerCase(),
    shift: Boolean(e.shiftKey),
    alt: Boolean(e.altKey),
    ctrl: Boolean(isMac ? e.metaKey : e.ctrlKey),
  }
}

export const transform = (
  state: EditorState,
  keys: Keys
): EditorState | undefined => {
  let transformed: EditorState | undefined
  for (let index = 0; index < assistors.length; index++) {
    const assistor = assistors[index]
    if (isSameKey(keys, assistor.keys)) {
      transformed = assistor.transform(state)
      if (transformed != null) {
        break
      }
    }
  }
  return transformed
}

export function assist(
  $textarea: HTMLTextAreaElement,
  e: KeyboardEvent,
  onAssisted: (...args: any[]) => void
) {
  // @ts-ignore
  if (e.isComposing) return

  const keyEvent = e

  const value = $textarea.value
  const selectionStart = $textarea.selectionStart
  const selectionEnd = $textarea.selectionEnd

  const state = [
    value.substring(0, selectionStart),
    START,
    value.substring(selectionStart, selectionEnd),
    END,
    value.substring(selectionEnd),
  ].join('')

  const keys = fromKeyboardEvent(e)
  const transformed = transform(state, keys)

  if (transformed != null) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation && e.stopImmediatePropagation()
    if (typeof transformed === 'string') {
      const [before, _start, between, _end, after] = transformed.split(
        new RegExp(`(${START}|${END})`, 'mg')
      )
      $textarea.value = [before, between, after].join('')
      $textarea.setSelectionRange(before.length, before.length + between.length)
      $textarea.blur()
      $textarea.focus()
    }
    onAssisted()
  }
}
