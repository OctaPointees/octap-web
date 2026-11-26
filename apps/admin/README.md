# OctaP System Admin dashboard

The System Admin portal: dashboard, change requests, partners and the system audit.

## Run locally

From the repository root:

```sh
npm ci
npm run dev:admin
```

Open http://localhost:5000. Copy this app's `.env.example` to `.env.local`, set its public
Google client ID and Core target, and authorize `http://localhost:5000` in Google. Core must be
running with its migrations applied. See [the portal guide](../../docs/google-login.md).

## How it works

- Sign-in uses the shared `AuthProvider` and `GoogleSignInForm` from `@octap/shared/authentication`.
  Google verifies the account; Core checks its `SYSTEM_ADMIN` role. Other accounts see an
  access denied screen with a sign-out button.
- Pages call Core through `useAuth().api`, the `@octap/internal-sdk` client from `packages/internal`.
- In dev, Vite proxies `/v1` and `/health` to `CORE_API_URL`. Leave `VITE_CORE_API_URL` empty to
  use the proxy, or set it to Core's URL for a deployed build.
- Buttons, tables and dialogs come from `@octap/shared/components`.
