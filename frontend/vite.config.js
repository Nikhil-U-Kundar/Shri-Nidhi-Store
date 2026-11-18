import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

/** Short commit hash and build date, shown at the bottom of every page to confirm what is deployed. */
function buildLabel() {
  let commit = 'local'
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    /* not a git checkout (e.g. a source archive) */
  }
  const date = new Date().toISOString().slice(0, 10)
  return `${commit} · ${date}`
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_BUILD__: JSON.stringify(buildLabel()),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
