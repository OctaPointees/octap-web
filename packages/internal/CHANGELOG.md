# Changelog

All notable changes to this package are documented in this file.

## [Unreleased]

### Added

- Typed browser client for the OctaP Core API, generated from `docs/openapi.json` (a copy of `octap-core`'s spec, 107 operations). It covers the 71 operations a signed-in console user can call, grouped as `client.console`, `client.platform`, `client.organizations`, `client.identity` and `client.health`. Merchant routes that need an API key are left out; they belong to `@octap/sdk`. The MCP OAuth routes are left out too: an MCP host signs in through them, not a portal.
- `fetch` transport. Every method returns `{ data, error }`, where `error` is an `OctapError` with `code`, `status` and `body`.
- No auth of its own: `new OctapClient({ apiBaseUrl, getAccessToken, onUnauthorized })` takes the token from the app's auth (`AuthProvider` in `@octap/shared`) and calls `onUnauthorized` on any 401 to a request that carried a token.
- Node generator (`npm run generate`), with a CI check that `src/generated` matches the committed spec.
