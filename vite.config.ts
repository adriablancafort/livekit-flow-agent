import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    ssr: 'src/main.ts',
    target: 'node18',
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
});
