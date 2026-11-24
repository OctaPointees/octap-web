import { expect, test, type Page, type Route } from '@playwright/test';
import { ORG, catalog, openRewards, voucher, type Voucher } from './rewards-fixtures';

/**
 * OCT-304: importing rewards as one draft batch, against a stand-in for Core's console batch routes
 * (OCT-303): the Review step is a dry run, Create writes one batch, and a batch is activated,
 * paused, resumed or archived at once.
 */

type Batch = Record<string, unknown> & { id: string; archivedAt: string | null };

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'batch-1',
    organizationId: ORG,
    name: 'rewards.csv',
    source: 'CONSOLE',
    createdBy: { type: 'USER', id: 'u1' },
    createdAt: '2026-11-22T07:05:00.000Z',
    archivedAt: null,
    statusCounts: { DRAFT: 2 },
    ...overrides,
  };
}

/** What the stand-in answers, and what it was sent. */
interface BatchCore {
  batches?: Batch[];
  vouchers?: Voucher[];
  /** Each item's result, by its code, for a dry run and for the real create. */
  results?: (item: { code: string }, index: number) => Record<string, unknown>;
  /** What an action answers for each voucher. */
  outcomes?: Record<string, { outcome: string; reason?: string }>;
  posts: Record<string, unknown>[];
  actions: string[];
  lists: string[];
}

function batchRoutes(core: BatchCore) {
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
      core.actions.push(action);
      return route.fulfill({
        json: {
          batch: batch(),
          vouchers: (core.vouchers ?? []).map((v) => ({
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
      const found = (core.batches ?? []).find((b) => b.id === id) ?? batch({ id });
      return route.fulfill({ json: { ...found, vouchers: core.vouchers ?? [] } });
    }
    core.lists.push(url.search);
    const archived = url.searchParams.get('includeArchived') === 'true';
    return route.fulfill({
      json: (core.batches ?? []).filter((b) => archived || !b.archivedAt),
    });
  };
}

const newCore = (core: Partial<BatchCore> = {}): BatchCore => ({
  posts: [],
  actions: [],
  lists: [],
  ...core,
});

async function chooseFile(page: Page, lines: string[], name = 'rewards.csv') {
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
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(core));
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
  await expect(page.getByText('2 rewards can be created. 3 rows need attention.')).toBeVisible();
  expect(core.posts[0]).toMatchObject({ name: 'rewards.csv', dryRun: true });
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
  await expect(page.getByText('2 drafts in “rewards.csv”.')).toBeVisible();
  expect(core.posts[1]).toMatchObject({ name: 'rewards.csv', dryRun: false });

  await page.getByRole('button', { name: 'Open the batch' }).click();
  await expect(page).toHaveURL(/\/merchant\/rewards\/batches\/batch-1$/);
  await expect(page.getByRole('heading', { name: 'rewards.csv' })).toBeVisible();
});

test('a corrected row after a bad one with the same code is not a repeat', async ({ page }) => {
  const core = newCore();
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(core));
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
  await expect(page.getByText('1 row ready to check, 2 need fixing in the file.')).toBeVisible();
});

test('a CSV reads the new columns, an old template, and dates Excel rewrote', async ({ page }) => {
  const core = newCore();
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(core));
  await chooseFile(page, [
    // `expires_on` is the old name of `claims_close_on`; Excel saved the dates its own way.
    'type,title,code,points_cost,item,per_member_limit,valid_for_days,expires_on',
    'free_item,US date,US-DATE,100,Latte,1,14,12/31/2027',
    'free_item,VN date,VN-DATE,100,Latte,,,13/12/2027',
    'free_item,Unclear date,UNCLEAR,100,Latte,,,05/02/2027',
    'free_item,Too long,TOO-LONG,100,Latte,,4000,2027-12-31',
  ]);
  await expect(page.getByText(/could be 2027-02-05 or 2027-05-02/)).toBeVisible();
  await expect(page.getByText(/valid_for_days: Enter a whole number of days/)).toBeVisible();
  await page.getByRole('button', { name: 'Check file' }).click();
  await expect(page.getByRole('button', { name: 'Create 2 drafts, skip 2 rows' })).toBeVisible();
  const [us, vn] = core.posts[0].items as Record<string, unknown>[];
  expect(us).toMatchObject({ code: 'US-DATE', perMemberLimit: 1, validForDays: 14 });
  expect(vn).toMatchObject({ code: 'VN-DATE', perMemberLimit: null, validForDays: null });
  // 12/31/2027 can only be month first, 13/12/2027 only day first: read as 31 and 13 December.
  const day = (body: Record<string, unknown>) => new Date(String(body.expiresAt));
  expect([day(us).getMonth(), day(us).getDate()]).toEqual([11, 31]);
  expect([day(vn).getMonth(), day(vn).getDate()]).toEqual([11, 13]);
});

