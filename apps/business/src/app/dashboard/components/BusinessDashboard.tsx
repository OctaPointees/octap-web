import { useState, type ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Coins, Lightning, NotePencil, Ticket } from 'phosphor-react';
import { Link } from 'react-router';
import { Button } from '@octap/shared/components';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
  UsageBar,
} from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';
import { fromReward, type Reward } from '@/app/rewards/domain/draft';
import { KINDS } from '@/app/rewards/domain/kinds';
import { rejectedFor } from '@/app/rewards/domain/stage';
import { useRewards } from '@/app/rewards/hooks/useRewards';
import { useAuth } from '@octap/shared/authentication';
import { cn } from '@/utils/cn';
import { fmtNumber } from '@/utils/format';
import {
  budgetAttention,
  collectAttention,
  rewardAttention,
  summarizeRewards,
} from '../domain/insights';
import { isNoProgram, useIssuanceBudget } from '../hooks/useDashboardData';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { BUSINESS_PARTS, sizing } from '../grid';
import { ArrangeableParts, ArrangeControls, type DashboardPart } from './ArrangeableParts';
import { AttentionCard } from './AttentionCard';
import { MemberInsights } from './MemberInsights';

/** The points left to issue, with how much of the budget is used. */
function BudgetCard() {
  const budget = useIssuanceBudget();
  const data = budget.data;

  return (
    <div className="flex h-full flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-4">
      <div className="flex items-center justify-between text-sm opacity-70">
        <span>Points budget</span>
        <Coins size={18} />
      </div>
      {budget.isPending ? (
        <Skeleton className="h-8 w-28" />
      ) : data ? (
        <>
          <div className="text-2xl font-bold tracking-tight tabular-nums">
            {fmtNumber(data.remaining)}
          </div>
          <UsageBar value={data.capacity - data.remaining} max={data.capacity} className="w-full" />
          <div className="text-xs opacity-60">left of {fmtNumber(data.capacity)}</div>
        </>
      ) : isNoProgram(budget.error) ? (
        <>
          <div className="text-2xl font-bold tracking-tight">Not set up</div>
          <div className="text-xs opacity-60">OctaP sets this up with your program.</div>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold tracking-tight">Unavailable</div>
          <Button
            className="btn-ghost btn-xs w-fit min-w-0"
            loading={budget.isFetching}
            onClick={() => void budget.refetch()}
          >
            Try again
          </Button>
        </>
      )}
    </div>
  );
}

/** A reward's type icon, title and a line under it. */
function RewardLine({
  reward,
  detail,
  trailing,
}: {
  reward: Reward;
  detail: string;
  /** At the end of the line, such as a progress ring. */
  trailing?: ReactNode;
}) {
  const { icon: KindIcon } = KINDS[fromReward(reward).kind];
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-field bg-primary/10 text-primary">
        <KindIcon size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={reward.title}>
          {reward.title}
        </p>
        <p className="truncate text-xs opacity-60">{detail}</p>
      </div>
      {trailing}
    </div>
  );
}

const RING_RADIUS = 16;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * How much of a reward's supply has been claimed, as a ring with the percent inside. A sliver
 * still shows for a few claims, and the label never rounds a few claims to 0% or up to 100%.
 */
function ClaimRing({ claimed, total }: { claimed: number; total: number }) {
  const share = total > 0 ? Math.min(1, claimed / total) : 0;
  const percent = share * 100;
  const label =
    claimed === 0
      ? '0%'
      : percent < 1
        ? '<1%'
        : `${claimed < total ? Math.min(99, Math.round(percent)) : 100}%`;
  // At least a visible dot once anything is claimed.
  const drawn = claimed > 0 ? Math.max(share, 0.02) : 0;
  return (
    <span
      role="progressbar"
      aria-label={`${fmtNumber(claimed)} of ${fmtNumber(total)} claimed`}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={claimed}
      className="relative flex size-11 shrink-0 items-center justify-center"
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle
          cx="20"
          cy="20"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="4"
          className="stroke-primary/15"
        />
        <circle
          cx="20"
          cy="20"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - drawn)}
          className="stroke-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500"
        />
      </svg>
      {/* 10px: the percent must fit inside the ring, and text-xs (12px) doesn't at 100%. */}
      <span className="text-[0.625rem] font-semibold tabular-nums">{label}</span>
    </span>
  );
}

