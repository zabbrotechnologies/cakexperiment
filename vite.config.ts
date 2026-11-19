import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
function neonPlugin(): Plugin {
  return {
    name: 'neon-api-middleware',
    async configureServer(server) {
      const { handleNeonApi } = await import('./server/neonApi.ts');
      server.middlewares.use(handleNeonApi);
    },
    async configurePreviewServer(server) {
      const { handleNeonApi } = await import('./server/neonApi.ts');
      server.middlewares.use(handleNeonApi);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), neonPlugin()],
  optimizeDeps: {
    exclude: ['playwright', '@playwright/test']
  }
})
