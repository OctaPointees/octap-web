# OctaP Demo Guide

This guide uses **Git Bash on Windows**, with the repositories in `D:\CODE\CAPSTONE`.
The customer portal is an unofficial Starbucks-inspired coffee rewards concept, powered by OctaP.

## What the demo shows

1. Customer signs in with Google; Core/Enoki resolves their Sui address.
2. Customer joins the demo store and receives a member ID.
3. Merchant issues points from the business dashboard.
4. The worker submits the earn to Sui testnet; the customer sees confirmed points and history.
5. Customer spends 25 points to claim a coffee voucher.
6. Merchant redeems its serial at checkout; the voucher becomes `REDEEMED`.

**Important distinction:** earning is confirmed on Sui. Voucher claiming deducts points in
PostgreSQL only; using a voucher does not deduct them again. This is not the separate,
customer-signed on-chain POS redemption flow. Do not expect a Sui redeem transaction for a voucher claim.

## Quick restart: existing local setup

Open Docker Desktop and wait for its engine to start. You do **not** need to recreate the
organization, credentials, wallets, on-chain program, or voucher every time.

### Terminal 1: PostgreSQL and Redis

```bash
cd /d/CODE/CAPSTONE/octap-core
docker compose up -d
docker compose ps
```

Both containers should become `healthy`. This terminal can be reused after startup.

### Terminal 2: Core API

```bash
cd /d/CODE/CAPSTONE/octap-core
unset DATABASE_URL ENOKI_API_KEY API_HOST API_PORT
node --env-file=.env api/dist/main.js
```

Expected: `API listening.` at `http://127.0.0.1:3000`. Keep this terminal open for API errors.
If built output is missing or Core code changed, run `npm run build` in this repository first.

### Terminal 3: Core worker

```bash
cd /d/CODE/CAPSTONE/octap-core
unset DATABASE_URL ENOKI_API_KEY SUI_ISSUER_PRIVATE_KEY SUI_PROGRAM_ADMIN_PRIVATE_KEY SUI_NETWORK
node --env-file=.env api/dist/worker.js
```

Expected: chain-submit, webhook, and checkpoint-indexer workers start polling.
Keep this terminal open for chain confirmation or failure messages.

### Terminal 4: customer and merchant websites

```bash
cd /d/CODE/CAPSTONE/octap-web
npx concurrently -k "npm run dev:partner-website" "npm run dev:business"
```

| Component | Address |
| --- | --- |
| Customer coffee rewards website | http://localhost:4001 |
| Merchant business dashboard | http://localhost:4000 |
| Core API | http://127.0.0.1:3000 |
| Docker PostgreSQL on this machine | `127.0.0.1:5434` |
| Docker Redis | `127.0.0.1:6379` |

The marketing landing app also uses port 3000; it is unnecessary for this demo. Start only
the two frontends above, rather than the root `npm run dev` marketing command.

## Present the demo

### 1. Customer login and enrollment

1. Open http://localhost:4001.
2. Click Google's sign-in button and select your configured Google account.
3. Confirm **Google account connected** and inspect the connected rewards address if desired.
4. Click **Join coffee rewards**.
5. Copy the member ID. The page also displays **Your coffee points** and **Store rewards**.

Reloading currently requires signing in and joining again in the UI. Enrollment is idempotent:
the same Google identity and organization reuse the existing member rather than creating another.
The local identity cookie expires after one hour; **Use another account** clears it.

Current organization:

```text
Slug: octap-demo
Organization ID: 11111111-1111-4111-8111-111111111111
```

Existing test member, if continuing the same customer:

```text
c0cd3b3c-a8b7-4447-8001-4908245114c6
```

Use the ID displayed after your own Google login if testing another account.

### 2. Merchant issues points

1. Open http://localhost:4000 and sign in with the existing prototype account:
   - Email: `owner@lotusmart.vn`
   - Password: `octap123`
2. Click **Issue points**.
3. Paste the customer's member ID, enter **100**, and optionally add a receipt reference.
4. Submit once. The form displays the actual Core transaction and polls for confirmation.
5. Wait for **CONFIRMED** and a **Sui digest**.
6. On the customer website, click **Refresh** under points. Open **Recent activity**.

