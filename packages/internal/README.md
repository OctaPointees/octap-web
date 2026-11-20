# OctaP Internal SDK

Browser TypeScript client for the OctaP Core API. Endpoint methods and DTO types are generated from `docs/openapi.json`, which is a copy of `docs/openapi.json` in `octap-core`.

It covers the Core routes a signed-in console user can call from the browser (63 of Core's 85 operations). Merchant routes that need an API key (credits, rewards, webhooks, customer verification) are left out; they belong to `@octap/sdk`, which runs server-side with credentials. `packages/services` holds hand-written API modules for the features the portals use today (rewards, API credentials) on top of the `@octap/shared` transport. Those modules can move onto this SDK one at a time.

## Installation

This is a private workspace package and is not published to npm. Add it to the app or package that uses it:

```json
{
  "dependencies": {
    "@octap/internal-sdk": "*"
  }
}
```

Then run `npm install` from the repo root.

## Usage

```ts
import { OctapClient } from '@octap/internal-sdk';

const client = new OctapClient({
  apiBaseUrl: 'https://api.example.com',
  getAccessToken: () => auth.accessToken(),
  onUnauthorized: auth.signOut,
});

const { data, error } = await client.console.listMembers({ organizationId: 'org-id' });

if (error !== null) {
  console.error(error.status, error.message);
} else {
  console.log(data);
}
```

Every method returns `{ data, error }`. On success `data` is the response body and `error` is `null`. On failure `data` is `null` and `error` is an `OctapError`: an `Error` with `code` (`HTTP_ERROR` or `NETWORK_ERROR`), `status` (the HTTP status, or `null` when no response arrived) and the parsed response `body`. Requests use `fetch` and time out after 30 seconds.

## Authentication

The SDK has no sign-in or session of its own. The app's auth (`AuthProvider` in `@octap/shared`) owns the Google ID token, keeps it in memory, and handles sign-in, resume after reload, and sign-out. The client only:

- calls `getAccessToken()` before every request and sends the result as a bearer token (nothing when it returns `null`);
- calls `onUnauthorized()` when Core answers 401 to a request that carried a token, so the app can sign out. A 401 to a request without a token doesn't trigger it.

The sign-in routes themselves (`client.console.login()`, `client.console.me()`) are plain endpoint methods like any other.
## Development

From the repo root:

```sh
npm run build -w @octap/internal-sdk
npm run typecheck -w @octap/internal-sdk
npm run lint -w @octap/internal-sdk
```

## Regenerating from the OpenAPI spec

When Core's routes change, copy its spec in and regenerate (the generator is a Node script, so it runs on macOS, Linux and Windows):

```sh
npm run generate -w @octap/internal-sdk -- --spec ../octap-core/docs/openapi.json
```

Without `--spec` it regenerates from the committed `docs/openapi.json`. Commit the spec and `src/generated` together. CI regenerates and fails if `src/generated` doesn't match the committed spec.
