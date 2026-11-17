import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * OCT-283: the Rewards page against a stand-in for Core's console voucher routes (OCT-236), with
 * OCT-291's per-member limit and validity counted from the day a member claims.
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

/** Signs in as `persona` of one organization, then opens the Rewards page from the sidebar. */
async function openRewards(
  page: Page,
  persona: 'BUSINESS_OWNER' | 'BUSINESS_DEVELOPER',
  vouchers: (route: Route) => Promise<void> | void,
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
  for (const path of ['staff', 'invitations', 'api-credentials'])
    await page.route(`**/v1/console/organizations/${ORG}/${path}`, (route) =>
      route.fulfill({ json: [] }),
    );
  await page.route(`**/v1/console/organizations/${ORG}/vouchers**`, vouchers);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  // An Owner lands in /merchant, a Business Developer in /developer: both have a Rewards link.
  await page.getByRole('link', { name: 'Rewards', exact: true }).click();
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
  await expect(page.getByLabel('Preview')).toContainText('Buy 1 get 1 free: Milk tea');
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
    return route.fulfill({ json: [failed, live] });
  });
  await expect(page.getByRole('article', { name: 'Failed one' })).toContainText('Publish failed');
  await expect(
    page
      .getByRole('article', { name: 'Failed one' })
      .getByRole('button', { name: 'Retry publish' }),
  ).toBeVisible();

  await page
    .getByRole('article', { name: 'Live one' })
    .getByRole('button', { name: 'Restock' })
    .click();
  await page.getByLabel('Units to add').fill('15');
  await page.getByRole('button', { name: 'Add stock' }).click();
  await expect.poll(() => patches).toEqual([{ totalSupply: 25 }]);

  await page
    .getByRole('article', { name: 'Live one' })
    .getByRole('button', { name: 'Details' })
    .click();
  await expect(page.getByLabel('Title')).toBeDisabled();
  await expect(page.getByLabel('Points to claim')).toBeDisabled();
  await expect(page.getByLabel('Number available')).toBeEnabled();
});

test('a Business Developer sees the catalog read-only', async ({ page }) => {
  await openRewards(page, 'BUSINESS_DEVELOPER', (route) => route.fulfill({ json: [voucher()] }));
  const card = page.getByRole('article', { name: 'A free latte' });
  await expect(card).toContainText('Draft');
  await expect(page.getByRole('button', { name: 'New reward' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Import CSV' })).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Activate' })).toHaveCount(0);
  await card.getByRole('button', { name: 'View' }).click();
  await expect(page.getByLabel('Title')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
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

/** Answers the list with `store`, and records each POST/PATCH body. */
function catalog(store: Voucher[], bodies: Record<string, unknown>[]) {
  return (route: Route) => {
    const method = route.request().method();
    if (method === 'POST' || method === 'PATCH') {
      const body = route.request().postDataJSON();
      bodies.push(body);
      const saved = voucher({ ...store[0], ...body, id: store[0]?.id ?? 'voucher-new' });
      return route.fulfill({ status: method === 'POST' ? 201 : 200, json: saved });
    }
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
  await page.getByLabel('For a number of days after each member claims it').check();
  await page.getByLabel('Days after claiming').fill('14');
  await page.getByLabel('Per-member limit').fill('1');
  await expect(page.getByLabel('Preview')).toContainText('Use within 14 days of claiming');
  await expect(page.getByLabel('Preview')).toContainText('up to 1 per member');
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
  await page.getByLabel('For a number of days after each member claims it').check();
  await page.getByLabel('Days after claiming').fill('4000');
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
  await expect(page.getByLabel('Days after claiming')).toHaveValue('14');
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
  await card.getByRole('button', { name: 'Details' }).click();
  await expect(page.getByLabel('Days after claiming')).toBeDisabled();
  await expect(page.getByLabel('Claims close on')).toBeDisabled();
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
