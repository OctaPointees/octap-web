import { Warning, WarningCircle } from 'phosphor-react';
import { Link } from 'react-router';
import { useIssuanceBudget } from '@/app/dashboard/hooks/useDashboardData';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';
import { useRewards } from '@/app/rewards/hooks/useRewards';
import { StatusBar } from '@/app/status/components/StatusBar';
import { cn } from '@/utils/cn';
import { useFocus } from './focus';

/** Rewards still publishing on-chain, so they can be followed from any page. */
function PublishingNote() {
  const { slug } = useOrganization();
  const { data } = useRewards();
  const count = data?.filter((reward) => reward.publishStatus === 'PUBLISHING').length ?? 0;
  if (!count) return null;

  return (
    <Link
      to={organizationPath(slug, 'rewards')}
      className="flex shrink-0 items-center gap-1.5 hover:underline"
    >
      <span className="loading loading-spinner loading-xs" aria-hidden />
      Publishing {count} reward{count === 1 ? '' : 's'}
    </Link>
  );
}

/** Appears only once Core raises its 80% or 95% budget warning. */
function BudgetNote() {
  const { slug } = useOrganization();
  const { data } = useIssuanceBudget();
  const threshold = data?.warningThreshold;
  if (!threshold) return null;
  const critical = threshold === 95;
  const NoteIcon = critical ? WarningCircle : Warning;

  return (
    <Link
      to={organizationPath(slug)}
      className="flex shrink-0 items-center gap-1.5 hover:underline"
    >
      <NoteIcon
        size={14}
        weight="fill"
        className={cn({ 'text-error': critical, 'text-warning': !critical })}
        aria-hidden
      />
      Points budget over {threshold}% used
    </Link>
  );
}

/** The status bar inside an organization, with what the current focus cares about. */
export function WorkspaceStatusBar() {
  const focus = useFocus();
  return (
    <StatusBar
      developer={focus === 'developer'}
      activity={
        <>
          <PublishingNote />
          {focus === 'business' && <BudgetNote />}
        </>
      }
    />
  );
}
