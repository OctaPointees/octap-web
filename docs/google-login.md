# Google portal login

The business and admin portals use Google Identity Services by default. Core verifies
the ID token and returns its stored system role and active organization memberships.
Google Identity Services obtains the credential; the shared Web portal sends it directly
to Core using fetch. No OctaP SDK package is required. Provider credentials remain in
memory, and protected requests use the verified Google ID token as a bearer credential.
No Cognito, Enoki, wallet, password login, or custom Redis session is involved.

## Local configuration

1. Copy the relevant `apps/business/.env.example` or `apps/admin/.env.example` to
   `.env.local`. Set `VITE_GOOGLE_CLIENT_ID` to a Google OAuth **Web application** client ID.
2. Set the same ID in Core's `CONSOLE_GOOGLE_CLIENT_ID`, apply Core migrations, build,
   and start Core. `CORE_API_URL` points the Vite proxy to that server (default port 3000).
3. Add the exact portal origins to Google's **Authorized JavaScript origins**:
   `http://localhost:5173` for business and `http://localhost:5000` for admin when using
   their default development ports. Add your actual origin if using another host/port.
   This GIS button flow does not use a redirect callback URI.
4. Run `npm run dev:business` or `npm run dev:admin`. The existing System Admin
   dashboard is at `http://localhost:5000/admin`. For the Business portal's Platform
   administration link, configure `VITE_ADMIN_PORTAL_URL` for your deployment.
   Both app origins must be authorized in the Google OAuth client.

Production should reverse-proxy `/v1/console` and `/v1/platform` to Core. Alternatively set
`VITE_CORE_API_URL` to the HTTPS API origin. Core currently enables permissive CORS;
there is no configurable allowed-origins setting.
Only the public client ID belongs in Vite configuration; never add a Google client secret.

## Access and current scope

Owners manage Business Developer access from **Team and invitations** using Suspend
and Restore. Core persists these changes and rejects changes to Owner memberships
or attempts to promote a Developer. Suspension blocks protected requests and removes
the tenant from the Developer's refreshed organization list. First-Owner bootstrap
for active ownerless organizations is a System Admin API operation in Core; there
is no bootstrap form in this Web delivery. Ownership transfer remains OCT-208.

- First login creates a `SYSTEM_USER` keyed by Google's stable subject identifier.
- Platform access requires Core's `SYSTEM_ADMIN` role; email/domain is not authorization.
  System Admins enter a business dashboard only with an explicit active Owner/Developer
  membership. The existing admin sidebar shows Business dashboard only for such accounts;
  configure `VITE_BUSINESS_PORTAL_URL` to point it to the deployed business application.
- Business access lists only active `OWNER` and `BUSINESS_DEVELOPER` memberships in
  active organizations. Legacy Manager/Admin/Staff/Viewer roles are not inferred as Developers.
- A preexisting email account requires controlled administrator-assisted subject linking;
  the login endpoint cannot attach itself to an existing privileged account.
- Credentials remain in memory and expire with Google's ID token. Reloading requires
  sign-in; Refresh access re-verifies Google and reads current Core permissions.

## Portal routes and onboarding

The portals reuse the existing `apps/business` Owner/Developer layouts and
`apps/admin` System Admin layout, sidebars, toolbars, branded sign-in panels and page
routes from dev. Shared code supplies Google authentication state and Core request
forms; it does not replace the application with a separate full-page console.
Google identity is adapted for the existing account cards in memory. Tenant switching
and sign-out clear dashboard query caches. The route guards check Core-backed access
before rendering protected pages.

The connected pages use live Core data through direct HTTP calls:

- `/onboarding`: submit an organization request, track decisions, or accept an invitation.
- `/organizations`: select one of the user's persisted organization memberships.
- `/merchant`: Business Owner overview; `/merchant/settings` updates the permitted profile;
  `/merchant/team` lists staff and creates/revokes Developer invitations.
- `/developer`: Developer overview; `/developer/api-keys` lists safe credential metadata.
- `/admin`: organization request approval/rejection, restricted to SYSTEM_ADMIN. This is
  also available in the business app for system admins, so local testing can use the
  already-authorized `http://localhost:5173` origin for both tenant and platform access.

Organization setup follows the two-card selection flow inside the existing onboarding
page, using OctaP's current theme:

1. Choose **Individual / Household business** or **Company (registered legal entity)**.
2. Enter organization name and unique slug. Individuals/households provide a representative
   full name and can optionally add a 12-digit CCCD. Companies provide a legal name and
   business registration / tax number.
