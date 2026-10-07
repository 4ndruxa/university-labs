import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// base: './' — збірка працює з будь-якої теки (зокрема на GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