test('the downloadable template has one cell per column on every row', async ({ page }) => {
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(newCore()));
  await page.getByRole('button', { name: 'Import CSV' }).click();
  const href = await page.getByRole('link', { name: 'CSV version' }).getAttribute('href');
  const text = decodeURIComponent(String(href).split(',').slice(1).join(','));
  await page.getByLabel('CSV file').setInputFiles({
    name: 'template.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(text),
  });
  // Read back through the importer: every row is ready, none has a problem.
  await expect(page.getByText('7 rows ready to check.')).toBeVisible();
  expect(text.split('\n')[0]).toContain('claims_close_on');
});

test('the Excel template has a type drop-down and checks dates and numbers', async ({ page }) => {
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(newCore()));
  await page.getByRole('button', { name: 'Import CSV' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download the template (Excel)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('octap-rewards-template.xlsx');
  // Stored without compression, so the sheets read as text inside the zip.
  const path = await file.path();
  const text = (await import('node:fs')).readFileSync(path).toString('utf8');
  expect(text.startsWith('PK')).toBe(true);
  expect(text).toContain(
    '<formula1>"percent_off,amount_off,free_item,buy_x_get_y,free_shipping,fixed_price,custom"</formula1>',
  );
  expect(text).toMatch(/type="date"[^>]*sqref="Q2:Q101"/);
  expect(text).toMatch(/type="whole"[^>]*sqref="D2:D101"/);
  expect(text).toContain('<sheet name="Guide"');
});

test('nothing can be created when no row can be written, and Review says why', async ({ page }) => {
  const core = newCore({
    results: () => ({
      status: 'error',
      error: { code: 'INVALID', field: 'pointsCost', message: 'pointsCost is too high' },
    }),
  });
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(core));
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

const draft = (code: string, overrides: Partial<Voucher> = {}) =>
  voucher({ id: `v-${code}`, code, title: code, batchId: 'batch-1', ...overrides });

test('an Owner activates a batch, which also approves what waits, and sees each result', async ({
  page,
}) => {
  const core = newCore({
    batches: [batch({ statusCounts: { DRAFT: 2, PENDING_APPROVAL: 1, ACTIVE: 1 } })],
    vouchers: [
      draft('A'),
      draft('SOON'),
      draft('WAIT', { status: 'PENDING_APPROVAL' }),
      draft('LIVE', { status: 'ACTIVE', publishStatus: 'PUBLISHED' }),
    ],
    outcomes: {
      A: { outcome: 'publishing' },
      WAIT: { outcome: 'publishing' },
      SOON: { outcome: 'failed', reason: 'expiresAt must stay valid for at least 24 hours' },
    },
  });
  await openRewards(
    page,
    'BUSINESS_OWNER',
    catalog([], []),
    { voucherApprovalRequired: true },
    batchRoutes(core),
  );
  await openBatch(page, /rewards\.csv/);
  await expect(page.getByText('1 reward waits for your approval.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause all (1)' })).toBeVisible();

  await page.getByRole('button', { name: 'Activate all (3)' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('2 drafts will start publishing')).toBeVisible();
  await expect(
    dialog.getByText('1 reward waiting for approval will be approved and published'),
  ).toBeVisible();
  await expect(dialog.getByText('1 reward already live is skipped')).toBeVisible();
  await dialog.getByRole('button', { name: 'Activate 3' }).click();
  await expect.poll(() => core.actions).toEqual(['activate']);
  const soon = page.getByRole('listitem', { name: 'SOON' });
  await expect(soon.getByText(/Not done: expiresAt must stay valid/)).toBeVisible();
  await expect(
    page.getByRole('listitem', { name: 'WAIT' }).getByText('Publishing on-chain…'),
  ).toBeVisible();
});

test('a reward paused while publishing, whose publish failed, is activated again with the batch', async ({
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
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(core));
  await openBatch(page, /rewards\.csv/);
  await expect(
    page.getByRole('listitem', { name: 'STUCK' }).getByText('Publish failed'),
  ).toBeVisible();
  // Core activates the failed one too; neither is live, and the one already paused isn't paused again.
  await expect(page.getByRole('button', { name: 'Activate all (2)' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pause all/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Resume all/ })).toHaveCount(0);
  // Archiving freezes the failed one with the draft; the one still publishing is kept, like a live one.
  await page.getByRole('button', { name: 'Archive' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('Its 2 drafts are frozen.')).toBeVisible();
  await expect(dialog.getByText(/Its 1 live reward stays live/)).toBeVisible();
});

test('with approval on, a Developer submits the batch and cannot pause it', async ({ page }) => {
  const core = newCore({
    batches: [batch({ statusCounts: { DRAFT: 2, ACTIVE: 1 } })],
    vouchers: [
      draft('A'),
      draft('B'),
      draft('LIVE', { status: 'ACTIVE', publishStatus: 'PUBLISHED' }),
    ],
  });
  await openRewards(
    page,
    'BUSINESS_DEVELOPER',
    catalog([], []),
    { voucherApprovalRequired: true },
    batchRoutes(core),
  );
  await openBatch(page, /rewards\.csv/);
  await expect(page).toHaveURL(/\/developer\/rewards\/batches\/batch-1$/);
  await expect(page.getByRole('button', { name: /Pause all/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit batch for approval (2)' }).click();
  await expect(
    page.getByRole('alertdialog').getByText('2 drafts will wait for an Owner'),
  ).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Submit' }).click();
  await expect.poll(() => core.actions).toEqual(['activate']);
});

test('archiving says what is frozen and what stays live, then hides Activate', async ({ page }) => {
  const core = newCore({
    batches: [batch({ statusCounts: { DRAFT: 1, ACTIVE: 1 } })],
    vouchers: [draft('A'), draft('LIVE', { status: 'ACTIVE', publishStatus: 'PUBLISHED' })],
    outcomes: { A: { outcome: 'archived' } },
  });
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(core));
  await openBatch(page, /rewards\.csv/);
  await page.getByRole('button', { name: 'Archive' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('Its 1 draft is frozen.')).toBeVisible();
  await expect(
    dialog.getByText('Its 1 live reward stays live: use Pause all to stop claims.'),
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
  await expect.poll(() => core.actions).toEqual(['archive']);
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
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(core));
  // The Rewards page leads back to the import with drafts left.
  await expect(
    page.getByText('“catalog-11-11.csv” has 60 drafts waiting to go live.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Import history' }).click();
  await expect(page.getByText('34 live · 2 waiting · 60 draft')).toBeVisible();
  await expect(page.getByText(/Import of /)).toHaveCount(0);
  await page.getByLabel('Show archived').check();
  await expect(page.getByText(/Import of /)).toBeVisible();
  await expect(page.getByText(/API · an API key/)).toBeVisible();
  expect(core.lists).toContain('?includeArchived=true');
});

test('an archived reward has its own tab and offers no Edit or Activate', async ({ page }) => {
  await openRewards(
    page,
    'BUSINESS_OWNER',
    catalog([voucher({ id: 'v-a', title: 'Old latte', status: 'ARCHIVED' })], []),
  );
  await page.getByRole('tab', { name: 'Archived (1)' }).click();
  const card = page.getByRole('article', { name: 'Old latte' });
  await expect(
    card.getByText('Its import was archived. Import its code again to use it.'),
  ).toBeVisible();
  await expect(card.getByRole('button', { name: /Edit|Activate/ })).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'View' })).toBeVisible();
});

test('the import works at phone width', async ({ page }) => {
  const core = newCore();
  await openRewards(page, 'BUSINESS_OWNER', catalog([], []), {}, batchRoutes(core));
  await page.setViewportSize({ width: 390, height: 844 });
  await chooseFile(page, ['type,title,code,points_cost,item', 'free_item,A latte,LATTE,500,Latte']);
  await page.getByRole('button', { name: 'Check file' }).click();
  const create = page.getByRole('button', { name: 'Create 1 draft' });
  await expect(create).toBeInViewport();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
