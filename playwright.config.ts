import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/google-login',
  use: { browserName: 'chromium', baseURL: 'http://localhost:5180', headless: true },
  webServer: [
    {
      command: 'npm run dev -w @octap/business -- --host localhost --port 5180 --strictPort',
      url: 'http://localhost:5180',
      env: {
        VITE_GOOGLE_CLIENT_ID: 'fixture.apps.googleusercontent.com',
        VITE_CORE_API_URL: '',
        VITE_ENABLE_DEMO_AUTH: 'false',
      },
    },
    {
      command: 'npm run dev -w @octap/admin -- --host localhost --port 5181 --strictPort',
      url: 'http://localhost:5181',
      env: {
        VITE_GOOGLE_CLIENT_ID: 'fixture.apps.googleusercontent.com',
        VITE_CORE_API_URL: '',
        VITE_ENABLE_DEMO_AUTH: 'false',
      },
    },
    {
      command: 'npm run dev -w @octap/business -- --host localhost --port 5182 --strictPort',
      url: 'http://localhost:5182',
      env: { VITE_ENABLE_DEMO_AUTH: 'true' },
    },
  ],
});
