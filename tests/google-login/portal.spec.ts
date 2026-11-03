import { expect, test, type Page } from '@playwright/test';

const identity = {
  user: {
    id: 'user-1',
    email: 'person@example.com',
    fullName: 'Test Person',
    avatarUrl: null,
    systemRole: 'SYSTEM_USER',
  },
  organizations: [] as Array<{
    organizationId: string;
    name: string;
    slug: string;
    persona: string;
  }>,
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
};

async function google(page: Page, wrongNonce = false) {
  await page.route('**/v1/console/organization-requests', (route) => route.fulfill({ json: [] }));
  await page.route('**/v1/console/organizations/*', (route) =>
    route.fulfill({
      json: {
        id: 'developer',
        name: 'Developer business',
        slug: 'developer',
        status: 'ACTIVE',
        legalName: null,
        taxId: null,
        persona: 'BUSINESS_DEVELOPER',
      },
    }),
  );
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
    let options;
    window.google = { accounts: { id: {
      initialize(value) { options = value; },
      renderButton(element, settings) {
        const button = document.createElement('button'); button.textContent = 'Continue with Google';
        button.style.width = settings.width + 'px';
        button.onclick = () => options.callback({ credential: 'header.' + btoa(JSON.stringify({ nonce: ${wrongNonce ? "'wrong'" : 'options.nonce'} })) + '.signature' });
        element.append(button);
      },
      disableAutoSelect() {},
    } } };
  `,
    }),
  );
}

test('business Google identity has no implicit organization access or password login', async ({
  page,
}) => {
  await google(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      'octap.session',
      JSON.stringify({
        token: 'forged',
        user: { role: 'merchant', merchantRole: 'owner' },
        expiresAt: '2099-01-01',
      }),
    ),
  );
  await page.route('**/v1/console/auth/google', (route) => {
    expect(Object.keys(route.request().postDataJSON())).toEqual(['idToken']);
    return route.fulfill({ json: identity });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in with Google' })).toBeVisible();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByText('Test Person')).toBeVisible();
  await expect(page.getByText(/no active organization access/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('octap.mockdb'))).toBeNull();
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Skip setup', exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Object.values(localStorage).some(
        (value) => value.includes('header.') && value.includes('.signature'),
      ),
    ),
  ).toBe(false);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
});

test('multiple organizations require a selection and refresh removes revoked access', async ({
  page,
}) => {
  await google(page);
  await page.route('**/v1/console/auth/google', (route) =>
    route.fulfill({
      json: {
        ...identity,
        organizations: [
          {
            organizationId: 'owner',
            name: 'Owner business',
            slug: 'owner',
            persona: 'BUSINESS_OWNER',
          },
          {
            organizationId: 'developer',
            name: 'Developer business',
            slug: 'developer',
            persona: 'BUSINESS_DEVELOPER',
          },
        ],
      },
    }),
  );
  await page.route('**/v1/console/me', (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer header\./);
    return route.fulfill({ json: identity });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('combobox', { name: 'Organization', exact: true })).toHaveValue('');
  await page.getByRole('combobox', { name: 'Organization', exact: true }).selectOption('developer');
  await expect(page).toHaveURL(/\/developer$/);
  await expect(page.getByRole('heading', { name: 'Developer dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Refresh access' }).click();
  await expect(page.getByText(/no active organization access/i)).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Organization', exact: true })).toHaveCount(0);
});

test('admin portal denies a regular system user', async ({ page }) => {
  await google(page);
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: identity }));
  await page.goto('http://localhost:5181');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByText(/This account is not a System Admin/)).toBeVisible();
});

test('rejects a mismatching Google nonce before contacting Core', async ({ page }) => {
  await google(page, true);
  let requests = 0;
  await page.route('**/v1/console/auth/google', (route) => {
    requests++;
    return route.fulfill({ json: identity });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('alert')).toContainText('did not match');
  expect(requests).toBe(0);
});

test('displays Core failures without granting access', async ({ page }) => {
  await google(page);
  await page.route('**/v1/console/auth/google', (route) =>
    route.fulfill({ status: 401, json: { message: 'Google identity could not be verified.' } }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be verified');
  await expect(page.getByText('Test Person')).toHaveCount(0);
});

test('Google entry fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await google(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.screenshot({ path: 'test-results/google-login-mobile.png', fullPage: true });
});

test('new users submit organization requests through Core and see pending approval', async ({
  page,
}) => {
  await google(page);
  let applications: unknown[] = [];
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/organization-requests', (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer header\./);
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toMatchObject({
        name: 'My Business',
        slug: 'my-business',
      });
      applications = [{ id: 'request-1', name: 'My Business', status: 'PENDING' }];
      return route.fulfill({ json: { id: 'request-1' } });
    }
    return route.fulfill({ json: applications });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole('button', { name: /Individual \/ Household business/ }).click();
  await page.getByLabel('Organization name', { exact: true }).fill('My Business');
  await page.getByLabel('Organization slug').fill('my-business');
  await page.getByRole('button', { name: 'Review organization', exact: true }).click();
  await page.getByRole('button', { name: 'Submit organization request' }).click();
  await expect(page.getByText('My Business · PENDING')).toBeVisible();
  await page.screenshot({ path: 'test-results/organization-onboarding.png', fullPage: true });
  await expect(page.getByText(/submitted for approval/)).toBeVisible();
});

test('an owner reaches settings and team while invitation links contain a one-time token', async ({
  page,
}) => {
  await google(page);
  const owner = {
    ...identity,
    organizations: [
      { organizationId: 'owner', name: 'Owner business', slug: 'owner', persona: 'BUSINESS_OWNER' },
    ],
  };
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: owner }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: owner }));
  await page.route('**/v1/console/organizations/owner', (route) =>
    route.fulfill({
      json: {
        id: 'owner',
        name: 'Owner business',
        slug: 'owner',
        persona: 'BUSINESS_OWNER',
        status: 'ACTIVE',
        organizationType: 'INDIVIDUAL_HOUSEHOLD',
        representativeName: 'Owner',
      },
    }),
  );
  await page.route('**/v1/console/organizations/owner/profile', (route) => {
    expect(route.request().method()).toBe('PATCH');
    expect(route.request().postDataJSON().name).toBe('Renamed business');
    return route.fulfill({ json: { updated: true } });
  });
  let developerStatus = 'ACTIVE';
  await page.route('**/v1/console/organizations/owner/staff', (route) =>
    route.fulfill({
      json: [
        {
          id: 'owner-user',
          fullName: 'Owner',
          email: 'owner@example.com',
          persona: 'BUSINESS_OWNER',
          status: 'ACTIVE',
        },
        {
          id: 'developer-user',
          fullName: 'Developer',
          email: 'developer@example.com',
          persona: 'BUSINESS_DEVELOPER',
          status: developerStatus,
        },
      ],
    }),
  );
  await page.route('**/v1/console/organizations/owner/staff/developer-user', (route) => {
    expect(route.request().method()).toBe('PATCH');
    expect(route.request().headers().authorization).toMatch(/^Bearer header\./);
    developerStatus = route.request().postDataJSON().status;
    return route.fulfill({ json: { updated: true } });
  });
  await page.route('**/v1/console/organizations/owner/invitations', (route) =>
    route.fulfill({
      json: route.request().method() === 'POST' ? { id: 'invite-1', token: 'b'.repeat(64) } : [],
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/merchant$/);
  await expect(page.getByRole('heading', { name: 'Owner business loyalty' })).toBeVisible();
  await page.screenshot({ path: 'test-results/owner-portal.png', fullPage: true });
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Organization name', { exact: true }).fill('Renamed business');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Organization profile saved')).toBeVisible();
  await page.getByRole('link', { name: 'Team and invitations' }).click();
  await expect(
    page.getByRole('button', { name: 'Suspend owner@example.com', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Suspend developer@example.com', exact: true }).click();
  await page.getByRole('button', { name: 'Restore developer@example.com', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Suspend developer@example.com', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/oct63-team-access.png', fullPage: true });
  await page.getByLabel('Developer email').fill('developer@example.com');
  await page.getByRole('button', { name: 'Invite Developer' }).click();
  await expect(page.getByLabel('Invitation link', { exact: true })).toHaveValue(
    `http://localhost:5180/?invitation=${'b'.repeat(64)}`,
  );
  await page.getByRole('link', { name: 'Organization onboarding', exact: true }).click();
  await expect(page.locator('aside')).toHaveCount(0);
  await page.getByRole('button', { name: 'Skip setup', exact: true }).click();
  await expect(page).toHaveURL(/\/merchant$/);
  await expect(page.locator('aside')).toBeVisible();
});

