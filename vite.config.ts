import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Read API_PORT from .env so the proxy follows the API server. Nothing from .env reaches the
  // browser: only variables prefixed with VITE_ are ever exposed to client code.
  const env = loadEnv(mode, import.meta.dirname, '');
  const api = `http://localhost:${env.API_PORT || 4000}`;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // The API and uploaded photos are served by the Express server (npm run dev:api)
      proxy: {
        '/api': { target: api, changeOrigin: false },
        '/uploads': { target: api, changeOrigin: false },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
