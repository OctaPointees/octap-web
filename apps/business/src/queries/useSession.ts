import { useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import type { Session } from '../types/domain';
import { walletSession } from '../services/wallet.service';

/** The signed-in user in the `Session` shape the older dashboard pages read. */
export function useSession(): Session | null {
  const { identity } = useAuth();
  const { selected, owner } = useOrganization();
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
              role: 'merchant',
              tenantId: selected?.organizationId,
              merchantRole: selected ? (owner ? 'owner' : 'developer') : undefined,
            },
          }
        : null,
    [identity, selected, owner],
  );
}

export function useWalletSession() {
  return useSyncExternalStore(walletSession.subscribe, walletSession.get);
}
