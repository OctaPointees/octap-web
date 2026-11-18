import { expect, test, type Page } from '@playwright/test';

/**
 * Reloading the portal: the Google ID token is never stored, so a reload asks Google for a
 * fresh one silently (automatic sign-in) and returns to the same page and organization.
 */

const identity = {
  user: {
    id: 'u1',
    email: 'owner@example.com',
    fullName: 'Test Person',
    avatarUrl: null,
    systemRole: 'SYSTEM_USER',
  },
  organizations: [
    { organizationId: 'org-1', name: 'Owner business', slug: 'owner', persona: 'BUSINESS_OWNER' },
    {
      organizationId: 'org-2',
      name: 'Coffee shop',
      slug: 'coffee',
      persona: 'BUSINESS_DEVELOPER',
    },
  ],
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
};

/**
 * Stands in for Google and Core. `google.signedIn` says whether Google can sign the user in
 * silently on the next load; `events` records what the page asked Google for.
 */
async function setUp(page: Page) {
  const google = { signedIn: true };
  const events: string[] = [];
  let logins = 0;
  await page.exposeFunction('gisEvent', (event: string) => events.push(event));
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
    let options;
    const token = () => 'header.' + btoa(JSON.stringify({ nonce: options.nonce })) + '.signature';
    window.google = { accounts: { id: {
      initialize(value) { options = value; },
      renderButton(element) {
        const button = document.createElement('button'); button.textContent = 'Continue with Google';
        button.onclick = () => options.callback({ credential: token() });
        element.append(button);
      },
      prompt(listener) {
        window.gisEvent('prompt auto_select=' + options.auto_select);
        setTimeout(() => ${google.signedIn}
          ? options.callback({ credential: token() })
          : listener({ isSkippedMoment: () => true }), 50);
      },
      cancel() {},
      disableAutoSelect() { window.gisEvent('disableAutoSelect'); },
    } } };`,
    }),
  );
  await page.route('**/v1/console/auth/google', (route) => {
    logins += 1;
    return route.fulfill({ json: identity });
  });
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/organization-requests', (route) => route.fulfill({ json: [] }));
  for (const org of identity.organizations) {
    await page.route(`**/v1/console/organizations/${org.organizationId}`, (route) =>
      route.fulfill({
        json: {
          id: org.organizationId,
          name: org.name,
          slug: org.slug,
          status: 'ACTIVE',
          persona: org.persona,
          legalName: null,
          taxId: null,
        },
      }),
    );
    for (const path of ['staff', 'invitations', 'api-credentials'])
      await page.route(`**/v1/console/organizations/${org.organizationId}/${path}`, (route) =>
        route.fulfill({ json: [] }),
      );
  }
  return { google, events, logins: () => logins };
}

/** Signs in with the button, picks the Developer organization and opens API keys. */
async function signInToApiKeys(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await page.getByRole('button', { name: 'Open Coffee shop' }).click();
  await expect(page).toHaveURL(/\/developer$/);
  await page.getByRole('link', { name: 'API keys', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'API keys' })).toBeVisible();
}

test('a first visit shows the Google button without prompting Google', async ({ page }) => {
  const { events } = await setUp(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  expect(events).toEqual([]);
});

test('a reload signs in silently and stays on the same page and organization', async ({ page }) => {
  const { events, logins } = await setUp(page);
  await signInToApiKeys(page);
  expect(logins()).toBe(1);

  await page.reload();
  await expect(page).toHaveURL(/\/developer\/api-keys$/);
  await expect(page.getByRole('heading', { name: 'API keys' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Switch organization/ })).toContainText(
    'Coffee shop',
  );
  expect(events).toEqual(['prompt auto_select=true']);
  expect(logins()).toBe(2);
  // Only a flag and the organization id are stored: never the Google credential.
  const storage = await page.evaluate(() =>
    JSON.stringify([{ ...localStorage }, { ...sessionStorage }]),
  );
  expect(storage).not.toContain('signature');
  expect(storage).toContain('org-2');
});

test('after signing out, a reload shows the login page and Google is told not to auto-select', async ({
  page,
}) => {
  const { events } = await setUp(page);
  await signInToApiKeys(page);
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  expect(events).toEqual(['disableAutoSelect']);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  expect(events).toEqual(['disableAutoSelect']);
});

test('when Google cannot sign in silently, a reload falls back to the login page', async ({
  page,
}) => {
  const { google, events } = await setUp(page);
  await signInToApiKeys(page);
  google.signedIn = false;

  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  expect(events).toEqual(['prompt auto_select=true']);
  // The flag is cleared, so the next load does not try again.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  expect(events).toEqual(['prompt auto_select=true']);
});
