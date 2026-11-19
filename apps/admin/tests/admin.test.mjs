import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
// The demo password login and its session test went with demo mode (#29). Only admin still
// ships mock services, so this checks that real mode never touches them.
test('admin real mode never initializes, reads or resets demo data', async (t) => {
  storage.clear();
  const key = 'octap.admin.mockdb';
  const realServer = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
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
