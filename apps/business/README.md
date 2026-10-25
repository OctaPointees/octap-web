# OctaP for Business

Vite + React + Tailwind v4 prototype of the Partner Dashboard, run on mock data.

```bash
npm run dev:business   # from the repo root, http://localhost:4000
```

Routes: `/login`, `/dashboard`, `/developers/{overview,keys,sandbox,mock,logs,webhooks,mcp}`, `/admin` (placeholder).

Demo accounts (password `octap123`): `owner@lotusmart.vn`, `manager@phocaphe.vn`, `cashier@lotusmart.vn`, `admin@octap.vn`.

See the root [README](../../README.md) for the full test flow and environment variables.

## Local live earn demo

Run Core API and worker, partner-website on 4001, and this app on 4000. In
`apps/partner-website/.env.local`, enable `ENABLE_MERCHANT_DEMO=true`, set
`MERCHANT_DEMO_ORIGIN=http://localhost:4000`, and set `MERCHANT_DEMO_API_KEY` to your
Core demo merchant credential. This key stays on the Next.js server, never in Vite variables.
Restart partner-website and business after changing configuration.

Sign in with an existing dashboard demo account (for example owner@lotusmart.vn / octap123).
Choose **Issue points**, paste the customer member ID from partner-website, enter the amount,
and submit. The modal shows the actual Core transaction, confirmed/pending balances and Sui
digest; it polls for up to a minute, then supports manual refresh. Retry reuses the same
idempotency key. A new request issues another earn, so do not start one to retry an uncertain
submission. The configured key selects OctaP Demo, regardless of the mock dashboard's store label.

The bridge is development-only and accepts only the configured local business origin. Production
requires real merchant sessions/roles; the dashboard overview and existing sample tables remain mock.

Customers can also view their points and claim the seeded 25-point coffee voucher on
partner-website after a fresh Google sign-in and enrollment. At checkout, choose **Redeem voucher**
in the dashboard sidebar and enter the member ID and voucher serial. Claiming deducts points;
redeeming marks the voucher used. The fixture and customer setup are documented in
`apps/partner-website/README.md`. Voucher debits are PostgreSQL-only, separate from signed Sui POS redemption.
