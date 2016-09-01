const router = require('koa-router')()
const notes = require('../service/note')

router
  .get('/', async function(ctx, next) {
    await ctx.redirect(notes.randomId());
  })
  .get('/:id', async function(ctx, next) {
    let id = ctx.params.id
    let { note } = await notes.find({ id }) || { note: '' }
    await ctx.render('app.html', { id, note });
  })


module.exports = router