With the configured 10,000-bps policy, this earn should add 100 points to the existing balance.
`PENDING` means accepted, not chain-confirmed. The modal polls for about a minute and then
allows manual refresh. If a network response fails, **Retry same request** preserves the
idempotency key. **Start another request** means a new earn, not a retry.

The dashboard's overview statistics, existing sample transactions, and store label remain mock.
The live demo forms use the configured OctaP demo merchant credential.

### 3. Customer claims a coffee voucher

1. Under **Store rewards**, locate **Demo coffee reward**.
2. Click **Claim for 25 points** and confirm.
3. Verify the voucher becomes `AVAILABLE` and displays a serial code.
4. Verify points decrease by 25; use **Refresh** if needed.

For a member starting at zero, earning 100 and claiming this reward results in **75 points**.
Existing balances carry over, so use the before/after difference when repeating the demo.
Each member can claim a particular voucher only once.

### 4. Merchant uses the voucher

1. In the business dashboard sidebar, choose **Redeem voucher**.
2. Enter the member ID and the serial from the customer page.
3. Click **Redeem voucher**; expect `REDEEMED`.
4. Click **Check member balance**. No additional 25-point deduction should occur here.
5. On the customer website, refresh **Store rewards** to see `REDEEMED`.

A redeemed serial cannot be used again. To repeat the complete voucher scenario, use another
configured Google test customer or prepare a different active voucher. Refreshing the page
does not reset balances or voucher ownership.

## Configuration reference

Local secrets are already configured on this machine. Keep them in the ignored files below;
do not paste private keys or Google ID tokens into screenshots, chat, or committed documents.

### Core: `octap-core/.env`

```dotenv
API_HOST=127.0.0.1
API_PORT=3000
POSTGRES_PORT=5434
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/octap_dev
REDIS_URL=redis://127.0.0.1:6379
SUI_NETWORK=testnet
SUI_ISSUER_PRIVATE_KEY=<funded issuer wallet private key>
SUI_PROGRAM_ADMIN_PRIVATE_KEY=<different funded admin wallet private key>
ENOKI_API_KEY=<Enoki private API key>
DEMO_API_KEY=<OctaP merchant credential>
```

Each developer can choose a free `POSTGRES_PORT`; update `DATABASE_URL` to match it.
Compose maps `${POSTGRES_PORT:-5433}:5432`. The internal container port remains 5432.
Exported shell variables override Node's `--env-file` values, which is why startup clears them.

### Web: `octap-web/apps/partner-website/.env.local`

```dotenv
CORE_API_URL=http://127.0.0.1:3000
PARTNER_ROOT_DOMAIN=localhost
DEV_TENANT_SLUG=octap-demo
NEXT_PUBLIC_GOOGLE_CLIENT_ID=526926893299-k9dhcm4ug3vgl2mct32sfoi1ns1po17l.apps.googleusercontent.com
ENABLE_MERCHANT_DEMO=true
MERCHANT_DEMO_ORIGIN=http://localhost:4000
MERCHANT_DEMO_API_KEY=<same value as Core DEMO_API_KEY>
CUSTOMER_DEMO_SESSION_SECRET=<random server-only value of at least 32 characters>
```

Restart the frontend after changing environment settings. Only the Google client ID is public.
Merchant and cookie-signing secrets must never have a `NEXT_PUBLIC_` or `VITE_` prefix.
The merchant bridge and customer points/rewards endpoints are development-only. This is not
a production customer-session or merchant authorization implementation.

### Google and Enoki

- In Google Cloud, use the **Web application** OAuth client shown above.
- Add `http://localhost:4001` to **Authorized JavaScript origins**; this is not a redirect URI.
- Register the same full Google client ID in the Enoki app that owns `ENOKI_API_KEY`.
- Add the presenting Google account as a test user if the Google consent app requires it.
- Use the exact localhost URL. `127.0.0.1` and `octap-demo.localhost` are different origins.
- Google sign-in must include the zkLogin nonce. The current frontend prepares it through
  Core/Enoki automatically; refresh the page for a new attempt if it expires.

