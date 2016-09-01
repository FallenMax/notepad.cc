export default function startMonitorNetwork({ socket }) {
  const events = {
    'connect': '',
    'reconnect': '',
    'reconnect_attempt': 'connection lost',
    'connect_error': 'connection lost',
    'connect_timeout': 'connection lost',
    'reconnect_error': 'connection lost',
    'reconnect_failed': 'connection lost',
  }
  const status = document.getElementById('network-status')

  Object.keys(events).forEach(evt =>
    socket.on(evt, () => {
      status.textContent = events[evt]
    })
  )
}
