import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` matches the GitHub Pages path: https://paulicydebate.github.io/FingerFinder/
export default defineConfig({
  base: '/FingerFinder/',
  plugins: [react()],
})