test('invited Google user accepts and enters the Developer portal', async ({ page }) => {
  await google(page);
  let accepted = false;
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/me', (route) =>
    route.fulfill({
      json: accepted
        ? {
            ...identity,
            organizations: [
              {
                organizationId: 'developer',
                name: 'Developer business',
                slug: 'developer',
                persona: 'BUSINESS_DEVELOPER',
              },
            ],
          }
        : identity,
    }),
  );
  await page.route(`**/v1/console/invitations/${'b'.repeat(64)}/accept`, (route) => {
    accepted = true;
    return route.fulfill({ json: { organizationId: 'developer' } });
  });
  await page.goto(`/?invitation=${'b'.repeat(64)}`);
  await expect(page).not.toHaveURL(/invitation=/);
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByLabel('Invitation token')).toHaveValue('b'.repeat(64));
  await page.getByRole('button', { name: 'Accept invitation' }).click();
  await expect(page).toHaveURL(/\/developer$/);
  await expect(page.getByRole('heading', { name: 'Developer dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Team and invitations' })).toHaveCount(0);
});

test('platform admin approves an organization through Core', async ({ page }) => {
  await google(page);
  const admin = { ...identity, user: { ...identity.user, systemRole: 'SYSTEM_ADMIN' } };
  let approved = false;
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: admin }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: admin }));
  await page.route('**/v1/platform/organization-requests', (route) =>
    route.fulfill({
      json: [
        {
          id: 'request-1',
          name: 'New business',
          slug: 'new-business',
          applicantEmail: 'owner@example.com',
          status: approved ? 'APPROVED' : 'PENDING',
          nationalIdLast4: '1234',
        },
      ],
    }),
  );
  await page.route('**/v1/platform/organization-requests/request-1/approve', (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer header\./);
    approved = true;
    return route.fulfill({ json: { organizationId: 'new-org' } });
  });
  await page.goto('http://localhost:5181');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByText(`CCCD: ${'\u2022'.repeat(8)}1234 \u2014 not verified`)).toBeVisible();
  await page.getByRole('button', { name: 'Approve New business' }).click();
  await expect(page.getByText('owner@example.com · APPROVED')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Metrics', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Partners', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('octap.admin.mockdb'))).toBeNull();
  await expect(page.getByRole('link', { name: 'Business dashboard', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });
});

