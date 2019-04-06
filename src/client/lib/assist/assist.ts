import { assistors } from './assistors'
import { Keys, EditorState, START, END } from './assistor.types'
import { isMac } from '../../util/env'

const isSameKey = (a: Keys, b: Keys): boolean => {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.alt) === Boolean(b.alt) &&
    Boolean(a.ctrl_cmd) === Boolean(b.ctrl_cmd)
  )
}

const fromKeyboardEvent = (e: KeyboardEvent): Keys => {
  return {
    key: e.key.toLowerCase(),
    shift: Boolean(e.shiftKey),
    alt: Boolean(e.altKey),
    ctrl_cmd: Boolean(isMac ? e.metaKey : e.ctrlKey),
  }
}

const applyAssistor = (
  state: EditorState,
  selection: string,
  keys: Keys,
): EditorState | undefined => {
  const hasSelection = selection !== ''
  let transformed: EditorState | undefined
  for (let index = 0; index < assistors.length; index++) {
    const assistor = assistors[index]
    if (
      isSameKey(keys, assistor.keys) &&
      (assistor.hasSelection === hasSelection ||
        assistor.hasSelection === undefined)
    ) {
      transformed = assistor.transform(state)
      if (transformed != null) {
        break
      }
    }
  }
  return transformed
}

/** auto expand, indent, create new list item when input */
export function assist(
  $textarea: HTMLTextAreaElement,
  e: KeyboardEvent,
): boolean {
  // @ts-ignore
  if (e.isComposing) return

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

  const selection = value.substring(selectionStart, selectionEnd)

  const keys = fromKeyboardEvent(e)
  const transformed = applyAssistor(state, selection, keys)

  if (transformed != null) {
    e.preventDefault()
    e.returnValue = false
    e.stopPropagation()
    e.stopImmediatePropagation && e.stopImmediatePropagation()
    const [before, _start, between, _end, after] = transformed.split(
      new RegExp(`(${START}|${END})`, 'mg'),
    )
    $textarea.value = [before, between, after].join('')
    $textarea.setSelectionRange(before.length, before.length + between.length)
    // $textarea.blur()
    // $textarea.focus()
    return true
  }
  return false
}
