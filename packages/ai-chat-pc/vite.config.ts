import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

const isAnalyze = process.env.ANALYZE === 'true'

function isPathIn(id: string, segments: string[]) {
  return segments.every((segment) => id.includes(segment))
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
            if (isPathIn(id, ['src', 'pages', 'SharedChat'])) {
              return 'page-shared-chat'
            }

            if (isPathIn(id, ['src', 'pages', 'Agents'])) {
              return 'page-agents'
            }

            if (isPathIn(id, ['src', 'pages', 'ConversationDetail'])) {
              return 'page-conversation-detail'
            }

            return undefined
          }

          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react'
          }

          if (id.includes('antd') || id.includes('@ant-design')) {
            return 'vendor-antd'
          }

          if (id.includes('dayjs')) {
            return 'vendor-dayjs'
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
