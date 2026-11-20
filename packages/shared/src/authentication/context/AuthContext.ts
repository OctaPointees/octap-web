import { createContext } from 'react';
import type { OctapClient } from '@octap/internal-sdk';
import type { ConsoleIdentity } from '../lib/core';

export type Portal = 'business' | 'admin';

/** Who is signed in, and the ways to change that. Nothing here knows about organizations. */
export interface AuthSession {
  portal: Portal;
  /** Google OAuth client ID. Empty when the portal is not configured for Google sign-in. */
  clientId: string;
  apiBaseUrl: string;
  /** Set while signed in. The Google ID token behind it stays in memory, never in storage. */
  identity?: ConsoleIdentity;
  /** True while a reload asks Google to sign the returning user in again. */
  resuming: boolean;
  /** Why the user was signed out without asking, such as an expired Google credential. */
  error: string;
  /** Stores the result of a verified Google sign-in. */
  signIn(identity: ConsoleIdentity, credential: string): void;
  signOut(): void;
  /** Gives up on the silent sign-in, so the login form shows instead. */
  cancelResume(): void;
  /** Reads the identity from Core again, for example after an action changed its access. */
  refresh(): Promise<ConsoleIdentity>;
  /**
   * The `@octap/internal-sdk` client. It sends the current Google ID token with every request,
   * and a 401 from Core ends the session. Wrap calls in `unwrap` from `@octap/shared/authentication`
   * to get the data or a thrown `OctapError`.
   */
  api: OctapClient;
}

export const AuthContext = createContext<AuthSession | null>(null);
