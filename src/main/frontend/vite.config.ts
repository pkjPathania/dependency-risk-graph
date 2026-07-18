import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: '/',
  cacheDir: '/private/tmp/dependency-risk-graph-frontend-vite-cache',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '/private/tmp/dependency-risk-graph-frontend/generated-resources/frontend/static',
    emptyOutDir: true
  }
});
