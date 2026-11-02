# OctaP Web

An npm-workspaces monorepo using React, TypeScript, Vite/Next.js and Tailwind CSS v4.

| App                            | Path                   | Default development URL | Current behavior                                                |
| ------------------------------ | ---------------------- | ----------------------- | --------------------------------------------------------------- |
| Landing page                   | `apps/landing`         | http://localhost:3000   | Marketing site                                                  |
| Business / Developer dashboard | `apps/business`        | http://localhost:5173   | Google login and Core organization/access workflows             |
| System Admin dashboard         | `apps/admin`           | http://localhost:5000   | Google login and Core organization request review               |
| Customer partner portal        | `apps/partner-website` | http://localhost:4001   | Separate customer identity, points and voucher demo             |
| Shared modules                 | `packages/shared`      | ?                       | Theme, utilities, portal authentication and reusable components |

The business and admin apps reuse their existing dashboard layouts. Their default mode
calls Core directly for identity, tenant membership, onboarding, invitations, permitted
profile updates and credential metadata. Other dashboard modules report that they are
not connected yet instead of silently using sample data.

The original sample dashboards and password login require `VITE_ENABLE_DEMO_AUTH=true`.
They are demonstrations, not production authentication. Real mode neither initializes
nor reads, resets or writes their browser-local mock databases.

## Getting started

Use Node.js 24 when working with both Web and Core. From this repository:

```sh
npm ci
npm run dev:business
```

For Google login, copy the relevant app's `.env.example` to `.env.local`, configure the
public Google client ID and Core target, and start Core with its migrations applied.
Authorize the actual browser origins in the Google client. See
[Google portal configuration and workflows](docs/google-login.md).

Other entry points:

```sh
npm run dev:admin
npm run dev:landing
npm run dev:partner-website
```

`npm run dev` starts landing and business together. Landing requests port 3000; if Core
also uses that port, choose a different landing port and use Vite's printed URL. The
landing page's current default business link is the older port 4000; set
`VITE_BUSINESS_URL=http://localhost:5173/login` in its local environment when using the
business app's default port. Explicit CLI port overrides take precedence.

## Live portal flows

- Google establishes identity. Core owns system roles and organization memberships.
- `SYSTEM_USER` is the default; `SYSTEM_ADMIN` must be explicitly provisioned.
- Owner and Developer are per-organization personas. System Admin access grants no
  tenant access without an explicit active membership.
- No memberships leads to focused onboarding without a sidebar. Choose Individual /
  Household business or Company, enter details, review and submit for admin approval.
- Users with memberships can skip setup. Core permissions are refreshed first. One
  organization opens directly; multiple organizations require selection.
- Approval activates the organization and creates its first Owner membership. Owners
  can manage permitted settings and invite Developers. Invitations require the addressed
  Google identity to accept and are one-time.
- CCCD can be saved or updated by an Owner and is encrypted by Core. Responses are masked;
  CCCD and business registration verification are not implemented.
- Google credentials stay in memory. Reloading requires sign-in again; account/organization
  changes clear query caches. The real Web flows do not use the OctaP SDK.

| Setting                    | App            | Purpose                                                                 |
| -------------------------- | -------------- | ----------------------------------------------------------------------- |
| `VITE_GOOGLE_CLIENT_ID`    | business/admin | Public Google OAuth Web client ID                                       |
| `CORE_API_URL`             | business/admin | Development proxy target, default `http://127.0.0.1:3000`               |
| `VITE_CORE_API_URL`        | business/admin | Optional direct API origin; otherwise use the proxy                     |
| `VITE_ENABLE_DEMO_AUTH`    | business/admin | Exact value `true` enables mock/password demo mode; disabled by default |
| `VITE_ADMIN_PORTAL_URL`    | business       | System Admin application URL                                            |
| `VITE_BUSINESS_PORTAL_URL` | admin          | Business application URL; link appears only for tenant members          |

Keep Google client secrets, merchant credentials and Core encryption keys out of Vite
variables and committed environment files.

## Validation

```sh
npm run build
npm run lint
npm test -w @octap/admin
npm run test:google-login
```

The admin regression suite explicitly enables demo mode for its original session tests
and separately verifies real-mode mock isolation in both apps. Browser tests replace
Google/Core responses to check UI and routing. A real Google sign-in still requires
valid OAuth configuration. Core's own suite verifies real API/database behavior.

## Project conventions

Follow [DISCLAIMER.md](DISCLAIMER.md) and `.prettierrc`: two-space indentation, single
quotes, semicolons and print width 100. Use Tailwind v4 theme tokens and spacing utilities;
keep app-specific dashboards and mock services in their respective apps.

See the [business guide](apps/business/README.md), [admin guide](apps/admin/README.md),
[customer partner guide](apps/partner-website/README.md) and
[customer/merchant demo walkthrough](docs/DEMO_GUIDE.md) for their separate scopes.
