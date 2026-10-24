import type { PortalRole, Session } from '../types/domain';
import { ApiError, forbidden } from './mock/http';

/**
 * Client-side session store (stands in for an HTTP-only auth cookie).
 */

const KEY = 'octap.admin.session';
const listeners = new Set<() => void>();

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return new Date(s.expiresAt).getTime() > Date.now() ? s : null;
  } catch {
    return null;
  }
}

let current = read();

export const sessionStore = {
  get: () => current,
  set(s: Session | null) {
    current = s;
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
    listeners.forEach((l) => l());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/** Server-side style guard used inside mock handlers. */
export function requireSession(role?: PortalRole) {
  const s = sessionStore.get();
  if (!s || new Date(s.expiresAt).getTime() <= Date.now())
    throw new ApiError(401, 'unauthenticated', 'Your session has expired. Please sign in again.');
  if (role && s.user.role !== role) throw forbidden();
  return s;
}
