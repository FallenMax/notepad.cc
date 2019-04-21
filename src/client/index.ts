import createSocketClient from 'socket.io-client'
import m from 'mithril'
import { Editor } from './component/editor'
import { networkEventMap } from './lib/network'
import { config } from './config'
import { generateId } from '../common/lib/generate_id'

const id = decodeURIComponent(location.pathname.slice(1))
if (id === '') {
  location.replace('/' + generateId())
}

const App: m.FactoryComponent = () => {
  const socket = createSocketClient(`${location.protocol}//${config.host}`)

  let isSaving = false
  let networkStatus = ''

  const onFocus = () => {}
  const onBlur = () => {}

  const SaveStatus = {
    view() {
      return m(
        'small.save-status',
        { class: isSaving ? 'is-active' : undefined },
        'saving',
      )
    },
  }

  const Network = {
    view() {
      return m('small.network-status', networkStatus)
    },
  }

  Object.keys(networkEventMap).forEach((event) => {
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
      return m('main', [
        m('header.status', [m(SaveStatus), m(Network)]),
        m('section.editor-wrapper', [
          m('.paper', [
            m('.paper', [
              m('.paper', [
                m(Editor, {
                  id,
                  socket,
                  onSaveStatusChange: (saving: boolean) => {
                    isSaving = saving
                    m.redraw()
                  },
                  onFocus,
                  onBlur,
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
