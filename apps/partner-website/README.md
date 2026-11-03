# Partner Website

Next.js App Router customer portal. One deployment renders a shared template with the store's
name, initials, copy, palette, and organization mapping selected on the server from the hostname.

## Local development

From the repository root:

```bash
npm install
cp apps/partner-website/.env.example apps/partner-website/.env.local
npm run dev:partner-website
```

Open **http://localhost:4001** for Google sign-in. `DEV_TENANT_SLUG=octap-demo` maps plain
localhost to that configured store only in development. Remove this setting to show the
local store directory instead. Subdomain routing can also be previewed at
**http://octap-demo.localhost:4001**. If your browser does not resolve subdomains of localhost, add
`127.0.0.1 octap-demo.localhost` to your hosts file.

Add `http://localhost` and `http://localhost:4001` to Google's authorized JavaScript origins and register
the same Google client ID in Core's Enoki application. Google's popup returns the ID token
directly to the page: no redirect callback route is needed. Add your Google account as a test
user if the consent app is in testing. Core must run on port 3000 with Postgres, Redis and Enoki
configured. Sign in, join the store, and copy the member ID for a merchant earn request.

## Local customer points and voucher demo

With `ENABLE_MERCHANT_DEMO=true`, the demo key and `CUSTOMER_DEMO_SESSION_SECRET` (at least 32
random characters) configured server-side, sign in again and join the store. A one-hour,
host-only HttpOnly signed cookie binds the verified customer and enrolled member to this store.
The page shows actual confirmed/pending points, recent activity, and Refresh. Browser-supplied
member IDs are ignored by these reads. Use another account clears the cookie. These endpoints
are disabled in production; this is not the proposed Core customer-session architecture.

The customer can claim an active voucher, spending points in Core's PostgreSQL ledger, and
show its serial to the merchant. The business dashboard's **Redeem voucher** action marks it
used; it does not deduct the points a second time. Voucher claims do not create an on-chain
POS redemption. For a local 25-point voucher fixture, run from octap-core in Git Bash:

```bash
docker compose exec -T postgres psql -U postgres -d octap_dev < scripts/seed-demo-voucher.sql
```

The fixture is needed because Core currently creates DRAFT vouchers without an activation API.
Refresh customer points after a claim to see the lower balance, and refresh rewards after the
merchant redeems the serial. Do not claim an additional reward merely to retry an uncertain
response. The demo bridge reuses the member/voucher claim key and checks existing ownerships,
but Core's debit and voucher allocation remain separate transactions; production needs an
atomic claim/retry design.

Google sign-in first creates an ephemeral Ed25519 key in browser memory and requests a zkLogin
nonce through Core/Enoki. The Google button includes that nonce, and the returned credential is
checked against it before forwarding to Core. This aligns the token with Enoki's zkLogin flow;
ordinary Google sign-in without the nonce can fail at the salt service. Tokens and ephemeral
private keys are not persisted. A fresh page load starts a new attempt. Transaction signing is
still outside this page's scope.

## Tenant configuration

`PARTNER_ROOT_DOMAIN` specifies the exact domain suffix (localhost locally). Configure
`PARTNER_TENANTS_JSON` server-side using the example in `.env.example`. Each record maps a
unique slug to an existing Core organization UUID. Unknown hosts return 404. Development includes
only the existing `octap-demo` organization; production requires an explicit registry. Add a
second store with its real organization UUID and `forest` palette to use the same template.
Theme tokens live in `src/styles/theme.css`, following the root `DISCLAIMER.md`.

The page and identity route handlers resolve tenants independently from Host. They ignore
client-provided tenant headers and organization IDs. Core remains responsible for authentication
and tenant authorization; a subdomain is routing context, not proof of permission. The registry
is a temporary server configuration source because Core has no public hostname/branding resolver.
Replace it with that service when available; do not invent customer records in browser code.

## Deployment

Point wildcard DNS at this single deployment, provision TLS for `*.your-domain`, and set
`PARTNER_ROOT_DOMAIN=your-domain`. Configure your reverse proxy to preserve the original Host
and reject unrelated hosts. Wildcards cover one label; they do not cover the apex or nested
subdomains. Add each customer origin to Google OAuth and configure Enoki appropriately; a
wildcard DNS record does not create OAuth allowlists. DNS and certificates are deployment tasks,
not created by this app. Root and unknown domains return 404 in production.

No Enoki, merchant, or wallet private key belongs in the browser bundle. Only the public Google
client ID uses `NEXT_PUBLIC_`. Identity tokens are neither displayed nor persisted. Core's public
enrollment endpoint takes the Google ID token, so this page keeps it in memory between sign-in and
joining and never persists it; an expired token sends the customer back to sign in. Identity
requests reach Core from this server, so all of a store's customers share one address against
Core's per-IP limit (`PUBLIC_RATE_LIMIT_MAX_REQUESTS`). Balance reads and signed POS redemption
still require separate customer authorization/signing integration.

## Checks

```bash
npm test -w @octap/partner-website
npm run lint -w @octap/partner-website
npm run build -w @octap/partner-website
```
