import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const server = await createServer({ configFile: false, server: { middlewareMode: true } });
after(() => server.close());
const { authService } = await server.ssrLoadModule('/src/services/auth.service.ts');
const { adminService } = await server.ssrLoadModule('/src/services/admin.service.ts');
const { sessionStore } = await server.ssrLoadModule('/src/services/session.ts');
const { settings } = await server.ssrLoadModule('/src/services/mock/http.ts');
settings.latency = [0, 0];

test('admin authentication and overview respect session boundaries', async () => {
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
