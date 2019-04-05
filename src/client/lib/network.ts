export type NetworkEvent =
  | 'connect'
  | 'reconnect'
  | 'reconnect_attempt'
  | 'connect_error'
  | 'connect_timeout'
  | 'reconnect_error'
  | 'reconnect_failed'

export const networkEventMap: { [K in NetworkEvent]: string } = {
  connect: '',
  reconnect: '',
  reconnect_attempt: 'connection lost',
  connect_error: 'connection lost',
  connect_timeout: 'connection lost',
  reconnect_error: 'connection lost',
  reconnect_failed: 'connection lost',
}
