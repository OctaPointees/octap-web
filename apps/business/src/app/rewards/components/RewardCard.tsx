import { UsageBar } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import {
  describeBenefit,
  describePoints,
  describeSupply,
  describeValidity,
} from '../domain/describe';
import { fromReward, type Reward } from '../domain/draft';
import { KINDS } from '../domain/kinds';
import { STAGES, stageOf, type RewardPermissions } from '../domain/stage';
import { primaryIntent, type RewardIntent } from './intents';
import { RewardActions, RewardPrimaryAction } from './RewardActions';

/** One reward in the card view: what it gives, its price, how much is left, and what's next. */
export function RewardCard({
  reward,
  permissions,
  busy,
  onIntent,
}: {
  reward: Reward;
  permissions: RewardPermissions;
  busy: boolean;
  onIntent: (intent: RewardIntent, reward: Reward) => void;
}) {
  const draft = fromReward(reward);
  const { icon: KindIcon, label: kindLabel } = KINDS[draft.kind];
  const stage = stageOf(reward);
  const open = () => onIntent(permissions.edit ? 'edit' : 'view', reward);

  return (
    <article className="relative flex h-full flex-col gap-4 rounded-box border border-base-300 bg-base-100 p-5 transition-[border-color,box-shadow] hover:border-base-content/25 hover:shadow-sm has-[button[data-open]:focus-visible]:outline-2 has-[button[data-open]:focus-visible]:outline-primary">
      {/* Behind the content: the whole card opens the reward. */}
      <button
        type="button"
        data-open
        aria-label={`Open ${reward.title}`}
        onClick={open}
        className="absolute inset-0 cursor-pointer rounded-box outline-none"
      />

      <header className="pointer-events-none relative flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-field bg-primary/10 text-primary"
          title={kindLabel}
        >
          <KindIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold" title={reward.title}>
            {reward.title}
          </h3>
          <p className="truncate font-mono text-xs opacity-55">{reward.code}</p>
        </div>
        <span className={cn('badge badge-soft badge-sm shrink-0', STAGES[stage].tone)}>
          {stage === 'publishing' && <span className="loading loading-spinner loading-xs" />}
          {STAGES[stage].label}
        </span>
        <span className="pointer-events-auto -mt-1 -mr-2">
          <RewardActions reward={reward} permissions={permissions} onIntent={onIntent} />
        </span>
      </header>

      <div className="pointer-events-none relative flex flex-1 flex-col gap-1">
        <p className="text-sm">{describeBenefit(draft)}</p>
        <p className="text-xs opacity-60">{describeValidity(draft)}</p>
      </div>

      <div className="pointer-events-none relative flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold tabular-nums">{describePoints(reward.pointsCost)}</span>
          <span className="text-xs opacity-60">{describeSupply(reward)}</span>
        </div>
        {reward.totalSupply != null && (
          <UsageBar value={reward.claimedCount} max={reward.totalSupply} />
        )}
      </div>

      {primaryIntent(permissions) && (
        <footer className="pointer-events-none relative flex justify-end">
          <span className="pointer-events-auto">
            <RewardPrimaryAction
              reward={reward}
              permissions={permissions}
              busy={busy}
              onIntent={onIntent}
            />
          </span>
        </footer>
      )}
    </article>
  );
}
