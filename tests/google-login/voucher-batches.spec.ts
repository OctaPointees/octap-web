import { readFileSync } from 'node:fs';
import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * OCT-304: importing vouchers as one draft batch, against a stand-in for Core's console batch
 * routes (OCT-303): the Review step is a dry run, Create writes one batch, and a batch is
 * activated, paused, resumed or archived at once. An Owner's Activate all sends the vouchers as
 * shown (`seen`), so one changed meanwhile is not taken live unseen (OCT-324).
 */

const ORG = 'org-1';

type Voucher = Record<string, unknown> & { id: string; status: string; publishStatus: string };
type Batch = Record<string, unknown> & { id: string; archivedAt: string | null };

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
    approval: null,
    batchId: null,
    createdBy: null,
    activatedBy: null,
    activatedAt: null,
    createdAt: '2026-11-13T00:00:00.000Z',
    updatedAt: '2026-11-13T00:00:00.000Z',
    ...overrides,
  };
}

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'batch-1',
    organizationId: ORG,
    name: 'vouchers.csv',
    source: 'CONSOLE',
    createdBy: { type: 'USER', id: 'u1' },
    createdAt: '2026-11-22T07:05:00.000Z',
    archivedAt: null,
    statusCounts: { DRAFT: 2 },
    ...overrides,
  };
}

const draft = (code: string, overrides: Partial<Voucher> = {}) =>
  voucher({
    id: `v-${code}`,
    code,
    title: code,
    batchId: 'batch-1',
    updatedAt: `2026-11-22T07:05:00.${String(code.length).padStart(3, '0')}Z`,
    ...overrides,
  });

/** What the stand-in answers, and what it was sent. */
interface Core {
  /** The catalog on the Vouchers page. */
  catalog: Voucher[];
  batches: Batch[];
  /** The vouchers of the batch that is opened. */
  vouchers: Voucher[];
  /** Each item's result, by its code, for a dry run and for the real create. */
  results?: (item: { code: string }, index: number) => Record<string, unknown>;
  /** What an action answers for each voucher, by code. */
  outcomes?: Record<string, { outcome: string; reason?: string }>;
  approvalRequired: boolean;
  posts: Record<string, unknown>[];
  actions: { action: string; body: Record<string, unknown> | null }[];
  lists: string[];
}

const newCore = (core: Partial<Core> = {}): Core => ({
  catalog: [],
  batches: [],
  vouchers: [],
  approvalRequired: false,
  posts: [],
  actions: [],
  lists: [],
  ...core,
});

function batchRoutes(core: Core) {
  return (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const [, id, action] = url.pathname.split('/voucher-batches')[1].split('/');
    if (request.method() === 'POST' && !id) {
      const body = request.postDataJSON();
      core.posts.push(body);
      const items = (body.items as { code: string }[]).map((item, index) => ({
        index,
        code: item.code,
        ...(core.results?.(item, index) ?? { status: 'created', voucherId: null }),
      }));
      return route.fulfill({
        status: body.dryRun ? 200 : 201,
        json: { dryRun: body.dryRun, batch: body.dryRun ? null : batch(), items },
      });
    }
    if (request.method() === 'POST' && action) {
      core.actions.push({ action, body: request.postDataJSON() });
      return route.fulfill({
        json: {
          batch: batch(),
          vouchers: core.vouchers.map((v) => ({
            voucherId: v.id,
            code: v.code,
            status: v.status,
            reason: null,
            ...(core.outcomes?.[String(v.code)] ?? { outcome: 'skipped' }),
          })),
        },
      });
    }
    if (id) {
      const found = core.batches.find((b) => b.id === id) ?? batch({ id });
      return route.fulfill({ json: { ...found, vouchers: core.vouchers } });
    }
    core.lists.push(url.search);
    const archived = url.searchParams.get('includeArchived') === 'true';
    return route.fulfill({ json: core.batches.filter((b) => archived || !b.archivedAt) });
  };
}

