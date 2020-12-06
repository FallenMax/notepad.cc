import m from 'mithril'
import { ClientAPI, ServerAPI } from '../common/api.type'
import { generateId } from '../common/lib/generate_id'
import { Editor } from './component/editor'
import { createRpcClient, RpcClientEvent } from './lib/rpc_client'

const id = decodeURIComponent(location.pathname.slice(1))
if (id === '') {
  location.replace('/' + generateId())
}

const networkEventMap: { [K in RpcClientEvent]: string } = {
  open: '',
  error: 'connection lost',
  close: 'connection lost',
  reconnect: '',
  reconnect_attempt: 'connection lost',
  reconnect_failed: 'connection lost',
}

const App: m.FactoryComponent = () => {
  let isSaving = false
  let isApiClientReady = false
  let networkStatus = ''

  const rpcClient = createRpcClient<ServerAPI, ClientAPI>()

  ;(Object.keys(networkEventMap) as RpcClientEvent[]).forEach((event) => {
    rpcClient.on(event, () => {
      networkStatus = networkEventMap[event] || ''
      m.redraw()
    })
  })

  rpcClient.ready().then(() => {
    isApiClientReady = true
    m.redraw()
  })

  return {
    oninit(): void {
      document.title = `${id} · notepad`
    },

    view() {
      const href = location.origin + '/' + id
      if (!isApiClientReady) {
        return undefined
      }
      return m('main', [
        m('header.status', [
          m(
            'small.save-status',
            { class: isSaving ? 'is-active' : undefined },
            'saving',
          ),
          m('small.network-status', networkStatus),
        ]),

        m('section.editor-wrapper', [
          m('.paper', [
            m('.paper', [
              m('.paper', [
                m(Editor, {
                  rpcClient,
                  id,
                  onSaveStatusChange: (saving: boolean) => {
                    isSaving = saving
                    m.redraw()
                  },
                  onFocus() {},
                  onBlur() {},
                }),
              ]),
            ]),
          ]),
        ]),
        m(
          'footer',
          m('small', m('a.this-page', { href }, decodeURIComponent(href))),
        ),
      ])
    },
  }
}

m.mount(document.body, App)