test('System Admin with an explicit tenant membership can enter the business dashboard', async ({
  page,
}) => {
  await google(page);
  const adminOwner = {
    ...identity,
    user: { ...identity.user, systemRole: 'SYSTEM_ADMIN' },
    organizations: [
      { organizationId: 'owner', name: 'Owner business', slug: 'owner', persona: 'BUSINESS_OWNER' },
    ],
  };
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: adminOwner }));
  await page.route('**/v1/console/organizations/owner', (route) =>
    route.fulfill({
      json: {
        id: 'owner',
        name: 'Owner business',
        slug: 'owner',
        status: 'ACTIVE',
        persona: 'BUSINESS_OWNER',
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/merchant$/);
  await expect(page.getByRole('heading', { name: 'Owner business loyalty' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();
});

test('System Admin business portal link requires an explicit tenant membership', async ({
  page,
}) => {
  await google(page);
  const adminOwner = {
    ...identity,
    user: { ...identity.user, systemRole: 'SYSTEM_ADMIN' },
    organizations: [
      { organizationId: 'owner', name: 'Owner business', slug: 'owner', persona: 'BUSINESS_OWNER' },
    ],
  };
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: adminOwner }));
  await page.route('**/v1/platform/organization-requests', (route) => route.fulfill({ json: [] }));
  await page.goto('http://localhost:5181');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('link', { name: 'Business dashboard', exact: true })).toHaveAttribute(
    'href',
    'http://localhost:5173/',
  );
});

