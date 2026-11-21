import type { ConsoleCredential } from '@octap/services';

const DAY_MS = 86_400_000;
/** A key unused for this long is worth a second look. */
export const STALE_KEY_DAYS = 30;

export const isActiveKey = (key: ConsoleCredential) => key.status.toLowerCase() === 'active';

/** Never used, or not used for a while. */
export const isStaleKey = (key: ConsoleCredential, now = Date.now()) =>
  !key.lastUsedAt || now - Date.parse(key.lastUsedAt) > STALE_KEY_DAYS * DAY_MS;

export const hasWriteAccess = (key: ConsoleCredential) => key.scopes.includes('write');

export const accessLabel = (key: ConsoleCredential) =>
  hasWriteAccess(key) ? 'Read and write' : 'Read only';

/** Core lets the Owner manage every key, and a Developer only keys limited to read access. */
export const canManageKey = (key: ConsoleCredential, owner: boolean) =>
  owner || key.scopes.every((scope) => scope === 'read');
