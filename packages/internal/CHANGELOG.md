# Changelog

All notable changes to this package are documented in this file.

## [Unreleased]

### Added

- Synchronized `docs/openapi.json` with the current `octap-core` API (85 operations, up from 72) and regenerated the endpoint classes and DTOs.
- Added the `client.health` group (`HealthApi`) with `check()` for `GET /health`, and mapped `Health*` operations to it in the generator.
- Added `client.platform.report()` for the platform health report.
- Added Console voucher approval methods: `submit()`, `withdraw()`, `approve()`, and `reject()`.
- Added Console refund policy methods: `current()`, `publish()`, and `history()`.
- Added Console webhook methods: `listEndpoints()`, `registerEndpoint()`, `disableEndpoint()`, `enableEndpoint()`, `rotateSecret()`, `listDeliveries()`, and `replayDelivery()`.
- Added Console member methods `transactions()` and `vouchers()`, and the organization `settings()` method.
- Added the `PENDING_APPROVAL` voucher status, the optional voucher `approval` field (`VoucherApprovalDto`), and the `UPDATE_IDENTITY` governance request type.

### Changed

- **Breaking:** the Google ID token is now kept in memory only, never in localStorage. Only a non-secret `octap.sdk.signedIn` flag is stored; use `client.auth.wasSignedIn()` after a reload to decide whether to request a fresh token from Google. Signing out in one tab signs out the others.
- Sign-in builds the session from the login response instead of calling `/v1/console/me` again.
- The session is dropped, with a `SIGNED_OUT` event, once its `expiresAt` has passed.
- **Breaking:** replaced Axios with `fetch`. Errors are now `OctapError` (`code`, `status`, `body`) instead of `AxiosError`.
- Replaced the PowerShell generator with a Node script: `npm run generate`.

### Removed

- **Breaking:** removed the `client.credits`, `client.rewards`, `client.webhooks` and `client.vouchers` groups and `client.identity.verify()`. They call merchant routes that need an API key, so they always fail from a browser; use `@octap/sdk` server-side. The generator now skips operations whose only security scheme is `apiKey`.
- **Breaking:** removed the deprecated `OctapData<T>` type.
- **Breaking:** removed the `TOKEN_REFRESHED`, `USER_UPDATED` and `PASSWORD_RECOVERY` auth events, which were never emitted.
- **Breaking:** removed `client.rewards.setRefundPolicy()`; use `client.console.publish()` instead.
- **Breaking:** removed `client.webhooks.registerEndpoint()`, `disableEndpoint()`, `enableEndpoint()`, `rotateSecret()`, and `replayDelivery()`; use the matching `client.console` methods instead.

## [0.1.0] - 2026-11-14

### Added

- Added the browser TypeScript SDK package structure and typed OctaP client.
- Added Axios transport and typed endpoint methods/DTOs generated from the OpenAPI specification.
- Added entity API groups for authentication, organizations, credits, rewards, vouchers, platform, console, and webhooks.
- Added Google ID token session persistence with browser `localStorage` storage, session lookup, and sign-out.
- Added Supabase-style `onAuthStateChange` subscriptions with initial, sign-in, and sign-out events, including cross-tab updates.
- Routed the top-level auth sign-in flow through Console Identity and exposed end-user Identity endpoints under `client.identity`.
- Renamed generated operation DTO types to concise controller/action names, such as `ConsoleIdentityMeResponse`.
- Added server-backed Console profile verification to sign-in and auth-state initialization, cached the user in the session, and exposed `auth.getUser()`.
- Changed `OctapResponse<T>` to a discriminated union so `error === null` guarantees non-null `data`.
- Changed successful results to return the response body as `T`; deprecated the Axios response wrapper `OctapData<T>`.
- Bound auth methods as arrow functions so methods such as `signOut` remain safe when passed as callbacks.
- Added README installation and usage examples.
