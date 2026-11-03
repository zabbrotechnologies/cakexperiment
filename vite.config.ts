import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { handleNeonApi } from './server/neonApi.ts'

function neonPlugin(): Plugin {
  return {
    name: 'neon-api-middleware',
    configureServer(server) {
      server.middlewares.use(handleNeonApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleNeonApi);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), neonPlugin()],
})