There is no Cognito or separate central auth app in the current demo.

## New machine or missing data: one-time setup only

Install the repository's supported Node.js 24 version, npm, and Docker Desktop first. Preserve
existing environment files; use the example files as references rather than overwriting secrets.

In `octap-core`:

```bash
npm ci
npm run build
docker compose up -d
npm run db:migrate
```

Create the local organization if it is missing:

```bash
docker compose exec -T postgres psql -U postgres -d octap_dev <<'SQL'
INSERT INTO organizations (id, slug, name)
VALUES ('11111111-1111-4111-8111-111111111111', 'octap-demo', 'OctaP Demo')
ON CONFLICT (slug) DO NOTHING;
SELECT id, slug FROM organizations WHERE slug = 'octap-demo';
SQL
```

Use the returned organization ID. If it differs from the example, update the server-side tenant
registry in partner-website accordingly. Issue a credential **only if you need a new one**:

```bash
node --env-file=.env scripts/seed-dev-credential.mjs \
  '11111111-1111-4111-8111-111111111111'
```

Save the raw key privately as `DEMO_API_KEY` in Core and `MERCHANT_DEMO_API_KEY` in Web.
The command prints it once; it does not save it automatically.

After configuring two separate funded testnet wallet keys, provision the organization
**only if it has not already been provisioned**:

```bash
node --env-file=.env scripts/provision-program.mjs \
  '11111111-1111-4111-8111-111111111111' 10000 30 1000000 1
```

Seed the active 25-point voucher:

```bash
docker compose exec -T postgres psql -U postgres -d octap_dev < scripts/seed-demo-voucher.sql
```

The fixture does not reset existing vouchers. It supplies an active voucher because Core's
creation API currently produces DRAFT vouchers and does not expose activation.

In `octap-web`, run `npm ci`, configure the local environment, then follow the restart steps.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Docker connection failure | Start Docker Desktop, then retry `docker compose up -d`. |
| PostgreSQL connection refused | Run `docker compose port postgres 5432`; match that port in `DATABASE_URL`. |
| PostgreSQL password rejected | Confirm you reached Docker rather than native PostgreSQL; check credentials and existing volume configuration. |
| Google `origin_mismatch` | Register the exact scheme, hostname, and port in Google's JavaScript origins. |
| Enoki salt service says `Invalid token` | Refresh for a new nonce-based login; check Core's logs and that Enoki has the same Google client ID. |
| Customer points return 401 | Sign in and join again to obtain the signed customer demo cookie. |
| Customer points unavailable | Check Core, the server-side demo key, and `ENABLE_MERCHANT_DEMO=true`. |
| Merchant demo returns 403 | Open business at `http://localhost:4000`; it must match `MERCHANT_DEMO_ORIGIN`. |
| Earn returns 422 | Check the organization's active provisioned program; do not create a second program blindly. |
| Earn remains PENDING | Check the worker terminal, testnet connectivity, issuer gas, and program budget. |
| Earn fails with `EBudgetExceeded` | Top up using `node --env-file=.env scripts/top-up-budget.mjs <organizationId> 1000000`. |
| No coffee reward | Run the local voucher fixture once, then refresh Store rewards. |
| Voucher already claimed/redeemed | Existing data is retained; use another member or a different active voucher. |

## Optional verification before presenting

In `octap-core`:

```bash
npm test
npm run test:integration
npm run check:bootstrap
```

Integration tests require Docker and normally use disposable containers. Never point
`TEST_DATABASE_URL` at the demo database: integration tests truncate their test tables.

In `octap-web`:

```bash
npm test -w @octap/partner-website
npm run lint
npm run build
```

## Stop the demo safely

Press **Ctrl+C** in the frontend, API, and worker terminals. Then run:

```bash
cd /d/CODE/CAPSTONE/octap-core
docker compose stop
```

This preserves PostgreSQL/Redis volumes, local configuration, and on-chain objects.
Do not use `docker compose down -v` for routine shutdown: it deletes the local database volume.
