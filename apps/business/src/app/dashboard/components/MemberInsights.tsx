import { Info, Users } from 'phosphor-react';
import { Link } from 'react-router';
import { CountChart } from '@octap/shared/components/charts';
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';
import { fmtNumber } from '@/utils/format';
import type { MemberStats } from '../domain/insights';
import { MEMBER_SAMPLE, useMemberStats } from '../hooks/useDashboardData';

/** A whole percent that never rounds a few members away to 0%, or up to 100%. */
function share(part: number, whole: number) {
  if (!whole || !part) return '0%';
  const percent = (part / whole) * 100;
  if (percent < 1) return '<1%';
  return `${part < whole ? Math.min(99, Math.round(percent)) : 100}%`;
}

function Figure({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm opacity-70">{label}</dt>
      <dd className="text-2xl font-bold tracking-tight tabular-nums">{value}</dd>
      <dd className="text-xs opacity-60">{hint}</dd>
    </div>
  );
}

/** How many members joined in each recent seven-day period. */
function JoinsChart({ weeks, capped }: Pick<MemberStats, 'weeks' | 'capped'>) {
  return (
    <figure className="flex min-w-0 flex-col gap-4 @4xl:col-span-3">
      <figcaption>
        <h3 className="text-sm font-semibold">New members per week</h3>
        <p className="text-xs opacity-60">
          Last {weeks.length} weeks{capped ? ', from the sample' : ''}
        </p>
      </figcaption>
      <CountChart
        label={capped ? 'New members in sample' : 'New members'}
        formatValue={fmtNumber}
        data={weeks.map((week) => ({
          label: week.from,
          detail: `${week.from} to ${week.to}`,
          value: week.count,
        }))}
      />
    </figure>
  );
}

function Coverage({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="opacity-70">{label}</span>
        <span className="font-medium tabular-nums">{share(count, total)}</span>
      </div>
      <progress
        aria-label={label}
        className="progress progress-primary h-1.5 w-full"
        value={count}
        max={total}
      />
    </div>
  );
}

function MemberFigures({ stats }: { stats: MemberStats }) {
  const { counted, capped } = stats;
  // A sample can't give a true count of anything, only how common it is.
  const amount = (count: number) => (capped ? share(count, counted) : fmtNumber(count));
  const ofMembers = (count: number) =>
    capped ? 'of sampled members' : `${share(count, counted)} of members`;

  return (
    <div className="animate-reveal flex flex-col gap-6">
      {capped && (
        <p className="flex items-start gap-2 text-sm opacity-70">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          You have more than {fmtNumber(MEMBER_SAMPLE)} members, so these figures come from a sample
          of {fmtNumber(MEMBER_SAMPLE)}.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
        <Figure
          label="Total members"
          value={capped ? `${fmtNumber(counted)}+` : fmtNumber(counted)}
          hint={
            capped ? `${share(stats.active, counted)} active` : `${fmtNumber(stats.active)} active`
          }
        />
        <Figure
          label="New in 30 days"
          value={amount(stats.newLast30Days)}
          hint={ofMembers(stats.newLast30Days)}
        />
        <Figure
          label="New in 7 days"
          value={amount(stats.newLast7Days)}
          hint={ofMembers(stats.newLast7Days)}
        />
        <Figure label="Blocked" value={amount(stats.blocked)} hint={ofMembers(stats.blocked)} />
      </dl>

      <div className="grid gap-6 border-t border-base-300 pt-5 @4xl:grid-cols-5">
        <JoinsChart weeks={stats.weeks} capped={capped} />
        <div className="flex flex-col gap-4 @4xl:col-span-2">
          <div>
            <h3 className="text-sm font-semibold">Member profiles</h3>
            <p className="text-xs opacity-60">How complete your member records are</p>
          </div>
          <Coverage label="Linked to your system" count={stats.linked} total={counted} />
          <Coverage label="Has an email" count={stats.withEmail} total={counted} />
          <Coverage label="Has a phone number" count={stats.withPhone} total={counted} />
        </div>
      </div>
    </div>
  );
}

/** Who the program's members are and how fast it is growing. */
export function MemberInsights() {
  const { slug } = useOrganization();
  const stats = useMemberStats();

  return (
    <Card
      title="Members"
      actions={
        <Link className="link text-sm font-normal" to={organizationPath(slug, 'members')}>
          All members
        </Link>
      }
    >
      {stats.error ? (
        <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
      ) : !stats.data ? (
        <Skeleton className="h-80 w-full" />
      ) : stats.data.counted === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Statistics will appear here once customers join your loyalty program."
        />
      ) : (
        <MemberFigures stats={stats.data} />
      )}
    </Card>
  );
}
