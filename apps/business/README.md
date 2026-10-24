# OctaP for Business

Run `npm ci` then `npm run dev:business` from the repo root. Open
http://localhost:4000. This app uses simulated data and does not call Core.

## Structure

- `src/app`: lazy routes, layout and role guards.
- `src/components`: shared business toolbar, native modal and transitions.
- `src/pages`: business dashboard, developer screens and login.
- `src/services/demo.ts`: browser-local key/webhook adapter; replace this boundary for API integration.
- `src/hooks`: subscriptions to demo data.
- `src/styles`: scoped light, login and developer surfaces; brand aliases use `@octap/shared` tokens.

Demo password: `octap123`. Owner (`owner@lotusmart.vn`) and manager
(`manager@phocaphe.vn`) can open developer pages. Cashier
(`cashier@lotusmart.vn`) can view the business dashboard, but cannot access the
developer console. Platform admin (`admin@octap.vn`) sees a separate-app notice.
These client-side demo guards are not production authorization.

`VITE_DEMO_MODE=false` disables demo authentication and shortcuts. Real console
sessions are not connected. `VITE_LANDING_URL` configures the return link.

## Demo interactions

API keys can be created, rotated and revoked. Fake secrets are shown in a modal;
only metadata is saved. Webhook endpoints can be registered, enabled/disabled and
given local test-event previews. No network delivery happens. Developer page
search is available in the shared toolbar. Unimplemented controls are disabled.
Demo metadata is stored under `octap.business.demo` in localStorage. Session role
uses `octap.role` in sessionStorage. Clear those keys to reset.

## Validation

From the repo root run `npm run build`, `npm run lint`,
`npm test -w @octap/business`, and `npx prettier --check apps/business`.

Browser smoke checks: sign in with each role, try direct URLs, search developer
pages, create/rotate/revoke keys, register/toggle an endpoint, reload for
persistence, open/close dialogs with keyboard, and log out. Repeat at narrow
widths and with reduced motion enabled. Static overview/analytics values remain
illustrative; sandbox/MCP configuration is not a working Core integration.
