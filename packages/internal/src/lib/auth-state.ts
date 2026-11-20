import type { OctapSession } from '../types.js';
import { OCTAP_SESSION_KEY, SessionStorage } from './storage.js';

/** Authentication lifecycle events exposed to subscribers. */
export type AuthChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

/** Receives an authentication event and the current persisted session. */
export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: OctapSession | null,
) => void;

/** Handle returned by an auth state subscription. */
export interface AuthStateSubscription {
  unsubscribe(): void;
}

/** Supabase-style subscription result. */
export interface AuthStateSubscriptionResult {
  data: {
    subscription: AuthStateSubscription;
  };
}

/** Shares auth state changes with listeners in this tab and other tabs. */
export class AuthStateNotifier {
  private readonly listeners = new Set<{ callback: AuthStateChangeCallback }>();
  private sessionResolver: () => Promise<OctapSession | null>;

  constructor(private readonly storage: SessionStorage) {
    this.sessionResolver = async () => this.storage.getSession();
  }

  /** Sets the server-backed session validator used for initial and cross-tab state. */
  setSessionResolver(resolver: () => Promise<OctapSession | null>): void {
    this.sessionResolver = resolver;
  }

  /** Registers a callback and schedules an initial session notification. */
  onAuthStateChange(callback: AuthStateChangeCallback): AuthStateSubscriptionResult {
    const listener = { callback };
    this.listeners.add(listener);
    this.updateStorageListener();

    let subscribed = true;
    queueMicrotask(async () => {
      if (!subscribed || !this.listeners.has(listener)) {
        return;
      }
      try {
        const session = await this.sessionResolver();
        if (subscribed && this.listeners.has(listener)) {
          this.notify(callback, 'INITIAL_SESSION', session);
        }
      } catch {
        if (subscribed && this.listeners.has(listener)) {
          this.notify(callback, 'INITIAL_SESSION', null);
        }
      }
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            if (!subscribed) {
              return;
            }
            subscribed = false;
            this.listeners.delete(listener);
            this.updateStorageListener();
          },
        },
      },
    };
  }

  /** Publishes an authentication change to active listeners. */
  emit(event: AuthChangeEvent, session: OctapSession | null): void {
    for (const listener of this.listeners) {
      this.notify(listener.callback, event, session);
    }
  }

  private readonly handleStorageChange = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== OCTAP_SESSION_KEY) {
      return;
    }
    void this.resolveAndEmit();
  };

  private async resolveAndEmit(): Promise<void> {
    try {
      const session = await this.sessionResolver();
      this.emit(session === null ? 'SIGNED_OUT' : 'SIGNED_IN', session);
    } catch {
      this.emit('SIGNED_OUT', null);
    }
  }

  private updateStorageListener(): void {
    if (typeof window === 'undefined') {
      return;
    }
    if (this.listeners.size > 0) {
      window.addEventListener('storage', this.handleStorageChange);
    } else {
      window.removeEventListener('storage', this.handleStorageChange);
    }
  }

  private notify(
    callback: AuthStateChangeCallback,
    event: AuthChangeEvent,
    session: OctapSession | null,
  ): void {
    try {
      callback(event, session);
    } catch {
      // Listener failures must not interrupt other auth subscribers.
    }
  }
}
