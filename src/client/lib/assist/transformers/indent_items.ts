import { START, END, Transformer } from '../assistor.types'
// ===
//   xxxIyyy
//   yyyyyyy
//   yyyyyyy
//   yyyIxxx
// ===
//     xxxIyyy
//     yyyyyyy
//     yyyyyyy
//     yyyIxxx
// ===

const BLOCK_REG = new RegExp(`^.*${START}(\n|.)*${END}.*$`, 'm')
const CURSOR_REG = new RegExp(`(${START}|${END})`, 'mg')

export const indentItems: Transformer = (state) => {
  const match = BLOCK_REG.exec(state)
  if (match) {
    const [matched] = match
    const indent = (line: string) => '  ' + line

    const replaced = matched
      .replace(CURSOR_REG, '')
      .split('\n')
      .map(indent)
      .join('\n')

    const lines = START + replaced + END
    return state.replace(matched, lines)
  }
}
