import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: "./",
  build: {
    outDir: "dist-react"
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
