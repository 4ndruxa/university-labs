import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Відносні шляхи — для GitHub Pages
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
