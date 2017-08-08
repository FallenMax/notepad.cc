const socket = require('socket.io-client')()
const Editor = require('./component/editor')
const m = require('mithril')
const id = window.id
const href = location.href

const App = {
  networkStatus: '',
  saveStatusClass: '',
  saveStatusTimer: null,

  oninit() {
    // monitor network
    const events = {
      connect: '',
      reconnect: '',
      reconnect_attempt: 'connection lost',
      connect_error: 'connection lost',
      connect_timeout: 'connection lost',
      reconnect_error: 'connection lost',
      reconnect_failed: 'connection lost'
    }
    Object.keys(events).forEach(evt =>
      socket.on(evt, () => {
        this.networkStatus = events[evt]
        m.redraw()
      })
    )
  },

  onSaveStatusChange(isSaving) {
    clearTimeout(this.saveStatusTimer)
    if (isSaving) {
      this.saveStatusClass = 'show'
      m.redraw()
    } else {
      this.saveStatusTimer = setTimeout(() => {
        this.saveStatusClass = ''
        m.redraw()
      }, 300)
    }
  },

  view() {
    return m(
      'main',
      m('header', [
        m('small#save-status', { class: this.saveStatusClass }, 'saving'),
        m('small#network-status', this.networkStatus)
      ]),
      m(
        'section',
        m(
          '.layer',
          m(
            '.layer',
            m(
              '.layer',
              m(Editor, {
                socket,
                id,
                onStatusChange: this.onSaveStatusChange.bind(this)
              })
            )
          )
        )
      ),
      m('footer', m('small', m('a.this-page', { href }, href)))
    )
  }
}

m.mount(document.body, App)
