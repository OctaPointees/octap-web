import type { ReactNode } from 'react';
import { Popover } from '@base-ui/react/popover';
import {
  CheckCircle,
  Question,
  Warning,
  WarningCircle,
  WifiSlash,
  type Icon,
} from 'phosphor-react';
import { cn } from '@/utils/cn';
import { ago, buildCommit, suiNetwork, SYSTEM_STATES, type SystemState } from '../domain/status';
import { useLastUpdated, useNow, useSystemStatus } from '../hooks/useSystemStatus';

// Solid tints, because the page scrolls underneath the bar.
const warningBar = 'bg-[color-mix(in_oklab,var(--color-warning)_12%,var(--color-base-100))]';
const errorBar = 'bg-[color-mix(in_oklab,var(--color-error)_10%,var(--color-base-100))]';

const TONES: Record<SystemState, { icon?: Icon; iconClass: string; bar: string }> = {
  checking: { iconClass: '', bar: 'bg-base-100' },
  ok: { icon: CheckCircle, iconClass: 'text-success', bar: 'bg-base-100' },
  degraded: { icon: Warning, iconClass: 'text-warning', bar: warningBar },
  down: { icon: WarningCircle, iconClass: 'text-error', bar: errorBar },
  offline: { icon: WifiSlash, iconClass: 'text-warning', bar: warningBar },
  unknown: { icon: Question, iconClass: 'opacity-60', bar: 'bg-base-100' },
};

const isProblem = (state: SystemState) =>
  state === 'degraded' || state === 'down' || state === 'offline';

function StateIcon({ state, size }: { state: SystemState; size: number }) {
  const { icon: ToneIcon, iconClass } = TONES[state];
  return ToneIcon ? (
    <ToneIcon size={size} weight="fill" className={cn('shrink-0', iconClass)} aria-hidden />
  ) : (
    <span className="loading loading-spinner loading-xs shrink-0" aria-hidden />
  );
}

function ServiceRow({ label, up, latency }: { label: string; up: boolean; latency?: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="opacity-70">{label}</dt>
      <dd className="flex items-center gap-2 font-medium">
        {latency !== undefined && up && (
          <span className="font-normal tabular-nums opacity-60">{latency} ms</span>
        )}
        <span className={cn({ 'text-success': up, 'text-error': !up })}>
          {up ? 'Working' : 'Not responding'}
        </span>
      </dd>
    </div>
  );
}

/** The current state, which opens a short explanation. */
function SystemIndicator() {
  const { state, report, checkedAt } = useSystemStatus();
  const now = useNow();
  const { title, detail } = SYSTEM_STATES[state];
  const checks = report?.checks;
  const servicesUp = checks?.database.status === 'up' && checks.redis.status === 'up';

  return (
    <Popover.Root>
      <Popover.Trigger className="flex h-full min-w-0 cursor-pointer items-center gap-1.5 rounded-field px-1 outline-none hover:bg-base-content/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
        <StateIcon state={state} size={14} />
        <span className="shrink-0 font-medium">{title}</span>
        {isProblem(state) && (
          <>
            <span className="truncate opacity-75 max-md:hidden">{detail}</span>
            <span className="shrink-0 underline max-sm:hidden">View details</span>
          </>
        )}
      </Popover.Trigger>
      <span role="status" className="sr-only">
        {state === 'checking' ? '' : `${title}. ${detail}`}
      </span>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={6} className="z-40">
          <Popover.Popup className="w-72 origin-(--transform-origin) rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-lg outline-none transition-[scale,opacity] duration-(--motion-fast) ease-enter data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
            <Popover.Title className="flex items-center gap-2 font-semibold">
              <StateIcon state={state} size={16} />
              {title}
            </Popover.Title>
            <Popover.Description className="mt-1 text-xs opacity-70">{detail}</Popover.Description>
            {checks && (
              <dl className="mt-3 flex flex-col gap-1.5 border-t border-base-300 pt-3 text-xs">
                <ServiceRow label="OctaP services" up={servicesUp} />
                <ServiceRow
                  label="Blockchain"
                  up={checks.sui.status === 'up'}
                  latency={checks.sui.latencyMs}
                />
                <ServiceRow
                  label="Redis"
                  up={checks.redis.status === 'up'}
                  latency={checks.redis.latencyMs}
                />
              </dl>
            )}
            {checkedAt > 0 && (
              <p className="mt-2 text-xs opacity-55">Last checked {ago(checkedAt, now)}</p>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * The bar along the bottom of the portal: is OctaP working, and is my work going through? It stays
 * quiet while all is well. `activity` is what the current page shell adds, like rewards publishing.
 */
export function StatusBar({
  developer = false,
  activity,
}: {
  /** Adds response times, the network and the portal's build. */
  developer?: boolean;
  activity?: ReactNode;
}) {
  const { state, report, roundTripMs } = useSystemStatus();
  const updatedAt = useLastUpdated();
  const now = useNow();
  const network = suiNetwork();
  const commit = buildCommit();
  const blockchainMs = report?.checks.sui.status === 'up' ? report.checks.sui.latencyMs : null;

  return (
    <footer
      aria-label="System status"
      className={cn(
        'sticky bottom-0 z-30 flex h-(--size-status-bar) shrink-0 items-center gap-4 border-t border-base-300 px-2 text-xs transition-colors duration-(--motion-base) select-none',
        TONES[state].bar,
      )}
    >
      <SystemIndicator />
      {activity && <div className="flex min-w-0 items-center gap-4 max-md:hidden">{activity}</div>}

      <div className="ml-auto flex shrink-0 items-center gap-4">
        {developer && roundTripMs !== null && (
          <span className="tabular-nums opacity-70 max-lg:hidden">API {roundTripMs} ms</span>
        )}
        {developer && blockchainMs != null && (
          <span className="tabular-nums opacity-70 max-lg:hidden">
            Blockchain {blockchainMs} ms
          </span>
        )}
        {updatedAt > 0 && !developer && (
          <span className="opacity-60 max-md:hidden">Updated {ago(updatedAt, now)}</span>
        )}
        {network === 'testnet' && (
          <span
            className="badge badge-soft badge-warning badge-xs"
            title="Test network: points and vouchers here aren’t real."
          >
            Testnet
          </span>
        )}
        {developer && network === 'mainnet' && (
          <span className="badge badge-soft badge-success badge-xs">Mainnet</span>
        )}
        {developer && commit && (
          <span className="font-mono opacity-60 max-lg:hidden" title="Portal build">
            {commit}
          </span>
        )}
      </div>
    </footer>
  );
}
