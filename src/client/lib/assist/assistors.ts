import { Assistor } from './assistor.types'
import { addNewLine } from './transformers/add_new_line'
import { backDeleteToStart } from './transformers/backdelete_to_start'
import { indentItems } from './transformers/indent_items'
import { deindentItems } from './transformers/deindent_items'

export const assistors: Assistor[] = [
  {
    keys: { key: 'Enter' },
    hasSelection: false,
    transform: addNewLine,
  },
  {
    keys: { key: 'Backspace' },
    hasSelection: false,
    transform: backDeleteToStart,
  },
  {
    keys: { key: 'Tab' },
    transform: indentItems,
  },
  {
    keys: { key: 'Tab', shift: true },
    transform: deindentItems,
  },
]
