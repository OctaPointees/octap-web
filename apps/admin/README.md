# OctaP System Admin dashboard

The existing admin layout, navigation, account card and routes support direct Google/Core
authentication by default and an explicitly enabled browser-local demo.

## Run locally

From the repository root:

```sh
npm ci
npm run dev:admin
```

Open http://localhost:5000/admin. Copy this app's `.env.example` to `.env.local`, set its
public Google client ID and Core target, and authorize `http://localhost:5000` in Google.
Core must be running with its migrations applied. See
[the portal guide](../../docs/google-login.md).

## Default Google/Core mode

- Google verifies the account; Core checks its persisted `SYSTEM_ADMIN` role.
- `/admin` uses existing dashboard components for request summaries and approval/rejection.
  `/admin/partners` shows the same persisted organization review data.
- Review shows organization type and business details. CCCD is masked and remains unverified.
  Approval grants portal membership, not document verification or a provisioned Sui program.
- The toolbar searches loaded requests and pages. Mobile navigation and sign-out remain
  available in the existing layout.
- Business dashboard appears only with an explicit active Owner/Developer membership.
  Configure `VITE_BUSINESS_PORTAL_URL` for the business deployment.
- Metrics, voucher moderation, audit and other mocked adapters report that they are not
  connected in real mode. They do not silently return sample data.
- Provider credentials stay in memory; reloading requires Google sign-in again. The real
  portal uses no OctaP SDK, password authentication or custom Redis session.

## Optional demo mode

Set `VITE_ENABLE_DEMO_AUTH=true` in this app's `.env.local` and restart Vite. Sign in with
`admin@octap.io` / `octap123`. The original overview, metrics, partner management, voucher
moderation, audit, sample search and Mock API console use simulated services.

Demo data and sessions use `octap.admin.mockdb` and `octap.admin.session`, isolated from
business data. The mock database is loaded/created lazily when first used in demo mode,
not on module import. Real mode rejects mock reads/resets and never commits mock storage.
Existing demo data is retained without being read or rewritten in real mode. Demo login
is not production authentication.

## Validate

From the repository root:

```sh
npm run build
npm run lint
npm test -w @octap/admin
npm run test:google-login
```

The Node regression test explicitly enables demo mode for login/session/overview checks
and separately verifies real-mode mock isolation in both apps. Browser tests cover Google
flow binding, roles, onboarding and invitations with controlled provider/API responses.
They do not replace real Google sign-in or Core's database integration tests.

## Organization

`App.tsx` composes providers and the router. `app/router.tsx` retains the existing lazy
routes and wraps real mode with shared authentication state. `app/guards.tsx` checks the
platform role in Web; Core independently authorizes protected requests. Admin layout,
demo adapters, queries and domain models stay in this app. Shared theme, utilities and
reusable portal flows live in `packages/shared`.

OCT-36/OCT-208: Partners includes organization search/detail, admin-attributed creation,
worker-backed program provisioning status, and reasoned lifecycle request review.
See `../../docs/google-login.md` for Core dependencies and worker configuration.
