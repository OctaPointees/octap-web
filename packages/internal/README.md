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

const client = new OctapClient({ api_url: 'https://api.example.com' });
const { data, error } = await client.auth.signInWithGoogleIDToken(googleIdToken);

if (error !== null) {
  console.error(error.status, error.message);
} else {
  console.log(data);
}

const members = await client.console.listMembers({ organizationId: 'org-id' });
const { data: user } = await client.auth.getUser();

const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
  console.log(event, session);
});

// Call when the listener is no longer needed.
authListener.subscription.unsubscribe();
```

Every method returns `{ data, error }`. On success `data` is the response body and `error` is `null`. On failure `data` is `null` and `error` is an `OctapError`: an `Error` with `code` (`HTTP_ERROR`, `NETWORK_ERROR`, `NO_SESSION` or `SESSION_CHANGED`), `status` (the HTTP status, or `null` when no response arrived) and the parsed response `body`. Requests use `fetch` and time out after 30 seconds.

## Authentication

`client.auth.signInWithGoogleIDToken()` signs in through the Console Identity endpoint and builds the session from its response. Later requests send the Google ID token as a bearer token.

The token is kept **in memory only**, never in browser storage, so XSS cannot read it from there. This matches `@octap/shared` authentication. The SDK writes only a non-secret flag (`octap.sdk.signedIn = '1'`) to localStorage:

- After a reload there is no session. When `client.auth.wasSignedIn()` is `true`, ask Google for a fresh ID token (for example with One Tap auto-select) and sign in again.
- The session is dropped, with a `SIGNED_OUT` event, once its `expiresAt` has passed, so an expired token is never sent.
- `client.auth.signOut()` clears the session and the flag. Clearing the flag also signs out other open tabs.

`client.auth.getUser()` fetches and refreshes the profile. `client.auth.getSession()` returns the in-memory session. Auth listeners receive `INITIAL_SESSION` (after the current session has been checked against `/v1/console/me`), then `SIGNED_IN` or `SIGNED_OUT`. The end-user Identity endpoints are under `client.identity`.

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
