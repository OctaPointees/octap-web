import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { EnvelopeSimple } from 'phosphor-react';
import { Button, ConfirmDialog, useExitValue } from '@octap/shared/components';
import { StatusBadge } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { useRevokeInvitation, type Invitation } from '../hooks/useTeam';
import { TeamCard, TeamCardMessage, TeamCardSkeleton } from './TeamCard';

/** Pending invitations up front, with revoke; accepted, revoked and expired ones folded away. */
export function InvitationsCard({
  invitations,
  loading,
  error,
  onRetry,
  isHighlighted,
}: {
  invitations?: Invitation[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  isHighlighted: (id: string) => boolean;
}) {
  const revoke = useRevokeInvitation();
  const [revoking, setRevoking] = useState<Invitation | null>(null);
  const revokingShown = useExitValue(revoking);
  const pending = invitations?.filter((invite) => invite.status === 'PENDING') ?? [];
  const past = invitations?.filter((invite) => invite.status !== 'PENDING') ?? [];
  const busyWith = revoke.isPending ? revoke.variables.id : null;

  return (
    <TeamCard title="Pending invitations" count={invitations ? pending.length : undefined}>
      {loading ? (
        <TeamCardSkeleton rows={1} />
      ) : error ? (
        <TeamCardMessage error={error} onRetry={onRetry} />
      ) : (
        <>
          {pending.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm opacity-60">
              No pending invitations. Invite a Developer to give them access.
            </p>
          ) : (
            <ul className="animate-reveal divide-y divide-base-300">
              {pending.map((invite) => (
                <li
                  key={invite.id}
                  className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3', {
                    'animate-flash-row': isHighlighted(invite.id),
                  })}
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-base-300 text-base-content/60"
                  >
                    <EnvelopeSimple size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{invite.email}</p>
                    <p
                      className="text-sm opacity-65"
                      title={format(new Date(invite.expiresAt), 'PPpp')}
                    >
                      Developer, expires{' '}
                      {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                  <div className="flex w-28 justify-end">
                    <Button
                      className="btn-ghost btn-sm text-error"
                      loading={busyWith === invite.id}
                      disabled={!!busyWith}
                      onClick={() => setRevoking(invite)}
                    >
                      Revoke
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {past.length > 0 && (
            <details className="group border-t border-base-300">
              <summary className="cursor-pointer list-none px-5 py-3 text-sm opacity-70 hover:opacity-100">
                <span className="group-open:hidden">Show</span>
                <span className="hidden group-open:inline">Hide</span> past invitations (
                {past.length})
              </summary>
              <ul className="divide-y divide-base-300 border-t border-base-300">
                {past.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center gap-4 px-5 py-2.5 text-sm opacity-75"
                  >
                    <span className="min-w-0 flex-1 truncate">{invite.email}</span>
                    <span className="opacity-70">{format(new Date(invite.expiresAt), 'PP')}</span>
                    <StatusBadge status={invite.status.toLowerCase()} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Revoke this invitation?"
        description={`The link sent to ${revokingShown?.email ?? 'this address'} stops working. You can invite them again later.`}
        confirmLabel="Revoke"
        tone="error"
        loading={revoke.isPending}
        onConfirm={() =>
          revoking && revoke.mutate(revoking, { onSuccess: () => setRevoking(null) })
        }
      />
    </TeamCard>
  );
}
