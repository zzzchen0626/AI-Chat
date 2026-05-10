import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

const isAnalyze = process.env.ANALYZE === 'true'

function isAnyPathIn(id: string, segments: string[]) {
  return segments.some((segment) => id.includes(segment))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    isAnalyze &&
      visualizer({
        filename: 'dist/bundle-analyzer.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@pc': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (isAnyPathIn(id, ['react', 'react-dom', 'react-router-dom'])) {
            return 'vendor-react'
          }

          if (isAnyPathIn(id, ['antd', '@ant-design', 'rc-', '@rc-component'])) {
            return 'vendor-antd'
          }

          if (
            isAnyPathIn(id, [
              'react-markdown',
              'remark-',
              'rehype-',
              'unified',
              'micromark',
              'mdast',
              'hast',
              'highlight.js'
            ])
          ) {
            return 'vendor-markdown'
          }

          if (id.includes('react-virtuoso')) {
            return 'vendor-virtuoso'
          }

          if (id.includes('axios') || id.includes('event-source-polyfill')) {
            return 'vendor-network'
          }

          return 'vendor'
        }
      }
    }
  }
})
