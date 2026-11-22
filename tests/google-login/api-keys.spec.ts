import { expect, test, type Page, type Request } from '@playwright/test';

/** The API keys page against a stand-in for Core's console credential routes. */

type Credential = Record<string, unknown> & { id: string; name: string; status: string };

const ORG = 'org-1';
const BASE = `/v1/console/organizations/${ORG}/api-credentials`;

function credential(overrides: Partial<Credential> = {}): Credential {
  return {
    id: 'cred-1',
    name: 'POS terminal',
    keyPrefix: 'oct_live_ab12',
    scopes: ['read'],
    status: 'ACTIVE',
    createdAt: '2026-11-13T00:00:00.000Z',
    lastUsedAt: null,
    ...overrides,
  };
}

/** Signs in as `persona`, then opens API keys; `store` is the stand-in for Core's credentials. */
async function openApiKeys(
  page: Page,
  persona: 'BUSINESS_OWNER' | 'BUSINESS_DEVELOPER',
  store: Credential[],
  calls: Request[] = [],
) {
  const identity = {
    user: {
      id: 'u1',
      email: 'owner@example.com',
      fullName: 'Owner',
      avatarUrl: null,
      systemRole: 'SYSTEM_USER',
    },
    organizations: [{ organizationId: ORG, name: 'Coffee shop', slug: 'coffee', persona }],
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  };
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
    let options;
    window.google = { accounts: { id: {
      initialize(value) { options = value; },
      renderButton(element) {
        const button = document.createElement('button'); button.textContent = 'Continue with Google';
        button.onclick = () => options.callback({ credential: 'header.' + btoa(JSON.stringify({ nonce: options.nonce })) + '.signature' });
        element.append(button);
      },
      disableAutoSelect() {},
    } } };`,
    }),
  );
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/organization-requests', (route) => route.fulfill({ json: [] }));
  await page.route(`**/v1/console/organizations/${ORG}`, (route) =>
    route.fulfill({
      json: {
        id: ORG,
        name: 'Coffee shop',
        slug: 'coffee',
        status: 'ACTIVE',
        persona,
        legalName: null,
        taxId: null,
      },
    }),
  );
  for (const path of ['staff', 'invitations'])
    await page.route(`**/v1/console/organizations/${ORG}/${path}`, (route) =>
      route.fulfill({ json: [] }),
    );
  await page.route(
    (url) => url.pathname.startsWith(BASE),
    (route) => {
      const request = route.request();
      calls.push(request);
      const id = decodeURIComponent(new URL(request.url()).pathname.slice(BASE.length + 1));
      const method = request.method();
      if (method === 'GET') return route.fulfill({ json: store });
      if (method === 'POST') {
        const body = request.postDataJSON();
        const issued = credential({
          id: `cred-${store.length + 1}`,
          name: body.name,
          scopes: [body.scope ?? 'read'],
        });
        store.push(issued);
        return route.fulfill({ status: 201, json: { ...issued, rawKey: 'oct_live_SECRET' } });
      }
      const target = store.find((item) => item.id === id);
      if (!target) return route.fulfill({ status: 404, json: { message: 'Not found' } });
      if (method === 'PATCH') {
        target.name = request.postDataJSON().name;
        return route.fulfill({ json: target });
      }
      target.status = 'REVOKED';
      return route.fulfill({ json: { revoked: true } });
    },
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(persona === 'BUSINESS_OWNER' ? /\/merchant$/ : /\/developer$/);
  if (persona === 'BUSINESS_OWNER')
    await page.getByRole('link', { name: 'API credentials' }).click();
  else await page.getByRole('link', { name: 'API keys', exact: true }).click();
  await expect(page).toHaveURL(/\/developer\/api-keys$/);
  await expect(page.getByRole('heading', { name: 'API keys' })).toBeVisible();
}

test('an Owner creates a write key and sees its secret once', async ({ page }) => {
  const store: Credential[] = [];
  const calls: Request[] = [];
  await openApiKeys(page, 'BUSINESS_OWNER', store, calls);
  await expect(page.getByText('No API keys yet')).toBeVisible();
  // The page loads the list once: the console session no longer fetches it as well. In dev,
  // StrictMode remounts the page and cancels its first request, so count only completed ones.
  expect(calls.filter((call) => call.method() === 'GET' && !call.failure())).toHaveLength(1);

  await page.getByRole('button', { name: 'Create key' }).first().click();
  await page.getByLabel('Key name').fill('  Production backend  ');
  await page.getByLabel('Access scope').selectOption('write');
  await page.getByRole('dialog').getByRole('button', { name: 'Create key' }).click();

  await expect(page.getByText('oct_live_SECRET')).toBeVisible();
  expect(calls.find((call) => call.method() === 'POST')?.postDataJSON()).toEqual({
    name: 'Production backend',
    scope: 'write',
  });
  await page.getByRole('button', { name: 'I’ve saved it' }).click();
  await expect(page.getByText('oct_live_SECRET')).toHaveCount(0);
  await expect(page.getByRole('row', { name: /Production backend/ })).toContainText('write');

  // The next key starts from read-only again.
  await page.getByRole('button', { name: 'Create key' }).first().click();
  await expect(page.getByLabel('Access scope')).toHaveValue('read');
});

test('a key can be renamed and revoked', async ({ page }) => {
  const store = [credential()];
  await openApiKeys(page, 'BUSINESS_OWNER', store);
  const row = page.getByRole('row', { name: /POS terminal/ });
  await expect(row).toContainText('Never');

  await page.getByRole('button', { name: 'Rename POS terminal' }).click();
  await page.getByLabel('Key name').fill('Front counter');
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByRole('row', { name: /Front counter/ })).toBeVisible();

  await page.getByRole('button', { name: 'Revoke Front counter' }).click();
  await page.getByRole('button', { name: 'Revoke key' }).click();
  await expect(page.getByRole('row', { name: /Front counter/ })).toContainText('Revoked');
  await expect(page.getByRole('button', { name: 'Revoke Front counter' })).toHaveCount(0);
});

test('a Business Developer can only create read keys and cannot manage write keys', async ({
  page,
}) => {
  const store = [
    credential({ id: 'cred-w', name: 'Owner key', scopes: ['read', 'write'] }),
    credential({ id: 'cred-r', name: 'Dev key' }),
  ];
  await openApiKeys(page, 'BUSINESS_DEVELOPER', store);
  await expect(page.getByRole('button', { name: 'Rename Owner key' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Revoke Owner key' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Revoke Dev key' })).toBeVisible();

  await page.getByRole('button', { name: 'Create key' }).first().click();
  await expect(page.getByLabel('Access scope').locator('option')).toHaveText(['Read only']);
  await expect(page.getByText('Only an owner can create a key with write access.')).toBeVisible();
});

test('scopes sent as a string and missing dates still render', async ({ page }) => {
  const store = [credential({ scopes: 'read write', createdAt: undefined, lastUsedAt: undefined })];
  await openApiKeys(page, 'BUSINESS_OWNER', store);
  const row = page.getByRole('row', { name: /POS terminal/ });
  await expect(row).toContainText('write');
  await expect(row).toContainText('Unknown');
  await expect(row).not.toContainText('Invalid');
});
