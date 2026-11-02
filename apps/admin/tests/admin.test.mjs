import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const server = await createServer({
  configFile: false,
  envDir: false,
  define: { 'import.meta.env.VITE_ENABLE_DEMO_AUTH': JSON.stringify('true') },
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, ws: false },
});
after(() => server.close());
const { authService } = await server.ssrLoadModule('/src/services/auth.service.ts');
const { adminService } = await server.ssrLoadModule('/src/services/admin.service.ts');
const { sessionStore } = await server.ssrLoadModule('/src/services/session.ts');
const { settings } = await server.ssrLoadModule('/src/services/mock/http.ts');
settings.latency = [0, 0];

test('admin authentication and overview respect session boundaries', async () => {
  assert.equal(
    storage.has('octap.admin.mockdb'),
    false,
    'Importing demo services must not seed storage',
  );
  await assert.rejects(adminService.getOverview('7d'), { status: 401 });
  await assert.rejects(
    authService.login({ email: 'owner@lotusmart.vn', password: 'octap123', remember: false }),
    { status: 401 },
  );
  await assert.rejects(
    authService.login({ email: 'admin@octap.io', password: 'wrong', remember: false }),
    { status: 401 },
  );
  const session = await authService.login({
    email: 'admin@octap.io',
    password: 'octap123',
    remember: false,
  });
  assert.equal(session.user.role, 'admin');
  for (const range of ['7d', '30d', '90d']) {
    const overview = await adminService.getOverview(range);
    assert.ok(overview.series.length > 0);
    assert.ok(overview.totalMembers > 0);
  }
  assert.ok(storage.has('octap.admin.session'));
  assert.equal(storage.has('octap.session'), false);
  sessionStore.set({ ...session, expiresAt: new Date(0).toISOString() });
  await assert.rejects(adminService.getOverview('7d'), { status: 401 });
  await authService.logout();
  assert.equal(sessionStore.get(), null);
  assert.equal(storage.has('octap.admin.session'), false);
  await assert.rejects(adminService.getOverview('7d'), { status: 401 });
});

for (const app of ['admin', 'business']) {
  test(`${app} real mode never initializes, reads or resets demo data`, async (t) => {
    storage.clear();
    const key = app === 'admin' ? 'octap.admin.mockdb' : 'octap.mockdb';
    const realServer = await createServer({
      root: fileURLToPath(new URL(`../../${app}/`, import.meta.url)),
      configFile: false,
      envDir: false,
      define: { 'import.meta.env.VITE_ENABLE_DEMO_AUTH': JSON.stringify('false') },
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, ws: false },
    });
    t.after(() => realServer.close());
    const db = await realServer.ssrLoadModule('/src/services/mock/db.ts');
    assert.equal(storage.has(key), false);
    storage.set(key, 'existing demo data');
    assert.throws(() => db.getDb(), /Demo data is disabled/);
    assert.throws(() => db.resetDb(), /Demo data is disabled/);
    db.commit();
    assert.equal(storage.get(key), 'existing demo data');
    const { simulate } = await realServer.ssrLoadModule('/src/services/mock/http.ts');
    let called = false;
    await assert.rejects(
      simulate('POST /test', () => {
        called = true;
      }),
      { status: 503 },
    );
    assert.equal(called, false, 'Real mode must never execute a mock mutation');
  });
}
