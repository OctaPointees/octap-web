import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * OCT-283: the Rewards page against a stand-in for Core's console voucher routes (OCT-236), with
 * OCT-291's per-member limit and validity counted from the day a member claims, and OCT-292's
 * approval before a reward goes live (Core: OCT-59).
 */

type Voucher = Record<string, unknown> & { id: string; status: string; publishStatus: string };

const ORG = 'org-1';

function voucher(overrides: Partial<Voucher> = {}): Voucher {
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
interface OrgOptions {
  voucherApprovalRequired?: boolean;
  /** The team, as an Owner lists it. */
  staff?: { id: string; fullName: string }[];
}

/** Signs in as `persona` (user `u1`) of one organization, then opens Rewards from the sidebar. */
async function openRewards(
  page: Page,
  persona: 'BUSINESS_OWNER' | 'BUSINESS_DEVELOPER',
  vouchers: (route: Route) => Promise<void> | void,
  org: OrgOptions = {},
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

test('an Owner saves a draft built from a template, with ISO dates and benefit terms', async ({
  page,
}) => {
  const created: Record<string, unknown>[] = [];
  const store: Voucher[] = [];
  await openRewards(page, 'BUSINESS_OWNER', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      created.push(body);
      const saved = voucher({
        ...body,
        id: 'voucher-new',
        discountType: body.discountType ?? null,
      });
      store.push(saved);
      return route.fulfill({ status: 201, json: saved });
    }
    return route.fulfill({ json: store });
  });
  await expect(page.getByText('No rewards yet')).toBeVisible();
  await page.getByRole('button', { name: 'New reward' }).click();
  await page.getByRole('button', { name: 'Buy 1 get 1', exact: true }).click();
  await page.getByLabel('Item').fill('Milk tea');
  await page.getByLabel('Points to claim').fill('600');
  await page.getByLabel('Claims close on').fill('2027-12-31');
  await expect(page.getByLabel('Summary')).toContainText('Buy 1 get 1 free: Milk tea');
  await page.getByRole('button', { name: 'Save as draft' }).click();

  await expect(page.getByRole('article', { name: 'Buy 1 get 1 free' })).toContainText('Draft');
  expect(created).toHaveLength(1);
  const body = created[0];
  // A buy-X-get-Y reward has no Core discount type: `terms` describes it.
  expect(body).not.toHaveProperty('discountType');
  expect(body).not.toHaveProperty('status');
  expect(body).toMatchObject({
    code: 'BUY-1-GET-1-FREE',
    title: 'Buy 1 get 1 free',
    pointsCost: 600,
    totalSupply: null,
    perMemberLimit: null,
    validForDays: null,
    startsAt: null,
    terms: {
      schema: 'octap.benefit.v1',
      kind: 'BUY_X_GET_Y',
      buyQuantity: 1,
      getQuantity: 1,
      item: 'Milk tea',
    },
  });
  expect(String(body.expiresAt)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('a Core validation error shows under its field and keeps what was typed', async ({ page }) => {
  await openRewards(page, 'BUSINESS_OWNER', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 409,
          json: {
            statusCode: 409,
            message: 'Voucher with code "SALE-20" already exists for this organization',
          },
        })
      : route.fulfill({ json: [] }),
  );
  await page.getByRole('button', { name: 'New reward' }).click();
  await page.getByLabel('Title').fill('Sale 20');
  await page.getByLabel('Percent off').fill('20');
  await page.getByLabel('Points to claim').fill('300');
  await page.getByRole('button', { name: 'Save as draft' }).click();
  await expect(page.getByText(/already exists for this organization/)).toBeVisible();
  await expect(page.getByLabel('Code')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Title')).toHaveValue('Sale 20');
  await expect(page.getByLabel('Points to claim')).toHaveValue('300');
});

test('activating asks first, then shows publishing until Core reports it live', async ({
  page,
}) => {
  let state = voucher();
  const patches: unknown[] = [];
  let publishedAt = Infinity;
  await openRewards(page, 'BUSINESS_OWNER', (route) => {
    if (route.request().method() === 'PATCH') {
      patches.push(route.request().postDataJSON());
      state = { ...state, publishStatus: 'PUBLISHING' };
      // The worker publishes the terms a few seconds later; only polling can notice.
      publishedAt = Date.now() + 2000;
      return route.fulfill({ json: state });
    }
    if (state.publishStatus === 'PUBLISHING' && Date.now() >= publishedAt)
      state = { ...state, status: 'ACTIVE', publishStatus: 'PUBLISHED', suiTermsId: '0xterms' };
    return route.fulfill({ json: [state] });
  });
  const card = page.getByRole('article', { name: 'A free latte' });
  await card.getByRole('button', { name: 'Activate' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('can never change');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Activate' }).click();
  await expect.poll(() => patches).toEqual([{ status: 'ACTIVE' }]);
  await expect(card).toContainText('Publishing…');
  await expect(card).toContainText('Live', { timeout: 10_000 });
  await expect(card.getByRole('button', { name: 'Pause' })).toBeVisible();
});

test('a failed publish offers a retry, and a published reward only changes its supply', async ({
  page,
}) => {
  const patches: unknown[] = [];
  const failed = voucher({ id: 'failed', title: 'Failed one', publishStatus: 'FAILED' });
  const live = voucher({
    id: 'live',
    title: 'Live one',
    status: 'ACTIVE',
    publishStatus: 'PUBLISHED',
    claimedCount: 4,
  });
  await openRewards(page, 'BUSINESS_OWNER', (route) => {
    if (route.request().method() === 'PATCH') {
      patches.push(route.request().postDataJSON());
      return route.fulfill({ json: { ...live, totalSupply: 25 } });
    }
    if (route.request().url().endsWith('/live')) return route.fulfill({ json: live });
    return route.fulfill({ json: [failed, live] });
  });
  await expect(page.getByRole('article', { name: 'Failed one' })).toContainText('Publish failed');
  // A failed publish is folded into Drafts, so a banner keeps it from being missed.
  await expect(page.getByRole('status')).toContainText('“Failed one” could not be published');
  await expect(page.getByRole('tab', { name: 'Drafts (1)' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Live (1)' })).toBeVisible();
  await expect(
    page
      .getByRole('article', { name: 'Failed one' })
      .getByRole('button', { name: 'Retry publish' }),
  ).toBeVisible();

  await page
    .getByRole('article', { name: 'Live one' })
    .getByRole('button', { name: 'Edit availability' })
    .click();
  await expect(page.getByLabel('Number available')).toHaveValue('10');
  await page.getByLabel('Number available').fill('3');
  await expect(page.getByText('At least 4: that many are already claimed')).toBeVisible();
  await page.getByLabel('Number available').fill('25');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => patches).toEqual([{ totalSupply: 25, perMemberLimit: null }]);

  // The full form only shows a published reward: availability changes in the dialog above.
  await page
    .getByRole('article', { name: 'Live one' })
    .getByRole('button', { name: 'View' })
    .click();
  await expect(page.getByLabel('Title')).toBeDisabled();
  await expect(page.getByLabel('Points to claim')).toBeDisabled();
  await expect(page.getByLabel('Number available')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
});

test('a Business Developer writes drafts and activates them while approval is off', async ({
  page,
}) => {
  const patches: unknown[] = [];
  const live = voucher({
    id: 'live',
    title: 'Live one',
    status: 'ACTIVE',
    publishStatus: 'PUBLISHED',
  });
  await openRewards(page, 'BUSINESS_DEVELOPER', (route) => {
    if (route.request().method() === 'PATCH') {
      patches.push(route.request().postDataJSON());
      return route.fulfill({ json: voucher({ publishStatus: 'PUBLISHING' }) });
    }
    return route.fulfill({ json: [voucher(), live] });
  });
  await expect(page.getByRole('button', { name: 'New reward' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import CSV' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Pending approval/ })).toHaveCount(0);
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card.getByRole('button', { name: 'Edit' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Submit for approval' })).toHaveCount(0);
  await card.getByRole('button', { name: 'Activate' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Activate' }).click();
  await expect.poll(() => patches).toEqual([{ status: 'ACTIVE' }]);

  // Only an Owner pauses or changes a published reward.
  const published = page.getByRole('article', { name: 'Live one' });
  await expect(published.getByRole('button', { name: 'View' })).toBeVisible();
  await expect(published.getByRole('button', { name: 'Pause' })).toHaveCount(0);
  await expect(published.getByRole('button', { name: 'Edit availability' })).toHaveCount(0);
});

test('with approval on, a Business Developer submits a draft, waits, and can withdraw it', async ({
  page,
}) => {
  const actions: string[] = [];
  let state = voucher();
  await openRewards(
    page,
    'BUSINESS_DEVELOPER',
    (route) => {
      const action = route.request().url().split('/').pop();
      if (route.request().method() === 'POST' && (action === 'submit' || action === 'withdraw')) {
        actions.push(action);
        state =
          action === 'submit'
            ? voucher({
                status: 'PENDING_APPROVAL',
                approval: {
                  status: 'PENDING',
                  submittedBy: { type: 'USER', id: 'u1' },
                  submittedAt: '2026-11-19T00:00:00.000Z',
                  reviewedById: null,
                  reviewedAt: null,
                  reason: null,
                },
              })
            : voucher({ approval: { ...(state.approval as object), status: 'WITHDRAWN' } });
        return route.fulfill({ status: 201, json: state });
      }
      return route.fulfill({ json: [state] });
    },
    { voucherApprovalRequired: true },
  );
  await expect(page.getByText('Drafts stay private until an Owner approves them.')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Pending approval (0)' })).toBeVisible();
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card.getByRole('button', { name: 'Activate' })).toHaveCount(0);
  await card.getByRole('button', { name: 'Submit for approval' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('An Owner checks it before it goes live');
  await expect(dialog.getByLabel('Locked')).toContainText('FREE-LATTE');
  await dialog.getByRole('button', { name: 'Submit' }).click();

  await expect(card).toContainText('Pending approval');
  await expect(card).toContainText('Submitted by you');
  await expect(page.getByRole('tab', { name: 'Pending approval (1)' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Pause' })).toHaveCount(0);
  await card.getByRole('button', { name: 'View' }).click();
  await expect(page.getByText(/Waiting for an Owner’s approval/)).toBeVisible();
  await expect(page.getByLabel('Title')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close', exact: true }).last().click();

  await card.getByRole('button', { name: 'Withdraw to draft' }).click();
  await expect(card).toContainText('Draft');
  await expect(card.getByRole('button', { name: 'Edit' })).toBeVisible();
  expect(actions).toEqual(['submit', 'withdraw']);
});

const pendingFrom = (by: { type: 'USER' | 'API_CREDENTIAL'; id: string }) =>
  voucher({
    status: 'PENDING_APPROVAL',
    approval: {
      status: 'PENDING',
      submittedBy: by,
      submittedAt: '2026-11-19T00:00:00.000Z',
      reviewedById: null,
      reviewedAt: null,
      reason: null,
    },
  });

test('an Owner reviews a pending reward: a rejection needs a reason, then shows on the draft', async ({
  page,
}) => {
  const rejected: unknown[] = [];
  let state = pendingFrom({ type: 'USER', id: 'bd-1' });
  const apiKey = {
    ...pendingFrom({ type: 'API_CREDENTIAL', id: 'key-1' }),
    id: 'k',
    title: 'From CRM',
  };
  await openRewards(
    page,
    'BUSINESS_OWNER',
    (route) => {
      if (route.request().method() === 'POST' && route.request().url().endsWith('/reject')) {
        rejected.push(route.request().postDataJSON());
        state = voucher({
          approval: {
            ...(state.approval as object),
            status: 'REJECTED',
            reviewedById: 'u1',
            reason: 'Cap too high',
          },
        });
        return route.fulfill({ status: 201, json: state });
      }
      return route.fulfill({ json: [state, apiKey] });
    },
    { voucherApprovalRequired: true, staff: [{ id: 'bd-1', fullName: 'Bao Dev' }] },
  );
  await expect(page.getByRole('link', { name: /^Rewards\s*2$/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Pending approval (2)' }).click();
  await expect(page.getByRole('article', { name: 'From CRM' })).toContainText(
    'Submitted by an API key',
  );
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card).toContainText('Submitted by Bao Dev');
  // Never published yet, so not live: nothing to pause.
  await expect(card.getByRole('button', { name: 'Pause' })).toHaveCount(0);

  await card.getByRole('button', { name: 'Review' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('submitted by Bao Dev');
  await expect(dialog.getByLabel('Locked')).toContainText('500 points');
  await dialog.getByRole('button', { name: 'Reject' }).click();
  const reject = dialog.getByRole('button', { name: 'Reject' });
  await expect(reject).toBeDisabled();
  await dialog.getByLabel('Reason').fill('x'.repeat(501));
  await expect(reject).toBeDisabled();
  await dialog.getByLabel('Reason').fill('  Cap too high ');
  await reject.click();
  await expect.poll(() => rejected).toEqual([{ reason: 'Cap too high' }]);

  await page.getByRole('tab', { name: /^Drafts/ }).click();
  await expect(card.getByRole('note')).toContainText('Rejected by you: Cap too high');
  await expect(page.getByRole('link', { name: /^Rewards\s*1$/ })).toBeVisible();
});

test('an Owner approves a pending reward, and it publishes like an activation', async ({
  page,
}) => {
  const approved: string[] = [];
  let state = pendingFrom({ type: 'USER', id: 'bd-1' });
  await openRewards(page, 'BUSINESS_OWNER', (route) => {
    if (route.request().method() === 'POST' && route.request().url().endsWith('/approve')) {
      approved.push(route.request().url());
      // Core queues the publish: the reward is a DRAFT until the worker confirms it on-chain.
      state = voucher({ publishStatus: 'PUBLISHING' });
      return route.fulfill({ status: 201, json: state });
    }
    if (state.publishStatus === 'PUBLISHING')
      state = { ...state, status: 'ACTIVE', publishStatus: 'PUBLISHED' };
    return route.fulfill({ json: [state] });
  });
  const card = page.getByRole('article', { name: 'A free latte' });
  await card.getByRole('button', { name: 'Review' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Approve and publish' }).click();
  await expect.poll(() => approved).toHaveLength(1);
  expect(approved[0]).toMatch(/\/vouchers\/voucher-1\/approve$/);
  await expect(card).toContainText('Live', { timeout: 10_000 });
  await expect(card.getByRole('button', { name: 'Pause' })).toBeVisible();
});

test('a Business Developer reads why an Owner rejected their reward', async ({ page }) => {
  const rejected = voucher({
    approval: {
      status: 'REJECTED',
      submittedBy: { type: 'USER', id: 'u1' },
      submittedAt: '2026-11-19T00:00:00.000Z',
      reviewedById: 'owner-9',
      reviewedAt: '2026-11-19T01:00:00.000Z',
      reason: 'Use 50.000 ₫ as the cap',
    },
  });
  await openRewards(page, 'BUSINESS_DEVELOPER', (route) => route.fulfill({ json: [rejected] }), {
    voucherApprovalRequired: true,
  });
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card.getByRole('note')).toContainText(
    'Rejected by an Owner: Use 50.000 ₫ as the cap',
  );
  await expect(card.getByRole('button', { name: 'Submit for approval' })).toBeVisible();
});

test('only an Owner sees the approval switch, and it saves at once', async ({ page }) => {
  const org: OrgOptions = { voucherApprovalRequired: false };
  const saved: unknown[] = [];
  await page.route(`**/v1/console/organizations/${ORG}/settings`, (route) => {
    saved.push(route.request().postDataJSON());
    org.voucherApprovalRequired = route.request().postDataJSON().voucherApprovalRequired;
    return route.fulfill({ json: { updated: true } });
  });
  await openRewards(page, 'BUSINESS_OWNER', (route) => route.fulfill({ json: [] }), org);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  const toggle = page.getByRole('switch', { name: /Require approval before publishing/ });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect.poll(() => saved).toEqual([{ voucherApprovalRequired: true }]);
  await expect(
    page.getByText('Rewards now need an Owner’s approval before publishing'),
  ).toBeVisible();
  await expect(toggle).toBeChecked();

  // A Business Owner's settings page is the only place it shows.
  await page.getByRole('link', { name: /^Rewards\s*\d*$/ }).click();
  await expect(page.getByRole('tab', { name: 'Pending approval (0)' })).toBeVisible();
});

test('a Developer sees Submit for approval once Core refuses an activation for it', async ({
  page,
}) => {
  const org: OrgOptions = { voucherApprovalRequired: false };
  const patches: unknown[] = [];
  await openRewards(
    page,
    'BUSINESS_DEVELOPER',
    (route) => {
      if (route.request().method() === 'PATCH') {
        patches.push(route.request().postDataJSON());
        return route.fulfill({
          status: 403,
          json: {
            statusCode: 403,
            message:
              'This organization requires approval: submit the voucher for approval instead of activating it',
          },
        });
      }
      return route.fulfill({ json: [voucher()] });
    },
    org,
  );
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card.getByRole('button', { name: 'Activate' })).toBeVisible();
  // An Owner turns approval on while this page is open.
  org.voucherApprovalRequired = true;
  await card.getByRole('button', { name: 'Activate' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Activate' }).click();
  await expect(
    page
      .getByRole('region', { name: 'Notifications' })
      .getByText(/submit the voucher for approval/),
  ).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Submit for approval' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Activate' })).toHaveCount(0);
  expect(patches).toEqual([{ status: 'ACTIVE' }]);
});

test('a Developer sent to the settings page lands on their own dashboard, without the switch', async ({
  page,
}) => {
  await openRewards(page, 'BUSINESS_DEVELOPER', (route) => route.fulfill({ json: [] }), {
    voucherApprovalRequired: true,
  });
  // In-app navigation: a reload would sign out, since the Google token is kept in memory only.
  await page.evaluate((org) => {
    history.pushState({}, '', `/organizations/${org}/merchant/settings`);
    dispatchEvent(new PopStateEvent('popstate'));
  }, ORG);
  // `RequireOwner` sends a Developer away from every merchant page, settings included.
  await expect(page).toHaveURL(new RegExp(`/organizations/${ORG}/developer$`));
  await expect(page.getByRole('link', { name: 'Settings', exact: true })).toHaveCount(0);
  await expect(page.getByRole('switch', { name: /Require approval/ })).toHaveCount(0);
});

test('a CSV import checks each row and creates the valid ones as drafts', async ({ page }) => {
  const created: string[] = [];
  await openRewards(page, 'BUSINESS_OWNER', (route) => {
    if (route.request().method() === 'POST') {
      created.push(route.request().postDataJSON().code);
      return route.fulfill({ status: 201, json: voucher() });
    }
    return route.fulfill({ json: [] });
  });
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.getByLabel('CSV file').setInputFiles({
    name: 'rewards.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      [
        'type,title,code,points_cost,value,item',
        'percent_off,"Drinks, 20% off",DRINKS-20,300,20,',
        'free_item,A free latte,,500,,Latte',
        'teleport,Nope,NOPE,1,,',
      ].join('\n'),
    ),
  });
  await expect(page.getByText('Unknown type "teleport"')).toBeVisible();
  await page.getByRole('button', { name: 'Create 2 drafts' }).click();
  await expect(page.getByText('Draft created')).toHaveCount(2);
  await expect.poll(() => created).toEqual(['DRINKS-20', 'A-FREE-LATTE']);
});

/**
 * Answers the list and single reads from `store`, and records each POST/PATCH body. A PATCH is
 * applied to the stored reward, as Core would.
 */
function catalog(store: Voucher[], bodies: Record<string, unknown>[]) {
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

test('a reward can last a number of days from each claim, with a per-member limit', async ({
  page,
}) => {
  const bodies: Record<string, unknown>[] = [];
  await openRewards(page, 'BUSINESS_OWNER', catalog([], bodies));
  await page.getByRole('button', { name: 'New reward' }).click();
  await page.getByRole('button', { name: 'Free drink', exact: true }).click();
  await page.getByLabel('Points to claim').fill('0');
  await page.getByLabel('Days after claiming').check();
  await page.getByLabel('Number of days').fill('14');
  await page.getByLabel('Per-member limit').fill('1');
  await expect(page.getByLabel('Summary')).toContainText('Use within 14 days of claiming');
  await expect(page.getByLabel('Summary')).toContainText('up to 1 per member');
  await page.getByRole('button', { name: 'Save as draft' }).click();

  await expect.poll(() => bodies).toHaveLength(1);
  // No closing date: claims stay open, and each voucher still lasts 14 days.
  expect(bodies[0]).toMatchObject({ validForDays: 14, perMemberLimit: 1, expiresAt: null });
});

test('the form checks the number of days and the limit before calling Core', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await openRewards(page, 'BUSINESS_OWNER', catalog([], bodies));
  await page.getByRole('button', { name: 'New reward' }).click();
  await page.getByRole('button', { name: 'Free drink', exact: true }).click();
  await page.getByLabel('Points to claim').fill('100');
  await page.getByLabel('Days after claiming').check();
  await page.getByLabel('Number of days').fill('4000');
  await page.getByLabel('Per-member limit').fill('0');
  await page.getByRole('button', { name: 'Save as draft' }).click();
  await expect(page.getByText('Enter a whole number of days from 1 to 3,650')).toBeVisible();
  await expect(page.getByText('leave empty for no limit')).toBeVisible();
  expect(bodies).toHaveLength(0);
});

test('a draft can go back to expiring when claims close', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await openRewards(page, 'BUSINESS_OWNER', catalog([voucher({ validForDays: 14 })], bodies));
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card).toContainText('Use within 14 days of claiming');
  await card.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByLabel('Number of days')).toHaveValue('14');
  await page.getByLabel('Until claims close').check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({ validForDays: null });
});

test('after publishing, the validity is locked but the per-member limit still changes', async ({
  page,
}) => {
  const bodies: Record<string, unknown>[] = [];
  const live = voucher({
    status: 'ACTIVE',
    publishStatus: 'PUBLISHED',
    validForDays: 30,
    perMemberLimit: 1,
  });
  await openRewards(page, 'BUSINESS_OWNER', catalog([live], bodies));
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card).toContainText('up to 1 per member');
  await card.getByRole('button', { name: 'View' }).click();
  await expect(page.getByLabel('Number of days')).toBeDisabled();
  await expect(page.getByLabel('Claims close on')).toBeDisabled();
  await page.getByRole('button', { name: 'Close', exact: true }).last().click();

  await card.getByRole('button', { name: 'Edit availability' }).click();
  await expect(page.getByLabel('Per-member limit')).toHaveValue('1');
  await page.getByLabel('Per-member limit').fill('3');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  // Only what stays editable is sent: the supply and the limit, never the frozen terms.
  await expect.poll(() => bodies).toEqual([{ totalSupply: 10, perMemberLimit: 3 }]);
});

test('the activation check lists everything that will be locked', async ({ page }) => {
  await openRewards(
    page,
    'BUSINESS_OWNER',
    catalog([voucher({ validForDays: 14, perMemberLimit: 2 })], []),
  );
  await page
    .getByRole('article', { name: 'A free latte' })
    .getByRole('button', { name: 'Activate' })
    .click();
  const locked = page.getByRole('alertdialog').getByRole('region', { name: 'Locked' });
  await expect(locked).toContainText('Free Latte');
  await expect(locked).toContainText('500 points');
  await expect(locked).toContainText('Use within 14 days of claiming');
  await expect(locked).toContainText('FREE-LATTE');
  await expect(
    page.getByRole('alertdialog').getByRole('region', { name: 'Editable later' }),
  ).toContainText('Up to 2 per member');
});

test('a Core error about the new fields shows under its field', async ({ page }) => {
  await openRewards(page, 'BUSINESS_OWNER', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 400,
          json: {
            statusCode: 400,
            message: 'perMemberLimit must be a positive 32-bit integer or null',
          },
        })
      : route.fulfill({ json: [] }),
  );
  await page.getByRole('button', { name: 'New reward' }).click();
  await page.getByRole('button', { name: 'Free drink', exact: true }).click();
  await page.getByLabel('Points to claim').fill('100');
  await page.getByRole('button', { name: 'Save as draft' }).click();
  await expect(page.getByLabel('Per-member limit')).toHaveAttribute('aria-invalid', 'true');
});

test('a CSV reads the new columns, an old template, and dates Excel rewrote', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await openRewards(page, 'BUSINESS_OWNER', catalog([], bodies));
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.getByLabel('CSV file').setInputFiles({
    name: 'rewards.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      [
        // `expires_on` is the old name of `claims_close_on`; Excel saved the dates its own way.
        'type,title,code,points_cost,item,per_member_limit,valid_for_days,expires_on',
        'free_item,US date,US-DATE,100,Latte,1,14,12/31/2027',
        'free_item,VN date,VN-DATE,100,Latte,,,13/12/2027',
        'free_item,Unclear date,UNCLEAR,100,Latte,,,05/02/2027',
        'free_item,Too long,TOO-LONG,100,Latte,,4000,2027-12-31',
      ].join('\r\n'),
    ),
  });
  await expect(page.getByText(/could be 2027-02-05 or 2027-05-02/)).toBeVisible();
  await expect(page.getByText(/valid_for_days: Enter a whole number of days/)).toBeVisible();
  await page.getByRole('button', { name: 'Create 2 drafts' }).click();
  await expect(page.getByText('Draft created')).toHaveCount(2);
  expect(bodies[0]).toMatchObject({ code: 'US-DATE', perMemberLimit: 1, validForDays: 14 });
  expect(bodies[1]).toMatchObject({ code: 'VN-DATE', perMemberLimit: null, validForDays: null });
  // 12/31/2027 can only be month first, 13/12/2027 only day first: read as 31 and 13 December.
  const day = (body: Record<string, unknown>) => new Date(String(body.expiresAt));
  expect([day(bodies[0]).getMonth(), day(bodies[0]).getDate()]).toEqual([11, 31]);
  expect([day(bodies[1]).getMonth(), day(bodies[1]).getDate()]).toEqual([11, 13]);
});

test('the downloadable template has one cell per column on every row', async ({ page }) => {
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []));
  await page.getByRole('button', { name: 'Import CSV' }).click();
  const href = await page.getByRole('link', { name: 'Download the template' }).getAttribute('href');
  const text = decodeURIComponent(String(href).split(',').slice(1).join(','));
  // Read the template back through the importer: every row is ready, none has a problem.
  await page.getByLabel('CSV file').setInputFiles({
    name: 'template.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(text),
  });
  await expect(page.getByRole('button', { name: 'Create 7 drafts' })).toBeEnabled();
  expect(text.split('\n')[0]).toContain('per_member_limit');
  expect(text.split('\n')[0]).toContain('claims_close_on');
  expect(text.split('\n')[0]).toContain('valid_for_days');
});

test('restocking a sold-out reward puts it back live', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  const soldOut = voucher({
    status: 'DEPLETED',
    publishStatus: 'PUBLISHED',
    totalSupply: 10,
    claimedCount: 10,
  });
  await openRewards(page, 'BUSINESS_OWNER', catalog([soldOut], bodies));
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card).toContainText('Sold out');
  await card.getByRole('button', { name: 'Restock' }).click();
  await expect(page.getByText('A number above 10 reopens claims')).toBeVisible();
  await page.getByRole('button', { name: '+50' }).click();
  await expect(page.getByLabel('Number available')).toHaveValue('60');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  // Core keeps a DEPLETED reward sold out after a supply-only PATCH: the status goes with it.
  await expect
    .poll(() => bodies)
    .toEqual([{ totalSupply: 60, perMemberLimit: null, status: 'ACTIVE' }]);
  await expect(card).toContainText('Live');
});

test('Edit availability shows a Core refusal about a field it does not display', async ({
  page,
}) => {
  const live = voucher({ status: 'ACTIVE', publishStatus: 'PUBLISHED', totalSupply: 10 });
  await openRewards(page, 'BUSINESS_OWNER', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 400,
          json: {
            statusCode: 400,
            message: 'A voucher must stay valid for at least 24 hours to be activated',
          },
        })
      : catalog([live], [])(route),
  );
  await page
    .getByRole('article', { name: 'A free latte' })
    .getByRole('button', { name: 'Edit availability' })
    .click();
  await page.getByLabel('Number available').fill('20');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('at least 24 hours');
});

test('a sold-out reward whose claims have closed offers no restock', async ({ page }) => {
  await openRewards(
    page,
    'BUSINESS_OWNER',
    catalog(
      [
        voucher({
          status: 'DEPLETED',
          publishStatus: 'PUBLISHED',
          totalSupply: 10,
          claimedCount: 10,
          expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
        }),
      ],
      [],
    ),
  );
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card).toContainText('Sold out');
  await expect(card.getByRole('button', { name: 'View' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Restock' })).toHaveCount(0);
});

test('pausing asks first and says what happens to claimed vouchers', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await openRewards(
    page,
    'BUSINESS_OWNER',
    catalog([voucher({ status: 'ACTIVE', publishStatus: 'PUBLISHED' })], bodies),
  );
  await page
    .getByRole('article', { name: 'A free latte' })
    .getByRole('button', { name: 'Pause' })
    .click();
  await expect(page.getByRole('alertdialog')).toContainText(
    'Vouchers already claimed stay usable until they expire',
  );
  expect(bodies).toHaveLength(0);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Pause' }).click();
  await expect.poll(() => bodies).toEqual([{ status: 'PAUSED' }]);
});

test('a live reward shows when claims have not opened yet or have closed', async ({ page }) => {
  const day = 86_400_000;
  await openRewards(
    page,
    'BUSINESS_OWNER',
    catalog(
      [
        voucher({
          id: 'soon',
          title: 'Opens soon',
          status: 'ACTIVE',
          publishStatus: 'PUBLISHED',
          startsAt: new Date(Date.now() + 3 * day).toISOString(),
        }),
        voucher({
          id: 'over',
          title: 'Already over',
          status: 'ACTIVE',
          publishStatus: 'PUBLISHED',
          expiresAt: new Date(Date.now() - day).toISOString(),
        }),
      ],
      [],
    ),
  );
  await expect(page.getByRole('article', { name: 'Opens soon' })).toContainText('Scheduled');
  await expect(page.getByRole('article', { name: 'Already over' })).toContainText('Claims closed');
  // Both are published, so they are counted under Live.
  await expect(page.getByRole('tab', { name: 'Live (2)' })).toBeVisible();
});

test('the form keeps typed work, clears stale Core errors and echoes VND amounts', async ({
  page,
}) => {
  await openRewards(page, 'BUSINESS_OWNER', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 409,
          json: { statusCode: 409, message: 'Voucher with code "SALE" already exists' },
        })
      : route.fulfill({ json: [] }),
  );
  await page.getByRole('button', { name: 'New reward' }).click();
  await page.getByLabel('Title').fill('Sale');
  await page.getByRole('button', { name: 'Free drink', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Replace what you entered?');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByLabel('Title')).toHaveValue('Sale');

  await page.getByRole('button', { name: 'Amount off', exact: true }).click();
  await page.getByLabel('Amount off (VND)').fill('5000000');
  await expect(page.getByText(/= 5\.000\.000/)).toBeVisible();
  await page.getByLabel('Points to claim').fill('100');
  await page.getByRole('button', { name: 'Save as draft' }).click();
  await expect(page.getByText(/already exists/)).toBeVisible();
  await page.getByLabel('Code').fill('SALE-2');
  await expect(page.getByText(/already exists/)).toHaveCount(0);
  await expect(page.getByLabel('Code')).not.toHaveAttribute('aria-invalid', 'true');
});

test('a draft can still change its code', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await openRewards(page, 'BUSINESS_OWNER', catalog([voucher()], bodies));
  await page
    .getByRole('article', { name: 'A free latte' })
    .getByRole('button', { name: 'Edit' })
    .click();
  await page.getByLabel('Code').fill('FREE-LATTE-M');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({ code: 'FREE-LATTE-M' });
});

for (const kind of ['Percent off', 'Buy X get Y', 'Custom'])
  test(`the ${kind} form fits a laptop screen without scrolling`, async ({ page }) => {
    // A 1440×900 laptop leaves about 820 px for the page once the browser's own bars are drawn.
    await page.setViewportSize({ width: 1440, height: 820 });
    await openRewards(page, 'BUSINESS_OWNER', catalog([], []));
    await page.getByRole('button', { name: 'New reward' }).click();
    await page.getByRole('button', { name: kind, exact: true }).click();
    await page.getByLabel('Days after claiming').check();
    const body = page.locator('[data-panel-body]');
    await expect(body).toBeVisible();
    const { scroll, client } = await body.evaluate((el) => ({
      scroll: el.scrollHeight,
      client: el.clientHeight,
    }));
    expect(scroll).toBeLessThanOrEqual(client);
  });
