import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
const data = new Map();
const storage = {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, value),
  removeItem: (key) => data.delete(key),
};
globalThis.localStorage = storage;
globalThis.sessionStorage = storage;
const server = await createServer({ configFile: false, server: { middlewareMode: true } });
after(() => server.close());
const auth = await server.ssrLoadModule('/src/auth.ts');
const demo = await server.ssrLoadModule('/src/services/demo.ts');

test('demo roles reject tampered sessions and restrict developer/admin access', () => {
  assert.equal(auth.authenticate('owner@lotusmart.vn', 'wrong'), null);
  assert.equal(auth.authenticate('owner@lotusmart.vn', 'octap123'), 'owner');
  auth.setSession('cashier');
  assert.equal(auth.getSession(), 'cashier');
  assert.equal(auth.canAccess('cashier', 'developer'), false);
  assert.equal(auth.canAccess('owner', 'developer'), true);
  assert.equal(auth.canAccess('manager', 'developer'), true);
  assert.equal(auth.canAccess('owner', 'admin'), false);
  assert.equal(auth.canAccess('admin', 'business'), false);
  assert.equal(auth.canAccess('admin', 'admin'), true);
  storage.setItem('octap.role', 'invented');
  assert.equal(auth.getSession(), null);
  auth.clearSession();
  assert.equal(auth.getSession(), null);
});

test('demo keys persist metadata, rotate, and revoke without persisting secrets', () => {
  assert.throws(() => demo.createKey('', ['read']));
  assert.throws(() => demo.createKey('Checkout', []));
  const secret = demo.createKey('Checkout', ['read']);
  const key = demo.demoStore.get().keys.at(-1);
  assert.equal(key.name, 'Checkout');
  assert.equal(storage.getItem('octap.business.demo').includes(secret), false);
  const rotated = demo.rotateKey(key.id);
  assert.notEqual(rotated, secret);
  assert.throws(() => demo.rotateKey(key.id));
  const replacement = demo.demoStore.get().keys.at(-1);
  demo.revokeKey(replacement.id);
  assert.equal(demo.demoStore.get().keys.at(-1).status, 'revoked');
  assert.throws(() => demo.rotateKey(replacement.id));
});

test('demo webhook registration validates HTTPS and supports disabling', () => {
  assert.throws(() => demo.registerHook('http://example.com/hook'));
  assert.throws(() => demo.registerHook('invalid'));
  demo.registerHook('https://example.com/new');
  const hook = demo.demoStore.get().hooks.at(-1);
  assert.equal(hook.enabled, true);
  demo.toggleHook(hook.id);
  assert.equal(demo.demoStore.get().hooks.at(-1).enabled, false);
  const before = demo.demoStore.get();
  const write = storage.setItem;
  storage.setItem = () => {
    throw new Error('Storage full');
  };
  assert.throws(() => demo.toggleHook(hook.id));
  assert.equal(demo.demoStore.get(), before);
  storage.setItem = write;
});
