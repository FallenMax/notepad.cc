import { START, END, Transformer } from '../assistor.types'
// ===
//     xxxIyyy
//     yyyyyyy
//     yyyyyyy
//     yyyIxxx
// ===
//   xxxIyyy
//   yyyyyyy
//   yyyyyyy
//   yyyIxxx
// ===
const BLOCK_REG = new RegExp(`^.*${START}(\n|.)*${END}.*$`, 'm')
export const deindentItems: Transformer = (state) => {
  const match = BLOCK_REG.exec(state)
  if (match) {
    const [matched] = match
    const deindent = (str: string) => str.replace(/^ /, '').replace(/^ /, '')
    const lines = matched
      .split('\n')
      .map(deindent)
      .join('\n')
    return state.replace(matched, lines)
  }
}
