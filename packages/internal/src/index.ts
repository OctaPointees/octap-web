export { OctapClient, VouchersApi } from './client.js';
export { OctapError } from './lib/errors.js';
export type { OctapErrorCode } from './lib/errors.js';
export type { RequestConfig } from './lib/http.js';
export type {
  AuthChangeEvent,
  AuthStateChangeCallback,
  AuthStateSubscription,
  AuthStateSubscriptionResult,
} from './lib/auth-state.js';
export type { ClientProps, JsonObject, OctapResponse, OctapSession } from './types.js';
export * from './generated/openapi.js';
export { ConsoleApi } from './generated/console.js';
export { CreditsApi } from './generated/credits.js';
export { HealthApi } from './generated/health.js';
export { IdentityApi } from './generated/identity.js';
export { OrganizationsApi } from './generated/organizations.js';
export { PlatformApi } from './generated/platform.js';
export { RewardsApi } from './generated/rewards.js';
export { WebhooksApi } from './generated/webhooks.js';
