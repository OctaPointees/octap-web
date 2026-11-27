import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const core = {
    target: loadEnv(mode, process.cwd(), '').CORE_API_URL || 'http://127.0.0.1:3000',
    changeOrigin: true,
  };
  return {
    server: {
      proxy: {
        '/v1': core,
        '/health': core,
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