test('original password demo and dashboard remain available only in explicit demo mode', async ({
  page,
}) => {
  await page.goto('http://localhost:5182');
  await page.getByPlaceholder('you@company.vn').fill('owner@lotusmart.vn');
  await page.locator('input[type=password]').fill('octap123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/merchant$/);
  await expect(page.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0);
});

test('organization setup offers both types and company registration is required before review', async ({
  page,
}) => {
  await google(page);
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: identity }));
  let requests = 0;
  await page.route('**/v1/console/organization-requests', (route) => {
    if (route.request().method() === 'POST') {
      requests++;
      expect(route.request().postDataJSON()).toEqual({
        name: 'Brand',
        slug: 'registered-company',
        organizationType: 'COMPANY',
        legalName: 'Registered Company',
        taxId: '0123456789',
      });
      return route.fulfill({ json: { id: 'request-1' } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(
    page.getByRole('button', { name: /Individual \/ Household business/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Company \(registered legal entity\)/ }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/organization-type-selection.png', fullPage: true });
  await page.getByRole('button', { name: /Company \(registered legal entity\)/ }).click();
  await page.getByLabel('Organization name', { exact: true }).fill('Brand');
  await page.getByLabel('Organization slug').fill('registered-company');
  await page.getByRole('button', { name: 'Review organization', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review your organization' })).toHaveCount(0);
  expect(requests).toBe(0);
  await page.getByLabel('Company legal name').fill('Registered Company');
  await page.getByLabel('Business registration / tax number').fill('0123456789');
  await page.getByRole('button', { name: 'Review organization', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review your organization' })).toBeVisible();
  await page.getByRole('button', { name: 'Submit organization request' }).click();
  await expect(
    page.getByRole('heading', { name: 'Organization request submitted', exact: true }),
  ).toBeVisible();
  expect(requests).toBe(1);
});

test('individual setup masks CCCD during review and can go back without losing details', async ({
  page,
}) => {
  await google(page);
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: identity }));
  await page.route('**/v1/console/organization-requests', (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toMatchObject({
        organizationType: 'INDIVIDUAL_HOUSEHOLD',
        nationalId: '000000000001',
        representativeName: 'Test Person',
      });
      return route.fulfill({ json: { id: 'individual-1' } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await page.getByRole('button', { name: /Individual \/ Household business/ }).click();
  await page.getByLabel('Organization name', { exact: true }).fill('Household');
  await page.getByLabel('Organization slug').fill('household');
  await page.getByLabel('CCCD number (optional)').fill('000000000001');
  await page.getByRole('button', { name: 'Review organization', exact: true }).click();
  await expect(page.getByText('••••••••0001 — not verified')).toBeVisible();
  await expect(page.getByText('000000000001', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Organization name', { exact: true })).toHaveValue('Household');
  await page.getByRole('button', { name: 'Review organization', exact: true }).click();
  await page.getByRole('button', { name: 'Submit organization request' }).click();
  await expect(
    page.getByRole('heading', { name: 'Organization request submitted', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.values(localStorage).some((value) => value.includes('000000000001')),
    ),
  ).toBe(false);
});

test('an Owner updates a saved CCCD without receiving its old plaintext', async ({ page }) => {
  await google(page);
  const owner = {
    ...identity,
    organizations: [
      { organizationId: 'owner', name: 'Household', slug: 'household', persona: 'BUSINESS_OWNER' },
    ],
  };
  let last4 = '0001';
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: owner }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: owner }));
  await page.route('**/v1/console/organizations/owner', (route) =>
    route.fulfill({
      json: {
        id: 'owner',
        name: 'Household',
        slug: 'household',
        status: 'ACTIVE',
        persona: 'BUSINESS_OWNER',
        organizationType: 'INDIVIDUAL_HOUSEHOLD',
        representativeName: 'Owner',
        nationalIdLast4: last4,
      },
    }),
  );
  await page.route('**/v1/console/organizations/owner/profile', (route) => {
    expect(route.request().postDataJSON().nationalId).toBe('000000000002');
    last4 = '0002';
    return route.fulfill({ json: { updated: true } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.getByText('Saved CCCD: ••••••••0001 — not verified')).toBeVisible();
  await expect(page.getByLabel('Update CCCD number')).toHaveValue('');
  await page.getByLabel('Update CCCD number').fill('000000000002');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Saved CCCD: ••••••••0002 — not verified')).toBeVisible();
  await expect(page.getByLabel('Update CCCD number')).toHaveValue('');
});

test('real Owner routes keep the shell mounted and report unconnected modules', async ({
  page,
}) => {
  await google(page);
  const owner = {
    ...identity,
    organizations: [
      { organizationId: 'owner', name: 'Owner business', slug: 'owner', persona: 'BUSINESS_OWNER' },
    ],
  };
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: owner }));
  await page.route('**/v1/console/me', (route) => route.fulfill({ json: owner }));
  let release: (() => void) | undefined;
  let hold = false;
  await page.route('**/v1/console/organizations/owner', async (route) => {
    if (hold)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    await route.fulfill({
      json: {
        id: 'owner',
        name: 'Owner business',
        slug: 'owner',
        persona: 'BUSINESS_OWNER',
        status: 'ACTIVE',
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.locator('aside')).toBeVisible();
  await page
    .locator('aside')
    .evaluate((element) => element.setAttribute('data-shell-instance', 'retained'));
  hold = true;
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.locator('aside')).toHaveAttribute('data-shell-instance', 'retained');
  await expect.poll(() => Boolean(release)).toBe(true);
  hold = false;
  release!();
  await expect(page.getByRole('button', { name: 'Save profile' })).toBeVisible();
  await page.getByRole('button', { name: 'Refresh access', exact: true }).click();
  await expect(page.getByText('Access refreshed')).toBeVisible();
  await expect(page.locator('aside')).toHaveAttribute('data-shell-instance', 'retained');
  for (const path of ['/merchant/rewards']) {
    await page
      .getByRole('link', { name: path.endsWith('rewards') ? 'Rewards' : 'Members', exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(path + '$'));
    await expect(
      page.getByText('This dashboard module is not connected to Core yet.'),
    ).toBeVisible();
  }
  await page.goto('/wallet');
  await expect(page.getByText('404', { exact: true })).toBeVisible();
});

test('expired Google credentials explain the return to login', async ({ page }) => {
  await page.clock.install();
  await google(page);
  const shortIdentity = { ...identity, expiresAt: new Date(Date.now() + 60_000).toISOString() };
  await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: shortIdentity }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.clock.fastForward(61_000);
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Your Google sign-in has expired. Sign in again.',
  );
});

for (const persona of ['BUSINESS_OWNER', 'BUSINESS_DEVELOPER']) {
  test(`member directory ${persona} permissions and current balance`, async ({ page }) => {
    await google(page);
    const account = {
      ...identity,
      organizations: [{ organizationId: 'tenant', name: 'Tenant', slug: 'tenant', persona }],
    };
    await page.route('**/v1/console/auth/google', (route) => route.fulfill({ json: account }));
    await page.route('**/v1/console/me', (route) => route.fulfill({ json: account }));
    await page.route('**/v1/console/organizations/tenant', (route) =>
      route.fulfill({
        json: { id: 'tenant', name: 'Tenant', slug: 'tenant', status: 'ACTIVE', persona },
      }),
    );
    const member = {
      id: 'member-1',
      endUserId: 'customer-1',
      displayName: 'Alice',
      email: 'alice@example.com',
      phoneNumber: null,
      tier: 'BRONZE',
      status: 'ACTIVE',
      externalMemberId: 'POS-1',
      metadata: {},
      joinedAt: new Date().toISOString(),
    };
    await page.route('**/v1/console/organizations/tenant/members?*', (route) => {
      expect(route.request().headers().authorization).toMatch(/^Bearer header\./);
      return route.fulfill({ json: { items: [member], nextCursor: null } });
    });
    await page.route('**/v1/console/organizations/tenant/members/member-1', (route) => {
      if (route.request().method() === 'PATCH') {
        expect(persona).toBe('BUSINESS_OWNER');
        Object.assign(member, route.request().postDataJSON());
        return route.fulfill({ json: { updated: true } });
      }
      return route.fulfill({
        json: {
          ...member,
          balance: {
            confirmedBalance: 123,
            pendingEarn: 5,
            pendingRedemption: 0,
            stale: true,
            observedAt: new Date().toISOString(),
          },
        },
      });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await page.getByRole('link', { name: 'Members', exact: true }).click();
    await page.getByLabel('Search members').fill('Alice');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'View Alice' }).click();
    await expect(page.getByText(/Confirmed balance: 123/)).toBeVisible();
    if (persona === 'BUSINESS_OWNER') {
      await page.getByLabel('Member status', { exact: true }).selectOption('BLOCKED');
      await page.getByRole('button', { name: 'Save member' }).click();
      await expect(page.getByRole('cell', { name: 'BLOCKED', exact: true })).toBeVisible();
      await page.screenshot({ path: 'test-results/oct71-members.png', fullPage: true });
    } else await expect(page.getByRole('button', { name: 'Save member' })).toHaveCount(0);
  });
}
