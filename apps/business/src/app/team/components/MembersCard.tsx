import { useState } from 'react';
import { useAuth } from '@octap/shared/authentication';
import { Button, ConfirmDialog, useExitValue, useRowFlash } from '@octap/shared/components';
import { StatusBadge } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { useDeveloperAccess, type TeamMember } from '../hooks/useTeam';
import { TeamCard, TeamCardMessage, TeamCardSkeleton } from './TeamCard';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');

/** Everyone with access: the Owner first, then Developers, with suspend and restore. */
export function MembersCard({
  members,
  loading,
  error,
  onRetry,
}: {
  members?: TeamMember[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  const { identity } = useAuth();
  const access = useDeveloperAccess();
  const { flashRow, isFlashing } = useRowFlash();
  const [suspending, setSuspending] = useState<TeamMember | null>(null);
  const suspendingShown = useExitValue(suspending);
  const sorted = [...(members ?? [])].sort(
    (a, b) =>
      Number(b.persona === 'BUSINESS_OWNER') - Number(a.persona === 'BUSINESS_OWNER') ||
      a.fullName.localeCompare(b.fullName),
  );
  const busyWith = access.isPending ? access.variables.member.id : null;

  return (
    <TeamCard title="Members" count={members?.length}>
      {loading ? (
        <TeamCardSkeleton />
      ) : error ? (
        <TeamCardMessage error={error} onRetry={onRetry} />
      ) : (
        <ul className="animate-reveal divide-y divide-base-300">
          {sorted.map((member) => {
            const owner = member.persona === 'BUSINESS_OWNER';
            const you = member.id === identity?.user.id;
            const suspended = member.status === 'SUSPENDED';
            return (
              <li
                key={member.id}
                className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3', {
                  'animate-flash-row': isFlashing(member.id),
                })}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary',
                    suspended && 'bg-base-200 text-base-content/50',
                  )}
                >
                  {initials(member.fullName) || '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{member.fullName}</span>
                    {you && <span className="badge badge-ghost badge-xs">You</span>}
                  </p>
                  <p className="truncate text-sm opacity-65">{member.email}</p>
                </div>
                <span
                  className={cn(
                    'badge badge-soft badge-sm',
                    owner ? 'badge-primary' : 'badge-neutral',
                  )}
                >
                  {owner ? 'Owner' : 'Developer'}
                </span>
                <StatusBadge status={member.status.toLowerCase()} />
                {!owner && !you && (
                  <div className="flex w-28 justify-end">
                    <Button
                      className="btn-ghost btn-sm"
                      loading={busyWith === member.id}
                      disabled={!!busyWith}
                      onClick={() =>
                        suspended
                          ? access.mutate(
                              { member, status: 'ACTIVE' },
                              { onSuccess: () => flashRow(member.id) },
                            )
                          : setSuspending(member)
                      }
                    >
                      {suspended ? 'Restore' : 'Suspend'}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!suspending}
        onOpenChange={(open) => !open && setSuspending(null)}
        title="Suspend access?"
        description={`${suspendingShown?.fullName ?? 'This Developer'} can't open this organization until you restore their access.`}
        confirmLabel="Suspend"
        tone="warning"
        loading={access.isPending}
        onConfirm={() =>
          suspending &&
          access.mutate(
            { member: suspending, status: 'SUSPENDED' },
            {
              onSuccess: ({ member }) => {
                flashRow(member.id);
                setSuspending(null);
              },
            },
          )
        }
      />
    </TeamCard>
  );
}
