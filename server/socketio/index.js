const IO = require('koa-socket')
const notes = require('../service/note')

module.exports = app => {

  const io = new IO()
  io.attach(app)
  io.use(async (ctx, next) => {
    ctx.data = JSON.parse(ctx.data)
    await next()
  })
  io.on('save', async (ctx) => {
    let { id, note } = ctx.data
    console.info(`saving note for: ${id}`);
    await notes.upsert({ id, note })
    ctx.acknowledge({ code: 'success'})
  })

}
