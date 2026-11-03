# OctaP Business / Developer dashboard

The app reuses the existing Owner/Developer layouts, navigation and page components.
Google login and supported organization workflows call Core directly by default. The
original sample dashboards and password login require explicit demo mode.

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

## Default Google/Core mode

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
- Owners enter `/merchant`. `/merchant/settings` updates permitted profile fields and
  optional CCCD; `/merchant/team` lists staff and creates/revokes Developer invitations.
  CCCD responses are masked and Core encrypts the stored value.
- Developers enter `/developer`; `/developer/api-keys` lists safe credential metadata.
  They cannot manage organization profiles or invitations.
- Owners use `/merchant/members` for paginated customer search, balance detail and profile/status edits; Developers have read-only `/developer/members`. External IDs are bound after enrollment. These are loyalty customers, separate from staff.
- Invite links require the addressed Google identity and explicit one-time acceptance.
- Dashboard modules without live adapters report that they are not connected. They do
  not run against sample data after real Google login.
- Provider credentials stay in memory, not localStorage/sessionStorage. Reloading requires
  sign-in again. Organization switches and sign-out clear query caches. The real portal
  uses no OctaP SDK or custom Redis session.

Core enforces permissions independently of UI guards. Organization approval creates portal
access, not an on-chain program. Live analytics, points, campaigns, rewards,
member-directory features and full governance remain separate work.

## Optional browser-local demo

Set `VITE_ENABLE_DEMO_AUTH=true` in this app's `.env.local` and restart Vite. The original
password login and sample dashboards return. Example accounts use password `octap123`:

| Account   | Email                    | Purpose                                                 |
| --------- | ------------------------ | ------------------------------------------------------- |
| Owner     | `owner@lotusmart.vn`     | Sample business operations, settings and Developer mode |
| Developer | `developer@lotusmart.vn` | Sample API keys, webhooks and MCP tools                 |
| Cashier   | `cashier@lotusmart.vn`   | Legacy prototype role demonstration                     |

Manager/Cashier/Viewer are legacy demo roles; the real tenant personas are Owner and
Developer. The Mock API console can simulate latency/failures and reset sample data.
`octap.mockdb` initializes lazily on first demo use, and `octap.session` stores only demo
sessions. Real mode never reads, creates, resets or commits that database. Existing demo
data is retained without being read or rewritten in real mode.

The System Admin app is separate at http://localhost:5000/admin. Configure
`VITE_ADMIN_PORTAL_URL` for its link. System Admin accounts still need explicit tenant
membership to open a business dashboard.

## Validation

From the repository root:

```sh
npm run build
npm run lint
npm test -w @octap/admin
npm run test:google-login
```

The shared Node regression suite checks real-mode mock isolation in this app as well as
admin. Browser tests check real-mode routing and the original opt-in demo with controlled
Google/Core responses. Actual OAuth configuration still requires real Google sign-in;
Core's integration suite covers API/database behavior.
