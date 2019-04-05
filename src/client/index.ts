import createSocketClient from 'socket.io-client'
import m from 'mithril'
import { Editor } from './component/editor'
import { networkEventMap } from './lib/network'

const App: m.FactoryComponent = () => {
  const socket = createSocketClient()
  const id = decodeURIComponent(location.pathname.slice(1))

  let isSaving = false
  let networkStatus = ''

  Object.keys(networkEventMap).forEach(event => {
    socket.on(event, () => {
      networkStatus = networkEventMap[event]
      m.redraw()
    })
  })

  return {
    oninit(): void {
      document.title = `${id} · notepad`
    },

    view() {
      const href = location.origin + '/' + id

      return m(
        'main',
        m('header', [
          m(
            'small#save-status',
            { class: isSaving ? 'is-active' : undefined },
            'saving'
          ),
          m('small#network-status', networkStatus),
        ]),
        m('section', [
          m('.layer', [
            m('.layer', [
              m('.layer', [
                m(Editor, {
                  id,
                  socket,
                  onSaveStatusChange: (saving: boolean) => {
                    isSaving = saving
                    m.redraw()
                  },
                }),
              ]),
            ]),
          ]),
        ]),
        m(
          'footer',
          m('small', m('a.this-page', { href }, decodeURIComponent(href)))
        )
      )
    },
  }
}

m.mount(document.body, App)
