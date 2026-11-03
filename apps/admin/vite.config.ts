import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    proxy: {
      '/v1': {
        target: loadEnv(mode, process.cwd(), '').CORE_API_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), tailwindcss(), babel({ presets: [reactCompilerPreset()] })],
}));
