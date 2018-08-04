import { Assistor, BULLET, CURSOR, START, END } from './assistor.types'

export const assistors: Assistor[] = [
  // ===
  //   - xxxIyyy
  // ===
  //   - xxx
  //   - Iyyy
  // ===
  {
    keys: { key: 'Enter' },
    name: 'add new line, preserving leading spaces and bullet',
    transform: state => {
      const reg = new RegExp(`^( *)(${BULLET})?(.*)${CURSOR}(.*)$`, 'gm')
      const match = reg.exec(state)
      if (match) {
        const [
          matched,
          leadingSpaces,
          bullet,
          beforeCursor,
          afterCursor,
        ] = match
        if (leadingSpaces === '' && bullet === undefined) return undefined
        return state.replace(
          matched,
          beforeCursor === ' ' && afterCursor === ''
            ? `${CURSOR}`
            : bullet === undefined
              ? `${leadingSpaces}${beforeCursor}\n${leadingSpaces}${CURSOR}${afterCursor}`
              : `${leadingSpaces}${bullet}${beforeCursor}\n${leadingSpaces}${bullet} ${CURSOR}${afterCursor}`
        )
      }
    },
  },

  // ===
  //       I
  // ===
  // I
  // ===
  {
    keys: { key: 'Backspace' },
    name: 'de-indent',
    transform: state => {
      const reg = new RegExp(`^( +)${CURSOR}(.*)$`, 'gm')
      const match = reg.exec(state)
      if (match) {
        const [matched, leadingSpaces, afterCursor] = match
        const deindented = leadingSpaces.replace(' ', '').replace(' ', '')
        return state.replace(matched, `${deindented}${CURSOR}${afterCursor}`)
      }
    },
  },

  // ===
  //   I
  // ===
  //     I
  // ===
  {
    keys: { key: 'Tab' },
    name: 'indent',
    transform: state => {
      const reg = new RegExp(`^( *)${CURSOR}(.*)$`, 'gm')
      const match = reg.exec(state)
      if (match) {
        const [matched, leadingSpaces, afterCursor] = match
        return state.replace(
          matched,
          `${leadingSpaces}  ${CURSOR}${afterCursor}`
        )
      }
    },
  },

  // ===
  //     I
  // ===
  //   I
  // ===
  {
    keys: { key: 'Tab', shift: true },
    name: 'deindent',
    transform: state => {
      const reg = new RegExp(`^( +)${CURSOR}(.*)$`, 'gm')
      const match = reg.exec(state)
      if (match) {
        const [matched, leadingSpaces, afterCursor] = match
        const deindented = leadingSpaces.replace(' ', '').replace(' ', '')
        return state.replace(matched, `${deindented}${CURSOR}${afterCursor}`)
      }
    },
  },

  // ===
  //   - xxxIyyy
  // ===
  //     - xxxIyyy
  // ===
  {
    keys: { key: 'Tab' },
    name: 'indent list item',
    transform: state => {
      const reg = new RegExp(`^( *)(${BULLET}) (.*)${CURSOR}(.*)$`, 'gm')
      const match = reg.exec(state)
      if (match) {
        const [
          matched,
          leadingSpaces,
          bullet,
          beforeCursor,
          afterCursor,
        ] = match
        return state.replace(
          matched,
          `${leadingSpaces}  ${bullet} ${beforeCursor}${CURSOR}${afterCursor}`
        )
      }
    },
  },

  // ===
  //   - xxxIyyy
  // ===
  //     - xxxIyyy
  // ===
  {
    keys: { key: 'Tab', shift: true },
    name: 'deindent list item',
    transform: state => {
      const reg = new RegExp(`^( +)(${BULLET}) (.*)${CURSOR}(.*)$`, 'gm')
      const match = reg.exec(state)
      if (match) {
        const [
          matched,
          leadingSpaces,
          bullet,
          beforeCursor,
          afterCursor,
        ] = match
        const deindented = leadingSpaces.replace(' ', '').replace(' ', '')
        return state.replace(
          matched,
          `${deindented}${bullet} ${beforeCursor}${CURSOR}${afterCursor}`
        )
      }
    },
  },

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
  {
    keys: { key: 'Tab' },
    name: 'indent multiple lines',
    transform: state => {
      const reg = new RegExp(`^.*${START}(\n|.)+${END}.*$`, 'gm')
      const match = reg.exec(state)
      if (match) {
        const [matched] = match
        const lines = matched
          .split('\n')
          .map(line => '  ' + line)
          .join('\n')
        return state.replace(matched, lines)
      }
    },
  },

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
  {
    keys: { key: 'Tab', shift: true },
    name: 'deindent multiple lines',
    transform: state => {
      const reg = new RegExp(`^.*${START}(\n|.)+${END}.*$`, 'gm')
      const match = reg.exec(state)
      if (match) {
        const [matched] = match
        const deindent = (str: string) =>
          str.replace(/^ /, '').replace(/^ /, '')
        const lines = matched
          .split('\n')
          .map(deindent)
          .join('\n')
        return state.replace(matched, lines)
      }
    },
  },

  {
    keys: { key: 'Tab' },
    name: 'just add two spaces',
    transform: state => {
      const reg = new RegExp(`${CURSOR}`, 'gm')
      return state.replace(reg, `  ${CURSOR}`)
    },
  },
]
