import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import type { Connect } from 'vite'

/**
 * Middleware that serves local files via /local-file/<absolute-path>.
 * This allows the browser to display images stored on disk
 * (which are blocked by default when using file:// URLs).
 */
function localFileMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const prefix = '/local-file/'
    if (!req.url?.startsWith(prefix)) return next()

    const filePath = decodeURIComponent(req.url.slice(prefix.length))
    const resolved = path.resolve(filePath)

    if (!fs.existsSync(resolved)) {
      res.statusCode = 404
      res.end('Not found')
      return
    }

    const ext = path.extname(resolved).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
    }

    res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream')
    fs.createReadStream(resolved).pipe(res)
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    {
      name: 'local-file-server',
      configureServer(server) {
        server.middlewares.use(localFileMiddleware())
      },
    },
  ],
})
