# OctaP Web
One Next.js App Router project with distinct route/layout slots:
- /merchant: owners/developers, organizations, campaigns, members and billing.
- /admin: platform governance, approval, monitoring and audit.
- /customer: Google/zkLogin, balance/history and customer signing reference.
- /pos: merchant POS SDK integration reference.

## Implementation locations

- src/app: pages, layouts and route composition; keep business logic out of pages.
- src/components/<feature>: product UI; components/shared and components/ui hold shared pieces.
- src/hooks/<feature>: feature queries, mutation state and view orchestration.
- src/lib/octap-api: typed API access and transport mapping.
- src/lib/auth, config, monitoring, utils: reusable non-UI helpers.
- src/providers: session, tenant and query provider composition.
- src/types: shared wire types; feature-specific view models stay with their feature.
- tests/unit, integration, e2e: tests added with actual feature implementation.

Pages return null; layouts/providers pass children through. No UI, authentication, hooks,
API calls, caches or context state are implemented. Route separation does not enforce permissions.
Run from this repository root with Node.js 24 and npm 11:

```sh
npm ci
npm run lint
npm run build
npm run typecheck
npm run dev
```

Development listens on localhost:3002. [.env.example](.env.example) reserves public API/login settings.
Core API runs independently on localhost:3000. No API request or authentication is implemented yet.

Core logic, smart contracts, workers and SDK source live in
[OctaP_Core](https://github.com/OctaPointees/OctaP_Core). Web owns UI and view state.
Keep private credentials out of frontend code and public environment variables.
The standalone lockfile installs a versioned public types artifact from [vendor](vendor/README.md);
no sibling Core checkout is required. Read the Core
[implementation guide](https://github.com/OctaPointees/OctaP_Core/blob/main/docs/implementation-guide.md).