/** Signs in as `persona` (user `u1`) of one organization, then opens Vouchers from the sidebar. */
async function openVouchers(
  page: Page,
  persona: 'BUSINESS_OWNER' | 'BUSINESS_DEVELOPER',
  core: Core,
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
      prompt() {},
    } } };`,
    }),
  );
  // Anything this spec doesn't care about answers empty; the routes below take precedence.
  await page.route('**/v1/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: identity }));
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
        voucherApprovalRequired: core.approvalRequired,
      },
    }),
  );
  await page.route(`**/v1/console/organizations/${ORG}/api-credentials`, (route) =>
    route.fulfill({
      json: [
        {
          id: 'key-1',
          name: 'CRM sync',
          keyPrefix: 'octap_live_ab',
          scopes: ['read', 'write'],
          status: 'ACTIVE',
          createdAt: '2026-11-01T00:00:00.000Z',
          lastUsedAt: null,
          expiresAt: null,
        },
      ],
    }),
  );
  await page.route(`**/v1/console/organizations/${ORG}/vouchers**`, (route) =>
    route.fulfill({ json: core.catalog }),
  );
  await page.route(`**/v1/console/organizations/${ORG}/voucher-batches**`, batchRoutes(core));
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await page.getByRole('link', { name: /^Vouchers/ }).click();
  await expect(page).toHaveURL(/\/organizations\/coffee\/vouchers$/);
  await expect(page.getByRole('heading', { name: 'Vouchers' })).toBeVisible();
}

async function chooseFile(page: Page, lines: string[], name = 'vouchers.csv') {
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.getByLabel('CSV file').setInputFiles({
    name,
    mimeType: 'text/csv',
    buffer: Buffer.from(lines.join('\n')),
  });
}

async function openBatch(page: Page, name: string | RegExp) {
  await page.getByRole('link', { name: 'Import history' }).click();
  await page.getByRole('link', { name }).click();
}

test('the file is checked in the browser first, then Core reviews it without writing', async ({
  page,
}) => {
  const core = newCore({
    results: (item) =>
      item.code === 'OFF30'
        ? {
            status: 'conflict',
            voucherId: 'v-off30',
            differences: [{ field: 'pointsCost', stored: 100, sent: 300 }],
          }
        : item.code === 'OLD'
          ? { status: 'replaced', voucherId: 'v-old', differences: [] }
          : item.code === 'SAME'
            ? { status: 'unchanged', voucherId: 'v-same', movedToBatch: false }
            : { status: 'created', voucherId: null },
  });
  await openVouchers(page, 'BUSINESS_OWNER', core);
  await chooseFile(page, [
    'type,title,code,points_cost,item',
    'free_item,A latte,LATTE,500,Latte',
    'free_item,Thirty off,OFF30,300,Cake',
    'free_item,Another latte,LATTE,500,Latte',
    'teleport,Nope,NOPE,1,',
    'free_item,Back again,OLD,200,Tea',
    'free_item,Same as saved,SAME,100,Water',
  ]);
  // Found in the browser, before any call to Core.
  await expect(page.getByText('Row 4: code: LATTE is already used by row 2')).toBeVisible();
  await expect(page.getByText(/Row 5: Unknown type "teleport"/)).toBeVisible();
  expect(core.posts).toHaveLength(0);

  await page.getByRole('button', { name: 'Check file' }).click();
  await expect(page.getByText('2 vouchers can be created. 3 rows need attention.')).toBeVisible();
  expect(core.posts[0]).toMatchObject({ name: 'vouchers.csv', dryRun: true });
  expect((core.posts[0].items as { code: string }[]).map((i) => i.code)).toEqual([
    'LATTE',
    'OFF30',
    'OLD',
    'SAME',
  ]);
  // What needs attention is open; the conflict shows what is saved against the file.
  await expect(page.getByText('⚠ Different from the saved one')).toBeVisible();
  await expect(page.getByRole('row', { name: 'Points 100 300' })).toBeVisible();
  await expect(
    page.getByText(/Kept as it is\. To offer this, give the row a new code\./),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Already saved, nothing to do (1)' }),
  ).toHaveAttribute('aria-expanded', 'false');

  await page.getByRole('button', { name: 'Create 2 drafts, skip 3 rows' }).click();
  await expect(page.getByText('2 drafts in “vouchers.csv”.')).toBeVisible();
  expect(core.posts[1]).toMatchObject({ name: 'vouchers.csv', dryRun: false });

  await page.getByRole('button', { name: 'Open the batch' }).click();
  await expect(page).toHaveURL(/\/organizations\/coffee\/vouchers\/imports\/batch-1$/);
  await expect(page.getByRole('heading', { name: 'vouchers.csv' })).toBeVisible();
});

test('a corrected row after a bad one with the same code is not a repeat', async ({ page }) => {
  await openVouchers(page, 'BUSINESS_OWNER', newCore());
  await chooseFile(page, [
    'type,title,code,points_cost,item,claims_close_on',
    'free_item,A latte,CODE-A,500,Latte,31/31/2027',
    'free_item,A latte,CODE-A,500,Latte,2027-12-31',
    'free_item,Again,CODE-A,500,Latte,2027-12-31',
  ]);
  await expect(
    page.getByText(/Row 2: claims_close_on: "31\/31\/2027" is not a date/),
  ).toBeVisible();
  // Row 3 is the corrected copy and is sent; only row 4 repeats a code that will be sent.
  await expect(page.getByText('Row 4: code: CODE-A is already used by row 3')).toBeVisible();
  await expect(page.getByText(/Row 3:/)).toHaveCount(0);
  await expect(page.getByText(/1 ready to check, 2 to fix in the file/)).toBeVisible();
});

test('a CSV reads the new columns, an old template, and dates Excel rewrote', async ({ page }) => {
  const core = newCore();
  await openVouchers(page, 'BUSINESS_OWNER', core);
  await chooseFile(page, [
    // `expires_on` is the old name of `claims_close_on`; Excel saved the dates its own way.
    'type,title,code,points_cost,item,per_member_limit,valid_for_days,expires_on',
    'free_item,US date,US-DATE,100,Latte,1,14,12/31/2027',
    'free_item,VN date,VN-DATE,100,Latte,,,13/12/2027',
    'free_item,Unclear date,UNCLEAR,100,Latte,,,05/02/2027',
    'free_item,Too long,TOO-LONG,100,Latte,,4000,2027-12-31',
  ]);
  await expect(page.getByText(/could be 2027-02-05 or 2027-05-02/)).toBeVisible();
  await expect(page.getByText(/valid_for_days: /)).toBeVisible();
  await page.getByRole('button', { name: 'Check file' }).click();
  await expect(page.getByRole('button', { name: 'Create 2 drafts, skip 2 rows' })).toBeVisible();
  const [us, vn] = core.posts[0].items as Record<string, unknown>[];
  expect(us).toMatchObject({ code: 'US-DATE', perMemberLimit: 1, validForDays: 14 });
  expect(vn).toMatchObject({ code: 'VN-DATE' });
  // 12/31/2027 can only be month first, 13/12/2027 only day first: read as 31 and 13 December.
  const day = (body: Record<string, unknown>) => new Date(String(body.expiresAt));
  expect([day(us).getMonth(), day(us).getDate()]).toEqual([11, 31]);
  expect([day(vn).getMonth(), day(vn).getDate()]).toEqual([11, 13]);
});

test('the CSV template reads back with every row ready', async ({ page }) => {
  await openVouchers(page, 'BUSINESS_OWNER', newCore());
  await page.getByRole('button', { name: 'Import CSV' }).click();
  const href = await page.getByRole('link', { name: 'CSV version' }).getAttribute('href');
  const text = decodeURIComponent(String(href).split(',').slice(1).join(','));
  await page.getByLabel('CSV file').setInputFiles({
    name: 'template.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(text),
  });
  await expect(page.getByText(/7 ready to check$/)).toBeVisible();
  expect(text.split('\n')[0]).toContain('claims_close_on');
});

test('the Excel template has a type drop-down and checks dates and numbers', async ({ page }) => {
  await openVouchers(page, 'BUSINESS_OWNER', newCore());
  await page.getByRole('button', { name: 'Import CSV' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download the template (Excel)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('octap-vouchers-template.xlsx');
  // Stored without compression, so the sheets read as text inside the zip.
  const text = readFileSync(await file.path()).toString('utf8');
  expect(text.startsWith('PK')).toBe(true);
  expect(text).toContain(
    '<formula1>"percent_off,amount_off,free_item,buy_x_get_y,free_shipping,fixed_price,custom"</formula1>',
  );
  expect(text).toMatch(/type="date"[^>]*sqref="Q2:Q101"/);
  expect(text).toMatch(/type="whole"[^>]*sqref="D2:D101"/);
  expect(text).toContain('<sheet name="Vouchers"');
  expect(text).toContain('<sheet name="Guide"');
});

test('nothing can be created when no row can be written, and Review says why', async ({ page }) => {
  const core = newCore({
    results: () => ({
      status: 'error',
      error: { code: 'INVALID', field: 'pointsCost', message: 'pointsCost is too high' },
    }),
  });
  await openVouchers(page, 'BUSINESS_OWNER', core);
  await chooseFile(page, ['type,title,code,points_cost,item', 'free_item,A latte,LATTE,500,Latte']);
  await page.getByRole('button', { name: 'Check file' }).click();
  await expect(
    page.getByText('✗ Needs fixing (points_cost): pointsCost is too high'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create 0 drafts, skip 1 row' })).toBeDisabled();
  await expect(
    page.getByText('No row can be created: fix the file and choose it again.'),
  ).toBeVisible();
});

test("an Owner's Activate all sends the vouchers as shown, and each result shows", async ({
  page,
}) => {
  const vouchers = [
    draft('A'),
    draft('SOON'),
    draft('WAIT', { status: 'PENDING_APPROVAL' }),
    draft('LIVE', { status: 'ACTIVE', publishStatus: 'PUBLISHED' }),
  ];
  const core = newCore({
    approvalRequired: true,
    batches: [batch({ statusCounts: { DRAFT: 2, PENDING_APPROVAL: 1, ACTIVE: 1 } })],
    vouchers,
    outcomes: {
      A: { outcome: 'publishing' },
      WAIT: { outcome: 'publishing' },
      SOON: {
        outcome: 'failed',
        reason: 'This voucher changed since you reviewed it; review it again',
      },
    },
  });
  await openVouchers(page, 'BUSINESS_OWNER', core);
  await openBatch(page, /vouchers\.csv/);
  await expect(
    page.getByText('1 voucher waits for your approval.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause all (1)' })).toBeVisible();

  await page.getByRole('button', { name: 'Activate all (3)' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('2 drafts will start publishing')).toBeVisible();
  await expect(
    dialog.getByText('1 voucher waiting for approval will be approved and published'),
  ).toBeVisible();
  await expect(dialog.getByText('1 voucher already live is skipped')).toBeVisible();
  await expect(dialog.getByText(/one changed by a teammate meanwhile is left out/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Activate 3' }).click();
  await expect.poll(() => core.actions.map((a) => a.action)).toEqual(['activate']);
  // Each voucher as the page showed it, so Core leaves out any that changed since (OCT-324).
  expect(core.actions[0].body).toEqual({
    seen: vouchers.map((v) => ({ voucherId: v.id, updatedAt: v.updatedAt })),
  });
  await expect(
    page.getByRole('listitem', { name: 'SOON' }).getByText(/Not done: This voucher changed since/),
  ).toBeVisible();
  await expect(
    page.getByRole('listitem', { name: 'WAIT' }).getByText('Publishing on-chain…'),
  ).toBeVisible();
});

test('a voucher paused while publishing, whose publish failed, is activated again with the batch', async ({
  page,
}) => {
  const core = newCore({
    batches: [batch({ statusCounts: { DRAFT: 1, PAUSED: 2 } })],
    vouchers: [
      draft('A'),
      draft('STUCK', { status: 'PAUSED', publishStatus: 'FAILED' }),
      draft('WAITING', { status: 'PAUSED', publishStatus: 'PUBLISHING' }),
    ],
  });
  await openVouchers(page, 'BUSINESS_OWNER', core);
  await openBatch(page, /vouchers\.csv/);
  await expect(
    page.getByRole('listitem', { name: 'WAITING' }).getByText('Publishing'),
  ).toBeVisible();
  // Core activates the failed one too; neither is live, and the one already paused isn't paused again.
  await expect(page.getByRole('button', { name: 'Activate all (2)' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pause all/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Resume all/ })).toHaveCount(0);
  // Archiving freezes the failed one with the draft; the one still publishing is kept, like a live one.
  await page.getByRole('button', { name: 'Archive' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('Its 2 drafts are frozen.')).toBeVisible();
  await expect(dialog.getByText(/Its 1 live voucher stays live/)).toBeVisible();
});

test('with approval on, a Developer submits the batch, sends nothing reviewed, and cannot pause', async ({
  page,
}) => {
  const core = newCore({
    approvalRequired: true,
    batches: [batch({ statusCounts: { DRAFT: 2, ACTIVE: 1 } })],
    vouchers: [
      draft('A'),
      draft('B'),
      draft('LIVE', { status: 'ACTIVE', publishStatus: 'PUBLISHED' }),
    ],
  });
  await openVouchers(page, 'BUSINESS_DEVELOPER', core);
  await openBatch(page, /vouchers\.csv/);
  await expect(page).toHaveURL(/\/organizations\/coffee\/vouchers\/imports\/batch-1$/);
  await expect(page.getByRole('button', { name: /Pause all/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit batch for approval (2)' }).click();
  await expect(
    page.getByRole('alertdialog').getByText('2 drafts will wait for an Owner'),
  ).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Submit' }).click();
  await expect.poll(() => core.actions.map((a) => a.action)).toEqual(['activate']);
  // A Developer's activation is a submission: there is nothing for them to have reviewed.
  expect(core.actions[0].body).toEqual({});
});

test('archiving says what is frozen and what stays live, then hides Activate', async ({ page }) => {
  const core = newCore({
    batches: [batch({ statusCounts: { DRAFT: 1, ACTIVE: 1 } })],
    vouchers: [draft('A'), draft('LIVE', { status: 'ACTIVE', publishStatus: 'PUBLISHED' })],
    outcomes: { A: { outcome: 'archived' } },
  });
  await openVouchers(page, 'BUSINESS_OWNER', core);
  await openBatch(page, /vouchers\.csv/);
  await page.getByRole('button', { name: 'Archive' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('Its 1 draft is frozen.')).toBeVisible();
  await expect(
    dialog.getByText('Its 1 live voucher stays live: use Pause all to stop claims.'),
  ).toBeVisible();
  // Core now answers with the batch archived and its draft ARCHIVED.
  core.batches = [
    batch({ archivedAt: '2026-11-23T08:00:00.000Z', statusCounts: { ARCHIVED: 1, ACTIVE: 1 } }),
  ];
  core.vouchers = [
    draft('A', { status: 'ARCHIVED' }),
    draft('LIVE', { status: 'ACTIVE', publishStatus: 'PUBLISHED' }),
  ];
  await dialog.getByRole('button', { name: 'Archive' }).click();
  await expect.poll(() => core.actions.map((a) => a.action)).toEqual(['archive']);
  await expect(page.getByText(/Its drafts are frozen; import their codes again/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Activate all/ })).toHaveCount(0);
  await expect(
    page.getByRole('listitem', { name: 'A' }).locator('.badge', { hasText: 'Archived' }),
  ).toBeVisible();
});

test('Import history lists open imports, and archived ones on request', async ({ page }) => {
  const core = newCore({
    batches: [
      batch({
        name: 'catalog-11-11.csv',
        statusCounts: { DRAFT: 60, PENDING_APPROVAL: 2, ACTIVE: 34 },
      }),
      batch({
        id: 'batch-2',
        name: null,
        source: 'API',
        createdBy: { type: 'API_CREDENTIAL', id: 'key-1' },
        archivedAt: '2026-11-21T00:00:00.000Z',
        statusCounts: { ACTIVE: 3 },
      }),
    ],
  });
  await openVouchers(page, 'BUSINESS_OWNER', core);
  // The Vouchers page leads back to the import with drafts left.
  await expect(
    page.getByText('“catalog-11-11.csv” has 60 drafts waiting to go live.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Import history' }).click();
  await expect(page.getByText('34 live · 2 waiting · 60 draft')).toBeVisible();
  await expect(page.getByText(/· You$/)).toBeVisible();
  await expect(page.getByText(/Import of /)).toHaveCount(0);
  await page.getByLabel('Show archived').check();
  await expect(page.getByText(/Import of /)).toBeVisible();
  await expect(page.getByText(/API · CRM sync/)).toBeVisible();
  expect(core.lists).toContain('?includeArchived=true');
});

test('an archived voucher is with the ended ones and offers no Edit or Activate', async ({
  page,
}) => {
  await openVouchers(
    page,
    'BUSINESS_OWNER',
    newCore({ catalog: [voucher({ id: 'v-a', title: 'Old latte', status: 'ARCHIVED' })] }),
  );
  await page.getByRole('tab', { name: /Ended/ }).click();
  const card = page.getByRole('article').filter({ hasText: 'Old latte' });
  await expect(card.locator('.badge', { hasText: 'Archived' })).toBeVisible();
  await expect(
    card.getByText('Its import was archived. Import its code again to use it.'),
  ).toBeVisible();
  await expect(card.getByRole('button', { name: /^(Activate|Submit|Edit draft)$/ })).toHaveCount(0);
});

test('the import works at phone width', async ({ page }) => {
  await openVouchers(page, 'BUSINESS_OWNER', newCore());
  await page.setViewportSize({ width: 390, height: 844 });
  await chooseFile(page, ['type,title,code,points_cost,item', 'free_item,A latte,LATTE,500,Latte']);
  await page.getByRole('button', { name: 'Check file' }).click();
  const create = page.getByRole('button', { name: 'Create 1 draft' });
  await expect(create).toBeInViewport();
  // The dialog fits the screen: nothing in it reaches past the right edge.
  const right = await page
    .getByRole('dialog')
    .evaluate((dialog) =>
      Math.max(
        ...[dialog, ...dialog.querySelectorAll('*')].map((el) => el.getBoundingClientRect().right),
      ),
    );
  expect(right).toBeLessThanOrEqual(390);
});
