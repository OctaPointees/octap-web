import { createContext } from 'react';
import type { ConsoleClient, ConsoleIdentity } from '../../console-api/client';

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
  refresh(signal?: AbortSignal): Promise<ConsoleIdentity>;
  /** A Core client that sends the current token with every request. */
  client(): ConsoleClient;
}

export const AuthContext = createContext<AuthSession | null>(null);
