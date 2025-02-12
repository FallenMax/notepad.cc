import { deindent } from '../lib/transformer/transformers/deindent'
import { indent } from '../lib/transformer/transformers/indent'
import { toggleList } from '../lib/transformer/transformers/toggle_list'
import { Editor } from './editor'

export class MobileToolbar {
  private resizeObserver?: ResizeObserver
  private toolbarHeight = 48

  constructor(private $toolbar: HTMLElement, private editor: Editor) {}
  init() {
    // Bind event listeners
    {
      const $indent = this.$toolbar.querySelector('.indent')
      const $deIndent = this.$toolbar.querySelector('.deindent')
      const $toggleList = this.$toolbar.querySelector('.toggle-list')
      $indent?.addEventListener('click', this.handleIndent as EventListener)
      $deIndent?.addEventListener('click', this.handleDeIndent as EventListener)
      $toggleList?.addEventListener(
        'click',
        this.handleToggleList as EventListener,
      )
    }

    // Re-position the toolbar when the viewport changes
    {
      window.visualViewport?.addEventListener('resize', this.rePosition)
      window.visualViewport?.addEventListener('scroll', this.rePosition)
      window.addEventListener('scroll', this.rePosition)
      this.rePosition()
    }

    // Show/hide the toolbar when the editor is focused/blurred
    {
      const $textarea = this.editor.$textarea
      $textarea.addEventListener('focus', () => {
        this.toggle()
      })
      $textarea.addEventListener('blur', () => {
        setTimeout(() => {
          this.toggle()
        }, 0) // wait a tick in case the textarea is focused again
      })
      this.toggle()
    }
  }
  private toggle = () => {
    const isFocused = document.activeElement === this.editor.$textarea
    this.$toolbar.style.display = isFocused ? 'flex' : 'none'
  }

  private rePosition = () => {
    const viewport = window.visualViewport!
    const offsetTop = viewport.height + viewport.pageTop
    this.$toolbar.style.top = `${offsetTop - this.toolbarHeight}px`
  }

  private handleIndent = (e: Event) => {
    e.preventDefault()
    this.editor.$textarea.focus()
    this.editor.applyTransformer(indent)
  }

  private handleDeIndent = (e: Event) => {
    e.preventDefault()
    this.editor.$textarea.focus()
    this.editor.applyTransformer(deindent)
  }

  private handleToggleList = (e: Event) => {
    e.preventDefault()
    this.editor.$textarea.focus()
    this.editor.applyTransformer(toggleList)
  }

  destroy() {
    this.resizeObserver?.disconnect()
  }
}
