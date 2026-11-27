import { expect, test, type Page } from '@playwright/test';

/**
 * OCT-337: the approval setting can change under someone who has the page open. A Developer's
 * Activate or Submit then fails (403 or 409), and the page reads the organization again so the
 * card offers the action that now applies; saving that setting never drops what the Owner is
 * typing in another settings form.
 */

const ORG = 'org-1';

/** What the stand-in for Core holds. The tests change it as an Owner elsewhere would. */
interface Core {
  approvalRequired: boolean;
  name: string;
  catalog: Record<string, unknown>[];
}

const draft = {
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
  createdBy: { type: 'USER', id: 'u1' },
  activatedBy: null,
  activatedAt: null,
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
};

/** Signs in as `persona` (user `u1`) of one organization. */
async function signIn(page: Page, persona: 'BUSINESS_OWNER' | 'BUSINESS_DEVELOPER', core: Core) {
  const identity = {
    user: {
      id: 'u1',
      email: 'someone@example.com',
      fullName: 'Someone',
      avatarUrl: null,
      systemRole: 'SYSTEM_USER',
    },
    organizations: [{ organizationId: ORG, name: core.name, slug: 'coffee', persona }],
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
        name: core.name,
        slug: 'coffee',
        status: 'ACTIVE',
        persona,
        organizationType: null,
        legalName: null,
        taxId: null,
        representativeName: null,
        nationalIdLast4: null,
        voucherApprovalRequired: core.approvalRequired,
      },
    }),
  );
  await page.route(`**/v1/console/organizations/${ORG}/vouchers`, (route) =>
    route.fulfill({ json: core.catalog }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
}

async function openVouchers(page: Page) {
  await page.getByRole('link', { name: /^Vouchers/ }).click();
  await expect(page).toHaveURL(/\/organizations\/coffee\/vouchers$/);
}

/** Core's refusal for an action on `voucher-1`, as `status` with `message`. */
function refuse(
  page: Page,
  action: 'activate' | 'submit',
  status: number,
  message: string,
  then: () => void,
) {
  const path =
    action === 'activate'
      ? `**/v1/console/organizations/${ORG}/vouchers/voucher-1`
      : `**/v1/console/organizations/${ORG}/vouchers/voucher-1/submit`;
  return page.route(path, (route) => {
    if (route.request().method() === 'GET') return route.fallback();
    then();
    return route.fulfill({ status, json: { statusCode: status, message } });
  });
}

test('a Developer whose Owner just turned approval on is told to submit, and the card switches', async ({
  page,
}) => {
  const core: Core = { approvalRequired: false, name: 'Coffee shop', catalog: [draft] };
  await signIn(page, 'BUSINESS_DEVELOPER', core);
  await openVouchers(page);
  // Meanwhile the Owner turns approval on: Core refuses the activation.
  await refuse(
    page,
    'activate',
    403,
    'This organization requires approval: submit the voucher for approval instead of activating it',
    () => (core.approvalRequired = true),
  );

  await page.getByRole('button', { name: 'Activate', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByRole('button', { name: 'Activate', exact: true }).click();

  await expect(
    page.getByText(/Approval is now required in this organization/).first(),
  ).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Submit', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activate', exact: true })).toHaveCount(0);
});

test('a Developer whose Owner just turned approval off is told to activate, and the dialog closes', async ({
  page,
}) => {
  const core: Core = { approvalRequired: true, name: 'Coffee shop', catalog: [draft] };
  await signIn(page, 'BUSINESS_DEVELOPER', core);
  await openVouchers(page);
  await refuse(
    page,
    'submit',
    409,
    'This organization does not require approval: activate the voucher instead',
    () => (core.approvalRequired = false),
  );

  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText(/Approval is now off in this organization/).first()).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Activate', exact: true })).toBeVisible();
});

test('saving the approval switch keeps what the Owner is typing in the name', async ({ page }) => {
  const core: Core = { approvalRequired: false, name: 'Coffee shop', catalog: [] };
  await signIn(page, 'BUSINESS_OWNER', core);
  await page.route(`**/v1/console/organizations/${ORG}/settings`, (route) => {
    core.approvalRequired = route.request().postDataJSON().voucherApprovalRequired;
    return route.fulfill({ status: 204, body: '' });
  });
  await page.getByRole('link', { name: /^Settings/ }).click();
  await expect(page.getByRole('heading', { name: 'Organization settings' })).toBeVisible();

  const name = page.getByLabel('Organization name');
  await name.fill('Coffee & Co');
  const toggle = page.getByRole('checkbox', {
    name: /Developers need approval to activate vouchers/,
  });
  const approval = page.locator('form', { has: toggle });
  await toggle.check();
  // Saving reads the organization again; check only once that answer is in.
  const reread = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/v1/console/organizations/${ORG}`) &&
      response.request().method() === 'GET',
  );
  await approval.getByRole('button', { name: 'Save' }).click();
  await reread;

  // The organization is read again with approval on; the name being typed is still there.
  await expect(approval.getByText(/goes live once the Owner approves it/)).toBeVisible();
  await expect(toggle).toBeChecked();
  await expect(name).toHaveValue('Coffee & Co');
});
