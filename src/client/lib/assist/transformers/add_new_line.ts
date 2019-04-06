import { BULLET, CURSOR, Transformer } from '../assistor.types'

const BULLET_LINE_REG = new RegExp(`^( *)(${BULLET})?(.*)${CURSOR}(.*)$`, 'm')

// ===
//   - xxxIyyy
// ===
//   - xxx
//   - Iyyy
// ===

export const addNewLine: Transformer = (state) => {
  const match = BULLET_LINE_REG.exec(state)
  if (match) {
    const [matched, leadingSpaces, bullet, beforeCursor, afterCursor] = match
    if (leadingSpaces === '' && bullet === undefined) return undefined
    return state.replace(
      matched,
      beforeCursor === ' ' && afterCursor === ''
        ? `${CURSOR}`
        : bullet === undefined
        ? `${leadingSpaces}${beforeCursor}\n${leadingSpaces}${CURSOR}${afterCursor}`
        : `${leadingSpaces}${bullet}${beforeCursor}\n${leadingSpaces}${bullet} ${CURSOR}${afterCursor}`,
    )
  }
}
