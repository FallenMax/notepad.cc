import { Assistor } from './assistor.types'
import { addNewLine } from './transformers/add_new_line'
import { backDeleteToStart } from './transformers/backdelete_to_start'
import { indentItems } from './transformers/indent_items'
import { deindentItems } from './transformers/deindent_items'
import { toggleList } from './transformers/toggle_list'
import { indentItem } from './transformers/indent_item'
import { deindentItem } from './transformers/deindent_item'

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
    hasSelection: false,
    transform: indentItem,
  },
  {
    keys: { key: 'Tab' },
    hasSelection: true,
    transform: indentItems,
  },
  {
    keys: { key: 'Tab', shift: true },
    hasSelection: false,
    transform: deindentItem,
  },
  {
    keys: { key: 'Tab', shift: true },
    hasSelection: true,
    transform: deindentItems,
  },
  {
    keys: { key: '-' },
    hasSelection: true,
    transform: toggleList,
  },
]
