import { useState } from 'react';
import { CaretDown } from 'phosphor-react';
import type { VoucherRefundPolicyDto } from '@octap/internal-sdk';
import { Button } from '@octap/shared/components';
import { ErrorState, LoadingBlock } from '@/components/shared/Display';
import { useTeam, type TeamMember } from '@/app/team/hooks/useTeam';
import { cn } from '@/utils/cn';
import { fmtDateTime } from '@/utils/format';
import { DEFAULT_REFUND_RULES, refundRuleChanges } from '../domain/refundPolicy';
import { useRefundPolicyHistory } from '../hooks/useRefundPolicy';

/** Who published a version. Actor IDs outlive the people and keys they point at. */
function publishedBy(entry: VoucherRefundPolicyDto, staff: TeamMember[] | undefined) {
  if (entry.createdByCredentialId) return 'An API key';
  if (!entry.createdByUserId) return 'OctaP';
  if (!staff) return 'A team member';
  return (
    staff.find((member) => member.id === entry.createdByUserId)?.fullName ?? 'A former team member'
  );
}

/** Every published version. Nothing loads until it is first opened. */
export function RefundPolicyHistory() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-box border border-base-300 bg-base-100">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-3 text-sm font-semibold"
        onClick={() => setOpen((current) => !current)}
      >
        Version history
        <CaretDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <HistoryEntries />}
    </section>
  );
}

function HistoryEntries() {
  const history = useRefundPolicyHistory(true);
  const { staff } = useTeam();
  const entries = history.data?.pages.flat() ?? [];

  return (
    <div className="border-t border-base-300 p-5">
      {history.isPending && <LoadingBlock rows={3} />}
      {history.isError && <ErrorState error={history.error} onRetry={() => history.refetch()} />}
      {history.isSuccess && entries.length === 0 && (
        <p className="text-sm opacity-70">
          No versions published yet, so OctaP's default policy applies.
        </p>
      )}
      {entries.length > 0 && (
        <ol className="flex flex-col divide-y divide-base-300">
          {entries.map((entry, index) => {
            const older = entries[index + 1] ?? (entry.version === 1 ? DEFAULT_REFUND_RULES : null);
            const changes = older ? refundRuleChanges(older, entry) : [];
            return (
              <li key={entry.version} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-semibold">Version {entry.version}</span>
                  <span className="text-xs opacity-60">
                    {entry.createdAt && `${fmtDateTime(entry.createdAt)}, `}
                    {publishedBy(entry, staff.data)}
                  </span>
                </div>
                <p className="text-sm break-words">{entry.reason}</p>
                {changes.length > 0 && (
                  <ul className="text-xs opacity-70">
                    {changes.map((change) => (
                      <li key={change.label}>
                        {change.label}: {change.before} to {change.after}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {history.hasNextPage && (
        <Button
          className="btn-ghost btn-sm mt-3"
          loading={history.isFetchingNextPage}
          onClick={() => history.fetchNextPage()}
        >
          Load older versions
        </Button>
      )}
    </div>
  );
}
