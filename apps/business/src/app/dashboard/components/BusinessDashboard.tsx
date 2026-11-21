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
import { useRewards } from '@/app/rewards/hooks/useRewards';
import { cn } from '@/utils/cn';
import { fmtNumber } from '@/utils/format';
import {
  budgetAttention,
  rewardAttention,
  summarizeRewards,
  type AttentionItem,
} from '../domain/insights';
import { isNoProgram, useIssuanceBudget } from '../hooks/useDashboardData';
import { AttentionCard } from './AttentionCard';
import { MemberInsights } from './MemberInsights';

const URGENCY: AttentionItem['tone'][] = ['error', 'warning', 'info'];

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
function RewardLine({ reward, detail }: { reward: Reward; detail: string }) {
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
    </div>
  );
}

/** What needs attention in the loyalty program, and how its rewards are doing. */
export function BusinessDashboard() {
  const { owner, slug } = useOrganization();
  const rewards = useRewards();
  const budget = useIssuanceBudget();
  const rewardsPath = organizationPath(slug, 'rewards');
  const summary = rewards.data ? summarizeRewards(rewards.data) : undefined;
  const budgetItem = budgetAttention(budget.data);
  const attention: AttentionItem[] = [
    ...(budgetItem ? [budgetItem] : []),
    ...(summary ? rewardAttention(summary, owner) : []),
  ].sort((a, b) => URGENCY.indexOf(a.tone) - URGENCY.indexOf(b.tone));
  const pipelineTotal = rewards.data?.length ?? 0;
  const allRewards = (
    <Link className="link text-sm font-normal" to={rewardsPath}>
      All rewards
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What needs attention in your loyalty program, and how your members and rewards are doing."
      />

      <div className="flex flex-col gap-4">
        <AttentionCard items={attention} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <BudgetCard />
          <StatCard
            label="Live rewards"
            icon={Lightning}
            value={summary ? fmtNumber(summary.stages.live) : <Skeleton className="h-8 w-16" />}
            hint={summary && `${fmtNumber(summary.stages.scheduled)} scheduled`}
          />
          <StatCard
            label="Vouchers claimed"
            icon={Ticket}
            value={summary ? fmtNumber(summary.claimed) : <Skeleton className="h-8 w-16" />}
            hint="Across all rewards"
          />
          <StatCard
            label="Drafts"
            icon={NotePencil}
            value={summary ? fmtNumber(summary.drafts) : <Skeleton className="h-8 w-16" />}
            hint={summary && `${fmtNumber(summary.stages.pending_approval)} awaiting approval`}
          />
        </div>

        <MemberInsights />

        {rewards.error ? (
          <ErrorState error={rewards.error} onRetry={() => void rewards.refetch()} />
        ) : !summary ? (
          <div className="grid gap-4 xl:grid-cols-5" aria-busy>
            <Skeleton className="h-72 xl:col-span-3" />
            <Skeleton className="h-72 xl:col-span-2" />
          </div>
        ) : pipelineTotal === 0 ? (
          <Card>
            <EmptyState
              icon={Ticket}
              title="No rewards yet"
              description="Create your first reward so members have something to spend their points on."
              action={
                <Link className="btn btn-primary btn-sm" to={rewardsPath}>
                  Go to Rewards
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3" title="Top rewards" actions={allRewards}>
              {summary.top.length ? (
                <ol className="flex flex-col gap-4">
                  {summary.top.map((reward) => (
                    <li key={reward.id} className="flex flex-col gap-2">
                      <RewardLine
                        reward={reward}
                        detail={
                          reward.totalSupply == null
                            ? `${fmtNumber(reward.claimedCount)} claimed`
                            : `${fmtNumber(reward.claimedCount)} of ${fmtNumber(reward.totalSupply)} claimed`
                        }
                      />
                      {reward.totalSupply != null && (
                        <UsageBar
                          value={reward.claimedCount}
                          max={reward.totalSupply}
                          className="w-full"
                        />
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-6 text-center text-sm opacity-60">
                  No vouchers claimed yet. Your most claimed rewards will show here.
                </p>
              )}
            </Card>

            <div className="flex flex-col gap-4 xl:col-span-2">
              <Card title="Reward pipeline">
                <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-base-200" aria-hidden>
                  {summary.pipeline.map(
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
                  {summary.pipeline
                    .filter((stage) => stage.label !== 'Publishing' || stage.count > 0)
                    .map((stage) => (
                      <div key={stage.label} className="flex items-center gap-2">
                        <span className={cn('size-2 rounded-full', stage.tone)} aria-hidden />
                        <dt className="flex-1 opacity-70">{stage.label}</dt>
                        <dd className="font-medium tabular-nums">{fmtNumber(stage.count)}</dd>
                      </div>
                    ))}
                </dl>
              </Card>

              <Card title="Closing soon">
                {summary.closingSoon.length ? (
                  <ul className="flex flex-col gap-3">
                    {summary.closingSoon.slice(0, 4).map((reward) => (
                      <li key={reward.id}>
                        <RewardLine
                          reward={reward}
                          detail={`Closes ${formatDistanceToNow(new Date(reward.expiresAt!), { addSuffix: true })}`}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm opacity-60">No live rewards close in the next 7 days.</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
