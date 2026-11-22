import { useMemo } from 'react';
import { useAuth } from '@octap/shared/authentication';
import type { Session } from '../types/domain';

/** The signed-in admin in the `Session` shape the older dashboard pages read. */
export function useSession(): Session | null {
  const { identity } = useAuth();
  return useMemo<Session | null>(
    () =>
      identity
        ? {
            token: '',
            expiresAt: identity.expiresAt,
            user: {
              id: identity.user.id,
              email: identity.user.email,
              displayName: identity.user.fullName,
              avatarUrl: identity.user.avatarUrl ?? '',
              role: 'admin',
            },
          }
        : null,
    [identity],
  );
}