3. Review the details (CCCD is masked), go back to edit if needed, then submit for approval.

A first-time user's request stays PENDING_APPROVAL with no Owner membership until a
System Admin approves it. Approval activates the organization and creates its first Owner
membership in one transaction. Rejection retains its reason. The Admin review shows the
selected type, relevant business details and only the last four CCCD digits.

CCCD verification is deferred. Saving/updating CCCD does not verify the person, and
Google verifies account identity/email rather than business registration or CCCD. An
active Owner can replace CCCD in organization settings; the existing value is never
returned in plaintext. Blank replacement fields keep the existing value. Developer
organization reads do not expose even the CCCD mask. Core requires a server-only
`ORGANIZATION_IDENTITY_ENCRYPTION_KEY` for CCCD writes; there is no client key.

Existing organizations are not guessed into either type by migration. An Owner can
classify a legacy organization once in Settings, providing the required type-specific
fields. An already classified type cannot be changed through an ordinary profile edit.
Form state stays in memory, including CCCD; browser storage contains no CCCD. Draft
resume after a page reload and automated document verification remain future work.

Refresh access after approval to select/enter the organization.

An Owner can invite only Business Developers. Share the generated link with the intended
recipient; no email is sent automatically. The recipient signs in using the addressed
Google email and explicitly accepts. Acceptance is one-time, requires an active inviter
who is still an Owner, and rejects expired/revoked invitations. Tokens are stored hashed;
the raw token is returned only when creating the invitation. Links are removed from the
address bar when opened and kept in memory for the current sign-in attempt.

Every operation verifies the current Google credential and rechecks persisted roles,
memberships and organization status. SYSTEM_ADMIN grants platform access, not tenant
access. Developer accounts cannot update organization profiles or manage invitations.

The original dashboard components remain available in both modes. Real mode uses
persisted Core organization/access data and clearly marks analytics or other modules
that do not have live adapters yet. Mock services cannot serve or mutate data in real
mode. The original sample charts, analytics and password-demo flow remain available
only with `VITE_ENABLE_DEMO_AUTH=true`. Campaigns, points, rewards, customer member
directory, full governance, credential issuance and chain program provisioning remain
separate features; approval here establishes portal access, not a provisioned Sui program.
Lists currently return at most 100 records. A page reload requires Google sign-in
again because provider credentials are never persisted in browser storage.

## Verification

Run `npm run build`, `npm run lint`, and `npx playwright test` from the repository root.
The browser tests replace GIS and Core responses to check UI and flow binding; Core's
tests separately exercise RSA signature verification and real PostgreSQL/RLS behavior.
A real Google browser sign-in also requires the configured client's authorized origins.

## Customer directory (OCT-71)

Owners use `/merchant/members`; Developers use the read-only `/developer/members`.
Search supports text, status and exact external-member ID, with cursor pagination.
Detail includes Core-confirmed balance and pending amounts. Owners may edit
enrollment status, external ID and tenant metadata. This does not alter global identity,
staff permissions or points. Tier membership is outside this delivery (OCT-255). Blocked customers cannot start new
earn/claim/redemption work; already accepted transactions may still settle.

## Organization governance (OCT-208)

Owner Settings supports approval requests for transfer to an active Developer, display-name
changes, suspension and permanent deactivation. Admin Partners includes a paginated
governance review section with status filters and required decision reasons. System
Admins can propose reinstatement for suspended organizations through Core. Archived
organizations are not reinstated by that workflow. Suspension blocks portal and API-key
access; reinstatement does not revive revoked keys or inactive staff memberships.

## Managed organizations and provisioning (OCT-36)

Admin Partners has paginated organization search, safe detail, and creation for an existing
Google-bound initial Owner. Creation opens an approval request; the selected person receives
Owner membership on approval, not the admin automatically. Active organizations can request
program provisioning with an issuance policy/budget. Detail shows queued/processing/completed
or reconciliation-required state and refreshes in-flight status. Enable Core's dedicated
program-admin provisioning worker using ORG_PROVISION_WORKER_ENABLED=true; signing is never
performed in Web or the HTTP process. UNKNOWN outcomes require operator reconciliation and
cannot be retried through this UI. A configured funded Testnet worker is needed for live runs.

Business entry `/orgs/:slug` is the path fallback for this delivery. Google sign-in preserves
the entry path, then Core resolves only active tenants and Web requires an explicit membership.
An entry URL or slug never grants tenant access. Wildcard DNS/Host routing is not provisioned.
Organization suspension/reinstatement/name changes still submit OCT-208 governance proposals.
