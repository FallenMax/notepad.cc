const router = require('koa-router')()
const notes = require('../service/note')

router.get('/', async function(ctx, next) {
  await ctx.redirect(notes.randomId())
})

router.get('/:id', async function(ctx, next) {
  const id = ctx.params.id
  await ctx.render('app.html', { id })
})

module.exports = router
