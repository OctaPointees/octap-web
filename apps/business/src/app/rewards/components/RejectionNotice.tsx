import { XCircle } from 'phosphor-react';
import { fmtDate } from '@/utils/format';
import type { Reward } from '../domain/draft';
import { stageOf } from '../domain/stage';

/**
 * The person's own rewards the Owner rejected, at the top of the list, so they find them without
 * hunting through Drafts. Each opens its panel, where the reason is.
 */
export function RejectedBanner({
  rewards,
  onOpen,
}: {
  rewards: Reward[];
  onOpen: (reward: Reward) => void;
}) {
  if (!rewards.length) return null;
  return (
    <section
      aria-label="Your rejected vouchers"
      className="mb-4 overflow-hidden rounded-box border border-error/30 bg-error/5"
    >
      <header className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-error">
        <XCircle size={18} weight="fill" aria-hidden />
        {rewards.length === 1
          ? 'The Owner rejected one of your vouchers'
          : `The Owner rejected ${rewards.length} of your vouchers`}
      </header>
      <ul className="divide-y divide-error/15 border-t border-error/15">
        {rewards.map((reward) => (
          <li key={reward.id} className="flex items-center gap-3 px-5 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{reward.title}</span>
              <span className="block truncate text-sm opacity-70">
                {reward.approval?.reason
                  ? `Reason: ${reward.approval.reason}`
                  : 'No reason was given.'}
              </span>
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline btn-error shrink-0"
              onClick={() => onOpen(reward)}
            >
              Fix it
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Why the Owner sent a reward back, shown at the top of its panel until it is submitted again.
 * Shows nothing for any other reward.
 */
export function RejectionNotice({ reward }: { reward: Reward | undefined }) {
  if (!reward || stageOf(reward) !== 'rejected') return null;
  const { reason, reviewedAt } = reward.approval ?? {};
  return (
    <div role="note" className="alert alert-error alert-soft mt-4 items-start text-sm">
      <XCircle size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          The Owner rejected this voucher{reviewedAt ? ` on ${fmtDate(reviewedAt)}` : ''}
        </p>
        <p>{reason ? `Reason: ${reason}` : 'No reason was given.'}</p>
        <p className="opacity-75">Change what is needed, save it, then submit it again.</p>
      </div>
    </div>
  );
}
