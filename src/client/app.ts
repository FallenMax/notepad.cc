import { ClientAPI, ServerAPI } from '../common/api.type'
import { generatePageId } from '../common/lib/generate_id'
import { Editor } from './component/editor'
import { RpcClient } from './lib/rpc_client'
import { NoteService } from './service/note.service'

function $(selector: string) {
  return document.querySelector(selector) as HTMLElement
}

class App {
  private rpcClient: RpcClient<ServerAPI, ClientAPI>
  private noteService: NoteService
  private editor: Editor
  private $saveStatus = $('.save-status')!
  private $networkStatus = $('.network-status')!
  private $editor = $('.editor')!

  constructor() {
    this.rpcClient = new RpcClient<ServerAPI, ClientAPI>({
      noteUpdate: (payload) => {
        this.noteService.emit('noteUpdate', payload)
      },
    })
    this.noteService = new NoteService(this.rpcClient)
    this.editor = new Editor(this.$editor as HTMLTextAreaElement, {
      id,
      noteService: this.noteService,
      onSaveStatusChange: this.handleSaveStatusChange,
    })
  }

  init() {
    this.rpcClient.on('connected', () => {
      this.$networkStatus.style.display = 'none'
    })
    this.rpcClient.on('disconnected', () => {
      this.$networkStatus.style.display = 'block'
    })

    this.editor.init()
  }

  private handleSaveStatusChange = (isSaving: boolean) => {
    this.$saveStatus.classList.toggle('is-active', isSaving)
  }
}

const id = decodeURIComponent(location.pathname.slice(1))
if (id === '') {
  location.replace('/' + generatePageId())
} else {
  const app = new App()
  app.init()
}

// setup service worker
// async function registerServiceWorker() {
//   await navigator.serviceWorker.register('/assets/sw.js', {
//     scope: '/',
//   })
// }
// registerServiceWorker().catch((e) => {
//   console.error(`Failed to register sw: ${e}`)
// })
