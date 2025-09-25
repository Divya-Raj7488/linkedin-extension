import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [svelte({ emitCss: false }), tailwindcss(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        dashboard: 'dashboard/dashboard.ts',
        background: 'src/background/background.ts',
        content: 'src/content/content.ts',
        popup: 'src/popup/popup.ts'
      }
    }
  }
})
