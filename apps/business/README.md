# OctaP Business / Developer dashboard

Owner and Developer dashboards for an OctaP organization. Sign-in is Google only, and every
page reads and writes Core directly. There is no demo mode or sample data.

## Run locally

From the repository root:

```sh
npm ci
npm run dev:business
```

Open http://localhost:5173. Copy this app's `.env.example` to `.env.local`, configure the
public Google client ID and Core target, authorize the browser origin in Google, and
start Core with its migrations applied. See
[the portal guide](../../docs/google-login.md) for full configuration.

## How it works

- Google verifies identity/email. Core owns system roles and active memberships. The same
  account may be an Owner in one organization and a Developer in another. System Admin
  permissions alone grant no tenant access.
- No memberships leads to `/onboarding`, a focused setup page without a sidebar. Choose
  Individual / Household business or Company, complete the form, review and submit for
  System Admin approval. Google does not verify civil/business documents; CCCD verification
  remains deferred.
- Users already in organizations can skip setup. Core permissions are refreshed first:
  one organization opens directly, multiple organizations lead to `/organizations`, and
  no active memberships stays in onboarding. Skipping grants no new privileges.
- Every page has the organization in its URL and is grouped by feature:
  `/organizations/:slug` (dashboard), `rewards`, `members`, `api-keys`, `team` and
  `settings`. A link with the organization ID instead of its slug redirects to the slug, and
  links can be bookmarked or shared with other members. Older `…/merchant/…` and
  `…/developer/…` links redirect to the same page; top-level `/merchant` and `/developer`
  links go to the organization list.
- The Business / Developer switch, at the top of the sidebar and in the top bar, only picks
  which pages the sidebar lists. It is remembered per browser and defaults to Business for
  Owners and Developer for Developers. It grants nothing: each page decides what you can do
  from your role, as Core does.
- `settings` shows the name, slug, status and legal identity. Owners rename directly and send
  identity changes for System Admin approval; Developers see the same sections read-only,
  without the saved CCCD. CCCD responses are masked and Core encrypts the stored value.
- `team` lists staff and creates/revokes Developer invitations. Core lets only the Owner read
  it, so Developers see that the section is closed.
- `api-keys` lists safe credential metadata; only Owners can issue write keys.
- `members` offers paginated customer search and balance detail; only Owners edit profile and
  status. External IDs are bound after enrollment. These are loyalty customers, separate from staff.
- `rewards` shows the catalog as cards or a table (remembered per browser), filtered by stage.
  Owners and Developers create and edit drafts, from scratch, a template, a duplicate or a CSV
  import. Activating publishes the terms on-chain through the worker (`Publishing`, then `Live`,
  or `Publish failed` with a retry); after that the title, type, points, conditions and dates
  never change. Only the Owner pauses, resumes or changes availability. When the organization
  requires approval, a Developer submits a draft instead, and the Owner approves or rejects it.
- Reward kinds: percent off, amount off and free item map to Core's `discountType`; buy X get Y,
  free delivery, special price and custom rewards are described only by `terms`. Conditions
  (minimum order, maximum discount, applies to) also go in `terms`, shaped as
  `{ schema: 'octap.benefit.v1', kind, … }` (see `src/app/rewards/domain/draft.ts`).
  Core publishes `terms` but does not enforce it: the merchant applies it at checkout.
- Invite links require the addressed Google identity and explicit one-time acceptance.
- Dashboard modules without live adapters report that they are not connected.
- Provider credentials stay in memory, not localStorage/sessionStorage. Reloading requires
  sign-in again. Each organization's data is cached under its own ID; sign-out clears the cache. The real portal
  uses no OctaP SDK or custom Redis session.

Core enforces permissions independently of UI guards. Organization approval creates portal
access, not an on-chain program. The member directory and the reward catalog are connected to
Core. Live analytics, points, campaigns and full governance remain separate work.

## System Admin

The System Admin app is separate at http://localhost:5000/admin. Configure
`VITE_ADMIN_PORTAL_URL` for its link. System Admin accounts still need explicit tenant
membership to open a business dashboard.

## Validation

From the repository root:

```sh
npm run build
npm run lint
npm run test:google-login
```

Browser tests check routing with controlled Google/Core responses. Actual OAuth configuration still requires real Google sign-in;
Core's integration suite covers API/database behavior.
