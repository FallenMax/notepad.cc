export type SocketFunction<Params = any, Result = any> = (
  params: Params,
  socket: SocketIO.Socket,
) => Result extends undefined
  ? Result | Promise<Result> | void | Promise<void>
  : Result | Promise<Result>

export const registerSocketApi = (
  socket: SocketIO.Socket,
  apis: Record<string, SocketFunction>,
): void => {
  Object.keys(apis).forEach((path) => {
    socket.on(path, async (params, reply) => {
      try {
        reply(await apis[path](params, socket))
      } catch (error) {
        console.warn(
          `[socket] error handleing: ${path} with params:`,
          JSON.stringify(params),
        )
        console.error(error)
        reply({ error })
      }
    })
  })
}