/** What needs attention in the loyalty program, and how its rewards are doing. */
export function BusinessDashboard() {
  const { owner, slug } = useOrganization();
  const rewards = useRewards();
  const { identity } = useAuth();
  const budget = useIssuanceBudget();
  const rewardsPath = organizationPath(slug, 'vouchers');
  const summary = rewards.data ? summarizeRewards(rewards.data) : undefined;
  const attention = collectAttention(
    budgetAttention(budget.data),
    rewards.data && summary
      ? rewardAttention(summary, owner, rejectedFor(rewards.data, identity?.user.id))
      : [],
  );
  const pipelineTotal = rewards.data?.length ?? 0;
  const allRewards = (
    <Link className="link text-sm font-normal" to={rewardsPath}>
      All vouchers
    </Link>
  );
  // Each voucher part shows the same thing while the list loads or if it fails.
  const rewardsFallback = rewards.error ? (
    <ErrorState error={rewards.error} onRetry={() => void rewards.refetch()} />
  ) : !summary ? (
    <Skeleton className="h-40 w-full" />
  ) : null;

  const parts: DashboardPart[] = [
    {
      id: 'stats',
      title: 'Key figures',
      ...sizing(BUSINESS_PARTS.stats),
      node: (
        <div className="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
          <BudgetCard />
          <StatCard
            label="Live vouchers"
            icon={Lightning}
            value={summary ? fmtNumber(summary.stages.live) : <Skeleton className="h-8 w-16" />}
            hint={summary && `${fmtNumber(summary.stages.scheduled)} scheduled`}
          />
          <StatCard
            label="Vouchers claimed"
            icon={Ticket}
            value={summary ? fmtNumber(summary.claimed) : <Skeleton className="h-8 w-16" />}
            hint="Across all vouchers"
          />
          <StatCard
            label="Drafts"
            icon={NotePencil}
            value={summary ? fmtNumber(summary.drafts) : <Skeleton className="h-8 w-16" />}
            hint={summary && `${fmtNumber(summary.stages.pending_approval)} awaiting approval`}
          />
        </div>
      ),
    },
    {
      id: 'members',
      title: 'Members',
      ...sizing(BUSINESS_PARTS.members),
      node: <MemberInsights />,
    },
    {
      id: 'top',
      title: 'Top vouchers',
      ...sizing(BUSINESS_PARTS.top),
      node: (
        <Card title="Top vouchers" actions={allRewards}>
          {rewardsFallback ??
            (pipelineTotal === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No vouchers yet"
                description="Create your first voucher so members have something to spend their points on."
                action={
                  <Link className="btn btn-primary btn-sm" to={rewardsPath}>
                    Go to Vouchers
                  </Link>
                }
              />
            ) : summary!.top.length ? (
              <ol className="flex flex-col gap-4">
                {summary!.top.map((reward) => (
                  <li key={reward.id}>
                    <RewardLine
                      reward={reward}
                      detail={
                        reward.totalSupply == null
                          ? `${fmtNumber(reward.claimedCount)} claimed, no limit`
                          : `${fmtNumber(reward.claimedCount)} of ${fmtNumber(reward.totalSupply)} claimed`
                      }
                      trailing={
                        reward.totalSupply != null && (
                          <ClaimRing claimed={reward.claimedCount} total={reward.totalSupply} />
                        )
                      }
                    />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-6 text-center text-sm opacity-60">
                No vouchers claimed yet. Your most claimed vouchers will show here.
              </p>
            ))}
        </Card>
      ),
    },
    {
      id: 'pipeline',
      title: 'Voucher pipeline',
      ...sizing(BUSINESS_PARTS.pipeline),
      node: (
        <Card title="Voucher pipeline">
          {rewardsFallback ??
            (pipelineTotal === 0 ? (
              <p className="text-sm opacity-60">No vouchers yet.</p>
            ) : (
              <>
                <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-base-200" aria-hidden>
                  {summary!.pipeline.map(
                    (stage) =>
                      stage.count > 0 && (
                        <span
                          key={stage.label}
                          className={stage.tone}
                          style={{ width: `${(stage.count / pipelineTotal) * 100}%` }}
                        />
                      ),
                  )}
                </div>
                <dl className="flex flex-col gap-2 text-sm">
                  {summary!.pipeline
                    .filter((stage) => stage.label !== 'Publishing' || stage.count > 0)
                    .map((stage) => (
                      <div key={stage.label} className="flex items-center gap-2">
                        <span className={cn('size-2 rounded-full', stage.tone)} aria-hidden />
                        <dt className="flex-1 opacity-70">{stage.label}</dt>
                        <dd className="font-medium tabular-nums">{fmtNumber(stage.count)}</dd>
                      </div>
                    ))}
                </dl>
              </>
            ))}
        </Card>
      ),
    },
    {
      id: 'closing',
      title: 'Closing soon',
      ...sizing(BUSINESS_PARTS.closing),
      node: (
        <Card title="Closing soon">
          {rewardsFallback ??
            (summary!.closingSoon.length ? (
              <ul className="flex flex-col gap-3">
                {summary!.closingSoon.slice(0, 4).map((reward) => (
                  <li key={reward.id}>
                    <RewardLine
                      reward={reward}
                      detail={`Closes ${formatDistanceToNow(new Date(reward.expiresAt!), { addSuffix: true })}`}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm opacity-60">No live vouchers close in the next 7 days.</p>
            ))}
        </Card>
      ),
    },
  ];
  const layout = useDashboardLayout('business', parts);
  const [arranging, setArranging] = useState(false);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What needs attention in your loyalty program, and how your members and vouchers are doing."
        actions={
          <ArrangeControls arranging={arranging} onArrangingChange={setArranging} layout={layout} />
        }
      />

      <div className="flex flex-col gap-4">
        {/* Always first: it only shows when something needs someone. */}
        <AttentionCard items={attention} />
        <ArrangeableParts parts={parts} layout={layout} arranging={arranging} />
      </div>
    </>
  );
}
