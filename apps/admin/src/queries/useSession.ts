import { useConsoleAuth } from '@octap/shared/google-auth';
import { useMemo } from 'react';
import type { Session } from '../types/domain';
import { useSyncExternalStore } from 'react';
import { sessionStore } from '../services/session';
export function useSession() {
  const auth = useConsoleAuth();
  const legacy = useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
  const mapped = useMemo<Session | null>(
    () =>
      auth?.identity
        ? {
            token: '',
            expiresAt: auth.identity.expiresAt,
            user: {
              id: auth.identity.user.id,
              email: auth.identity.user.email,
              displayName: auth.identity.user.fullName,
              avatarUrl: auth.identity.user.avatarUrl ?? '',
              role: 'admin',
              tenantId: auth.selected?.organizationId,
            },
          }
        : null,
    [auth],
  );
  return auth ? mapped : legacy;
}
