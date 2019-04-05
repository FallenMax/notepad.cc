import * as WsServer from 'socket.io'
import { registerNoteSocketApis } from '../controller/note'

export const createWebsocketServer = () => {
  const wsServer = WsServer()

  registerNoteSocketApis(wsServer)

  return wsServer
}
