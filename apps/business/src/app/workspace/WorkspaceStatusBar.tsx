import { Popover } from '@base-ui/react/popover';
import { ArrowClockwise, Warning, WarningCircle, WifiSlash } from 'phosphor-react';
import { Link } from 'react-router';
import { Button } from '@octap/shared/components';
import { useIssuanceBudget } from '@/app/dashboard/hooks/useDashboardData';
import { retryLiveNow, useLiveState, type PauseReason } from '@/app/live/liveStatus';
import { useNow } from '@/app/status/hooks/useSystemStatus';
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
      to={organizationPath(slug, 'vouchers')}
      className="flex shrink-0 items-center gap-1.5 hover:underline"
    >
      <span className="loading loading-spinner loading-xs" aria-hidden />
      Publishing {count} voucher{count === 1 ? '' : 's'}
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

const PAUSE_REASONS: Record<PauseReason, { why: string; retries: boolean }> = {
  unreachable: {
    why: "The connection to OctaP dropped, or OctaP didn't answer. This happens on a shaky network or while OctaP restarts.",
    retries: true,
  },
  busy: {
    why: 'You have live updates open in too many tabs (up to 5 at once). Close a few you no longer need.',
    retries: true,
  },
  signedOut: {
    why: 'Your sign-in for live updates ended. Reload the page, or sign in again.',
    retries: false,
  },
  noAccess: {
    why: "OctaP didn't allow live updates for this organization. Your role may have changed.",
    retries: false,
  },
};

/** Counts down to the next reconnect. Mounted only while the details are open. */
function NextTry({ at }: { at: number }) {
  const now = useNow(1000);
  const seconds = Math.max(0, Math.ceil((at - now) / 1000));
  return <>{seconds > 0 ? `Trying again in ${seconds}s.` : 'Trying again now.'}</>;
}

/**
 * Says when live updates are off for a while, so nobody trusts a screen that has stopped changing.
 * Quiet while connecting, so a quick reconnect doesn't flicker. Opens what live updates are, why
 * they stopped, and what still works.
 */
function LiveNote() {
  const { status, reason = 'unreachable', retryAt } = useLiveState();
  if (status !== 'paused') return null;
  const { why, retries } = PAUSE_REASONS[reason];

  return (
    <Popover.Root>
      <Popover.Trigger className="flex h-full shrink-0 cursor-pointer items-center gap-1.5 rounded-field px-1 outline-none hover:bg-base-content/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
        <WifiSlash size={14} className="text-warning" aria-hidden />
        Live updates paused
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={6} className="z-40">
          <Popover.Popup className="w-80 origin-(--transform-origin) rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-lg outline-none transition-[scale,opacity] duration-(--motion-fast) ease-enter data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
            <Popover.Title className="flex items-center gap-2 font-semibold">
              <WifiSlash size={16} className="text-warning" aria-hidden />
              Live updates paused
            </Popover.Title>
            <Popover.Description className="mt-1 text-xs opacity-70">
              Live updates show your team's changes as they happen, like vouchers submitted,
              approved or claimed, without reloading.
            </Popover.Description>
            <div className="mt-3 flex flex-col gap-2 border-t border-base-300 pt-3 text-xs opacity-70">
              <p>
                {why} {retries && retryAt && <NextTry at={retryAt} />}
              </p>
              <p>
                Everything you save goes through. Screens refresh when you come back to this tab or
                reload, so they may be a little behind until then.
              </p>
            </div>
            <div className="mt-3 flex justify-end">
              <Button className="btn-xs btn-outline" onClick={retryLiveNow}>
                <ArrowClockwise size={12} className="mr-1" aria-hidden />
                Try now
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
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
          <LiveNote />
          <PublishingNote />
          {focus === 'business' && <BudgetNote />}
        </>
      }
    />
  );
}
