import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { execSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';

/** The commit this build came from, for the status bar. A deployment without git can set it. */
function buildCommit() {
  if (process.env.VITE_APP_COMMIT) return process.env.VITE_APP_COMMIT.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const core = {
    target: loadEnv(mode, process.cwd(), '').CORE_API_URL || 'http://127.0.0.1:3000',
    changeOrigin: true,
  };
  return {
    define: {
      'import.meta.env.VITE_APP_COMMIT': JSON.stringify(buildCommit()),
    },
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
