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

Paid voucher claims use the Core OCT-231 customer-signed redemption flow. Google sign-in creates
an ephemeral Ed25519 key in browser memory and requests its nonce through Core/Enoki. After
Google returns that nonce-bound ID token, the page obtains the proof for the same public key,
randomness and maxEpoch, and checks that the proof resolves to the connected Sui address.
The account is ready only after proof generation succeeds.

Claim confirmation checks the quoted cost, transaction sender and digest, signs the exact
sponsored bytes locally, combines the ephemeral signature with the proof, and sends the full
zkLogin signature through the same-origin proxy to Core's public finalize endpoint. The
server alone holds the merchant credential. Private keys and ID tokens are never persisted in
cookies or browser storage. The signed customer cookie identifies the member; it cannot sign.

A paid claim begins RESERVED: stock and points are held, but the confirmed balance is unchanged.
Only successful chain confirmation makes the voucher AVAILABLE and debits the balance projection.
The page hides its serial until AVAILABLE. Unknown outcomes stay pending; Refresh reads state,
and Continue claim resumes the existing idempotent attempt. There are no automatic mutation
retries. Each definitive cancellation permits a new server-generated retry key. A free reward has
nothing to sign: it stays RESERVED until OctaP records it on-chain, then becomes AVAILABLE.

Refreshing or using another account clears the in-memory signer. Sign in again with the same
Google account and join the store to resume an outstanding claim with a fresh signing session.
An expired signing session requires the same reauthentication.

## Run the real Testnet demo

Use the Core OCT-231 implementation and its voucher-reservation migration. The older Core claim
API is incompatible with paid signing. Configure Core's database, Redis, Testnet network, Enoki
app and funded program-admin/issuer signers. Configure Google OAuth and Testnet sponsorship in
Enoki. Keep credentials in local environment files, never source code.

From octap-core, start the API:

```powershell
docker compose up -d
npm run build
npm run db:migrate
node --env-file=.env api/dist/main.js
```

In another terminal, start the worker/indexer:

```powershell
node --env-file=.env api/dist/worker.js
```

In octap-web, configure apps/partner-website/.env.local using its example. Set
ENABLE_MERCHANT_DEMO=true, MERCHANT_DEMO_API_KEY, CUSTOMER_DEMO_SESSION_SECRET,
NEXT_PUBLIC_GOOGLE_CLIENT_ID and PARTNER_TENANTS_JSON with your actual Core organization UUID.
That organization must already be ACTIVE and provisioned on Testnet. Register
http://localhost:4001 as a Google JavaScript origin with the same OAuth client configured in Enoki.

```powershell
npm run dev:partner-website
```

1. Open http://localhost:4001, sign in with Google, wait for the proof and join the store.
2. Use the member ID for a real merchant earn request. Wait for the worker to confirm enough
   points on Sui. A synthetic PostgreSQL balance cannot fund a real chain redemption.
3. Create an ACTIVE paid reward through Core, for example a 25-point FREE_ITEM voucher, and wait
   until its `publishStatus` is PUBLISHED. The Core worker must be running.
4. Claim it and confirm spending. The browser signs locally and Core executes through Enoki.
   Wait for AVAILABLE, then show the serial to the merchant. Refresh or Continue claim handles
   pending results; do not create another claim after an uncertain response.
5. Verify the balance/history and Core's transaction digest on a Testnet explorer.

This remains a development-only bridge, disabled in production. Automated tests use synthetic
proofs and mocked external APIs, but check real ephemeral signatures and zkLogin serialization.
Real Google/Enoki proof generation and Testnet execution require the configured external services.

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
client ID uses `NEXT_PUBLIC_`. Identity tokens are neither displayed nor persisted: the Google ID
token stays in browser memory only so that joining the store can prove the same sign-in to Core,
which derives the customer from it. This does not establish production customer authorization.

## Checks

```bash
npm test -w @octap/partner-website
npm run lint -w @octap/partner-website
npm run build -w @octap/partner-website
```
