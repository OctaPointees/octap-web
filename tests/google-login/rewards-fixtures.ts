import { expect, type Page, type Route } from '@playwright/test';

/** Shared by the Rewards specs: a stand-in for Core's console routes, and a signed-in session. */

export type Voucher = Record<string, unknown> & {
  id: string;
  status: string;
  publishStatus: string;
};

export const ORG = 'org-1';

export function voucher(overrides: Partial<Voucher> = {}): Voucher {
  return {
    id: 'voucher-1',
    organizationId: ORG,
    code: 'FREE-LATTE',
    title: 'A free latte',
    description: null,
    pointsCost: 500,
    discountType: 'FREE_ITEM',
    discountValue: null,
    terms: { schema: 'octap.benefit.v1', kind: 'FREE_ITEM', item: 'Latte' },
    publishStatus: 'NOT_PUBLISHED',
    suiTermsId: null,
    totalSupply: 10,
    perMemberLimit: null,
    claimedCount: 0,
    status: 'DRAFT',
    startsAt: null,
    expiresAt: '2027-12-31T16:59:59.000Z',
    validForDays: null,
    metadata: null,
    createdAt: '2026-11-13T00:00:00.000Z',
    updatedAt: '2026-11-13T00:00:00.000Z',
    ...overrides,
  };
}

/** What Core says about the organization; a test may change it, and the next read sees that. */
export interface OrgOptions {
  voucherApprovalRequired?: boolean;
  /** The team, as an Owner lists it. */
  staff?: { id: string; fullName: string }[];
}

/** Signs in as `persona` (user `u1`) of one organization, then opens Rewards from the sidebar. */
export async function openRewards(
  page: Page,
  persona: 'BUSINESS_OWNER' | 'BUSINESS_DEVELOPER',
  vouchers: (route: Route) => Promise<void> | void,
  org: OrgOptions = {},
  batches: (route: Route) => Promise<void> | void = (route) => route.fulfill({ json: [] }),
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
        voucherApprovalRequired: org.voucherApprovalRequired ?? false,
      },
    }),
  );
  for (const path of ['invitations', 'api-credentials'])
    await page.route(`**/v1/console/organizations/${ORG}/${path}`, (route) =>
      route.fulfill({ json: [] }),
    );
  await page.route(`**/v1/console/organizations/${ORG}/staff`, (route) =>
    route.fulfill({
      json: (org.staff ?? []).map((person) => ({
        ...person,
        email: `${person.id}@example.com`,
        persona: 'BUSINESS_DEVELOPER',
        status: 'ACTIVE',
      })),
    }),
  );
  await page.route(`**/v1/console/organizations/${ORG}/vouchers**`, vouchers);
  // Import batches (OCT-303/OCT-304); the Rewards page reads them for its banner.
  await page.route(`**/v1/console/organizations/${ORG}/voucher-batches**`, batches);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  // An Owner lands in /merchant, a Business Developer in /developer: both have a Rewards link.
  // An Owner's link also counts the rewards waiting for approval.
  await page.getByRole('link', { name: /^Rewards\s*\d*$/ }).click();
  await expect(page).toHaveURL(
    persona === 'BUSINESS_OWNER' ? /\/merchant\/rewards$/ : /\/developer\/rewards$/,
  );
  await expect(page.getByRole('heading', { name: 'Rewards' })).toBeVisible();
}

/**
 * Answers the list and single reads from `store`, and records each POST/PATCH body. A PATCH is
 * applied to the stored reward, as Core would.
 */
export function catalog(store: Voucher[], bodies: Record<string, unknown>[]) {
  return (route: Route) => {
    const method = route.request().method();
    const id = new URL(route.request().url()).pathname.split('/vouchers/')[1];
    if (method === 'POST' || method === 'PATCH') {
      const body = route.request().postDataJSON();
      bodies.push(body);
      const saved = voucher({ ...store[0], ...body, id: store[0]?.id ?? 'voucher-new' });
      if (method === 'PATCH' && store[0]) store[0] = saved;
      return route.fulfill({ status: method === 'POST' ? 201 : 200, json: saved });
    }
    if (id) return route.fulfill({ json: store.find((v) => v.id === id) });
    return route.fulfill({ json: store });
  };
}
