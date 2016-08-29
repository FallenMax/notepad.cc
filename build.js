 const path = require('path')
 const swPrecache = require('sw-precache')
 const rootDir = 'public'

 module.exports = function(cb) {
   swPrecache.write(path.join(rootDir, 'service-worker.js'), {
     staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
     stripPrefix: rootDir,
     handleFetch: process.env.NODE_ENV === 'production'
   }, cb)
 }
