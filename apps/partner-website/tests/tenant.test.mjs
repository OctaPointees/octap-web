import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { tenantSlug, resolveTenant, getTenants } from '../src/lib/tenant.ts';

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
});

test('resolves one tenant label under the exact root domain', () => {
  assert.equal(tenantSlug('OCTAP-DEMO.localhost:4001', 'localhost'), 'octap-demo');
  assert.equal(tenantSlug('acme.rewards.example.com', 'rewards.example.com'), 'acme');
  for (const host of [
    'localhost',
    'evil-localhost',
    'acme.localhost.evil.com',
    'a.b.localhost',
    '-bad.localhost',
  ]) {
    assert.equal(tenantSlug(host, 'localhost'), null);
  }
});

test('unknown stores are never assigned a fallback tenant', () => {
  process.env.PARTNER_ROOT_DOMAIN = 'localhost';
  process.env.NODE_ENV = 'development';
  delete process.env.PARTNER_TENANTS_JSON;
  assert.equal(resolveTenant('unknown.localhost:4001'), undefined);
  assert.equal(
    resolveTenant('octap-demo.localhost:4001').organizationId,
    '11111111-1111-4111-8111-111111111111',
  );
});

test('production requires an explicit registry', () => {
  process.env.NODE_ENV = 'production';
  delete process.env.PARTNER_TENANTS_JSON;
  assert.deepEqual(getTenants(), []);
});

test('plain localhost can select a configured store only in development', () => {
  process.env.NODE_ENV = 'development';
  process.env.DEV_TENANT_SLUG = 'octap-demo';
  delete process.env.PARTNER_TENANTS_JSON;
  assert.equal(resolveTenant('localhost:4001')?.slug, 'octap-demo');
  assert.equal(resolveTenant('unknown.localhost:4001'), undefined);
  process.env.DEV_TENANT_SLUG = 'missing';
  assert.equal(resolveTenant('localhost:4001'), undefined);
  process.env.DEV_TENANT_SLUG = 'octap-demo';
  const registry = getTenants();
  process.env.PARTNER_TENANTS_JSON = JSON.stringify(registry);
  process.env.NODE_ENV = 'production';
  assert.equal(resolveTenant('localhost:4001'), undefined);
});

test('server registry supports different tenants and rejects duplicate or invalid records', () => {
  process.env.NODE_ENV = 'development';
  delete process.env.PARTNER_TENANTS_JSON;
  const tenant = getTenants()[0];
  process.env.PARTNER_TENANTS_JSON = JSON.stringify([
    tenant,
    { ...tenant, slug: 'another-store', theme: 'forest' },
  ]);
  assert.equal(getTenants()[1].theme, 'forest');
  process.env.PARTNER_TENANTS_JSON = JSON.stringify([tenant, tenant]);
  assert.throws(getTenants, /duplicate/);
  process.env.PARTNER_TENANTS_JSON = JSON.stringify([{ ...tenant, organizationId: 'not-a-uuid' }]);
  assert.throws(getTenants, /Invalid/);
});
