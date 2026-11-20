# OctaP Internal SDK

Browser TypeScript client for the OctaP API. Endpoint methods and DTO types are generated from `docs/openapi.json`.

## Installation

```sh
npm install @octap/internal-sdk
```

## Usage

```ts
import { OctapClient } from '@octap/internal-sdk';

const client = new OctapClient({ api_url: 'https://api.example.com' });
const { data, error } = await client.auth.signInWithGoogleIDToken(googleIdToken);

if (error !== null) {
  console.error(error.message);
} else {
  console.log(data);
}

const vouchers = await client.vouchers.list({ organizationId: 'org-id' });
const { data: userResponse } = await client.auth.getUser();
const user = userResponse?.data;

const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
  console.log(event, session);
});

// Call when the listener is no longer needed.
authListener.subscription.unsubscribe();
```

Successful results expose the response body directly as `data: T`; failures expose an Axios error as `error`. The inactive side of the result is `null`.

`client.auth.signInWithGoogleIDToken()` uses the Console Identity sign-in endpoint, then verifies the token by fetching `/v1/console/me`. After both requests succeed, the SDK stores the Google ID token and profile user in browser `localStorage`. Subsequent requests use the token as a bearer token. `client.auth.getUser()` fetches and refreshes the profile; `client.auth.getSession()` reads the cached local session and `client.auth.signOut()` clears it. The separate end-user Identity endpoints are available under `client.identity`.

Auth listeners receive `INITIAL_SESSION` after a saved token has been validated against `/v1/console/me`, followed by `SIGNED_IN` or `SIGNED_OUT` events. Session changes from other tabs are also observed through browser storage events and validated against the profile endpoint.

## Development

```sh
npm install
npm run build
```

When the OpenAPI document changes, regenerate the endpoint classes and exported DTOs with:

```powershell
./scripts/generate-sdk.ps1
```
