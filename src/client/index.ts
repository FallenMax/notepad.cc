import m from 'mithril'
import SocketClient from 'socket.io-client'
import { Editor } from './component/editor'
import './style/main.css'
const socket = SocketClient()

const getId = (): string => {
  return decodeURIComponent(location.pathname.slice(1))
}

const App = {
  id: '',
  networkStatus: '',
  saveStatusClass: '',
  saveStatusTimer: undefined as number | undefined,

  oninit(): void {
    this.id = getId()
    document.title = `${this.id} · notepad`
    this.startMonitorNetwork()
  },

  startMonitorNetwork() {
    type NetworkEvent =
      | 'connect'
      | 'reconnect'
      | 'reconnect_attempt'
      | 'connect_error'
      | 'connect_timeout'
      | 'reconnect_error'
      | 'reconnect_failed'
    const events: { [key in NetworkEvent]: string } = {
      connect: '',
      reconnect: '',
      reconnect_attempt: 'connection lost',
      connect_error: 'connection lost',
      connect_timeout: 'connection lost',
      reconnect_error: 'connection lost',
      reconnect_failed: 'connection lost',
    }
    Object.keys(events).forEach(evt =>
      socket.on(evt, () => {
        this.networkStatus = events[evt as NetworkEvent] as string
        m.redraw()
      })
    )
  },

  onSaveStatusChange(isSaving: boolean): void {
    clearTimeout(this.saveStatusTimer)
    if (isSaving) {
      this.saveStatusClass = 'show'
      m.redraw()
    } else {
      this.saveStatusTimer = window.setTimeout(() => {
        this.saveStatusClass = ''
        m.redraw()
      }, 300)
    }
  },

  view() {
    const href = location.origin + '/' + this.id
    return m(
      'main',
      m('header', [
        m('small#save-status', { class: this.saveStatusClass }, 'saving'),
        m('small#network-status', this.networkStatus),
      ]),
      m('section', [
        m('.layer', [
          m('.layer', [
            m('.layer', [
              m(Editor, {
                socket: socket,
                id: this.id,
                onStatusChange: this.onSaveStatusChange.bind(this),
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

m.mount(document.body, App)
