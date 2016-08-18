const router = require('koa-router')()
const notes = require('../service/note')

router
  .get('/', async (ctx, next) => {
    await ctx.redirect(notes.randomId());
  })
  .get('/:id', async (ctx, next) => {
    let id = ctx.params.id
    let note = await notes.find({ id })
    let { host, port } = ctx.config.remote
    await ctx.render('app.html', {
      id,
      host,
      url: `http://${host}${port == 80 ? '' : (':'+port)}/${id}`,
      note: note && note.note || '',
      dev: process.env.NODE_ENV === 'dev'
    });
  })


module.exports = router
