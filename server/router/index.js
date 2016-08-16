const router = require('koa-router')()
const notes = require('../service/note')

router
  .get('/', async (ctx, next) => {
    await ctx.redirect(notes.randomId());
  })
  .get('/:id', async (ctx, next) => {
    let id = ctx.params.id
    let note = await notes.find({ id })
    let { host, port } = ctx.config
    await ctx.render('app.html', {
      id,
      url: `http://${host}${port == 80 ? '' : ':'+port}/${id}`,
      note: note && note.note || ''
    });
  })


module.exports = router
