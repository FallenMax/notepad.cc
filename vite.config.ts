import { join } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: join(__dirname, 'public'),
    emptyOutDir: true,
    // 配置静态资源的处理方式
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.originalFileNames?.[0]
          // 对于 assets 目录下的文件保持原始文件名
          if (fileName && fileName.startsWith('assets/')) {
            return 'assets/[name][extname]'
          }
          // 其他资源使用默认的hash命名
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },

  server: {
    host: '0.0.0.0',
    cors: true,
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:3333',
        ws: true,
        rewriteWsOrigin: true,
      },
      '/assets/manifest.webmanifest': {
        target: 'http://localhost:3333',
      },
      '/assets/sw.js': {
        target: 'http://localhost:3333',
      },
    },
  },
})
