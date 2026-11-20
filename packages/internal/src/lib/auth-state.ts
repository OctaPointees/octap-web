import type { OctapSession } from '../types.js';
import { OCTAP_SIGNED_IN_FLAG_KEY } from './storage.js';

/** Authentication lifecycle events exposed to subscribers. */
export type AuthChangeEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT';

/** Receives an authentication event and the current in-memory session. */
export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: OctapSession | null,
) => void;

/** Handle returned by an auth state subscription. */
export interface AuthStateSubscription {
  unsubscribe(): void;
}

/** Subscription result, shaped like `{ data: { subscription } }`. */
export interface AuthStateSubscriptionResult {
  data: {
    subscription: AuthStateSubscription;
  };
}

/** Shares auth state changes with listeners in this tab, and sign-outs from other tabs. */
export class AuthStateNotifier {
  private readonly listeners = new Set<{ callback: AuthStateChangeCallback }>();
  private sessionResolver: () => Promise<OctapSession | null> = async () => null;
  private remoteSignOutHandler: () => void = () => {};

  constructor() {
    if (typeof window !== 'undefined') {
      // Always on, not only while someone listens: a sign-out in another tab must drop this
      // tab's in-memory token too.
      window.addEventListener('storage', this.handleStorageChange);
    }
  }

  /** Sets the server-backed session validator used for the initial session. */
  setSessionResolver(resolver: () => Promise<OctapSession | null>): void {
    this.sessionResolver = resolver;
  }

  /** Sets what to do when another tab signs out (clear this tab's session). */
  setRemoteSignOutHandler(handler: () => void): void {
    this.remoteSignOutHandler = handler;
  }

  /** Registers a callback and schedules an initial session notification. */
  onAuthStateChange(callback: AuthStateChangeCallback): AuthStateSubscriptionResult {
    const listener = { callback };
    this.listeners.add(listener);

    queueMicrotask(async () => {
      if (!this.listeners.has(listener)) {
        return;
      }
      let session: OctapSession | null = null;
      try {
        session = await this.sessionResolver();
      } catch {
        // Treat a failed check as signed out.
      }
      if (this.listeners.has(listener)) {
        this.notify(callback, 'INITIAL_SESSION', session);
      }
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(listener);
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
    // `key === null` means the other tab called `localStorage.clear()`.
    const flagCleared =
      event.key === null || (event.key === OCTAP_SIGNED_IN_FLAG_KEY && event.newValue === null);
    if (flagCleared) {
      this.remoteSignOutHandler();
    }
  };

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
