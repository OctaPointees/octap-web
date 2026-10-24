# OctaP Admin Dashboard

Standalone admin portal migrated from `octap-demo/main`, using the shared
`@octap/shared` OctaP theme and the workspace's Vite/React setup.

## Run locally

From the `octap-web` root:

```sh
npm ci
npm run dev:admin
```

Open http://localhost:5000. Sign in with `admin@octap.io` / `octap123`.
Only administrator accounts can sign in to this app.

## Routes and features

- `/admin`: overview, date ranges, issuance/redemption chart, network and alerts.
- `/admin/metrics`: platform analytics.
- `/admin/partners`: partners, provisioning and partner details.
- `/admin/vouchers`: reward review and moderation.
- `/admin/audit`: system audit events.

The toolbar searches demo records and pages. Mobile navigation is available
from the menu button; logout is available on both desktop and mobile.

## Demo data

All operations use browser-local simulated services, not the production API.
The Mock API console supports latency/error simulation and resetting seed data.
Data and sessions use `octap.admin.mockdb` and `octap.admin.session` localStorage
keys, isolated from the original demo. Demo login is not production authentication.
The mock transport, query hooks and domain types remain local to this app until
a real backend integration is implemented.

## Validate

```sh
npm run build
npm run lint
npm test -w @octap/admin
```

Smoke check: sign in, change overview ranges, visit each route, search for a
partner, open partner details, review a voucher, reload to check persistence,
and log out. Repeat navigation at a narrow viewport.

## Organization

`App.tsx` composes providers and the router. `app/router.tsx` loads pages on
demand; `app/guards.tsx` protects admin routes, and `app/providers.tsx` owns
query and toast providers. Queries access the demo adapters through
`services/index.ts`, the replacement boundary for a future API integration.

Reusable code should move to `packages/shared` when it is independent of the
admin domain. The class-name utility is exported as `@octap/shared/utils`;
admin-specific layout, queries and demo data stay in this app.

The regression test checks access without a session, merchant and invalid
login rejection, administrator login, overview ranges, expired sessions and
logout. Browser smoke checks remain necessary for layout and interactive flows.
